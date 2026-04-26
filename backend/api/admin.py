from django.contrib import admin
from .models import User, Avaliacao, Acompanhamento, Agendamento

admin.site.register(User)
admin.site.register(Avaliacao)
admin.site.register(Acompanhamento)
admin.site.register(Agendamento)
