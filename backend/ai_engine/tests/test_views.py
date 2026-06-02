import uuid
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from api.models import User
from ai_engine.models import ChatMessage
from unittest.mock import patch


class TestAIEngineViews(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', email='test@example.com', role='employee')
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        self.chat_url = reverse('ai_chat')
        self.clear_url = reverse('ai_clear_history')

    def test_chat_unauthenticated(self):
        self.client.force_authenticate(user=None)
        res = self.client.post(self.chat_url, {'message': 'Hello'})
        self.assertEqual(res.status_code, 401)

    def test_chat_empty_message(self):
        res = self.client.post(self.chat_url, {'message': ''})
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data['error'], 'Mensagem vazia.')

        res2 = self.client.post(self.chat_url, {'message': '   '})
        self.assertEqual(res2.status_code, 400)

    @patch('ai_engine.views.ChatService')
    def test_chat_streaming_success(self, mock_chat_service_class):
        mock_service = mock_chat_service_class.return_value
        mock_service.stream_response.return_value = ["Hello", " ", "World"]

        session_id = str(uuid.uuid4())
        payload = {
            'message': 'Test query',
            'session_id': session_id
        }
        res = self.client.post(self.chat_url, payload)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'text/event-stream')

        content_parts = [chunk.decode('utf-8') for chunk in res.streaming_content]
        full_stream = "".join(content_parts)

        expected_stream = (
            'data: {"chunk": "Hello"}\n\n'
            'data: {"chunk": " "}\n\n'
            'data: {"chunk": "World"}\n\n'
            'data: [DONE]\n\n'
        )
        self.assertEqual(full_stream, expected_stream)
        mock_chat_service_class.assert_called_once_with(user=self.user, session_id=session_id)
        mock_service.stream_response.assert_called_once_with('Test query')

    def test_clear_history_unauthenticated(self):
        self.client.force_authenticate(user=None)
        res = self.client.delete(self.clear_url)
        self.assertEqual(res.status_code, 401)

    def test_clear_history_success(self):
        other_user = User.objects.create_user(username='otheruser', email='other@example.com')

        ChatMessage.objects.create(user=self.user, role='user', content='Hello user')
        ChatMessage.objects.create(user=other_user, role='user', content='Hello other')

        self.assertEqual(ChatMessage.objects.filter(user=self.user).count(), 1)
        self.assertEqual(ChatMessage.objects.filter(user=other_user).count(), 1)

        res = self.client.delete(self.clear_url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['message'], 'Histórico apagado.')

        self.assertEqual(ChatMessage.objects.filter(user=self.user).count(), 0)
        self.assertEqual(ChatMessage.objects.filter(user=other_user).count(), 1)
