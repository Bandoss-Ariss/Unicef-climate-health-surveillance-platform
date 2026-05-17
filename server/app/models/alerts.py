"""
Modèles de données pour les alertes automatiques.
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, DateTime, Integer, Enum as SQLEnum, Text
from app.database import Base


class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(str, Enum):
    ENERGY_FAILURE = "energy_failure"
    COLD_CHAIN_BREAK = "cold_chain_break"
    WATER_SHORTAGE = "water_shortage"
    EPIDEMIC_THRESHOLD = "epidemic_threshold"
    CLIMATE_EXTREME = "climate_extreme"
    EQUIPMENT_MALFUNCTION = "equipment_malfunction"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    center_id = Column(String, nullable=False, index=True)
    alert_type = Column(SQLEnum(AlertType), nullable=False)
    severity = Column(SQLEnum(AlertSeverity), nullable=False)
    message = Column(Text, nullable=False)
    value_detected = Column(Float, nullable=True)
    threshold = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    resolved = Column(Integer, default=0)
    resolved_at = Column(DateTime, nullable=True)
