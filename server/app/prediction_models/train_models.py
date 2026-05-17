"""
Model Training Pipeline
========================

Script d'entraînement des modèles de prédiction.
Exécuté périodiquement (hebdomadaire) pour mettre à jour les modèles
avec les nouvelles données collectées.

Usage:
    python -m app.prediction_models.train_models --model all
    python -m app.prediction_models.train_models --model epidemic
    python -m app.prediction_models.train_models --model energy
    python -m app.prediction_models.train_models --model climate
"""

import numpy as np
import logging
from datetime import datetime

from app.prediction_models.epidemic_predictor import EpidemicPredictor
from app.prediction_models.energy_forecaster import EnergyForecaster
from app.prediction_models.climate_risk_model import ClimateRiskModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def generate_synthetic_training_data(model_type: str, n_samples: int = 10000):
    """
    Génère des données d'entraînement synthétiques.
    
    En production, ces données viendraient de:
    - DHIS2 (données sanitaires)
    - Capteurs IoT (données énergie/eau)
    - APIs météo (ERA5, GFS)
    - Données satellitaires (Sentinel, MODIS)
    """
    rng = np.random.default_rng(42)

    if model_type == "epidemic":
        # Features: [temp, humidity, rainfall, pop_density, prev_cases, vacc_rate, season_sin, season_cos]
        features = np.column_stack([
            rng.uniform(25, 45, n_samples),      # temperature
            rng.uniform(20, 95, n_samples),      # humidity
            rng.uniform(0, 150, n_samples),      # rainfall mm
            rng.uniform(50, 500, n_samples),     # population density
            rng.poisson(30, n_samples),           # previous cases
            rng.uniform(0.3, 0.95, n_samples),   # vaccination rate
            np.sin(rng.uniform(0, 2*np.pi, n_samples)),  # season sin
            np.cos(rng.uniform(0, 2*np.pi, n_samples)),  # season cos
        ])
        # Labels: number of cases (Poisson distributed)
        labels = rng.poisson(
            features[:, 0] * 0.5 + features[:, 2] * 0.3 - features[:, 5] * 20 + 10,
        ).clip(0)

    elif model_type == "energy":
        # Features: [irradiance, cloud_cover, temp, panel_age, dust, hist_prod, day_of_week, hour]
        features = np.column_stack([
            rng.uniform(200, 1000, n_samples),   # solar irradiance W/m²
            rng.uniform(0, 1, n_samples),        # cloud cover fraction
            rng.uniform(20, 45, n_samples),      # temperature
            rng.uniform(0, 5, n_samples),        # panel age years
            rng.uniform(0.5, 1, n_samples),      # dust index
            rng.uniform(10, 50, n_samples),      # historical production kWh
            rng.integers(0, 7, n_samples),       # day of week
            rng.integers(6, 19, n_samples),      # hour of day
        ])
        # Labels: production kWh
        labels = (
            features[:, 0] * 0.005 *
            (1 - features[:, 1] * 0.7) *
            features[:, 4] *
            (1 - features[:, 3] * 0.03) +
            rng.normal(0, 1, n_samples)
        ).clip(0)

    elif model_type == "climate":
        # Features: [ndvi, soil_moisture, precip_forecast, temp_anomaly, wind, hist_events, ...]
        features = np.column_stack([
            rng.uniform(0.1, 0.8, n_samples),    # NDVI
            rng.uniform(0, 1, n_samples),        # soil moisture
            rng.uniform(0, 200, n_samples),      # precipitation forecast mm
            rng.uniform(-5, 10, n_samples),      # temperature anomaly
            rng.uniform(0, 80, n_samples),       # wind speed km/h
            rng.integers(0, 5, n_samples),       # historical events count
            rng.uniform(0, 1, n_samples),        # elevation normalized
            rng.uniform(0, 1, n_samples),        # distance to water body
        ])
        # Labels: risk level (0=low, 1=medium, 2=high, 3=critical)
        risk_score = (
            (1 - features[:, 0]) * 2 +
            features[:, 2] * 0.01 +
            features[:, 3] * 0.3 +
            features[:, 4] * 0.02
        )
        labels = np.digitize(risk_score, bins=[1.5, 2.5, 3.5])

    else:
        raise ValueError(f"Unknown model type: {model_type}")

    return features, labels


def train_all_models():
    """Entraîne tous les modèles."""
    logger.info("=" * 60)
    logger.info(f"MODEL TRAINING PIPELINE - {datetime.now().isoformat()}")
    logger.info("=" * 60)

    results = {}

    # 1. Epidemic Predictor
    logger.info("\n[1/3] Training Epidemic Predictor (LSTM)...")
    features, labels = generate_synthetic_training_data("epidemic", n_samples=45000)
    predictor = EpidemicPredictor()
    result = predictor.train(features, labels)
    results["epidemic"] = result
    logger.info(f"  ✓ Accuracy: {result['accuracy']:.4f}, F1: {result['f1_score']:.4f}")

    # 2. Energy Forecaster
    logger.info("\n[2/3] Training Energy Forecaster (XGBoost + LSTM)...")
    features, labels = generate_synthetic_training_data("energy", n_samples=120000)
    forecaster = EnergyForecaster()
    result = forecaster.train(features, labels)
    results["energy"] = result
    logger.info(f"  ✓ MAE: {result['ensemble_metrics']['mae']:.2f}, R²: {result['ensemble_metrics']['r2']:.4f}")

    # 3. Climate Risk Model
    logger.info("\n[3/3] Training Climate Risk Model (Random Forest)...")
    features, labels = generate_synthetic_training_data("climate", n_samples=28000)
    climate_model = ClimateRiskModel()
    result = climate_model.train(features, labels)
    results["climate"] = result
    logger.info(f"  ✓ AUC-ROC: {result['metrics']['auc_roc']:.4f}, F1: {result['metrics']['f1']:.4f}")

    logger.info("\n" + "=" * 60)
    logger.info("ALL MODELS TRAINED SUCCESSFULLY")
    logger.info("=" * 60)

    return results


if __name__ == "__main__":
    train_all_models()
