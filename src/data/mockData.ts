import { HealthCenter, ClimateAlert, HealthAlert, DashboardStats, PreventionMessage } from '../types';

export const healthCenters: HealthCenter[] = [
  {
    id: 'cs-001',
    name: 'CSPS de Koudougou Nord',
    district: 'Koudougou',
    region: 'Centre-Ouest',
    latitude: 12.2533,
    longitude: -2.3628,
    type: 'CSPS',
    status: 'operational',
    solarSystem: {
      installed: true,
      capacity_kw: 5.4,
      currentProduction_kw: 4.2,
      batteryLevel: 87,
      status: 'optimal',
      dailyProduction_kwh: [18, 22, 20, 24, 19, 21, 23],
      panelCount: 12,
      lastMaintenance: '2026-04-15'
    },
    waterSystem: {
      available: true,
      reservoirLevel: 72,
      dailyConsumption_liters: 450,
      quality: 'good',
      pumpStatus: 'running'
    },
    coldChain: {
      temperature: 4.2,
      status: 'optimal',
      vaccineStock: [
        { name: 'BCG', quantity: 120, expiryDate: '2026-09-15', temperatureOk: true },
        { name: 'Penta', quantity: 85, expiryDate: '2026-08-20', temperatureOk: true },
        { name: 'VPO', quantity: 200, expiryDate: '2026-12-01', temperatureOk: true }
      ],
      lastCheck: '2026-05-17T08:00:00'
    },
    lastUpdate: '2026-05-17T10:30:00'
  },
  {
    id: 'cs-002',
    name: 'CMA de Réo',
    district: 'Réo',
    region: 'Centre-Ouest',
    latitude: 12.3167,
    longitude: -2.4667,
    type: 'CMA',
    status: 'operational',
    solarSystem: {
      installed: true,
      capacity_kw: 8.0,
      currentProduction_kw: 6.8,
      batteryLevel: 92,
      status: 'optimal',
      dailyProduction_kwh: [28, 32, 30, 35, 29, 31, 33],
      panelCount: 18,
      lastMaintenance: '2026-04-20'
    },
    waterSystem: {
      available: true,
      reservoirLevel: 85,
      dailyConsumption_liters: 800,
      quality: 'good',
      pumpStatus: 'running'
    },
    coldChain: {
      temperature: 3.8,
      status: 'optimal',
      vaccineStock: [
        { name: 'BCG', quantity: 250, expiryDate: '2026-10-15', temperatureOk: true },
        { name: 'Penta', quantity: 180, expiryDate: '2026-09-20', temperatureOk: true },
        { name: 'RR', quantity: 150, expiryDate: '2026-11-01', temperatureOk: true },
        { name: 'VPO', quantity: 300, expiryDate: '2027-01-15', temperatureOk: true }
      ],
      lastCheck: '2026-05-17T07:30:00'
    },
    lastUpdate: '2026-05-17T10:15:00'
  },
  {
    id: 'cs-003',
    name: 'CSPS de Sapouy',
    district: 'Sapouy',
    region: 'Centre-Ouest',
    latitude: 11.5544,
    longitude: -1.7731,
    type: 'CSPS',
    status: 'partial',
    solarSystem: {
      installed: true,
      capacity_kw: 4.0,
      currentProduction_kw: 2.1,
      batteryLevel: 35,
      status: 'degraded',
      dailyProduction_kwh: [12, 10, 8, 14, 9, 11, 7],
      panelCount: 8,
      lastMaintenance: '2026-02-10'
    },
    waterSystem: {
      available: true,
      reservoirLevel: 28,
      dailyConsumption_liters: 320,
      quality: 'acceptable',
      pumpStatus: 'running'
    },
    coldChain: {
      temperature: 6.8,
      status: 'warning',
      vaccineStock: [
        { name: 'BCG', quantity: 45, expiryDate: '2026-07-15', temperatureOk: true },
        { name: 'Penta', quantity: 20, expiryDate: '2026-06-20', temperatureOk: false }
      ],
      lastCheck: '2026-05-17T09:00:00'
    },
    lastUpdate: '2026-05-17T09:45:00'
  },
  {
    id: 'cs-004',
    name: 'CSPS de Dédougou Est',
    district: 'Dédougou',
    region: 'Boucle du Mouhoun',
    latitude: 12.4633,
    longitude: -3.4608,
    type: 'CSPS',
    status: 'operational',
    solarSystem: {
      installed: true,
      capacity_kw: 5.0,
      currentProduction_kw: 4.5,
      batteryLevel: 78,
      status: 'optimal',
      dailyProduction_kwh: [17, 20, 19, 22, 18, 21, 20],
      panelCount: 10,
      lastMaintenance: '2026-05-01'
    },
    waterSystem: {
      available: true,
      reservoirLevel: 65,
      dailyConsumption_liters: 380,
      quality: 'good',
      pumpStatus: 'running'
    },
    coldChain: {
      temperature: 4.0,
      status: 'optimal',
      vaccineStock: [
        { name: 'BCG', quantity: 100, expiryDate: '2026-11-15', temperatureOk: true },
        { name: 'Penta', quantity: 75, expiryDate: '2026-10-20', temperatureOk: true },
        { name: 'VPO', quantity: 160, expiryDate: '2026-12-01', temperatureOk: true }
      ],
      lastCheck: '2026-05-17T08:30:00'
    },
    lastUpdate: '2026-05-17T10:00:00'
  },
  {
    id: 'cs-005',
    name: 'CMA de Boromo',
    district: 'Boromo',
    region: 'Boucle du Mouhoun',
    latitude: 11.7450,
    longitude: -2.9300,
    type: 'CMA',
    status: 'partial',
    solarSystem: {
      installed: true,
      capacity_kw: 7.5,
      currentProduction_kw: 3.2,
      batteryLevel: 42,
      status: 'degraded',
      dailyProduction_kwh: [20, 15, 12, 18, 14, 16, 13],
      panelCount: 16,
      lastMaintenance: '2026-01-20'
    },
    waterSystem: {
      available: true,
      reservoirLevel: 45,
      dailyConsumption_liters: 650,
      quality: 'acceptable',
      pumpStatus: 'running'
    },
    coldChain: {
      temperature: 5.5,
      status: 'warning',
      vaccineStock: [
        { name: 'BCG', quantity: 180, expiryDate: '2026-08-15', temperatureOk: true },
        { name: 'Penta', quantity: 90, expiryDate: '2026-07-20', temperatureOk: true },
        { name: 'RR', quantity: 60, expiryDate: '2026-06-01', temperatureOk: false }
      ],
      lastCheck: '2026-05-17T07:00:00'
    },
    lastUpdate: '2026-05-17T09:30:00'
  },
  {
    id: 'cs-006',
    name: 'CSPS de Nouna',
    district: 'Nouna',
    region: 'Boucle du Mouhoun',
    latitude: 12.7333,
    longitude: -3.8667,
    type: 'CSPS',
    status: 'offline',
    solarSystem: {
      installed: true,
      capacity_kw: 4.5,
      currentProduction_kw: 0,
      batteryLevel: 5,
      status: 'failure',
      dailyProduction_kwh: [15, 12, 8, 3, 0, 0, 0],
      panelCount: 9,
      lastMaintenance: '2025-11-15'
    },
    waterSystem: {
      available: false,
      reservoirLevel: 8,
      dailyConsumption_liters: 200,
      quality: 'poor',
      pumpStatus: 'stopped'
    },
    coldChain: {
      temperature: 12.5,
      status: 'critical',
      vaccineStock: [
        { name: 'BCG', quantity: 30, expiryDate: '2026-06-15', temperatureOk: false },
        { name: 'Penta', quantity: 10, expiryDate: '2026-06-20', temperatureOk: false }
      ],
      lastCheck: '2026-05-16T14:00:00'
    },
    lastUpdate: '2026-05-16T14:30:00'
  },
  {
    id: 'cs-007',
    name: 'CSPS de Djibo',
    district: 'Djibo',
    region: 'Sahel',
    latitude: 14.1000,
    longitude: -1.6333,
    type: 'CSPS',
    status: 'operational',
    solarSystem: {
      installed: true,
      capacity_kw: 6.0,
      currentProduction_kw: 5.5,
      batteryLevel: 95,
      status: 'optimal',
      dailyProduction_kwh: [25, 28, 27, 30, 26, 29, 28],
      panelCount: 14,
      lastMaintenance: '2026-05-05'
    },
    waterSystem: {
      available: true,
      reservoirLevel: 55,
      dailyConsumption_liters: 520,
      quality: 'good',
      pumpStatus: 'running'
    },
    coldChain: {
      temperature: 3.5,
      status: 'optimal',
      vaccineStock: [
        { name: 'BCG', quantity: 200, expiryDate: '2026-12-15', temperatureOk: true },
        { name: 'Penta', quantity: 150, expiryDate: '2026-11-20', temperatureOk: true },
        { name: 'VPO', quantity: 250, expiryDate: '2027-02-01', temperatureOk: true }
      ],
      lastCheck: '2026-05-17T06:30:00'
    },
    lastUpdate: '2026-05-17T10:45:00'
  },
  {
    id: 'cs-008',
    name: 'CMA de Dori',
    district: 'Dori',
    region: 'Sahel',
    latitude: 14.0333,
    longitude: -0.0333,
    type: 'CMA',
    status: 'operational',
    solarSystem: {
      installed: true,
      capacity_kw: 10.0,
      currentProduction_kw: 8.8,
      batteryLevel: 88,
      status: 'optimal',
      dailyProduction_kwh: [35, 38, 36, 40, 34, 37, 39],
      panelCount: 22,
      lastMaintenance: '2026-04-28'
    },
    waterSystem: {
      available: true,
      reservoirLevel: 70,
      dailyConsumption_liters: 1200,
      quality: 'good',
      pumpStatus: 'running'
    },
    coldChain: {
      temperature: 4.1,
      status: 'optimal',
      vaccineStock: [
        { name: 'BCG', quantity: 350, expiryDate: '2027-01-15', temperatureOk: true },
        { name: 'Penta', quantity: 280, expiryDate: '2026-12-20', temperatureOk: true },
        { name: 'RR', quantity: 200, expiryDate: '2027-03-01', temperatureOk: true },
        { name: 'VPO', quantity: 400, expiryDate: '2027-04-15', temperatureOk: true }
      ],
      lastCheck: '2026-05-17T07:00:00'
    },
    lastUpdate: '2026-05-17T10:30:00'
  },
  {
    id: 'cs-009',
    name: 'CSPS de Gorom-Gorom',
    district: 'Gorom-Gorom',
    region: 'Sahel',
    latitude: 14.4500,
    longitude: -0.2333,
    type: 'CSPS',
    status: 'partial',
    solarSystem: {
      installed: true,
      capacity_kw: 5.0,
      currentProduction_kw: 3.8,
      batteryLevel: 60,
      status: 'degraded',
      dailyProduction_kwh: [18, 16, 20, 15, 17, 14, 19],
      panelCount: 10,
      lastMaintenance: '2026-03-10'
    },
    waterSystem: {
      available: true,
      reservoirLevel: 32,
      dailyConsumption_liters: 400,
      quality: 'acceptable',
      pumpStatus: 'running'
    },
    coldChain: {
      temperature: 5.8,
      status: 'warning',
      vaccineStock: [
        { name: 'BCG', quantity: 60, expiryDate: '2026-08-15', temperatureOk: true },
        { name: 'Penta', quantity: 35, expiryDate: '2026-07-20', temperatureOk: true }
      ],
      lastCheck: '2026-05-17T08:00:00'
    },
    lastUpdate: '2026-05-17T09:00:00'
  },
  {
    id: 'cs-010',
    name: 'CSPS de Sebba',
    district: 'Sebba',
    region: 'Sahel',
    latitude: 13.4333,
    longitude: 0.5333,
    type: 'CSPS',
    status: 'operational',
    solarSystem: {
      installed: true,
      capacity_kw: 5.5,
      currentProduction_kw: 4.9,
      batteryLevel: 82,
      status: 'optimal',
      dailyProduction_kwh: [20, 23, 21, 25, 19, 22, 24],
      panelCount: 12,
      lastMaintenance: '2026-04-10'
    },
    waterSystem: {
      available: true,
      reservoirLevel: 58,
      dailyConsumption_liters: 350,
      quality: 'good',
      pumpStatus: 'running'
    },
    coldChain: {
      temperature: 4.3,
      status: 'optimal',
      vaccineStock: [
        { name: 'BCG', quantity: 110, expiryDate: '2026-10-15', temperatureOk: true },
        { name: 'Penta', quantity: 80, expiryDate: '2026-09-20', temperatureOk: true },
        { name: 'VPO', quantity: 170, expiryDate: '2026-11-01', temperatureOk: true }
      ],
      lastCheck: '2026-05-17T07:30:00'
    },
    lastUpdate: '2026-05-17T10:15:00'
  }
];

