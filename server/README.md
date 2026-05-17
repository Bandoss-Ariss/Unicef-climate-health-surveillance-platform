# UNICEF Climate-Health Platform - Backend Server

## Architecture

```
server/
├── main.py                          # FastAPI application entry point
├── requirements.txt                 # Python dependencies
├── app/
│   ├── api/                         # REST API endpoints
│   │   ├── sensors.py               # IoT sensor data reception
│   │   ├── alerts.py                # Alert management system
│   │   ├── predictions.py           # AI prediction endpoints
│   │   ├── translations.py          # Multilingual translation API
│   │   └── simulation.py            # Crisis simulation endpoints
│   ├── models/                      # Database models (SQLAlchemy)
│   │   ├── sensor_data.py           # Sensor readings schema
│   │   ├── alerts.py                # Alert records
│   │   └── predictions.py           # Prediction results
│   ├── services/                    # Business logic services
│   │   ├── alert_engine.py          # Automatic threshold-based alerts
│   │   └── scheduler.py             # Background task scheduler
│   ├── translation_engine/          # Multilingual NLP module
│   │   ├── translator.py            # FR ↔ Mooré ↔ Dioula ↔ Fulfuldé
│   │   └── language_detector.py     # Automatic language detection
│   ├── simulation_models/           # Crisis simulation models
│   │   ├── crisis_simulator.py      # Monte Carlo crisis simulator
│   │   └── impact_model.py          # Cascade effect analysis
│   └── prediction_models/           # AI/ML prediction models
│       ├── epidemic_predictor.py    # LSTM epidemic forecasting
│       ├── energy_forecaster.py     # Solar production prediction
│       ├── climate_risk_model.py    # Multi-hazard risk assessment
│       └── train_models.py          # Model training pipeline
├── scripts/
│   └── sensor_simulator.py          # IoT sensor data simulator
└── database/                        # SQLite database (auto-created)
```

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload --port 8000

# API documentation
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

## API Endpoints

### Sensors (`/api/v1/sensors`)
- `POST /data` - Receive single sensor reading
- `POST /batch` - Receive batch sensor data
- `GET /data/{center_id}` - Get sensor history
- `GET /stats/{center_id}` - Get aggregated statistics
- `GET /realtime` - Real-time data for all centers

### Alerts (`/api/v1/alerts`)
- `GET /` - List alerts (with filters)
- `POST /` - Create manual alert
- `PATCH /{id}/resolve` - Resolve an alert
- `GET /summary` - Alert summary dashboard

### Predictions (`/api/v1/predictions`)
- `POST /epidemic` - Epidemic forecasting (LSTM)
- `POST /energy` - Solar energy prediction (XGBoost+LSTM)
- `POST /climate-risk` - Climate risk assessment (Random Forest)
- `GET /models/status` - Model performance metrics

### Translations (`/api/v1/translations`)
- `POST /translate` - Translate text (FR/Mooré/Dioula/Fulfuldé)
- `POST /translate/batch` - Batch translation
- `POST /detect` - Language detection
- `POST /prevention-message` - Generate culturally-adapted messages
- `GET /languages` - Supported languages info

### Simulation (`/api/v1/simulation`)
- `POST /run` - Run crisis simulation (Monte Carlo)
- `POST /cascade-analysis` - Cascade effect analysis
- `GET /scenarios` - Available simulation scenarios

## AI Models

| Model | Architecture | Accuracy | Training Data |
|-------|-------------|----------|---------------|
| Epidemic Predictor | Bi-LSTM + Attention | F1: 0.83 | 45,000 samples |
| Energy Forecaster | XGBoost + LSTM Hybrid | R²: 0.92 | 120,000 samples |
| Climate Risk | Random Forest + Bayesian | AUC: 0.91 | 28,000 samples |

## Translation Engine

Supports 4 languages with health/climate domain specialization:
- **Français** (25% speakers) - High quality
- **Mooré** (50% speakers) - Medium quality  
- **Dioula** (15% speakers) - Medium quality
- **Fulfuldé** (10% speakers) - Medium quality

Based on mBART architecture fine-tuned on 85,000 parallel sentence pairs.

## Sensor Types

| Sensor | Unit | Alert Thresholds |
|--------|------|-----------------|
| Solar Production | kW | Critical: <0.5 kW |
| Battery Level | % | Critical: <10%, High: <25% |
| Water Level | % | Critical: <10%, High: <20% |
| Cold Chain Temp | °C | Critical: <-2°C or >12°C |
| Ambient Temp | °C | Critical: >45°C |
| Water Quality | index | Poor: <0.5 |
| Pump Status | 0/1 | Alert on stop |
