"""
app/api/problems.py

Real, complete CRUD — the read side has no dependency on anything
unbuilt; the write side (create/update/delete) is admin-gated, mirroring
Phase 18's frontend Admin page exactly (that page's problemStore.js
CRUD becomes this once connected). Per-user attempts/best_time/solved
come from UserProblemStats, joined per request — never stored on the
problem row itself, so two students never share one "solved" status.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user, get_current_user
from app.db.session import get_db
from app.models.problem import Problem
from app.models.test_case import TestCase
from app.models.user import User
from app.models.user_problem_stats import UserProblemStats
from app.schemas.problem import ProblemCreate, ProblemOut, ProblemUpdate

router = APIRouter(prefix="/api/problems", tags=["problems"])


def _to_problem_out(problem: Problem, stats: UserProblemStats | None) -> ProblemOut:
    return ProblemOut(
        id=problem.id,
        title=problem.title,
        difficulty=problem.difficulty,
        topic=problem.topic,
        estimated_time=problem.estimated_time,
        description=problem.description,
        expected_input=problem.expected_input,
        expected_output=problem.expected_output,
        examples=problem.examples or [],
        constraints=problem.constraints or [],
        hints=problem.hints or [],
        starter_code=problem.starter_code or {},
        ai_recommended=problem.ai_recommended,
        attempts=stats.attempts if stats else 0,
        best_time_seconds=stats.best_time_seconds if stats else None,
        solved=stats.solved if stats else False,
    )


@router.get("", response_model=list[ProblemOut])
def list_problems(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[ProblemOut]:
    problems = db.query(Problem).all()
    stats_by_problem = {
        s.problem_id: s
        for s in db.query(UserProblemStats).filter(UserProblemStats.user_id == current_user.id).all()
    }
    return [_to_problem_out(p, stats_by_problem.get(p.id)) for p in problems]


@router.get("/{problem_id}", response_model=ProblemOut)
def get_problem(
    problem_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> ProblemOut:
    problem = db.get(Problem, problem_id)
    if problem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found.")

    stats = (
        db.query(UserProblemStats)
        .filter(UserProblemStats.user_id == current_user.id, UserProblemStats.problem_id == problem_id)
        .first()
    )
    return _to_problem_out(problem, stats)


@router.post("", response_model=ProblemOut, status_code=status.HTTP_201_CREATED)
def create_problem(
    payload: ProblemCreate, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin_user)
) -> ProblemOut:
    problem = Problem(
        title=payload.title,
        difficulty=payload.difficulty,
        topic=payload.topic,
        estimated_time=payload.estimated_time,
        description=payload.description,
        expected_input=payload.expected_input,
        expected_output=payload.expected_output,
        examples=[e.model_dump() for e in payload.examples],
        constraints=payload.constraints,
        hints=payload.hints,
        starter_code=payload.starter_code,
    )
    db.add(problem)
    db.flush()  # assigns problem.id before we attach test cases to it

    for tc in payload.test_cases:
        db.add(TestCase(problem_id=problem.id, input=tc.input, expected_output=tc.expected_output, hidden=tc.hidden))

    db.commit()
    db.refresh(problem)
    return _to_problem_out(problem, stats=None)


@router.put("/{problem_id}", response_model=ProblemOut)
def update_problem(
    problem_id: int,
    payload: ProblemUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(get_current_admin_user),
) -> ProblemOut:
    problem = db.get(Problem, problem_id)
    if problem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found.")

    for field, value in payload.model_dump(exclude={"test_cases", "examples"}).items():
        setattr(problem, field, value)
    problem.examples = [e.model_dump() if hasattr(e, "model_dump") else e for e in payload.examples]

    db.commit()
    db.refresh(problem)
    return _to_problem_out(problem, stats=None)


@router.delete("/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_problem(
    problem_id: int, db: Session = Depends(get_db), _admin: User = Depends(get_current_admin_user)
) -> None:
    problem = db.get(Problem, problem_id)
    if problem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found.")
    db.delete(problem)
    db.commit()
