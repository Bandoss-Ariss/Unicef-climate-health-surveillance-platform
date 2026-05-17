"""
Sensor Simulator - Simulateur de capteurs IoT
===============================================

Simule l'envoi de données par les capteurs installés dans les 10 centres
de santé pilotes. Génère des données réalistes pour:
- Production solaire (suit la courbe solaire journalière)
- Niveau batterie (charge/décharge)
- Niveau eau (consommation + remplissage)
- Température chaîne du froid (fluctuations)
- Température ambiante (cycle jour/nuit)
- Statut pompe

Usage:
    python scripts/sensor_simulator.py --interval 30 --duration 3600
    
    --interval: secondes entre chaque envoi (default: 60)
    --duration: durée totale en secondes (default: infini)
"""

import asyncio
import httpx
import numpy as np
import argparse
import logging
from datetime import datetime, timedelta

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

API_BASE = "http://localhost:8000/api/v1/sensors"

# Center configurations
CENTERS = {
    "cs-001": {"lat": 12.2533, "lng": -2.3628, "capacity_kw": 5.4, "battery_init": 87, "water_init": 72},
    "cs-002": {"lat": 12.3167, "lng": -2.4667, "capacity_kw": 8.0, "battery_init": 92, "water_init": 85},
    "cs-003": {"lat": 11.5544, "lng": -1.7731, "capacity_kw": 4.0, "battery_init": 35, "water_init": 28},
    "cs-004": {"lat": 12.4633, "lng": -3.4608, "capacity_kw": 5.0, "battery_init": 78, "water_init": 65},
    "cs-005": {"lat": 11.7450, "lng": -2.9300, "capacity_kw": 7.5, "battery_init": 42, "water_init": 45},
    "cs-006": {"lat": 12.7333, "lng": -3.8667, "capacity_kw": 4.5, "battery_init": 5, "water_init": 8},
    "cs-007": {"lat": 14.1000, "lng": -1.6333, "capacity_kw": 6.0, "battery_init": 95, "water_init": 55},
    "cs-008": {"lat": 14.0333, "lng": -0.0333, "capacity_kw": 10.0, "battery_init": 88, "water_init": 70},
    "cs-009": {"lat": 14.4500, "lng": -0.2333, "capacity_kw": 5.0, "battery_init": 60, "water_init": 32},
    "cs-010": {"lat": 13.4333, "lng": 0.5333, "capacity_kw": 5.5, "battery_init": 82, "water_init": 58},
}


