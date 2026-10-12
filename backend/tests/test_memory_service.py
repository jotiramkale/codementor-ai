import unittest

from app.memory import MemoryService
from tests.test_rag_service import FakeCollection, FakeEmbedder


class AddableCollection(FakeCollection):
    def add(self, ids, documents, metadatas, embeddings):
        if any(item_id in self.records for item_id in ids):
            raise ValueError("duplicate id")
        self.upsert(ids, documents, metadatas, embeddings)


class MemoryServiceTests(unittest.TestCase):
    def setUp(self):
        self.collection = AddableCollection()
        self.service = MemoryService(collection=self.collection, embedder=FakeEmbedder())

    def test_memory_search_is_scoped_to_the_authenticated_user(self):
        first = self.service.add(11, category="weakness", topic="hash maps", content="Needs practice with hash maps")
        self.service.add(22, category="strength", topic="hash maps", content="Uses hash maps confidently")

        first_results = self.service.search(11, "hash maps")
        second_results = self.service.search(22, "hash maps")

        self.assertEqual([item["id"] for item in first_results], [first["id"]])
        self.assertEqual(second_results[0]["content"], "Uses hash maps confidently")
        self.assertEqual({item["metadata"]["user_id"] for item in self.collection.records.values()}, {11, 22})

    def test_list_and_delete_cannot_read_or_remove_another_users_memory(self):
        owned = self.service.add(11, category="preference", topic="hints", content="Prefers concise hints")
        foreign = self.service.add(22, category="observation", topic="arrays", content="Practices arrays often")

        self.assertEqual([item["id"] for item in self.service.list(11)], [owned["id"]])
        self.assertFalse(self.service.delete(11, foreign["id"]))
        self.assertTrue(self.service.delete(11, owned["id"]))
        self.assertEqual([item["id"] for item in self.service.list(22)], [foreign["id"]])

    def test_every_operation_uses_the_dedicated_memory_kind_filter(self):
        item = self.service.add(11, category="pattern", topic="loops", content="Often misses loop boundaries")
        self.service.list(11)
        self.service.search(11, "loop boundaries")
        self.service.delete(11, item["id"])
        # Shared knowledge entries in this collection are excluded even if vectors match.
        self.collection.upsert(
            ids=["knowledge-id"], documents=["Often misses loop boundaries"],
            metadatas=[{"kind": "knowledge", "user_id": 11, "category": "pattern", "topic": "loops", "created_at": "now"}],
            embeddings=[[0.0, 0.0, 1.0]],
        )
        self.assertEqual(self.service.search(11, "loop boundaries"), [])


if __name__ == "__main__":
    unittest.main()
