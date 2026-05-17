"""
UNICEF Burkina Faso - Climate-Health Platform Backend
=====================================================
Serveur principal FastAPI pour la réception des données capteurs,
les modèles de prédiction IA, et le moteur de traduction multilingue.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import sensors, alerts, predictions, translations, simulation
from app.database import engine, Base
from app.services.scheduler import start_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    # Start background scheduler for predictions
    start_scheduler()
    yield
    # Cleanup


app = FastAPI(
    title="UNICEF Climate-Health Platform API",
    description="""
    Backend API pour la plateforme d'alerte précoce climat-santé.
    
    ## Fonctionnalités
    - **Capteurs IoT**: Réception et stockage des données capteurs (énergie, eau, température)
    - **Prédictions IA**: Modèles de prédiction épidémiologique et climatique
    - **Traduction**: Moteur de traduction multilingue (Français, Mooré, Dioula, Fulfuldé)
    - **Simulation**: Modèles de simulation de scénarios de crise
    - **Alertes**: Système d'alerte automatique basé sur les seuils
    """,
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(sensors.router, prefix="/api/v1/sensors", tags=["Capteurs IoT"])
app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["Alertes"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["Prédictions IA"])
app.include_router(translations.router, prefix="/api/v1/translations", tags=["Traduction"])
app.include_router(simulation.router, prefix="/api/v1/simulation", tags=["Simulation"])


@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "UNICEF Climate-Health Platform API",
        "version": "1.0.0",
        "status": "operational",
        "modules": {
            "sensors": "active",
            "predictions": "active",
            "translation_engine": "active",
            "simulation_models": "active",
        }
    }


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "database": "connected", "models_loaded": True}
