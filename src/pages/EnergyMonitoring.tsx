import { Link } from 'react-router-dom';
import { Sun, Battery, Zap, AlertTriangle, TrendingUp, Leaf, Fuel, Wrench } from 'lucide-react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell,
} from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';
import { useL, nf } from '../i18n/useL';
import { useLive } from '../context/LiveDataContext';
import { KpiCard, SectionTitle, Pill } from '../components/ui';
import { formatDate } from '../data/dates';

const fmtHour = (t: number) => new Date(t).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Ouagadougou' });

export default function EnergyMonitoring() {
  const { t, language } = useLanguage();
  const L = useL();
  const live = useLive();
  const centers = live.centers;

  const totalCapacity = centers.reduce((s, c) => s + c.base.solarSystem.capacity_kw, 0);
  const currentProduction = centers.reduce((s, c) => s + c.solar_kw, 0);
  const currentLoad = centers.reduce((s, c) => s + c.consumption_kw, 0);
  const todayKwh = centers.reduce((s, c) => s + c.todayProduction_kwh, 0);
  const weekKwh = centers.reduce((s, c) => s + c.base.solarSystem.dailyProduction_kwh.reduce((a, b) => a + b, 0), 0) * 1.32;
  const online = centers.filter(c => c.link !== 'offline');
  const avgBattery = online.reduce((s, c) => s + c.battery_pct, 0) / online.length;
  const degraded = centers.filter(c => c.base.solarSystem.status !== 'optimal');

  // Depuis la mise en service : kWh cumulés ≈ 190 j × ~300 kWh/j
  const lifetimeKwh = 56_400;
  const dieselAvoided = Math.round(lifetimeKwh / 3.2); // 3,2 kWh par litre (groupe électrogène)
  const co2Avoided = Math.round(dieselAvoided * 2.68 / 1000 * 10) / 10; // t CO₂e

  // Courbe 24 h flotte : somme des historiques par pas de temps
  const ref = live.history[centers[0].id];
  const fleet24 = ref.map((_, i) => ({
    time: fmtHour(ref[i].t),
    production: Math.round(centers.reduce((s, c) => s + (live.history[c.id][i]?.solar ?? 0), 0) * 100) / 100,
    consommation: Math.round(centers.reduce((s, c) => s + (live.history[c.id][i]?.consumption ?? 0), 0) * 100) / 100,
    batterie: Math.round(online.reduce((s, c) => s + (live.history[c.id][i]?.battery ?? 0), 0) / online.length),
  }));

  const weeklyByCenter = centers.map(c => ({
    name: c.shortName,
    production: Math.round(c.base.solarSystem.dailyProduction_kwh.reduce((a, b) => a + b, 0) * 1.32),
    theoretical: Math.round(c.base.solarSystem.capacity_kw * 5.2 * 7 * 0.85),
  }));

  const battery = [...centers].sort((a, b) => a.battery_pct - b.battery_pct);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('energy.title')}</h1>
        <p className="text-gray-500 mt-1">{L('Performance des 10 systèmes solaires (PV + stockage LiFePO₄) — télérelève en continu', 'Performance of the 10 solar systems (PV + LiFePO₄ storage) — continuous remote metering')}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label={t('energy.currentProduction')} value={`${currentProduction.toFixed(1)} kW`} icon={Sun} tone="yellow"
          sub={`${L('charge', 'load')} ${currentLoad.toFixed(1)} kW · ${totalCapacity} kWc ${L('installés', 'installed')}`} />
        <KpiCard label={L("Aujourd'hui / 7 jours", 'Today / 7 days')} value={`${nf(todayKwh, language)} / ${nf(weekKwh, language)} kWh`} icon={Zap} tone="green"
          trend={{ value: '+12 %' }} sub={t('dashboard.vsLastWeek')} />
        <KpiCard label={t('energy.avgBattery')} value={`${avgBattery.toFixed(0)} %`} icon={Battery} tone="blue"
          sub={`${online.filter(c => c.battery_pct < 30).length} ${L('centres < 30 %', 'centres < 30%')}`} />
        <KpiCard label={t('energy.degradedSystems')} value={degraded.length} icon={AlertTriangle} tone="orange" sub={t('energy.needMaintenance')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center"><Leaf size={22} className="text-green-700" /></div>
          <div><p className="text-2xl font-bold text-green-900 tabular-nums">{co2Avoided.toLocaleString(language === 'fr' ? 'fr-FR' : 'en-GB')} t CO₂e</p><p className="text-xs text-green-700">{L('évitées depuis la mise en service', 'avoided since commissioning')}</p></div>
        </div>
        <div className="card bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center"><Fuel size={22} className="text-amber-700" /></div>
          <div><p className="text-2xl font-bold text-amber-900 tabular-nums">{nf(dieselAvoided, language)} L</p><p className="text-xs text-amber-700">{L('de gasoil évités (≈ 12,3 M FCFA)', 'of diesel avoided (≈ 12.3 M FCFA)')}</p></div>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-sky-50 border-blue-100 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center"><TrendingUp size={22} className="text-blue-700" /></div>
          <div><p className="text-2xl font-bold text-blue-900 tabular-nums">{nf(lifetimeKwh, language)} kWh</p><p className="text-xs text-blue-700">{L('produits depuis la mise en service (~6 mois)', 'produced since commissioning (~6 months)')}</p></div>
        </div>
      </div>

      <div className="card">
        <SectionTitle icon={Sun}>{L('Flotte : production, charge et état de charge moyen — 24 dernières heures', 'Fleet: production, load and average state of charge — last 24 hours')}</SectionTitle>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={fleet24}>
            <defs>
              <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#FFC20E" stopOpacity={0.55} /><stop offset="100%" stopColor="#FFC20E" stopOpacity={0.05} /></linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 11 }} interval={5} axisLine={false} tickLine={false} />
            <YAxis yAxisId="kw" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <YAxis yAxisId="pct" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area yAxisId="kw" type="monotone" dataKey="production" stroke="#E0A800" strokeWidth={2} fill="url(#gp)" name={L('Production (kW)', 'Production (kW)')} />
            <Area yAxisId="kw" type="monotone" dataKey="consommation" stroke="#E2231A" strokeWidth={1.5} fill="#E2231A" fillOpacity={0.06} name={L('Consommation (kW)', 'Consumption (kW)')} />
            <Line yAxisId="pct" type="monotone" dataKey="batterie" stroke="#00833D" strokeWidth={2} dot={false} name={L('Batterie moy. (%)', 'Avg battery (%)')} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <SectionTitle>{L('Production hebdomadaire vs théorique par centre (kWh)', 'Weekly production vs theoretical by centre (kWh)')}</SectionTitle>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={weeklyByCenter} layout="vertical" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={96} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="theoretical" fill="#E5E7EB" radius={[0, 4, 4, 0]} name={L('Théorique', 'Theoretical')} barSize={8} />
              <Bar dataKey="production" radius={[0, 4, 4, 0]} name={L('Réelle', 'Actual')} barSize={8}>
                {weeklyByCenter.map((w, i) => <Cell key={i} fill={w.production / w.theoretical > 0.75 ? '#00833D' : w.production / w.theoretical > 0.45 ? '#FFC20E' : '#E2231A'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <SectionTitle>{t('energy.batteryLevels')} <span className="text-[11px] text-gray-400 font-normal ml-1">({L('temps réel', 'live')})</span></SectionTitle>
          <div className="space-y-2.5">
            {battery.map(c => (
              <Link key={c.id} to={`/centres/${c.id}`} className="flex items-center gap-3 group">
                <span className="text-xs text-gray-600 w-28 truncate group-hover:text-unicef-blue">{c.shortName}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden relative">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${c.battery_pct}%`, backgroundColor: c.battery_pct > 60 ? '#00833D' : c.battery_pct > 30 ? '#FFC20E' : '#E2231A' }} />
                  <div className="absolute inset-y-0 border-l border-dashed border-gray-400/60" style={{ left: '20%' }} title="Seuil critique 20 %" />
                </div>
                <span className="text-xs font-semibold text-gray-700 w-12 text-right tabular-nums">{c.battery_pct.toFixed(0)} %</span>
                <span className="text-[10px] text-gray-400 w-12 text-right">{c.autonomy_h.toFixed(0)} h</span>
              </Link>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-3">{L('Dernière colonne : autonomie estimée sans soleil. Ligne pointillée : seuil critique 20 % (arrêt automatique des charges non essentielles).', 'Last column: estimated autonomy without sun. Dashed line: 20% critical threshold (non-essential loads shed automatically).')}</p>
        </div>
      </div>

      <div className="card">
        <SectionTitle icon={Wrench}>{t('energy.efficiencyTable')}</SectionTitle>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                <th className="text-left py-2 px-3">{t('energy.center')}</th>
                <th className="text-right py-2 px-3">{t('energy.capacity')}</th>
                <th className="text-right py-2 px-3">{L('Stockage', 'Storage')}</th>
                <th className="text-right py-2 px-3">{t('centers.production')}</th>
                <th className="text-right py-2 px-3">{t('centers.efficiency')}</th>
                <th className="text-right py-2 px-3">{L("Auj.", 'Today')}</th>
                <th className="text-left py-2 px-3">{t('energy.status')}</th>
                <th className="text-left py-2 px-3">{t('energy.maintenance')}</th>
              </tr>
            </thead>
            <tbody>
              {centers.map(c => {
                const eff = c.solar_kw / c.base.solarSystem.capacity_kw;
                const daysSince = Math.round((Date.now() - new Date(c.base.solarSystem.lastMaintenance).getTime()) / 86_400_000);
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 px-3 font-medium text-gray-700"><Link to={`/centres/${c.id}`} className="hover:text-unicef-blue">{c.name}</Link></td>
                    <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">{c.base.solarSystem.capacity_kw} kWc</td>
                    <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">{c.base.solarSystem.batteryCapacity_kwh} kWh</td>
                    <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">{c.solar_kw.toFixed(2)} kW</td>
                    <td className={`py-2.5 px-3 text-right font-semibold tabular-nums ${eff > 0.5 ? 'text-green-600' : eff > 0.25 ? 'text-yellow-600' : 'text-red-600'}`}>{(eff * 100).toFixed(0)} %</td>
                    <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">{c.todayProduction_kwh.toFixed(1)} kWh</td>
                    <td className="py-2.5 px-3">
                      <Pill tone={c.base.solarSystem.status === 'optimal' ? 'green' : c.base.solarSystem.status === 'degraded' ? 'yellow' : 'red'}>
                        {c.base.solarSystem.status === 'optimal' ? t('status.optimal') : c.base.solarSystem.status === 'degraded' ? t('status.degraded') : t('status.failure')}
                      </Pill>
                    </td>
                    <td className="py-2.5 px-3 text-xs text-gray-500">
                      {formatDate(c.base.solarSystem.lastMaintenance, language)}
                      <span className={`ml-1.5 ${daysSince > 90 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>({daysSince} j)</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
