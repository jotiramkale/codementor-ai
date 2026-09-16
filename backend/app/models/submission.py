"""
app/models/submission.py

Matches the original spec's `submissions` table exactly. `solving_time`
is the real backing field for what the frontend's Phase 9 timer
computes client-side today (elapsed seconds since opening a problem,
lost on refresh) — once this table is live, that becomes persisted
instead of resetting every time.
"""

from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Submission(Base):
    __tablename__ = "submissions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"))
    code: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(20))
    # 'Accepted' | 'Wrong Answer' | 'Runtime Error' — the exact status
    # strings the frontend's mock submissionService.js already uses, so
    # the real API slots in without the frontend changing what it
    # checks for.
    status: Mapped[str] = mapped_column(String(30))
    runtime: Mapped[float | None] = mapped_column(Float, nullable=True)  # milliseconds
    memory: Mapped[float | None] = mapped_column(Float, nullable=True)  # MB
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    solving_time: Mapped[int | None] = mapped_column(Integer, nullable=True)  # seconds
    attempt_number: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user: Mapped["User"] = relationship(back_populates="submissions")
    problem: Mapped["Problem"] = relationship(back_populates="submissions")
    ai_review: Mapped["AIReview | None"] = relationship(back_populates="submission", uselist=False)
