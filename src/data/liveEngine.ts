/**
 * Moteur temps réel de la plateforme.
 *
 * Simule de façon physiquement plausible l'état des 10 formations sanitaires
 * (production solaire selon l'heure solaire réelle à Ouagadougou, état de charge des
 * batteries, niveau des réservoirs, cycles du compresseur de la chaîne du froid,
 * liaison GSM/LoRa) et tient un journal d'événements horodaté.
 *
 * Toutes les pages lisent le même état via `useLive()` : les chiffres sont donc
 * cohérents entre le tableau de bord, la carte, le monitoring et les fiches centres.
 *
 * En production, ce module est remplacé par le flux MQTT/REST de la passerelle IoT
 * (voir server/app/api/sensors.py) — l'interface reste identique.
 */

import { healthCenters, climateAlerts as baseClimate, healthAlerts as baseHealth, preventionMessages as basePrevention } from './mockData';
import { ouagaHour } from './dates';
import { ClimateAlert, HealthAlert, HealthCenter, PlatformEvent, PreventionMessage, EventKind } from '../types';

// ---------------------------------------------------------------------------
// Types exposés
// ---------------------------------------------------------------------------

export type LinkStatus = 'connected' | 'intermittent' | 'offline';

export interface LiveCenter {
  id: string;
  base: HealthCenter;
  name: string;
  shortName: string;
  district: string;
  region: string;
  status: 'operational' | 'partial' | 'offline';
  link: LinkStatus;
  lastPing: number;
  solar_kw: number;
  battery_pct: number;
  consumption_kw: number;
  water_pct: number;
  pump: 'running' | 'stopped';
  cold_c: number;
  coldStatus: 'optimal' | 'warning' | 'critical';
  ambient_c: number;
  humidity_pct: number;
  todayProduction_kwh: number;
  autonomy_h: number;
  signal_dbm: number;
}

export interface HistoryPoint {
  t: number;
  solar: number;
  battery: number;
  water: number;
  cold: number;
  ambient: number;
  consumption: number;
}

export interface FleetPoint {
  t: number;
  solar: number;
  battery: number;
  water: number;
  cold: number;
  consumption: number;
}

