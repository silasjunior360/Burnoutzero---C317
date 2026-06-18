from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_CHOICES = (
        ('employee', 'Employee'),
        ('psychologist', 'Psychologist'),
        ('manager', 'Manager'),
    )
    avatar = models.TextField(blank=True, default='')
    role = models.CharField(
        max_length=20, choices=ROLE_CHOICES, default='employee'
    )
    company_code = models.CharField(
        max_length=100, blank=True, default=''
    )
    department = models.CharField(
        max_length=100, blank=True, null=True
    )


class Assessment(models.Model):
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='assessments'
    )
    assessment_date = models.DateTimeField(auto_now_add=True)
    stress = models.IntegerField(default=0)
    anxiety = models.IntegerField(default=0)
    burnout = models.IntegerField(default=0)
    depression = models.IntegerField(default=0)
    RISK_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )
    risk_level = models.CharField(max_length=20, choices=RISK_CHOICES)


class Sector(models.Model):
    company_code = models.CharField(max_length=100, blank=True, default='')
    department = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(
        User,
        related_name='sectors',
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('department', 'name')
        ordering = ['name']

    def __str__(self):
        return f'{self.department} - {self.name}'


class FollowUp(models.Model):
    psychologist = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='given_follow_ups'
    )
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='received_follow_ups'
    )
    date = models.DateTimeField(auto_now_add=True)
    private_notes = models.TextField()
    status = models.CharField(max_length=50, default='active')


class PsychologistAvailability(models.Model):
    STATUS_CHOICES = (
        ('available', 'Available'),
        ('booked', 'Booked'),
        ('cancelled', 'Cancelled'),
    )

    psychologist = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='availabilities',
    )
    date_time = models.DateTimeField()
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='available',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('psychologist', 'date_time')
        ordering = ['date_time']

    def __str__(self):
        return f'{self.psychologist.username} - {self.date_time} - {self.status}'


class Appointment(models.Model):
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='appointments'
    )
    psychologist = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='psychologist_appointments',
        null=True,
        blank=True,
    )
    availability = models.OneToOneField(
        PsychologistAvailability,
        on_delete=models.SET_NULL,
        related_name='appointment',
        null=True,
        blank=True,
    )
    psychologist_name = models.CharField(max_length=100)
    date_time = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='scheduled')
    created_at = models.DateTimeField(auto_now_add=True)


class Insight(models.Model):
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='insights'
    )
    assessment = models.ForeignKey(
        Assessment, on_delete=models.CASCADE, related_name='insights'
    )
    text = models.TextField()
    recommendations = models.TextField()
    generated_at = models.DateTimeField(auto_now_add=True)
    validated_by = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='validated_insights'
    )
    validated_at = models.DateTimeField(null=True, blank=True)


class GamificationPoints(models.Model):
    REASON_CHOICES = (
        ('assessment_complete', 'Assessment Complete'),
        ('streak_bonus', 'Streak Bonus'),
        ('water_challenge', 'Water Challenge'),
        ('breathing_challenge', 'Breathing Challenge'),
        ('daily_words', 'Daily Words'),
        ('mood_checkin', 'Mood Check-in'),
    )
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='points'
    )
    points = models.IntegerField(default=0)
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    earned_at = models.DateTimeField(auto_now_add=True)


class GamificationState(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='gamification_state',
    )
    total_xp = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    streak_days = models.IntegerField(default=0)
    last_streak_date = models.DateField(null=True, blank=True)
    daily_words_state = models.JSONField(default=dict, blank=True)
    mood_state = models.JSONField(default=dict, blank=True)
    water_state = models.JSONField(default=dict, blank=True)
    breathing_state = models.JSONField(default=dict, blank=True)
    weekly_mission_state = models.JSONField(default=dict, blank=True)
    completed_tasks_by_date = models.JSONField(default=dict, blank=True)
    achievements = models.JSONField(default=list, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'GamificationState<{self.user_id}>'
