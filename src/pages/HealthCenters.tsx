import { Link } from 'react-router-dom';
import { Sun, Droplets, Thermometer, MapPin, Activity } from 'lucide-react';
import { healthCenters } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';

export default function HealthCenters() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('centers.title')}</h1>
          <p className="text-gray-500 mt-1">{t('centers.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <option value="">Tous les districts</option>
            <option value="Koudougou">Koudougou</option>
            <option value="Réo">Réo</option>
            <option value="Sapouy">Sapouy</option>
            <option value="Dédougou">Dédougou</option>
            <option value="Boromo">Boromo</option>
            <option value="Nouna">Nouna</option>
            <option value="Djibo">Djibo</option>
            <option value="Dori">Dori</option>
            <option value="Gorom-Gorom">Gorom-Gorom</option>
            <option value="Sebba">Sebba</option>
          </select>
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <option value="">Tous les statuts</option>
            <option value="operational">Opérationnel</option>
            <option value="partial">Partiel</option>
            <option value="offline">Hors ligne</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-green-50 border-green-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-green-800">Opérationnels</span>
          </div>
          <p className="text-2xl font-bold text-green-900 mt-1">
            {healthCenters.filter(c => c.status === 'operational').length}
          </p>
        </div>
        <div className="card bg-yellow-50 border-yellow-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-sm font-medium text-yellow-800">Partiels</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900 mt-1">
            {healthCenters.filter(c => c.status === 'partial').length}
          </p>
        </div>
        <div className="card bg-red-50 border-red-100">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-sm font-medium text-red-800">Hors ligne</span>
          </div>
          <p className="text-2xl font-bold text-red-900 mt-1">
            {healthCenters.filter(c => c.status === 'offline').length}
          </p>
        </div>
      </div>

      {/* Centers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {healthCenters.map((center) => (
          <Link
            key={center.id}
            to={`/centres/${center.id}`}
            className="card hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-800">{center.name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-500">{center.district}, {center.region}</span>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                center.status === 'operational' ? 'bg-green-100 text-green-700' :
                center.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {center.status === 'operational' ? 'OK' :
                 center.status === 'partial' ? 'Partiel' : 'Hors ligne'}
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Solar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun size={14} className="text-yellow-500" />
                  <span className="text-xs text-gray-600">Solaire</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        center.solarSystem.batteryLevel > 60 ? 'bg-green-500' :
                        center.solarSystem.batteryLevel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${center.solarSystem.batteryLevel}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{center.solarSystem.batteryLevel}%</span>
                </div>
              </div>

              {/* Water */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets size={14} className="text-blue-500" />
                  <span className="text-xs text-gray-600">Eau</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        center.waterSystem.reservoirLevel > 50 ? 'bg-blue-500' :
                        center.waterSystem.reservoirLevel > 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${center.waterSystem.reservoirLevel}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{center.waterSystem.reservoirLevel}%</span>
                </div>
              </div>

              {/* Cold chain */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Thermometer size={14} className="text-cyan-500" />
                  <span className="text-xs text-gray-600">Chaîne froid</span>
                </div>
                <span className={`text-xs font-medium ${
                  center.coldChain.status === 'optimal' ? 'text-green-600' :
                  center.coldChain.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {center.coldChain.temperature}°C
                </span>
              </div>

              {/* Activity */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500">Type: {center.type}</span>
                </div>
                <span className="text-xs text-gray-400">
                  {center.solarSystem.currentProduction_kw}/{center.solarSystem.capacity_kw} kW
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
