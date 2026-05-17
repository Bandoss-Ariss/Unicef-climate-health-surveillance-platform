"""
Crisis Simulator - Simulateur de crise Monte Carlo
====================================================

Simule l'impact de différents scénarios de crise sur les centres de santé,
les infrastructures et les populations vulnérables.

Méthodologie:
1. Initialisation de l'état des systèmes (énergie, eau, santé)
2. Application du choc selon le scénario et l'intensité
3. Propagation des effets en cascade
4. Simulation Monte Carlo (N runs) pour intervalles de confiance
5. Agrégation des résultats et génération de recommandations
"""

import numpy as np
from typing import List, Dict
from datetime import datetime, timedelta


# Paramètres des centres de santé (état initial)
CENTER_PARAMS = {
    "cs-001": {"battery": 87, "water": 72, "cold_chain": 4.2, "pop_covered": 8500},
    "cs-002": {"battery": 92, "water": 85, "cold_chain": 3.8, "pop_covered": 12000},
    "cs-003": {"battery": 35, "water": 28, "cold_chain": 6.8, "pop_covered": 6500},
    "cs-004": {"battery": 78, "water": 65, "cold_chain": 4.0, "pop_covered": 7800},
    "cs-005": {"battery": 42, "water": 45, "cold_chain": 5.5, "pop_covered": 11000},
    "cs-006": {"battery": 5, "water": 8, "cold_chain": 12.5, "pop_covered": 5200},
    "cs-007": {"battery": 95, "water": 55, "cold_chain": 3.5, "pop_covered": 9500},
    "cs-008": {"battery": 88, "water": 70, "cold_chain": 4.1, "pop_covered": 15000},
    "cs-009": {"battery": 60, "water": 32, "cold_chain": 5.8, "pop_covered": 7200},
    "cs-010": {"battery": 82, "water": 58, "cold_chain": 4.3, "pop_covered": 8300},
}

DISTRICT_TO_CENTERS = {
    "Koudougou": ["cs-001"],
    "Réo": ["cs-002"],
    "Sapouy": ["cs-003"],
    "Dédougou": ["cs-004"],
    "Boromo": ["cs-005"],
    "Nouna": ["cs-006"],
    "Djibo": ["cs-007"],
    "Dori": ["cs-008"],
    "Gorom-Gorom": ["cs-009"],
    "Sebba": ["cs-010"],
}

# Impact factors by scenario type
SCENARIO_IMPACTS = {
    "heat_wave": {
        "energy_drain_per_day": 8,  # % battery drain increase
        "water_consumption_increase": 1.5,  # multiplier
        "cold_chain_risk": 0.15,  # probability of break per day
        "health_risk_base": 0.3,
        "mortality_factor": 0.002,
    },
    "flood": {
        "energy_drain_per_day": 5,
        "water_contamination_risk": 0.4,
        "access_cut_probability": 0.6,
        "cold_chain_risk": 0.08,
        "health_risk_base": 0.4,
        "mortality_factor": 0.003,
    },
    "drought": {
        "energy_drain_per_day": 3,
        "water_depletion_rate": 5,  # % per day
        "malnutrition_risk": 0.25,
        "cold_chain_risk": 0.05,
        "health_risk_base": 0.35,
        "mortality_factor": 0.004,
    },
    "epidemic": {
        "energy_drain_per_day": 6,
        "water_consumption_increase": 1.3,
        "cold_chain_risk": 0.1,
        "health_risk_base": 0.6,
        "case_doubling_time": 5,  # days
        "mortality_factor": 0.008,
    },
}

INTENSITY_MULTIPLIERS = {"low": 0.4, "medium": 0.7, "high": 1.0}


