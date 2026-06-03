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

    def test_jwt_login_accepts_email(self):
        self._register_user(username='email_login_user', role='employee')

        response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'email_login_user@example.com',
            'password': 'safePassword123'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_register_copies_company_code_into_department(self):
        response = self.client.post(reverse('auth_register'), {
            'username': 'company_user',
            'password': 'safePassword123',
            'email': 'company_user@example.com',
            'first_name': 'Company',
            'last_name': 'User',
            'role': 'employee',
            'company_code': 'EMPRESA-ALFA'
        })

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(username='company_user')
        self.assertEqual(user.company_code, 'EMPRESA-ALFA')
        self.assertEqual(user.department, 'EMPRESA-ALFA')

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

    def test_manager_cross_department_leakage_and_metrics(self):
        self._register_user(username='emp_a', role='employee', department='TI')
        self._register_user(username='emp_b', role='employee', department='RH')

        self._register_user(username='manager_ti', role='manager', department='TI')

        self._authenticate_client(username='emp_a')
        self.client.post(reverse('assessment-list'), {
            'stress': 20, 'anxiety': 20, 'burnout': 20, 'depression': 20
        })

        self._authenticate_client(username='emp_b')
        self.client.post(reverse('assessment-list'), {
            'stress': 10, 'anxiety': 10, 'burnout': 10, 'depression': 10
        })

        self.client.credentials()
        self._authenticate_client(username='manager_ti')

        response = self.client.get(reverse('team_overview'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        usernames_in_alerts = [alert['employee__username'] for alert in response.data['recent_alerts']]
        self.assertIn('emp_a', usernames_in_alerts)
        self.assertNotIn('emp_b', usernames_in_alerts)

        self.assertEqual(float(response.data['averages']['avg_stress']), 20.0)

    def test_appointment_booking_flow(self):
        self._register_user(username='patient_z', role='employee')
        self._authenticate_client(username='patient_z')

        response = self.client.post(reverse('appointment-list'), {
            'psychologist_name': 'Dr. Robert',
            'date_time': '2026-06-01 10:00'
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['psychologist_name'], 'Dr. Robert')
        self.assertEqual(response.data['status'], 'scheduled')

        list_response = self.client.get(reverse('appointment-list'))
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]['psychologist_name'], 'Dr. Robert')

    def test_jwt_token_refresh_cycle_flow(self):
        self._register_user(username='cycle_user', role='employee')

        login_response = self.client.post(reverse('token_obtain_pair'), {
            'username': 'cycle_user',
            'password': 'safePassword123'
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        refresh_token = login_response.data['refresh']

        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid_token')
        me_response_fail = self.client.get(reverse('user_me'))
        self.assertEqual(me_response_fail.status_code, status.HTTP_401_UNAUTHORIZED)

        refresh_response = self.client.post(reverse('token_refresh'), {
            'refresh': refresh_token
        })
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        new_access_token = refresh_response.data['access']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access_token}')
        me_response_success = self.client.get(reverse('user_me'))
        self.assertEqual(me_response_success.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response_success.data['username'], 'cycle_user')