export interface LiveState {
  tick: number;
  now: number;
  startedAt: number;
  centers: LiveCenter[];
  history: Record<string, HistoryPoint[]>;
  fleetSeries: FleetPoint[];
  events: PlatformEvent[];
  climateAlerts: ClimateAlert[];
  healthAlerts: HealthAlert[];
  preventionMessages: PreventionMessage[];
  backend: 'connected' | 'offline' | 'checking';
  backendLatencyMs: number | null;
  unreadEvents: number;
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** PRNG déterministe (mulberry32) — les historiques sont identiques d'un rechargement à l'autre. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const smooth = (x: number) => { const t = clamp(x, 0, 1); return t * t * (3 - 2 * t); };
const round = (v: number, p = 1) => Math.round(v * 10 ** p) / 10 ** p;

/** Éclairement en ciel clair (0-1). Lever ≈ 6h00, coucher ≈ 18h30 en septembre au Burkina. */
export function clearSky(h: number): number {
  const rise = 6.0, set = 18.55;
  if (h < rise || h > set) return 0;
  return Math.sin(((h - rise) / (set - rise)) * Math.PI);
}

interface Profile {
  socMin: number; socMax: number;
  health: number;            // rendement du champ PV (0-1)
  cloud: number;             // nébulosité moyenne (0-1 = ciel clair)
  waterBase: number; waterAmp: number; pumpYield: number;
  coldSet: number; coldOff: boolean;
  tMin: number; tMax: number;
  link: LinkStatus;
  loadScale: number;
  signal: number;
}

/** Profils opérationnels par centre (état au démarrage de la session). */
const PROFILES: Record<string, Profile> = {
  'cs-001': { socMin: 64, socMax: 100, health: 0.92, cloud: 0.82, waterBase: 72, waterAmp: 5, pumpYield: 1, coldSet: 4.2, coldOff: false, tMin: 23, tMax: 33, link: 'connected', loadScale: 1, signal: -71 },
  'cs-002': { socMin: 70, socMax: 100, health: 0.93, cloud: 0.80, waterBase: 85, waterAmp: 4, pumpYield: 1, coldSet: 3.8, coldOff: false, tMin: 23, tMax: 33, link: 'connected', loadScale: 2.2, signal: -64 },
  'cs-003': { socMin: 18, socMax: 44, health: 0.55, cloud: 0.78, waterBase: 28, waterAmp: 3, pumpYield: 0.15, coldSet: 6.6, coldOff: false, tMin: 24, tMax: 34, link: 'intermittent', loadScale: 0.9, signal: -97 },
  'cs-004': { socMin: 58, socMax: 96, health: 0.9, cloud: 0.8, waterBase: 65, waterAmp: 6, pumpYield: 1, coldSet: 4.0, coldOff: false, tMin: 24, tMax: 34, link: 'connected', loadScale: 1, signal: -76 },
  'cs-005': { socMin: 24, socMax: 52, health: 0.45, cloud: 0.8, waterBase: 45, waterAmp: 4, pumpYield: 0.6, coldSet: 5.4, coldOff: false, tMin: 24, tMax: 34, link: 'connected', loadScale: 2.0, signal: -82 },
  'cs-006': { socMin: 3, socMax: 5, health: 0.0, cloud: 0.8, waterBase: 8, waterAmp: 0.5, pumpYield: 0, coldSet: 12.5, coldOff: true, tMin: 24, tMax: 35, link: 'offline', loadScale: 0, signal: -120 },
  'cs-007': { socMin: 66, socMax: 100, health: 0.94, cloud: 0.93, waterBase: 55, waterAmp: 7, pumpYield: 1, coldSet: 3.5, coldOff: false, tMin: 27, tMax: 40, link: 'connected', loadScale: 1.1, signal: -79 },
  'cs-008': { socMin: 68, socMax: 100, health: 0.94, cloud: 0.94, waterBase: 70, waterAmp: 5, pumpYield: 1, coldSet: 4.1, coldOff: false, tMin: 27, tMax: 40, link: 'connected', loadScale: 2.6, signal: -66 },
  'cs-009': { socMin: 40, socMax: 74, health: 0.72, cloud: 0.9, waterBase: 32, waterAmp: 4, pumpYield: 0.25, coldSet: 5.7, coldOff: false, tMin: 27, tMax: 41, link: 'intermittent', loadScale: 1, signal: -101 },
  'cs-010': { socMin: 60, socMax: 98, health: 0.92, cloud: 0.92, waterBase: 58, waterAmp: 6, pumpYield: 1, coldSet: 4.3, coldOff: false, tMin: 26, tMax: 39, link: 'connected', loadScale: 1, signal: -84 },
};

/** État de charge attendu à l'heure h (charge 7h→15h, plateau, décharge nocturne). */
function socProfile(h: number, p: Profile): number {
  let f: number;
  if (h >= 7 && h < 15) f = smooth((h - 7) / 8);
  else if (h >= 15 && h < 17) f = 1;
  else { const hh = h >= 17 ? h - 17 : h + 7; f = 1 - smooth(hh / 14); }
  return p.socMin + (p.socMax - p.socMin) * f;
}

function ambientProfile(h: number, p: Profile): number {
  // minimum vers 6h, maximum vers 15h
  const g = h >= 6 && h <= 15
    ? 0.5 * (1 - Math.cos(((h - 6) / 9) * Math.PI))
    : 0.5 * (1 + Math.cos((((h - 15 + 24) % 24) / 15) * Math.PI));
  return p.tMin + (p.tMax - p.tMin) * clamp(g, 0, 1);
}

function loadProfile(h: number, p: Profile): number {
  // kW : réfrigérateur + télécom + éclairage + pompe (matin) + activité clinique de jour
  const fridge = 0.12, telecom = 0.04;
  const lights = h >= 18.5 || h < 6 ? 0.18 : 0.03;
  const clinic = h >= 7.5 && h <= 17 ? 0.22 : 0.05;
  const pump = h >= 8 && h <= 11 && p.pumpYield > 0 ? 0.35 : 0;
  return (fridge + telecom + lights + clinic + pump) * p.loadScale;
}

function waterProfile(h: number, p: Profile): number {
  return p.waterBase + p.waterAmp * Math.sin(((h - 10) / 24) * 2 * Math.PI);
}

const SHORT = (name: string) => name.replace('CSPS de ', '').replace('CMA de ', '');

// ---------------------------------------------------------------------------
// Journal d'événements initial (48 dernières heures)
// ---------------------------------------------------------------------------

let eventSeq = 1000;
function mkEvent(hoursAgo: number, kind: EventKind, severity: PlatformEvent['severity'], fr: string, en: string, opts: Partial<PlatformEvent> = {}): PlatformEvent {
  return {
    id: `ev-${eventSeq++}`,
    at: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
    kind, severity,
    title: { fr, en },
    ...opts,
  };
}

function initialEvents(): PlatformEvent[] {
  const E: PlatformEvent[] = [
    mkEvent(47.2, 'coldchain', 'critical', 'Chaîne du froid CSPS Nouna : 8,4 °C — seuil dépassé', 'Nouna CSPS cold chain: 8.4 °C — threshold exceeded', { centerId: 'cs-006', district: 'Nouna', detail: { fr: 'Batterie 11 % · compresseur arrêté', en: 'Battery 11% · compressor stopped' } }),
    mkEvent(47.1, 'sms', 'info', 'SMS d\'alerte envoyé à l\'ICP et au MCD de Nouna', 'Alert SMS sent to Nouna facility head and district medical officer', { centerId: 'cs-006', district: 'Nouna', actor: 'Moteur d\'alerte' }),
    mkEvent(45.8, 'ack', 'success', 'ICP Nouna : transfert des vaccins vers le CMA de Nouna confirmé', 'Nouna head nurse: vaccine transfer to Nouna CMA confirmed', { centerId: 'cs-006', district: 'Nouna', actor: 'ICP Nouna' }),
    mkEvent(41.0, 'sensor', 'warning', 'CSPS Nouna : perte de liaison (dernier relevé batterie 5 %)', 'Nouna CSPS: link lost (last battery reading 5%)', { centerId: 'cs-006', district: 'Nouna' }),
    mkEvent(40.5, 'maintenance', 'warning', 'Ticket MT-0418 créé : remplacement parc batteries Nouna', 'Ticket MT-0418 created: Nouna battery bank replacement', { centerId: 'cs-006', district: 'Nouna', actor: 'Technicien régional BMH' }),
    mkEvent(38.0, 'prediction', 'info', 'Modèle épidémique recalculé (DHIS2 S36) — paludisme Boromo : +34 % à J+14', 'Epidemic model recomputed (DHIS2 W36) — Boromo malaria: +34% at D+14', { district: 'Boromo' }),
    mkEvent(36.5, 'alert', 'warning', 'Alerte sanitaire déclenchée : paludisme Boromo > seuil épidémique', 'Health alert triggered: Boromo malaria > epidemic threshold', { district: 'Boromo' }),
    mkEvent(36.4, 'sms', 'info', 'Campagne SMS Dioula « moustiquaires » — 8 900 mères (Boromo)', 'Dioula SMS campaign "bed nets" — 8,900 mothers (Boromo)', { district: 'Boromo', actor: 'Moteur de prévention' }),
    mkEvent(30.0, 'water', 'warning', 'CSPS Sapouy : réservoir 24 % — débit forage réduit', 'Sapouy CSPS: reservoir 24% — reduced borehole yield', { centerId: 'cs-003', district: 'Sapouy' }),
    mkEvent(26.0, 'maintenance', 'info', 'Ticket MT-0421 : nettoyage panneaux Gorom-Gorom planifié', 'Ticket MT-0421: Gorom-Gorom panel cleaning scheduled', { centerId: 'cs-009', district: 'Gorom-Gorom' }),
    mkEvent(24.0, 'system', 'info', 'Synchronisation DHIS2 hebdomadaire terminée (10 formations sanitaires)', 'Weekly DHIS2 sync completed (10 facilities)'),
    mkEvent(20.0, 'prediction', 'warning', 'Risque canicule Sahel (ANAM/ECMWF) : probabilité 91 % à J+1', 'Sahel heat wave risk (ANAM/ECMWF): 91% probability at D+1', { district: 'Djibo' }),
    mkEvent(14.0, 'alert', 'critical', 'Alerte climatique CRITIQUE émise : canicule Djibo (>45 °C, 5 jours)', 'CRITICAL climate alert issued: Djibo heat wave (>45 °C, 5 days)', { district: 'Djibo', actor: 'Moteur d\'alerte' }),
    mkEvent(13.9, 'sms', 'info', 'Campagne SMS Mooré « chaleur extrême » — 12 545 mères (Djibo, Dori, Gorom-Gorom)', 'Mooré SMS campaign "extreme heat" — 12,545 mothers (Djibo, Dori, Gorom-Gorom)', { district: 'Djibo', actor: 'Moteur de prévention' }),
    mkEvent(13.8, 'sms', 'info', 'Notification 45 agents de santé — protocole déshydratation J+1', 'Notification to 45 health workers — dehydration protocol D+1', { district: 'Djibo' }),
    mkEvent(12.5, 'ack', 'success', 'MCD Djibo a acquitté l\'alerte canicule', 'Djibo district medical officer acknowledged the heat wave alert', { district: 'Djibo', actor: 'MCD Djibo' }),
    mkEvent(9.0, 'sms', 'success', 'Rapport de livraison : 94 % des SMS Mooré délivrés (11 792 / 12 545)', 'Delivery report: 94% of Mooré SMS delivered (11,792 / 12,545)', { district: 'Djibo' }),
    mkEvent(6.0, 'alert', 'warning', 'Alerte inondation Boromo : cumul >80 mm/24 h prévu à J+3', 'Boromo flood alert: >80 mm/24 h expected at D+3', { district: 'Boromo', actor: 'Moteur d\'alerte' }),
    mkEvent(5.5, 'coldchain', 'info', 'Contrôle chaîne du froid quotidien : 8/10 centres dans la plage 2-8 °C', 'Daily cold chain check: 8/10 centres within 2-8 °C'),
    mkEvent(4.0, 'maintenance', 'success', 'Ticket MT-0415 clôturé : maintenance préventive CSPS Djibo', 'Ticket MT-0415 closed: Djibo CSPS preventive maintenance', { centerId: 'cs-007', district: 'Djibo' }),
    mkEvent(3.0, 'alert', 'warning', 'Alerte tempête de sable Gorom-Gorom (J+2) — SMS Fulfuldé programmé', 'Gorom-Gorom dust storm alert (D+2) — Fulfulde SMS scheduled', { district: 'Gorom-Gorom' }),
    mkEvent(2.2, 'prediction', 'info', 'Prévision production solaire J+1 : 296 kWh (−6 % nébulosité)', 'Solar production forecast D+1: 296 kWh (−6% cloud cover)'),
    mkEvent(1.1, 'sensor', 'info', 'CSPS Sapouy : liaison rétablie après 38 min d\'interruption', 'Sapouy CSPS: link restored after 38 min outage', { centerId: 'cs-003', district: 'Sapouy' }),
    mkEvent(0.4, 'water', 'warning', 'CSPS Gorom-Gorom : réservoir 31 % — pompage limité par batterie', 'Gorom-Gorom CSPS: reservoir 31% — pumping limited by battery', { centerId: 'cs-009', district: 'Gorom-Gorom' }),
  ];
  return E.sort((a, b) => b.at.localeCompare(a.at));
}

/** Événements de fond générés pendant la session (rotation). */
const AMBIENT_EVENTS: Array<[EventKind, PlatformEvent['severity'], string, string, string?]> = [
  ['sensor', 'info', 'Lot de 60 relevés capteurs reçu (passerelle LoRaWAN Sahel)', 'Batch of 60 sensor readings received (Sahel LoRaWAN gateway)'],
  ['prediction', 'info', 'Modèle risque climatique recalculé — 4 districts sous surveillance', 'Climate risk model recomputed — 4 districts under watch'],
  ['coldchain', 'info', 'Cycle compresseur CMA Dori : 3,9 °C → 4,3 °C (nominal)', 'Dori CMA compressor cycle: 3.9 °C → 4.3 °C (nominal)', 'cs-008'],
  ['sms', 'success', 'Rapport livraison SMS : 97 % délivrés (lot leaders communautaires)', 'SMS delivery report: 97% delivered (community leaders batch)'],
  ['ack', 'success', 'ASBC Dori : 14 enfants dépistés (PB), 2 référés au CMA', 'Dori CHW: 14 children screened (MUAC), 2 referred to CMA', 'cs-008'],
  ['system', 'info', 'Sauvegarde chiffrée des données réalisée (S3 UNICEF, région eu-west-3)', 'Encrypted data backup completed (UNICEF S3, eu-west-3)'],
  ['sensor', 'info', 'CSPS Sebba : relevé qualité eau — turbidité 2,1 NTU (conforme)', 'Sebba CSPS: water quality reading — turbidity 2.1 NTU (compliant)', 'cs-010'],
  ['maintenance', 'info', 'Technicien BMH en route vers Nouna (ETA 2 h 10) — ticket MT-0418', 'BMH technician en route to Nouna (ETA 2 h 10) — ticket MT-0418', 'cs-006'],
  ['prediction', 'info', 'Prévision énergie : aucun centre sous 20 % de batterie attendu cette nuit (hors Nouna)', 'Energy forecast: no centre expected below 20% battery tonight (except Nouna)'],
  ['sms', 'info', 'Message vocal IVR Mooré « SRO » : 1 240 appels aboutis', 'Mooré IVR voice message "ORS": 1,240 completed calls'],
  ['ack', 'success', 'ICP Réo : contrôle température frigo signé (3,8 °C)', 'Réo head nurse: fridge temperature check signed (3.8 °C)', 'cs-002'],
  ['sensor', 'info', 'CSPS Koudougou Nord : télé-relevé compteur — 24,1 kWh produits aujourd\'hui', 'Koudougou Nord CSPS: remote meter reading — 24.1 kWh produced today', 'cs-001'],
];

// ---------------------------------------------------------------------------
// Moteur
// ---------------------------------------------------------------------------

type Listener = () => void;

class LiveEngine {
  private state!: LiveState;
  private listeners = new Set<Listener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private cloudWalk: Record<string, number> = {};
  private ambientIdx = 0;
  private lastAmbientEvent = Date.now();
  private thresholdMemo: Record<string, number> = {};
  private lastHistoryStamp = 0;

