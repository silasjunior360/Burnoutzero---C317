import sys
from unittest.mock import MagicMock

celery_mock = MagicMock()
celery_mock.shared_task = lambda func: func
sys.modules['celery'] = celery_mock

from django.test import TestCase
from ai_engine.tasks.indexing_tasks import reindex_knowledge_chunk_task
from ai_engine.tasks.insight_tasks import process_insight_task


class TestCeleryTasks(TestCase):
    def test_reindex_knowledge_chunk_task(self):
        res = reindex_knowledge_chunk_task()
        self.assertIsNone(res)

    def test_process_insight_task(self):
        res = process_insight_task(1, 2)
        self.assertIsNone(res)