class CrisisSimulator:
    """
    Simulateur de crise multi-scénarios avec Monte Carlo.
    
    Modélise:
    - Dégradation progressive des systèmes (énergie, eau)
    - Effets en cascade (panne énergie → rupture chaîne froid → perte vaccins)
    - Impact sur les populations vulnérables (enfants <5 ans, femmes enceintes)
    - Capacité de réponse et besoins en ressources
    """

    def __init__(self, seed: int = 42):
        self.rng = np.random.default_rng(seed)

    def run_simulation(
        self,
        scenario: str,
        intensity: str,
        duration_days: int,
        affected_districts: List[str],
        start_date: str,
        monte_carlo_runs: int = 100,
        include_cascading: bool = True,
    ) -> Dict:
        """Exécute la simulation complète."""
        
        impact_params = SCENARIO_IMPACTS.get(scenario, SCENARIO_IMPACTS["heat_wave"])
        multiplier = INTENSITY_MULTIPLIERS.get(intensity, 0.7)

        # Identify affected centers
        affected_centers = []
        for district in affected_districts:
            affected_centers.extend(DISTRICT_TO_CENTERS.get(district, []))

        # Run Monte Carlo simulations
        all_timelines = []
        all_outcomes = []

        for run in range(monte_carlo_runs):
            timeline, outcome = self._simulate_single_run(
                affected_centers, impact_params, multiplier, duration_days, include_cascading
            )
            all_timelines.append(timeline)
            all_outcomes.append(outcome)

        # Aggregate results
        avg_timeline = self._aggregate_timelines(all_timelines, duration_days)
        avg_outcome = self._aggregate_outcomes(all_outcomes)

        # Calculate confidence intervals
        children_values = [o["children_at_risk"] for o in all_outcomes]
        ci_lower = float(np.percentile(children_values, 5))
        ci_upper = float(np.percentile(children_values, 95))

        # Generate recommendations
        recommendations = self._generate_recommendations(scenario, intensity, avg_outcome)

        # Resource needs estimation
        resource_needs = self._estimate_resources(scenario, avg_outcome, duration_days)

        return {
            "scenario": scenario,
            "intensity": intensity,
            "duration_days": duration_days,
            "impacted_centers": len(affected_centers),
            "children_at_risk": int(avg_outcome["children_at_risk"]),
            "women_at_risk": int(avg_outcome["children_at_risk"] * 0.3),
            "energy_deficit_kwh": round(avg_outcome["energy_deficit"], 1),
            "water_deficit_liters": round(avg_outcome["water_deficit"], 0),
            "cold_chain_breaks": int(avg_outcome["cold_chain_breaks"]),
            "vaccine_doses_at_risk": int(avg_outcome["cold_chain_breaks"] * 150),
            "estimated_additional_mortality": round(avg_outcome["mortality_estimate"], 4),
            "confidence_interval": [ci_lower, ci_upper],
            "timeline": avg_timeline,
            "recommendations": recommendations,
            "resource_needs": resource_needs,
            "cost_estimate_usd": round(resource_needs.get("total_cost", 0), 0),
        }

    def _simulate_single_run(
        self,
        centers: List[str],
        params: Dict,
        multiplier: float,
        duration: int,
        cascading: bool,
    ) -> tuple:
        """Simule un seul run Monte Carlo."""
        
        # Initialize center states
        states = {}
        for cid in centers:
            cp = CENTER_PARAMS.get(cid, {"battery": 70, "water": 50, "cold_chain": 5, "pop_covered": 8000})
            states[cid] = {
                "battery": float(cp["battery"]),
                "water": float(cp["water"]),
                "cold_chain_temp": float(cp["cold_chain"]),
                "pop_covered": cp["pop_covered"],
            }

        timeline = []
        cold_chain_breaks = 0
        total_energy_deficit = 0
        total_water_deficit = 0

        for day in range(duration):
            day_energy = 0
            day_water = 0
            day_health_risk = 0
            day_cold_chain = 0
            day_pop_at_risk = 0
            alerts = []
            interventions = []

            progress = day / duration
            # Bell curve intensity (peaks in middle)
            day_intensity = np.sin(progress * np.pi) * multiplier

            for cid, state in states.items():
                # Energy degradation
                drain = params.get("energy_drain_per_day", 5) * day_intensity
                drain += self.rng.normal(0, 2)  # stochastic noise
                state["battery"] = max(0, state["battery"] - drain)

                if state["battery"] < 20:
                    total_energy_deficit += drain * 0.5
                    day_energy += 1

                # Water degradation
                water_drain = params.get("water_depletion_rate", 3) * day_intensity
                water_drain *= params.get("water_consumption_increase", 1.0)
                water_drain += self.rng.normal(0, 1.5)
                state["water"] = max(0, state["water"] - water_drain)

                if state["water"] < 20:
                    total_water_deficit += water_drain * 50  # liters
                    day_water += 1

                # Cold chain (cascade from energy)
                if cascading and state["battery"] < 15:
                    temp_rise = self.rng.uniform(0.5, 2.0)
                    state["cold_chain_temp"] += temp_rise

                cold_chain_risk = params.get("cold_chain_risk", 0.1) * day_intensity
                if self.rng.random() < cold_chain_risk or state["cold_chain_temp"] > 8:
                    cold_chain_breaks += 1
                    day_cold_chain += 1

                # Health risk
                health_risk = params.get("health_risk_base", 0.3) * day_intensity
                if state["water"] < 15:
                    health_risk *= 1.5
                day_health_risk += health_risk
                day_pop_at_risk += int(state["pop_covered"] * health_risk * 0.4)

            n_centers = len(states) or 1
            timeline.append({
                "day": day + 1,
                "energy_status": round(np.mean([s["battery"] for s in states.values()]), 1),
                "water_status": round(np.mean([s["water"] for s in states.values()]), 1),
                "health_risk": round((day_health_risk / n_centers) * 100, 1),
                "cold_chain_integrity": round(max(0, 100 - day_cold_chain * 20), 1),
                "population_at_risk": day_pop_at_risk,
                "alerts": alerts,
                "interventions_needed": interventions,
            })

        # Final outcome
        total_pop = sum(s["pop_covered"] for s in states.values())
        children_ratio = 0.42  # ~42% under 5 in affected areas
        mortality_factor = params.get("mortality_factor", 0.003) * multiplier

        outcome = {
            "children_at_risk": total_pop * children_ratio * multiplier * 0.6,
            "energy_deficit": total_energy_deficit,
            "water_deficit": total_water_deficit,
            "cold_chain_breaks": cold_chain_breaks,
            "mortality_estimate": total_pop * children_ratio * mortality_factor,
        }

        return timeline, outcome

    def _aggregate_timelines(self, all_timelines: List, duration: int) -> List[Dict]:
        """Agrège les timelines de tous les runs Monte Carlo."""
        aggregated = []
        for day in range(duration):
            day_data = [t[day] for t in all_timelines if day < len(t)]
            if not day_data:
                continue
            aggregated.append({
                "day": day + 1,
                "energy_status": round(np.mean([d["energy_status"] for d in day_data]), 1),
                "water_status": round(np.mean([d["water_status"] for d in day_data]), 1),
                "health_risk": round(np.mean([d["health_risk"] for d in day_data]), 1),
                "cold_chain_integrity": round(np.mean([d["cold_chain_integrity"] for d in day_data]), 1),
                "population_at_risk": int(np.mean([d["population_at_risk"] for d in day_data])),
                "alerts": [],
                "interventions_needed": [],
            })
        return aggregated

    def _aggregate_outcomes(self, outcomes: List[Dict]) -> Dict:
        """Agrège les résultats de tous les runs."""
        return {
            "children_at_risk": np.mean([o["children_at_risk"] for o in outcomes]),
            "energy_deficit": np.mean([o["energy_deficit"] for o in outcomes]),
            "water_deficit": np.mean([o["water_deficit"] for o in outcomes]),
            "cold_chain_breaks": np.mean([o["cold_chain_breaks"] for o in outcomes]),
            "mortality_estimate": np.mean([o["mortality_estimate"] for o in outcomes]),
        }

    def _generate_recommendations(self, scenario: str, intensity: str, outcome: Dict) -> List[str]:
        """Génère des recommandations basées sur les résultats."""
        recs = []

        if outcome["energy_deficit"] > 100:
            recs.append("Déployer des groupes électrogènes de secours dans les centres critiques")
            recs.append("Pré-positionner des batteries de rechange")

        if outcome["water_deficit"] > 5000:
            recs.append("Organiser un approvisionnement d'urgence en eau par citerne")
            recs.append("Activer les forages de secours dans les districts affectés")

        if outcome["cold_chain_breaks"] > 2:
            recs.append("Transférer les vaccins vers les centres avec chaîne du froid intacte")
            recs.append("Déployer des glacières passives de secours")

        if outcome["children_at_risk"] > 5000:
            recs.append("Déployer les équipes mobiles de santé dans les zones affectées")
            recs.append("Pré-positionner les kits d'urgence pédiatriques")

        # Scenario-specific
        if scenario == "heat_wave":
            recs.extend([
                "Distribuer 10000 sachets de SRO aux agents communautaires",
                "Activer les points d'eau d'urgence dans les communautés",
            ])
        elif scenario == "flood":
            recs.extend([
                "Sécuriser les stocks de médicaments en hauteur",
                "Préparer les kits choléra dans les centres à risque",
            ])
        elif scenario == "epidemic":
            recs.extend([
                "Activer le plan de riposte épidémique national",
                "Renforcer la surveillance active dans les communautés",
            ])

        return recs[:8]  # Max 8 recommendations

    def _estimate_resources(self, scenario: str, outcome: Dict, duration: int) -> Dict:
        """Estime les besoins en ressources et coûts."""
        base_costs = {
            "generators": 2500,  # USD per unit
            "water_tanker_trip": 150,
            "sro_packet": 0.5,
            "emergency_kit": 45,
            "mobile_team_day": 300,
            "cold_chain_repair": 800,
        }

        needs = {
            "generators_needed": max(0, int(outcome["energy_deficit"] / 200)),
            "water_tanker_trips": max(0, int(outcome["water_deficit"] / 5000)),
            "sro_packets": int(outcome["children_at_risk"] * 0.3),
            "emergency_kits": max(5, int(outcome["children_at_risk"] / 500)),
            "mobile_team_days": duration * 2,
            "cold_chain_repairs": int(outcome["cold_chain_breaks"]),
        }

        total_cost = (
            needs["generators_needed"] * base_costs["generators"] +
            needs["water_tanker_trips"] * base_costs["water_tanker_trip"] +
            needs["sro_packets"] * base_costs["sro_packet"] +
            needs["emergency_kits"] * base_costs["emergency_kit"] +
            needs["mobile_team_days"] * base_costs["mobile_team_day"] +
            needs["cold_chain_repairs"] * base_costs["cold_chain_repair"]
        )

        needs["total_cost"] = total_cost
        return needs
