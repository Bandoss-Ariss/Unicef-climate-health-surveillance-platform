"""
Modèles de données pour les capteurs IoT des centres de santé.
"""

from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Float, DateTime, Integer, Enum as SQLEnum
from app.database import Base


class SensorType(str, Enum):
    SOLAR_PRODUCTION = "solar_production"
    BATTERY_LEVEL = "battery_level"
    WATER_LEVEL = "water_level"
    WATER_QUALITY = "water_quality"
    TEMPERATURE_COLD_CHAIN = "temperature_cold_chain"
    AMBIENT_TEMPERATURE = "ambient_temperature"
    HUMIDITY = "humidity"
    PUMP_STATUS = "pump_status"
    ENERGY_CONSUMPTION = "energy_consumption"


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    center_id = Column(String, nullable=False, index=True)
    sensor_type = Column(SQLEnum(SensorType), nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    metadata_json = Column(String, nullable=True)  # JSON string for extra data
