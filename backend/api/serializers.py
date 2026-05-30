from rest_framework import serializers
from .models import User, Assessment, FollowUp, Appointment, Sector


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'avatar',
            'role', 'department'
        ]
        read_only_fields = ['id', 'role', 'department']


class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'email',
            'first_name', 'last_name',
            'role', 'department'
        ]
        extra_kwargs = {'password': {'write_only': True}}

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
                'alerta': bool(
                    latest and latest.risk_level == 'high'
                    or health == 'Ruim'
                ),
            })
        return details

    def _latest_assessment(self, user):
        return Assessment.objects.filter(employee=user).order_by('-assessment_date').first()

    def _user_engagement(self, user):
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
        if engagement > 30:
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
            latest = self._latest_assessment(user)
            if health == 'Ruim' or (latest and latest.risk_level == 'high'):
                count += 1
        return count
