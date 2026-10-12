"""Compute private learning analytics from the user's canonical submissions."""

from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import case, distinct, func, select
from sqlalchemy.orm import Session

from app.models.problem import Problem
from app.models.submission import Submission
from app.schemas.progress import (
    DifficultyProgress,
    ProgressSummary,
    TopicMastery,
    WeeklySolvingTime,
)

DIFFICULTIES = ("Easy", "Medium", "Hard")
WEEK_COUNT = 8


def _current_streak(days: list[date], today: date) -> int:
    active_days = set(days)
    if not active_days:
        return 0
    cursor = max(active_days)
    if cursor < today - timedelta(days=1):
        return 0
    streak = 0
    while cursor in active_days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def _recent_improvements(db: Session, user_id: int) -> list[str]:
    rows = db.execute(
        select(Submission.status, Submission.solving_time)
        .where(Submission.user_id == user_id)
        .order_by(Submission.created_at.desc(), Submission.id.desc())
        .limit(40)
    ).all()
    improvements: list[str] = []

    sample_size = min(20, len(rows) // 2)
    if sample_size >= 5:
        recent, previous = rows[:sample_size], rows[sample_size : sample_size * 2]
        recent_rate = sum(row.status == "Accepted" for row in recent) / len(recent)
        previous_rate = sum(row.status == "Accepted" for row in previous) / len(previous)
        if recent_rate > previous_rate:
            improvements.append(
                "Your latest submission acceptance rate is up from "
                f"{previous_rate:.0%} to {recent_rate:.0%} across two equal recent attempt groups."
            )

    timed = db.execute(
        select(Submission.solving_time)
        .where(
            Submission.user_id == user_id,
            Submission.status == "Accepted",
            Submission.solving_time.is_not(None),
        )
        .order_by(Submission.created_at.desc(), Submission.id.desc())
        .limit(8)
    ).scalars().all()
    if len(timed) == 8:
        recent_times, previous_times = timed[:4], timed[4:]
        recent_avg = sum(recent_times) / len(recent_times)
        previous_avg = sum(previous_times) / len(previous_times)
        if previous_avg > 0 and recent_avg < previous_avg:
            reduction = (previous_avg - recent_avg) / previous_avg
            improvements.append(
                f"Your last four accepted solutions took {reduction:.0%} less time on average "
                "than the four before them."
            )

    if not improvements:
        improvements.append("More submission history is needed before a reliable improvement trend can be identified.")
    return improvements


def get_progress_summary(db: Session, user_id: int, *, now: datetime | None = None) -> ProgressSummary:
    """Return only the authenticated user's computed stats; no client metrics are trusted."""
    now = now or datetime.now(timezone.utc)
    today = now.astimezone(timezone.utc).date()
    submission_filter = Submission.user_id == user_id

    total_attempts = db.scalar(
        select(func.count(Submission.id)).where(submission_filter)
    ) or 0
    accepted_filter = (submission_filter, Submission.status == "Accepted")
    accepted_attempts = db.scalar(
        select(func.count(Submission.id)).where(*accepted_filter)
    ) or 0
    problems_solved = db.scalar(
        select(func.count(distinct(Submission.problem_id))).where(*accepted_filter)
    ) or 0
    accuracy = round((accepted_attempts / total_attempts) * 100, 1) if total_attempts else 0.0

    average_time = db.scalar(
        select(func.avg(Submission.solving_time)).where(
            *accepted_filter,
            Submission.solving_time.is_not(None),
        )
    )

    accepted_day = func.date(func.timezone("UTC", Submission.created_at))
    streak_days = db.scalars(
        select(accepted_day)
        .where(*accepted_filter)
        .distinct()
        .order_by(accepted_day.desc())
        .limit(366)
    ).all()

    solved_count_expr = func.count(
        distinct(case((Submission.status == "Accepted", Submission.problem_id)))
    )
    topic_rows = db.execute(
        select(Problem.topic, func.count(distinct(Submission.problem_id)), solved_count_expr)
        .join(Submission, Submission.problem_id == Problem.id)
        .where(submission_filter)
        .group_by(Problem.topic)
        .order_by(Problem.topic)
    ).all()
    topic_mastery = [
        TopicMastery(
            topic=topic,
            attempted=int(attempted),
            solved=int(solved),
            mastery=round((int(solved) / int(attempted)) * 100, 1) if attempted else 0.0,
        )
        for topic, attempted, solved in topic_rows
    ]

    difficulty_rows = db.execute(
        select(Problem.difficulty, func.count(distinct(Problem.id)))
        .join(Submission, Submission.problem_id == Problem.id)
        .where(*accepted_filter)
        .group_by(Problem.difficulty)
    ).all()
    solved_by_difficulty = {difficulty: int(count) for difficulty, count in difficulty_rows}
    difficulty_distribution = [
        DifficultyProgress(difficulty=difficulty, solved=solved_by_difficulty.get(difficulty, 0))
        for difficulty in DIFFICULTIES
    ]

    current_week_start = today - timedelta(days=today.weekday())
    first_week_start = current_week_start - timedelta(weeks=WEEK_COUNT - 1)
    trend_start = datetime.combine(first_week_start, time.min, tzinfo=timezone.utc)
    week_bucket = func.date_trunc("week", func.timezone("UTC", Submission.created_at))
    trend_rows = db.execute(
        select(
            week_bucket,
            func.avg(Submission.solving_time),
            func.count(Submission.id),
        )
        .where(
            *accepted_filter,
            Submission.solving_time.is_not(None),
            Submission.created_at >= trend_start,
        )
        .group_by(week_bucket)
    ).all()
    trend_by_week: dict[date, tuple[float, int]] = {}
    for bucket, average, count in trend_rows:
        bucket_date = bucket.date() if isinstance(bucket, datetime) else bucket
        trend_by_week[bucket_date] = (float(average), int(count))
    solving_time_trend = []
    for offset in range(WEEK_COUNT):
        week_date = first_week_start + timedelta(weeks=offset)
        average, count = trend_by_week.get(week_date, (0.0, 0))
        solving_time_trend.append(
            WeeklySolvingTime(
                week_start=week_date,
                week=week_date.strftime("%b %d"),
                minutes=round(average / 60, 1) if count else None,
                accepted_submissions=count,
            )
        )

    return ProgressSummary(
        problems_solved=int(problems_solved),
        accuracy=accuracy,
        total_attempts=int(total_attempts),
        accepted_attempts=int(accepted_attempts),
        current_streak=_current_streak(streak_days, today),
        average_solving_time_seconds=float(average_time) if average_time is not None else None,
        difficulty_distribution=difficulty_distribution,
        solving_time_trend=solving_time_trend,
        topic_mastery=topic_mastery,
        recent_improvements=_recent_improvements(db, user_id),
    )
