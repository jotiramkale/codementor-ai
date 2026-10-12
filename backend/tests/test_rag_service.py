import unittest

from app.rag import RagService


class FakeEmbedder:
    def _vector(self, text):
        lowered = text.lower()
        if "hash" in lowered or "dictionary" in lowered:
            return [1.0, 0.0, 0.0]
        if "binary search" in lowered:
            return [0.0, 1.0, 0.0]
        return [0.0, 0.0, 1.0]

    def encode_document(self, text, normalize_embeddings=True):
        return self._vector(text)

    def encode_query(self, text, normalize_embeddings=True):
        return self._vector(text)


class FakeCollection:
    def __init__(self):
        self.records = {}

    @staticmethod
    def _matches(metadata, where):
        if not where:
            return True
        if "$and" in where:
            return all(FakeCollection._matches(metadata, condition) for condition in where["$and"])
        return all(metadata.get(key) == (value.get("$eq") if isinstance(value, dict) else value) for key, value in where.items())

    def get(self, ids=None, where=None, limit=None, include=None):
        candidates = list(ids) if ids is not None else list(self.records)
        selected = [item_id for item_id in candidates if item_id in self.records and self._matches(self.records[item_id]["metadata"], where)]
        if limit is not None:
            selected = selected[:limit]
        records = [self.records[item_id] for item_id in selected]
        return {
            "ids": selected,
            "documents": [record["document"] for record in records] if include and "documents" in include else None,
            "metadatas": [record["metadata"] for record in records] if include and "metadatas" in include else None,
        }

    def upsert(self, ids, documents, metadatas, embeddings):
        for item_id, document, metadata, embedding in zip(ids, documents, metadatas, embeddings):
            self.records[item_id] = {
                "document": document,
                "metadata": metadata,
                "embedding": embedding,
            }

    def count(self):
        return len(self.records)

    def query(self, query_embeddings, n_results, where, include):
        query = query_embeddings[0]
        records = [
            (item_id, record)
            for item_id, record in self.records.items()
            if self._matches(record["metadata"], where)
        ]
        def distance(record):
            vector = record["embedding"]
            dot = sum(a * b for a, b in zip(query, vector))
            return 1.0 - dot
        records.sort(key=lambda pair: distance(pair[1]))
        records = records[:n_results]
        return {
            "ids": [[item_id for item_id, _ in records]],
            "documents": [[record["document"] for _, record in records]],
            "metadatas": [[record["metadata"] for _, record in records]],
            "distances": [[distance(record) for _, record in records]],
        }

    def delete(self, ids, where=None):
        for item_id in ids:
            if item_id in self.records and self._matches(self.records[item_id]["metadata"], where):
                del self.records[item_id]


class RagServiceTests(unittest.TestCase):
    def setUp(self):
        self.collection = FakeCollection()
        self.service = RagService(collection=self.collection, embedder=FakeEmbedder())

    def test_persistent_seed_is_semantically_retrieved_with_real_source_metadata(self):
        chunks = self.service.retrieve("How do I use a hash map dictionary?")

        self.assertTrue(chunks)
        self.assertEqual(chunks[0]["title"], "What a hash map buys you")
        self.assertEqual(chunks[0]["source"], "CodeMentor AI curated seed knowledge (demo entry)")
        self.assertGreaterEqual(chunks[0]["relevance"], 0.99)
        self.assertNotEqual(chunks[0]["id"], "__codementor_seed_v1__")
        self.assertEqual(self.service.status()["documents"], 10)

    def test_admin_crud_updates_the_vector_and_deletes_the_document(self):
        long_content = " ".join(["Hash maps store keys and values to support fast lookup."] * 100)
        created = self.service.add_entry(
            {
                "domain": "linked lists",
                "title": "Linked-list node basics",
                "content": long_content,
                "source": "Admin-authored lesson, reviewed 2026-10-04",
            }
        )
        indexed_chunks = [
            item_id for item_id, record in self.collection.records.items()
            if record["metadata"].get("entry_id") == created["id"]
        ]
        self.assertGreater(len(indexed_chunks), 1)
        updated = self.service.update_entry(created["id"], {"title": "Hashing in linked lists"})
        self.assertEqual(updated["title"], "Hashing in linked lists")
        self.assertEqual(updated["created_at"], created["created_at"])
        self.assertNotEqual(updated["updated_at"], "")
        self.assertTrue(any(item["id"] == created["id"] for item in self.service.list_entries()))
        self.service.update_entry(created["id"], {"content": "Hash maps support fast key lookup."})
        remaining_chunks = [
            item_id for item_id, record in self.collection.records.items()
            if record["metadata"].get("entry_id") == created["id"]
        ]
        self.assertEqual(len(remaining_chunks), 1)
        self.assertTrue(self.service.delete_entry(created["id"]))
        self.assertFalse(self.service.delete_entry(created["id"]))


if __name__ == "__main__":
    unittest.main()
