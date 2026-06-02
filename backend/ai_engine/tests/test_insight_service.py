from django.test import TestCase
from unittest.mock import patch
from api.models import User, Assessment, GamificationPoints
from ai_engine.services.insight_service import (
    generate_insight, _parse_response
)


class TestInsightService(TestCase):
    def setUp(self):
        self.employee = User.objects.create_user(username='employee', email='emp@example.com')

    @patch('ai_engine.services.insight_service.build_context')
    @patch('ai_engine.services.insight_service.complete')
    def test_generate_insight_success(self, mock_complete, mock_build_context):
        mock_build_context.return_value = "Mocked Context"
        mock_complete.return_value = (
            "[ANALISE]This is analysis.[/ANALISE]\n"
            "[RECOMENDACOES]\n- Rec 1\n- Rec 2\n[/RECOMENDACOES]"
        )

        assessment = Assessment.objects.create(
            employee=self.employee,
            stress=10,
            anxiety=12,
            burnout=15,
            depression=8,
            risk_level='medium'
        )

        insight = generate_insight(self.employee, assessment)

        self.assertEqual(insight.text, "This is analysis.")
        self.assertEqual(insight.recommendations, "- Rec 1\n- Rec 2")
        self.assertEqual(insight.employee, self.employee)
        self.assertEqual(insight.assessment, assessment)

        points = GamificationPoints.objects.filter(employee=self.employee, reason='assessment_complete')
        self.assertEqual(points.count(), 1)
        self.assertEqual(points.first().points, 10)

    @patch('ai_engine.services.insight_service.build_context')
    @patch('ai_engine.services.insight_service.complete')
    def test_generate_insight_fallback_high(self, mock_complete, mock_build_context):
        mock_build_context.return_value = "Mocked Context"
        mock_complete.side_effect = Exception("LLM call failed")

        assessment = Assessment.objects.create(
            employee=self.employee,
            stress=20,
            anxiety=22,
            burnout=20,
            depression=20,
            risk_level='high'
        )

        insight = generate_insight(self.employee, assessment)

        self.assertEqual(insight.text, "Nível de risco elevado identificado na sua avaliação.")
        self.assertEqual(insight.recommendations, "Recomendamos buscar apoio com um psicólogo o quanto antes.")

    @patch('ai_engine.services.insight_service.build_context')
    @patch('ai_engine.services.insight_service.complete')
    def test_generate_insight_fallback_medium(self, mock_complete, mock_build_context):
        mock_build_context.return_value = "Mocked Context"
        mock_complete.side_effect = Exception("LLM call failed")

        assessment = Assessment.objects.create(
            employee=self.employee,
            stress=12,
            anxiety=12,
            burnout=12,
            depression=12,
            risk_level='medium'
        )

        insight = generate_insight(self.employee, assessment)

        self.assertEqual(insight.text, "Sinais moderados de esgotamento detectados.")
        self.assertEqual(insight.recommendations, "Pratique pausas regulares e converse com alguém de confiança.")

    @patch('ai_engine.services.insight_service.build_context')
    @patch('ai_engine.services.insight_service.complete')
    def test_generate_insight_fallback_low(self, mock_complete, mock_build_context):
        mock_build_context.return_value = "Mocked Context"
        mock_complete.side_effect = Exception("LLM call failed")

        assessment = Assessment.objects.create(
            employee=self.employee,
            stress=2,
            anxiety=2,
            burnout=2,
            depression=2,
            risk_level='low'
        )

        insight = generate_insight(self.employee, assessment)

        self.assertEqual(insight.text, "Seus indicadores estão dentro da faixa esperada.")
        self.assertEqual(insight.recommendations, "Continue mantendo seus hábitos saudáveis!")

    def test_parse_response_malformed(self):
        text, recs = _parse_response("Plain text response")
        self.assertEqual(text, "Plain text response")
        self.assertEqual(recs, "")
