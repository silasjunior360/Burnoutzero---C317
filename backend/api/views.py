from rest_framework import generics, viewsets, status, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from django.db.models import Avg
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from datetime import timedelta
from .models import (
    User,
    Assessment,
    FollowUp,
    Appointment,
    Insight,
    GamificationPoints,
    GamificationState,
    Sector,
)

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


class SectorViewSet(viewsets.ModelViewSet):
    serializer_class = SectorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role != 'manager' or not user.department:
            return Sector.objects.none()

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


# ── Gamificação do usuário ───────────────────────────────────────────────


DEFAULT_DAILY_WORDS_STATE = {
    'collectedWords': [],
    'currentWord': None,
    'nextWordAt': 0,
    'completed': False,
    'xpAwarded': False,
}

DEFAULT_MOOD_STATE = {
    'selectedMood': None,
    'claimedDate': None,
    'history': [],
}

DEFAULT_STREAK_STATE = {
    'streakDays': 0,
    'lastClaimDate': None,
    'claimedDate': None,
}

DEFAULT_WATER_STATE = {
    'totalMl': 0,
    'lastSipTime': None,
    'waterXp': 0,
    'history': {},
}

DEFAULT_BREATHING_STATE = {
    'isActive': False,
    'currentPhase': 'inhale',
    'phaseTime': 0,
    'totalTime': 0,
    'cyclesCompleted': 0,
    'cycles': 0,
    'xpAwarded': False,
}

DEFAULT_WEEKLY_MISSION_STATE = {
    'history': {},
    'lastSubmittedDate': None,
}

WEEKLY_MISSION_SCORE_MAP = {
    'pessimo': 20,
    'ruim': 40,
    'neutro': 60,
    'bom': 80,
    'otimo': 100,
}


CONSISTENCY_ACHIEVEMENTS = [
    {'titulo': 'Faísca', 'badge': 'faisca', 'requisito': 'Completar 1 desafio qualquer', 'xp': 50},
    {'titulo': 'Brasa Semanal', 'badge': 'brasa', 'requisito': '7 dias seguidos', 'xp': 200},
    {'titulo': 'Chama Mensal', 'badge': 'chama', 'requisito': '30 dias seguidos', 'xp': 1000},
    {'titulo': 'Labareda Trimestral', 'badge': 'labareda', 'requisito': '90 dias seguidos', 'xp': 5000},
    {'titulo': 'Fogaréu Ardente', 'badge': 'fogareu', 'requisito': '180 dias seguidos', 'xp': 20000},
    {'titulo': 'Fulgor Eterno', 'badge': 'fulgor', 'requisito': '365 dias seguidos', 'xp': 30000},
]

HYDRATION_ACHIEVEMENTS = [
    {'titulo': 'Gota iniciante', 'badge': 'gota', 'requisito': 'Beber 1L em um dia', 'xp': 50},
    {'titulo': 'Correnteza Pesada', 'badge': 'correnteza', 'requisito': 'Beber 2L em um dia (10x no total)', 'xp': 150},
    {'titulo': 'Rio Profundo', 'badge': 'rio', 'requisito': 'Beber 50L acumulados (25 dias de 2L)', 'xp': 500},
    {'titulo': 'Oceano Eterno', 'badge': 'oceano', 'requisito': 'Completar a meta de água 30 dias', 'xp': 2000},
    {'titulo': 'Maré Alta', 'badge': 'mare', 'requisito': 'Beber 100L acumulados', 'xp': 5000},
    {'titulo': 'Relógio de Água', 'badge': 'cronometro', 'requisito': 'Fazer 10 goles no tempo certo', 'xp': 300},
]

BREATHING_ACHIEVEMENTS = [
    {'titulo': 'Sopro', 'badge': 'sopro', 'requisito': 'Fazer 1 ciclo de respiração', 'xp': 30},
    {'titulo': 'Brisa Cortante', 'badge': 'brisa', 'requisito': 'Fazer 100 ciclos de respiração', 'xp': 400},
    {'titulo': 'Pulmão de aço', 'badge': 'pulmao de aco', 'requisito': 'Fazer 500 ciclos', 'xp': 1500},
    {'titulo': 'Tornado Celeste', 'badge': 'tornado', 'requisito': 'Fazer 1000 ciclos', 'xp': 100},
]

