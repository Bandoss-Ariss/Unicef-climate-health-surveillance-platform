/**
 * Translations for mock data content (alert messages, recommendations, etc.)
 * These would come from the backend translation API in production.
 */

import { Language } from './translations';

// Climate alert messages
export const climateAlertMessages: Record<string, Record<Language, string>> = {
  'ca-001': {
    fr: 'Vague de chaleur extrême prévue - températures >45°C pendant 5 jours',
    en: 'Extreme heat wave expected - temperatures >45°C for 5 days',
  },
  'ca-002': {
    fr: "Risque d'inondation élevé - fortes pluies attendues (>80mm en 24h)",
    en: 'High flood risk - heavy rainfall expected (>80mm in 24h)',
  },
  'ca-003': {
    fr: 'Sécheresse prolongée - déficit pluviométrique de 40% sur 3 semaines',
    en: 'Prolonged drought - 40% rainfall deficit over 3 weeks',
  },
  'ca-004': {
    fr: 'Tempête de sable prévue - visibilité réduite, risques respiratoires',
    en: 'Dust storm expected - reduced visibility, respiratory risks',
  },
};

// Climate alert recommendations
export const climateRecommendations: Record<string, Record<Language, string[]>> = {
  'ca-001': {
    fr: [
      'Activer les protocoles de déshydratation dans les CSPS',
      'Distribuer les SRO aux agents communautaires',
      'Renforcer la surveillance des enfants <5 ans',
      'Vérifier les stocks de perfusion',
    ],
    en: [
      'Activate dehydration protocols in health centers',
      'Distribute ORS to community health workers',
      'Strengthen surveillance of children under 5',
      'Check IV fluid stocks',
    ],
  },
  'ca-002': {
    fr: [
      "Préparer les kits d'urgence dans les formations sanitaires",
      'Sécuriser les stocks de médicaments en hauteur',
      'Alerter les communautés riveraines',
      "Préparer l'évacuation des zones à risque",
    ],
    en: [
      'Prepare emergency kits in health facilities',
      'Secure medicine stocks at elevated positions',
      'Alert riverside communities',
      'Prepare evacuation of at-risk areas',
    ],
  },
  'ca-003': {
    fr: [
      'Surveiller les cas de malnutrition aiguë',
      'Renforcer le dépistage communautaire',
      "Vérifier les réserves d'eau des CSPS",
      'Préparer les suppléments nutritionnels',
    ],
    en: [
      'Monitor acute malnutrition cases',
      'Strengthen community screening',
      'Check health center water reserves',
      'Prepare nutritional supplements',
    ],
  },
  'ca-004': {
    fr: [
      'Préparer les traitements respiratoires',
      'Alerter les familles sur la protection des enfants',
      'Vérifier les panneaux solaires après passage',
    ],
    en: [
      'Prepare respiratory treatments',
      'Alert families about child protection',
      'Check solar panels after the storm passes',
    ],
  },
};

// Health alert recommendations
export const healthRecommendations: Record<string, Record<Language, string[]>> = {
  'ha-001': {
    fr: [
      'Renforcer la distribution de moustiquaires',
      "Augmenter les stocks d'ACT",
      'Intensifier la pulvérisation intra-domiciliaire',
      'Activer la surveillance renforcée',
    ],
    en: [
      'Strengthen mosquito net distribution',
      'Increase ACT stocks',
      'Intensify indoor residual spraying',
      'Activate enhanced surveillance',
    ],
  },
  'ha-002': {
    fr: [
      'Déployer les équipes mobiles de dépistage',
      'Augmenter les approvisionnements en ATPE',
      'Référer les cas sévères vers le CMA',
      "Renforcer les programmes d'alimentation complémentaire",
    ],
    en: [
      'Deploy mobile screening teams',
      'Increase RUTF supplies',
      'Refer severe cases to district hospital',
      'Strengthen complementary feeding programs',
    ],
  },
  'ha-003': {
    fr: [
      "Distribuer les SRO en urgence",
      'Former les mères à la préparation des SRO',
      'Surveiller les signes de déshydratation sévère',
      'Préparer les solutions IV pour les cas graves',
    ],
    en: [
      'Distribute ORS urgently',
      'Train mothers on ORS preparation',
      'Monitor signs of severe dehydration',
      'Prepare IV solutions for severe cases',
    ],
  },
  'ha-004': {
    fr: [
      "Vérifier les stocks d'antibiotiques",
      'Surveiller les cas de pneumonie chez les <5 ans',
      "Sensibiliser sur l'hygiène respiratoire",
    ],
    en: [
      'Check antibiotic stocks',
      'Monitor pneumonia cases in children under 5',
      'Raise awareness about respiratory hygiene',
    ],
  },
};

