"""Admin-only CRUD and health endpoints for the shared RAG knowledge base."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.api.deps import get_current_admin_user
from app.models.user import User
from app.rag import RagUnavailable, rag_service
from app.schemas.rag import KnowledgeCreate, KnowledgeOut, KnowledgeStatus, KnowledgeUpdate

router = APIRouter(prefix="/api/rag", tags=["rag"])


def _call_rag(operation):
    try:
        return operation()
    except RagUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The knowledge retrieval service is unavailable. Check the RAG model and Chroma configuration.",
        ) from exc


@router.get("/status", response_model=KnowledgeStatus)
def get_rag_status(_admin: User = Depends(get_current_admin_user)) -> KnowledgeStatus:
    return _call_rag(rag_service.status)


@router.get("/knowledge", response_model=list[KnowledgeOut])
def list_knowledge(
    domain: str | None = Query(default=None, min_length=1, max_length=80),
    limit: int = Query(default=500, ge=1, le=1000),
    _admin: User = Depends(get_current_admin_user),
) -> list[KnowledgeOut]:
    entries = _call_rag(lambda: rag_service.list_entries(domain=domain, limit=limit))
    return [KnowledgeOut.model_validate(entry) for entry in entries]


@router.post("/knowledge", response_model=KnowledgeOut, status_code=status.HTTP_201_CREATED)
def create_knowledge(
    payload: KnowledgeCreate, _admin: User = Depends(get_current_admin_user)
) -> KnowledgeOut:
    entry = _call_rag(lambda: rag_service.add_entry(payload.model_dump()))
    return KnowledgeOut.model_validate(entry)


@router.put("/knowledge/{entry_id}", response_model=KnowledgeOut)
def update_knowledge(
    entry_id: str,
    payload: KnowledgeUpdate,
    _admin: User = Depends(get_current_admin_user),
) -> KnowledgeOut:
    entry = _call_rag(lambda: rag_service.update_entry(entry_id, payload.model_dump(exclude_unset=True)))
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge entry not found.")
    return KnowledgeOut.model_validate(entry)


@router.delete("/knowledge/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_knowledge(entry_id: str, _admin: User = Depends(get_current_admin_user)) -> Response:
    deleted = _call_rag(lambda: rag_service.delete_entry(entry_id))
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge entry not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
