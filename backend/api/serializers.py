from rest_framework import serializers
from django.utils import timezone
from django.utils.dateparse import parse_date
from datetime import timedelta
from .models import User, Assessment, FollowUp, Appointment, Sector, GamificationState


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'avatar',
            'role', 'company_code', 'department'
        ]
        read_only_fields = ['id', 'role', 'department', 'company_code']


class UserCreateSerializer(serializers.ModelSerializer):
    role = serializers.CharField(required=False, default='employee')

    ROLE_ALIASES = {
        'funcionario': 'employee',
        'psicologo': 'psychologist',
        'gestor': 'manager',
    }

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'email',
            'first_name', 'last_name',
            'role', 'company_code', 'department'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def validate_role(self, value):
        mapped_value = self.ROLE_ALIASES.get(value, value)
        valid_roles = [choice[0] for choice in User.ROLE_CHOICES]
        if mapped_value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role: {value}")
        return mapped_value

    def validate_department(self, value):
        return value.strip() if isinstance(value, str) else value

    def validate_company_code(self, value):
        return value.strip() if isinstance(value, str) else value

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user


class AssessmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = '__all__'
        read_only_fields = [
            'employee', 'assessment_date', 'risk_level'
        ]


class FollowUpSerializer(serializers.ModelSerializer):
    class Meta:
        model = FollowUp
        fields = '__all__'
        read_only_fields = ['psychologist']


class AppointmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['employee']


class SectorSerializer(serializers.ModelSerializer):
    setor = serializers.CharField(source='name')
    usuarios = serializers.SerializerMethodField()
    usuarios_detalhes = serializers.SerializerMethodField()
    engajamento = serializers.SerializerMethodField()
    saude = serializers.SerializerMethodField()
    alertas = serializers.SerializerMethodField()

    class Meta:
        model = Sector
        fields = ['id', 'setor', 'usuarios', 'usuarios_detalhes', 'engajamento', 'saude', 'alertas']

    def get_usuarios(self, obj):
        return list(obj.members.order_by('username').values_list('username', flat=True))

    def get_usuarios_detalhes(self, obj):
        details = []
        for user in obj.members.filter(role__in=['employee', 'psychologist']).order_by('username'):
            assessment = self._latest_assessment(user)
            engagement = self._user_engagement(user)
            health = self._health_status(engagement)
            latest = assessment
            details.append({
                'id': user.id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'engajamento': engagement if engagement is not None else 0,
                'saude': health,
                'alerta': health == 'Ruim',
            })
        return details

    def _latest_assessment(self, user):
        return Assessment.objects.filter(employee=user).order_by('-assessment_date').first()

    def _weekly_mission_score(self, user):
        try:
            state = user.gamification_state
        except GamificationState.DoesNotExist:
            return None

        weekly_state = state.weekly_mission_state if isinstance(state.weekly_mission_state, dict) else {}
        history = weekly_state.get('history') if isinstance(weekly_state, dict) else {}
        if not isinstance(history, dict) or not history:
            return None

        score_map = {
            'pessimo': 20,
            'ruim': 40,
            'neutro': 60,
            'bom': 80,
            'otimo': 100,
        }
        scores = []

        ordered_history = sorted(
            history.items(),
            key=lambda item: parse_date(item[0]) or timezone.localdate(),
        )

        for date_key, value in ordered_history[-5:]:
            date_value = parse_date(date_key)
            if not date_value:
                continue

            score = score_map.get(str(value).strip().lower())
            if score is not None:
                scores.append(score)

        if not scores:
            return None

        return round(sum(scores) / len(scores))

    def _user_engagement(self, user):
        weekly_score = self._weekly_mission_score(user)
        if weekly_score is not None:
            return weekly_score

        assessment = self._latest_assessment(user)
        if not assessment:
            return None
        total = assessment.stress + assessment.anxiety + assessment.burnout + assessment.depression
        return max(0, min(100, 100 - total))

    def _health_status(self, engagement):
        if engagement is None:
            return 'Sem dados'
        if engagement > 75:
            return 'Ótimo'
        if engagement >= 30:
            return 'Bom'
        return 'Ruim'

    def get_engajamento(self, obj):
        members = list(obj.members.filter(role__in=['employee', 'psychologist']))
        if not members:
            return 0
        values = [value for value in (self._user_engagement(user) for user in members) if value is not None]
        if not values:
            return 0
        return round(sum(values) / len(values))

    def get_saude(self, obj):
        return self._health_status(self.get_engajamento(obj))

    def get_alertas(self, obj):
        count = 0
        for user in obj.members.filter(role__in=['employee', 'psychologist']):
            engagement = self._user_engagement(user)
            health = self._health_status(engagement)
            if health == 'Ruim':
                count += 1
        return count
