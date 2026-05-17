import { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Wifi,
  WifiOff,
  Sun,
  Battery,
  Droplets,
  Thermometer,
  Zap,
  Wind,
  RefreshCw,
  Circle,
  AlertTriangle,
  Server,
  Radio
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useLanguage } from '../i18n/LanguageContext';
import { healthCenters } from '../data/mockData';

interface SensorReading {
  center_id: string;
  sensor_type: string;
  value: number;
  unit: string;
  timestamp: string;
}

interface CenterRealtime {
  center_id: string;
  name: string;
  status: 'connected' | 'intermittent' | 'offline';
  lastPing: string;
  sensors: {
    solar_production: { value: number; unit: string };
    battery_level: { value: number; unit: string };
    water_level: { value: number; unit: string };
    temperature_cold_chain: { value: number; unit: string };
    ambient_temperature: { value: number; unit: string };
    energy_consumption: { value: number; unit: string };
  };
}

// Simulate real-time sensor data
function generateSensorData(hour: number): CenterRealtime[] {
  const solarCurve = (h: number) => h >= 6 && h <= 18 ? Math.sin((h - 6) * Math.PI / 12) : 0;

  return healthCenters.map((center) => {
    const solarFactor = solarCurve(hour) * (0.7 + Math.random() * 0.3);
    const production = center.solarSystem.capacity_kw * solarFactor;
    const batteryDelta = (production - center.solarSystem.capacity_kw * 0.3) * 0.5;
    const battery = Math.max(0, Math.min(100, center.solarSystem.batteryLevel + batteryDelta + (Math.random() - 0.5) * 3));

    const waterDrain = (hour >= 7 && hour <= 17) ? 0.3 : 0.1;
    const water = Math.max(0, center.waterSystem.reservoirLevel - waterDrain * Math.random() * 5);

    const coldChainBase = battery < 15 ? center.coldChain.temperature + Math.random() * 2 : center.coldChain.temperature + (Math.random() - 0.5) * 0.5;
    const ambientTemp = 30 + 10 * Math.sin((hour - 6) * Math.PI / 16) + (Math.random() - 0.5) * 3;

    const isOffline = center.status === 'offline';
    const isIntermittent = center.solarSystem.batteryLevel < 30;

    return {
      center_id: center.id,
      name: center.name,
      status: isOffline ? 'offline' : isIntermittent ? 'intermittent' : 'connected',
      lastPing: new Date().toISOString(),
      sensors: {
        solar_production: { value: Math.round(production * 100) / 100, unit: 'kW' },
        battery_level: { value: Math.round(battery * 10) / 10, unit: '%' },
        water_level: { value: Math.round(water * 10) / 10, unit: '%' },
        temperature_cold_chain: { value: Math.round(coldChainBase * 10) / 10, unit: '°C' },
        ambient_temperature: { value: Math.round(ambientTemp * 10) / 10, unit: '°C' },
        energy_consumption: { value: Math.round((center.solarSystem.capacity_kw * 0.3 * (hour >= 8 && hour <= 17 ? 1.5 : 1) * (0.8 + Math.random() * 0.4)) * 100) / 100, unit: 'kW' },
      },
    };
  });
}

interface TimeSeriesPoint {
  time: string;
  solar: number;
  battery: number;
  water: number;
  coldChain: number;
}

