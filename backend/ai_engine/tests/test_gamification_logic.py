from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from api.models import GamificationState
from api.views import (
    _xp_required_for_next_level,
    _level_from_total_xp,
    _xp_next_level,
    _consistency_tier,
    _hydration_tier,
    _breathing_tier,
    _level_tier,
    _weekly_mission_score,
)

User = get_user_model()


class XpLevelLogicTest(TestCase):

    def test_xp_required_level_1(self):
        self.assertEqual(_xp_required_for_next_level(1), 200)

    def test_xp_required_level_5(self):
        self.assertEqual(_xp_required_for_next_level(5), 600)

    def test_xp_required_level_10(self):
        self.assertEqual(_xp_required_for_next_level(10), 1200)

    def test_xp_required_level_15(self):
        self.assertEqual(_xp_required_for_next_level(15), 2200)

    def test_xp_required_level_25(self):
        self.assertEqual(_xp_required_for_next_level(25), 4800)

    def test_xp_required_level_40(self):
        self.assertEqual(_xp_required_for_next_level(40), 10500)

    def test_level_from_zero_xp(self):
        self.assertEqual(_level_from_total_xp(0), 1)

    def test_level_from_200_xp(self):
        self.assertEqual(_level_from_total_xp(200), 2)

    def test_level_from_large_xp(self):
        self.assertGreater(_level_from_total_xp(10000), 10)

    def test_xp_next_level_at_zero(self):
        self.assertEqual(_xp_next_level(0), 200)


class TierLogicTest(TestCase):

    def test_consistency_tier_zero_days(self):
        self.assertEqual(_consistency_tier(0), -1)

    def test_consistency_tier_1_day(self):
        self.assertEqual(_consistency_tier(1), 0)

    def test_consistency_tier_7_days(self):
        self.assertEqual(_consistency_tier(7), 1)

    def test_consistency_tier_30_days(self):
        self.assertEqual(_consistency_tier(30), 2)

    def test_consistency_tier_90_days(self):
        self.assertEqual(_consistency_tier(90), 3)

    def test_consistency_tier_180_days(self):
        self.assertEqual(_consistency_tier(180), 4)

    def test_consistency_tier_365_days(self):
        self.assertEqual(_consistency_tier(365), 5)

    def test_hydration_tier_empty(self):
        self.assertEqual(_hydration_tier({}), -1)

    def test_hydration_tier_1l(self):
        self.assertEqual(_hydration_tier({'2026-01-01': 1000}), 0)

    def test_hydration_tier_2l(self):
        history = {f'2026-01-{i:02d}': 2000 for i in range(1, 11)}
        self.assertEqual(_hydration_tier(history), 1)

    def test_breathing_tier_zero(self):
        self.assertEqual(_breathing_tier(0), -1)

    def test_breathing_tier_1_cycle(self):
        self.assertEqual(_breathing_tier(1), 0)

    def test_breathing_tier_100_cycles(self):
        self.assertEqual(_breathing_tier(100), 1)

    def test_breathing_tier_500_cycles(self):
        self.assertEqual(_breathing_tier(500), 2)

    def test_breathing_tier_1000_cycles(self):
        self.assertEqual(_breathing_tier(1000), 3)

    def test_level_tier_level_1(self):
        self.assertEqual(_level_tier(1), 0)

    def test_level_tier_level_10(self):
        self.assertEqual(_level_tier(10), 1)

    def test_level_tier_level_100(self):
        self.assertEqual(_level_tier(100), 6)


class WeeklyMissionScoreTest(TestCase):

    def test_empty_history(self):
        self.assertIsNone(_weekly_mission_score({}))

    def test_valid_history(self):
        from django.utils import timezone
        today = timezone.localdate()
        history = {
            today.isoformat(): 'otimo',
        }
        score = _weekly_mission_score({'history': history})
        self.assertEqual(score, 100)

    def test_mixed_history(self):
        from django.utils import timezone
        today = timezone.localdate()
        history = {
            today.isoformat(): 'bom',
        }
        score = _weekly_mission_score({'history': history})
        self.assertEqual(score, 80)


class GamificationMePatchTest(APITestCase):

    def setUp(self):
        self.user = User.objects.create_user(
            username='gamer', password='pass', role='employee', department='TI'
        )
        self.client.force_authenticate(user=self.user)

    def test_patch_xp(self):
        response = self.client.patch(
            reverse('gamification_me'),
            {'xp': 500},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        state = GamificationState.objects.get(user=self.user)
        self.assertEqual(state.total_xp, 500)

    def test_patch_streak(self):
        from django.utils import timezone
        today = timezone.localdate().isoformat()
        response = self.client.patch(
            reverse('gamification_me'),
            {'streak': {'streakDays': 10, 'lastClaimDate': today}},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        state = GamificationState.objects.get(user=self.user)
        self.assertEqual(state.streak_days, 10)

    def test_patch_water(self):
        response = self.client.patch(
            reverse('gamification_me'),
            {'water': {'totalMl': 1500, 'history': {'2026-01-01': 1500}}},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        state = GamificationState.objects.get(user=self.user)
        self.assertEqual(state.water_state['totalMl'], 1500)

    def test_patch_breathing(self):
        response = self.client.patch(
            reverse('gamification_me'),
            {'breathing': {'cycles': 50, 'cyclesCompleted': 50}},
            format='json'
        )
        self.assertEqual(response.status_code, 200)
        state = GamificationState.objects.get(user=self.user)
        self.assertEqual(state.breathing_state['cycles'], 50)

    def test_patch_weekly_mission(self):
        from django.utils import timezone
        today = timezone.localdate().isoformat()
        response = self.client.patch(
            reverse('gamification_me'),
            {'weekly_mission': {'history': {today: 'otimo'}}},
            format='json'
        )
        self.assertEqual(response.status_code, 200)

    def test_award_points_invalid(self):
        response = self.client.post(
            reverse('gamification_award'),
            {'points': 0},
            format='json'
        )
        self.assertEqual(response.status_code, 400)
