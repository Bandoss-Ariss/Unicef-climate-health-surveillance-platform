import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, Activity, CloudSun, BatteryWarning, Database, Info, CheckCircle2, RefreshCw, Satellite, Layers, TrendingUp } from 'lucide-react';
import { ComposedChart, Line, Area, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, Cell } from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';
import { useL, nf } from '../i18n/useL';
import { useLive, liveEngine } from '../context/LiveDataContext';
import { useToast } from '../context/ToastContext';
import { SectionTitle, Pill } from '../components/ui';

const DISTRICTS = ['Djibo', 'Dori', 'Gorom-Gorom', 'Sebba', 'Boromo', 'Dédougou', 'Nouna', 'Koudougou', 'Réo', 'Sapouy'];
type Disease = 'malaria' | 'malnutrition' | 'dehydration' | 'respiratory';

/** Paramètres de base par district × pathologie (cas hebdo actuels, croissance hebdo, seuil). */
const BASE: Record<string, Record<Disease, [number, number, number]>> = {
  'Djibo':       { malaria: [210, 0.06, 260], malnutrition: [520, 0.09, 350], dehydration: [41, 0.22, 50], respiratory: [98, 0.02, 160] },
  'Dori':        { malaria: [185, 0.05, 240], malnutrition: [310, 0.06, 300], dehydration: [28, 0.15, 45], respiratory: [110, 0.01, 170] },
  'Gorom-Gorom': { malaria: [96, 0.04, 140], malnutrition: [240, 0.07, 200], dehydration: [89, 0.28, 50], respiratory: [64, 0.03, 110] },
  'Sebba':       { malaria: [74, 0.03, 120], malnutrition: [150, 0.05, 160], dehydration: [22, 0.12, 40], respiratory: [48, 0.0, 90] },
  'Boromo':      { malaria: [342, 0.27, 190], malnutrition: [88, 0.02, 150], dehydration: [14, 0.05, 40], respiratory: [72, 0.01, 130] },
  'Dédougou':    { malaria: [158, 0.11, 200], malnutrition: [70, 0.01, 140], dehydration: [11, 0.04, 40], respiratory: [80, 0.02, 140] },
  'Nouna':       { malaria: [131, 0.09, 170], malnutrition: [92, 0.03, 130], dehydration: [17, 0.06, 35], respiratory: [55, 0.0, 100] },
  'Koudougou':   { malaria: [122, 0.05, 210], malnutrition: [45, 0.0, 120], dehydration: [9, 0.02, 40], respiratory: [156, 0.01, 200] },
  'Réo':         { malaria: [140, 0.07, 220], malnutrition: [52, 0.01, 130], dehydration: [8, 0.03, 40], respiratory: [102, 0.02, 180] },
  'Sapouy':      { malaria: [66, 0.02, 120], malnutrition: [118, 0.08, 110], dehydration: [19, 0.1, 35], respiratory: [41, 0.0, 90] },
};

/** Risque climatique (0-100) par district × aléa, horizon 7 jours. */
const CLIMATE_RISK: Record<string, [number, number, number, number]> = {
  'Djibo': [94, 8, 46, 62], 'Dori': [88, 12, 42, 58], 'Gorom-Gorom': [86, 6, 55, 78], 'Sebba': [79, 14, 38, 44],
  'Boromo': [38, 81, 12, 8], 'Dédougou': [41, 64, 15, 10], 'Nouna': [44, 52, 22, 12],
  'Koudougou': [35, 28, 48, 6], 'Réo': [33, 31, 45, 6], 'Sapouy': [30, 22, 71, 5],
};

const seeded = (seed: number) => { let a = seed; return () => { a = (a * 9301 + 49297) % 233280; return a / 233280; }; };

