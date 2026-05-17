"""
Impact Model - Modèle d'analyse des effets en cascade
======================================================

Modélise comment une défaillance dans un système se propage aux autres
systèmes interconnectés d'un centre de santé.

Graphe de dépendances:
- Énergie solaire → Chaîne du froid, Pompe à eau, Éclairage, Communications
- Eau → Hygiène, Stérilisation, Patients
- Chaîne du froid → Vaccins, Médicaments thermosensibles
- Logistique → Approvisionnement, Évacuation, Personnel
"""

import numpy as np
from typing import List, Dict


# Graphe de dépendances entre systèmes
DEPENDENCY_GRAPH = {
    "energy": {
        "depends_on": [],
        "impacts": ["cold_chain", "water", "communications", "lighting", "equipment"],
        "failure_propagation_delay": 0,  # hours
        "criticality": 0.95,
    },
    "water": {
        "depends_on": ["energy"],
        "impacts": ["hygiene", "sterilization", "patient_care"],
        "failure_propagation_delay": 4,
        "criticality": 0.90,
    },
    "cold_chain": {
        "depends_on": ["energy"],
        "impacts": ["vaccines", "medications", "blood_products"],
        "failure_propagation_delay": 2,
        "criticality": 0.85,
    },
    "logistics": {
        "depends_on": [],
        "impacts": ["supply", "evacuation", "personnel", "referral"],
        "failure_propagation_delay": 0,
        "criticality": 0.80,
    },
    "communications": {
        "depends_on": ["energy"],
        "impacts": ["alert_system", "coordination", "reporting"],
        "failure_propagation_delay": 1,
        "criticality": 0.70,
    },
    "health": {
        "depends_on": ["water", "cold_chain", "logistics", "energy"],
        "impacts": ["patient_outcomes", "mortality", "morbidity"],
        "failure_propagation_delay": 6,
        "criticality": 1.0,
    },
}

# Impact descriptions by cascade path
CASCADE_DESCRIPTIONS = {
    ("energy", "cold_chain"): "Panne énergie → Arrêt réfrigérateurs → Température monte dans les frigos à vaccins",
    ("energy", "water"): "Panne énergie → Arrêt pompe → Plus d'eau courante dans le centre",
    ("energy", "communications"): "Panne énergie → Réseau radio/téléphone coupé → Impossible d'alerter",
    ("cold_chain", "vaccines"): "Rupture chaîne froid → Vaccins exposés à T° > 8°C → Perte de doses",
    ("water", "hygiene"): "Pénurie eau → Lavage mains impossible → Risque infections nosocomiales",
    ("water", "sterilization"): "Pénurie eau → Stérilisation impossible → Arrêt actes chirurgicaux",
    ("logistics", "supply"): "Routes coupées → Pas de réapprovisionnement → Rupture stocks médicaments",
    ("logistics", "evacuation"): "Routes coupées → Évacuation impossible → Patients graves non référés",
}


class ImpactModel:
    """
    Modèle d'analyse des effets en cascade.
    
    Utilise un graphe de dépendances pour propager les défaillances
    et estimer l'impact cumulé sur les services de santé.
    """

    def __init__(self):
        self.graph = DEPENDENCY_GRAPH
        self.rng = np.random.default_rng(42)

    def analyze_cascade(
        self,
        initial_event: str,
        systems: List[str],
        duration_days: int,
    ) -> List[Dict]:
        """
        Analyse les effets en cascade à partir d'un événement initial.
        
        Args:
            initial_event: Système initialement défaillant
            systems: Systèmes à analyser
            duration_days: Durée de l'analyse
            
        Returns:
            Liste des effets en cascade avec timing et sévérité
        """
        effects = []
        visited = set()
        queue = [(initial_event, 0, 1.0)]  # (system, day, severity)

        while queue:
            system, day, severity = queue.pop(0)
            if system in visited or day > duration_days:
                continue
            visited.add(system)

            system_info = self.graph.get(system, {})
            delay_hours = system_info.get("failure_propagation_delay", 0)
            impact_day = day + max(1, delay_hours // 24)

            # Generate effect description
            description = self._get_description(initial_event, system, severity)

            effects.append({
                "system": system,
                "day_of_impact": min(impact_day, duration_days),
                "severity": round(min(severity, 1.0), 3),
                "description": description,
                "dependent_systems": system_info.get("impacts", []),
            })

            # Propagate to dependent systems
            for dependent in system_info.get("impacts", []):
                if dependent in [s for s in self.graph.keys()] and dependent not in visited:
                    # Severity decreases with each hop but stays significant
                    new_severity = severity * 0.75 + self.rng.uniform(-0.05, 0.05)
                    new_day = impact_day + 1
                    queue.append((dependent, new_day, new_severity))

        return sorted(effects, key=lambda x: x["day_of_impact"])

    def _get_description(self, source: str, target: str, severity: float) -> str:
        """Génère une description de l'effet en cascade."""
        key = (source, target)
        if key in CASCADE_DESCRIPTIONS:
            return CASCADE_DESCRIPTIONS[key]

        severity_text = "critique" if severity > 0.8 else "important" if severity > 0.5 else "modéré"
        return f"Impact {severity_text} sur le système {target} suite à la défaillance de {source}"

    def calculate_system_resilience(self, center_id: str) -> Dict:
        """
        Calcule un score de résilience pour un centre de santé.
        Prend en compte la redondance, l'état des systèmes et les capacités de backup.
        """
        # Mock resilience calculation
        scores = {
            "energy_resilience": self.rng.uniform(0.5, 0.95),
            "water_resilience": self.rng.uniform(0.4, 0.9),
            "cold_chain_resilience": self.rng.uniform(0.6, 0.95),
            "logistics_resilience": self.rng.uniform(0.3, 0.85),
            "communications_resilience": self.rng.uniform(0.5, 0.9),
        }

        overall = np.mean(list(scores.values()))
        scores["overall_resilience"] = round(float(overall), 3)
        scores["vulnerability_index"] = round(1 - float(overall), 3)

        return scores
