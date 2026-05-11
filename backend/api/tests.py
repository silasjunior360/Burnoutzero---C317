from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Assessment, Insight

User = get_user_model()


class ApiViewsTestCase(APITestCase):
    def setUp(self):
        self.employee = User.objects.create_user(
            username='func', password='password', role='employee', department='TI'
        )
        self.manager = User.objects.create_user(
            username='gestor', password='password', role='manager', department='TI'
        )
        self.psychologist = User.objects.create_user(
            username='psico', password='password', role='psychologist', department='Saude'
        )

    def test_assessment_create_and_gamification(self):
        self.client.force_authenticate(user=self.employee)
        data = {
            'stress': 60,
            'anxiety': 20,
            'burnout': 10,
            'depression': 5,
        }
        response = self.client.post(reverse('assessment-list'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response2 = self.client.get(reverse('my_points'))
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        self.assertEqual(response2.data['total_points'], 10)

        response3 = self.client.get(reverse('insight-list'))
        self.assertEqual(response3.status_code, status.HTTP_200_OK)

    def test_team_overview(self):
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse('team_overview'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.client.force_authenticate(user=self.employee)
        response2 = self.client.get(reverse('team_overview'))
        self.assertEqual(response2.status_code, status.HTTP_403_FORBIDDEN)

    def test_follow_up_and_insight_psychologist(self):
        assessment = Assessment.objects.create(
            employee=self.employee, risk_level='high'
        )
        insight = Insight.objects.create(
            employee=self.employee, assessment=assessment,
            text="T", recommendations="R"
        )

        self.client.force_authenticate(user=self.psychologist)
        response = self.client.patch(
            reverse('validate_insight', args=[insight.id]), {
                'text': 'Novo texto'
            }
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        response2 = self.client.get(reverse('insight-list'))
        self.assertEqual(response2.status_code, status.HTTP_200_OK)

        response3 = self.client.post(reverse('follow-up-list'), {
            'employee': self.employee.id,
            'status': 'active',
            'private_notes': 'Anotações'
        })
        self.assertEqual(response3.status_code, status.HTTP_201_CREATED)

    def test_appointment(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.post(reverse('appointment-list'), {
            'psychologist_name': 'Dra. Ana',
            'date_time': '10:00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_insight_logic_levels(self):
        actor = self.employee
        self.client.force_authenticate(user=actor)

        data_low = {'stress': 5, 'anxiety': 5, 'burnout': 0, 'depression': 0}
        self.client.post(reverse('assessment-list'), data_low)
        insight_low = Insight.objects.filter(employee=actor).latest('generated_at')
        self.assertIn("indicadores estão dentro da faixa esperada", insight_low.text)
        self.assertIn("hábitos saudáveis", insight_low.recommendations)

        data_med = {'stress': 10, 'anxiety': 10, 'burnout': 5, 'depression': 0}
        self.client.post(reverse('assessment-list'), data_med)
        insight_med = Insight.objects.filter(employee=actor).latest('generated_at')
        self.assertIn("Sinais moderados", insight_med.text)
        self.assertIn("Pratique pausas regulares", insight_med.recommendations)

        data_high = {'stress': 20, 'anxiety': 20, 'burnout': 10, 'depression': 5}
        self.client.post(reverse('assessment-list'), data_high)
        insight_high = Insight.objects.filter(employee=actor).latest('generated_at')
        self.assertIn("risco elevado", insight_high.text)
        self.assertIn("Estresse acima do esperado", insight_high.text)
        self.assertIn("psicólogo o quanto antes", insight_high.recommendations)
        self.assertIn("atividades de descompressão", insight_high.recommendations)
