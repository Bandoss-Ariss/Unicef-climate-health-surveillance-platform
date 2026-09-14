import { useState } from 'react';
import { HeartPulse, TrendingUp, TrendingDown, Minus, Plus, X, CheckCircle, Database, Send } from 'lucide-react';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { HealthAlert } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { useL, nf } from '../i18n/useL';
import { useLive, liveEngine } from '../context/LiveDataContext';
import { useToast } from '../context/ToastContext';
import { healthRecommendations } from '../i18n/dataTranslations';
import { SeverityBadge, Pill } from '../components/ui';
import { d, formatDate } from '../data/dates';

const regions = ['Sahel', 'Boucle du Mouhoun', 'Centre-Ouest'];
const districtsByRegion: Record<string, string[]> = {
  'Sahel': ['Djibo', 'Dori', 'Gorom-Gorom', 'Sebba'],
  'Boucle du Mouhoun': ['Dédougou', 'Boromo', 'Nouna'],
  'Centre-Ouest': ['Koudougou', 'Réo', 'Sapouy'],
};
const typeColors: Record<string, string> = {
  malaria: 'bg-purple-100 text-purple-700', cholera: 'bg-blue-100 text-blue-700', meningitis: 'bg-red-100 text-red-700',
  malnutrition: 'bg-orange-100 text-orange-700', dehydration: 'bg-cyan-100 text-cyan-700', respiratory: 'bg-green-100 text-green-700',
};

