import uuid
from django.test import TestCase
from unittest.mock import patch
from api.models import User
from ai_engine.models import ChatMessage
from ai_engine.services.chat_service import ChatService, SYSTEM_BY_ROLE


class TestChatService(TestCase):
    def setUp(self):
        self.employee = User.objects.create_user(username='emp', email='emp@example.com', role='employee')
        self.manager = User.objects.create_user(username='mgr', email='mgr@example.com', role='manager')
        self.psychologist = User.objects.create_user(username='psy', email='psy@example.com', role='psychologist')
        self.session_id = uuid.uuid4()

    def test_init_defaults(self):
        service = ChatService(self.employee)
        self.assertEqual(service.user, self.employee)
        self.assertEqual(service.session_id, uuid.UUID(int=0))

    def test_get_history_limit_and_order(self):
        service = ChatService(self.employee, self.session_id)
        for i in range(25):
            ChatMessage.objects.create(
                user=self.employee,
                role='user' if i % 2 == 0 else 'assistant',
                content=f"msg {i}",
                session_id=self.session_id
            )

        history = service._get_history()
        self.assertEqual(len(history), 20)
        self.assertEqual(history[0]['content'], "msg 0")
        self.assertEqual(history[19]['content'], "msg 19")

    def test_save(self):
        service = ChatService(self.employee, self.session_id)
        service._save('user', 'Hello')
        msg = ChatMessage.objects.filter(user=self.employee, session_id=self.session_id).first()
        self.assertIsNotNone(msg)
        self.assertEqual(msg.role, 'user')
        self.assertEqual(msg.content, 'Hello')

    @patch('ai_engine.services.chat_service.build_context')
    @patch('ai_engine.services.chat_service.stream')
    def test_stream_response_employee(self, mock_stream, mock_build_context):
        mock_stream.return_value = ["I ", "am ", "fine."]
        service = ChatService(self.employee, self.session_id)

        generator = service.stream_response("How are you?")
        chunks = list(generator)

        self.assertEqual(chunks, ["I ", "am ", "fine."])
        mock_build_context.assert_called_once_with("How are you?")

        messages = ChatMessage.objects.filter(user=self.employee, session_id=self.session_id).order_by('created_at')
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[0].role, 'user')
        self.assertEqual(messages[0].content, 'How are you?')
        self.assertEqual(messages[1].role, 'assistant')
        self.assertEqual(messages[1].content, 'I am fine.')

        mock_stream.assert_called_once_with(
            [{"role": "user", "content": "How are you?"}],
            system=SYSTEM_BY_ROLE['employee']
        )

    @patch('ai_engine.services.chat_service.build_context')
    @patch('ai_engine.services.chat_service.stream')
    def test_stream_response_manager(self, mock_stream, mock_build_context):
        mock_stream.return_value = ["Hello manager"]
        service = ChatService(self.manager, self.session_id)
        list(service.stream_response("Hi"))
        mock_stream.assert_called_once_with(
            [{"role": "user", "content": "Hi"}],
            system=SYSTEM_BY_ROLE['manager']
        )

    @patch('ai_engine.services.chat_service.build_context')
    @patch('ai_engine.services.chat_service.stream')
    def test_stream_response_psychologist(self, mock_stream, mock_build_context):
        mock_stream.return_value = ["Hello doc"]
        service = ChatService(self.psychologist, self.session_id)
        list(service.stream_response("Hi"))
        mock_stream.assert_called_once_with(
            [{"role": "user", "content": "Hi"}],
            system=SYSTEM_BY_ROLE['psychologist']
        )