LEVEL_ACHIEVEMENTS = [
    {'titulo': 'Cascalho', 'badge': 'cascalho', 'requisito': 'Alcançar o Nível 1', 'xp': 50},
    {'titulo': 'Bronze Amassado', 'badge': 'bronze', 'requisito': 'Alcançar o Nível 10', 'xp': 150},
    {'titulo': 'Ferro Forjado', 'badge': 'ferro', 'requisito': 'Alcançar o Nível 15', 'xp': 300},
    {'titulo': 'Pepita de Prata', 'badge': 'prata', 'requisito': 'Alcançar o Nível 25', 'xp': 500},
    {'titulo': 'Cavalheiro de Ouro', 'badge': 'ouro', 'requisito': 'Alcançar o Nível 50', 'xp': 1200},
    {'titulo': 'Coração de Obsidiana', 'badge': 'obsidiana', 'requisito': 'Alcançar o Nível 75', 'xp': 5000},
    {'titulo': 'Cristal de Diamante', 'badge': 'diamante', 'requisito': 'Alcançar o Nível 100', 'xp': 10000},
    
]


def _get_gamification_state(user):
    state, _ = GamificationState.objects.get_or_create(user=user)
    return state


def _ensure_dict(value):
    return value if isinstance(value, dict) else {}


def _ensure_list(value):
    return value if isinstance(value, list) else []


def _normalize_company_code(value):
    return (value or '').strip().lower()


def _local_date_key():
    return timezone.localdate().isoformat()


def _xp_required_for_next_level(level):
    if level <= 1:
        return 200
    if level <= 9:
        return (level + 1) * 100
    if level <= 19:
        return 1000 + ((level - 9) * 200)
    if level <= 29:
        return 3000 + ((level - 19) * 300)
    if level <= 39:
        return 6000 + ((level - 29) * 400)
    return 10000 + ((level - 39) * 500)


def _xp_total_for_level(level):
    if level <= 1:
        return 0

    total_xp = 0
    for current_level in range(1, level):
        total_xp += _xp_required_for_next_level(current_level)
    return total_xp


def _level_from_total_xp(total_xp):
    level = 1
    current_xp = int(total_xp or 0)

    while current_xp >= _xp_required_for_next_level(level):
        current_xp -= _xp_required_for_next_level(level)
        level += 1

    return level


def _xp_next_level(total_xp):
    return _xp_required_for_next_level(_level_from_total_xp(total_xp))


def _consistency_tier(streak_days):
    if streak_days >= 365:
        return 5
    if streak_days >= 180:
        return 4
    if streak_days >= 90:
        return 3
    if streak_days >= 30:
        return 2
    if streak_days >= 7:
        return 1
    if streak_days >= 1:
        return 0
    return -1


def _hydration_tier(water_history):
    values = list(water_history.values())
    days_with_2l = len([value for value in values if value >= 2000])
    days_with_1l = len([value for value in values if value >= 1000])
    total_ml = sum(values)

    if days_with_2l >= 30:
        return 3
    if total_ml >= 100000:
        return 4
    if days_with_2l >= 25:
        return 2
    if days_with_2l >= 10:
        return 1
    if days_with_1l >= 1:
        return 0
    return -1


def _breathing_tier(total_cycles):
    if total_cycles >= 1000:
        return 3
    if total_cycles >= 500:
        return 2
    if total_cycles >= 100:
        return 1
    if total_cycles >= 1:
        return 0
    return -1


def _weekly_mission_score(weekly_mission_state):
    weekly_state = _ensure_dict(weekly_mission_state)
    history = _ensure_dict(weekly_state.get('history'))
    cutoff = timezone.localdate() - timedelta(days=4)
    scores = []

    for date_key, value in history.items():
        date_value = parse_date(date_key)
        if not date_value or date_value < cutoff:
            continue

        score = WEEKLY_MISSION_SCORE_MAP.get(str(value).strip().lower())
        if score is not None:
            scores.append(score)

    if not scores:
        return None

    return round(sum(scores) / len(scores))


def _level_tier(level):
    if level >= 100:
        return 6
    if level >= 75:
        return 5
    if level >= 50:
        return 4
    if level >= 25:
        return 3
    if level >= 15:
        return 2
    if level >= 10:
        return 1
    if level >= 1:
        return 0
    return -1


