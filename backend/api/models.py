from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('funcionario', 'Funcionário'),
        ('psicologo', 'Psicólogo'),
        ('gestor', 'Gestor'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='funcionario')
    departamento = models.CharField(max_length=100, blank=True, null=True)

class Avaliacao(models.Model):
    funcionario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='avaliacoes')
    data_avaliacao = models.DateTimeField(auto_now_add=True)
    
    # Pontuações baseadas em um teste padrão de Burnout
    exaustao_emocional = models.IntegerField()
    despersonalizacao = models.IntegerField()
    realizacao_profissional = models.IntegerField()
    
    RISK_CHOICES = (
        ('baixo', 'Baixo'),
        ('medio', 'Médio'),
        ('alto', 'Alto'),
    )
    nivel_risco = models.CharField(max_length=20, choices=RISK_CHOICES)

class Acompanhamento(models.Model):
    psicologo = models.ForeignKey(User, on_delete=models.CASCADE, related_name='acompanhamentos_dados')
    funcionario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='acompanhamentos_recebidos')
    data = models.DateTimeField(auto_now_add=True)
    anotacoes_privadas = models.TextField()
    status = models.CharField(max_length=50, default='ativo')

class Agendamento(models.Model):
    funcionario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='agendamentos')
    nome_psicologo = models.CharField(max_length=100)
    data_hora = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='agendado')
    criado_em = models.DateTimeField(auto_now_add=True)
