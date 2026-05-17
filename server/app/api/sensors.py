"""
API endpoints pour la réception des données capteurs IoT.
Reçoit les données de tous les capteurs des centres de santé:
- Production solaire (kW)
- Niveau batterie (%)
- Niveau eau réservoir (%)
- Température chaîne du froid (°C)
- Température ambiante (°C)
- Statut pompe
- Consommation énergétique (kW)
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.sensor_data import SensorReading, SensorType
from app.services.alert_engine import check_thresholds

router = APIRouter()


# ============ Schemas ============

class SensorDataInput(BaseModel):
    center_id: str = Field(..., description="ID du centre de santé (ex: cs-001)")
    sensor_type: SensorType
    value: float
    unit: str = Field(..., description="Unité de mesure (kW, %, °C, L, etc.)")
    timestamp: Optional[datetime] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    metadata: Optional[dict] = None


class SensorBatchInput(BaseModel):
    """Envoi groupé de données capteurs (typique pour les transmissions IoT)."""
    readings: List[SensorDataInput]


class SensorDataResponse(BaseModel):
    id: int
    center_id: str
    sensor_type: SensorType
    value: float
    unit: str
    timestamp: datetime

    class Config:
        from_attributes = True


class SensorStats(BaseModel):
    center_id: str
    sensor_type: str
    avg_value: float
    min_value: float
    max_value: float
    reading_count: int
    last_reading: float
    last_timestamp: datetime


# ============ Endpoints ============

@router.post("/data", response_model=dict, summary="Recevoir une lecture capteur")
async def receive_sensor_data(data: SensorDataInput, db: AsyncSession = Depends(get_db)):
    """
    Reçoit une lecture individuelle d'un capteur IoT.
    Déclenche automatiquement la vérification des seuils d'alerte.
    """
    reading = SensorReading(
        center_id=data.center_id,
        sensor_type=data.sensor_type,
        value=data.value,
        unit=data.unit,
        timestamp=data.timestamp or datetime.utcnow(),
        latitude=data.latitude,
        longitude=data.longitude,
        metadata_json=str(data.metadata) if data.metadata else None,
    )
    db.add(reading)
    await db.commit()
    await db.refresh(reading)

    # Check alert thresholds
    alert = await check_thresholds(data.center_id, data.sensor_type, data.value, db)

    return {
        "status": "received",
        "reading_id": reading.id,
        "alert_triggered": alert is not None,
        "alert": alert,
    }


@router.post("/batch", response_model=dict, summary="Envoi groupé de données capteurs")
async def receive_batch_data(batch: SensorBatchInput, db: AsyncSession = Depends(get_db)):
    """
    Reçoit un lot de lectures capteurs (optimisé pour les transmissions IoT
    avec connectivité intermittente).
    """
    readings_saved = 0
    alerts_triggered = 0

    for data in batch.readings:
        reading = SensorReading(
            center_id=data.center_id,
            sensor_type=data.sensor_type,
            value=data.value,
            unit=data.unit,
            timestamp=data.timestamp or datetime.utcnow(),
            latitude=data.latitude,
            longitude=data.longitude,
            metadata_json=str(data.metadata) if data.metadata else None,
        )
        db.add(reading)
        readings_saved += 1

        alert = await check_thresholds(data.center_id, data.sensor_type, data.value, db)
        if alert:
            alerts_triggered += 1

    await db.commit()

    return {
        "status": "batch_received",
        "readings_saved": readings_saved,
        "alerts_triggered": alerts_triggered,
    }


@router.get("/data/{center_id}", response_model=List[SensorDataResponse], summary="Historique capteur")
async def get_sensor_history(
    center_id: str,
    sensor_type: Optional[SensorType] = None,
    hours: int = Query(default=24, description="Nombre d'heures d'historique"),
    db: AsyncSession = Depends(get_db),
):
    """Récupère l'historique des lectures pour un centre donné."""
    since = datetime.utcnow() - timedelta(hours=hours)
    query = select(SensorReading).where(
        SensorReading.center_id == center_id,
        SensorReading.timestamp >= since,
    )
    if sensor_type:
        query = query.where(SensorReading.sensor_type == sensor_type)
    query = query.order_by(SensorReading.timestamp.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/stats/{center_id}", response_model=List[SensorStats], summary="Statistiques capteur")
async def get_sensor_stats(
    center_id: str,
    hours: int = Query(default=24),
    db: AsyncSession = Depends(get_db),
):
    """Statistiques agrégées par type de capteur pour un centre."""
    since = datetime.utcnow() - timedelta(hours=hours)

    query = select(
        SensorReading.center_id,
        SensorReading.sensor_type,
        func.avg(SensorReading.value).label("avg_value"),
        func.min(SensorReading.value).label("min_value"),
        func.max(SensorReading.value).label("max_value"),
        func.count(SensorReading.id).label("reading_count"),
    ).where(
        SensorReading.center_id == center_id,
        SensorReading.timestamp >= since,
    ).group_by(SensorReading.sensor_type)

    result = await db.execute(query)
    rows = result.all()

    stats = []
    for row in rows:
        # Get last reading
        last_query = select(SensorReading).where(
            SensorReading.center_id == center_id,
            SensorReading.sensor_type == row.sensor_type,
        ).order_by(SensorReading.timestamp.desc()).limit(1)
        last_result = await db.execute(last_query)
        last = last_result.scalar_one_or_none()

        stats.append(SensorStats(
            center_id=center_id,
            sensor_type=row.sensor_type.value,
            avg_value=round(row.avg_value, 2),
            min_value=round(row.min_value, 2),
            max_value=round(row.max_value, 2),
            reading_count=row.reading_count,
            last_reading=last.value if last else 0,
            last_timestamp=last.timestamp if last else datetime.utcnow(),
        ))

    return stats


@router.get("/realtime", response_model=dict, summary="Données temps réel tous centres")
async def get_realtime_data(db: AsyncSession = Depends(get_db)):
    """
    Retourne les dernières lectures de chaque capteur pour tous les centres.
    Utilisé par le dashboard pour l'affichage temps réel.
    """
    centers = ["cs-001", "cs-002", "cs-003", "cs-004", "cs-005",
               "cs-006", "cs-007", "cs-008", "cs-009", "cs-010"]

    realtime = {}
    for center_id in centers:
        center_data = {}
        for sensor_type in SensorType:
            query = select(SensorReading).where(
                SensorReading.center_id == center_id,
                SensorReading.sensor_type == sensor_type,
            ).order_by(SensorReading.timestamp.desc()).limit(1)
            result = await db.execute(query)
            reading = result.scalar_one_or_none()
            if reading:
                center_data[sensor_type.value] = {
                    "value": reading.value,
                    "unit": reading.unit,
                    "timestamp": reading.timestamp.isoformat(),
                }
        realtime[center_id] = center_data

    return {"timestamp": datetime.utcnow().isoformat(), "centers": realtime}