def _update_achievements(state):
    water_state = _ensure_dict(state.water_state)
    water_history = _ensure_dict(water_state.get('history'))
    breathing_state = _ensure_dict(state.breathing_state)
    total_cycles = int(breathing_state.get('cycles') or breathing_state.get('cyclesCompleted') or 0)
    consistency_tier = _consistency_tier(int(state.streak_days or 0))
    hydration_tier = _hydration_tier(water_history)
    breathing_tier = _breathing_tier(total_cycles)
    level_tier = _level_tier(_level_from_total_xp(state.total_xp))

    earned = []
    earned.extend([item['badge'] for item in CONSISTENCY_ACHIEVEMENTS[:consistency_tier + 1] if consistency_tier >= 0])
    earned.extend([item['badge'] for item in HYDRATION_ACHIEVEMENTS[:hydration_tier + 1] if hydration_tier >= 0])
    earned.extend([item['badge'] for item in BREATHING_ACHIEVEMENTS[:breathing_tier + 1] if breathing_tier >= 0])
    earned.extend([item['badge'] for item in LEVEL_ACHIEVEMENTS[:level_tier + 1] if level_tier >= 0])

    unique_earned = []
    for badge in earned:
        if badge not in unique_earned:
            unique_earned.append(badge)

    state.achievements = unique_earned
    return {
        'consistency': consistency_tier,
        'hydration': hydration_tier,
        'breathing': breathing_tier,
        'level': level_tier,
    }


def _mark_task_completed(state, task_key):
    completed = _ensure_dict(state.completed_tasks_by_date)
    today = _local_date_key()
    today_tasks = _ensure_list(completed.get(today))
    if task_key not in today_tasks:
        today_tasks.append(task_key)
    completed[today] = today_tasks
    state.completed_tasks_by_date = completed


def _award_points(user, points, reason):
    state = _get_gamification_state(user)
    state.total_points = int(state.total_points or 0) + int(points)
    state.total_xp = int(state.total_xp or 0) + int(points)
    state.save(update_fields=['total_points', 'total_xp', 'updated_at'])
    GamificationPoints.objects.create(employee=user, points=points, reason=reason)
    return state


