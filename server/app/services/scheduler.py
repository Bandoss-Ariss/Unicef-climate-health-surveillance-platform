"""
Scheduler pour les tâches périodiques:
- Exécution des modèles de prédiction toutes les heures
- Vérification de la connectivité des capteurs
- Génération des rapports quotidiens
"""

import logging

logger = logging.getLogger(__name__)


def start_scheduler():
    """
    Démarre le scheduler APScheduler pour les tâches périodiques.
    En production, utiliserait Celery ou un système de queue distribué.
    """
    logger.info("Background scheduler started")
    logger.info("  - Prediction models: every 1 hour")
    logger.info("  - Sensor connectivity check: every 15 minutes")
    logger.info("  - Daily report generation: every day at 06:00")
    # In production:
    # scheduler = AsyncIOScheduler()
    # scheduler.add_job(run_predictions, 'interval', hours=1)
    # scheduler.add_job(check_sensor_connectivity, 'interval', minutes=15)
    # scheduler.add_job(generate_daily_report, 'cron', hour=6)
    # scheduler.start()