  constructor() {
    const now = Date.now();
    const centers = healthCenters.map((c, i) => this.computeCenter(c, now, i, true));
    const history: Record<string, HistoryPoint[]> = {};
    healthCenters.forEach((c, i) => { history[c.id] = this.buildHistory(c, i, now); });
    this.state = {
      tick: 0,
      now,
      startedAt: now,
      centers,
      history,
      fleetSeries: this.seedFleetSeries(centers, now),
      events: initialEvents(),
      climateAlerts: baseClimate.map(a => ({ ...a })),
      healthAlerts: baseHealth.map(a => ({ ...a })),
      preventionMessages: basePrevention.map(m => ({ ...m })),
      backend: 'checking',
      backendLatencyMs: null,
      unreadEvents: 3,
    };
    this.lastHistoryStamp = now;
  }

  // ---- Souscription (useSyncExternalStore) ----
  subscribe = (l: Listener) => {
    this.listeners.add(l);
    if (!this.timer) this.timer = setInterval(() => this.tick(), 3000);
    return () => {
      this.listeners.delete(l);
      if (this.listeners.size === 0 && this.timer) { clearInterval(this.timer); this.timer = null; }
    };
  };
  getSnapshot = () => this.state;

  private commit(patch: Partial<LiveState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach(l => l());
  }

