from django.db import models
from django.conf import settings
import uuid


class KnowledgeChunk(models.Model):
    source_file = models.CharField(max_length=255)
    chunk_index = models.IntegerField()
    content     = models.TextField()
    created_at  = models.DateTimeField(auto_now_add=True)


class ChatMessage(models.Model):
    ROLE_CHOICES = [('user', 'User'), ('assistant', 'Assistant')]

    user       = models.ForeignKey(settings.AUTH_USER_MODEL,
                                   on_delete=models.CASCADE,
                                   related_name='chat_messages')
    role       = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content    = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    session_id = models.UUIDField(default=uuid.uuid4)

    class Meta:
        ordering = ['created_at']