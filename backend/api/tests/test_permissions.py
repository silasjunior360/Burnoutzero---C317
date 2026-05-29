from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Assessment, Insight

User = get_user_model()


class ApiPermissionsTestCase(APITestCase):
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

    def test_employee_scoping_assessments(self):
        Assessment.objects.create(employee=self.employee, risk_level='low', stress=1)

        other_user = User.objects.create_user(username='other', password='password', role='employee')
        Assessment.objects.create(employee=other_user, risk_level='low', stress=2)

        self.client.force_authenticate(user=self.employee)
        response = self.client.get(reverse('assessment-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_manager_scoping_department(self):
        hr_employee = User.objects.create_user(
            username='hr_emp', password='password', role='employee', department='RH'
        )
        tech_employee = User.objects.create_user(
            username='tech_emp', password='password', role='employee', department='TI'
        )

        Assessment.objects.create(employee=hr_employee, risk_level='low')
        Assessment.objects.create(employee=tech_employee, risk_level='medium')

        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse('assessment-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_insight_validation_permissions(self):
        assessment = Assessment.objects.create(employee=self.employee, risk_level='high')
        insight = Insight.objects.create(
            employee=self.employee, assessment=assessment, text="T", recommendations="R"
        )

        self.client.force_authenticate(user=self.employee)
        response = self.client.patch(reverse('validate_insight', args=[insight.id]), {'text': 'Novo'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
