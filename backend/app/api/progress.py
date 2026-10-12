"""Authenticated progress analytics computed from persisted submissions."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.progress import ProgressRecommendations, ProgressSummary
from app.services.groq_service import (
    GroqCredentialRejected,
    GroqNotConfigured,
    GroqRequestFailed,
    groq_service,
)
from app.services.progress_service import get_progress_summary

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/me", response_model=ProgressSummary)
def read_my_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProgressSummary:
    return get_progress_summary(db, current_user.id)


@router.post("/recommendations", response_model=ProgressRecommendations)
def recommend_my_next_steps(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProgressRecommendations:
    progress = get_progress_summary(db, current_user.id)
    db.close()  # Release the database connection before waiting on the AI provider.
    try:
        result = groq_service.progress_recommendations(progress.model_dump(mode="json"))
    except GroqNotConfigured as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI recommendations are unavailable. Set GROQ_API_KEY on the backend.",
        ) from exc
    except GroqCredentialRejected as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Groq rejected the configured API key. Replace GROQ_API_KEY in backend/.env and restart FastAPI.",
        ) from exc
    except GroqRequestFailed as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The AI provider did not return usable progress recommendations. Please retry.",
        ) from exc
    return result
