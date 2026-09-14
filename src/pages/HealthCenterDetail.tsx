import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import {
  ArrowLeft, Sun, Droplets, Thermometer, Battery, Wrench, MapPin, Users, Radio, Clock, AlertTriangle, Phone, Snowflake, Gauge,
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area, LineChart, Line, ReferenceArea, ReferenceLine, Legend,
} from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';
import { useL, nf } from '../i18n/useL';
import { useLive, liveEngine } from '../context/LiveDataContext';
import { useToast } from '../context/ToastContext';
import { Bar, EventRow, LinkBadge, SectionTitle, StatusDot, Pill } from '../components/ui';
import { formatDate, formatRelative } from '../data/dates';

const fmtHour = (t: number) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Ouagadougou' });

export default function HealthCenterDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const L = useL();
  const live = useLive();
  const { toast } = useToast();
  const [ticketCreated, setTicketCreated] = useState<string | null>(null);

  const c = live.centers.find(x => x.id === id);
  if (!c) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('centers.notFound')}</p>
        <Link to="/centres" className="btn-primary mt-4 inline-block">{t('centers.back')}</Link>
      </div>
    );
  }
  const base = c.base;
  const history = live.history[c.id].map(p => ({ ...p, time: fmtHour(p.t) }));
  const centerEvents = live.events.filter(e => e.centerId === c.id);
  const linkLabels = { connected: L('Connecté', 'Connected'), intermittent: L('Intermittent', 'Intermittent'), offline: L('Hors ligne', 'Offline') };
  const doses = base.coldChain.vaccineStock.reduce((s, v) => s + v.quantity, 0);
  const dosesAtRisk = base.coldChain.vaccineStock.filter(v => !v.temperatureOk).reduce((s, v) => s + v.quantity, 0);

  const createTicket = () => {
    const issue = c.status === 'offline'
      ? ['Intervention urgente parc batteries', 'Urgent battery bank intervention']
      : base.solarSystem.status === 'degraded' ? ['Diagnostic champ PV / onduleur', 'PV array / inverter diagnostic'] : ['Maintenance préventive trimestrielle', 'Quarterly preventive maintenance'];
    const ticket = liveEngine.createMaintenanceTicket(c.id, issue[0], issue[1]);
    setTicketCreated(ticket);
    toast('success', L(`Ticket ${ticket} créé`, `Ticket ${ticket} created`), L('Technicien régional notifié par SMS', 'Regional technician notified by SMS'));
  };

  const notifyIcp = () => {
    liveEngine.pushEvent('sms', 'info', `SMS envoyé à l'ICP ${c.shortName} — demande de contrôle chaîne du froid`, `SMS sent to ${c.shortName} head nurse — cold chain check request`, { centerId: c.id, district: c.district, actor: 'Coordination UNICEF' });
    toast('success', L("SMS envoyé à l'infirmier chef de poste", 'SMS sent to the head nurse'), `+226 7• •• •• •• · ${c.shortName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/centres" className="p-2 hover:bg-gray-100 rounded-lg mt-0.5"><ArrowLeft size={20} className="text-gray-600" /></Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusDot status={c.status} />
              <h1 className="text-2xl font-bold text-gray-900">{c.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === 'operational' ? 'bg-green-100 text-green-700' : c.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                {c.status === 'operational' ? t('status.operational') : c.status === 'partial' ? t('status.partial') : t('status.offline')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1"><MapPin size={14} className="text-gray-400" /> {c.district}, {c.region} · {base.latitude.toFixed(4)}, {base.longitude.toFixed(4)}</span>
              <span className="flex items-center gap-1"><Users size={14} className="text-gray-400" /> {nf(base.populationServed, language)} {L('hab.', 'pop.')} · {nf(base.childrenUnder5, language)} {L('enfants <5', 'children <5')} · {base.chwCount} ASBC</span>
              <LinkBadge link={c.link} labels={linkLabels} />
              <span className="flex items-center gap-1 text-xs"><Clock size={12} /> {L('dernier relevé', 'last reading')} {formatRelative(new Date(c.lastPing).toISOString(), language)}</span>
            </div>
            {base.note && (
              <p className="mt-2 inline-flex items-center gap-2 text-xs text-orange-800 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-1.5">
                <AlertTriangle size={13} /> {base.note[language]}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={notifyIcp} className="btn-secondary text-xs flex items-center gap-1.5"><Phone size={14} /> {L("Notifier l'ICP", 'Notify head nurse')}</button>
          <button onClick={createTicket} disabled={!!ticketCreated} className="btn-primary text-xs flex items-center gap-1.5 disabled:opacity-60">
            <Wrench size={14} /> {ticketCreated ? `${L('Ticket', 'Ticket')} ${ticketCreated} ✓` : L('Créer un ticket maintenance', 'Create maintenance ticket')}
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2"><Battery size={16} className="text-yellow-500" /><span className="text-xs text-gray-500">{t('centers.battery')}</span></div>
          <p className="text-xl font-bold tabular-nums">{c.battery_pct.toFixed(1)} %</p>
          <Bar value={c.battery_pct} tone="battery" height="h-2" />
          <p className="text-[11px] text-gray-400">{L('autonomie', 'autonomy')} ≈ {c.autonomy_h.toFixed(0)} h</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2"><Sun size={16} className="text-yellow-500" /><span className="text-xs text-gray-500">{t('centers.production')}</span></div>
          <p className="text-xl font-bold tabular-nums">{c.solar_kw.toFixed(2)} kW</p>
          <p className="text-[11px] text-gray-400">{c.todayProduction_kwh.toFixed(1)} kWh {L("aujourd'hui", 'today')} · {L('charge', 'load')} {c.consumption_kw.toFixed(2)} kW</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2"><Droplets size={16} className="text-blue-500" /><span className="text-xs text-gray-500">{t('centers.reservoir')}</span></div>
          <p className="text-xl font-bold tabular-nums">{c.water_pct.toFixed(0)} %</p>
          <Bar value={c.water_pct} tone="water" height="h-2" />
          <p className="text-[11px] text-gray-400">≈ {nf(Math.round(base.waterSystem.reservoirCapacity_liters * c.water_pct / 100), language)} L · {L('pompe', 'pump')} {c.pump === 'running' ? L('en marche', 'running') : L('arrêtée', 'stopped')}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2"><Thermometer size={16} className="text-cyan-500" /><span className="text-xs text-gray-500">{t('centers.coldChain')}</span></div>
          <p className={`text-xl font-bold tabular-nums ${c.coldStatus === 'optimal' ? 'text-green-600' : c.coldStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>{c.cold_c.toFixed(1)} °C</p>
          <p className="text-[11px] text-gray-400">{base.coldChain.fridgeModel}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2"><Gauge size={16} className="text-orange-500" /><span className="text-xs text-gray-500">{L('Ambiant', 'Ambient')}</span></div>
          <p className={`text-xl font-bold tabular-nums ${c.ambient_c > 40 ? 'text-red-600' : ''}`}>{c.ambient_c.toFixed(1)} °C</p>
          <p className="text-[11px] text-gray-400">{L('humidité', 'humidity')} {c.humidity_pct} % · {L('signal', 'signal')} {c.signal_dbm} dBm</p>
        </div>
      </div>

      {/* 24h charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <SectionTitle icon={Sun}>{L('Production solaire & état de charge — 24 h', 'Solar production & state of charge — 24 h')}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={7} axisLine={false} tickLine={false} />
              <YAxis yAxisId="kw" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={34} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area yAxisId="kw" type="monotone" dataKey="solar" stroke="#E0A800" fill="#FFC20E" fillOpacity={0.25} name={L('Production (kW)', 'Production (kW)')} />
              <Area yAxisId="kw" type="monotone" dataKey="consumption" stroke="#F26A21" fill="#F26A21" fillOpacity={0.08} name={L('Charge (kW)', 'Load (kW)')} />
              <Line yAxisId="pct" type="monotone" dataKey="battery" stroke="#00833D" strokeWidth={2} dot={false} name={L('Batterie (%)', 'Battery (%)')} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <SectionTitle icon={Snowflake}>{L('Température chaîne du froid — 24 h (plage OMS 2-8 °C)', 'Cold chain temperature — 24 h (WHO range 2-8 °C)')}</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={7} axisLine={false} tickLine={false} />
              <YAxis yAxisId="c" domain={[0, Math.max(14, Math.ceil(c.cold_c + 2))]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <YAxis yAxisId="a" orientation="right" domain={[15, 45]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <ReferenceArea yAxisId="c" y1={2} y2={8} fill="#00833D" fillOpacity={0.08} />
              <ReferenceLine yAxisId="c" y={8} stroke="#E2231A" strokeDasharray="4 4" label={{ value: '8 °C', fontSize: 10, fill: '#E2231A', position: 'right' }} />
              <ReferenceLine yAxisId="c" y={2} stroke="#1CABE2" strokeDasharray="4 4" label={{ value: '2 °C', fontSize: 10, fill: '#1CABE2', position: 'right' }} />
              <Line yAxisId="c" type="monotone" dataKey="cold" stroke={c.coldStatus === 'critical' ? '#E2231A' : '#0E7490'} strokeWidth={2} dot={false} name={L('Frigo (°C)', 'Fridge (°C)')} />
              <Line yAxisId="a" type="monotone" dataKey="ambient" stroke="#9CA3AF" strokeWidth={1} strokeDasharray="3 3" dot={false} name={L('Ambiant (°C)', 'Ambient (°C)')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Specs + water + vaccines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <SectionTitle>{t('centers.solarInfo')}</SectionTitle>
          <dl className="text-sm divide-y divide-gray-50">
            {[
              [t('centers.panelCount'), `${base.solarSystem.panelCount} × 450 Wc`],
              [t('centers.installedCapacity'), `${base.solarSystem.capacity_kw} kWc`],
              [L('Stockage', 'Storage'), `${base.solarSystem.batteryCapacity_kwh} kWh LiFePO₄`],
              [t('centers.efficiency'), `${Math.round((c.solar_kw / base.solarSystem.capacity_kw) * 100)} % ${L('instantané', 'now')}`],
              [L('Mise en service', 'Commissioned'), formatDate(base.installationDate, language)],
              [t('centers.lastMaintenance'), formatDate(base.solarSystem.lastMaintenance, language)],
            ].map(([k, v]) => (
              <div key={k as string} className="flex justify-between py-2"><dt className="text-gray-600">{k}</dt><dd className="font-medium text-gray-800">{v}</dd></div>
            ))}
            <div className="flex justify-between py-2">
              <dt className="text-gray-600">{t('energy.status')}</dt>
              <dd><Pill tone={base.solarSystem.status === 'optimal' ? 'green' : base.solarSystem.status === 'degraded' ? 'yellow' : 'red'}>
                {base.solarSystem.status === 'optimal' ? t('status.optimal') : base.solarSystem.status === 'degraded' ? t('status.degraded') : t('status.failure')}
              </Pill></dd>
            </div>
          </dl>
        </div>

        <div className="card">
          <SectionTitle>{t('centers.waterSystem')}</SectionTitle>
          <dl className="text-sm divide-y divide-gray-50">
            <div className="flex justify-between py-2"><dt className="text-gray-600">{t('centers.availability')}</dt>
              <dd><Pill tone={base.waterSystem.available ? 'green' : 'red'}>{base.waterSystem.available ? t('centers.available') : t('centers.unavailable')}</Pill></dd></div>
            <div className="flex justify-between py-2 items-center"><dt className="text-gray-600">{t('centers.reservoirLevel')}</dt>
              <dd className="flex items-center gap-2 w-36"><Bar value={c.water_pct} tone="water" /><span className="font-medium tabular-nums whitespace-nowrap">{c.water_pct.toFixed(0)} %</span></dd></div>
            <div className="flex justify-between py-2"><dt className="text-gray-600">{L('Capacité', 'Capacity')}</dt><dd className="font-medium">{nf(base.waterSystem.reservoirCapacity_liters, language)} L</dd></div>
            <div className="flex justify-between py-2"><dt className="text-gray-600">{t('centers.dailyConsumption')}</dt><dd className="font-medium">{base.waterSystem.dailyConsumption_liters} L</dd></div>
            <div className="flex justify-between py-2"><dt className="text-gray-600">{t('centers.quality')}</dt>
              <dd><Pill tone={base.waterSystem.quality === 'good' ? 'green' : base.waterSystem.quality === 'acceptable' ? 'yellow' : 'red'}>
                {base.waterSystem.quality === 'good' ? t('centers.qualityGood') : base.waterSystem.quality === 'acceptable' ? t('centers.qualityAcceptable') : t('centers.qualityPoor')}
              </Pill></dd></div>
            <div className="flex justify-between py-2"><dt className="text-gray-600">{t('centers.pump')}</dt>
              <dd><Pill tone={c.pump === 'running' ? 'green' : 'gray'}>{c.pump === 'running' ? t('centers.pumpRunning') : t('centers.pumpStopped')}</Pill></dd></div>
          </dl>
        </div>

        <div className="card">
          <SectionTitle right={dosesAtRisk > 0 ? <Pill tone="red">{dosesAtRisk} {L('doses à risque', 'doses at risk')}</Pill> : <Pill tone="green">{doses} {L('doses OK', 'doses OK')}</Pill>}>
            {t('centers.coldChainVaccines')}
          </SectionTitle>
          <div className="mb-3 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('centers.currentTemp')}</span>
              <span className={`text-lg font-bold tabular-nums ${c.coldStatus === 'optimal' ? 'text-green-600' : c.coldStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'}`}>{c.cold_c.toFixed(1)} °C</span>
            </div>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full relative">
              <div className="absolute h-full bg-green-300 rounded-full" style={{ left: `${(2 / 16) * 100}%`, right: `${100 - (8 / 16) * 100}%` }} />
              <div className={`absolute w-3 h-3 rounded-full -top-0.5 border-2 border-white shadow ${c.coldStatus === 'optimal' ? 'bg-green-600' : c.coldStatus === 'warning' ? 'bg-yellow-500' : 'bg-red-600'}`}
                style={{ left: `calc(${Math.min(Math.max((c.cold_c / 16) * 100, 0), 100)}% - 6px)` }} />
            </div>
            <div className="flex justify-between mt-1 text-[10px] text-gray-400"><span>0 °C</span><span className="text-green-600">{t('centers.optimalRange')}</span><span>16 °C</span></div>
          </div>
          <div className="space-y-1.5">
            {base.coldChain.vaccineStock.map((v, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-700">{v.name}</span>
                  <span className="text-[11px] text-gray-400 ml-2">{L('exp.', 'exp.')} {formatDate(v.expiryDate, language)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">{v.quantity} {t('centers.doses')}</span>
                  {!v.temperatureOk && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-semibold">{L('excursion T°', 'T° excursion')}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Events for this centre */}
      <div className="card">
        <SectionTitle icon={Radio}>{L('Historique des événements du centre', 'Centre event history')} ({centerEvents.length})</SectionTitle>
        {centerEvents.length === 0
          ? <p className="text-sm text-gray-400">{L('Aucun événement récent.', 'No recent event.')}</p>
          : <div className="divide-y divide-gray-50">{centerEvents.slice(0, 10).map(ev => <EventRow key={ev.id} ev={ev} lang={language} compact />)}</div>}
      </div>
    </div>
  );
}
