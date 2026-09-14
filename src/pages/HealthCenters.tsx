import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Droplets, Thermometer, MapPin, Search, Users, Wifi } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useL, nf } from '../i18n/useL';
import { useLive } from '../context/LiveDataContext';
import { Bar, LinkBadge, StatusDot } from '../components/ui';
import { formatRelative } from '../data/dates';

const TONES = {
  operational: { card: 'bg-green-50 border-green-100', dot: 'bg-green-500', text: 'text-green-800', num: 'text-green-900' },
  partial: { card: 'bg-yellow-50 border-yellow-100', dot: 'bg-yellow-500', text: 'text-yellow-800', num: 'text-yellow-900' },
  offline: { card: 'bg-red-50 border-red-100', dot: 'bg-red-500', text: 'text-red-800', num: 'text-red-900' },
} as const;

export default function HealthCenters() {
  const { t, language } = useLanguage();
  const L = useL();
  const live = useLive();
  const [region, setRegion] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');

  const regions = Array.from(new Set(live.centers.map(c => c.region)));

  const filtered = useMemo(() => live.centers.filter(c =>
    (!region || c.region === region) &&
    (!status || c.status === status) &&
    (!query || `${c.name} ${c.district} ${c.region}`.toLowerCase().includes(query.toLowerCase()))
  ), [live.centers, region, status, query]);

  const linkLabels = { connected: L('Connecté', 'Connected'), intermittent: L('Intermittent', 'Intermittent'), offline: L('Hors ligne', 'Offline') };

  const counts = {
    operational: live.centers.filter(c => c.status === 'operational').length,
    partial: live.centers.filter(c => c.status === 'partial').length,
    offline: live.centers.filter(c => c.status === 'offline').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('centers.title')}</h1>
          <p className="text-gray-500 mt-1">{t('centers.subtitle')} · {nf(live.centers.reduce((s, c) => s + c.base.populationServed, 0), language)} {L('habitants desservis', 'people served')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={L('Rechercher un centre…', 'Search a centre…')}
              className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white w-52 focus:outline-none focus:ring-2 focus:ring-unicef-blue/30"
            />
          </div>
          <select value={region} onChange={e => setRegion(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <option value="">{L('Toutes les régions', 'All regions')}</option>
            {regions.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <option value="">{t('centers.allStatuses')}</option>
            <option value="operational">{t('status.operational')}</option>
            <option value="partial">{t('status.partial')}</option>
            <option value="offline">{t('status.offline')}</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(['operational', 'partial', 'offline'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatus(status === s ? '' : s)}
            className={`card text-left transition-all ${status === s ? 'ring-2 ring-unicef-blue/40' : ''} ${TONES[s].card}`}
          >
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${TONES[s].dot}`} />
              <span className={`text-sm font-medium ${TONES[s].text}`}>{t(`status.${s}` as 'status.operational')}</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${TONES[s].num}`}>{counts[s]}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => (
          <Link key={c.id} to={`/centres/${c.id}`} className="card hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <StatusDot status={c.status} />
                  <h3 className="text-sm font-semibold text-gray-800 truncate">{c.name}</h3>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                  <MapPin size={12} className="text-gray-400" />
                  <span>{c.district}, {c.region}</span>
                  <span className="text-gray-300">·</span>
                  <span className="font-medium text-gray-600">{c.base.type}</span>
                </div>
              </div>
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                c.status === 'operational' ? 'bg-green-100 text-green-700' : c.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
              }`}>
                {c.status === 'operational' ? 'OK' : c.status === 'partial' ? t('status.partial') : t('status.offline')}
              </span>
            </div>

            {c.base.note && <p className="text-[11px] text-gray-500 bg-gray-50 rounded px-2 py-1 mb-3 leading-snug">{c.base.note[language]}</p>}

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Sun size={14} className="text-yellow-500" /><span className="text-xs text-gray-600">{t('centers.battery')}</span></div>
                <div className="flex items-center gap-2 w-32"><Bar value={c.battery_pct} tone="battery" /><span className="text-xs font-medium text-gray-700 w-10 text-right tabular-nums">{c.battery_pct.toFixed(0)} %</span></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Droplets size={14} className="text-blue-500" /><span className="text-xs text-gray-600">{t('centers.water')}</span></div>
                <div className="flex items-center gap-2 w-32"><Bar value={c.water_pct} tone="water" /><span className="text-xs font-medium text-gray-700 w-10 text-right tabular-nums">{c.water_pct.toFixed(0)} %</span></div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Thermometer size={14} className="text-cyan-500" /><span className="text-xs text-gray-600">{t('centers.coldChain')}</span></div>
                <span className={`text-xs font-semibold tabular-nums ${c.coldStatus === 'optimal' ? 'text-green-600' : c.coldStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>{c.cold_c.toFixed(1)} °C</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] text-gray-500">
                <span className="flex items-center gap-1"><Users size={11} /> {nf(c.base.childrenUnder5, language)} {L('enfants <5', 'children <5')}</span>
                <span className="flex items-center gap-1"><Sun size={11} className="text-gray-400" /> {c.solar_kw.toFixed(1)}/{c.base.solarSystem.capacity_kw} kW</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <LinkBadge link={c.link} labels={linkLabels} />
                <span className="text-gray-400 flex items-center gap-1"><Wifi size={10} /> {formatRelative(new Date(c.lastPing).toISOString(), language)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-sm text-gray-500 py-8">{L('Aucun centre ne correspond aux filtres.', 'No centre matches the filters.')}</p>}
    </div>
  );
}
