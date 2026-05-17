import { useState } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  AlertTriangle,
  Thermometer,
  CloudRain,
  Droplets,
  Bug,
  Users,
  Zap,
  Shield
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { SimulationParams, SimulationResult, SimulationTimelineEntry } from '../types';
import { healthCenters } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';

const districts = ['Koudougou', 'Réo', 'Sapouy', 'Dédougou', 'Boromo', 'Nouna', 'Djibo', 'Dori', 'Gorom-Gorom', 'Sebba'];

function generateSimulationResult(params: SimulationParams, language: string): SimulationResult {
  const intensity = params.intensity === 'high' ? 0.9 : params.intensity === 'medium' ? 0.6 : 0.3;
  const days = params.duration_days;
  const affectedCount = params.affectedDistricts.length;

  const timeline: SimulationTimelineEntry[] = Array.from({ length: days }, (_, i) => {
    const progress = i / days;
    const peak = Math.sin(progress * Math.PI);
    return {
      day: i + 1,
      energyStatus: Math.max(10, 100 - (peak * intensity * 60) - Math.random() * 10),
      waterStatus: Math.max(5, 100 - (peak * intensity * 50) - Math.random() * 15),
      healthRisk: Math.min(100, (peak * intensity * 80) + Math.random() * 10),
      alerts: peak > 0.5 ? [
        params.scenario === 'heat_wave' ? (language === 'fr' ? 'Risque déshydratation élevé' : 'High dehydration risk') :
        params.scenario === 'flood' ? (language === 'fr' ? 'Accès routes coupé' : 'Road access cut off') :
        params.scenario === 'drought' ? (language === 'fr' ? 'Réserves eau critiques' : 'Critical water reserves') :
        (language === 'fr' ? 'Seuil épidémique dépassé' : 'Epidemic threshold exceeded')
      ] : [],
    };
  });

  const recommendationsFr: Record<string, string[]> = {
    heat_wave: [
      'Pré-positionner 5000 sachets de SRO dans les CSPS affectés',
      'Activer le protocole canicule dans les maternités',
      'Renforcer la capacité batterie des centres à risque',
      'Déployer les équipes mobiles de réhydratation',
      'Diffuser les messages de prévention chaleur (SMS + radio)',
      'Vérifier la chaîne du froid toutes les 4 heures',
    ],
    flood: [
      'Sécuriser les stocks de médicaments en hauteur',
      'Préparer les kits d\'urgence choléra',
      'Identifier les routes alternatives d\'accès',
      'Pré-positionner les groupes électrogènes de secours',
      'Alerter les communautés des zones inondables',
      'Préparer l\'évacuation des patients hospitalisés',
    ],
    drought: [
      'Augmenter les approvisionnements en eau par citerne',
      'Renforcer le dépistage malnutrition aiguë',
      'Distribuer les suppléments nutritionnels (ATPE)',
      'Optimiser la consommation d\'eau des centres',
      'Activer les forages de secours',
      'Intensifier la surveillance nutritionnelle communautaire',
    ],
    epidemic: [
      'Activer le plan de riposte épidémique',
      'Augmenter les stocks de médicaments essentiels',
      'Déployer les équipes d\'investigation',
      'Renforcer la surveillance active dans les communautés',
      'Préparer les sites d\'isolement',
      'Coordonner avec les partenaires (OMS, MSF)',
    ],
  };

  const recommendationsEn: Record<string, string[]> = {
    heat_wave: [
      'Pre-position 5000 ORS packets in affected health centers',
      'Activate heat wave protocol in maternity wards',
      'Reinforce battery capacity of at-risk centers',
      'Deploy mobile rehydration teams',
      'Broadcast heat prevention messages (SMS + radio)',
      'Check cold chain every 4 hours',
    ],
    flood: [
      'Secure medicine stocks at elevated positions',
      'Prepare cholera emergency kits',
      'Identify alternative access routes',
      'Pre-position backup generators',
      'Alert communities in flood-prone areas',
      'Prepare evacuation of hospitalized patients',
    ],
    drought: [
      'Increase water supply by tanker',
      'Strengthen acute malnutrition screening',
      'Distribute nutritional supplements (RUTF)',
      'Optimize water consumption in centers',
      'Activate backup boreholes',
      'Intensify community nutritional surveillance',
    ],
    epidemic: [
      'Activate epidemic response plan',
      'Increase essential medicine stocks',
      'Deploy investigation teams',
      'Strengthen active surveillance in communities',
      'Prepare isolation sites',
      'Coordinate with partners (WHO, MSF)',
    ],
  };

  const recs = language === 'fr' ? recommendationsFr : recommendationsEn;

  return {
    scenario: params.scenario,
    impactedCenters: Math.min(10, Math.ceil(affectedCount * 2 * intensity)),
    childrenAtRisk: Math.round(affectedCount * 8000 * intensity),
    energyDeficit_kwh: Math.round(affectedCount * 50 * days * intensity),
    waterDeficit_liters: Math.round(affectedCount * 2000 * days * intensity),
    coldChainBreaks: Math.round(affectedCount * intensity * 2),
    recommendations: recs[params.scenario] || [],
    timeline,
  };
}

