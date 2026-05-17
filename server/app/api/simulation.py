"""
API endpoints pour les modèles de simulation de crise.
"""

from typing import List, Optional
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.simulation_models.crisis_simulator import CrisisSimulator
from app.simulation_models.impact_model import ImpactModel

router = APIRouter()


class SimulationRequest(BaseModel):
    scenario: str = Field(..., description="Type: heat_wave, flood, drought, epidemic")
    intensity: str = Field(default="medium", description="low, medium, high")
    duration_days: int = Field(default=7, ge=1, le=90)
    affected_districts: List[str]
    start_date: str
    include_cascading_effects: bool = Field(default=True)
    monte_carlo_runs: int = Field(default=100, description="Nombre de simulations Monte Carlo")


class TimelineEntry(BaseModel):
    day: int
    energy_status: float
    water_status: float
    health_risk: float
    cold_chain_integrity: float
    population_at_risk: int
    alerts: List[str]
    interventions_needed: List[str]


class SimulationResponse(BaseModel):
    scenario: str
    intensity: str
    duration_days: int
    impacted_centers: int
    children_at_risk: int
    women_at_risk: int
    energy_deficit_kwh: float
    water_deficit_liters: float
    cold_chain_breaks: int
    vaccine_doses_at_risk: int
    estimated_additional_mortality: float
    confidence_interval: List[float]
    timeline: List[TimelineEntry]
    recommendations: List[str]
    resource_needs: dict
    cost_estimate_usd: float


class CascadeAnalysisRequest(BaseModel):
    """Analyse des effets en cascade d'une crise."""
    initial_event: str
    affected_systems: List[str] = Field(default=["energy", "water", "health", "logistics"])
    duration_days: int = 14


class CascadeEffect(BaseModel):
    system: str
    day_of_impact: int
    severity: float
    description: str
    dependent_systems: List[str]


@router.post("/run", response_model=SimulationResponse, summary="Exécuter une simulation")
async def run_simulation(request: SimulationRequest):
    """
    Exécute une simulation de crise complète avec modèle Monte Carlo.
    
    Le simulateur prend en compte:
    - L'état actuel des infrastructures (énergie, eau)
    - La vulnérabilité des populations (enfants <5 ans, femmes enceintes)
    - Les effets en cascade (panne énergie → rupture chaîne froid → perte vaccins)
    - Les capacités de réponse existantes
    """
    simulator = CrisisSimulator()
    result = simulator.run_simulation(
        scenario=request.scenario,
        intensity=request.intensity,
        duration_days=request.duration_days,
        affected_districts=request.affected_districts,
        start_date=request.start_date,
        monte_carlo_runs=request.monte_carlo_runs,
        include_cascading=request.include_cascading_effects,
    )
    return SimulationResponse(**result)


@router.post("/cascade-analysis", response_model=List[CascadeEffect], summary="Analyse effets cascade")
async def cascade_analysis(request: CascadeAnalysisRequest):
    """
    Analyse les effets en cascade d'un événement initial.
    Modélise comment une défaillance dans un système se propage aux autres.
    """
    model = ImpactModel()
    effects = model.analyze_cascade(
        initial_event=request.initial_event,
        systems=request.affected_systems,
        duration_days=request.duration_days,
    )
    return [CascadeEffect(**e) for e in effects]


@router.get("/scenarios", summary="Scénarios disponibles")
async def available_scenarios():
    """Liste des scénarios de simulation pré-configurés."""
    return {
        "scenarios": [
            {
                "id": "heat_wave",
                "name": "Vague de chaleur extrême",
                "description": "Températures >45°C pendant plusieurs jours",
                "typical_duration": "5-10 jours",
                "primary_impacts": ["déshydratation", "rupture chaîne froid", "surcharge CSPS"],
                "historical_frequency": "2-3 fois/an au Sahel",
            },
            {
                "id": "flood",
                "name": "Inondation",
                "description": "Précipitations >80mm/24h causant des inondations",
                "typical_duration": "3-7 jours",
                "primary_impacts": ["accès coupé", "contamination eau", "déplacement populations"],
                "historical_frequency": "1-2 fois/an saison des pluies",
            },
            {
                "id": "drought",
                "name": "Sécheresse prolongée",
                "description": "Déficit pluviométrique >40% sur plusieurs semaines",
                "typical_duration": "30-90 jours",
                "primary_impacts": ["malnutrition", "pénurie eau", "migration"],
                "historical_frequency": "Période de soudure annuelle",
            },
            {
                "id": "epidemic",
                "name": "Épidémie",
                "description": "Dépassement du seuil épidémique pour une pathologie",
                "typical_duration": "14-60 jours",
                "primary_impacts": ["surcharge sanitaire", "mortalité infantile", "pénurie médicaments"],
                "historical_frequency": "Variable selon pathologie",
            },
        ],
        "model_info": {
            "type": "Agent-Based Monte Carlo Simulation",
            "version": "2.0.0",
            "validated_against": "Historical data 2020-2025",
            "accuracy_metric": "MAPE < 15% on validation set",
        },
    }
