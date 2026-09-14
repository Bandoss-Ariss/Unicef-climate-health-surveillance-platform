// Types pour la plateforme climat-santé UNICEF

export interface HealthCenter {
  id: string;
  name: string;
  district: string;
  region: string;
  latitude: number;
  longitude: number;
  type: 'CSPS' | 'CMA' | 'CHR' | 'CHU';
  status: 'operational' | 'partial' | 'offline';
  /** Population de l'aire sanitaire desservie */
  populationServed: number;
  /** Enfants de moins de 5 ans dans l'aire sanitaire */
  childrenUnder5: number;
  /** Agents de santé à base communautaire rattachés */
  chwCount: number;
  installationDate: string;
  solarSystem: SolarSystem;
  waterSystem: WaterSystem;
  coldChain: ColdChain;
  lastUpdate: string;
  /** Note opérationnelle (cause d'un statut dégradé, etc.) */
  note?: { fr: string; en: string };
}

export interface SolarSystem {
  installed: boolean;
  capacity_kw: number;
  batteryCapacity_kwh: number;
  currentProduction_kw: number;
  batteryLevel: number; // 0-100
  status: 'optimal' | 'degraded' | 'failure';
  dailyProduction_kwh: number[];
  panelCount: number;
  lastMaintenance: string;
}

export interface WaterSystem {
  available: boolean;
  reservoirLevel: number; // 0-100
  reservoirCapacity_liters: number;
  dailyConsumption_liters: number;
  quality: 'good' | 'acceptable' | 'poor';
  pumpStatus: 'running' | 'stopped' | 'maintenance';
}

export interface ColdChain {
  temperature: number;
  status: 'optimal' | 'warning' | 'critical';
  vaccineStock: VaccineStock[];
  lastCheck: string;
  /** Modèle de réfrigérateur solaire (WHO PQS) */
  fridgeModel: string;
}

export interface VaccineStock {
  name: string;
  quantity: number;
  expiryDate: string;
  temperatureOk: boolean;
}

export interface ClimateAlert {
  id: string;
  type: 'heat_wave' | 'flood' | 'drought' | 'dust_storm' | 'heavy_rain';
  severity: 'low' | 'medium' | 'high' | 'critical';
  region: string;
  district: string;
  message: string;
  startDate: string;
  endDate?: string;
  affectedPopulation: number;
  childrenAffected: number;
  recommendations: string[];
  status: 'active' | 'resolved' | 'monitoring';
  /** Source de la donnée (ANAM, ECMWF, CHIRPS...) */
  source: string;
  /** Indice de confiance du modèle (0-1) */
  confidence: number;
  /** Délai d'anticipation en heures avant l'impact */
  leadTimeHours: number;
  issuedAt: string;
  acknowledged?: boolean;
  broadcastCount?: number;
}

export interface HealthAlert {
  id: string;
  type: 'malaria' | 'cholera' | 'meningitis' | 'malnutrition' | 'dehydration' | 'respiratory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  region: string;
  district: string;
  cases: number;
  childrenCases: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  startDate: string;
  recommendations: string[];
  /** Historique hebdomadaire des cas (8 dernières semaines) */
  weeklyCases: number[];
  /** Seuil épidémique hebdomadaire */
  epidemicThreshold: number;
  source: string;
  acknowledged?: boolean;
}

export interface DashboardStats {
  totalCenters: number;
  operationalCenters: number;
  solarizedCenters: number;
  activeAlerts: number;
  childrenCovered: number;
  energySaved_kwh: number;
  vaccinesCovered: number;
  waterAvailability: number;
}

export interface SimulationParams {
  scenario: 'heat_wave' | 'flood' | 'drought' | 'epidemic';
  intensity: 'low' | 'medium' | 'high';
  duration_days: number;
  affectedDistricts: string[];
  startDate: string;
  monteCarloRuns: number;
}

export interface SimulationResult {
  scenario: string;
  impactedCenters: number;
  childrenAtRisk: number;
  childrenAtRiskCI: [number, number];
  energyDeficit_kwh: number;
  waterDeficit_liters: number;
  coldChainBreaks: number;
  vaccineDosesAtRisk: number;
  estimatedCost_usd: number;
  avoidedCost_usd: number;
  recommendations: string[];
  timeline: SimulationTimelineEntry[];
  runs: number;
  computeMs: number;
}

export interface SimulationTimelineEntry {
  day: number;
  energyStatus: number;
  energyP10: number;
  energyP90: number;
  waterStatus: number;
  waterP10: number;
  waterP90: number;
  healthRisk: number;
  healthP10: number;
  healthP90: number;
  alerts: string[];
}

export interface PreventionMessage {
  id: string;
  type: 'sms' | 'voice' | 'community';
  target: 'mothers' | 'community_leaders' | 'health_workers' | 'all';
  language: 'french' | 'moore' | 'dioula' | 'fulfulde';
  content: string;
  triggerCondition: string;
  sentCount: number;
  lastSent: string;
  deliveryRate: number;
  districts: string[];
  status: 'active' | 'scheduled' | 'paused';
}

export type EventKind =
  | 'sensor' | 'alert' | 'sms' | 'maintenance' | 'prediction' | 'ack' | 'system' | 'coldchain' | 'water';

export interface PlatformEvent {
  id: string;
  at: string;
  kind: EventKind;
  severity: 'info' | 'warning' | 'critical' | 'success';
  centerId?: string;
  district?: string;
  title: { fr: string; en: string };
  detail?: { fr: string; en: string };
  actor?: string;
}
