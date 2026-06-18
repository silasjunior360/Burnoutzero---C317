from django.contrib import admin
from .models import (
    User, Assessment, FollowUp, Appointment,
    PsychologistAvailability, Insight, GamificationPoints,
    GamificationState, Sector,
)

admin.site.register(User)
admin.site.register(Assessment)
admin.site.register(FollowUp)
admin.site.register(Appointment)
admin.site.register(PsychologistAvailability)
admin.site.register(Insight)
admin.site.register(GamificationPoints)
admin.site.register(GamificationState)
admin.site.register(Sector)
