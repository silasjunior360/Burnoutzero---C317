from django.test import TestCase
from ai_engine.models import KnowledgeChunk
from ai_engine.services.rag_service import embed, search, build_context


class TestRagService(TestCase):
    def test_embed(self):
        val = embed("hello world")
        self.assertEqual(len(val), 1536)
        self.assertEqual(val, [0.0] * 1536)

    def test_search_and_build_context(self):
        KnowledgeChunk.objects.create(source_file="f1.txt", chunk_index=1, content="Chunk Content 1")
        KnowledgeChunk.objects.create(source_file="f1.txt", chunk_index=2, content="Chunk Content 2")
        KnowledgeChunk.objects.create(source_file="f2.txt", chunk_index=1, content="Chunk Content 3")

        results = search("test query", k=2)
        self.assertEqual(len(results), 2)
        self.assertEqual(results[0], "Chunk Content 1")
        self.assertEqual(results[1], "Chunk Content 2")

        context = build_context("another query")
        self.assertEqual(context, "Chunk Content 1\n\n---\n\nChunk Content 2\n\n---\n\nChunk Content 3")