function weekLabel(i: number, lang: string) {
  const w = getISOWeek(new Date(Date.now() - (7 - i) * 7 * 86_400_000));
  return `${lang === 'fr' ? 'S' : 'W'}${w}`;
}
function getISOWeek(date: Date) {
  const t = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

export default function HealthAlertsPage() {
  const { t, language } = useLanguage();
  const L = useL();
  const live = useLive();
  const { toast } = useToast();
  const alerts = live.healthAlerts;
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'malaria' as HealthAlert['type'], severity: 'medium' as HealthAlert['severity'], region: 'Sahel', district: 'Djibo',
    cases: 0, childrenCases: 0, trend: 'stable' as HealthAlert['trend'], startDate: d(0), recommendations: [''],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const base = Math.max(5, Math.round(form.cases * 0.4));
    liveEngine.addHealthAlert({
      id: `ha-${Date.now()}`, type: form.type, severity: form.severity, region: form.region, district: form.district, cases: form.cases, childrenCases: form.childrenCases,
      trend: form.trend, startDate: form.startDate, recommendations: form.recommendations.filter(r => r.trim() !== ''),
      weeklyCases: [base, base, Math.round(base * 1.1), Math.round(base * 1.2), Math.round(base * 1.4), Math.round(base * 1.7), Math.round(form.cases * 0.85), form.cases],
      epidemicThreshold: Math.round(form.cases * 0.7), source: L('Saisie manuelle · ICP', 'Manual entry · head nurse'), acknowledged: true,
    });
    setShowForm(false);
    toast('success', t('health.caseCreated'), L('Transmis au DHIS2 et à la direction régionale de la santé.', 'Sent to DHIS2 and the regional health directorate.'));
    setForm({ type: 'malaria', severity: 'medium', region: 'Sahel', district: 'Djibo', cases: 0, childrenCases: 0, trend: 'stable', startDate: d(0), recommendations: [''] });
  };

  const totalCases = alerts.reduce((s, a) => s + a.cases, 0);
  const totalChildren = alerts.reduce((s, a) => s + a.childrenCases, 0);
  const aboveThreshold = alerts.filter(a => a.cases > a.epidemicThreshold).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('health.title')}</h1>
          <p className="text-gray-500 mt-1">{t('health.subtitle')} · {L('données DHIS2 / SIMR + dépistage communautaire', 'DHIS2 / IDSR data + community screening')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={16} /> : <HeartPulse size={16} />} {t('health.declareCase')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card border-2 border-unicef-blue/20 animate-in">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Plus size={16} className="text-unicef-blue" /> {t('health.createCase')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('health.pathologyType')}</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as HealthAlert['type'] }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {(['malaria', 'cholera', 'meningitis', 'malnutrition', 'dehydration', 'respiratory'] as const).map(k => <option key={k} value={k}>{t(`health.${k}` as 'health.malaria')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.severity')}</label>
              <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value as HealthAlert['severity'] }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {(['low', 'medium', 'high', 'critical'] as const).map(s => <option key={s} value={s}>{t(`severity.${s}` as 'severity.low')}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.region')}</label>
              <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value, district: districtsByRegion[e.target.value]?.[0] || '' }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.district')}</label>
              <select value={form.district} onChange={e => setForm(p => ({ ...p, district: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {(districtsByRegion[form.region] || []).map(x => <option key={x} value={x}>{x}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('health.casesCount')}</label>
              <input type="number" min="1" value={form.cases || ''} onChange={e => setForm(p => ({ ...p, cases: parseInt(e.target.value) || 0 }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('health.childrenCount')}</label>
              <input type="number" min="0" value={form.childrenCases || ''} onChange={e => setForm(p => ({ ...p, childrenCases: parseInt(e.target.value) || 0 }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('health.trend')}</label>
              <select value={form.trend} onChange={e => setForm(p => ({ ...p, trend: e.target.value as HealthAlert['trend'] }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="increasing">{t('health.increasing')}</option><option value="stable">{t('health.stable')}</option><option value="decreasing">{t('health.decreasing')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.startDate')}</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('health.recommendedActions')}</label>
              <div className="space-y-2">
                {form.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={rec} onChange={e => setForm(p => ({ ...p, recommendations: p.recommendations.map((r, j) => j === i ? e.target.value : r) }))} placeholder={`${L('Action recommandée', 'Recommended action')} ${i + 1}`} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    {form.recommendations.length > 1 && <button type="button" onClick={() => setForm(p => ({ ...p, recommendations: p.recommendations.filter((_, j) => j !== i) }))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X size={16} /></button>}
                  </div>
                ))}
                <button type="button" onClick={() => setForm(p => ({ ...p, recommendations: [...p.recommendations, ''] }))} className="text-xs text-unicef-blue hover:underline flex items-center gap-1"><Plus size={12} /> {L('Ajouter une action', 'Add an action')}</button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2"><CheckCircle size={16} /> {t('climate.submit')}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('climate.cancel')}</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-xs text-gray-500">{t('health.totalCases')}</p><p className="text-2xl font-bold text-gray-900">{nf(totalCases, language)}</p><p className="text-xs text-red-500 mt-1">↑ {t('health.risingThisWeek')}</p></div>
        <div className="card"><p className="text-xs text-gray-500">{t('health.childrenCases')}</p><p className="text-2xl font-bold text-unicef-blue">{nf(totalChildren, language)}</p><p className="text-xs text-gray-400 mt-1">{((totalChildren / totalCases) * 100).toFixed(0)} % {t('health.ofTotal')}</p></div>
        <div className="card"><p className="text-xs text-gray-500">{L('Seuils épidémiques dépassés', 'Epidemic thresholds exceeded')}</p><p className="text-2xl font-bold text-red-600">{aboveThreshold}</p><p className="text-xs text-gray-400 mt-1">{L('sur', 'out of')} {alerts.length} {L('signaux', 'signals')}</p></div>
        <div className="card"><p className="text-xs text-gray-500">{t('health.affectedDistricts')}</p><p className="text-2xl font-bold text-gray-900">{new Set(alerts.map(a => a.district)).size}</p><p className="text-xs text-gray-400 mt-1">{t('health.onPilotDistricts')}</p></div>
      </div>

      <div className="space-y-4">
        {alerts.map(alert => {
          const series = alert.weeklyCases.map((v, i) => ({ w: weekLabel(i, language), cases: v }));
          return (
            <div key={alert.id} className={`card border-l-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'high' ? 'border-l-orange-500' : alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'}`}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${typeColors[alert.type]}`}>{t(`health.${alert.type}` as 'health.malaria')}</span>
                    <SeverityBadge severity={alert.severity} label={t(`severity.${alert.severity}` as 'severity.critical')} />
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      {alert.trend === 'increasing' ? <><TrendingUp size={12} className="text-red-500" /> {t('health.increasing')}</> :
                       alert.trend === 'decreasing' ? <><TrendingDown size={12} className="text-green-500" /> {t('health.decreasing')}</> :
                       <><Minus size={12} className="text-gray-400" /> {t('health.stable')}</>}
                    </span>
                    {alert.cases > alert.epidemicThreshold && <Pill tone="red">{L('> seuil épidémique', '> epidemic threshold')} ({alert.epidemicThreshold})</Pill>}
                    {alert.acknowledged ? <Pill tone="green">✓ {L('Acquittée', 'Acknowledged')}</Pill> : (
                      <button onClick={() => { liveEngine.acknowledgeHealthAlert(alert.id, L('Coordination UNICEF', 'UNICEF Coordination')); toast('success', L('Alerte acquittée', 'Alert acknowledged')); }} className="text-[11px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 hover:bg-orange-200 font-medium print:hidden">{L('Acquitter', 'Acknowledge')}</button>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div><p className="text-xs text-gray-500">{t('health.totalCasesLabel')}</p><p className="text-lg font-bold text-gray-900 tabular-nums">{alert.cases}</p></div>
                    <div><p className="text-xs text-gray-500">{t('health.childrenUnder5')}</p><p className="text-lg font-bold text-unicef-blue tabular-nums">{alert.childrenCases} <span className="text-xs font-normal text-gray-400">({Math.round(alert.childrenCases / alert.cases * 100)} %)</span></p></div>
                    <div><p className="text-xs text-gray-500">{t('common.district')}</p><p className="text-sm font-medium text-gray-700">{alert.district}</p><p className="text-[11px] text-gray-400">{alert.region}</p></div>
                    <div><p className="text-xs text-gray-500">{t('health.since')}</p><p className="text-sm font-medium text-gray-700">{formatDate(alert.startDate, language)}</p><p className="text-[11px] text-gray-400 flex items-center gap-1"><Database size={10} /> {alert.source}</p></div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <h4 className="text-[11px] font-semibold text-gray-500 uppercase mb-2">{t('health.recommendedActions')}</h4>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                      {(healthRecommendations[alert.id]?.[language] || alert.recommendations).map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600"><span className="text-unicef-blue mt-0.5">→</span>{rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-gray-500 uppercase mb-1">{L('Courbe épidémique (8 sem.)', 'Epidemic curve (8 wks)')}</p>
                  <ResponsiveContainer width="100%" height={150}>
                    <ComposedChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                      <XAxis dataKey="w" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <ReferenceLine y={alert.epidemicThreshold} stroke="#E2231A" strokeDasharray="4 4" label={{ value: L('seuil', 'threshold'), fontSize: 9, fill: '#E2231A', position: 'insideTopRight' }} />
                      <Bar dataKey="cases" radius={[3, 3, 0, 0]} name={L('Cas', 'Cases')}>
                        {series.map((s, i) => <Cell key={i} fill={s.cases > alert.epidemicThreshold ? '#E2231A' : '#93C5FD'} />)}
                      </Bar>
                      <Line type="monotone" dataKey="cases" stroke="#374EA2" strokeWidth={1.5} dot={false} name={L('Tendance', 'Trend')} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  <button
                    onClick={() => { liveEngine.pushEvent('sms', 'info', `Alerte ${t(`health.${alert.type}` as 'health.malaria')} transmise aux ${alert.district === 'Djibo' ? 12 : 8} ASBC de ${alert.district}`, `${t(`health.${alert.type}` as 'health.malaria')} alert sent to ${alert.district === 'Djibo' ? 12 : 8} CHWs in ${alert.district}`, { district: alert.district, actor: 'Coordination UNICEF' }); toast('success', L('Alerte transmise aux agents communautaires', 'Alert sent to community health workers')); }}
                    className="btn-secondary text-xs w-full flex items-center justify-center gap-1.5 mt-2 print:hidden"
                  >
                    <Send size={13} /> {L('Notifier les ASBC', 'Notify CHWs')}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
