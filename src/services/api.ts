/**
 * Client API vers le backend FastAPI (server/).
 *
 * - Vérifie périodiquement la disponibilité du backend (/health).
 * - Quand il est joignable, pousse les relevés capteurs du moteur temps réel
 *   vers POST /api/v1/sensors/batch, exactement comme le ferait la passerelle IoT.
 *
 * L'interface reste entièrement fonctionnelle sans backend (mode autonome).
 */

import { liveEngine } from '../data/liveEngine';

export const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
}

export async function checkBackend(): Promise<boolean> {
  const t0 = performance.now();
  try {
    const res = await withTimeout(fetch(`${API_BASE}/health`, { cache: 'no-store' }), 1500);
    if (!res.ok) throw new Error(String(res.status));
    liveEngine.setBackend('connected', Math.round(performance.now() - t0));
    return true;
  } catch {
    liveEngine.setBackend('offline', null);
    return false;
  }
}

export async function pushSensorBatch(): Promise<void> {
  const { centers } = liveEngine.getSnapshot();
  const readings = centers
    .filter(c => c.link !== 'offline')
    .flatMap(c => [
      { center_id: c.id, sensor_type: 'solar_production', value: c.solar_kw, unit: 'kW' },
      { center_id: c.id, sensor_type: 'battery_level', value: c.battery_pct, unit: '%' },
      { center_id: c.id, sensor_type: 'water_level', value: c.water_pct, unit: '%' },
      { center_id: c.id, sensor_type: 'temperature_cold_chain', value: c.cold_c, unit: '°C' },
      { center_id: c.id, sensor_type: 'ambient_temperature', value: c.ambient_c, unit: '°C' },
      { center_id: c.id, sensor_type: 'energy_consumption', value: c.consumption_kw, unit: 'kW' },
    ].map(r => ({ ...r, latitude: c.base.latitude, longitude: c.base.longitude })));
  try {
    await withTimeout(fetch(`${API_BASE}/api/v1/sensors/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ readings }),
    }), 3000);
  } catch {
    /* le backend est peut-être tombé : le prochain checkBackend le détectera */
  }
}

let started = false;
/** Démarre la supervision du backend (idempotent). */
export function startBackendSync() {
  if (started) return;
  started = true;
  const loop = async () => {
    const ok = await checkBackend();
    if (ok) await pushSensorBatch();
  };
  loop();
  setInterval(loop, 30_000);
}
