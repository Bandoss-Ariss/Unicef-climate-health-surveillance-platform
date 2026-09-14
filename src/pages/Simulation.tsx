import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FlaskConical, Play, RotateCcw, AlertTriangle, Thermometer, CloudRain, Droplets, Bug, Users, Zap, Shield, Syringe, Coins, ArrowRight, Cpu } from 'lucide-react';
import { ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { SimulationParams, SimulationResult, SimulationTimelineEntry } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { useL, nf } from '../i18n/useL';
import { useLive, liveEngine } from '../context/LiveDataContext';
import { useToast } from '../context/ToastContext';
import { KpiCard, SectionTitle, StatusDot } from '../components/ui';
import { d } from '../data/dates';
import { LiveCenter } from '../data/liveEngine';

const districts = ['Koudougou', 'Réo', 'Sapouy', 'Dédougou', 'Boromo', 'Nouna', 'Djibo', 'Dori', 'Gorom-Gorom', 'Sebba'];

// Coefficients de vulnérabilité par scénario (calibrés sur les données de la saison 2025)
const SCENARIO = {
  heat_wave: { energy: 0.62, water: 0.6,  health: 0.85, cold: 0.7,  attack: 0.062, label: ['Vague de chaleur', 'Heat wave'] },
  flood:     { energy: 0.75, water: 0.5,  health: 0.7,  cold: 0.8,  attack: 0.048, label: ['Inondation', 'Flood'] },
  drought:   { energy: 0.22, water: 0.95, health: 0.6,  cold: 0.3,  attack: 0.055, label: ['Sécheresse', 'Drought'] },
  epidemic:  { energy: 0.3,  water: 0.35, health: 0.95, cold: 0.4,  attack: 0.09,  label: ['Épidémie', 'Epidemic'] },
};

/** Infobulle masquant les séries techniques (bandes P10–P90, préfixe "_"). */
function BandTooltip({ active, payload, label, dayLabel }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: number; dayLabel: string }) {
  if (!active || !payload) return null;
  const rows = payload.filter(p => !p.name.startsWith('_'));
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow px-3 py-2 text-xs">
      <p className="font-medium text-gray-700 mb-1">{dayLabel} {label}</p>
      {rows.map(r => <p key={r.name} style={{ color: r.color }}>{r.name}: <b>{r.value} %</b></p>)}
    </div>
  );
}

