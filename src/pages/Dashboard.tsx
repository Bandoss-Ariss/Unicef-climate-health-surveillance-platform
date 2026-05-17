import {
  Sun,
  Droplets,
  Thermometer,
  Users,
  AlertTriangle,
  Activity,
  Zap,
  Shield
} from 'lucide-react';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { dashboardStats, climateAlerts, healthAlerts, healthCenters } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';
import { climateAlertMessages } from '../i18n/dataTranslations';

const energyData = [
  { jour: 'Lun', day: 'Mon', production: 145, consommation: 98 },
  { jour: 'Mar', day: 'Tue', production: 162, consommation: 105 },
  { jour: 'Mer', day: 'Wed', production: 155, consommation: 110 },
  { jour: 'Jeu', day: 'Thu', production: 170, consommation: 102 },
  { jour: 'Ven', day: 'Fri', production: 148, consommation: 95 },
  { jour: 'Sam', day: 'Sat', production: 158, consommation: 88 },
  { jour: 'Dim', day: 'Sun', production: 165, consommation: 92 },
];

const alertsTrend = [
  { semaine: 'S18', week: 'W18', climat: 2, sante: 3 },
  { semaine: 'S19', week: 'W19', climat: 3, sante: 4 },
  { semaine: 'S20', week: 'W20', climat: 4, sante: 4 },
  { semaine: 'S21', week: 'W21', climat: 3, sante: 5 },
];

export default function Dashboard() {
  const { t, language } = useLanguage();

  const statusData = [
    { name: language === 'fr' ? 'Opérationnel' : 'Operational', value: 7, color: '#00833D' },
    { name: language === 'fr' ? 'Partiel' : 'Partial', value: 2, color: '#FFC20E' },
    { name: language === 'fr' ? 'Hors ligne' : 'Offline', value: 1, color: '#E2231A' },
  ];

  const activeClimateAlerts = climateAlerts.filter(a => a.status === 'active');
  const criticalCenters = healthCenters.filter(c => c.status !== 'operational');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.title')}</h1>
        <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('dashboard.operationalCenters')}</span>
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Activity size={16} className="text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {dashboardStats.operationalCenters}/{dashboardStats.totalCenters}
          </p>
          <p className="text-xs text-green-600">70% {t('dashboard.operational')}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('dashboard.activeAlerts')}</span>
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeAlerts}</p>
          <p className="text-xs text-red-600">2 {t('dashboard.critical')}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('dashboard.childrenCovered')}</span>
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users size={16} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {(dashboardStats.childrenCovered / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-blue-600">{t('dashboard.childrenUnder5')}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('dashboard.energyProduced')}</span>
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {dashboardStats.energySaved_kwh} kWh
          </p>
          <p className="text-xs text-yellow-600">+12% {t('dashboard.vsLastWeek')}</p>
        </div>
      </div>

      {/* Second row stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('dashboard.coldChain')}</span>
            <Thermometer size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{dashboardStats.vaccinesCovered}%</p>
          <p className="text-xs text-green-600">{t('dashboard.vaccinesProtected')}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('dashboard.waterAvailable')}</span>
            <Droplets size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{dashboardStats.waterAvailability}%</p>
          <p className="text-xs text-yellow-600">{t('dashboard.avgReservoir')}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('dashboard.solarization')}</span>
            <Sun size={16} className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">100%</p>
          <p className="text-xs text-green-600">10/10 {t('dashboard.centersEquipped')}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('dashboard.vaccineCoverage')}</span>
            <Shield size={16} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">87%</p>
          <p className="text-xs text-green-600">{t('dashboard.target')}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Energy chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t('dashboard.energyChart')}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={energyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={language === 'fr' ? 'jour' : 'day'} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="production"
                stackId="1"
                stroke="#FFC20E"
                fill="#FFC20E"
                fillOpacity={0.3}
                name={t('dashboard.production')}
              />
              <Area
                type="monotone"
                dataKey="consommation"
                stackId="2"
                stroke="#1CABE2"
                fill="#1CABE2"
                fillOpacity={0.3}
                name={t('dashboard.consumption')}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t('dashboard.centerStatus')}
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-600">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts trend + Active alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts trend */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t('dashboard.alertsTrend')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={alertsTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey={language === 'fr' ? 'semaine' : 'week'} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="climat" fill="#F26A21" name={language === 'fr' ? 'Climat' : 'Climate'} radius={[4, 4, 0, 0]} />
              <Bar dataKey="sante" fill="#E2231A" name={language === 'fr' ? 'Santé' : 'Health'} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Active alerts list */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t('dashboard.activeAlertsList')}
          </h3>
          <div className="space-y-3 max-h-[220px] overflow-y-auto">
            {activeClimateAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-500' :
                  alert.severity === 'high' ? 'bg-orange-500' :
                  'bg-yellow-500'
                }`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {climateAlertMessages[alert.id]?.[language] || alert.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`${
                      alert.severity === 'critical' ? 'alert-critical' :
                      alert.severity === 'high' ? 'alert-warning' :
                      'alert-info'
                    }`}>
                      {alert.severity === 'critical' ? t('severity.critical') :
                       alert.severity === 'high' ? t('severity.high') : t('severity.medium')}
                    </span>
                    <span className="text-xs text-gray-500">{alert.district}</span>
                  </div>
                </div>
              </div>
            ))}
            {healthAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  alert.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                }`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {alert.type === 'malaria' ? (language === 'fr' ? 'Paludisme' : 'Malaria') :
                     alert.type === 'malnutrition' ? (language === 'fr' ? 'Malnutrition' : 'Malnutrition') :
                     alert.type === 'dehydration' ? (language === 'fr' ? 'Déshydratation' : 'Dehydration') : alert.type}
                    {' '}- {alert.childrenCases} {language === 'fr' ? 'enfants' : 'children'}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`${
                      alert.severity === 'critical' ? 'alert-critical' : 'alert-warning'
                    }`}>
                      {alert.severity === 'critical' ? t('severity.critical') : t('severity.high')}
                    </span>
                    <span className="text-xs text-gray-500">{alert.district}</span>
                    <span className="text-xs text-gray-400">↑ {alert.trend === 'increasing' ? (language === 'fr' ? 'En hausse' : 'Rising') : (language === 'fr' ? 'Stable' : 'Stable')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Critical centers */}
      {criticalCenters.length > 0 && (
        <div className="card border-l-4 border-l-orange-400">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            ⚠️ {t('dashboard.centersAttention')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {criticalCenters.map((center) => (
              <div key={center.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-800">{center.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    center.status === 'offline' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {center.status === 'offline' ? t('status.offline') : t('status.partial')}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Sun size={12} />
                    <span>{t('centers.battery')}: {center.solarSystem.batteryLevel}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Droplets size={12} />
                    <span>{t('centers.water')}: {center.waterSystem.reservoirLevel}%</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Thermometer size={12} />
                    <span>{t('centers.coldChain')}: {center.coldChain.temperature}°C</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