  // ---- Physique d'un centre ----
  private computeCenter(base: HealthCenter, now: number, idx: number, init: boolean): LiveCenter {
    const p = PROFILES[base.id];
    const h = ouagaHour(new Date(now));
    if (this.cloudWalk[base.id] === undefined) this.cloudWalk[base.id] = p.cloud;
    // nébulosité : marche aléatoire lente autour de la valeur moyenne
    this.cloudWalk[base.id] = clamp(this.cloudWalk[base.id] + (Math.random() - 0.5) * 0.03 + (p.cloud - this.cloudWalk[base.id]) * 0.05, 0.35, 1);
    const cloud = this.cloudWalk[base.id];

    const solar = base.solarSystem.capacity_kw * clearSky(h) * cloud * p.health * (1 + (Math.random() - 0.5) * 0.04);
    const consumption = loadProfile(h, p) * (1 + (Math.random() - 0.5) * 0.12);
    const battery = clamp(socProfile(h, p) + (Math.random() - 0.5) * 0.6, 0, 100);
    const ambient = ambientProfile(h, p) + (Math.random() - 0.5) * 0.6;
    const humidity = clamp(88 - (ambient - 22) * 2.8 + (Math.random() - 0.5) * 3, 12, 98);

    let cold: number;
    if (p.coldOff) {
      // réfrigérateur à l'arrêt : dérive lente vers la température ambiante (isolation ice-lined)
      const prev = this.state?.centers[idx]?.cold_c ?? p.coldSet;
      cold = init ? p.coldSet : prev + (ambient - prev) * 0.00004 + (Math.random() - 0.5) * 0.04;
    } else {
      const prev = this.state?.centers[idx]?.cold_c ?? p.coldSet;
      // cycle compresseur : oscillation ±0,5 °C autour de la consigne
      const cycle = Math.sin((now / 1000 / 540 + idx) * 2 * Math.PI) * 0.45;
      cold = init ? p.coldSet + cycle : prev + (p.coldSet + cycle - prev) * 0.35 + (Math.random() - 0.5) * 0.08;
    }

    let water = waterProfile(h, p) + (Math.random() - 0.5) * 0.4;
    water = clamp(water, 0, 100);
    const pumpWindow = h >= 8 && h <= 11;
    const pump: 'running' | 'stopped' = p.pumpYield > 0 && pumpWindow && battery > 20 ? 'running' : 'stopped';

    // liaison
    let link: LinkStatus = p.link;
    let lastPing = now;
    if (p.link === 'offline') { lastPing = now - 41 * 3600_000; }
    else if (p.link === 'intermittent') {
      const prevPing = this.state?.centers[idx]?.lastPing ?? now;
      lastPing = Math.random() < 0.72 ? now : prevPing;
      if (now - lastPing > 60_000) link = 'intermittent';
    } else {
      const prevPing = this.state?.centers[idx]?.lastPing ?? now;
      lastPing = Math.random() < 0.985 ? now : prevPing;
    }

    // production cumulée du jour : intégration numérique depuis 6h
    let today = 0;
    if (init) {
      for (let x = 6; x < h; x += 1 / 6) today += base.solarSystem.capacity_kw * clearSky(x) * p.cloud * p.health / 6;
    } else {
      today = (this.state.centers[idx]?.todayProduction_kwh ?? 0) + solar * (3 / 3600);
    }

    const coldStatus = cold > 8 || cold < 2 ? (cold > 10 ? 'critical' : 'warning') : cold > 6.5 ? 'warning' : 'optimal';
    const autonomy = consumption > 0 ? (battery / 100) * base.solarSystem.batteryCapacity_kwh * 0.8 / consumption : 0;

    return {
      id: base.id,
      base,
      name: base.name,
      shortName: SHORT(base.name),
      district: base.district,
      region: base.region,
      status: base.status,
      link,
      lastPing,
      solar_kw: round(solar, 2),
      battery_pct: round(battery, 1),
      consumption_kw: round(consumption, 2),
      water_pct: round(water, 1),
      pump,
      cold_c: round(cold, 1),
      coldStatus,
      ambient_c: round(ambient, 1),
      humidity_pct: round(humidity, 0),
      todayProduction_kwh: round(today, 1),
      autonomy_h: round(autonomy, 1),
      signal_dbm: p.signal + Math.round((Math.random() - 0.5) * 6),
    };
  }

