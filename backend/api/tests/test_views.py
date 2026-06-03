from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from api.models import Assessment, Insight, GamificationState, Sector

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
        User.objects.create_user(
            username='psico_ti', password='password', role='psychologist', department='TI'
        )
        self.client.force_authenticate(user=self.manager)
        response = self.client.get(reverse('team_overview'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('team_members', response.data)
        self.assertIn('total_team_members', response.data)
        self.assertEqual(response.data['total_team_members'], 2)

        self.client.force_authenticate(user=self.employee)
        response2 = self.client.get(reverse('team_overview'))
        self.assertEqual(response2.status_code, status.HTTP_403_FORBIDDEN)

    def test_team_overview_matches_any_company_code(self):
        manager = User.objects.create_user(
            username='gestor_codigo', password='password', role='manager', department='EMPRESA-ALFA '
        )
        User.objects.create_user(
            username='joaohumberto', password='password', role='employee', department='EMPRESA-ALFA'
        )
        User.objects.create_user(
            username='fora_da_empresa', password='password', role='employee', department='EMPRESA-BETA'
        )

        self.client.force_authenticate(user=manager)
        response = self.client.get(reverse('team_overview'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        usernames = [member['username'] for member in response.data['team_members']]
        self.assertIn('joaohumberto', usernames)
        self.assertNotIn('fora_da_empresa', usernames)

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

    def test_register_user_success(self):
        data = {
            'username': 'newuser',
            'password': 'newpassword123',
            'email': 'new@user.com',
            'first_name': 'New',
            'last_name': 'User',
            'role': 'employee',
            'department': 'TI'
        }
        response = self.client.post(reverse('auth_register'), data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.filter(username='newuser').exists(), True)

    def test_register_user_invalid(self):
        data = {
            'password': 'newpassword123',
            'email': 'new@user.com',
            'role': 'employee'
        }
        response = self.client.post(reverse('auth_register'), data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_detail_me(self):
        self.client.force_authenticate(user=self.employee)
        response = self.client.get(reverse('user_me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], self.employee.username)
        self.assertEqual(response.data['role'], self.employee.role)


class ApiProfileSettingsTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='perfil',
            password='password123',
            email='perfil@burnoutzero.com',
            first_name='Ana',
            last_name='Silva',
            role='employee',
            department='TI'
        )

    def test_update_profile_and_avatar(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            reverse('user_me'),
            {
                'first_name': 'Maria',
                'last_name': 'Souza',
                'email': 'maria@burnoutzero.com',
                'avatar': 'data:image/png;base64,AAA'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Maria')
        self.assertEqual(self.user.last_name, 'Souza')
        self.assertEqual(self.user.email, 'maria@burnoutzero.com')
        self.assertEqual(self.user.avatar, 'data:image/png;base64,AAA')

    def test_change_password(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('user_password_change'),
            {
                'current_password': 'password123',
                'new_password': 'novaSenha123',
                'confirm_password': 'novaSenha123'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('novaSenha123'))

    def test_change_password_with_patch_and_camel_case_payload(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.patch(
            reverse('user_password_change'),
            {
                'currentPassword': 'password123',
                'newPassword': 'novaSenha456',
                'confirmPassword': 'novaSenha456'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('novaSenha456'))

    def test_change_password_rejects_numeric_only(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('user_password_change'),
            {
                'current_password': 'password123',
                'new_password': '12345678',
                'confirm_password': '12345678'
            },
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('apenas números', response.data.get('error', ''))
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('password123'))


class ApiManagerSectorsTestCase(APITestCase):
    def setUp(self):
        self.employee_low = User.objects.create_user(
            username='func_baixo', password='password', role='employee', department='TI'
        )
        self.employee_high = User.objects.create_user(
            username='func_alto', password='password', role='employee', department='TI'
        )
        self.manager = User.objects.create_user(
            username='gestor_ti', password='password', role='manager', department='TI'
        )
        self.psychologist = User.objects.create_user(
            username='psico_ti', password='password', role='psychologist', department='TI'
        )

        Assessment.objects.create(
            employee=self.employee_low,
            stress=2,
            anxiety=2,
            burnout=1,
            depression=0,
            risk_level='low',
        )
        Assessment.objects.create(
            employee=self.employee_high,
            stress=20,
            anxiety=15,
            burnout=10,
            depression=8,
            risk_level='high',
        )
        GamificationState.objects.create(
            user=self.employee_high,
            weekly_mission_state={
                'history': {
                    '2026-05-27': 'otimo',
                    '2026-05-28': 'bom',
                    '2026-05-29': 'neutro',
                    '2026-05-30': 'ruim',
                    '2026-05-31': 'bom',
                }
            }
        )

    def test_manager_sectors_api(self):
        self.client.force_authenticate(user=self.manager)

        stable_sector = Sector.objects.create(department='TI', name='Administrativo')
        under_observation_sector = Sector.objects.create(department='TI', name='Projetos')
        high_risk_sector = Sector.objects.create(department='TI', name='Operações')

        stable_sector.members.add(self.employee_low)
        high_risk_sector.members.add(self.employee_high)
        under_observation_sector.members.add(self.psychologist)

        response = self.client.get(reverse('manager-sectors-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

        sector_names = [item['setor'] for item in response.data]
        self.assertIn('Administrativo', sector_names)
        self.assertIn('Operações', sector_names)

        high_sector = next(item for item in response.data if item['setor'] == 'Operações')
        self.assertIn(self.employee_high.username, high_sector['usuarios'])
        self.assertEqual(high_sector['engajamento'], 72)

        create_response = self.client.post(
            reverse('manager-sectors-list'),
            {'setor': 'Novo setor'},
            format='json'
        )
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)

        new_sector_id = create_response.data['id']
        assign_response = self.client.post(
            reverse('manager-sectors-assign', args=[new_sector_id]),
            {'username': self.employee_low.username},
            format='json'
        )
        self.assertEqual(assign_response.status_code, status.HTTP_200_OK)

        remove_response = self.client.post(
            reverse('manager-sectors-remove-member', args=[new_sector_id]),
            {'username': self.employee_low.username},
            format='json'
        )
        self.assertEqual(remove_response.status_code, status.HTTP_200_OK)

        for sector_id in Sector.objects.filter(department='TI').values_list('id', flat=True):
            self.client.delete(reverse('manager-sectors-detail', args=[sector_id]))

        empty_response = self.client.get(reverse('manager-sectors-list'))
        self.assertEqual(empty_response.status_code, status.HTTP_200_OK)
        self.assertEqual(empty_response.data, [])


class ApiGamificationStateTestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='jornada',
            password='password',
            role='employee',
            department='TI',
        )

    def test_gamification_summary_creates_state(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.get(reverse('gamification_me'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('profile', response.data)
        self.assertIn('storage', response.data)
        self.assertEqual(response.data['profile']['pontos'], 0)
        self.assertTrue(GamificationState.objects.filter(user=self.user).exists())

    def test_award_points_updates_state_and_history(self):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('gamification_award'),
            {'points': 25, 'reason': 'water_challenge'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()

        state = GamificationState.objects.get(user=self.user)
        self.assertEqual(state.total_points, 25)
        self.assertEqual(state.total_xp, 25)
        self.assertEqual(response.data['profile']['pontos'], 25)
        self.assertEqual(response.data['profile']['xp'], 25)
        self.assertGreaterEqual(len(response.data['points_history']), 1)
