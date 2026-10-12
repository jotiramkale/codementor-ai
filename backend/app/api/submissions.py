"""Objective Run and Submit endpoints backed by the Phase 21 Docker judge."""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.execution.docker_runner import ExecutionBackendError, ExecutionUnavailable
from app.execution.service import (
    ExecutionBusyError,
    ExecutionInputError,
    ExecutionService,
    TestCaseInput,
    execution_service,
)
from app.models.problem import Problem
from app.models.submission import Submission
from app.models.test_case import TestCase
from app.models.user import User
from app.models.user_problem_stats import UserProblemStats
from app.schemas.submission import (
    RunRequest,
    RunResult,
    SampleTestResult,
    SubmissionResult,
    SubmitRequest,
    SubmissionHistoryOut,
)

router = APIRouter(prefix="/api/submissions", tags=["submissions"])
logger = logging.getLogger(__name__)


@router.get("/history", response_model=list[SubmissionHistoryOut])
def submission_history(
    problem_id: int | None = Query(default=None, gt=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SubmissionHistoryOut]:
    query = db.query(Submission).filter(Submission.user_id == current_user.id)
    if problem_id is not None:
        query = query.filter(Submission.problem_id == problem_id)
    rows = query.order_by(Submission.created_at.desc(), Submission.id.desc()).limit(limit).all()
    return [
        SubmissionHistoryOut(
            id=row.id,
            problem_id=row.problem_id,
            status=row.status,
            language=row.language,
            runtime_ms=row.runtime,
            memory_mb=row.memory,
            solving_time=row.solving_time,
            attempt_number=row.attempt_number,
            created_at=row.created_at.isoformat(),
        )
        for row in rows
    ]


def _load_test_cases(db: Session, problem_id: int, *, public_only: bool) -> list[TestCase]:
    if db.get(Problem, problem_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found.")

    query = db.query(TestCase).filter(TestCase.problem_id == problem_id)
    if public_only:
        query = query.filter(TestCase.hidden.is_(False))
    return query.order_by(TestCase.id.asc()).all()


def _execution_cases(rows: list[TestCase]) -> list[TestCaseInput]:
    return [
        TestCaseInput(
            id=row.id,
            input=row.input,
            expected_output=row.expected_output,
            hidden=row.hidden,
        )
        for row in rows
    ]


def _run_execution(service: ExecutionService, payload, cases: list[TestCaseInput]):
    try:
        return service.execute(payload.code, payload.language, cases)
    except ExecutionBusyError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc)) from exc
    except ExecutionInputError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc
    except ExecutionUnavailable as exc:
        logger.warning("Execution unavailable exception=%s", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The code execution service is unavailable. Check the configured executor and runtime images.",
        ) from exc
    except ExecutionBackendError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The execution service failed to produce a valid result.",
        ) from exc


@router.post("/run", response_model=RunResult)
def run_sample(
    payload: RunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RunResult:
    # Run is explicitly limited to non-hidden test cases. The user-facing
    # response includes those cases and their actual output for debugging.
    rows = _load_test_cases(db, payload.problem_id, public_only=True)
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No public test cases are configured for this problem.",
        )
    cases = _execution_cases(rows)
    db.close()  # Never hold a database connection while Docker runs user code.
    outcome = _run_execution(execution_service, payload, cases)

    if outcome.status == "Accepted":
        api_status = "passed"
    elif outcome.status == "Wrong Answer":
        api_status = "failed"
    else:
        api_status = "error"

    test_results = []
    for index, result in enumerate(outcome.tests):
        case = cases[index]
        test_results.append(
            SampleTestResult(
                id=case.id,
                passed=bool(result.get("passed")),
                runtime_ms=result.get("runtime_ms"),
                input=case.input,
                expected_output=case.expected_output,
                actual_output=result.get("actual_output"),
            )
        )
    return RunResult(status=api_status, tests=test_results, error=outcome.error)


@router.post("/submit", response_model=SubmissionResult)
def submit_solution(
    payload: SubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SubmissionResult:
    # Unlike Run, Submit uses every enabled case. Hidden input, expected
    # output, per-case status and actual output stay on the server.
    rows = _load_test_cases(db, payload.problem_id, public_only=False)
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No test cases are configured for this problem.",
        )

    cases = _execution_cases(rows)
    user_id = current_user.id
    started_at = datetime.now(timezone.utc)
    db.close()  # Docker may run for several seconds; release the read session first.
    outcome = _run_execution(execution_service, payload, cases)
    submitted_at = datetime.now(timezone.utc)

    # Serialize the short persistence step for this user/problem pair so
    # concurrent submissions get distinct attempt numbers and cannot race
    # to create the same user_problem_stats row.
    db.execute(select(func.pg_advisory_xact_lock(user_id, payload.problem_id)))
    attempt_number = (
        db.query(func.count(Submission.id))
        .filter(
            Submission.user_id == user_id,
            Submission.problem_id == payload.problem_id,
        )
        .scalar()
        or 0
    ) + 1

    submission = Submission(
        user_id=user_id,
        problem_id=payload.problem_id,
        code=payload.code,
        language=payload.language,
        status=outcome.status,
        runtime=outcome.runtime_ms,
        memory=None,  # Docker enforces a hard cap; per-process usage is not measured yet.
        started_at=started_at,
        submitted_at=submitted_at,
        solving_time=payload.solving_time,
        attempt_number=attempt_number,
    )
    db.add(submission)

    stats = db.get(UserProblemStats, (user_id, payload.problem_id))
    accepted = outcome.status == "Accepted"
    if stats is None:
        stats = UserProblemStats(
            user_id=user_id,
            problem_id=payload.problem_id,
            attempts=1,
            solved=accepted,
            best_time_seconds=payload.solving_time if accepted else None,
        )
        db.add(stats)
    else:
        stats.attempts += 1
        stats.solved = stats.solved or accepted
        if accepted and payload.solving_time is not None:
            if stats.best_time_seconds is None or payload.solving_time < stats.best_time_seconds:
                stats.best_time_seconds = payload.solving_time

    db.commit()
    db.refresh(submission)

    # The response only gives aggregate results; hidden cases never leave
    # the server. Do not disclose the hidden case index or its contents.
    failure_detail = None if accepted else outcome.error or "One or more test cases failed."
    return SubmissionResult(
        id=submission.id,
        status=submission.status,
        passed_tests=outcome.passed_tests,
        total_tests=outcome.total_tests,
        runtime_ms=submission.runtime,
        memory_mb=None,
        failure_detail=failure_detail,
    )