// Prevention message content translations
export const preventionMessageContent: Record<string, Record<Language, string>> = {
  'pm-001': {
    fr: "Chaleur extrême prévue. Donnez beaucoup d'eau à vos enfants. Si diarrhée ou fatigue, allez au CSPS immédiatement.",
    en: "Extreme heat expected. Give plenty of water to your children. If diarrhea or fatigue occurs, go to the health center immediately.",
  },
  'pm-002': {
    fr: "ALERTE: Vague de chaleur J+1. Préparer protocoles déshydratation. Vérifier stocks SRO et perfusions. Surveillance renforcée <5 ans.",
    en: "ALERT: Heat wave D+1. Activate dehydration protocols. Check ORS and IV stocks. Enhanced surveillance for children under 5.",
  },
  'pm-003': {
    fr: "Risque d'inondation dans 48h. Préparer l'évacuation des zones basses. Protéger les réserves alimentaires.",
    en: "Flood risk in 48h. Prepare evacuation of low-lying areas. Protect food reserves.",
  },
  'pm-004': {
    fr: "Paludisme en hausse. Faites dormir vos enfants sous moustiquaire. Consultez si fièvre > 2 jours.",
    en: "Malaria on the rise. Have your children sleep under mosquito nets. Consult if fever persists > 2 days.",
  },
  'pm-005': {
    fr: "Message vocal de prévention sur la malnutrition et l'alimentation des enfants pendant la période de soudure.",
    en: "Voice message on malnutrition prevention and child feeding during the lean season.",
  },
};

export const preventionTriggerConditions: Record<string, Record<Language, string>> = {
  'pm-001': { fr: 'Température > 42°C', en: 'Temperature > 42°C' },
  'pm-002': { fr: 'Alerte canicule activée', en: 'Heat wave alert activated' },
  'pm-003': { fr: 'Prévision pluie > 60mm/24h', en: 'Rain forecast > 60mm/24h' },
  'pm-004': { fr: 'Cas paludisme > seuil épidémique', en: 'Malaria cases > epidemic threshold' },
  'pm-005': { fr: 'Début période de soudure', en: 'Start of lean season' },
};

// Select/filter labels that appear in dropdowns
export const filterLabels = {
  allDistricts: { fr: 'Tous les districts', en: 'All districts' },
  allStatuses: { fr: 'Tous les statuts', en: 'All statuses' },
  operational: { fr: 'Opérationnel', en: 'Operational' },
  partial: { fr: 'Partiel', en: 'Partial' },
  offline: { fr: 'Hors ligne', en: 'Offline' },
};

// Status badges on center cards
export const statusBadges = {
  operational: { fr: 'OK', en: 'OK' },
  partial: { fr: 'Partiel', en: 'Partial' },
  offline: { fr: 'Hors ligne', en: 'Offline' },
};

// Center card labels
export const centerCardLabels = {
  solar: { fr: 'Solaire', en: 'Solar' },
  water: { fr: 'Eau', en: 'Water' },
  coldChain: { fr: 'Chaîne froid', en: 'Cold Chain' },
  type: { fr: 'Type', en: 'Type' },
};

// Summary card labels on HealthCenters page
export const summaryLabels = {
  operational: { fr: 'Opérationnels', en: 'Operational' },
  partial: { fr: 'Partiels', en: 'Partial' },
  offline: { fr: 'Hors ligne', en: 'Offline' },
};
