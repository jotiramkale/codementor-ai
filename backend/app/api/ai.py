"""Authenticated Groq-backed mentor operations (RAG arrives in Phase 23)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin_user, get_current_user
from app.db.session import get_db
from app.models.problem import Problem
from app.models.submission import Submission
from app.models.user import User
from app.memory import memory_service
from app.rag import RagUnavailable, rag_service
from app.schemas.ai import (
    ChatMessage,
    ChatRequest,
    ChatResponse,
    DebugRequest,
    DebugResponse,
    HintRequest,
    HintResponse,
    ProblemDraft,
    ProblemDraftRequest,
    ReviewRequest,
    ReviewResponse,
    SimpleReviewRequest,
    SimpleReviewResponse,
)
from app.services.groq_service import (
    GroqCredentialRejected,
    GroqNotConfigured,
    GroqProviderUnavailable,
    GroqRequestFailed,
    groq_service,
)
from app.config import settings

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.get("/health")
def groq_health(_admin: User = Depends(get_current_admin_user), check_provider: bool = False) -> dict:
    """Admin-only Groq configuration check; provider calls are opt-in."""
    configured = bool((settings.groq_api_key or "").strip())
    result = {"configured": configured, "model": settings.groq_model}
    if not configured:
        result.update(status="missing_key", message="Set GROQ_API_KEY in backend/.env or your deployment secrets.")
        return result
    if check_provider:
        try:
            groq_service.health_check()
        except GroqNotConfigured:
            result.update(status="missing_key", message="Set GROQ_API_KEY in backend/.env or your deployment secrets.")
        except GroqCredentialRejected:
            result.update(status="invalid_key", message="Groq rejected the key; rotate it and update the backend secret.")
        except GroqProviderUnavailable:
            result.update(status="provider_unavailable", message="Groq is rate-limiting or temporarily unavailable; retry shortly.")
        except GroqRequestFailed:
            result.update(status="provider_error", message="Groq could not complete the diagnostic request; check provider access and model.")
        else:
            result.update(status="connected", message="Groq diagnostic request succeeded.")
    else:
        result.update(status="configured", message="Key is present; pass check_provider=true to test connectivity.")
    return result


def _get_problem(db: Session, problem_id: int) -> Problem:
    problem = db.get(Problem, problem_id)
    if problem is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Problem not found.")
    return problem


def _problem_context(problem: Problem) -> dict:
    return {
        "title": problem.title,
        "description": problem.description,
        "difficulty": problem.difficulty,
        "topic": problem.topic,
        "constraints": problem.constraints or [],
        "examples": problem.examples or [],
        "stored_hints": problem.hints or [],
    }


def _verified_submission_status(
    db: Session, user_id: int, problem_id: int, code: str, language: str
) -> str | None:
    """Only exact, persisted submissions count; request.test_results is untrusted."""
    row = (
        db.query(Submission)
        .filter(
            Submission.user_id == user_id,
            Submission.problem_id == problem_id,
            Submission.code == code,
            Submission.language == language,
        )
        .order_by(Submission.created_at.desc(), Submission.id.desc())
        .first()
    )
    return row.status if row else None


def _call_groq(operation):
    try:
        return operation()
    except GroqNotConfigured as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI is not configured. Set GROQ_API_KEY on the backend.",
        ) from exc
    except GroqCredentialRejected as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Groq rejected the configured API key. Replace GROQ_API_KEY in backend/.env and restart FastAPI.",
        ) from exc
    except GroqProviderUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Groq is rate-limiting or temporarily unavailable. Retry shortly.",
        ) from exc
    except GroqRequestFailed as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI provider did not return a usable response. Please retry.",
        ) from exc


def _call_rag(operation):
    try:
        return operation()
    except RagUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The knowledge retrieval service is unavailable. Check the RAG model and Chroma configuration.",
        ) from exc


def _call_memory(operation):
    try:
        return operation()
    except RagUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The user memory service is unavailable. Check the Chroma and embedding model configuration.",
        ) from exc


@router.post("/review", response_model=ReviewResponse)
def review_submission(
    payload: ReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewResponse:
    problem = _get_problem(db, payload.problem_id)
    judge_status = _verified_submission_status(
        db, current_user.id, payload.problem_id, payload.code, payload.language
    )
    # Client-supplied `test_results` remains in the request shape for compatibility,
    # but is intentionally excluded: browser data is not proof of execution.
    return _call_groq(
        lambda: groq_service.review(_problem_context(problem), payload.code, payload.language, judge_status)
    )


@router.post("/review-code", response_model=SimpleReviewResponse)
def review_original_prototype(
    payload: SimpleReviewRequest, _user: User = Depends(get_current_user)
) -> SimpleReviewResponse:
    """Server-side Groq equivalent of the original statement + code review flow."""
    return _call_groq(
        lambda: groq_service.simple_review(payload.problem_statement, payload.code, payload.language)
    )


@router.post("/hint", response_model=HintResponse)
def get_hint(
    payload: HintRequest,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> HintResponse:
    problem = _get_problem(db, payload.problem_id)
    return _call_groq(lambda: groq_service.hint(_problem_context(problem), payload.hint_level))


@router.post("/debug", response_model=DebugResponse)
def debug_error(
    payload: DebugRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DebugResponse:
    problem = _get_problem(db, payload.problem_id)
    judge_status = _verified_submission_status(
        db, current_user.id, payload.problem_id, payload.code, payload.language
    )
    return _call_groq(
        lambda: groq_service.debug(_problem_context(problem), payload.code, payload.language, judge_status)
    )


@router.post("/chat", response_model=ChatResponse)
def chat_with_mentor(
    payload: ChatRequest, current_user: User = Depends(get_current_user)
) -> ChatResponse:
    # Fail deterministically on missing configuration before loading Chroma or embeddings.
    _call_groq(lambda: groq_service.ensure_configured())
    question = next(message.content for message in reversed(payload.messages) if message.role == "user")
    chunks = _call_rag(lambda: rag_service.retrieve(question))
    memories = _call_memory(lambda: memory_service.search(current_user.id, question, limit=3))
    memories = [item for item in memories if item["relevance"] >= 0.25]
    reply = _call_groq(lambda: groq_service.chat(payload.messages, chunks, memories))
    # RAG context is the exact persisted material passed to Groq. Agent
    # orchestration remains a separate phase, so trace intentionally stays null.
    return ChatResponse(
        reply=ChatMessage(role="assistant", content=reply),
        rag_context=chunks,
        user_memory_used=memories,
    )


@router.post("/problem-draft", response_model=ProblemDraft)
def generate_problem_draft(
    payload: ProblemDraftRequest, _admin: User = Depends(get_current_admin_user)
) -> ProblemDraft:
    """Generate an unverified draft only; an administrator must review it before publishing."""
    return _call_groq(
        lambda: groq_service.generate_problem_draft(payload.topic, payload.difficulty)
    )