export default function Simulation() {
  const { t, language } = useLanguage();

  const scenarios = [
    { id: 'heat_wave', label: t('simulation.heatWave'), icon: Thermometer, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'flood', label: t('simulation.flood'), icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'drought', label: t('simulation.drought'), icon: Droplets, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'epidemic', label: t('simulation.epidemic'), icon: Bug, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  const [params, setParams] = useState<SimulationParams>({
    scenario: 'heat_wave',
    intensity: 'medium',
    duration_days: 7,
    affectedDistricts: ['Djibo', 'Dori'],
    startDate: '2026-05-20',
  });

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      setResult(generateSimulationResult(params, language));
      setIsRunning(false);
    }, 1500);
  };

  const resetSimulation = () => {
    setResult(null);
  };

  const toggleDistrict = (district: string) => {
    setParams(prev => ({
      ...prev,
      affectedDistricts: prev.affectedDistricts.includes(district)
        ? prev.affectedDistricts.filter(d => d !== district)
        : [...prev.affectedDistricts, district]
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('simulation.title')}</h1>
        <p className="text-gray-500 mt-1">{t('simulation.subtitle')}</p>
      </div>

      {/* Configuration panel */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <FlaskConical size={16} className="text-unicef-blue" />
          {t('simulation.config')}
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scenario selection */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('simulation.crisisType')}</label>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setParams(prev => ({ ...prev, scenario: s.id as SimulationParams['scenario'] }))}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    params.scenario === s.id
                      ? `border-unicef-blue ${s.bg}`
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <s.icon size={20} className={s.color} />
                  <p className="text-sm font-medium text-gray-700 mt-1">{s.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('simulation.intensity')}</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setParams(prev => ({ ...prev, intensity: level }))}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      params.intensity === level
                        ? level === 'high' ? 'bg-red-500 text-white' :
                          level === 'medium' ? 'bg-yellow-500 text-white' :
                          'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {level === 'low' ? t('simulation.low') : level === 'medium' ? t('simulation.medium') : t('simulation.high')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
                {t('simulation.duration')}: {params.duration_days} {t('simulation.days')}
              </label>
              <input
                type="range"
                min="3"
                max="30"
                value={params.duration_days}
                onChange={(e) => setParams(prev => ({ ...prev, duration_days: parseInt(e.target.value) }))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-unicef-blue"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>3 {t('simulation.days')}</span>
                <span>30 {t('simulation.days')}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('simulation.startDate')}</label>
              <input
                type="date"
                value={params.startDate}
                onChange={(e) => setParams(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Districts selection */}
        <div className="mt-6">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">
            {t('simulation.affectedDistricts')} ({params.affectedDistricts.length} {t('simulation.selected')})
          </label>
          <div className="flex flex-wrap gap-2">
            {districts.map((district) => (
              <button
                key={district}
                onClick={() => toggleDistrict(district)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  params.affectedDistricts.includes(district)
                    ? 'bg-unicef-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {district}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={runSimulation}
            disabled={isRunning || params.affectedDistricts.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('simulation.running')}
              </>
            ) : (
              <>
                <Play size={16} />
                {t('simulation.run')}
              </>
            )}
          </button>
          {result && (
            <button onClick={resetSimulation} className="btn-secondary flex items-center gap-2">
              <RotateCcw size={16} />
              {t('simulation.reset')}
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-in">
          {/* Impact summary */}
          <div className="card border-l-4 border-l-red-500">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-500" />
              {t('simulation.results')}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <Users size={20} className="text-red-500 mx-auto" />
                <p className="text-lg font-bold text-red-700 mt-1">{result.childrenAtRisk.toLocaleString()}</p>
                <p className="text-xs text-red-600">{t('simulation.childrenAtRisk')}</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <AlertTriangle size={20} className="text-orange-500 mx-auto" />
                <p className="text-lg font-bold text-orange-700 mt-1">{result.impactedCenters}</p>
                <p className="text-xs text-orange-600">{t('simulation.impactedCenters')}</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <Zap size={20} className="text-yellow-600 mx-auto" />
                <p className="text-lg font-bold text-yellow-700 mt-1">{result.energyDeficit_kwh}</p>
                <p className="text-xs text-yellow-600">{t('simulation.energyDeficit')}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Droplets size={20} className="text-blue-500 mx-auto" />
                <p className="text-lg font-bold text-blue-700 mt-1">{(result.waterDeficit_liters / 1000).toFixed(1)}k</p>
                <p className="text-xs text-blue-600">{t('simulation.waterDeficit')}</p>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <Thermometer size={20} className="text-cyan-600 mx-auto" />
                <p className="text-lg font-bold text-cyan-700 mt-1">{result.coldChainBreaks}</p>
                <p className="text-xs text-cyan-600">{t('simulation.coldChainBreaks')}</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <Shield size={20} className="text-green-600 mx-auto" />
                <p className="text-lg font-bold text-green-700 mt-1">{result.recommendations.length}</p>
                <p className="text-xs text-green-600">{t('simulation.actionsProposed')}</p>
              </div>
            </div>
          </div>

          {/* Timeline charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                {t('simulation.energyWaterEvolution')}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={result.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="energyStatus" stroke="#FFC20E" fill="#FFC20E" fillOpacity={0.2} name={t('simulation.energyPct')} />
                  <Area type="monotone" dataKey="waterStatus" stroke="#1CABE2" fill="#1CABE2" fillOpacity={0.2} name={t('simulation.waterPct')} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">
                {t('simulation.healthRiskLevel')}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={result.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="healthRisk" stroke="#E2231A" strokeWidth={2} dot={false} name={t('simulation.healthRiskPct')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recommendations */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-green-600" />
              {t('simulation.actionPlan')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Affected centers */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">
              {t('simulation.affectedCenters')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {healthCenters
                .filter(c => params.affectedDistricts.includes(c.district))
                .map((center) => (
                  <div key={center.id} className="p-3 border border-gray-100 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-800">{center.name}</p>
                      <span className={`w-2 h-2 rounded-full ${
                        center.status === 'operational' ? 'bg-green-500' :
                        center.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{center.district}</p>
                    <div className="mt-2 flex gap-3 text-xs text-gray-500">
                      <span>🔋 {center.solarSystem.batteryLevel}%</span>
                      <span>💧 {center.waterSystem.reservoirLevel}%</span>
                      <span>🌡️ {center.coldChain.temperature}°C</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
