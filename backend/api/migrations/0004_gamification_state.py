from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_sector'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gamificationpoints',
            name='reason',
            field=models.CharField(choices=[('assessment_complete', 'Assessment Complete'), ('streak_bonus', 'Streak Bonus'), ('water_challenge', 'Water Challenge'), ('breathing_challenge', 'Breathing Challenge'), ('daily_words', 'Daily Words'), ('mood_checkin', 'Mood Check-in')], max_length=50),
        ),
        migrations.CreateModel(
            name='GamificationState',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('total_xp', models.IntegerField(default=0)),
                ('total_points', models.IntegerField(default=0)),
                ('streak_days', models.IntegerField(default=0)),
                ('last_streak_date', models.DateField(blank=True, null=True)),
                ('daily_words_state', models.JSONField(blank=True, default=dict)),
                ('mood_state', models.JSONField(blank=True, default=dict)),
                ('water_state', models.JSONField(blank=True, default=dict)),
                ('breathing_state', models.JSONField(blank=True, default=dict)),
                ('completed_tasks_by_date', models.JSONField(blank=True, default=dict)),
                ('achievements', models.JSONField(blank=True, default=list)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='gamification_state', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
