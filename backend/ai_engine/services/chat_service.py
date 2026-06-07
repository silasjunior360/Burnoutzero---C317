import uuid
from .llm_client import stream
from .rag_service import build_context
from ..models import ChatMessage
from ..prompts.employee_chat_prompt import EMPLOYEE_PROMPT
from ..prompts.psychologist_prompt import PSYCHOLOGIST_PROMPT
from ..prompts.manager_prompt import MANAGER_PROMPT

SYSTEM_BY_ROLE = {
    'employee': EMPLOYEE_PROMPT,
    'psychologist': PSYCHOLOGIST_PROMPT,
    'manager': MANAGER_PROMPT,
}

class ChatService:
    def __init__(self, user, session_id=None):
        self.user = user
        self.session_id = session_id or uuid.UUID(int=0)

    def _get_history(self) -> list[dict]:
        msgs = ChatMessage.objects.filter(
            user=self.user,
            session_id=self.session_id,
        ).order_by('created_at')[:20]
        return [{"role": m.role, "content": m.content} for m in msgs]

    def _save(self, role: str, content: str):
        ChatMessage.objects.create(
            user=self.user,
            role=role,
            content=content,
            session_id=self.session_id,
        )

    def stream_response(self, message: str):
        build_context(message)
        system = SYSTEM_BY_ROLE.get(self.user.role, SYSTEM_BY_ROLE['employee'])
        history = self._get_history()
        messages = history + [{"role": "user", "content": message}]
        self._save('user', message)
        full_response = ""
        for chunk in stream(messages, system=system):
            full_response += chunk
            yield chunk
        self._save('assistant', full_response)