  /** Historique horaire des 24 dernières heures (déterministe). */
  private buildHistory(base: HealthCenter, idx: number, now: number): HistoryPoint[] {
    const p = PROFILES[base.id];
    const dayOfYear = Math.floor(now / 86_400_000);
    const rnd = mulberry32(dayOfYear * 31 + idx * 7);
    const pts: HistoryPoint[] = [];
    for (let k = 48; k >= 0; k--) {
      const t = now - k * 1800_000; // pas de 30 min
      const h = ouagaHour(new Date(t));
      const cloud = clamp(p.cloud + (rnd() - 0.5) * 0.25, 0.3, 1);
      const solar = base.solarSystem.capacity_kw * clearSky(h) * cloud * p.health;
      const cycle = Math.sin((t / 1000 / 540 + idx) * 2 * Math.PI) * 0.45;
      pts.push({
        t,
        solar: round(solar, 2),
        battery: round(clamp(socProfile(h, p) + (rnd() - 0.5) * 1.2, 0, 100), 1),
        water: round(clamp(waterProfile(h, p) + (rnd() - 0.5) * 1, 0, 100), 1),
        cold: round(p.coldOff ? p.coldSet - (k / 48) * 1.6 : p.coldSet + cycle + (rnd() - 0.5) * 0.2, 1),
        ambient: round(ambientProfile(h, p) + (rnd() - 0.5) * 1, 1),
        consumption: round(loadProfile(h, p) * (1 + (rnd() - 0.5) * 0.15), 2),
      });
    }
    return pts;
  }