export const climateAlerts: ClimateAlert[] = [
  {
    id: 'ca-001',
    type: 'heat_wave',
    severity: 'critical',
    region: 'Sahel',
    district: 'Djibo',
    message: 'Vague de chaleur extrême prévue - températures >45°C pendant 5 jours',
    startDate: '2026-05-18',
    endDate: '2026-05-23',
    affectedPopulation: 125000,
    childrenAffected: 52000,
    recommendations: [
      'Activer les protocoles de déshydratation dans les CSPS',
      'Distribuer les SRO aux agents communautaires',
      'Renforcer la surveillance des enfants <5 ans',
      'Vérifier les stocks de perfusion'
    ],
    status: 'active'
  },
  {
    id: 'ca-002',
    type: 'flood',
    severity: 'high',
    region: 'Boucle du Mouhoun',
    district: 'Boromo',
    message: 'Risque d\'inondation élevé - fortes pluies attendues (>80mm en 24h)',
    startDate: '2026-05-20',
    endDate: '2026-05-22',
    affectedPopulation: 45000,
    childrenAffected: 18000,
    recommendations: [
      'Préparer les kits d\'urgence dans les formations sanitaires',
      'Sécuriser les stocks de médicaments en hauteur',
      'Alerter les communautés riveraines',
      'Préparer l\'évacuation des zones à risque'
    ],
    status: 'active'
  },
  {
    id: 'ca-003',
    type: 'drought',
    severity: 'medium',
    region: 'Centre-Ouest',
    district: 'Sapouy',
    message: 'Sécheresse prolongée - déficit pluviométrique de 40% sur 3 semaines',
    startDate: '2026-04-28',
    affectedPopulation: 32000,
    childrenAffected: 14000,
    recommendations: [
      'Surveiller les cas de malnutrition aiguë',
      'Renforcer le dépistage communautaire',
      'Vérifier les réserves d\'eau des CSPS',
      'Préparer les suppléments nutritionnels'
    ],
    status: 'monitoring'
  },
  {
    id: 'ca-004',
    type: 'dust_storm',
    severity: 'medium',
    region: 'Sahel',
    district: 'Gorom-Gorom',
    message: 'Tempête de sable prévue - visibilité réduite, risques respiratoires',
    startDate: '2026-05-19',
    endDate: '2026-05-20',
    affectedPopulation: 28000,
    childrenAffected: 11000,
    recommendations: [
      'Préparer les traitements respiratoires',
      'Alerter les familles sur la protection des enfants',
      'Vérifier les panneaux solaires après passage'
    ],
    status: 'active'
  }
];

