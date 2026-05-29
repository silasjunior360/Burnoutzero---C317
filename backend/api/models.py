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


class FollowUp(models.Model):
    psychologist = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='given_follow_ups'
    )
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='received_follow_ups'
    )
    date = models.DateTimeField(auto_now_add=True)
    private_notes = models.TextField()
    status = models.CharField(max_length=50, default='active')


class Appointment(models.Model):
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE,
        related_name='appointments'
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
    )
    employee = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='points'
    )
    points = models.IntegerField(default=0)
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    earned_at = models.DateTimeField(auto_now_add=True)
