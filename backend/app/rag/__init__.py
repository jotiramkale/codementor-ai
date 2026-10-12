"""Persistent ChromaDB retrieval using local Sentence Transformers embeddings."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from threading import RLock
from typing import Any
from uuid import uuid4

from app.config import settings
from app.rag.seed import SEED_KNOWLEDGE

_SEED_MARKER = "__codementor_seed_v1__"


class RagUnavailable(Exception):
    """ChromaDB or the configured embedding model is not ready."""


class RagService:
    """Local persistent vector store and its retrieval/admin operations.

    Client, collection, and model are lazy-loaded so unrelated API routes
    can start even when the optional RAG dependencies or model are missing.
    Dependencies are injectable for deterministic offline tests.
    """

    def __init__(self, *, client=None, collection=None, embedder=None):
        self._client = client
        self._collection = collection
        self._embedder = embedder
        self._lock = RLock()
        self._initialized = False

    def _ensure_ready(self) -> None:
        with self._lock:
            if self._collection is None or self._embedder is None:
                try:
                    if self._client is None:
                        import chromadb

                        persist_dir = Path(settings.chroma_persist_dir)
                        persist_dir.mkdir(parents=True, exist_ok=True)
                        self._client = chromadb.PersistentClient(path=str(persist_dir))
                    if self._collection is None:
                        self._collection = self._client.get_or_create_collection(
                            name=settings.rag_collection_name,
                            metadata={"hnsw:space": "cosine"},
                        )
                    if self._embedder is None:
                        from sentence_transformers import SentenceTransformer

                        self._embedder = SentenceTransformer(settings.rag_embedding_model, device="cpu")
                except Exception as exc:
                    raise RagUnavailable from exc
            if not self._initialized:
                self._seed_if_needed()
                self._initialized = True

    def _encode(self, text: str, *, query: bool) -> list[float]:
        try:
            if query and hasattr(self._embedder, "encode_query"):
                vector = self._embedder.encode_query(text, normalize_embeddings=True)
            elif not query and hasattr(self._embedder, "encode_document"):
                vector = self._embedder.encode_document(text, normalize_embeddings=True)
            else:
                vector = self._embedder.encode(text, normalize_embeddings=True)
            if hasattr(vector, "tolist"):
                vector = vector.tolist()
            if vector and isinstance(vector[0], list):
                vector = vector[0]
            if not vector or not all(isinstance(value, (int, float)) for value in vector):
                raise ValueError("Embedding model returned an invalid vector")
            return [float(value) for value in vector]
        except Exception as exc:
            raise RagUnavailable from exc

    def embedding_resources(self):
        """Return the process-wide Chroma client and embedder for isolated collections."""
        self._ensure_ready()
        return self._client, self._embedder

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _split_content(content: str) -> list[str]:
        """Split longer sources into bounded word-preserving embedding chunks."""
        max_chars = settings.rag_chunk_chars
        chunks: list[str] = []
        current: list[str] = []
        size = 0
        for word in content.split():
            pieces = [word[index : index + max_chars] for index in range(0, len(word), max_chars)]
            for piece in pieces:
                added = len(piece) + (1 if current else 0)
                if current and size + added > max_chars:
                    chunks.append(" ".join(current))
                    current = []
                    size = 0
                current.append(piece)
                size += len(piece) + (1 if len(current) > 1 else 0)
        if current:
            chunks.append(" ".join(current))
        return chunks or [content.strip()]

    def _metadata(self, entry: dict[str, Any], chunk_index: int, *, created_at: str | None = None) -> dict[str, Any]:
        return {
            "kind": "knowledge",
            "entry_id": entry["id"],
            "chunk_index": chunk_index,
            "domain": entry["domain"],
            "title": entry["title"],
            "source": entry["source"],
            "created_at": created_at or entry.get("created_at") or self._now(),
            "updated_at": entry.get("updated_at") or self._now(),
        }

    def _upsert_entry(self, entry: dict[str, Any], *, created_at: str | None = None) -> None:
        chunks = self._split_content(entry["content"])
        chunk_ids = [f"{entry['id']}::chunk:{index:04d}" for index in range(len(chunks))]
        prior = self._collection.get(
            where={"entry_id": {"$eq": entry["id"]}},
            include=["metadatas"],
        )
        prior_ids = prior.get("ids") or []
        self._collection.upsert(
            ids=chunk_ids,
            documents=chunks,
            metadatas=[self._metadata(entry, index, created_at=created_at) for index in range(len(chunks))],
            embeddings=[
                self._encode(f"{entry['title']}\n{entry['domain']}\n{chunk}", query=False)
                for chunk in chunks
            ],
        )
        stale_ids = [item_id for item_id in prior_ids if item_id not in chunk_ids]
        if stale_ids:
            self._collection.delete(ids=stale_ids)

    def _seed_if_needed(self) -> None:
        try:
            marker = self._collection.get(ids=[_SEED_MARKER], include=["metadatas"])
            if marker.get("ids"):
                return
            existing = self._collection.get(where={"kind": "knowledge"}, limit=1, include=["metadatas"])
            if not existing.get("ids"):
                now = self._now()
                for entry in SEED_KNOWLEDGE:
                    self._upsert_entry(entry, created_at=now)
            marker_text = "Internal Chroma initialization marker; not a knowledge source."
            self._collection.upsert(
                ids=[_SEED_MARKER],
                documents=[marker_text],
                metadatas=[{"kind": "system", "seed_version": "1"}],
                embeddings=[self._encode(marker_text, query=False)],
            )
        except Exception as exc:
            if isinstance(exc, RagUnavailable):
                raise
            raise RagUnavailable from exc

    @staticmethod
    def _entries(record: dict[str, Any]) -> list[dict[str, str]]:
        groups: dict[str, list[tuple[int, str, dict[str, Any]]]] = {}
        ids = record.get("ids") or []
        documents = record.get("documents") or []
        metadatas = record.get("metadatas") or []
        for index, item_id in enumerate(ids):
            metadata = metadatas[index] or {}
            entry_id = metadata.get("entry_id", item_id)
            chunk_index = int(metadata.get("chunk_index", 0))
            document = documents[index] if index < len(documents) else ""
            groups.setdefault(entry_id, []).append((chunk_index, document, metadata))

        entries = []
        for entry_id, chunks in groups.items():
            chunks.sort(key=lambda chunk: chunk[0])
            metadata = chunks[0][2]
            entries.append(
                {
                    "id": entry_id,
                    "domain": metadata.get("domain", ""),
                    "title": metadata.get("title", ""),
                    "content": " ".join(chunk[1] for chunk in chunks),
                    "source": metadata.get("source", ""),
                    "created_at": metadata.get("created_at", ""),
                    "updated_at": metadata.get("updated_at", ""),
                }
            )
        return entries

    def list_entries(self, *, domain: str | None = None, limit: int = 500) -> list[dict[str, str]]:
        self._ensure_ready()
        where: dict[str, Any] = {"kind": "knowledge"}
        if domain:
            where = {"$and": [{"kind": {"$eq": "knowledge"}}, {"domain": {"$eq": domain}}]}
        try:
            result = self._collection.get(where=where, include=["documents", "metadatas"])
            entries = self._entries(result)
            entries.sort(key=lambda item: (item["domain"].casefold(), item["title"].casefold()))
            return entries[:limit]
        except Exception as exc:
            raise RagUnavailable from exc

    def _get_entry(self, entry_id: str) -> dict[str, str] | None:
        try:
            result = self._collection.get(
                where={"$and": [{"entry_id": {"$eq": entry_id}}, {"kind": {"$eq": "knowledge"}}]},
                include=["documents", "metadatas"],
            )
            entries = self._entries(result)
            return entries[0] if entries else None
        except Exception as exc:
            raise RagUnavailable from exc

    def add_entry(self, entry: dict[str, str]) -> dict[str, str]:
        self._ensure_ready()
        now = self._now()
        record = {**entry, "id": f"kb-{uuid4().hex}", "created_at": now, "updated_at": now}
        try:
            self._upsert_entry(record, created_at=now)
            return record
        except Exception as exc:
            raise RagUnavailable from exc

    def update_entry(self, entry_id: str, updates: dict[str, str]) -> dict[str, str] | None:
        self._ensure_ready()
        current = self._get_entry(entry_id)
        if current is None:
            return None
        updated = {**current, **updates, "updated_at": self._now()}
        try:
            self._upsert_entry(updated, created_at=current["created_at"])
            return updated
        except Exception as exc:
            raise RagUnavailable from exc

    def delete_entry(self, entry_id: str) -> bool:
        self._ensure_ready()
        if self._get_entry(entry_id) is None:
            return False
        try:
            chunks = self._collection.get(
                where={"entry_id": {"$eq": entry_id}},
                include=["metadatas"],
            )
            self._collection.delete(ids=chunks.get("ids") or [])
            return True
        except Exception as exc:
            raise RagUnavailable from exc

    def retrieve(self, query: str, *, limit: int | None = None) -> list[dict[str, Any]]:
        if not query or not query.strip():
            return []
        self._ensure_ready()
        try:
            chunk_count = max(0, int(self._collection.count()) - 1)  # Exclude seed marker.
            if chunk_count == 0:
                return []
            requested = max(1, min(limit or settings.rag_top_k, settings.rag_top_k))
            result_count = min(requested * 3, chunk_count)
            result = self._collection.query(
                query_embeddings=[self._encode(query.strip(), query=True)],
                n_results=result_count,
                where={"kind": "knowledge"},
                include=["documents", "metadatas", "distances"],
            )
            chunks: list[dict[str, Any]] = []
            seen_entries: set[str] = set()
            context_chars = 0
            ids = (result.get("ids") or [[]])[0]
            docs = (result.get("documents") or [[]])[0]
            metadatas = (result.get("metadatas") or [[]])[0]
            distances = (result.get("distances") or [[]])[0]
            for item_id, document, metadata, distance in zip(ids, docs, metadatas, distances):
                similarity = max(0.0, min(1.0, 1.0 - float(distance)))
                if similarity < settings.rag_min_similarity:
                    continue
                entry_id = metadata.get("entry_id", item_id)
                if entry_id in seen_entries:
                    continue
                if len(chunks) >= requested:
                    break
                remaining = settings.rag_max_context_chars - context_chars
                if remaining <= 0:
                    break
                content = document[:remaining]
                context_chars += len(content)
                seen_entries.add(entry_id)
                chunks.append(
                    {
                        "id": item_id,
                        "domain": metadata.get("domain", ""),
                        "title": metadata.get("title", ""),
                        "content": content,
                        "source": metadata.get("source", ""),
                        "relevance": similarity,
                    }
                )
            return chunks
        except Exception as exc:
            if isinstance(exc, RagUnavailable):
                raise
            raise RagUnavailable from exc

    def status(self) -> dict[str, Any]:
        self._ensure_ready()
        try:
            record = self._collection.get(where={"kind": "knowledge"}, include=["metadatas"])
            entry_ids = {metadata.get("entry_id") for metadata in record.get("metadatas") or []}
            return {
                "status": "ready",
                "collection": settings.rag_collection_name,
                "embedding_model": settings.rag_embedding_model,
                "documents": len(entry_ids),
            }
        except Exception as exc:
            raise RagUnavailable from exc


rag_service = RagService()
