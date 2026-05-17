"""
Moteur d'alertes automatiques.
Vérifie les seuils et déclenche des alertes quand les valeurs capteurs
dépassent les limites définies.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sensor_data import SensorType
from app.models.alerts import Alert, AlertSeverity, AlertType

# Seuils d'alerte par type de capteur
THRESHOLDS = {
    SensorType.BATTERY_LEVEL: {
        "critical": {"max": 10, "message": "Niveau batterie critique ({value}%) - Risque de coupure imminente"},
        "high": {"max": 25, "message": "Niveau batterie faible ({value}%) - Intervention nécessaire"},
        "medium": {"max": 40, "message": "Niveau batterie en baisse ({value}%) - Surveillance renforcée"},
    },
    SensorType.TEMPERATURE_COLD_CHAIN: {
        "critical": {"min": -2, "max": 12, "message": "Rupture chaîne du froid ({value}°C) - Vaccins en danger"},
        "high": {"min": 0, "max": 10, "message": "Température chaîne froid hors norme ({value}°C)"},
        "medium": {"min": 1, "max": 9, "message": "Température chaîne froid en limite ({value}°C)"},
    },
    SensorType.WATER_LEVEL: {
        "critical": {"max": 10, "message": "Réservoir eau critique ({value}%) - Pénurie imminente"},
        "high": {"max": 20, "message": "Niveau eau faible ({value}%) - Approvisionnement urgent"},
        "medium": {"max": 35, "message": "Niveau eau en baisse ({value}%) - Planifier ravitaillement"},
    },
    SensorType.SOLAR_PRODUCTION: {
        "critical": {"max": 0.5, "message": "Production solaire quasi nulle ({value} kW) - Panne système"},
        "high": {"max": 1.5, "message": "Production solaire très faible ({value} kW) - Vérifier panneaux"},
    },
    SensorType.AMBIENT_TEMPERATURE: {
        "critical": {"min": 45, "message": "Température extrême ({value}°C) - Alerte canicule"},
        "high": {"min": 42, "message": "Température très élevée ({value}°C) - Risque sanitaire"},
    },
}


async def check_thresholds(
    center_id: str,
    sensor_type: SensorType,
    value: float,
    db: AsyncSession,
) -> Optional[dict]:
    """
    Vérifie si une valeur capteur dépasse les seuils d'alerte.
    Crée une alerte en base si nécessaire.
    """
    if sensor_type not in THRESHOLDS:
        return None

    thresholds = THRESHOLDS[sensor_type]

    for severity_name, config in thresholds.items():
        triggered = False

        if "max" in config and "min" not in config:
            # Alert if value is BELOW max (e.g., battery < 10%)
            if value <= config["max"]:
                triggered = True
        elif "min" in config and "max" not in config:
            # Alert if value is ABOVE min (e.g., temperature > 45°C)
            if value >= config["min"]:
                triggered = True
        elif "min" in config and "max" in config:
            # Alert if value is outside range
            if value < config["min"] or value > config["max"]:
                triggered = True

        if triggered:
            severity = AlertSeverity(severity_name)
            message = config["message"].format(value=round(value, 1))

            # Map sensor type to alert type
            alert_type_map = {
                SensorType.BATTERY_LEVEL: AlertType.ENERGY_FAILURE,
                SensorType.SOLAR_PRODUCTION: AlertType.ENERGY_FAILURE,
                SensorType.TEMPERATURE_COLD_CHAIN: AlertType.COLD_CHAIN_BREAK,
                SensorType.WATER_LEVEL: AlertType.WATER_SHORTAGE,
                SensorType.AMBIENT_TEMPERATURE: AlertType.CLIMATE_EXTREME,
            }

            alert = Alert(
                center_id=center_id,
                alert_type=alert_type_map.get(sensor_type, AlertType.EQUIPMENT_MALFUNCTION),
                severity=severity,
                message=message,
                value_detected=value,
                threshold=config.get("max") or config.get("min"),
            )
            db.add(alert)

            return {
                "severity": severity_name,
                "message": message,
                "center_id": center_id,
                "sensor_type": sensor_type.value,
            }

    return None
