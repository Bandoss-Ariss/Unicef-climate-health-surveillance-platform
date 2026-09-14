import { useMemo, useState } from 'react';
import { ScrollText, Search, Download, Filter, AlertTriangle, MessageSquare, Wrench, Brain, CheckCircle2, Activity, Server, Thermometer, Droplets } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useL } from '../i18n/useL';
import { useLive } from '../context/LiveDataContext';
import { useToast } from '../context/ToastContext';
import { EventRow, SectionTitle } from '../components/ui';
import { EventKind } from '../types';

const KINDS: Array<{ k: EventKind | 'all'; fr: string; en: string; icon: typeof Activity }> = [
  { k: 'all', fr: 'Tous', en: 'All', icon: ScrollText },
  { k: 'alert', fr: 'Alertes', en: 'Alerts', icon: AlertTriangle },
  { k: 'sms', fr: 'Messages', en: 'Messages', icon: MessageSquare },
  { k: 'coldchain', fr: 'Chaîne du froid', en: 'Cold chain', icon: Thermometer },
  { k: 'water', fr: 'Eau', en: 'Water', icon: Droplets },
  { k: 'sensor', fr: 'Capteurs', en: 'Sensors', icon: Activity },
  { k: 'maintenance', fr: 'Maintenance', en: 'Maintenance', icon: Wrench },
  { k: 'prediction', fr: 'Prédictions', en: 'Predictions', icon: Brain },
  { k: 'ack', fr: 'Acquittements', en: 'Acknowledgements', icon: CheckCircle2 },
  { k: 'system', fr: 'Système', en: 'System', icon: Server },
];

export default function Journal() {
  const { language } = useLanguage();
  const L = useL();
  const live = useLive();
  const { toast } = useToast();
  const [kind, setKind] = useState<EventKind | 'all'>('all');
  const [severity, setSeverity] = useState('all');
  const [query, setQuery] = useState('');

  const events = useMemo(() => live.events.filter(e =>
    (kind === 'all' || e.kind === kind) &&
    (severity === 'all' || e.severity === severity) &&
    (!query || `${e.title.fr} ${e.title.en} ${e.district ?? ''} ${e.actor ?? ''}`.toLowerCase().includes(query.toLowerCase()))
  ), [live.events, kind, severity, query]);

  const last24 = live.events.filter(e => Date.now() - new Date(e.at).getTime() < 86_400_000);
  const stats = {
    total: last24.length,
    critical: last24.filter(e => e.severity === 'critical').length,
    sms: last24.filter(e => e.kind === 'sms').length,
    auto: last24.filter(e => !e.actor || e.actor.startsWith('Moteur')).length,
  };

  // regroupement par jour
  const groups = useMemo(() => {
    const m = new Map<string, typeof events>();
    events.forEach(e => {
      const key = new Date(e.at).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Ouagadougou' });
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    });
    return Array.from(m.entries());
  }, [events, language]);

  const exportCsv = () => {
    const header = ['timestamp', 'kind', 'severity', 'district', 'center_id', 'actor', 'title'];
    const rows = events.map(e => [e.at, e.kind, e.severity, e.district ?? '', e.centerId ?? '', e.actor ?? '', `"${e.title[language].replace(/"/g, '""')}"`]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `journal-operations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('success', L(`${events.length} événements exportés (CSV)`, `${events.length} events exported (CSV)`));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{L('Journal des opérations', 'Operations log')}</h1>
          <p className="text-gray-500 mt-1">{L('Traçabilité complète : chaque alerte, message, action automatique et intervention humaine est horodatée', 'Full traceability: every alert, message, automated action and human intervention is timestamped')}</p>
        </div>
        <button onClick={exportCsv} className="btn-secondary text-xs flex items-center gap-1.5 print:hidden"><Download size={14} /> {L('Exporter CSV', 'Export CSV')}</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card"><p className="text-xs text-gray-500">{L('Événements (24 h)', 'Events (24 h)')}</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
        <div className="card"><p className="text-xs text-gray-500">{L('Critiques (24 h)', 'Critical (24 h)')}</p><p className="text-2xl font-bold text-red-600">{stats.critical}</p></div>
        <div className="card"><p className="text-xs text-gray-500">{L('Messages diffusés (24 h)', 'Messages sent (24 h)')}</p><p className="text-2xl font-bold text-unicef-blue">{stats.sms}</p></div>
        <div className="card"><p className="text-xs text-gray-500">{L('Actions automatiques', 'Automated actions')}</p><p className="text-2xl font-bold text-purple-600">{Math.round(stats.auto / Math.max(1, stats.total) * 100)} %</p><p className="text-[11px] text-gray-400">{L('sans intervention humaine', 'without human intervention')}</p></div>
      </div>

      <div className="card print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder={L('Rechercher (district, acteur, texte)…', 'Search (district, actor, text)…')} className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white w-72 focus:outline-none focus:ring-2 focus:ring-unicef-blue/30" />
          </div>
          <select value={severity} onChange={e => setSeverity(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <option value="all">{L('Toutes sévérités', 'All severities')}</option>
            <option value="critical">{L('Critique', 'Critical')}</option><option value="warning">{L('Avertissement', 'Warning')}</option><option value="success">{L('Succès', 'Success')}</option><option value="info">Info</option>
          </select>
          <span className="text-xs text-gray-400 ml-auto"><Filter size={12} className="inline mr-1" />{events.length} / {live.events.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {KINDS.map(k => (
            <button key={k.k} onClick={() => setKind(k.k)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${kind === k.k ? 'bg-unicef-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <k.icon size={11} /> {language === 'fr' ? k.fr : k.en}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <SectionTitle icon={ScrollText}>{L('Chronologie', 'Timeline')} <span className="ml-1 w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" /></SectionTitle>
        {groups.length === 0 && <p className="text-sm text-gray-400 py-6 text-center">{L('Aucun événement ne correspond aux filtres.', 'No event matches the filters.')}</p>}
        <div className="space-y-5">
          {groups.map(([day, evs]) => (
            <div key={day}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1 sticky top-14 bg-white py-1">{day} · {evs.length}</p>
              <div className="divide-y divide-gray-50 border-l-2 border-gray-100 pl-3">
                {evs.map(ev => <EventRow key={ev.id} ev={ev} lang={language} compact />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
