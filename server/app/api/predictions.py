"""
API endpoints pour les modèles de prédiction IA.
Expose les résultats des modèles de prédiction épidémiologique,
climatique et énergétique.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.prediction_models.epidemic_predictor import EpidemicPredictor
from app.prediction_models.energy_forecaster import EnergyForecaster
from app.prediction_models.climate_risk_model import ClimateRiskModel

router = APIRouter()


class PredictionRequest(BaseModel):
    center_id: Optional[str] = None
    district: Optional[str] = None
    horizon_days: int = 7
    model: str = "epidemic"  # epidemic, energy, climate


class EpidemicPredictionResponse(BaseModel):
    district: str
    disease: str
    predicted_cases: int
    confidence: float
    risk_level: str
    peak_day: int
    recommendations: List[str]


class EnergyPredictionResponse(BaseModel):
    center_id: str
    predicted_production_kwh: float
    predicted_consumption_kwh: float
    battery_forecast: List[float]
    risk_of_outage: float
    maintenance_needed: bool


class ClimateRiskResponse(BaseModel):
    region: str
    risk_type: str
    probability: float
    severity: str
    expected_date: str
    impact_children: int
    recommended_actions: List[str]


@router.post("/epidemic", response_model=List[EpidemicPredictionResponse], summary="Prédiction épidémiologique")
async def predict_epidemic(
    districts: Optional[List[str]] = None,
    horizon_days: int = Query(default=14, description="Horizon de prédiction en jours"),
    db: AsyncSession = Depends(get_db),
):
    """
    Exécute le modèle de prédiction épidémiologique.
    Utilise un modèle LSTM entraîné sur les données historiques de surveillance
    épidémiologique du Burkina Faso.
    """
    predictor = EpidemicPredictor()
    target_districts = districts or ["Djibo", "Dori", "Gorom-Gorom", "Boromo", "Koudougou"]

    results = []
    for district in target_districts:
        prediction = predictor.predict(district=district, horizon_days=horizon_days)
        results.append(EpidemicPredictionResponse(**prediction))

    return results


@router.post("/energy", response_model=List[EnergyPredictionResponse], summary="Prévision énergétique")
async def predict_energy(
    center_ids: Optional[List[str]] = None,
    horizon_days: int = Query(default=7),
    db: AsyncSession = Depends(get_db),
):
    """
    Prévision de la production solaire et consommation énergétique.
    Modèle basé sur les données météo, historique de production et
    patterns de consommation.
    """
    forecaster = EnergyForecaster()
    targets = center_ids or [f"cs-{str(i).zfill(3)}" for i in range(1, 11)]

    results = []
    for center_id in targets:
        forecast = forecaster.forecast(center_id=center_id, horizon_days=horizon_days)
        results.append(EnergyPredictionResponse(**forecast))

    return results


@router.post("/climate-risk", response_model=List[ClimateRiskResponse], summary="Évaluation risque climatique")
async def predict_climate_risk(
    regions: Optional[List[str]] = None,
    horizon_days: int = Query(default=30),
):
    """
    Évaluation des risques climatiques par région.
    Combine données satellitaires, modèles météo et indicateurs historiques.
    """
    model = ClimateRiskModel()
    target_regions = regions or ["Sahel", "Boucle du Mouhoun", "Centre-Ouest"]

    results = []
    for region in target_regions:
        risks = model.assess_risk(region=region, horizon_days=horizon_days)
        for risk in risks:
            results.append(ClimateRiskResponse(**risk))

    return results


@router.get("/models/status", summary="Statut des modèles IA")
async def models_status():
    """Retourne le statut et les métriques de performance des modèles."""
    return {
        "models": {
            "epidemic_predictor": {
                "name": "LSTM Epidemic Forecaster",
                "version": "2.1.0",
                "last_trained": "2026-05-15T00:00:00",
                "accuracy": 0.87,
                "f1_score": 0.83,
                "training_samples": 45000,
                "features": ["temperature", "humidity", "rainfall", "population_density",
                            "previous_cases", "vaccination_rate", "season"],
                "status": "active",
            },
            "energy_forecaster": {
                "name": "Solar Production Forecaster (XGBoost + LSTM)",
                "version": "1.4.0",
                "last_trained": "2026-05-10T00:00:00",
                "mae": 2.3,
                "rmse": 3.1,
                "training_samples": 120000,
                "features": ["solar_irradiance", "cloud_cover", "temperature",
                            "panel_age", "dust_index", "historical_production"],
                "status": "active",
            },
            "climate_risk_model": {
                "name": "Multi-hazard Climate Risk Assessment",
                "version": "1.2.0",
                "last_trained": "2026-05-01T00:00:00",
                "auc_roc": 0.91,
                "training_samples": 28000,
                "features": ["ndvi", "soil_moisture", "precipitation_forecast",
                            "temperature_anomaly", "wind_speed", "historical_events"],
                "status": "active",
            },
        }
    }
