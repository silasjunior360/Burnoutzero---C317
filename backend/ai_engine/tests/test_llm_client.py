from django.test import TestCase
from unittest.mock import patch, MagicMock
from ai_engine.services.llm_client import complete, stream


class TestLLMClient(TestCase):
    @patch('ai_engine.services.llm_client._client')
    def test_complete(self, mock_client):
        mock_response = MagicMock()
        mock_choice = MagicMock()
        mock_choice.message.content = "Mocked Response Content"
        mock_response.choices = [mock_choice]
        mock_client.chat.completions.create.return_value = mock_response

        messages = [{"role": "user", "content": "Hello"}]
        system = "You are a helpful assistant."
        res = complete(messages, system)

        self.assertEqual(res, "Mocked Response Content")
        mock_client.chat.completions.create.assert_called_once_with(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": "Hello"}
            ],
            max_tokens=1024,
        )

    @patch('ai_engine.services.llm_client._client')
    def test_stream(self, mock_client):
        chunk1 = MagicMock()
        chunk1.choices = [MagicMock()]
        chunk1.choices[0].delta.content = "Hello "

        chunk2 = MagicMock()
        chunk2.choices = [MagicMock()]
        chunk2.choices[0].delta.content = "World"

        chunk3 = MagicMock()
        chunk3.choices = [MagicMock()]
        chunk3.choices[0].delta.content = None

        mock_client.chat.completions.create.return_value = [chunk1, chunk2, chunk3]

        messages = [{"role": "user", "content": "Hi"}]
        system = "System prompt"
        generator = stream(messages, system)

        chunks = list(generator)

        self.assertEqual(chunks, ["Hello ", "World"])
        mock_client.chat.completions.create.assert_called_once_with(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "System prompt"},
                {"role": "user", "content": "Hi"}
            ],
            max_tokens=1024,
            stream=True
        )