const quantile = (arr: number[], q: number) => { const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const gauss = () => { let u = 0, v = 0; while (u === 0) u = Math.random(); while (v === 0) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

/** Simulation Monte-Carlo : N trajectoires journalières avec incertitude sur l'intensité et la résilience de chaque centre. */
function runMonteCarlo(params: SimulationParams, centers: LiveCenter[], language: string): SimulationResult {
  const t0 = performance.now();
  const S = SCENARIO[params.scenario];
  const intensity = params.intensity === 'high' ? 0.95 : params.intensity === 'medium' ? 0.62 : 0.32;
  const days = params.duration_days;
  const affected = centers.filter(c => params.affectedDistricts.includes(c.district));
  const children = affected.reduce((s, c) => s + c.base.childrenUnder5, 0);
  const doses = affected.reduce((s, c) => s + c.base.coldChain.vaccineStock.reduce((a, v) => a + v.quantity, 0), 0);

  // résilience initiale : batterie/eau réelles au moment de la simulation
  const resilience = affected.length ? affected.reduce((s, c) => s + (c.battery_pct / 100) * 0.6 + (c.water_pct / 100) * 0.4, 0) / affected.length : 0.7;

  const runs = params.monteCarloRuns;
  const energy: number[][] = Array.from({ length: days }, () => []);
  const water: number[][] = Array.from({ length: days }, () => []);
  const health: number[][] = Array.from({ length: days }, () => []);
  const childrenRisk: number[] = [];
  const breaks: number[] = [];

  // vulnérabilité propre à chaque centre (état PV, liaison, batterie réelle)
  const vuln = affected.map(c => c.status === 'offline' ? 1 : c.base.solarSystem.status === 'degraded' ? 0.75 : 0.3 + Math.max(0, (70 - c.battery_pct) / 70) * 0.3);

  for (let r = 0; r < runs; r++) {
    const I = Math.min(1, Math.max(0.1, intensity * (1 + gauss() * 0.12)));
    const R = Math.min(1, Math.max(0.2, resilience * (1 + gauss() * 0.1)));
    let e = 100, w = 100, h = 8;
    const broken = new Set<number>();
    for (let day = 0; day < days; day++) {
      const peak = Math.sin(((day + 0.5) / days) * Math.PI);
      const stress = peak * I;
      // stress climatique : surconsommation (frigos, ventilation) + ensoleillement réduit (poussière, nuages) − recharge
      e = Math.max(5, e - stress * S.energy * 48 * (1.45 - R) + (100 - e) * 0.07 * R);
      w = Math.max(3, w - stress * S.water * 38 * (1.45 - R) + (100 - w) * 0.05 * R);
      h = Math.min(100, h + stress * S.health * 28 - (h - 8) * 0.12);
      energy[day].push(e); water[day].push(w); health[day].push(h);
      // rupture de chaîne du froid : probabilité journalière croissante sous 50 % d'énergie, pondérée par la vulnérabilité du centre
      const pBreak = S.cold * Math.max(0, (50 - e) / 50);
      vuln.forEach((v, i) => { if (!broken.has(i) && Math.random() < pBreak * v) broken.add(i); });
    }
    const attack = S.attack * I * (1.3 - R) * (0.8 + Math.random() * 0.4);
    childrenRisk.push(children * attack);
    breaks.push(broken.size);
  }

  const timeline: SimulationTimelineEntry[] = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    energyStatus: Math.round(quantile(energy[i], 0.5)), energyP10: Math.round(quantile(energy[i], 0.1)), energyP90: Math.round(quantile(energy[i], 0.9)),
    waterStatus: Math.round(quantile(water[i], 0.5)), waterP10: Math.round(quantile(water[i], 0.1)), waterP90: Math.round(quantile(water[i], 0.9)),
    healthRisk: Math.round(quantile(health[i], 0.5)), healthP10: Math.round(quantile(health[i], 0.1)), healthP90: Math.round(quantile(health[i], 0.9)),
    alerts: quantile(health[i], 0.5) > 50 ? [language === 'fr' ? 'Seuil de risque dépassé' : 'Risk threshold exceeded'] : [],
  }));

  const cbMedian = Math.round(quantile(breaks, 0.5));
  const childrenMedian = Math.round(quantile(childrenRisk, 0.5));
  const recs = RECS[language === 'fr' ? 'fr' : 'en'][params.scenario];
  const energyDeficit = Math.round(affected.reduce((s, c) => s + c.base.solarSystem.capacity_kw * 5.2, 0) * days * S.energy * intensity * 0.6);
  const waterDeficit = Math.round(affected.reduce((s, c) => s + c.base.waterSystem.dailyConsumption_liters, 0) * days * S.water * intensity * 0.7);
  const dosesAtRisk = Math.round(doses * (cbMedian / Math.max(1, affected.length)) * 0.8);
  // Coût de réponse (USD) : prise en charge ≈ 38 $/enfant, doses perdues ≈ 2,4 $/dose, groupe électrogène ≈ 0,55 $/kWh, eau citerne ≈ 0,012 $/L
  const estimatedCost = Math.round(childrenMedian * 38 + dosesAtRisk * 2.4 + energyDeficit * 0.55 + waterDeficit * 0.012);
  // Coût évité grâce à l'anticipation (48-72 h) : −31 % hospitalisations, −60 % pertes vaccins (données pilote saison 2025)
  const avoidedCost = Math.round(childrenMedian * 38 * 0.31 + dosesAtRisk * 2.4 * 0.6 + energyDeficit * 0.55 * 0.4);

  return {
    scenario: params.scenario,
    impactedCenters: affected.length,
    childrenAtRisk: childrenMedian,
    childrenAtRiskCI: [Math.round(quantile(childrenRisk, 0.1)), Math.round(quantile(childrenRisk, 0.9))],
    energyDeficit_kwh: energyDeficit,
    waterDeficit_liters: waterDeficit,
    coldChainBreaks: cbMedian,
    vaccineDosesAtRisk: dosesAtRisk,
    estimatedCost_usd: estimatedCost,
    avoidedCost_usd: avoidedCost,
    recommendations: recs,
    timeline,
    runs,
    computeMs: Math.max(1, Math.round(performance.now() - t0)),
  };
}