def _serialize_gamification_state(user):
    state = _get_gamification_state(user)
    water_state = _ensure_dict(state.water_state)
    water_history = _ensure_dict(water_state.get('history'))
    breathing_state = _ensure_dict(state.breathing_state)
    reward_tiers = _update_achievements(state)
    state.save(update_fields=['achievements', 'updated_at'])

    points_history = list(
        GamificationPoints.objects.filter(employee=user)
        .order_by('-earned_at')
        .values('points', 'reason', 'earned_at')
    )

    return {
        'profile': {
            'id': user.id,
            'username': user.username,
            'nome': (user.first_name or user.username or 'Usuário') + (f' {user.last_name}' if user.last_name else ''),
            'avatar': user.avatar,
            'xp': state.total_xp,
            'pontos': state.total_points,
            'diasAtivo': state.streak_days,
            'level': _level_from_total_xp(state.total_xp),
            'xpProximo': _xp_next_level(state.total_xp),
            'streak_days': state.streak_days,
            'last_streak_date': state.last_streak_date.isoformat() if state.last_streak_date else None,
        },
        'storage': {
            'burnout-zero-daily-words': _ensure_dict(state.daily_words_state) or DEFAULT_DAILY_WORDS_STATE,
            'burnout-zero-mood-challenge': _ensure_dict(state.mood_state) or DEFAULT_MOOD_STATE,
            'burnout-zero-streak': {
                **DEFAULT_STREAK_STATE,
                'streakDays': state.streak_days,
                'lastClaimDate': state.last_streak_date.isoformat() if state.last_streak_date else None,
                'claimedDate': state.last_streak_date.isoformat() if state.last_streak_date else None,
            },
            'burnout-zero-water-weekly': {
                **DEFAULT_WATER_STATE,
                **water_state,
                'history': water_history,
            },
            'burnout-zero-breaths': {
                **DEFAULT_BREATHING_STATE,
                **breathing_state,
                'cycles': int(breathing_state.get('cycles') or breathing_state.get('cyclesCompleted') or 0),
            },
            'burnout-zero-weekly-mission': {
                **DEFAULT_WEEKLY_MISSION_STATE,
                **_ensure_dict(state.weekly_mission_state),
                'history': _ensure_dict(_ensure_dict(state.weekly_mission_state).get('history')),
            },
            'burnout-zero-pontos': state.total_points,
        },
        'reward_tiers': reward_tiers,
        'earned_achievements': state.achievements,
        'points_history': points_history,
    }


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def gamification_me(request):
    state = _get_gamification_state(request.user)

    if request.method == 'PATCH':
        payload = request.data or {}

        if 'xp' in payload or 'pontos' in payload:
            state.total_xp = int(
                payload.get('xp', state.total_xp) or payload.get('pontos', state.total_xp) or 0
            )
            state.total_points = int(
                payload.get('pontos', state.total_points) or payload.get('xp', state.total_points) or 0
            )
        if 'diasAtivo' in payload or 'streak_days' in payload:
            state.streak_days = int(
                payload.get('diasAtivo', payload.get('streak_days', state.streak_days)) or 0
            )

        if 'daily_words' in payload:
            state.daily_words_state = payload.get('daily_words') or {}
        if 'mood' in payload:
            state.mood_state = payload.get('mood') or {}
        if 'streak' in payload:
            streak_payload = payload.get('streak') or {}
            state.streak_days = int(streak_payload.get('streakDays', state.streak_days) or 0)
            last_claim_date = streak_payload.get('lastClaimDate') or streak_payload.get('claimedDate')
            state.last_streak_date = parse_date(last_claim_date) if last_claim_date else state.last_streak_date
        if 'water' in payload:
            water_payload = payload.get('water') or {}
            state.water_state = water_payload
        if 'breathing' in payload:
            breathing_payload = payload.get('breathing') or {}
            state.breathing_state = breathing_payload
        if 'weekly_mission' in payload:
            state.weekly_mission_state = payload.get('weekly_mission') or {}
        if 'completed_tasks_by_date' in payload:
            state.completed_tasks_by_date = payload.get('completed_tasks_by_date') or {}

        _update_achievements(state)
        state.save()

    return Response(_serialize_gamification_state(request.user))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def award_gamification_points(request):
    points = int(request.data.get('points', 0) or 0)
    if points <= 0:
        return Response({'error': 'Informe uma quantidade válida de pontos.'}, status=status.HTTP_400_BAD_REQUEST)

    reason = request.data.get('reason', 'assessment_complete')
    if reason not in dict(GamificationPoints.REASON_CHOICES):
        reason = 'assessment_complete'

    state = _award_points(request.user, points, reason)
    _update_achievements(state)
    state.save(update_fields=['achievements', 'updated_at'])
    return Response(_serialize_gamification_state(request.user), status=status.HTTP_200_OK)


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
    _award_points(employee, 10, 'assessment_complete')


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
    company_code = _normalize_company_code(request.user.department)
    company_users = User.objects.filter(
        role__in=['employee', 'psychologist']
    )
    company_users = [user for user in company_users if _normalize_company_code(user.department) == company_code]
    employees = [user for user in company_users if user.role == 'employee']
    agg = Assessment.objects.filter(employee__in=employees).aggregate(
        avg_stress=Avg('stress'),
        avg_anxiety=Avg('anxiety'),
        avg_burnout=Avg('burnout'),
        avg_depression=Avg('depression'),
    )
    alerts = Assessment.objects.filter(
        employee__in=employees, risk_level='high'
    ).values('employee__username', 'assessment_date').order_by('-assessment_date')[:10]
    team_members = [
        {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
        }
        for user in sorted(company_users, key=lambda item: item.username)
    ]
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
    state = _get_gamification_state(request.user)
    if request.method == 'POST':
        pts = request.data.get('points')
        reason = request.data.get('reason', 'streak_bonus')
        if pts is not None:
            try:
                state = _award_points(request.user, int(pts), reason)
            except ValueError:
                return Response({'error': 'Points must be an integer.'}, status=status.HTTP_400_BAD_REQUEST)

    points = GamificationPoints.objects.filter(employee=request.user)
    history = list(points.values('points', 'reason', 'earned_at'))
    return Response({
        'total_points': state.total_points,
        'total_xp': state.total_xp,
        'streak_days': state.streak_days,
        'achievements': state.achievements,
        'total_pontos': state.total_points,
        'history': history,
    })
