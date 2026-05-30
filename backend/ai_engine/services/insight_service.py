import re

from .llm_client import complete
from .rag_service import build_context
from ..prompts.insight_prompt import build_system_prompt, build_user_message
from api.models import Insight, GamificationPoints


def generate_insight(employee, assessment) -> Insight:
    context = build_context(
        f"burnout stress {assessment.stress} ansiedade {assessment.anxiety} "
        f"depressao {assessment.depression} risco {assessment.risk_level}"
    )
    system = build_system_prompt(context)
    message = build_user_message(assessment)

    try:
        response = complete([{"role": "user", "content": message}], system=system)
        text, recs = _parse_response(response)
    except Exception:
        text, recs = _fallback(assessment)

    insight = Insight.objects.create(
        employee=employee,
        assessment=assessment,
        text=text,
        recommendations=recs,
    )
    GamificationPoints.objects.create(
        employee=employee, points=10, reason='assessment_complete'
    )
    return insight


def _parse_response(raw: str) -> tuple[str, str]:
    analise = re.search(r'\[ANALISE\](.*?)\[/ANALISE\]', raw, re.DOTALL)
    recs = re.search(r'\[RECOMENDACOES\](.*?)\[/RECOMENDACOES\]', raw, re.DOTALL)
    return (
        analise.group(1).strip() if analise else raw,
        recs.group(1).strip() if recs else "",
    )


def _fallback(assessment) -> tuple[str, str]:
    if assessment.risk_level == 'high':
        return (
            "Nível de risco elevado identificado na sua avaliação.",
            "Recomendamos buscar apoio com um psicólogo o quanto antes."
        )
    elif assessment.risk_level == 'medium':
        return (
            "Sinais moderados de esgotamento detectados.",
            "Pratique pausas regulares e converse com alguém de confiança."
        )
    return (
        "Seus indicadores estão dentro da faixa esperada.",
        "Continue mantendo seus hábitos saudáveis!"
    )