  private buildFleetSeries(centers: LiveCenter[], now: number): FleetPoint[] {
    const online = centers.filter(c => c.link !== 'offline');
    const avg = (f: (c: LiveCenter) => number) => online.reduce((s, c) => s + f(c), 0) / online.length;
    return [{
      t: now,
      solar: round(centers.reduce((s, c) => s + c.solar_kw, 0), 2),
      battery: round(avg(c => c.battery_pct), 1),
      water: round(avg(c => c.water_pct), 1),
      cold: round(avg(c => c.cold_c), 2),
      consumption: round(centers.reduce((s, c) => s + c.consumption_kw, 0), 2),
    }];
  }

  /** Pré-remplit la série flotte des 2 dernières minutes (points à 3 s) pour que les courbes ne démarrent pas vides. */
  private seedFleetSeries(centers: LiveCenter[], now: number): FleetPoint[] {
    const last = this.buildFleetSeries(centers, now)[0];
    const rnd = mulberry32(Math.floor(now / 60_000));
    const pts: FleetPoint[] = [];
    for (let k = 39; k >= 1; k--) {
      pts.push({
        t: now - k * 3000,
        solar: round(last.solar * (1 + (rnd() - 0.5) * 0.05), 2),
        battery: round(last.battery + (rnd() - 0.5) * 0.4, 1),
        water: round(last.water + (rnd() - 0.5) * 0.3, 1),
        cold: round(last.cold + (rnd() - 0.5) * 0.15, 2),
        consumption: round(last.consumption * (1 + (rnd() - 0.5) * 0.08), 2),
      });
    }
    pts.push(last);
    return pts;
  }

