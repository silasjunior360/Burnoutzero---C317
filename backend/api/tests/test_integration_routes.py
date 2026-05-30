from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import User, Insight, FollowUp


class ApiRouteIntegrationTestCase(APITestCase):
    def _register_user(self, username, role, department='TI'):
        data = {
            'username': username,
            'password': 'safePassword123',
            'email': f'{username}@example.com',
            'first_name': username.capitalize(),
            'last_name': 'Test',
            'role': role,
            'department': department
        }
        response = self.client.post(reverse('auth_register'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return User.objects.get(username=username)

    def _authenticate_client(self, username):
        response = self.client.post(reverse('token_obtain_pair'), {
            'username': username,
            'password': 'safePassword123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        token = response.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

    def test_complete_employee_and_psychologist_workflow(self):
        employee = self._register_user(username='alpha_employee', role='employee', department='TI')
        self._register_user(username='beta_psychologist', role='psychologist', department='Saude')

        self._authenticate_client(username='alpha_employee')

        me_response = self.client.get(reverse('user_me'))
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data['username'], 'alpha_employee')
        self.assertEqual(me_response.data['role'], 'employee')

        assessment_payload = {
            'stress': 18,
            'anxiety': 12,
            'burnout': 15,
            'depression': 10
        }
        ass_response = self.client.post(reverse('assessment-list'), assessment_payload)
        self.assertEqual(ass_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ass_response.data['risk_level'], 'high')

        insight_response = self.client.get(reverse('insight-list'))
        self.assertEqual(insight_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(insight_response.data), 1)
        generated_insight_id = insight_response.data[0]['id']

        points_response = self.client.get(reverse('my_points'))
        self.assertEqual(points_response.status_code, status.HTTP_200_OK)
        self.assertEqual(points_response.data['total_points'], 10)

        self.client.credentials()

        self._authenticate_client(username='beta_psychologist')

        validate_response = self.client.patch(
            reverse('validate_insight', args=[generated_insight_id]),
            {
                'text': 'Insight revisto pelo especialista.',
                'recommendations': 'Fazer pausa de 10 min a cada 2 horas.'
            }
        )
        self.assertEqual(validate_response.status_code, status.HTTP_200_OK)

        db_insight = Insight.objects.get(id=generated_insight_id)
        self.assertEqual(db_insight.text, 'Insight revisto pelo especialista.')
        self.assertEqual(db_insight.validated_by.username, 'beta_psychologist')

        followup_response = self.client.post(
            reverse('follow-up-list'),
            {
                'employee': employee.id,
                'status': 'active',
                'private_notes': 'Acompanhamento semanal iniciado.'
            }
        )
        self.assertEqual(followup_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FollowUp.objects.filter(employee=employee).exists(), True)
