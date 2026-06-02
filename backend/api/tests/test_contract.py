from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()


class ApiContractTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='joe_contract',
            password='password',
            first_name='Joe',
            last_name='Contract',
            email='joe@contract.com',
            role='employee',
            department='TI'
        )

    def test_user_me_contract_schema(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('user_me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        required_keys = ['id', 'username', 'first_name', 'last_name', 'email', 'role', 'department']
        for key in required_keys:
            self.assertIn(key, data, f"Key '{key}' is missing in user_me response")

        self.assertIsInstance(data['username'], str)
        self.assertIsInstance(data['first_name'], str)
        self.assertIsInstance(data['last_name'], str)
        self.assertIsInstance(data['email'], str)
        self.assertIsInstance(data['role'], str)
        self.assertIsInstance(data['department'], str)

    def test_gamification_my_points_contract_schema(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(reverse('my_points'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        data = response.data
        self.assertIn('total_points', data)
        self.assertIn('history', data)

        self.assertIsInstance(data['total_points'], int)
        self.assertIsInstance(data['history'], list)
