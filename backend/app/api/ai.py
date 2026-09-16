"""
app/api/ai.py

Route contracts only. Every one of these needs Groq (Phase 22) — chat
also needs real RAG (Phase 23) to be more than a keyword match. The
frontend's aiService.js/agentService.js already have complete, tested
mock logic (Phases 10-15) that a real student can use today; copying
that mock text into this backend would just be a second place for the
same placeholder content to drift out of sync with the first. Better
to leave these honestly unimplemented until the real model is wired
in, and let the frontend keep serving its already-verified mocks until
then (see each service's `USE_MOCK` flag).
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.ai import (
    ChatRequest,
    ChatResponse,
    DebugRequest,
    DebugResponse,
    HintRequest,
    HintResponse,
    ReviewRequest,
    ReviewResponse,
)

router = APIRouter(prefix="/api/ai", tags=["ai"])

_NOT_IMPLEMENTED = "Requires Groq (Phase 22) to be connected — not implemented yet."


@router.post("/review", response_model=ReviewResponse)
def review_submission(payload: ReviewRequest, _user: User = Depends(get_current_user)) -> ReviewResponse:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=_NOT_IMPLEMENTED)


@router.post("/hint", response_model=HintResponse)
def get_hint(payload: HintRequest, _user: User = Depends(get_current_user)) -> HintResponse:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=_NOT_IMPLEMENTED)


@router.post("/debug", response_model=DebugResponse)
def debug_error(payload: DebugRequest, _user: User = Depends(get_current_user)) -> DebugResponse:
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail=_NOT_IMPLEMENTED)


@router.post("/chat", response_model=ChatResponse)
def chat_with_mentor(payload: ChatRequest, _user: User = Depends(get_current_user)) -> ChatResponse:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Requires Groq (Phase 22) and real RAG (Phase 23) to be connected — not implemented yet.",
    )
