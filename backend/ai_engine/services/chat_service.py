import uuid

from .llm_client import stream
from .rag_service import build_context
from ..models import ChatMessage


SYSTEM_BY_ROLE = {
    'employee': """
Você é um assistente de saúde mental ocupacional empático e acolhedor.
Ajude o funcionário com técnicas de autocuidado, gestão de estresse e bem-estar.
Nunca diagnostique. Responda sempre em português do Brasil.
""",
    'psychologist': """
Você é um assistente clínico para psicólogos ocupacionais.
Use linguagem técnica, sugira intervenções baseadas em evidências.
Responda sempre em português do Brasil.
""",
    'manager': """
Você é um consultor de gestão humanizada e saúde organizacional.
Forneça insights sobre tendências de equipe e ações preventivas.
Nunca exponha dados individuais de funcionários.
Responda sempre em português do Brasil.
""",
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
