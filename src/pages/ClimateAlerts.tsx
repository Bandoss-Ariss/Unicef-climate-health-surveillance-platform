import { useState } from 'react';
import { CloudLightning, Thermometer, CloudRain, Wind, Droplets, Users, Calendar, Plus, X, CheckCircle, Send, Clock, Satellite, Gauge } from 'lucide-react';
import { ClimateAlert } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { useL, nf } from '../i18n/useL';
import { useLive, liveEngine } from '../context/LiveDataContext';
import { useToast } from '../context/ToastContext';
import { climateAlertMessages, climateRecommendations } from '../i18n/dataTranslations';
import { SeverityBadge, Pill } from '../components/ui';
import { d, formatDate, formatRelative } from '../data/dates';

const typeIcons: Record<string, typeof CloudLightning> = { heat_wave: Thermometer, flood: CloudRain, drought: Droplets, dust_storm: Wind, heavy_rain: CloudRain };
const typeKey: Record<ClimateAlert['type'], 'climate.heatWave' | 'climate.flood' | 'climate.drought' | 'climate.dustStorm' | 'climate.heavyRain'> = {
  heat_wave: 'climate.heatWave', flood: 'climate.flood', drought: 'climate.drought', dust_storm: 'climate.dustStorm', heavy_rain: 'climate.heavyRain',
};

const regions = ['Sahel', 'Boucle du Mouhoun', 'Centre-Ouest', 'Centre', 'Est', 'Nord'];
const districtsByRegion: Record<string, string[]> = {
  'Sahel': ['Djibo', 'Dori', 'Gorom-Gorom', 'Sebba'],
  'Boucle du Mouhoun': ['Dédougou', 'Boromo', 'Nouna'],
  'Centre-Ouest': ['Koudougou', 'Réo', 'Sapouy'],
  'Centre': ['Ouagadougou', 'Ziniaré'],
  'Est': ["Fada N'Gourma", 'Diapaga'],
  'Nord': ['Ouahigouya', 'Yako'],
};

const LANG_OPTIONS = [['Mooré', 'moore'], ['Dioula', 'dioula'], ['Fulfuldé', 'fulfulde'], ['Français', 'french']];

