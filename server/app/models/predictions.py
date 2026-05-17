"""
Modèles de données pour les résultats de prédiction IA.
"""

from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, Integer, Text
from app.database import Base


class PredictionResult(Base):
    __tablename__ = "prediction_results"

    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String, nullable=False, index=True)
    center_id = Column(String, nullable=True)
    district = Column(String, nullable=True)
    prediction_type = Column(String, nullable=False)  # epidemic, energy, climate
    predicted_value = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    horizon_days = Column(Integer, nullable=False)
    features_used = Column(Text, nullable=True)  # JSON
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    target_date = Column(DateTime, nullable=False)
