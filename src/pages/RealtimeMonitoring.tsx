import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, WifiOff, Sun, Droplets, Circle, AlertTriangle, Server, Radio, Cpu, Signal, Database, Snowflake, Pause,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, ReferenceLine } from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';
import { useL } from '../i18n/useL';
import { useLive } from '../context/LiveDataContext';
import { API_BASE } from '../services/api';
import { EventRow, LinkBadge, SectionTitle } from '../components/ui';
import { formatRelative } from '../data/dates';

const fmt = (t: number) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Ouagadougou' });

export default function RealtimeMonitoring() {
  const { language } = useLanguage();
  const L = useL();
  const live = useLive();
  const [paused, setPaused] = useState(false);
  const [frozen, setFrozen] = useState(live);
  const [selected, setSelected] = useState('all');

  const view = paused ? frozen : live;
  const centers = view.centers;
  const series = view.fleetSeries.map(p => ({ ...p, time: fmt(p.t) }));
  const connected = centers.filter(c => c.link === 'connected').length;
  const intermittent = centers.filter(c => c.link === 'intermittent').length;
  const offline = centers.filter(c => c.link === 'offline').length;
  const rows = selected === 'all' ? centers : centers.filter(c => c.id === selected);
  const sensorEvents = view.events.filter(e => ['sensor', 'coldchain', 'water'].includes(e.kind)).slice(0, 12);
  const readingsPerMin = (centers.length - offline) * 6 * 20; // 6 capteurs × 20 relevés/min
  const linkLabels = { connected: L('Connecté', 'Connected'), intermittent: L('Intermittent', 'Intermittent'), offline: L('Hors ligne', 'Offline') };

  const togglePause = () => { if (!paused) setFrozen(live); setPaused(p => !p); };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{L('Monitoring temps réel', 'Real-time monitoring')}</h1>
          <p className="text-gray-500 mt-1">{L('Télémétrie IoT des 10 formations sanitaires — rafraîchissement 3 s', 'IoT telemetry from the 10 health facilities — 3 s refresh')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={togglePause} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!paused ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {!paused ? <Radio size={16} className="animate-pulse" /> : <Pause size={16} />}
            {!paused ? 'LIVE' : L('EN PAUSE', 'PAUSED')}
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="card bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="flex items-center gap-2"><Cpu size={15} className="text-blue-300" /> {L('Passerelle', 'Gateway')}: <span className="font-mono text-green-300">LoRaWAN + GSM/3G</span></span>
            <span className="flex items-center gap-2"><Database size={15} className="text-blue-300" /> MQTT: <span className="font-mono text-green-300">broker.unicef-bf.local</span></span>
            <span className="flex items-center gap-2"><Server size={15} className="text-blue-300" /> API: <span className={`font-mono ${view.backend === 'connected' ? 'text-green-300' : 'text-amber-300'}`}>{view.backend === 'connected' ? `${L('connectée', 'connected')} · ${view.backendLatencyMs} ms` : L('autonome', 'standalone')}</span></span>
            <span className="flex items-center gap-2"><Signal size={15} className="text-blue-300" /> <span className="font-mono">{readingsPerMin.toLocaleString()} {L('relevés/min', 'readings/min')}</span></span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5"><Circle size={8} className="text-green-400 fill-green-400" /> {connected}</span>
            <span className="flex items-center gap-1.5"><Circle size={8} className="text-yellow-400 fill-yellow-400" /> {intermittent}</span>
            <span className="flex items-center gap-1.5"><Circle size={8} className="text-red-400 fill-red-400" /> {offline}</span>
            <span className="text-xs text-gray-400 font-mono">{fmt(view.now)}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <SectionTitle icon={Sun}>{L('Production solaire (10 centres) & batterie moyenne', 'Solar production (10 centres) & average battery')}</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <ComposedChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
              <YAxis yAxisId="kw" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
              <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Area yAxisId="kw" type="monotone" dataKey="solar" stroke="#E0A800" fill="#FFC20E" fillOpacity={0.25} name={L('Solaire (kW)', 'Solar (kW)')} isAnimationActive={false} />
              <Area yAxisId="kw" type="monotone" dataKey="consumption" stroke="#F26A21" fill="#F26A21" fillOpacity={0.08} name={L('Charge (kW)', 'Load (kW)')} isAnimationActive={false} />
              <Line yAxisId="pct" type="monotone" dataKey="battery" stroke="#00833D" strokeWidth={2} dot={false} name={L('Batterie (%)', 'Battery (%)')} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <SectionTitle icon={Snowflake}>{L('Chaîne du froid moyenne & réservoirs', 'Average cold chain & reservoirs')}</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" axisLine={false} tickLine={false} />
              <YAxis yAxisId="c" domain={[0, 10]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
              <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <ReferenceLine yAxisId="c" y={8} stroke="#E2231A" strokeDasharray="4 4" />
              <ReferenceLine yAxisId="c" y={2} stroke="#1CABE2" strokeDasharray="4 4" />
              <Line yAxisId="c" type="monotone" dataKey="cold" stroke="#0E7490" strokeWidth={2} dot={false} name={L('Frigo moy. (°C)', 'Avg fridge (°C)')} isAnimationActive={false} />
              <Line yAxisId="pct" type="monotone" dataKey="water" stroke="#1CABE2" strokeWidth={2} dot={false} name={L('Eau moy. (%)', 'Avg water (%)')} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <SectionTitle icon={Activity} right={
          <select value={selected} onChange={e => setSelected(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
            <option value="all">{L('Tous les centres', 'All centres')}</option>
            {live.centers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        }>
          {L('Télémétrie par centre', 'Telemetry by centre')}
          {!paused && <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-green-600 font-medium"><Circle size={6} className="fill-green-500 animate-pulse" /> live</span>}
        </SectionTitle>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                <th className="text-left py-2 px-3">{L('Centre', 'Centre')}</th>
                <th className="text-left py-2 px-3">{L('Liaison', 'Link')}</th>
                <th className="text-right py-2 px-3">{L('Solaire', 'Solar')}</th>
                <th className="text-right py-2 px-3">{L('Charge', 'Load')}</th>
                <th className="text-right py-2 px-3">{L('Batterie', 'Battery')}</th>
                <th className="text-right py-2 px-3">{L('Eau', 'Water')}</th>
                <th className="text-right py-2 px-3">{L('Frigo', 'Fridge')}</th>
                <th className="text-right py-2 px-3">{L('Ambiant', 'Ambient')}</th>
                <th className="text-right py-2 px-3">RSSI</th>
                <th className="text-right py-2 px-3">{L('Dernier relevé', 'Last reading')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${c.link === 'offline' ? 'opacity-70' : ''}`}>
                  <td className="py-2.5 px-3"><Link to={`/centres/${c.id}`} className="font-medium text-gray-800 hover:text-unicef-blue">{c.shortName}</Link><span className="text-[10px] text-gray-400 ml-1.5 font-mono">{c.id}</span></td>
                  <td className="py-2.5 px-3"><LinkBadge link={c.link} labels={linkLabels} /></td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums">{c.link === 'offline' ? '—' : `${c.solar_kw.toFixed(2)} kW`}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs tabular-nums text-gray-600">{c.link === 'offline' ? '—' : `${c.consumption_kw.toFixed(2)} kW`}</td>
                  <td className={`py-2.5 px-3 text-right font-mono text-xs font-semibold tabular-nums ${c.battery_pct > 60 ? 'text-green-600' : c.battery_pct > 25 ? 'text-yellow-600' : 'text-red-600'}`}>{c.battery_pct.toFixed(1)} %</td>
                  <td className={`py-2.5 px-3 text-right font-mono text-xs font-semibold tabular-nums ${c.water_pct > 50 ? 'text-blue-600' : c.water_pct > 20 ? 'text-yellow-600' : 'text-red-600'}`}>{c.water_pct.toFixed(1)} %</td>
                  <td className={`py-2.5 px-3 text-right font-mono text-xs font-semibold tabular-nums ${c.cold_c >= 2 && c.cold_c <= 8 ? 'text-green-600' : 'text-red-600'}`}>{c.cold_c.toFixed(1)} °C</td>
                  <td className={`py-2.5 px-3 text-right font-mono text-xs tabular-nums ${c.ambient_c > 40 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>{c.ambient_c.toFixed(1)} °C</td>
                  <td className="py-2.5 px-3 text-right font-mono text-xs text-gray-500">{c.link === 'offline' ? '—' : `${c.signal_dbm} dBm`}</td>
                  <td className="py-2.5 px-3 text-right text-xs text-gray-500">{formatRelative(new Date(c.lastPing).toISOString(), language)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <SectionTitle icon={AlertTriangle}>{L('Événements capteurs', 'Sensor events')}</SectionTitle>
          <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
            {sensorEvents.length === 0 ? <p className="text-xs text-gray-400 py-4 text-center">{L('Aucun événement', 'No event')}</p>
              : sensorEvents.map(ev => <EventRow key={ev.id} ev={ev} lang={language} compact />)}
          </div>
        </div>

        <div className="card">
          <SectionTitle icon={Server}>{L('Intégration & interopérabilité', 'Integration & interoperability')}</SectionTitle>
          <div className="space-y-1.5 font-mono text-xs">
            {[
              ['POST', '/api/v1/sensors/batch', L('Ingestion lots capteurs', 'Sensor batch ingestion'), 'green'],
              ['GET', '/api/v1/sensors/realtime', L('État temps réel', 'Real-time state'), 'blue'],
              ['GET', '/api/v1/alerts/active', L('Alertes actives', 'Active alerts'), 'blue'],
              ['POST', '/api/v1/predictions/epidemic', L('Prédiction épidémique', 'Epidemic prediction'), 'purple'],
              ['POST', '/api/v1/translations/translate', L('Traduction Mooré/Dioula/Fulfuldé', 'Mooré/Dioula/Fulfulde translation'), 'purple'],
              ['POST', '/api/v1/simulation/run', L('Simulation Monte-Carlo', 'Monte-Carlo simulation'), 'purple'],
            ].map(([m, p, d, tone]) => (
              <div key={p} className="p-2 bg-gray-50 rounded flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold bg-${tone}-100 text-${tone}-700`}>{m}</span>
                <span className="text-gray-700">{p}</span>
                <span className="text-gray-400 ml-auto font-sans">{d}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700">OpenAPI 3.1 · <a href={`${API_BASE}/docs`} target="_blank" rel="noreferrer" className="underline">Swagger</a></span>
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-600">DHIS2 · FHIR R4 {L('(en cours)', '(in progress)')}</span>
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-600">MQTT 3.1.1 · LoRaWAN 1.0.4</span>
            <span className="px-2 py-1 rounded bg-gray-100 text-gray-600">{L('Chiffrement TLS 1.3 · données hébergées UNICEF', 'TLS 1.3 encryption · UNICEF-hosted data')}</span>
          </div>
          {offline > 0 && (
            <p className="mt-3 text-[11px] text-gray-500 flex items-center gap-1.5"><WifiOff size={12} className="text-red-500" /> {L('Les centres hors ligne conservent leurs relevés localement (buffer 72 h) et les synchronisent au retour de la liaison.', 'Offline centres buffer readings locally (72 h) and sync when the link returns.')}</p>
          )}
          <span className="hidden bg-green-100 text-green-700 bg-blue-100 text-blue-700 bg-purple-100 text-purple-700" />
        </div>
      </div>
    </div>
  );
}
