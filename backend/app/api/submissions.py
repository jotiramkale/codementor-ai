"""
app/api/submissions.py

Route contracts only — real logic is deliberately NOT written here.
Run/Submit need the Docker sandbox execution engine (Phase 21), which
doesn't exist yet. Duplicating the frontend's random mock pass/fail
logic here would just create a second fake judge that could disagree
with the first one, which is worse than admitting neither is real.
These endpoints exist with the right path/method/schema so the
frontend contract is settled now; Phase 21 fills in the body.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.submission import RunRequest, RunResult, SubmissionResult, SubmitRequest

router = APIRouter(prefix="/api/submissions", tags=["submissions"])

_NOT_IMPLEMENTED = "Real code execution requires the Docker sandbox from Phase 21, which does not exist yet."


@router.post("/run", response_model=RunResult)
def run_sample(payload: RunRequest, _user: User = Depends(get_current_user)) -> RunResult:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=_NOT_IMPLEMENTED)


@router.post("/submit", response_model=SubmissionResult)
def submit_solution(payload: SubmitRequest, _user: User = Depends(get_current_user)) -> SubmissionResult:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=_NOT_IMPLEMENTED)