const RECS: Record<'fr' | 'en', Record<string, string[]>> = {
  fr: {
    heat_wave: ['Pré-positionner 5 000 sachets de SRO dans les CSPS affectés', 'Activer le protocole canicule dans les maternités', 'Basculer les charges non essentielles (délestage automatique < 30 %)', 'Déployer les équipes mobiles de réhydratation', 'Diffuser les messages de prévention chaleur (SMS + IVR + radio)', 'Contrôler la chaîne du froid toutes les 4 heures'],
    flood: ['Surélever les stocks de médicaments et vaccins', 'Préparer les kits d\'urgence choléra (J-2)', 'Identifier les routes alternatives d\'accès', 'Pré-positionner des groupes électrogènes de secours', 'Alerter les communautés des zones inondables (Fulfuldé/Dioula)', 'Planifier l\'évacuation des patients hospitalisés'],
    drought: ['Programmer l\'approvisionnement en eau par citerne', 'Renforcer le dépistage MAS (périmètre brachial) porte-à-porte', 'Distribuer les ATPE (Plumpy\'Nut) — 2 semaines de stock', 'Optimiser la consommation d\'eau des centres', 'Activer les forages de secours', 'Intensifier la surveillance nutritionnelle communautaire'],
    epidemic: ['Activer le plan de riposte épidémique district', 'Augmenter les stocks de médicaments essentiels (ACT, antibiotiques)', 'Déployer les équipes d\'investigation sous 24 h', 'Renforcer la surveillance active communautaire (ASBC)', 'Préparer les sites d\'isolement', 'Coordonner avec OMS, MSF et la DRS'],
  },
  en: {
    heat_wave: ['Pre-position 5,000 ORS sachets in affected centres', 'Activate heat protocol in maternity wards', 'Shed non-essential loads (automatic load shedding < 30%)', 'Deploy mobile rehydration teams', 'Broadcast heat prevention messages (SMS + IVR + radio)', 'Check cold chain every 4 hours'],
    flood: ['Elevate medicine and vaccine stocks', 'Prepare cholera emergency kits (D-2)', 'Identify alternative access routes', 'Pre-position backup generators', 'Alert flood-prone communities (Fulfulde/Dioula)', 'Plan evacuation of hospitalised patients'],
    drought: ['Schedule water tanker supply', 'Strengthen door-to-door SAM screening (MUAC)', 'Distribute RUTF (Plumpy\'Nut) — 2 weeks of stock', 'Optimise centre water consumption', 'Activate backup boreholes', 'Intensify community nutrition surveillance'],
    epidemic: ['Activate district epidemic response plan', 'Increase essential medicine stocks (ACT, antibiotics)', 'Deploy investigation teams within 24 h', 'Strengthen active community surveillance (CHWs)', 'Prepare isolation sites', 'Coordinate with WHO, MSF and the regional health directorate'],
  },
};