export default function ClimateAlerts() {
  const { t, language } = useLanguage();
  const L = useL();
  const live = useLive();
  const { toast } = useToast();
  const alerts = live.climateAlerts;
  const [showForm, setShowForm] = useState(false);
  const [broadcastFor, setBroadcastFor] = useState<string | null>(null);
  const [broadcastLang, setBroadcastLang] = useState('Mooré');
  const [form, setForm] = useState({
    type: 'heat_wave' as ClimateAlert['type'], severity: 'medium' as ClimateAlert['severity'], region: 'Sahel', district: 'Djibo',
    message: '', startDate: d(1), endDate: '', affectedPopulation: 0, childrenAffected: 0, recommendations: [''],
  });

  const severityBorder: Record<string, string> = { critical: 'border-l-red-500', high: 'border-l-orange-500', medium: 'border-l-yellow-500', low: 'border-l-blue-500' };
  const severityBg: Record<string, string> = { critical: 'bg-red-100 text-red-600', high: 'bg-orange-100 text-orange-600', medium: 'bg-yellow-100 text-yellow-600', low: 'bg-blue-100 text-blue-600' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    liveEngine.addClimateAlert({
      id: `ca-${Date.now()}`, type: form.type, severity: form.severity, region: form.region, district: form.district, message: form.message,
      startDate: form.startDate, endDate: form.endDate || undefined, affectedPopulation: form.affectedPopulation, childrenAffected: form.childrenAffected,
      recommendations: form.recommendations.filter(r => r.trim() !== ''), status: 'active', source: L('Saisie manuelle · Coordination UNICEF', 'Manual entry · UNICEF Coordination'),
      confidence: 1, leadTimeHours: Math.max(0, Math.round((new Date(form.startDate).getTime() - Date.now()) / 3600_000)), issuedAt: new Date().toISOString(), acknowledged: true, broadcastCount: 0,
    });
    setShowForm(false);
    toast('success', t('climate.alertCreated'), L('Les agents de santé du district ont été notifiés.', 'District health workers have been notified.'));
    setForm({ type: 'heat_wave', severity: 'medium', region: 'Sahel', district: 'Djibo', message: '', startDate: d(1), endDate: '', affectedPopulation: 0, childrenAffected: 0, recommendations: [''] });
  };

  const doBroadcast = (id: string) => {
    const n = liveEngine.broadcastClimateAlert(id, broadcastLang);
    setBroadcastFor(null);
    toast('success', L(`Diffusion lancée — ${nf(n, language)} destinataires`, `Broadcast started — ${nf(n, language)} recipients`), L(`SMS ${broadcastLang} + message vocal IVR · rapport de livraison dans ~15 min`, `${broadcastLang} SMS + IVR voice message · delivery report in ~15 min`));
  };

  const acknowledge = (id: string) => {
    liveEngine.acknowledgeClimateAlert(id, L('Coordination UNICEF', 'UNICEF Coordination'));
    toast('success', L('Alerte acquittée', 'Alert acknowledged'));
  };

  const totalChildren = alerts.filter(a => a.status !== 'resolved').reduce((s, a) => s + a.childrenAffected, 0);
  const avgLead = Math.round(alerts.filter(a => a.status === 'active').reduce((s, a) => s + a.leadTimeHours, 0) / Math.max(1, alerts.filter(a => a.status === 'active').length));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('climate.title')}</h1>
          <p className="text-gray-500 mt-1">{t('climate.subtitle')} · {L('fusion ANAM, ECMWF, CHIRPS, satellites', 'ANAM, ECMWF, CHIRPS, satellite fusion')}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={16} /> : <CloudLightning size={16} />} {t('climate.newAlert')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card border-2 border-unicef-blue/20 animate-in">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Plus size={16} className="text-unicef-blue" /> {t('climate.createAlert')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.alertType')}</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as ClimateAlert['type'] }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                {(Object.keys(typeKey) as ClimateAlert['type'][]).map(k => <option key={k} value={k}>{t(typeKey[k])}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.severity')}</label>
              <select value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value as ClimateAlert['severity'] }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
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
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.startDate')}</label>
              <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.endDate')}</label>
              <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.affectedPopulation')}</label>
              <input type="number" min="0" value={form.affectedPopulation || ''} onChange={e => setForm(p => ({ ...p, affectedPopulation: parseInt(e.target.value) || 0 }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.childrenAffected')}</label>
              <input type="number" min="0" value={form.childrenAffected || ''} onChange={e => setForm(p => ({ ...p, childrenAffected: parseInt(e.target.value) || 0 }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.message')}</label>
              <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder={t('climate.messagePlaceholder')} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" required />
            </div>
            <div className="md:col-span-2 lg:col-span-4">
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('climate.recommendations')}</label>
              <div className="space-y-2">
                {form.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2">
                    <input type="text" value={rec} onChange={e => setForm(p => ({ ...p, recommendations: p.recommendations.map((r, j) => j === i ? e.target.value : r) }))} placeholder={`${L('Recommandation', 'Recommendation')} ${i + 1}`} className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                    {form.recommendations.length > 1 && <button type="button" onClick={() => setForm(p => ({ ...p, recommendations: p.recommendations.filter((_, j) => j !== i) }))} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><X size={16} /></button>}
                  </div>
                ))}
                <button type="button" onClick={() => setForm(p => ({ ...p, recommendations: [...p.recommendations, ''] }))} className="text-xs text-unicef-blue hover:underline flex items-center gap-1"><Plus size={12} /> {L('Ajouter une recommandation', 'Add a recommendation')}</button>
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2"><CheckCircle size={16} /> {t('climate.submit')}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">{t('climate.cancel')}</button>
          </div>
        </form>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {(['critical', 'high', 'medium'] as const).map(s => (
          <div key={s} className={`card ${s === 'critical' ? 'bg-red-50 border-red-100' : s === 'high' ? 'bg-orange-50 border-orange-100' : 'bg-yellow-50 border-yellow-100'}`}>
            <p className={`text-xs font-medium ${s === 'critical' ? 'text-red-600' : s === 'high' ? 'text-orange-600' : 'text-yellow-700'}`}>{t(`severity.${s}` as 'severity.critical')}</p>
            <p className={`text-2xl font-bold ${s === 'critical' ? 'text-red-800' : s === 'high' ? 'text-orange-800' : 'text-yellow-800'}`}>{alerts.filter(a => a.severity === s && a.status !== 'resolved').length}</p>
          </div>
        ))}
        <div className="card bg-blue-50 border-blue-100">
          <p className="text-xs text-blue-600 font-medium">{L('Enfants exposés', 'Children exposed')}</p>
          <p className="text-2xl font-bold text-blue-800">{nf(totalChildren, language)}</p>
        </div>
        <div className="card bg-purple-50 border-purple-100">
          <p className="text-xs text-purple-600 font-medium flex items-center gap-1"><Clock size={12} /> {L("Anticipation moy.", 'Avg lead time')}</p>
          <p className="text-2xl font-bold text-purple-800">{avgLead} h</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {alerts.map(alert => {
          const Icon = typeIcons[alert.type] || CloudLightning;
          const recs = climateRecommendations[alert.id]?.[language] || alert.recommendations;
          return (
            <div key={alert.id} className={`card border-l-4 ${severityBorder[alert.severity]} ${alert.status === 'resolved' ? 'opacity-60' : ''}`}>
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${severityBg[alert.severity]}`}><Icon size={22} /></div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-gray-900">{t(typeKey[alert.type])}</h3>
                      <SeverityBadge severity={alert.severity} label={t(`severity.${alert.severity}` as 'severity.critical')} />
                      <Pill tone={alert.status === 'active' ? 'red' : alert.status === 'monitoring' ? 'blue' : 'green'}>{alert.status === 'active' ? t('status.active') : alert.status === 'monitoring' ? t('status.monitoring') : t('status.resolved')}</Pill>
                      {alert.acknowledged ? <Pill tone="green">✓ {L('Acquittée', 'Acknowledged')}</Pill> : <Pill tone="orange">{L('À acquitter', 'To acknowledge')}</Pill>}
                    </div>
                    <p className="text-sm text-gray-700 mt-1.5">{climateAlertMessages[alert.id]?.[language] || alert.message}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(alert.startDate, language)}{alert.endDate && ` → ${formatDate(alert.endDate, language)}`}</span>
                      <span className="flex items-center gap-1"><Users size={12} /> {nf(alert.childrenAffected, language)} {t('climate.children')} / {nf(alert.affectedPopulation, language)} {L('hab.', 'pop.')}</span>
                      <span>📍 {alert.district}, {alert.region}</span>
                      <span className="flex items-center gap-1"><Satellite size={12} /> {alert.source}</span>
                      <span className="flex items-center gap-1"><Gauge size={12} /> {L('confiance', 'confidence')} {Math.round(alert.confidence * 100)} %</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {L('émise', 'issued')} {formatRelative(alert.issuedAt, language)} · {L('anticipation', 'lead')} <b className="text-purple-700">{alert.leadTimeHours} h</b></span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-2 lg:w-56 flex-shrink-0 print:hidden">
                  <div className="text-center px-3 py-2 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900 tabular-nums">{nf(alert.broadcastCount ?? 0, language)}</p>
                    <p className="text-[11px] text-gray-500">{L('messages diffusés', 'messages broadcast')}</p>
                  </div>
                  {!alert.acknowledged && alert.status !== 'resolved' && (
                    <button onClick={() => acknowledge(alert.id)} className="btn-secondary text-xs flex items-center justify-center gap-1.5"><CheckCircle size={14} /> {L('Acquitter', 'Acknowledge')}</button>
                  )}
                  {alert.status !== 'resolved' && (broadcastFor === alert.id ? (
                    <div className="flex gap-1.5">
                      <select value={broadcastLang} onChange={e => setBroadcastLang(e.target.value)} className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5">
                        {LANG_OPTIONS.map(([lab]) => <option key={lab} value={lab}>{lab}</option>)}
                      </select>
                      <button onClick={() => doBroadcast(alert.id)} className="btn-primary text-xs px-3">OK</button>
                    </div>
                  ) : (
                    <button onClick={() => setBroadcastFor(alert.id)} className="btn-primary text-xs flex items-center justify-center gap-1.5"><Send size={14} /> {L('Diffuser aux communautés', 'Broadcast to communities')}</button>
                  ))}
                </div>
              </div>

              {recs.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <h4 className="text-[11px] font-semibold text-gray-500 uppercase mb-2">{t('climate.recommendations')} · {L('protocole santé-climat', 'climate-health protocol')}</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {recs.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600"><span className="text-green-500 mt-0.5">✔</span>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
