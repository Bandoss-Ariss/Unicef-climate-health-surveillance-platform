import { useState } from 'react';
import { MapPin, Layers, AlertTriangle, Sun, Droplets, Thermometer } from 'lucide-react';
import { healthCenters, climateAlerts, healthAlerts } from '../data/mockData';
import { useLanguage } from '../i18n/LanguageContext';

type MapLayer = 'centers' | 'climate' | 'health' | 'energy';

export default function MapView() {
  const { t, language } = useLanguage();
  const [activeLayers, setActiveLayers] = useState<MapLayer[]>(['centers', 'climate']);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);

  const toggleLayer = (layer: MapLayer) => {
    setActiveLayers(prev =>
      prev.includes(layer) ? prev.filter(l => l !== layer) : [...prev, layer]
    );
  };

  const center = selectedCenter ? healthCenters.find(c => c.id === selectedCenter) : null;

  const getPosition = (lat: number, lng: number) => {
    const x = ((lng + 5.5) / 8) * 100;
    const y = ((15.5 - lat) / 6) * 100;
    return { left: `${Math.max(5, Math.min(95, x))}%`, top: `${Math.max(5, Math.min(95, y))}%` };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('map.title')}</h1>
          <p className="text-gray-500 mt-1">{t('map.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Map area */}
        <div className="lg:col-span-3">
          {/* Layer controls */}
          <div className="card mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-500">{t('map.layers')}</span>
              </div>
              <button
                onClick={() => toggleLayer('centers')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeLayers.includes('centers') ? 'bg-unicef-blue text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <MapPin size={12} />
                {t('map.healthCenters')}
              </button>
              <button
                onClick={() => toggleLayer('climate')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeLayers.includes('climate') ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <AlertTriangle size={12} />
                {t('map.climateAlerts')}
              </button>
              <button
                onClick={() => toggleLayer('health')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeLayers.includes('health') ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <AlertTriangle size={12} />
                {t('map.healthAlerts')}
              </button>
              <button
                onClick={() => toggleLayer('energy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeLayers.includes('energy') ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Sun size={12} />
                {t('map.energy')}
              </button>
            </div>
          </div>

          {/* Map visualization */}
          <div className="card p-0 overflow-hidden">
            <div className="relative w-full h-[500px] bg-gradient-to-b from-yellow-50 to-green-50">
              {/* Background map outline */}
              <div className="absolute inset-0 flex items-center justify-center opacity-10">
                <svg viewBox="0 0 400 300" className="w-full h-full">
                  <path
                    d="M50,80 L80,50 L150,40 L200,30 L280,40 L350,60 L370,100 L360,150 L340,180 L300,200 L260,220 L220,240 L180,250 L140,240 L100,220 L60,180 L40,140 L45,100 Z"
                    fill="none"
                    stroke="#374EA2"
                    strokeWidth="2"
                  />
                </svg>
              </div>

              {/* Region labels */}
              <div className="absolute top-[15%] left-[30%] text-xs text-gray-400 font-medium">Sahel</div>
              <div className="absolute top-[45%] left-[15%] text-xs text-gray-400 font-medium">Boucle du Mouhoun</div>
              <div className="absolute top-[55%] left-[50%] text-xs text-gray-400 font-medium">Centre-Ouest</div>

              {/* Health centers markers */}
              {activeLayers.includes('centers') && healthCenters.map((hc) => {
                const pos = getPosition(hc.latitude, hc.longitude);
                return (
                  <button
                    key={hc.id}
                    onClick={() => setSelectedCenter(hc.id === selectedCenter ? null : hc.id)}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all z-10 ${
                      selectedCenter === hc.id ? 'scale-150 z-20' : 'hover:scale-125'
                    }`}
                    style={{ left: pos.left, top: pos.top }}
                    title={hc.name}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 border-white shadow-md ${
                      hc.status === 'operational' ? 'bg-green-500' :
                      hc.status === 'partial' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    {selectedCenter === hc.id && (
                      <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-lg p-2 w-44 z-30">
                        <p className="text-xs font-semibold text-gray-800 truncate">{hc.name}</p>
                        <p className="text-xs text-gray-500">{hc.district}</p>
                        <div className="mt-1 space-y-0.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">🔋 {t('centers.battery')}</span>
                            <span className="font-medium">{hc.solarSystem.batteryLevel}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">💧 {t('centers.water')}</span>
                            <span className="font-medium">{hc.waterSystem.reservoirLevel}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">🌡️ {t('centers.coldChain')}</span>
                            <span className="font-medium">{hc.coldChain.temperature}°C</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* Climate alert zones */}
              {activeLayers.includes('climate') && climateAlerts.filter(a => a.status === 'active').map((alert) => {
                const regionCenter = healthCenters.find(c => c.region === alert.region);
                if (!regionCenter) return null;
                const pos = getPosition(regionCenter.latitude, regionCenter.longitude);
                return (
                  <div
                    key={alert.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: pos.left, top: pos.top }}
                  >
                    <div className={`w-20 h-20 rounded-full opacity-20 animate-pulse ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <AlertTriangle size={16} className={
                        alert.severity === 'critical' ? 'text-red-600' :
                        alert.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'
                      } />
                    </div>
                  </div>
                );
              })}

              {/* Energy overlay */}
              {activeLayers.includes('energy') && healthCenters.map((hc) => {
                const pos = getPosition(hc.latitude, hc.longitude);
                return (
                  <div
                    key={`energy-${hc.id}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    style={{ left: pos.left, top: pos.top }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      hc.solarSystem.batteryLevel > 60 ? 'bg-green-100 text-green-700' :
                      hc.solarSystem.batteryLevel > 30 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`} style={{ marginTop: '-20px' }}>
                      {hc.solarSystem.batteryLevel}
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-sm">
                <p className="text-xs font-semibold text-gray-700 mb-2">{t('map.legend')}</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs text-gray-600">{t('status.operational')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <span className="text-xs text-gray-600">{t('status.partial')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-xs text-gray-600">{t('status.offline')}</span>
                  </div>
                  {activeLayers.includes('climate') && (
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <AlertTriangle size={12} className="text-orange-500" />
                      <span className="text-xs text-gray-600">{t('map.alertZone')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Selected center detail */}
          {center && (
            <div className="card border-2 border-unicef-blue/20">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">{center.name}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t('energy.status')}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    center.status === 'operational' ? 'bg-green-100 text-green-700' :
                    center.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {center.status === 'operational' ? t('status.operational') :
                     center.status === 'partial' ? t('status.partial') : t('status.offline')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t('common.district')}</span>
                  <span className="text-xs font-medium">{center.district}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t('common.type')}</span>
                  <span className="text-xs font-medium">{center.type}</span>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun size={14} className="text-yellow-500" />
                    <span className="text-xs text-gray-600">{t('nav.energy')}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-full rounded-full ${
                        center.solarSystem.batteryLevel > 60 ? 'bg-green-500' :
                        center.solarSystem.batteryLevel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${center.solarSystem.batteryLevel}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('centers.battery')}: {center.solarSystem.batteryLevel}% | {center.solarSystem.currentProduction_kw}/{center.solarSystem.capacity_kw} kW
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets size={14} className="text-blue-500" />
                    <span className="text-xs text-gray-600">{t('centers.water')}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full">
                    <div
                      className={`h-full rounded-full ${
                        center.waterSystem.reservoirLevel > 50 ? 'bg-blue-500' :
                        center.waterSystem.reservoirLevel > 25 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${center.waterSystem.reservoirLevel}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('centers.reservoir')}: {center.waterSystem.reservoirLevel}%
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer size={14} className="text-cyan-500" />
                    <span className="text-xs text-gray-600">{t('centers.coldChain')}</span>
                  </div>
                  <p className={`text-sm font-bold ${
                    center.coldChain.status === 'optimal' ? 'text-green-600' :
                    center.coldChain.status === 'warning' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {center.coldChain.temperature}°C
                  </p>
                  <p className="text-xs text-gray-400">{center.coldChain.vaccineStock.length} {language === 'fr' ? 'vaccins en stock' : 'vaccines in stock'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Active alerts summary */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('map.activeAlerts')}</h3>
            <div className="space-y-2">
              {climateAlerts.filter(a => a.status === 'active').map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    alert.severity === 'critical' ? 'bg-red-500' :
                    alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      {alert.type === 'heat_wave' ? '🌡️' :
                       alert.type === 'flood' ? '🌊' :
                       alert.type === 'dust_storm' ? '💨' : '☁️'}{' '}
                      {alert.type === 'heat_wave' ? (language === 'fr' ? 'Canicule' : 'Heat Wave') :
                       alert.type === 'flood' ? (language === 'fr' ? 'Inondation' : 'Flood') :
                       alert.type === 'dust_storm' ? (language === 'fr' ? 'Tempête' : 'Storm') : alert.type}
                    </p>
                    <p className="text-xs text-gray-500">{alert.district} - {alert.childrenAffected.toLocaleString()} {language === 'fr' ? 'enfants' : 'children'}</p>
                  </div>
                </div>
              ))}
              {healthAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    alert.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                  }`} />
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      🏥 {alert.type === 'malaria' ? (language === 'fr' ? 'Paludisme' : 'Malaria') :
                           alert.type === 'malnutrition' ? (language === 'fr' ? 'Malnutrition' : 'Malnutrition') :
                           alert.type === 'dehydration' ? (language === 'fr' ? 'Déshydratation' : 'Dehydration') : alert.type}
                    </p>
                    <p className="text-xs text-gray-500">{alert.district} - {alert.childrenCases} {t('map.childrenCases')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('map.summary')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{t('map.centersDisplayed')}</span>
                <span className="text-sm font-bold">{healthCenters.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{t('map.activeClimateAlerts')}</span>
                <span className="text-sm font-bold text-orange-600">
                  {climateAlerts.filter(a => a.status === 'active').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{t('map.criticalHealthAlerts')}</span>
                <span className="text-sm font-bold text-red-600">
                  {healthAlerts.filter(a => a.severity === 'critical').length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{t('map.regionsCovered')}</span>
                <span className="text-sm font-bold">
                  {new Set(healthCenters.map(c => c.region)).size}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
