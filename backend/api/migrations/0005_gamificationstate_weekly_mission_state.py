from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_gamification_state'),
    ]

    operations = [
        migrations.AddField(
            model_name='gamificationstate',
            name='weekly_mission_state',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
