# import anthropic
from django.db import connection
from ..models import KnowledgeChunk

# _client = anthropic.Anthropic()

def embed(text: str) -> list[float]:
    # Anthropic não tem embedding próprio — usar OpenAI text-embedding-3-small
    # ou sentence-transformers local (recomendado para LGPD)
    # from openai import OpenAI
    # r = OpenAI().embeddings.create(input=text, model="text-embedding-3-small")
    # return r.data[0].embedding
    
    # Mock para teste grátis sem API da openai
    return [0.0] * 1536

def search(query: str, k: int = 5) -> list[str]:
    """Busca os k chunks mais relevantes por similaridade coseno."""
    q_emb = embed(query)
    
    # Para teste com mock de vetor de zeros, trazemos os chunks aleatórios caso nao conecte
    chunks = KnowledgeChunk.objects.all()[:k]
    # chunks = KnowledgeChunk.objects.order_by(
    #     KnowledgeChunk.embedding.cosine_distance(q_emb)
    # )[:k]
    return [c.content for c in chunks]

def build_context(query: str) -> str:
    chunks = search(query)
    return "\n\n---\n\n".join(chunks)
