import { Link } from 'react-router-dom';
import {
  Sun, Droplets, Thermometer, Users, AlertTriangle, Activity, Zap, Clock, ArrowRight, Radio, Syringe, ShieldCheck,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';
import { useL, nf } from '../i18n/useL';
import { useLive } from '../context/LiveDataContext';
import { climateAlertMessages } from '../i18n/dataTranslations';
import { KpiCard, SeverityBadge, StatusDot, EventRow, SectionTitle, Bar as ProgressBar } from '../components/ui';
import { d } from '../data/dates';

export default function Dashboard() {
  const { t, language } = useLanguage();
  const L = useL();
  const live = useLive();

  const centers = live.centers;
  const operational = centers.filter(c => c.status === 'operational').length;
  const partial = centers.filter(c => c.status === 'partial').length;
  const offline = centers.filter(c => c.status === 'offline').length;
  const online = centers.filter(c => c.link !== 'offline');

  const childrenCovered = centers.reduce((s, c) => s + c.base.childrenUnder5, 0);
  const totalSolar = centers.reduce((s, c) => s + c.solar_kw, 0);
  const todayKwh = centers.reduce((s, c) => s + c.todayProduction_kwh, 0);
  const avgWater = online.reduce((s, c) => s + c.water_pct, 0) / online.length;
  const coldOk = centers.filter(c => c.cold_c >= 2 && c.cold_c <= 8).length;
  const dosesTotal = centers.reduce((s, c) => s + c.base.coldChain.vaccineStock.reduce((a, v) => a + v.quantity, 0), 0);
  const dosesProtected = centers.filter(c => c.cold_c >= 2 && c.cold_c <= 8).reduce((s, c) => s + c.base.coldChain.vaccineStock.reduce((a, v) => a + v.quantity, 0), 0);

  const activeClimate = live.climateAlerts.filter(a => a.status === 'active');
  const criticalAlerts = [...live.climateAlerts.filter(a => a.severity === 'critical' && a.status === 'active'), ...live.healthAlerts.filter(a => a.severity === 'critical')];
  const activeAlertsCount = activeClimate.length + live.healthAlerts.length;
  const avgLeadTime = Math.round(activeClimate.reduce((s, a) => s + a.leadTimeHours, 0) / Math.max(1, activeClimate.length));
  const topAlert = live.climateAlerts.find(a => a.severity === 'critical' && a.status === 'active');

  // Énergie : 7 derniers jours (production réelle agrégée + aujourd'hui en cours)
  const dayNames = language === 'fr' ? ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const energyData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(); date.setDate(date.getDate() - (6 - i));
    const prod = i === 6 ? todayKwh : centers.reduce((s, c) => s + c.base.solarSystem.dailyProduction_kwh[i], 0) * 1.32;
    const cons = i === 6 ? prod * 0.62 : 118 + Math.round(Math.sin(i * 1.7) * 9) + (i % 2 ? 6 : 0);
    return { day: `${dayNames[date.getDay()]} ${date.getDate()}`, production: Math.round(prod), consommation: Math.round(cons) };
  });

  const statusData = [
    { name: t('status.operational'), value: operational, color: '#00833D' },
    { name: t('status.partial'), value: partial, color: '#FFC20E' },
    { name: t('status.offline'), value: offline, color: '#E2231A' },
  ];

  const alertsTrend = [
    { w: 'S-5', climat: 1, sante: 2 }, { w: 'S-4', climat: 2, sante: 3 }, { w: 'S-3', climat: 3, sante: 4 },
    { w: 'S-2', climat: 4, sante: 4 }, { w: 'S-1', climat: 3, sante: 5 }, { w: L('Cette sem.', 'This wk'), climat: activeClimate.length, sante: live.healthAlerts.length },
  ].map(x => ({ ...x, w: x.w.replace('S-', language === 'fr' ? 'S-' : 'W-') }));

  const attention = centers.filter(c => c.status !== 'operational');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-500 mt-1">{L('Situation opérationnelle des 10 formations sanitaires pilotes', 'Operational status of the 10 pilot health facilities')} · {L('mise à jour en continu', 'continuously updated')}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium">
            <Radio size={12} className="animate-pulse" /> {L('Flux capteurs actif', 'Sensor feed live')} · {online.length}/10
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
            {L('Période', 'Period')}: {d(-29).slice(5)} → {d(0).slice(5)}
          </span>
        </div>
      </div>

      {/* Bandeau alerte critique */}
      {topAlert && (
        <div className="rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <Thermometer size={22} className="text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity="critical" label={t('severity.critical')} />
              <p className="text-sm font-semibold text-gray-900">{climateAlertMessages[topAlert.id]?.[language] ?? topAlert.message}</p>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {topAlert.district}, {topAlert.region} · {L('début', 'starts')} {new Date(topAlert.startDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long' })} ·{' '}
              <strong>{nf(topAlert.childrenAffected, language)}</strong> {L('enfants exposés', 'children exposed')} · {L('anticipation', 'lead time')} <strong>{topAlert.leadTimeHours} h</strong> ·{' '}
              {L('confiance', 'confidence')} {Math.round(topAlert.confidence * 100)} % · {L('source', 'source')} {topAlert.source}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900 tabular-nums">{nf(topAlert.broadcastCount ?? 0, language)}</p>
              <p className="text-gray-500">{L('SMS diffusés', 'SMS sent')}</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${topAlert.acknowledged ? 'text-green-600' : 'text-orange-600'}`}>{topAlert.acknowledged ? '✓' : '…'}</p>
              <p className="text-gray-500">{topAlert.acknowledged ? L('Acquittée MCD', 'DMO ack.') : L('En attente', 'Pending')}</p>
            </div>
            <Link to="/alertes-climat" className="btn-primary text-xs flex items-center gap-1 whitespace-nowrap">
              {L('Gérer', 'Manage')} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {/* KPI row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label={t('dashboard.operationalCenters')} value={`${operational}/${centers.length}`} icon={Activity} tone="green"
          sub={`${partial} ${L('dégradés', 'degraded')} · ${offline} ${L('hors ligne', 'offline')}`} />
        <KpiCard label={t('dashboard.activeAlerts')} value={activeAlertsCount} icon={AlertTriangle} tone="red"
          sub={`${criticalAlerts.length} ${t('dashboard.critical')} · ${live.climateAlerts.filter(a => !a.acknowledged).length + live.healthAlerts.filter(a => !a.acknowledged).length} ${L('non acquittées', 'unacknowledged')}`} />
        <KpiCard label={t('dashboard.childrenCovered')} value={nf(childrenCovered, language)} icon={Users} tone="blue"
          sub={L('enfants <5 ans dans les aires sanitaires', 'children <5 in catchment areas')} />
        <KpiCard label={L("Délai d'anticipation", 'Lead time')} value={`${avgLeadTime} h`} icon={Clock} tone="purple"
          trend={{ value: L('objectif ≥ 48 h', 'target ≥ 48 h') }} sub={L('moyenne des alertes actives', 'active alerts average')} />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label={t('dashboard.coldChain')} value={`${coldOk}/${centers.length}`} icon={Syringe} tone="cyan"
          sub={`${nf(dosesProtected, language)}/${nf(dosesTotal, language)} ${L('doses protégées (2-8 °C)', 'doses protected (2-8 °C)')}`} />
        <KpiCard label={t('dashboard.waterAvailable')} value={`${Math.round(avgWater)} %`} icon={Droplets} tone="blue"
          sub={`${online.filter(c => c.water_pct < 30).length} ${L('réservoirs < 30 %', 'reservoirs < 30%')}`} />
        <KpiCard label={L("Solaire aujourd'hui", 'Solar today')} value={`${nf(todayKwh, language)} kWh`} icon={Sun} tone="yellow"
          sub={`${totalSolar.toFixed(1)} kW ${L('instantané', 'instantaneous')} · ${centers.reduce((s, c) => s + c.base.solarSystem.capacity_kw, 0)} kWc ${L('installés', 'installed')}`} />
        <KpiCard label={L('Continuité de service (30 j)', 'Service continuity (30 d)')} value="94,6 %" icon={ShieldCheck} tone="green"
          trend={{ value: '+26,4 pts' }} sub={L('vs 68,2 % avant solarisation', 'vs 68.2% before solarisation')} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <SectionTitle icon={Zap}>{L('Production vs consommation énergétique (kWh) — 7 derniers jours, 10 centres', 'Energy production vs consumption (kWh) — last 7 days, 10 centres')}</SectionTitle>
          <ResponsiveContainer width="100%" height={230}>
            <AreaChart data={energyData}>
              <defs>
                <linearGradient id="gProd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFC20E" stopOpacity={0.5} /><stop offset="100%" stopColor="#FFC20E" stopOpacity={0.05} /></linearGradient>
                <linearGradient id="gCons" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1CABE2" stopOpacity={0.4} /><stop offset="100%" stopColor="#1CABE2" stopOpacity={0.05} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="production" stroke="#E0A800" strokeWidth={2} fill="url(#gProd)" name={t('dashboard.production')} />
              <Area type="monotone" dataKey="consommation" stroke="#1CABE2" strokeWidth={2} fill="url(#gCons)" name={t('dashboard.consumption')} />
            </AreaChart>
          </ResponsiveContainer>
          <p className="text-[11px] text-gray-400 mt-1">{L("Aujourd'hui : cumul en cours de journée (relevés compteurs toutes les 10 min).", 'Today: intraday cumulative (meter readings every 10 min).')}</p>
        </div>

        <div className="card">
          <SectionTitle>{t('dashboard.centerStatus')}</SectionTitle>
          <ResponsiveContainer width="100%" height={170}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={52} outerRadius={76} dataKey="value" paddingAngle={2} stroke="none">
                {statusData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-1">
            {statusData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
            {[
              { label: L('Batterie moyenne (en ligne)', 'Avg battery (online)'), v: online.reduce((s, c) => s + c.battery_pct, 0) / online.length, tone: 'battery' as const },
              { label: L('Réservoirs (moyenne)', 'Reservoirs (avg)'), v: avgWater, tone: 'water' as const },
            ].map(r => (
              <div key={r.label}>
                <div className="flex justify-between text-[11px] text-gray-500 mb-1"><span>{r.label}</span><span className="font-medium text-gray-700 tabular-nums">{r.v.toFixed(0)} %</span></div>
                <ProgressBar value={r.v} tone={r.tone} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts + activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <SectionTitle>{t('dashboard.alertsTrend')}</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={alertsTrend} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="w" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="climat" fill="#F26A21" name={L('Climat', 'Climate')} radius={[4, 4, 0, 0]} />
              <Bar dataKey="sante" fill="#E2231A" name={L('Santé', 'Health')} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <SectionTitle right={<Link to="/alertes-climat" className="text-xs text-unicef-blue hover:underline">{L('Tout voir', 'View all')}</Link>}>{t('dashboard.activeAlertsList')}</SectionTitle>
          <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
            {activeClimate.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 leading-snug">{climateAlertMessages[alert.id]?.[language] || alert.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                    <span>{alert.district}</span>·<span>{nf(alert.childrenAffected, language)} {t('climate.children')}</span>·<span>{alert.leadTimeHours} h</span>
                  </div>
                </div>
              </div>
            ))}
            {live.healthAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-2.5 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${alert.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'}`} />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800">
                    {t(`health.${alert.type}` as 'health.malaria')} — {alert.childrenCases} {t('climate.children')}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500">
                    <span>{alert.district}</span>·<span className="text-red-600">↑ {alert.trend === 'increasing' ? t('health.increasing') : t('health.stable')}</span>·<span>{L('seuil', 'threshold')} {alert.epidemicThreshold}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <SectionTitle right={<Link to="/journal" className="text-xs text-unicef-blue hover:underline">{L('Journal', 'Log')}</Link>}>
            <span className="flex items-center gap-2">{L('Activité de la plateforme', 'Platform activity')}<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /></span>
          </SectionTitle>
          <div className="divide-y divide-gray-50 max-h-[240px] overflow-y-auto pr-1">
            {live.events.slice(0, 7).map(ev => <EventRow key={ev.id} ev={ev} lang={language} compact />)}
          </div>
        </div>
      </div>

      {/* Centres nécessitant une attention */}
      {attention.length > 0 && (
        <div className="card border-l-4 border-l-orange-400">
          <SectionTitle icon={AlertTriangle}>{t('dashboard.centersAttention')} ({attention.length})</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {attention.map(c => (
              <Link key={c.id} to={`/centres/${c.id}`} className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><StatusDot status={c.status} /><p className="text-sm font-medium text-gray-800">{c.name}</p></div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${c.status === 'offline' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {c.status === 'offline' ? t('status.offline') : t('status.partial')}
                  </span>
                </div>
                {c.base.note && <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">{c.base.note[language]}</p>}
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] text-gray-600">
                  <span className="flex items-center gap-1"><Sun size={11} className="text-yellow-500" /> {c.battery_pct.toFixed(0)} %</span>
                  <span className="flex items-center gap-1"><Droplets size={11} className="text-blue-500" /> {c.water_pct.toFixed(0)} %</span>
                  <span className={`flex items-center gap-1 ${c.coldStatus === 'critical' ? 'text-red-600 font-semibold' : ''}`}><Thermometer size={11} className="text-cyan-500" /> {c.cold_c.toFixed(1)} °C</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
