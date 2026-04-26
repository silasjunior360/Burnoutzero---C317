from rest_framework import generics, viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import User, Avaliacao, Acompanhamento, Agendamento
from .serializers import UserSerializer, UserCreateSerializer, AvaliacaoSerializer, AcompanhamentoSerializer, AgendamentoSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    authentication_classes = ()
    serializer_class = UserCreateSerializer

class UserDetailView(generics.RetrieveAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

class AvaliacaoViewSet(viewsets.ModelViewSet):
    serializer_class = AvaliacaoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'funcionario':
            return Avaliacao.objects.filter(funcionario=user)
        elif user.role == 'gestor':
            funcionarios = User.objects.filter(departamento=user.departamento)
            return Avaliacao.objects.filter(funcionario__in=funcionarios)
        else:
            return Avaliacao.objects.all()

    def perform_create(self, serializer):
        data = serializer.validated_data
        total = data.get('exaustao_emocional', 0) + data.get('despersonalizacao', 0) - data.get('realizacao_profissional', 0)
        
        if total > 50:
            risco = 'alto'
        elif total > 20:
            risco = 'medio'
        else:
            risco = 'baixo'
            
        serializer.save(funcionario=self.request.user, nivel_risco=risco)

class AcompanhamentoViewSet(viewsets.ModelViewSet):
    serializer_class = AcompanhamentoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'psicologo':
            return Acompanhamento.objects.filter(psicologo=user)
        elif user.role == 'funcionario':
            return Acompanhamento.objects.filter(funcionario=user)
        return Acompanhamento.objects.none()

    def perform_create(self, serializer):
        serializer.save(psicologo=self.request.user)

class AgendamentoViewSet(viewsets.ModelViewSet):
    serializer_class = AgendamentoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'funcionario':
            return Agendamento.objects.filter(funcionario=user)
        return Agendamento.objects.none()

    def perform_create(self, serializer):
        serializer.save(funcionario=self.request.user)