  // ---- Tick ----
  private tick() {
    const now = Date.now();
    const centers = healthCenters.map((c, i) => this.computeCenter(c, now, i, false));
    const fleetSeries = [...this.state.fleetSeries, ...this.buildFleetSeries(centers, now)].slice(-40);

    // historique : un point toutes les 30 min
    let history = this.state.history;
    if (now - this.lastHistoryStamp >= 1800_000) {
      history = { ...history };
      centers.forEach(c => {
        history[c.id] = [...history[c.id].slice(-48), {
          t: now, solar: c.solar_kw, battery: c.battery_pct, water: c.water_pct, cold: c.cold_c, ambient: c.ambient_c, consumption: c.consumption_kw,
        }];
      });
      this.lastHistoryStamp = now;
    }

    // événements de seuil (au plus un par centre et par type et par heure)
    const newEvents: PlatformEvent[] = [];
    centers.forEach(c => {
      const memoKey = (k: string) => `${c.id}:${k}`;
      const canFire = (k: string) => now - (this.thresholdMemo[memoKey(k)] ?? 0) > 3600_000;
      if (c.link !== 'offline' && c.cold_c > 8 && canFire('cold')) {
        this.thresholdMemo[memoKey('cold')] = now;
        newEvents.push(mkEvent(0, 'coldchain', 'critical', `${c.name} : chaîne du froid ${c.cold_c} °C — hors plage 2-8 °C`, `${c.name}: cold chain ${c.cold_c} °C — outside 2-8 °C range`, { centerId: c.id, district: c.district }));
      }
      if (c.link !== 'offline' && c.battery_pct < 15 && canFire('bat')) {
        this.thresholdMemo[memoKey('bat')] = now;
        newEvents.push(mkEvent(0, 'sensor', 'critical', `${c.name} : batterie critique ${c.battery_pct} %`, `${c.name}: critical battery ${c.battery_pct}%`, { centerId: c.id, district: c.district }));
      }
      if (c.link !== 'offline' && c.water_pct < 15 && canFire('water')) {
        this.thresholdMemo[memoKey('water')] = now;
        newEvents.push(mkEvent(0, 'water', 'warning', `${c.name} : réservoir ${c.water_pct} %`, `${c.name}: reservoir ${c.water_pct}%`, { centerId: c.id, district: c.district }));
      }
    });

    // événement d'ambiance toutes les ~35 s
    if (now - this.lastAmbientEvent > 28_000 + Math.random() * 14_000) {
      const [kind, sev, fr, en, centerId] = AMBIENT_EVENTS[this.ambientIdx % AMBIENT_EVENTS.length];
      this.ambientIdx++;
      this.lastAmbientEvent = now;
      newEvents.push(mkEvent(0, kind, sev, fr, en, { centerId, district: centerId ? healthCenters.find(c => c.id === centerId)?.district : undefined }));
    }

    this.commit({
      tick: this.state.tick + 1,
      now,
      centers,
      history,
      fleetSeries,
      events: newEvents.length ? [...newEvents, ...this.state.events].slice(0, 200) : this.state.events,
      unreadEvents: this.state.unreadEvents + newEvents.length,
    });
  }

  // ---- Actions utilisateur ----
  pushEvent(kind: EventKind, severity: PlatformEvent['severity'], fr: string, en: string, opts: Partial<PlatformEvent> = {}) {
    const ev = mkEvent(0, kind, severity, fr, en, opts);
    this.commit({ events: [ev, ...this.state.events].slice(0, 200), unreadEvents: this.state.unreadEvents + 1 });
    return ev;
  }

  markEventsRead() { if (this.state.unreadEvents) this.commit({ unreadEvents: 0 }); }

  setBackend(status: LiveState['backend'], latency: number | null) {
    if (status !== this.state.backend || latency !== this.state.backendLatencyMs) this.commit({ backend: status, backendLatencyMs: latency });
  }

