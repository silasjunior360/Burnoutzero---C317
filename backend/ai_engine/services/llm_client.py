from groq import Groq
from django.conf import settings

_client = Groq(api_key=settings.GROQ_API_KEY)

def complete(messages: list[dict], system: str, max_tokens: int = 1024) -> str:
    """Chamada síncrona ao Groq."""
    messages_with_system = [{"role": "system", "content": system}] + messages
    resp = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages_with_system,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content

def stream(messages: list[dict], system: str):
    """Gerador para SSE streaming com Groq."""
    messages_with_system = [{"role": "system", "content": system}] + messages
    stream_resp = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages_with_system,
        max_tokens=1024,
        stream=True,
    )
    for chunk in stream_resp:
        if chunk.choices[0].delta.content is not None:
            yield chunk.choices[0].delta.content