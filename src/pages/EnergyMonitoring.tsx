import { Sun, Battery, Zap, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  Legend
} from 'recharts';
import { healthCenters } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';

const hourlyProduction = Array.from({ length: 24 }, (_, i) => ({
  heure: `${i}h`,
  production: i >= 6 && i <= 18 ? Math.sin((i - 6) * Math.PI / 12) * 45 + Math.random() * 5 : 0,
  consommation: 8 + Math.random() * 4 + (i >= 8 && i <= 17 ? 10 : 0),
}));

const weeklyByCenter = healthCenters.map(c => ({
  name: c.name.replace('CSPS de ', '').replace('CMA de ', ''),
  production: c.solarSystem.dailyProduction_kwh.reduce((a, b) => a + b, 0),
  capacity: c.solarSystem.capacity_kw * 7 * 5, // theoretical max
  efficiency: ((c.solarSystem.currentProduction_kw / c.solarSystem.capacity_kw) * 100),
}));

const batteryData = healthCenters.map(c => ({
  name: c.name.replace('CSPS de ', '').replace('CMA de ', ''),
  level: c.solarSystem.batteryLevel,
  fill: c.solarSystem.batteryLevel > 60 ? '#00833D' :
        c.solarSystem.batteryLevel > 30 ? '#FFC20E' : '#E2231A'
}));

export default function EnergyMonitoring() {
  const { t, language } = useLanguage();
  const totalProduction = healthCenters.reduce(
    (sum, c) => sum + c.solarSystem.dailyProduction_kwh.reduce((a, b) => a + b, 0), 0
  );
  const avgBattery = Math.round(
    healthCenters.reduce((sum, c) => sum + c.solarSystem.batteryLevel, 0) / healthCenters.length
  );
  const totalCapacity = healthCenters.reduce((sum, c) => sum + c.solarSystem.capacity_kw, 0);
  const currentProduction = healthCenters.reduce((sum, c) => sum + c.solarSystem.currentProduction_kw, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('energy.title')}</h1>
        <p className="text-gray-500 mt-1">{t('energy.subtitle')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Sun size={16} className="text-yellow-500" />
            <span className="text-xs text-gray-500">Production actuelle</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{currentProduction.toFixed(1)} kW</p>
          <p className="text-xs text-gray-400">{t('energy.capacity')}: {totalCapacity} kW</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-green-500" />
            <span className="text-xs text-gray-500">Production 7 jours</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalProduction} kWh</p>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <TrendingUp size={12} /> +12% vs semaine précédente
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Battery size={16} className="text-blue-500" />
            <span className="text-xs text-gray-500">Batterie moyenne</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{avgBattery}%</p>
          <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
            <div
              className={`h-full rounded-full ${avgBattery > 60 ? 'bg-green-500' : avgBattery > 30 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${avgBattery}%` }}
            />
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            <span className="text-xs text-gray-500">Systèmes dégradés</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {healthCenters.filter(c => c.solarSystem.status !== 'optimal').length}
          </p>
          <p className="text-xs text-orange-500">{t('energy.needMaintenance')}</p>
        </div>
      </div>

      {/* Hourly production chart */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {t('energy.todayProduction')}
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={hourlyProduction}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="heure" tick={{ fontSize: 11 }} interval={2} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="production"
              stroke="#FFC20E"
              fill="#FFC20E"
              fillOpacity={0.3}
              name="Production (kW)"
            />
            <Area
              type="monotone"
              dataKey="consommation"
              stroke="#E2231A"
              fill="#E2231A"
              fillOpacity={0.1}
              name="Consommation (kW)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Per center charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly production by center */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t('energy.weeklyByCenter')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyByCenter} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="production" fill="#FFC20E" radius={[0, 4, 4, 0]} name="Production (kWh)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Battery levels */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t('energy.batteryLevels')}
          </h3>
          <div className="space-y-3">
            {batteryData.sort((a, b) => a.level - b.level).map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-28 truncate">{item.name}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${item.level}%`, backgroundColor: item.fill }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-10 text-right">{item.level}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Efficiency table */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">
          {t('energy.efficiencyTable')}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">{t('energy.center')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">{t('energy.capacity')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">{t('centers.production')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">{t('centers.efficiency')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">{t('energy.status')}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">{t('energy.maintenance')}</th>
              </tr>
            </thead>
            <tbody>
              {healthCenters.map((center) => (
                <tr key={center.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-700">{center.name}</td>
                  <td className="py-2.5 px-3 text-gray-600">{center.solarSystem.capacity_kw} kW</td>
                  <td className="py-2.5 px-3 text-gray-600">{center.solarSystem.currentProduction_kw} kW</td>
                  <td className="py-2.5 px-3">
                    <span className={`font-medium ${
                      (center.solarSystem.currentProduction_kw / center.solarSystem.capacity_kw) > 0.7 ? 'text-green-600' :
                      (center.solarSystem.currentProduction_kw / center.solarSystem.capacity_kw) > 0.4 ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {((center.solarSystem.currentProduction_kw / center.solarSystem.capacity_kw) * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      center.solarSystem.status === 'optimal' ? 'bg-green-100 text-green-700' :
                      center.solarSystem.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {center.solarSystem.status === 'optimal' ? t('status.optimal') :
                       center.solarSystem.status === 'degraded' ? t('status.degraded') : t('status.failure')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-500 text-xs">
                    {new Date(center.solarSystem.lastMaintenance).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