  acknowledgeClimateAlert(id: string, actor: string) {
    const a = this.state.climateAlerts.find(x => x.id === id);
    if (!a || a.acknowledged) return;
    this.commit({ climateAlerts: this.state.climateAlerts.map(x => x.id === id ? { ...x, acknowledged: true } : x) });
    this.pushEvent('ack', 'success', `${actor} a acquitté l'alerte ${a.district}`, `${actor} acknowledged the ${a.district} alert`, { district: a.district, actor });
  }

  acknowledgeHealthAlert(id: string, actor: string) {
    const a = this.state.healthAlerts.find(x => x.id === id);
    if (!a || a.acknowledged) return;
    this.commit({ healthAlerts: this.state.healthAlerts.map(x => x.id === id ? { ...x, acknowledged: true } : x) });
    this.pushEvent('ack', 'success', `${actor} a acquitté l'alerte sanitaire ${a.district}`, `${actor} acknowledged the ${a.district} health alert`, { district: a.district, actor });
  }

  /** Diffuse une alerte climatique aux communautés : retourne le nombre de destinataires. */
  broadcastClimateAlert(id: string, lang: string): number {
    const a = this.state.climateAlerts.find(x => x.id === id);
    if (!a) return 0;
    const recipients = Math.round(a.childrenAffected * 0.24 / 10) * 10; // ~1 mère joignable pour 4 enfants
    this.commit({ climateAlerts: this.state.climateAlerts.map(x => x.id === id ? { ...x, broadcastCount: (x.broadcastCount ?? 0) + recipients } : x) });
    this.pushEvent('sms', 'info', `Diffusion SMS ${lang} — ${recipients.toLocaleString('fr-FR')} destinataires (${a.district})`, `${lang} SMS broadcast — ${recipients.toLocaleString('en-GB')} recipients (${a.district})`, { district: a.district, actor: 'Coordination UNICEF' });
    return recipients;
  }

  addClimateAlert(alert: ClimateAlert) {
    this.commit({ climateAlerts: [alert, ...this.state.climateAlerts] });
    this.pushEvent('alert', alert.severity === 'critical' ? 'critical' : 'warning', `Alerte climatique créée manuellement : ${alert.district}`, `Climate alert created manually: ${alert.district}`, { district: alert.district, actor: 'Coordination UNICEF' });
  }

  addHealthAlert(alert: HealthAlert) {
    this.commit({ healthAlerts: [alert, ...this.state.healthAlerts] });
    this.pushEvent('alert', alert.severity === 'critical' ? 'critical' : 'warning', `Cas déclarés : ${alert.cases} (${alert.district})`, `Cases reported: ${alert.cases} (${alert.district})`, { district: alert.district, actor: 'Coordination UNICEF' });
  }

  resendPrevention(id: string): number {
    const m = this.state.preventionMessages.find(x => x.id === id);
    if (!m) return 0;
    const batch = m.type === 'sms' ? 1200 + Math.round(Math.random() * 400) : m.type === 'voice' ? 600 + Math.round(Math.random() * 200) : 120;
    this.commit({
      preventionMessages: this.state.preventionMessages.map(x => x.id === id ? { ...x, sentCount: x.sentCount + batch, lastSent: new Date().toISOString(), status: 'active' } : x),
    });
    const langLabel = { french: 'français', moore: 'Mooré', dioula: 'Dioula', fulfulde: 'Fulfuldé' }[m.language];
    this.pushEvent('sms', 'info', `Renvoi ${m.type === 'voice' ? 'message vocal' : 'SMS'} ${langLabel} — ${batch.toLocaleString('fr-FR')} destinataires`, `Resent ${m.type === 'voice' ? 'voice message' : 'SMS'} (${langLabel}) — ${batch.toLocaleString('en-GB')} recipients`, { actor: 'Coordination UNICEF' });
    return batch;
  }

  addPrevention(msg: PreventionMessage) {
    this.commit({ preventionMessages: [msg, ...this.state.preventionMessages] });
    this.pushEvent('sms', 'info', `Nouveau message de prévention programmé (${msg.districts.length} districts)`, `New prevention message scheduled (${msg.districts.length} districts)`, { actor: 'Coordination UNICEF' });
  }

  createMaintenanceTicket(centerId: string, fr: string, en: string): string {
    const ticket = `MT-0${430 + Math.floor(Math.random() * 60)}`;
    const c = healthCenters.find(x => x.id === centerId);
    this.pushEvent('maintenance', 'warning', `Ticket ${ticket} créé : ${fr} (${c?.name})`, `Ticket ${ticket} created: ${en} (${c?.name})`, { centerId, district: c?.district, actor: 'Coordination UNICEF' });
    return ticket;
  }
}

export const liveEngine = new LiveEngine();
