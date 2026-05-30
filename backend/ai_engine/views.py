import json
from django.http import StreamingHttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .services.chat_service import ChatService


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chat(request):
    message    = request.data.get('message', '').strip()
    session_id = request.data.get('session_id')

    if not message:
        return Response({'error': 'Mensagem vazia.'}, status=400)

    service = ChatService(user=request.user, session_id=session_id)

    def event_stream():
        for chunk in service.stream_response(message):
            yield f"data: {json.dumps({'chunk': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingHttpResponse(event_stream(),
                                 content_type='text/event-stream')


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def clear_history(request):
    from .models import ChatMessage
    ChatMessage.objects.filter(user=request.user).delete()
    return Response({'message': 'Histórico apagado.'})