export const healthAlerts: HealthAlert[] = [
  {
    id: 'ha-001',
    type: 'malaria',
    severity: 'high',
    region: 'Boucle du Mouhoun',
    district: 'Boromo',
    cases: 342,
    childrenCases: 187,
    trend: 'increasing',
    startDate: '2026-05-10',
    recommendations: [
      'Renforcer la distribution de moustiquaires',
      'Augmenter les stocks d\'ACT',
      'Intensifier la pulvérisation intra-domiciliaire',
      'Activer la surveillance renforcée'
    ]
  },
  {
    id: 'ha-002',
    type: 'malnutrition',
    severity: 'critical',
    region: 'Sahel',
    district: 'Djibo',
    cases: 520,
    childrenCases: 480,
    trend: 'increasing',
    startDate: '2026-04-15',
    recommendations: [
      'Déployer les équipes mobiles de dépistage',
      'Augmenter les approvisionnements en ATPE',
      'Référer les cas sévères vers le CMA',
      'Renforcer les programmes d\'alimentation complémentaire'
    ]
  },
  {
    id: 'ha-003',
    type: 'dehydration',
    severity: 'high',
    region: 'Sahel',
    district: 'Gorom-Gorom',
    cases: 89,
    childrenCases: 67,
    trend: 'increasing',
    startDate: '2026-05-12',
    recommendations: [
      'Distribuer les SRO en urgence',
      'Former les mères à la préparation des SRO',
      'Surveiller les signes de déshydratation sévère',
      'Préparer les solutions IV pour les cas graves'
    ]
  },
  {
    id: 'ha-004',
    type: 'respiratory',
    severity: 'medium',
    region: 'Centre-Ouest',
    district: 'Koudougou',
    cases: 156,
    childrenCases: 92,
    trend: 'stable',
    startDate: '2026-05-05',
    recommendations: [
      'Vérifier les stocks d\'antibiotiques',
      'Surveiller les cas de pneumonie chez les <5 ans',
      'Sensibiliser sur l\'hygiène respiratoire'
    ]
  }
];

