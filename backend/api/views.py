from rest_framework import generics, viewsets, status, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.db.models import Avg
from django.utils import timezone
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Assessment, FollowUp, Appointment, Insight, GamificationPoints, Sector

from .serializers import (
    UserSerializer, UserCreateSerializer,
    AssessmentSerializer, FollowUpSerializer,
    AppointmentSerializer, SectorSerializer
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    authentication_classes = ()
    serializer_class = UserCreateSerializer


class UserDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class UserPasswordChangeView(APIView):
    permission_classes = [IsAuthenticated]

    def _change_password(self, request):
        current_password = request.data.get('current_password') or request.data.get('currentPassword', '')
        new_password = request.data.get('new_password') or request.data.get('newPassword', '')
        confirm_password = request.data.get('confirm_password') or request.data.get('confirmPassword', '')

        if not current_password or not new_password or not confirm_password:
            return Response(
                {'error': 'Preencha a senha atual e a nova senha.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.check_password(current_password):
            return Response(
                {'error': 'A senha atual está incorreta.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password != confirm_password:
            return Response(
                {'error': 'A confirmação da nova senha não confere.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_password.isdigit():
            return Response(
                {'error': 'A nova senha não pode conter apenas números.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=request.user)
        except ValidationError as exc:
            return Response(
                {'error': exc.messages[0]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_password)
        request.user.save(update_fields=['password'])
        return Response(
            {'message': 'Senha alterada com sucesso.'},
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        return self._change_password(request)

    def patch(self, request):
        return self._change_password(request)


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
        psychologist_name = str(
            self.request.data.get('psychologist_name', '')
        ).strip()
        date_time = str(self.request.data.get('date_time', '')).strip()
        if Appointment.objects.filter(
            psychologist_name__iexact=psychologist_name,
            date_time=date_time,
            status='scheduled'
        ).exists():
            raise serializers.ValidationError(
                "Este horário já está reservado com este psicólogo."
            )
        serializer.save(employee=self.request.user)

    @action(detail=False, methods=['get'])
    def taken_slots(self, request):
        taken = (
            Appointment.objects.filter(status='scheduled')
            .values('psychologist_name', 'date_time')
        )
        return Response(taken)


def _latest_assessment_for(user):
    return Assessment.objects.filter(employee=user).order_by('-assessment_date').first()


def _assessment_total(assessment):
    return (
        assessment.stress
        + assessment.anxiety
        + assessment.burnout
        + assessment.depression
    )


def _assign_sector_name_for_user(user):
    assessment = _latest_assessment_for(user)
    if not assessment:
        return 'Estável'

    total = _assessment_total(assessment)
    if assessment.risk_level == 'high' or total >= 50:
        return 'Risco alto'
    if total >= 20:
        return 'Em observação'
    return 'Estável'


def _ensure_default_sectors_for_department(department):
    if Sector.objects.filter(department=department).exists():
        return

    sector_map = {
        'Estável': Sector.objects.create(department=department, name='Estável'),
        'Em observação': Sector.objects.create(department=department, name='Em observação'),
        'Risco alto': Sector.objects.create(department=department, name='Risco alto'),
    }

    employees = User.objects.filter(
        department=department,
        role__in=['employee', 'psychologist'],
    )
    for user in employees:
        sector_name = _assign_sector_name_for_user(user)
        sector_map[sector_name].members.add(user)


class SectorViewSet(viewsets.ModelViewSet):
    serializer_class = SectorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != 'manager' or not user.department:
            return Sector.objects.none()

        _ensure_default_sectors_for_department(user.department)
        return Sector.objects.filter(department=user.department).prefetch_related('members')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'manager':
            raise PermissionDenied('Acesso negado.')
        serializer.save(department=user.department)

    def perform_destroy(self, instance):
        if instance.department != self.request.user.department:
            raise PermissionDenied('Acesso negado.')
        instance.delete()

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        sector = self.get_object()
        username = request.data.get('username', '')

        if not username:
            return Response({'error': 'Informe o username.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            member = User.objects.get(
                username=username,
                department=request.user.department,
                role__in=['employee', 'psychologist'],
            )
        except User.DoesNotExist:
            return Response({'error': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        for other_sector in Sector.objects.filter(
            department=request.user.department,
            members=member,
        ).exclude(pk=sector.pk):
            other_sector.members.remove(member)

        sector.members.add(member)
        return Response(self.get_serializer(sector).data)

    @action(detail=True, methods=['post'])
    def remove_member(self, request, pk=None):
        sector = self.get_object()
        username = request.data.get('username', '')

        if not username:
            return Response({'error': 'Informe o username.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            member = User.objects.get(
                username=username,
                department=request.user.department,
                role__in=['employee', 'psychologist'],
            )
        except User.DoesNotExist:
            return Response({'error': 'Usuário não encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        sector.members.remove(member)
        return Response(self.get_serializer(sector).data)


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
    if not request.user.department:
        return Response({
            'averages': {
                'avg_stress': None,
                'avg_anxiety': None,
                'avg_burnout': None,
                'avg_depression': None,
            },
            'recent_alerts': [],
            'team_members': [],
            'total_team_members': 0,
        })
    company_users = User.objects.filter(
        department=request.user.department,
        role__in=['employee', 'psychologist']
    )
    employees = company_users.filter(role='employee')
    agg = Assessment.objects.filter(employee__in=employees).aggregate(
        avg_stress=Avg('stress'),
        avg_anxiety=Avg('anxiety'),
        avg_burnout=Avg('burnout'),
        avg_depression=Avg('depression'),
    )
    alerts = Assessment.objects.filter(
        employee__in=employees, risk_level='high'
    ).values('employee__username', 'assessment_date').order_by('-assessment_date')[:10]
    team_members = list(
        company_users.values('id', 'username', 'first_name', 'last_name', 'role').order_by('username')
    )
    return Response({
        'averages': agg,
        'recent_alerts': list(alerts),
        'team_members': team_members,
        'total_team_members': len(team_members),
    })


# ── Gamificação ──────────────────────────────────────────────────────────


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def my_points(request):
    if request.method == 'POST':
        pts = request.data.get('points')
        reason = request.data.get('reason', 'streak_bonus')
        if pts is not None:
            try:
                pts = int(pts)
                GamificationPoints.objects.create(
                    employee=request.user,
                    points=pts,
                    reason=reason
                )
            except ValueError:
                return Response({'error': 'Points must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

    points = GamificationPoints.objects.filter(employee=request.user)
    total = sum(p.points for p in points)
    history = list(points.values('points', 'reason', 'earned_at'))
    return Response({
        'total_points': total,
        'total_pontos': total,
        'history': history
    })