export default function RealtimeMonitoring() {
  const { language } = useLanguage();
  const [isLive, setIsLive] = useState(true);
  const [selectedCenter, setSelectedCenter] = useState<string>('all');
  const [centersData, setCentersData] = useState<CenterRealtime[]>([]);
  const [timeSeries, setTimeSeries] = useState<TimeSeriesPoint[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [alertLog, setAlertLog] = useState<{ time: string; message: string; severity: string }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateData = () => {
    const now = new Date();
    const hour = now.getHours() + now.getMinutes() / 60;
    const newData = generateSensorData(hour);
    setCentersData(newData);
    setLastUpdate(now);

    // Add to time series
    const avgSolar = newData.reduce((s, c) => s + c.sensors.solar_production.value, 0) / newData.length;
    const avgBattery = newData.reduce((s, c) => s + c.sensors.battery_level.value, 0) / newData.length;
    const avgWater = newData.reduce((s, c) => s + c.sensors.water_level.value, 0) / newData.length;
    const avgColdChain = newData.reduce((s, c) => s + c.sensors.temperature_cold_chain.value, 0) / newData.length;

    setTimeSeries(prev => {
      const newPoint: TimeSeriesPoint = {
        time: now.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        solar: Math.round(avgSolar * 100) / 100,
        battery: Math.round(avgBattery * 10) / 10,
        water: Math.round(avgWater * 10) / 10,
        coldChain: Math.round(avgColdChain * 10) / 10,
      };
      const updated = [...prev, newPoint].slice(-30); // Keep last 30 points
      return updated;
    });

    // Check for alerts
    newData.forEach(center => {
      if (center.sensors.battery_level.value < 15) {
        setAlertLog(prev => [{
          time: now.toLocaleTimeString(),
          message: `${center.name}: ${language === 'fr' ? 'Batterie critique' : 'Critical battery'} (${center.sensors.battery_level.value}%)`,
          severity: 'critical',
        }, ...prev].slice(0, 20));
      }
      if (center.sensors.temperature_cold_chain.value > 8) {
        setAlertLog(prev => [{
          time: now.toLocaleTimeString(),
          message: `${center.name}: ${language === 'fr' ? 'Chaîne froid hors norme' : 'Cold chain out of range'} (${center.sensors.temperature_cold_chain.value}°C)`,
          severity: 'high',
        }, ...prev].slice(0, 20));
      }
      if (center.sensors.water_level.value < 15) {
        setAlertLog(prev => [{
          time: now.toLocaleTimeString(),
          message: `${center.name}: ${language === 'fr' ? 'Niveau eau critique' : 'Critical water level'} (${center.sensors.water_level.value}%)`,
          severity: 'high',
        }, ...prev].slice(0, 20));
      }
    });
  };

  useEffect(() => {
    updateData();
    if (isLive) {
      intervalRef.current = setInterval(updateData, 3000); // Update every 3 seconds
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isLive]);

  const connectedCount = centersData.filter(c => c.status === 'connected').length;
  const intermittentCount = centersData.filter(c => c.status === 'intermittent').length;
  const offlineCount = centersData.filter(c => c.status === 'offline').length;

  const filteredCenters = selectedCenter === 'all'
    ? centersData
    : centersData.filter(c => c.center_id === selectedCenter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {language === 'fr' ? 'Monitoring temps réel' : 'Real-time Monitoring'}
          </h1>
          <p className="text-gray-500 mt-1">
            {language === 'fr' ? 'Données capteurs IoT en direct' : 'Live IoT sensor data'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isLive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {isLive ? <Radio size={16} className="animate-pulse" /> : <WifiOff size={16} />}
            {isLive ? 'LIVE' : 'PAUSED'}
          </button>
          <button onClick={updateData} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={16} />
            {language === 'fr' ? 'Rafraîchir' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Connection status bar */}
      <div className="card bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Server size={16} className="text-blue-400" />
              <span className="text-sm">API Server: <span className="text-green-400 font-mono">localhost:8000</span></span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-sm">
                <Circle size={8} className="text-green-400 fill-green-400" />
                {connectedCount} {language === 'fr' ? 'connectés' : 'connected'}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Circle size={8} className="text-yellow-400 fill-yellow-400" />
                {intermittentCount} {language === 'fr' ? 'intermittents' : 'intermittent'}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Circle size={8} className="text-red-400 fill-red-400" />
                {offlineCount} {language === 'fr' ? 'hors ligne' : 'offline'}
              </span>
            </div>
          </div>
          <div className="text-xs text-gray-400">
            {language === 'fr' ? 'Dernière MAJ' : 'Last update'}: {lastUpdate.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selectedCenter}
          onChange={(e) => setSelectedCenter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
        >
          <option value="all">{language === 'fr' ? 'Tous les centres' : 'All centers'}</option>
          {healthCenters.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Real-time charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Sun size={16} className="text-yellow-500" />
            {language === 'fr' ? 'Production solaire & Batterie (temps réel)' : 'Solar Production & Battery (real-time)'}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="solar" stroke="#FFC20E" fill="#FFC20E" fillOpacity={0.2} name={language === 'fr' ? 'Solaire (kW)' : 'Solar (kW)'} />
              <Area type="monotone" dataKey="battery" stroke="#00833D" fill="#00833D" fillOpacity={0.1} name={language === 'fr' ? 'Batterie (%)' : 'Battery (%)'} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Droplets size={16} className="text-blue-500" />
            {language === 'fr' ? 'Eau & Chaîne du froid (temps réel)' : 'Water & Cold Chain (real-time)'}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={timeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="water" stroke="#1CABE2" strokeWidth={2} dot={false} name={language === 'fr' ? 'Eau (%)' : 'Water (%)'} />
              <Line type="monotone" dataKey="coldChain" stroke="#E2231A" strokeWidth={2} dot={false} name={language === 'fr' ? 'Chaîne froid (°C)' : 'Cold Chain (°C)'} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Centers grid - real-time values */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Activity size={16} className="text-unicef-blue" />
          {language === 'fr' ? 'Données capteurs par centre' : 'Sensor Data by Center'}
          {isLive && <span className="ml-2 flex items-center gap-1 text-xs text-green-600"><Circle size={6} className="fill-green-500 animate-pulse" /> Live</span>}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">{language === 'fr' ? 'Centre' : 'Center'}</th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500">{language === 'fr' ? 'Statut' : 'Status'}</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">☀️ Solar</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">🔋 Battery</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">💧 Water</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">❄️ Cold Chain</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">🌡️ Ambient</th>
                <th className="text-center py-2 px-3 text-xs font-medium text-gray-500">⚡ Consumption</th>
              </tr>
            </thead>
            <tbody>
              {filteredCenters.map((center) => (
                <tr key={center.center_id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-gray-700 text-xs">{center.name.replace('CSPS de ', '').replace('CMA de ', '')}</p>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${
                      center.status === 'connected' ? 'text-green-600' :
                      center.status === 'intermittent' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {center.status === 'connected' ? <Wifi size={12} /> :
                       center.status === 'intermittent' ? <Wifi size={12} /> : <WifiOff size={12} />}
                      {center.status === 'connected' ? (language === 'fr' ? 'Connecté' : 'Connected') :
                       center.status === 'intermittent' ? (language === 'fr' ? 'Intermittent' : 'Intermittent') :
                       (language === 'fr' ? 'Hors ligne' : 'Offline')}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono text-xs">{center.sensors.solar_production.value} kW</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-mono text-xs font-medium ${
                      center.sensors.battery_level.value > 60 ? 'text-green-600' :
                      center.sensors.battery_level.value > 25 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {center.sensors.battery_level.value}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-mono text-xs font-medium ${
                      center.sensors.water_level.value > 50 ? 'text-blue-600' :
                      center.sensors.water_level.value > 20 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {center.sensors.water_level.value}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-mono text-xs font-medium ${
                      center.sensors.temperature_cold_chain.value >= 2 && center.sensors.temperature_cold_chain.value <= 8
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {center.sensors.temperature_cold_chain.value}°C
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`font-mono text-xs ${
                      center.sensors.ambient_temperature.value > 42 ? 'text-red-600 font-bold' : 'text-gray-600'
                    }`}>
                      {center.sensors.ambient_temperature.value}°C
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-mono text-xs text-gray-600">{center.sensors.energy_consumption.value} kW</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alert log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            {language === 'fr' ? 'Journal des alertes (temps réel)' : 'Alert Log (real-time)'}
          </h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {alertLog.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {language === 'fr' ? 'Aucune alerte pour le moment' : 'No alerts at this time'}
              </p>
            ) : (
              alertLog.map((alert, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
                  <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0 ${
                    alert.severity === 'critical' ? 'bg-red-500' : 'bg-orange-500'
                  }`} />
                  <div>
                    <span className="text-gray-400 font-mono">{alert.time}</span>
                    <span className="ml-2 text-gray-700">{alert.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* API Info */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Server size={16} className="text-unicef-blue" />
            {language === 'fr' ? 'Endpoints API capteurs' : 'Sensor API Endpoints'}
          </h3>
          <div className="space-y-2 font-mono text-xs">
            <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold">POST</span>
              <span className="text-gray-700">/api/v1/sensors/data</span>
              <span className="text-gray-400 ml-auto">{language === 'fr' ? 'Envoi unitaire' : 'Single reading'}</span>
            </div>
            <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold">POST</span>
              <span className="text-gray-700">/api/v1/sensors/batch</span>
              <span className="text-gray-400 ml-auto">{language === 'fr' ? 'Envoi groupé' : 'Batch upload'}</span>
            </div>
            <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">GET</span>
              <span className="text-gray-700">/api/v1/sensors/realtime</span>
              <span className="text-gray-400 ml-auto">{language === 'fr' ? 'Temps réel' : 'Real-time'}</span>
            </div>
            <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold">GET</span>
              <span className="text-gray-700">/api/v1/sensors/stats/:id</span>
              <span className="text-gray-400 ml-auto">{language === 'fr' ? 'Statistiques' : 'Statistics'}</span>
            </div>
            <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold">POST</span>
              <span className="text-gray-700">/api/v1/predictions/epidemic</span>
              <span className="text-gray-400 ml-auto">{language === 'fr' ? 'Prédiction IA' : 'AI Prediction'}</span>
            </div>
            <div className="p-2 bg-gray-50 rounded flex items-center gap-2">
              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-bold">POST</span>
              <span className="text-gray-700">/api/v1/translations/translate</span>
              <span className="text-gray-400 ml-auto">{language === 'fr' ? 'Traduction' : 'Translation'}</span>
            </div>
          </div>
          <div className="mt-3 p-2 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              📖 Swagger UI: <span className="font-mono">http://localhost:8000/docs</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