export const dashboardStats: DashboardStats = {
  totalCenters: 10,
  operationalCenters: 7,
  solarizedCenters: 10,
  activeAlerts: 7,
  childrenCovered: 85000,
  energySaved_kwh: 4520,
  vaccinesCovered: 95,
  waterAvailability: 72
};

export const preventionMessages: PreventionMessage[] = [
  {
    id: 'pm-001',
    type: 'sms',
    target: 'mothers',
    language: 'moore',
    content: 'Chaleur extrême prévue. Donnez beaucoup d\'eau à vos enfants. Si diarrhée ou fatigue, allez au CSPS immédiatement.',
    triggerCondition: 'Température > 42°C',
    sentCount: 12500,
    lastSent: '2026-05-17T06:00:00'
  },
  {
    id: 'pm-002',
    type: 'sms',
    target: 'health_workers',
    language: 'french',
    content: 'ALERTE: Vague de chaleur J+1. Préparer protocoles déshydratation. Vérifier stocks SRO et perfusions. Surveillance renforcée <5 ans.',
    triggerCondition: 'Alerte canicule activée',
    sentCount: 45,
    lastSent: '2026-05-17T05:30:00'
  },
  {
    id: 'pm-003',
    type: 'community',
    target: 'community_leaders',
    language: 'fulfulde',
    content: 'Risque d\'inondation dans 48h. Préparer l\'évacuation des zones basses. Protéger les réserves alimentaires.',
    triggerCondition: 'Prévision pluie > 60mm/24h',
    sentCount: 320,
    lastSent: '2026-05-16T18:00:00'
  },
  {
    id: 'pm-004',
    type: 'sms',
    target: 'mothers',
    language: 'dioula',
    content: 'Paludisme en hausse. Faites dormir vos enfants sous moustiquaire. Consultez si fièvre > 2 jours.',
    triggerCondition: 'Cas paludisme > seuil épidémique',
    sentCount: 8900,
    lastSent: '2026-05-15T07:00:00'
  },
  {
    id: 'pm-005',
    type: 'voice',
    target: 'all',
    language: 'moore',
    content: 'Message vocal de prévention sur la malnutrition et l\'alimentation des enfants pendant la période de soudure.',
    triggerCondition: 'Début période de soudure',
    sentCount: 25000,
    lastSent: '2026-05-10T08:00:00'
  }
];
