import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Sun, Droplets, Thermometer, Battery, Wrench, MapPin } from 'lucide-react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { healthCenters } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';

export default function HealthCenterDetail() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const center = healthCenters.find(c => c.id === id);

  if (!center) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t('centers.notFound')}</p>
        <Link to="/centres" className="btn-primary mt-4 inline-block">{t('centers.back')}</Link>
      </div>
    );
  }

  const productionData = center.solarSystem.dailyProduction_kwh.map((val, i) => ({
    jour: language === 'fr'
      ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'][i]
      : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    production: val
  }));

  const statusLabel = center.status === 'operational' ? t('status.operational') :
    center.status === 'partial' ? t('status.partial') : t('status.offline');

  const solarStatusLabel = center.solarSystem.status === 'optimal' ? t('status.optimal') :
    center.solarSystem.status === 'degraded' ? t('status.degraded') : t('status.failure');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/centres" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{center.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <MapPin size={14} className="text-gray-400" />
            <span className="text-sm text-gray-500">{center.district}, {center.region}</span>
            <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
              center.status === 'operational' ? 'bg-green-100 text-green-700' :
              center.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {statusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Battery size={16} className="text-yellow-500" />
            <span className="text-xs text-gray-500">{t('centers.battery')}</span>
          </div>
          <p className="text-xl font-bold">{center.solarSystem.batteryLevel}%</p>
          <div className="w-full h-2 bg-gray-100 rounded-full mt-1">
            <div
              className={`h-full rounded-full ${
                center.solarSystem.batteryLevel > 60 ? 'bg-green-500' :
                center.solarSystem.batteryLevel > 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${center.solarSystem.batteryLevel}%` }}
            />
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Sun size={16} className="text-yellow-500" />
            <span className="text-xs text-gray-500">{t('centers.production')}</span>
          </div>
          <p className="text-xl font-bold">{center.solarSystem.currentProduction_kw} kW</p>
          <p className="text-xs text-gray-400">{t('energy.capacity')}: {center.solarSystem.capacity_kw} kW</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Droplets size={16} className="text-blue-500" />
            <span className="text-xs text-gray-500">{t('centers.reservoir')}</span>
          </div>
          <p className="text-xl font-bold">{center.waterSystem.reservoirLevel}%</p>
          <p className="text-xs text-gray-400">{center.waterSystem.dailyConsumption_liters} L/{language === 'fr' ? 'jour' : 'day'}</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Thermometer size={16} className="text-cyan-500" />
            <span className="text-xs text-gray-500">{t('centers.coldChain')}</span>
          </div>
          <p className={`text-xl font-bold ${
            center.coldChain.status === 'optimal' ? 'text-green-600' :
            center.coldChain.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {center.coldChain.temperature}°C
          </p>
          <p className="text-xs text-gray-400">{language === 'fr' ? 'Plage' : 'Range'}: 2-8°C</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t('centers.solarProduction7d')}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={productionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="jour" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="production" fill="#FFC20E" radius={[4, 4, 0, 0]} name={language === 'fr' ? 'Production (kWh)' : 'Production (kWh)'} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t('centers.solarInfo')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{t('centers.panelCount')}</span>
              <span className="text-sm font-medium">{center.solarSystem.panelCount}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{t('centers.installedCapacity')}</span>
              <span className="text-sm font-medium">{center.solarSystem.capacity_kw} kW</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{t('centers.currentProduction')}</span>
              <span className="text-sm font-medium">{center.solarSystem.currentProduction_kw} kW</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{t('centers.efficiency')}</span>
              <span className="text-sm font-medium">
                {((center.solarSystem.currentProduction_kw / center.solarSystem.capacity_kw) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{t('energy.status')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                center.solarSystem.status === 'optimal' ? 'bg-green-100 text-green-700' :
                center.solarSystem.status === 'degraded' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {solarStatusLabel}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{t('centers.lastMaintenance')}</span>
              <span className="text-sm font-medium flex items-center gap-1">
                <Wrench size={12} />
                {new Date(center.solarSystem.lastMaintenance).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Water & Cold chain */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t('centers.waterSystem')}
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{t('centers.availability')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                center.waterSystem.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {center.waterSystem.available ? t('centers.available') : t('centers.unavailable')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{t('centers.reservoirLevel')}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-100 rounded-full">
                  <div
                    className={`h-full rounded-full ${
                      center.waterSystem.reservoirLevel > 50 ? 'bg-blue-500' :
                      center.waterSystem.reservoirLevel > 25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${center.waterSystem.reservoirLevel}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{center.waterSystem.reservoirLevel}%</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{t('centers.dailyConsumption')}</span>
              <span className="text-sm font-medium">{center.waterSystem.dailyConsumption_liters} L</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-50">
              <span className="text-sm text-gray-600">{t('centers.quality')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                center.waterSystem.quality === 'good' ? 'bg-green-100 text-green-700' :
                center.waterSystem.quality === 'acceptable' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {center.waterSystem.quality === 'good' ? t('centers.qualityGood') :
                 center.waterSystem.quality === 'acceptable' ? t('centers.qualityAcceptable') : t('centers.qualityPoor')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">{t('centers.pump')}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                center.waterSystem.pumpStatus === 'running' ? 'bg-green-100 text-green-700' :
                center.waterSystem.pumpStatus === 'stopped' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {center.waterSystem.pumpStatus === 'running' ? t('centers.pumpRunning') :
                 center.waterSystem.pumpStatus === 'stopped' ? t('centers.pumpStopped') : t('centers.pumpMaintenance')}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {t('centers.coldChainVaccines')}
          </h3>
          <div className="mb-4 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('centers.currentTemp')}</span>
              <span className={`text-lg font-bold ${
                center.coldChain.status === 'optimal' ? 'text-green-600' :
                center.coldChain.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {center.coldChain.temperature}°C
              </span>
            </div>
            <div className="mt-2 w-full h-2 bg-gray-200 rounded-full relative">
              <div className="absolute left-[25%] right-[25%] h-full bg-green-200 rounded-full" />
              <div
                className={`absolute w-3 h-3 rounded-full -top-0.5 ${
                  center.coldChain.status === 'optimal' ? 'bg-green-500' :
                  center.coldChain.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ left: `${Math.min(Math.max((center.coldChain.temperature / 15) * 100, 0), 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">0°C</span>
              <span className="text-xs text-green-500">{t('centers.optimalRange')}</span>
              <span className="text-xs text-gray-400">15°C</span>
            </div>
          </div>

          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('centers.vaccineStock')}</h4>
          <div className="space-y-2">
            {center.coldChain.vaccineStock.map((vaccine, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-sm font-medium text-gray-700">{vaccine.name}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    Exp: {new Date(vaccine.expiryDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{vaccine.quantity} {t('centers.doses')}</span>
                  {!vaccine.temperatureOk && (
                    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">⚠️ T°</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