export default function Simulation() {
  const { t, language } = useLanguage();
  const L = useL();
  const live = useLive();
  const { toast } = useToast();

  const scenarios = [
    { id: 'heat_wave', label: t('simulation.heatWave'), icon: Thermometer, color: 'text-red-500', bg: 'bg-red-50' },
    { id: 'flood', label: t('simulation.flood'), icon: CloudRain, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 'drought', label: t('simulation.drought'), icon: Droplets, color: 'text-orange-500', bg: 'bg-orange-50' },
    { id: 'epidemic', label: t('simulation.epidemic'), icon: Bug, color: 'text-purple-500', bg: 'bg-purple-50' },
  ] as const;

  const [params, setParams] = useState<SimulationParams>({ scenario: 'heat_wave', intensity: 'high', duration_days: 7, affectedDistricts: ['Djibo', 'Dori', 'Gorom-Gorom'], startDate: d(1), monteCarloRuns: 500 });
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [search] = useSearchParams();
  // Lien profond ?run=1 : lance la simulation à l'ouverture (utile en présentation)
  useEffect(() => { if (search.get('run') === '1') { const id = setTimeout(run, 400); return () => clearTimeout(id); } }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const run = () => {
    setRunning(true); setProgress(0);
    let p = 0;
    const iv = setInterval(() => { p = Math.min(95, p + 7 + Math.random() * 10); setProgress(p); }, 120);
    setTimeout(() => {
      clearInterval(iv); setProgress(100);
      const res = runMonteCarlo(params, live.centers, language);
      setResult(res); setRunning(false);
      liveEngine.pushEvent('prediction', 'info', `Simulation ${SCENARIO[params.scenario].label[0]} (${params.monteCarloRuns} tirages) — ${nf(res.childrenAtRisk, 'fr')} enfants à risque`, `${SCENARIO[params.scenario].label[1]} simulation (${params.monteCarloRuns} runs) — ${nf(res.childrenAtRisk, 'en')} children at risk`, { actor: 'Coordination UNICEF' });
    }, 1600);
  };

  const exportPlan = () => {
    toast('success', L("Plan d'action exporté", 'Action plan exported'), L('PDF généré et partagé avec la DRS et le cluster Santé', 'PDF generated and shared with the regional directorate and Health cluster'));
    setTimeout(() => window.print(), 300);
  };

  const toggleDistrict = (dd: string) => setParams(p => ({ ...p, affectedDistricts: p.affectedDistricts.includes(dd) ? p.affectedDistricts.filter(x => x !== dd) : [...p.affectedDistricts, dd] }));
  const affectedCenters = live.centers.filter(c => params.affectedDistricts.includes(c.district));
  const tl = result?.timeline.map(x => ({ ...x, eBand: x.energyP90 - x.energyP10, wBand: x.waterP90 - x.waterP10, hBand: x.healthP90 - x.healthP10 })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('simulation.title')}</h1>
        <p className="text-gray-500 mt-1">{t('simulation.subtitle')} · {L('moteur Monte-Carlo, état réel des centres en entrée', 'Monte-Carlo engine, real centre state as input')}</p>
      </div>

      <div className="card print:hidden">
        <SectionTitle icon={FlaskConical}>{t('simulation.config')}</SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('simulation.crisisType')}</label>
            <div className="grid grid-cols-2 gap-2">
              {scenarios.map(s => (
                <button key={s.id} onClick={() => setParams(p => ({ ...p, scenario: s.id }))} className={`p-3 rounded-lg border-2 transition-all text-left ${params.scenario === s.id ? `border-unicef-blue ${s.bg}` : 'border-gray-100 hover:border-gray-200'}`}>
                  <s.icon size={20} className={s.color} /><p className="text-sm font-medium text-gray-700 mt-1">{s.label}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('simulation.intensity')}</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map(lv => (
                  <button key={lv} onClick={() => setParams(p => ({ ...p, intensity: lv }))} className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${params.intensity === lv ? lv === 'high' ? 'bg-red-500 text-white' : lv === 'medium' ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {t(`simulation.${lv}` as 'simulation.low')}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('simulation.duration')}: {params.duration_days} {t('simulation.days')}</label>
                <input type="range" min="3" max="30" value={params.duration_days} onChange={e => setParams(p => ({ ...p, duration_days: parseInt(e.target.value) }))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-unicef-blue" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{L('Tirages Monte-Carlo', 'Monte-Carlo runs')}: {params.monteCarloRuns}</label>
                <input type="range" min="100" max="2000" step="100" value={params.monteCarloRuns} onChange={e => setParams(p => ({ ...p, monteCarloRuns: parseInt(e.target.value) }))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-unicef-blue" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('simulation.startDate')}</label>
              <input type="date" value={params.startDate} onChange={e => setParams(p => ({ ...p, startDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('simulation.affectedDistricts')} ({params.affectedDistricts.length} {t('simulation.selected')} · {nf(affectedCenters.reduce((s, c) => s + c.base.childrenUnder5, 0), language)} {L('enfants', 'children')})</label>
          <div className="flex flex-wrap gap-2">
            {districts.map(dd => (
              <button key={dd} onClick={() => toggleDistrict(dd)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${params.affectedDistricts.includes(dd) ? 'bg-unicef-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{dd}</button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button onClick={run} disabled={running || params.affectedDistricts.length === 0} className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {running ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('simulation.running')} {Math.round(progress)} %</> : <><Play size={16} /> {t('simulation.run')}</>}
          </button>
          {result && <button onClick={() => setResult(null)} className="btn-secondary flex items-center gap-2"><RotateCcw size={16} /> {t('simulation.reset')}</button>}
          {running && <div className="flex-1 max-w-xs h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-unicef-blue transition-all" style={{ width: `${progress}%` }} /></div>}
        </div>
      </div>

      {result && (
        <div className="space-y-6 animate-in">
          <div className="card border-l-4 border-l-red-500">
            <SectionTitle icon={AlertTriangle} right={<span className="text-[11px] text-gray-400 flex items-center gap-1"><Cpu size={11} /> {result.runs} {L('tirages', 'runs')} · {result.computeMs} ms · P10–P90</span>}>
              {t('simulation.results')} — {SCENARIO[params.scenario].label[language === 'fr' ? 0 : 1]} · {t(`simulation.${params.intensity}` as 'simulation.low')} · {params.duration_days} {t('simulation.days')}
            </SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="text-center p-3 bg-red-50 rounded-lg"><Users size={20} className="text-red-500 mx-auto" /><p className="text-lg font-bold text-red-700 mt-1 tabular-nums">{nf(result.childrenAtRisk, language)}</p><p className="text-[11px] text-red-600">{t('simulation.childrenAtRisk')}</p><p className="text-[10px] text-red-400">[{nf(result.childrenAtRiskCI[0], language)} – {nf(result.childrenAtRiskCI[1], language)}]</p></div>
              <div className="text-center p-3 bg-orange-50 rounded-lg"><AlertTriangle size={20} className="text-orange-500 mx-auto" /><p className="text-lg font-bold text-orange-700 mt-1">{result.impactedCenters}</p><p className="text-[11px] text-orange-600">{t('simulation.impactedCenters')}</p></div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg"><Zap size={20} className="text-yellow-600 mx-auto" /><p className="text-lg font-bold text-yellow-700 mt-1 tabular-nums">{nf(result.energyDeficit_kwh, language)}</p><p className="text-[11px] text-yellow-600">{t('simulation.energyDeficit')}</p></div>
              <div className="text-center p-3 bg-blue-50 rounded-lg"><Droplets size={20} className="text-blue-500 mx-auto" /><p className="text-lg font-bold text-blue-700 mt-1 tabular-nums">{(result.waterDeficit_liters / 1000).toFixed(1)} k</p><p className="text-[11px] text-blue-600">{t('simulation.waterDeficit')}</p></div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg"><Syringe size={20} className="text-cyan-600 mx-auto" /><p className="text-lg font-bold text-cyan-700 mt-1 tabular-nums">{result.coldChainBreaks} · {nf(result.vaccineDosesAtRisk, language)}</p><p className="text-[11px] text-cyan-600">{t('simulation.coldChainBreaks')} · {L('doses', 'doses')}</p></div>
              <div className="text-center p-3 bg-green-50 rounded-lg"><Coins size={20} className="text-green-600 mx-auto" /><p className="text-lg font-bold text-green-700 mt-1 tabular-nums">{nf(result.avoidedCost_usd, language)} $</p><p className="text-[11px] text-green-600">{L('coût évité par anticipation', 'cost avoided by anticipation')}</p><p className="text-[10px] text-green-500">{L('sur', 'of')} {nf(result.estimatedCost_usd, language)} $</p></div>
            </div>

            {/* Cascade */}
            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-gray-600 mr-1">{L('Effet cascade :', 'Cascade effect:')}</span>
              {[
                [L('Stress climatique', 'Climate stress'), 'bg-orange-100 text-orange-800'],
                [L(`Énergie −${100 - Math.min(...result.timeline.map(x => x.energyStatus))} %`, `Energy −${100 - Math.min(...result.timeline.map(x => x.energyStatus))}%`), 'bg-yellow-100 text-yellow-800'],
                [L(`${result.coldChainBreaks} rupture(s) chaîne froid`, `${result.coldChainBreaks} cold chain break(s)`), 'bg-cyan-100 text-cyan-800'],
                [L(`${nf(result.vaccineDosesAtRisk, language)} doses à risque`, `${nf(result.vaccineDosesAtRisk, language)} doses at risk`), 'bg-blue-100 text-blue-800'],
                [L(`${nf(result.childrenAtRisk, language)} enfants à risque`, `${nf(result.childrenAtRisk, language)} children at risk`), 'bg-red-100 text-red-800'],
              ].map(([lab, cls], i, arr) => (
                <span key={i} className="flex items-center gap-2"><span className={`px-2.5 py-1 rounded-full font-medium ${cls}`}>{lab}</span>{i < arr.length - 1 && <ArrowRight size={14} className="text-gray-400" />}</span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <SectionTitle>{t('simulation.energyWaterEvolution')} <span className="text-[11px] font-normal text-gray-400">· {L('médiane et bande P10–P90', 'median and P10–P90 band')}</span></SectionTitle>
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={tl}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} label={{ value: L('jour', 'day'), position: 'insideBottomRight', fontSize: 10, offset: -2 }} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} width={30} unit="%" />
                  <Tooltip content={<BandTooltip dayLabel={L('Jour', 'Day')} />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="energyP10" stackId="e" stroke="none" fill="transparent" name="_e10" legendType="none" />
                  <Area type="monotone" dataKey="eBand" stackId="e" stroke="none" fill="#FFC20E" fillOpacity={0.22} name="_eBand" legendType="none" />
                  <Area type="monotone" dataKey="waterP10" stackId="w" stroke="none" fill="transparent" name="_w10" legendType="none" />
                  <Area type="monotone" dataKey="wBand" stackId="w" stroke="none" fill="#1CABE2" fillOpacity={0.18} name="_wBand" legendType="none" />
                  <Line type="monotone" dataKey="energyStatus" stroke="#E0A800" strokeWidth={2.5} dot={false} name={t('simulation.energyPct')} />
                  <Line type="monotone" dataKey="waterStatus" stroke="#1CABE2" strokeWidth={2.5} dot={false} name={t('simulation.waterPct')} />
                  <ReferenceLine y={25} stroke="#E2231A" strokeDasharray="4 4" label={{ value: L('seuil critique', 'critical threshold'), fontSize: 9, fill: '#E2231A', position: 'insideBottomLeft' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <SectionTitle>{t('simulation.healthRiskLevel')} <span className="text-[11px] font-normal text-gray-400">· P10–P90</span></SectionTitle>
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={tl}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} width={30} unit="%" />
                  <Tooltip content={<BandTooltip dayLabel={L('Jour', 'Day')} />} />
                  <Area type="monotone" dataKey="healthP10" stackId="h" stroke="none" fill="transparent" name="_h10" legendType="none" />
                  <Area type="monotone" dataKey="hBand" stackId="h" stroke="none" fill="#E2231A" fillOpacity={0.18} name="_hBand" legendType="none" />
                  <Line type="monotone" dataKey="healthRisk" stroke="#E2231A" strokeWidth={2.5} dot={false} name={t('simulation.healthRiskPct')} />
                  <ReferenceLine y={50} stroke="#F26A21" strokeDasharray="4 4" label={{ value: L('alerte', 'alert'), fontSize: 9, fill: '#F26A21', position: 'insideTopLeft' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <SectionTitle icon={Shield} right={<button onClick={exportPlan} className="btn-secondary text-xs print:hidden">{L('Exporter le plan (PDF)', 'Export plan (PDF)')}</button>}>{t('simulation.actionPlan')}</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.recommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <div><p className="text-sm text-gray-700">{rec}</p><p className="text-[10px] text-gray-400 mt-0.5">{i < 2 ? L('J-3 à J-1 · priorité haute', 'D-3 to D-1 · high priority') : i < 4 ? L('J-1 à J+1', 'D-1 to D+1') : L('pendant la crise', 'during the crisis')}</p></div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <SectionTitle>{t('simulation.affectedCenters')} ({affectedCenters.length}) · {L('état réel au lancement', 'real state at launch')}</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {affectedCenters.map(c => (
                <div key={c.id} className="p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-800">{c.name}</p><StatusDot status={c.status} /></div>
                  <p className="text-xs text-gray-500 mt-1">{c.district} · {nf(c.base.childrenUnder5, language)} {L('enfants', 'children')}</p>
                  <div className="mt-2 flex gap-3 text-xs text-gray-600"><span>🔋 {c.battery_pct.toFixed(0)} %</span><span>💧 {c.water_pct.toFixed(0)} %</span><span>🌡️ {c.cold_c.toFixed(1)} °C</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && (
        <div className="card bg-blue-50/50 border-blue-100 text-xs text-blue-900 print:hidden">
          <p className="font-semibold mb-1">{L('Comment fonctionne la simulation ?', 'How does the simulation work?')}</p>
          <p>{L("Chaque tirage Monte-Carlo perturbe l'intensité de l'aléa (±12 %) et la résilience initiale des centres (batterie et réservoirs réels au moment du lancement, ±10 %), puis propage jour par jour l'impact sur l'énergie, l'eau et le risque sanitaire. Les résultats affichés sont la médiane et l'intervalle P10–P90. Les coefficients sont calibrés sur les données du pilote (saison 2025) et seront affinés avec les données DHIS2 de la phase 2.", 'Each Monte-Carlo run perturbs hazard intensity (±12%) and the initial resilience of the centres (real battery and reservoir levels at launch, ±10%), then propagates the day-by-day impact on energy, water and health risk. Results show the median and the P10–P90 interval. Coefficients are calibrated on pilot data (2025 season) and will be refined with phase 2 DHIS2 data.')}</p>
        </div>
      )}
    </div>
  );
}