export default function Predictions() {
  const { t, language } = useLanguage();
  const L = useL();
  const live = useLive();
  const { toast } = useToast();
  const [district, setDistrict] = useState('Boromo');
  const [disease, setDisease] = useState<Disease>('malaria');
  const [refreshing, setRefreshing] = useState(false);

  const models = [
    { name: L('Prédicteur épidémique', 'Epidemic predictor'), arch: 'Bi-LSTM + Attention', metric: 'F1 = 0,83', horizon: '14 j', trained: L('il y a 6 j', '6 d ago'), sources: 'DHIS2 · ANAM · CHIRPS', icon: Activity, tone: 'purple' },
    { name: L('Prévision énergie', 'Energy forecaster'), arch: 'XGBoost + LSTM', metric: 'R² = 0,92', horizon: '72 h', trained: L('il y a 1 j', '1 d ago'), sources: L('Capteurs IoT · NASA POWER', 'IoT sensors · NASA POWER'), icon: BatteryWarning, tone: 'yellow' },
    { name: L('Risque climatique', 'Climate risk'), arch: 'Random Forest + Bayes', metric: 'AUC = 0,91', horizon: '7 j', trained: L('il y a 3 j', '3 d ago'), sources: 'ECMWF · ERA5 · MODIS NDVI', icon: CloudSun, tone: 'orange' },
    { name: L('Traduction santé', 'Health translation'), arch: 'mBART fine-tuned', metric: 'BLEU = 34,7', horizon: '—', trained: L('il y a 21 j', '21 d ago'), sources: L('Corpus MSPS · relecture communautaire', 'MoH corpus · community review'), icon: Layers, tone: 'blue' },
  ] as const;

  const diseaseLabel: Record<Disease, string> = { malaria: t('health.malaria'), malnutrition: t('health.malnutrition'), dehydration: t('health.dehydration'), respiratory: t('health.respiratory') };

  // Série : 8 semaines observées + 2 semaines prédites (pas journalier agrégé en semaines pour lisibilité)
  const forecast = useMemo(() => {
    const [current, growth, threshold] = BASE[district][disease];
    const rnd = seeded(district.length * 31 + disease.length * 7);
    const pts: Array<{ w: string; observed?: number; predicted?: number; p10?: number; p90?: number; threshold: number }> = [];
    for (let i = -7; i <= 0; i++) {
      const v = Math.round(current / Math.pow(1 + growth, -i) * (0.94 + rnd() * 0.12));
      pts.push({ w: `${language === 'fr' ? 'S' : 'W'}${i === 0 ? '0' : i}`, observed: i === 0 ? current : v, threshold });
    }
    for (let i = 1; i <= 2; i++) {
      const v = current * Math.pow(1 + growth, i);
      const spread = 0.08 * i + 0.04;
      pts.push({ w: `${language === 'fr' ? 'S' : 'W'}+${i}`, predicted: Math.round(v), p10: Math.round(v * (1 - spread)), p90: Math.round(v * (1 + spread * 1.3)), threshold });
    }
    // jonction visuelle
    pts[7].predicted = current; pts[7].p10 = current; pts[7].p90 = current;
    const pExceed = Math.min(0.98, Math.max(0.02, 0.5 + (current * Math.pow(1 + growth, 2) - threshold) / threshold * 1.6));
    return { pts: pts.map(p => ({ ...p, band: p.p90 !== undefined && p.p10 !== undefined ? p.p90 - p.p10 : undefined })), pExceed, threshold, growth, current };
  }, [district, disease, language]);

  const hazards = [L('Canicule', 'Heat wave'), L('Inondation', 'Flood'), L('Sécheresse', 'Drought'), L('Poussière', 'Dust')];
  const riskColor = (v: number) => v >= 75 ? 'bg-red-500 text-white' : v >= 50 ? 'bg-orange-400 text-white' : v >= 30 ? 'bg-yellow-300 text-gray-800' : 'bg-green-100 text-green-800';

  // Prédiction énergie : probabilité batterie < 20 % sous 72 h
  const energyRisk = live.centers.map(c => {
    const health = c.base.solarSystem.status === 'failure' ? 1 : c.base.solarSystem.status === 'degraded' ? 0.55 : 0.08;
    const socFactor = Math.max(0, (60 - c.battery_pct) / 60);
    const days = Math.round((Date.now() - new Date(c.base.solarSystem.lastMaintenance).getTime()) / 86_400_000);
    const p = Math.min(0.99, Math.max(0.01, health * 0.7 + socFactor * 0.35 + (days > 90 ? 0.08 : 0)));
    return { c, p, days, action: p > 0.6 ? L('Intervention < 48 h', 'Intervene < 48 h') : p > 0.3 ? L('Planifier maintenance', 'Schedule maintenance') : L('RAS', 'OK') };
  }).sort((a, b) => b.p - a.p);

  const features = [
    [L('Température max J-7', 'Max temp D-7'), 0.24], [L('Cas S-1 / S-2', 'Cases W-1 / W-2'), 0.21], [L('Cumul pluie 14 j', '14-d rainfall'), 0.16],
    [L('Humidité relative', 'Relative humidity'), 0.11], [L('NDVI (couvert végétal)', 'NDVI (vegetation)'), 0.09], [L('Densité PDI', 'IDP density'), 0.08],
    [L('Couverture MILDA', 'LLIN coverage'), 0.06], [L('Autres', 'Other'), 0.05],
  ] as const;

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      liveEngine.pushEvent('prediction', 'info', `Modèles réexécutés à la demande — ${district} · ${diseaseLabel[disease]}`, `Models re-run on demand — ${district} · ${diseaseLabel[disease]}`, { district, actor: 'Coordination UNICEF' });
      toast('success', L('Prédictions recalculées', 'Predictions recomputed'), L('4 modèles · 1,8 s · données DHIS2 S36 + ANAM 72 h', '4 models · 1.8 s · DHIS2 W36 + ANAM 72 h data'));
    }, 1800);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{L('Prédictions IA', 'AI Predictions')}</h1>
          <p className="text-gray-500 mt-1">{L('Anticipation des épidémies, des risques climatiques et des défaillances énergétiques — 7 à 14 jours', 'Anticipating epidemics, climate risks and energy failures — 7 to 14 days ahead')}</p>
        </div>
        <button onClick={refresh} disabled={refreshing} className="btn-secondary text-xs flex items-center gap-1.5 print:hidden">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> {refreshing ? L('Calcul en cours…', 'Computing…') : L('Réexécuter les modèles', 'Re-run models')}
        </button>
      </div>

      {/* Model cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {models.map(m => (
          <div key={m.name} className="card">
            <div className="flex items-start justify-between">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center bg-${m.tone}-50 text-${m.tone}-600`}><m.icon size={18} /></div>
              <Pill tone="green"><CheckCircle2 size={10} className="mr-1" /> {L('en production', 'in production')}</Pill>
            </div>
            <p className="text-sm font-semibold text-gray-800 mt-3">{m.name}</p>
            <p className="text-xs text-gray-500">{m.arch}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="font-mono font-semibold text-gray-800">{m.metric}</span>
              <span className="text-gray-500">{L('horizon', 'horizon')} {m.horizon}</span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-50 text-[11px] text-gray-400">
              <p>{L('Entraîné', 'Trained')} {m.trained} · {m.sources}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Epidemic forecast */}
      <div className="card">
        <SectionTitle icon={Activity} right={
          <div className="flex gap-2 print:hidden">
            <select value={district} onChange={e => setDistrict(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">{DISTRICTS.map(x => <option key={x}>{x}</option>)}</select>
            <select value={disease} onChange={e => setDisease(e.target.value as Disease)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">{(Object.keys(diseaseLabel) as Disease[]).map(k => <option key={k} value={k}>{diseaseLabel[k]}</option>)}</select>
          </div>
        }>
          {L('Prévision épidémiologique à 14 jours', '14-day epidemiological forecast')} — {district} · {diseaseLabel[disease]}
        </SectionTitle>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={forecast.pts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="w" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area dataKey="p10" stackId="b" stroke="none" fill="transparent" isAnimationActive={false} name="P10" legendType="none" />
                <Area dataKey="band" stackId="b" stroke="none" fill="#6A1E74" fillOpacity={0.15} isAnimationActive={false} name={L('Intervalle P10–P90', 'P10–P90 interval')} />
                <Line dataKey="observed" stroke="#374EA2" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} name={L('Cas observés (DHIS2)', 'Observed cases (DHIS2)')} />
                <Line dataKey="predicted" stroke="#6A1E74" strokeWidth={2.5} strokeDasharray="6 4" dot={{ r: 3 }} isAnimationActive={false} name={L('Prédiction IA', 'AI prediction')} />
                <ReferenceLine y={forecast.threshold} stroke="#E2231A" strokeDasharray="4 4" label={{ value: L('seuil épidémique', 'epidemic threshold'), fontSize: 10, fill: '#E2231A', position: 'insideTopLeft' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            <div className={`rounded-xl p-4 ${forecast.pExceed > 0.6 ? 'bg-red-50 border border-red-100' : forecast.pExceed > 0.35 ? 'bg-orange-50 border border-orange-100' : 'bg-green-50 border border-green-100'}`}>
              <p className="text-[11px] uppercase font-semibold text-gray-500">{L('Probabilité de dépasser le seuil à J+14', 'Probability of exceeding threshold at D+14')}</p>
              <p className={`text-3xl font-bold mt-1 tabular-nums ${forecast.pExceed > 0.6 ? 'text-red-700' : forecast.pExceed > 0.35 ? 'text-orange-700' : 'text-green-700'}`}>{Math.round(forecast.pExceed * 100)} %</p>
              <p className="text-xs text-gray-600 mt-1">{L('Croissance hebdo', 'Weekly growth')} {forecast.growth >= 0 ? '+' : ''}{Math.round(forecast.growth * 100)} % · {L('actuel', 'current')} {forecast.current} {L('cas/sem.', 'cases/wk')}</p>
            </div>
            <div className="text-xs text-gray-600 space-y-1.5">
              <p className="font-semibold text-gray-700 flex items-center gap-1"><TrendingUp size={12} /> {L('Facteurs explicatifs (SHAP)', 'Explanatory factors (SHAP)')}</p>
              {features.slice(0, 4).map(([f, v]) => (
                <div key={f}><div className="flex justify-between"><span>{f}</span><span className="tabular-nums text-gray-500">{Math.round(v * 100)} %</span></div><div className="h-1 bg-gray-100 rounded-full"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${v * 100 * 3}%` }} /></div></div>
              ))}
            </div>
            {forecast.pExceed > 0.5 && (
              <Link to="/prevention" className="btn-primary text-xs block text-center print:hidden">{L('Programmer la prévention →', 'Schedule prevention →')}</Link>
            )}
          </div>
        </div>
      </div>

      {/* Climate risk matrix + energy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <SectionTitle icon={CloudSun}>{L('Matrice de risque climatique — 7 prochains jours', 'Climate risk matrix — next 7 days')}</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr><th className="text-left py-1.5 pr-2 font-medium text-gray-500">{L('District', 'District')}</th>{hazards.map(h => <th key={h} className="py-1.5 px-1 font-medium text-gray-500 text-center">{h}</th>)}<th className="py-1.5 pl-2 font-medium text-gray-500 text-right">{L('Global', 'Overall')}</th></tr></thead>
              <tbody>
                {DISTRICTS.map(dd => {
                  const r = CLIMATE_RISK[dd]; const max = Math.max(...r);
                  return (
                    <tr key={dd} className="border-t border-gray-50">
                      <td className="py-1.5 pr-2 font-medium text-gray-700">{dd}</td>
                      {r.map((v, i) => <td key={i} className="py-1 px-1 text-center"><span className={`inline-block w-11 py-1 rounded font-semibold tabular-nums ${riskColor(v)}`}>{v}</span></td>)}
                      <td className="py-1.5 pl-2 text-right"><Pill tone={max >= 75 ? 'red' : max >= 50 ? 'orange' : 'green'}>{max >= 75 ? L('Élevé', 'High') : max >= 50 ? L('Modéré', 'Moderate') : L('Faible', 'Low')}</Pill></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1"><Satellite size={11} /> {L('Fusion ECMWF-IFS (J+7), ERA5, CHIRPS, MODIS NDVI, CAMS aérosols · mise à jour 2×/jour', 'Fusion of ECMWF-IFS (D+7), ERA5, CHIRPS, MODIS NDVI, CAMS aerosols · updated twice daily')}</p>
        </div>

        <div className="card">
          <SectionTitle icon={BatteryWarning}>{L('Défaillance énergétique — probabilité batterie < 20 % sous 72 h', 'Energy failure — probability of battery < 20% within 72 h')}</SectionTitle>
          <div className="space-y-2">
            {energyRisk.map(({ c, p, days, action }) => (
              <Link key={c.id} to={`/centres/${c.id}`} className="flex items-center gap-3 text-xs group">
                <span className="w-28 truncate text-gray-700 group-hover:text-unicef-blue">{c.shortName}</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${p > 0.6 ? 'bg-red-500' : p > 0.3 ? 'bg-orange-400' : 'bg-green-500'}`} style={{ width: `${p * 100}%` }} /></div>
                <span className="w-10 text-right font-semibold tabular-nums">{Math.round(p * 100)} %</span>
                <span className={`w-36 text-right ${p > 0.6 ? 'text-red-600 font-medium' : p > 0.3 ? 'text-orange-600' : 'text-gray-400'}`}>{action}</span>
                <span className="w-14 text-right text-gray-400">{days} j</span>
              </Link>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-3">{L("Entrées : SOC actuel, état PV/onduleur, prévision d'ensoleillement 72 h (NASA POWER), jours depuis maintenance. Dernière colonne : jours depuis la dernière maintenance.", 'Inputs: current SOC, PV/inverter state, 72 h irradiance forecast (NASA POWER), days since maintenance. Last column: days since last maintenance.')}</p>
        </div>
      </div>

      {/* Feature importance + data sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <SectionTitle icon={Brain}>{L('Explicabilité du modèle épidémique (importance des variables)', 'Epidemic model explainability (feature importance)')}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={features.map(([n, v]) => ({ n, v: Math.round(v * 100) }))} layout="vertical" margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} unit=" %" />
              <YAxis type="category" dataKey="n" tick={{ fontSize: 10 }} width={130} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="v" radius={[0, 4, 4, 0]} name={L('Contribution', 'Contribution')}>{features.map((_, i) => <Cell key={i} fill={i < 3 ? '#6A1E74' : '#C4B5FD'} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <SectionTitle icon={Database}>{L('Sources de données & gouvernance', 'Data sources & governance')}</SectionTitle>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['DHIS2 / SIMR', L('Surveillance hebdo (MSPS)', 'Weekly surveillance (MoH)'), 'green'],
              ['ANAM', L('Prévisions météo 72 h', '72 h weather forecasts'), 'green'],
              ['ECMWF-IFS · ERA5', L('Modèle global & réanalyse', 'Global model & reanalysis'), 'green'],
              ['CHIRPS · GPM', L('Précipitations satellite', 'Satellite rainfall'), 'green'],
              ['MODIS NDVI', L('Végétation / sécheresse', 'Vegetation / drought'), 'green'],
              ['NASA POWER', L('Irradiance solaire', 'Solar irradiance'), 'green'],
              [L('Capteurs IoT', 'IoT sensors'), L('10 centres · 6 capteurs', '10 centres · 6 sensors'), 'green'],
              ['OCHA / IOM DTM', L('Déplacements de population', 'Population displacement'), 'yellow'],
            ].map(([n, desc, tone]) => (
              <div key={n as string} className="p-2 bg-gray-50 rounded-lg flex items-start gap-2">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${tone === 'green' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <div><p className="font-medium text-gray-800">{n}</p><p className="text-gray-500">{desc}</p></div>
              </div>
            ))}
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-lg text-[11px] text-blue-900 flex items-start gap-2">
            <Info size={13} className="mt-0.5 flex-shrink-0" />
            <p>{L("Aucune donnée nominale de patient n'est traitée : les modèles utilisent des agrégats hebdomadaires par district. Conformité aux principes UNICEF de protection des données et à la loi 001-2021/AN (Burkina Faso). Modèles réentraînés chaque semaine, dérive surveillée (PSI < 0,1).", 'No patient-level data is processed: models use weekly district aggregates. Compliant with UNICEF data protection principles and Law 001-2021/AN (Burkina Faso). Models retrained weekly, drift monitored (PSI < 0.1).')}</p>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">{L('Enfants couverts par la surveillance prédictive :', 'Children covered by predictive surveillance:')} <b>{nf(live.centers.reduce((s, c) => s + c.base.childrenUnder5, 0), language)}</b></p>
          <span className="hidden bg-purple-50 text-purple-600 bg-yellow-50 text-yellow-600 bg-orange-50 text-orange-600 bg-blue-50 text-blue-600" />
        </div>
      </div>
    </div>
  );
}
