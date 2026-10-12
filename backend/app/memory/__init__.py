"""Per-user semantic observations in a Chroma collection separate from RAG knowledge."""

from __future__ import annotations

from datetime import datetime, timezone
from threading import RLock
from typing import Any
from uuid import uuid4

from app.config import settings
from app.rag import RagUnavailable, rag_service


class MemoryService:
    """Vector memory whose every read and mutation is scoped to one database user id."""

    def __init__(self, *, collection=None, embedder=None):
        self._collection = collection
        self._embedder = embedder
        self._lock = RLock()

    def _ensure_ready(self):
        with self._lock:
            try:
                if settings.rag_memory_collection_name == settings.rag_collection_name:
                    raise ValueError("Memory and shared knowledge must use distinct Chroma collections")
                if self._collection is None or self._embedder is None:
                    client, shared_embedder = rag_service.embedding_resources()
                    self._embedder = self._embedder or shared_embedder
                    if self._collection is None:
                        self._collection = client.get_or_create_collection(
                            name=settings.rag_memory_collection_name,
                            metadata={"hnsw:space": "cosine"},
                        )
            except Exception as exc:
                if isinstance(exc, RagUnavailable):
                    raise
                raise RagUnavailable from exc

    def _encode(self, text: str, *, query: bool) -> list[float]:
        try:
            method = getattr(self._embedder, "encode_query" if query else "encode_document", None)
            vector = method(text, normalize_embeddings=True) if method else self._embedder.encode(text, normalize_embeddings=True)
            if hasattr(vector, "tolist"):
                vector = vector.tolist()
            if vector and isinstance(vector[0], list):
                vector = vector[0]
            if not vector:
                raise ValueError("Empty embedding")
            return [float(value) for value in vector]
        except Exception as exc:
            raise RagUnavailable from exc

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _scope(user_id: int) -> dict[str, Any]:
        return {"$and": [{"kind": {"$eq": "memory"}}, {"user_id": {"$eq": user_id}}]}

    @staticmethod
    def _record(item_id: str, content: str, metadata: dict[str, Any], relevance: float | None = None):
        result = {
            "id": item_id,
            "category": metadata["category"],
            "topic": metadata.get("topic", ""),
            "content": content,
            "created_at": metadata["created_at"],
        }
        if relevance is not None:
            result["relevance"] = relevance
        return result

    def add(self, user_id: int, *, category: str, topic: str, content: str) -> dict[str, Any]:
        self._ensure_ready()
        item_id, now = f"mem-{uuid4().hex}", self._now()
        metadata = {
            "kind": "memory", "user_id": int(user_id), "category": category,
            "topic": topic, "created_at": now,
        }
        try:
            self._collection.add(
                ids=[item_id], documents=[content], metadatas=[metadata],
                embeddings=[self._encode(f"{category} {topic}\n{content}", query=False)],
            )
            return self._record(item_id, content, metadata)
        except Exception as exc:
            raise RagUnavailable from exc

    def list(self, user_id: int, *, limit: int = 100) -> list[dict[str, Any]]:
        self._ensure_ready()
        try:
            result = self._collection.get(
                where=self._scope(user_id), include=["documents", "metadatas"], limit=limit,
            )
            items = [
                self._record(item_id, content, metadata)
                for item_id, content, metadata in zip(
                    result.get("ids") or [], result.get("documents") or [], result.get("metadatas") or []
                )
            ]
            return sorted(items, key=lambda item: item["created_at"], reverse=True)
        except Exception as exc:
            raise RagUnavailable from exc

    def search(self, user_id: int, query: str, *, limit: int = 5) -> list[dict[str, Any]]:
        if not query.strip():
            return []
        self._ensure_ready()
        try:
            count = self._collection.count()
            if not count:
                return []
            result = self._collection.query(
                query_embeddings=[self._encode(query.strip(), query=True)],
                n_results=min(limit, count), where=self._scope(user_id),
                include=["documents", "metadatas", "distances"],
            )
            ids = (result.get("ids") or [[]])[0]
            docs = (result.get("documents") or [[]])[0]
            metas = (result.get("metadatas") or [[]])[0]
            distances = (result.get("distances") or [[]])[0]
            return [
                self._record(item_id, content, metadata, max(0.0, min(1.0, 1.0 - float(distance))))
                for item_id, content, metadata, distance in zip(ids, docs, metas, distances)
            ]
        except Exception as exc:
            raise RagUnavailable from exc

    def delete(self, user_id: int, item_id: str) -> bool:
        self._ensure_ready()
        try:
            result = self._collection.get(ids=[item_id], where=self._scope(user_id), include=["metadatas"])
            if not result.get("ids"):
                return False
            self._collection.delete(ids=result["ids"])
            return True
        except Exception as exc:
            raise RagUnavailable from exc


memory_service = MemoryService()
