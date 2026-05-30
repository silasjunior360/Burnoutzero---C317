from celery import shared_task


@shared_task
def process_insight_task(employee_id, assessment_id):
    pass
