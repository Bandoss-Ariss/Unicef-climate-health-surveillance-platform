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
  solarSystem: SolarSystem;
  waterSystem: WaterSystem;
  coldChain: ColdChain;
  lastUpdate: string;
}

export interface SolarSystem {
  installed: boolean;
  capacity_kw: number;
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
  dailyConsumption_liters: number;
  quality: 'good' | 'acceptable' | 'poor';
  pumpStatus: 'running' | 'stopped' | 'maintenance';
}

export interface ColdChain {
  temperature: number;
  status: 'optimal' | 'warning' | 'critical';
  vaccineStock: VaccineStock[];
  lastCheck: string;
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
}

export interface SimulationResult {
  scenario: string;
  impactedCenters: number;
  childrenAtRisk: number;
  energyDeficit_kwh: number;
  waterDeficit_liters: number;
  coldChainBreaks: number;
  recommendations: string[];
  timeline: SimulationTimelineEntry[];
}

export interface SimulationTimelineEntry {
  day: number;
  energyStatus: number;
  waterStatus: number;
  healthRisk: number;
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
}
