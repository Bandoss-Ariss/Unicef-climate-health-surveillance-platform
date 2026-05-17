"""
API endpoints pour le système d'alertes automatiques.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.alerts import Alert, AlertSeverity, AlertType

router = APIRouter()


class AlertResponse(BaseModel):
    id: int
    center_id: str
    alert_type: str
    severity: str
    message: str
    value_detected: Optional[float]
    threshold: Optional[float]
    timestamp: datetime
    resolved: bool

    class Config:
        from_attributes = True


class AlertCreate(BaseModel):
    center_id: str
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    value_detected: Optional[float] = None
    threshold: Optional[float] = None


@router.get("/", response_model=List[AlertResponse], summary="Liste des alertes")
async def get_alerts(
    center_id: Optional[str] = None,
    severity: Optional[AlertSeverity] = None,
    resolved: Optional[bool] = None,
    hours: int = Query(default=72, description="Heures d'historique"),
    db: AsyncSession = Depends(get_db),
):
    """Récupère les alertes avec filtres optionnels."""
    since = datetime.utcnow() - timedelta(hours=hours)
    query = select(Alert).where(Alert.timestamp >= since)

    if center_id:
        query = query.where(Alert.center_id == center_id)
    if severity:
        query = query.where(Alert.severity == severity)
    if resolved is not None:
        query = query.where(Alert.resolved == (1 if resolved else 0))

    query = query.order_by(Alert.timestamp.desc())
    result = await db.execute(query)
    alerts = result.scalars().all()

    return [
        AlertResponse(
            id=a.id,
            center_id=a.center_id,
            alert_type=a.alert_type.value,
            severity=a.severity.value,
            message=a.message,
            value_detected=a.value_detected,
            threshold=a.threshold,
            timestamp=a.timestamp,
            resolved=bool(a.resolved),
        )
        for a in alerts
    ]


@router.post("/", response_model=dict, summary="Créer une alerte manuelle")
async def create_alert(alert_data: AlertCreate, db: AsyncSession = Depends(get_db)):
    """Crée une alerte manuellement (utilisé par les agents de santé)."""
    alert = Alert(
        center_id=alert_data.center_id,
        alert_type=alert_data.alert_type,
        severity=alert_data.severity,
        message=alert_data.message,
        value_detected=alert_data.value_detected,
        threshold=alert_data.threshold,
    )
    db.add(alert)
    await db.commit()
    await db.refresh(alert)
    return {"status": "created", "alert_id": alert.id}


@router.patch("/{alert_id}/resolve", summary="Résoudre une alerte")
async def resolve_alert(alert_id: int, db: AsyncSession = Depends(get_db)):
    """Marque une alerte comme résolue."""
    query = select(Alert).where(Alert.id == alert_id)
    result = await db.execute(query)
    alert = result.scalar_one_or_none()
    if not alert:
        return {"error": "Alert not found"}

    alert.resolved = 1
    alert.resolved_at = datetime.utcnow()
    await db.commit()
    return {"status": "resolved", "alert_id": alert_id}


@router.get("/summary", summary="Résumé des alertes")
async def alerts_summary(db: AsyncSession = Depends(get_db)):
    """Résumé des alertes actives par sévérité et type."""
    query = select(Alert).where(Alert.resolved == 0)
    result = await db.execute(query)
    active_alerts = result.scalars().all()

    by_severity = {}
    by_type = {}
    by_center = {}

    for alert in active_alerts:
        sev = alert.severity.value
        by_severity[sev] = by_severity.get(sev, 0) + 1
        atype = alert.alert_type.value
        by_type[atype] = by_type.get(atype, 0) + 1
        by_center[alert.center_id] = by_center.get(alert.center_id, 0) + 1

    return {
        "total_active": len(active_alerts),
        "by_severity": by_severity,
        "by_type": by_type,
        "by_center": by_center,
    }
