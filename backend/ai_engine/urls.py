from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chat, name='ai_chat'),
    path('chat/history/', views.clear_history, name='ai_clear_history'),
]