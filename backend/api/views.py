from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Avg
from django.utils import timezone
from .models import User, Assessment, FollowUp, Appointment, Insight, GamificationPoints

from .serializers import (
    UserSerializer, UserCreateSerializer,
    AssessmentSerializer, FollowUpSerializer,
    AppointmentSerializer
)


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


class AssessmentViewSet(viewsets.ModelViewSet):
    serializer_class = AssessmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'employee':
            return Assessment.objects.filter(employee=user)
        elif user.role == 'manager':
            employees = User.objects.filter(
                department=user.department
            )
            return Assessment.objects.filter(
                employee__in=employees
            )
        else:
            return Assessment.objects.all()

    def perform_create(self, serializer):
        data = serializer.validated_data
        total = (
            data.get('stress', 0)
            + data.get('anxiety', 0)
            + data.get('burnout', 0)
            + data.get('depression', 0)
        )

        if total >= 50:
            risk = 'high'
        elif total >= 20:
            risk = 'medium'
        else:
            risk = 'low'

        assessment = serializer.save(
            employee=self.request.user, risk_level=risk
        )

        _generate_insight(self.request.user, assessment)


class FollowUpViewSet(viewsets.ModelViewSet):
    serializer_class = FollowUpSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'psychologist':
            return FollowUp.objects.filter(psychologist=user)
        elif user.role == 'employee':
            return FollowUp.objects.filter(
                employee=user
            )
        return FollowUp.objects.none()

    def perform_create(self, serializer):
        serializer.save(psychologist=self.request.user)


class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'employee':
            return Appointment.objects.filter(employee=user)
        return Appointment.objects.none()

    def perform_create(self, serializer):
        serializer.save(employee=self.request.user)


# ── Geração automática de insight por regra ───────────────────────────────────

def _generate_insight(employee, assessment):
    lines = []
    recs = []

    if assessment.risk_level == 'high':
        lines.append("Nível de risco elevado identificado na sua avaliação.")
        recs.append("Recomendamos buscar apoio com um psicólogo o quanto antes.")
    elif assessment.risk_level == 'medium':
        lines.append("Sinais moderados de esgotamento detectados.")
        recs.append("Pratique pausas regulares e converse com alguém de confiança.")
    else:
        lines.append("Seus indicadores estão dentro da faixa esperada.")
        recs.append("Continue mantendo seus hábitos saudáveis!")

    if assessment.stress > 15:
        lines.append("Estresse acima do esperado.")
        recs.append("Considere atividades de descompressão como exercícios leves.")

    Insight.objects.create(
        employee=employee,
        assessment=assessment,
        text=" ".join(lines),
        recommendations=" ".join(recs),
    )
    GamificationPoints.objects.create(
        employee=employee,
        points=10,
        reason='assessment_complete',
    )


# ── Insights ─────────────────────────────────────────────────────────────


class InsightViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'employee':
            return Insight.objects.filter(employee=user)
        elif user.role == 'psychologist':
            return Insight.objects.filter(validated_by=None)
        return Insight.objects.all()

    def get_serializer_class(self):
        from rest_framework import serializers

        class InsightSerializer(serializers.ModelSerializer):
            class Meta:
                model = Insight
                fields = '__all__'
        return InsightSerializer


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def validate_insight(request, pk):
    if request.user.role != 'psychologist':
        return Response({'error': 'Acesso negado.'}, status=403)
    try:
        insight = Insight.objects.get(pk=pk)
    except Insight.DoesNotExist:
        return Response({'error': 'Insight não encontrado.'}, status=404)
    if 'text' in request.data:
        insight.text = request.data['text']
    if 'recommendations' in request.data:
        insight.recommendations = request.data['recommendations']
    insight.validated_by = request.user
    insight.validated_at = timezone.now()
    insight.save()
    return Response({'message': 'Insight validado.'})


# ── Dashboard Gestor ─────────────────────────────────────────────────────


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def team_overview(request):
    if request.user.role != 'manager':
        return Response({'error': 'Acesso negado.'}, status=403)
    employees = User.objects.filter(department=request.user.department)
    agg = Assessment.objects.filter(employee__in=employees).aggregate(
        avg_stress=Avg('stress'),
        avg_anxiety=Avg('anxiety'),
        avg_burnout=Avg('burnout'),
        avg_depression=Avg('depression'),
    )
    alerts = Assessment.objects.filter(
        employee__in=employees, risk_level='high'
    ).values('employee__username', 'assessment_date').order_by('-assessment_date')[:10]
    return Response({'averages': agg, 'recent_alerts': list(alerts)})


# ── Gamificação ──────────────────────────────────────────────────────────


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_points(request):
    points = GamificationPoints.objects.filter(employee=request.user)
    total = sum(p.points for p in points)
    history = list(points.values('points', 'reason', 'earned_at'))
    return Response({'total_points': total, 'history': history})