class SensorSimulator:
    """Simulates realistic IoT sensor data for health centers."""

    def __init__(self):
        self.rng = np.random.default_rng()
        self.state = {}
        self._initialize_states()

    def _initialize_states(self):
        """Initialize center states."""
        for cid, config in CENTERS.items():
            self.state[cid] = {
                "battery": float(config["battery_init"]),
                "water": float(config["water_init"]),
                "cold_chain_temp": self.rng.uniform(3.0, 5.0),
                "ambient_temp": 35.0,
            }

    def _solar_curve(self, hour: float) -> float:
        """Solar production curve (bell shape 6h-18h)."""
        if hour < 6 or hour > 18:
            return 0.0
        return np.sin((hour - 6) * np.pi / 12)

    def generate_readings(self, center_id: str, timestamp: datetime) -> list:
        """Generate all sensor readings for a center at given time."""
        config = CENTERS[center_id]
        state = self.state[center_id]
        hour = timestamp.hour + timestamp.minute / 60

        readings = []

        # 1. Solar Production
        solar_factor = self._solar_curve(hour)
        cloud_cover = self.rng.uniform(0, 0.4)
        production = config["capacity_kw"] * solar_factor * (1 - cloud_cover) * self.rng.uniform(0.85, 1.0)
        production = max(0, production)
        readings.append({
            "center_id": center_id,
            "sensor_type": "solar_production",
            "value": round(production, 2),
            "unit": "kW",
            "timestamp": timestamp.isoformat(),
            "latitude": config["lat"],
            "longitude": config["lng"],
        })

        # 2. Battery Level
        charge_rate = production * 0.8  # 80% charging efficiency
        discharge_rate = config["capacity_kw"] * 0.15  # base consumption
        net = (charge_rate - discharge_rate) * (1/60)  # per minute equivalent
        state["battery"] = np.clip(state["battery"] + net + self.rng.normal(0, 0.1), 0, 100)
        readings.append({
            "center_id": center_id,
            "sensor_type": "battery_level",
            "value": round(state["battery"], 1),
            "unit": "%",
            "timestamp": timestamp.isoformat(),
            "latitude": config["lat"],
            "longitude": config["lng"],
        })

        # 3. Water Level
        consumption = self.rng.uniform(0.05, 0.15)  # % per reading
        if hour >= 7 and hour <= 17:
            consumption *= 2  # Higher during work hours
        state["water"] = max(0, state["water"] - consumption + self.rng.normal(0, 0.02))
        readings.append({
            "center_id": center_id,
            "sensor_type": "water_level",
            "value": round(state["water"], 1),
            "unit": "%",
            "timestamp": timestamp.isoformat(),
            "latitude": config["lat"],
            "longitude": config["lng"],
        })

        # 4. Cold Chain Temperature
        # Fluctuates around 4°C, affected by battery level
        if state["battery"] < 15:
            # Fridge losing power
            state["cold_chain_temp"] += self.rng.uniform(0.1, 0.5)
        else:
            # Normal operation, tends toward 4°C
            state["cold_chain_temp"] += (4.0 - state["cold_chain_temp"]) * 0.1
            state["cold_chain_temp"] += self.rng.normal(0, 0.2)
        state["cold_chain_temp"] = np.clip(state["cold_chain_temp"], -2, 25)
        readings.append({
            "center_id": center_id,
            "sensor_type": "temperature_cold_chain",
            "value": round(state["cold_chain_temp"], 1),
            "unit": "°C",
            "timestamp": timestamp.isoformat(),
            "latitude": config["lat"],
            "longitude": config["lng"],
        })

        # 5. Ambient Temperature
        # Daily cycle: min at 6h, max at 14h
        base_temp = 35 + 8 * np.sin((hour - 6) * np.pi / 16)
        state["ambient_temp"] = base_temp + self.rng.normal(0, 1.5)
        readings.append({
            "center_id": center_id,
            "sensor_type": "ambient_temperature",
            "value": round(state["ambient_temp"], 1),
            "unit": "°C",
            "timestamp": timestamp.isoformat(),
            "latitude": config["lat"],
            "longitude": config["lng"],
        })

        # 6. Energy Consumption
        base_consumption = config["capacity_kw"] * 0.3
        if hour >= 8 and hour <= 17:
            base_consumption *= 1.5
        consumption_kw = base_consumption * self.rng.uniform(0.8, 1.2)
        readings.append({
            "center_id": center_id,
            "sensor_type": "energy_consumption",
            "value": round(consumption_kw, 2),
            "unit": "kW",
            "timestamp": timestamp.isoformat(),
            "latitude": config["lat"],
            "longitude": config["lng"],
        })

        return readings


async def run_simulator(interval: int = 60, duration: int = 0):
    """Run the sensor simulator, sending data to the API."""
    simulator = SensorSimulator()
    start_time = datetime.now()

    logger.info(f"🚀 Starting sensor simulator")
    logger.info(f"   Interval: {interval}s | Centers: {len(CENTERS)} | Sensors: 6 per center")
    logger.info(f"   API: {API_BASE}")
    logger.info("-" * 60)

    iteration = 0
    async with httpx.AsyncClient(timeout=30) as client:
        while True:
            iteration += 1
            timestamp = datetime.now()

            all_readings = []
            for center_id in CENTERS:
                readings = simulator.generate_readings(center_id, timestamp)
                all_readings.extend(readings)

            # Send batch
            try:
                response = await client.post(
                    f"{API_BASE}/batch",
                    json={"readings": all_readings},
                )
                result = response.json()
                alerts = result.get("alerts_triggered", 0)
                alert_str = f" ⚠️ {alerts} alerts!" if alerts > 0 else ""
                logger.info(
                    f"[{iteration}] Sent {result.get('readings_saved', 0)} readings "
                    f"from {len(CENTERS)} centers{alert_str}"
                )
            except Exception as e:
                logger.error(f"[{iteration}] Failed to send: {e}")

            # Check duration
            if duration > 0 and (datetime.now() - start_time).total_seconds() >= duration:
                logger.info("Duration reached. Stopping simulator.")
                break

            await asyncio.sleep(interval)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="IoT Sensor Simulator")
    parser.add_argument("--interval", type=int, default=60, help="Seconds between readings")
    parser.add_argument("--duration", type=int, default=0, help="Total duration (0=infinite)")
    args = parser.parse_args()

    asyncio.run(run_simulator(interval=args.interval, duration=args.duration))
