"""Private user memory API. User identity always comes from the bearer token."""

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from app.api.deps import get_current_user
from app.memory import memory_service
from app.models.user import User
from app.rag import RagUnavailable
from app.schemas.memory import MemoryCreate, MemoryOut, MemorySearchRequest

router = APIRouter(prefix="/api/memory", tags=["memory"])


def _call(operation):
    try:
        return operation()
    except RagUnavailable as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The user memory service is unavailable. Check the Chroma and embedding model configuration.",
        ) from exc


@router.get("", response_model=list[MemoryOut])
def list_memory(
    limit: int = Query(default=100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
) -> list[MemoryOut]:
    return [MemoryOut.model_validate(item) for item in _call(lambda: memory_service.list(current_user.id, limit=limit))]


@router.post("", response_model=MemoryOut, status_code=status.HTTP_201_CREATED)
def add_memory(payload: MemoryCreate, current_user: User = Depends(get_current_user)) -> MemoryOut:
    item = _call(lambda: memory_service.add(current_user.id, **payload.model_dump()))
    return MemoryOut.model_validate(item)


@router.post("/search", response_model=list[MemoryOut])
def search_memory(payload: MemorySearchRequest, current_user: User = Depends(get_current_user)) -> list[MemoryOut]:
    items = _call(lambda: memory_service.search(current_user.id, payload.query, limit=payload.limit))
    return [MemoryOut.model_validate(item) for item in items]


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_memory(memory_id: str, current_user: User = Depends(get_current_user)) -> Response:
    deleted = _call(lambda: memory_service.delete(current_user.id, memory_id))
    if not deleted:
        # A foreign user's id is indistinguishable from a missing id.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Memory entry not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
