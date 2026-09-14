import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Circle, Popup, Tooltip as LTooltip, useMap } from 'react-leaflet';
import { MapPin, Layers, AlertTriangle, Sun, Droplets, Thermometer, HeartPulse, Users, Crosshair } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useL, nf } from '../i18n/useL';
import { useLive } from '../context/LiveDataContext';
import { climateAlertMessages } from '../i18n/dataTranslations';
import { Bar, LinkBadge, SeverityBadge, StatusDot } from '../components/ui';

type MapLayer = 'centers' | 'climate' | 'health' | 'energy';

const STATUS_COLOR = { operational: '#00833D', partial: '#F5B400', offline: '#E2231A' } as const;
const SEV_COLOR: Record<string, string> = { critical: '#E2231A', high: '#F26A21', medium: '#FFC20E', low: '#1CABE2' };
const BF_CENTER: [number, number] = [12.65, -1.55];

/** Recentre la carte sur le centre sélectionné. */
function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo(target, Math.max(map.getZoom(), 9), { duration: 0.8 }); else map.flyTo(BF_CENTER, 7, { duration: 0.8 }); }, [target, map]);
  return null;
}

export default function MapView() {
  const { t, language } = useLanguage();
  const L = useL();
  const live = useLive();
  const [layers, setLayers] = useState<MapLayer[]>(['centers', 'climate', 'health']);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);

  const toggle = (l: MapLayer) => setLayers(p => p.includes(l) ? p.filter(x => x !== l) : [...p, l]);
  const selected = selectedId ? live.centers.find(c => c.id === selectedId) : null;
  const activeClimate = live.climateAlerts.filter(a => a.status === 'active' || a.status === 'monitoring');
  const linkLabels = { connected: L('Connecté', 'Connected'), intermittent: L('Intermittent', 'Intermittent'), offline: L('Hors ligne', 'Offline') };

  const districtCoords = (district: string) => {
    const c = live.centers.find(x => x.district === district);
    return c ? ([c.base.latitude, c.base.longitude] as [number, number]) : null;
  };

  const layerBtn = (l: MapLayer, label: string, Icon: typeof MapPin, active: string) => (
    <button
      onClick={() => toggle(l)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${layers.includes(l) ? `${active} text-white shadow-sm` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
    >
      <Icon size={12} /> {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('map.title')}</h1>
          <p className="text-gray-500 mt-1">{t('map.subtitle')} · {L('Burkina Faso — régions Sahel, Boucle du Mouhoun, Centre-Ouest', 'Burkina Faso — Sahel, Boucle du Mouhoun, Centre-Ouest regions')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><Layers size={14} /> {t('map.layers')}</span>
          {layerBtn('centers', t('map.healthCenters'), MapPin, 'bg-unicef-blue')}
          {layerBtn('climate', t('map.climateAlerts'), AlertTriangle, 'bg-orange-500')}
          {layerBtn('health', t('map.healthAlerts'), HeartPulse, 'bg-red-500')}
          {layerBtn('energy', t('map.energy'), Sun, 'bg-yellow-500')}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="card p-0 overflow-hidden relative">
            <MapContainer center={BF_CENTER} zoom={7} scrollWheelZoom className="h-[560px] w-full z-0" style={{ background: '#e8eef2' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={18}
              />
              <FlyTo target={flyTarget} />

              {/* Zones d'alerte climatique */}
              {layers.includes('climate') && activeClimate.map(a => {
                const pos = districtCoords(a.district);
                if (!pos) return null;
                const radius = Math.sqrt(a.affectedPopulation) * 110; // m
                return (
                  <Circle
                    key={a.id}
                    center={pos}
                    radius={radius}
                    pathOptions={{ color: SEV_COLOR[a.severity], fillColor: SEV_COLOR[a.severity], fillOpacity: a.status === 'active' ? 0.18 : 0.08, weight: a.status === 'active' ? 2 : 1, dashArray: a.status === 'monitoring' ? '6 6' : undefined }}
                  >
                    <Popup>
                      <div className="text-xs min-w-[200px]">
                        <SeverityBadge severity={a.severity} label={t(`severity.${a.severity}` as 'severity.critical')} />
                        <p className="font-semibold mt-1.5">{climateAlertMessages[a.id]?.[language] ?? a.message}</p>
                        <p className="text-gray-500 mt-1">{a.district} · {nf(a.childrenAffected, language)} {t('climate.children')} · {L('anticipation', 'lead time')} {a.leadTimeHours} h</p>
                        <p className="text-gray-400 mt-0.5">{a.source}</p>
                      </div>
                    </Popup>
                  </Circle>
                );
              })}

              {/* Alertes santé */}
              {layers.includes('health') && live.healthAlerts.map(a => {
                const pos = districtCoords(a.district);
                if (!pos) return null;
                return (
                  <CircleMarker key={a.id} center={[pos[0] - 0.09, pos[1] + 0.12]} radius={9 + Math.min(10, a.childrenCases / 40)}
                    pathOptions={{ color: '#fff', weight: 1.5, fillColor: a.severity === 'critical' ? '#B91C1C' : a.severity === 'high' ? '#EA580C' : '#CA8A04', fillOpacity: 0.85 }}>
                    <LTooltip direction="top" offset={[0, -6]}><span className="text-xs">{t(`health.${a.type}` as 'health.malaria')} · {a.childrenCases} {t('map.childrenCases')}</span></LTooltip>
                  </CircleMarker>
                );
              })}

              {/* Centres */}
              {layers.includes('centers') && live.centers.map(c => (
                <CircleMarker
                  key={c.id}
                  center={[c.base.latitude, c.base.longitude]}
                  radius={c.base.type === 'CMA' ? 10 : 7}
                  eventHandlers={{ click: () => { setSelectedId(c.id); setFlyTarget([c.base.latitude, c.base.longitude]); } }}
                  pathOptions={{ color: '#fff', weight: 2, fillColor: STATUS_COLOR[c.status], fillOpacity: selectedId === c.id ? 1 : 0.92 }}
                >
                  {layers.includes('energy') && (
                    <LTooltip permanent direction="right" offset={[8, 0]} className="!bg-white !border-0 !shadow !rounded !px-1.5 !py-0.5">
                      <span className={`text-[10px] font-bold ${c.battery_pct > 60 ? 'text-green-700' : c.battery_pct > 30 ? 'text-yellow-700' : 'text-red-700'}`}>🔋 {c.battery_pct.toFixed(0)} %</span>
                    </LTooltip>
                  )}
                  <Popup>
                    <div className="text-xs min-w-[190px]">
                      <p className="font-semibold text-gray-900">{c.name}</p>
                      <p className="text-gray-500">{c.district}, {c.region} · {c.base.type}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between"><span>🔋 {t('centers.battery')}</span><b>{c.battery_pct.toFixed(0)} %</b></div>
                        <div className="flex justify-between"><span>💧 {t('centers.water')}</span><b>{c.water_pct.toFixed(0)} %</b></div>
                        <div className="flex justify-between"><span>🌡️ {t('centers.coldChain')}</span><b className={c.coldStatus === 'critical' ? 'text-red-600' : ''}>{c.cold_c.toFixed(1)} °C</b></div>
                      </div>
                      <Link to={`/centres/${c.id}`} className="block mt-2 text-unicef-blue font-medium">{L('Fiche détaillée →', 'Detailed view →')}</Link>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>

            {/* Légende */}
            <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur rounded-lg p-3 shadow-md text-xs">
              <p className="font-semibold text-gray-700 mb-2">{t('map.legend')}</p>
              <div className="space-y-1.5">
                {(['operational', 'partial', 'offline'] as const).map(s => (
                  <div key={s} className="flex items-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-white shadow" style={{ background: STATUS_COLOR[s] }} /> {t(`status.${s}` as 'status.operational')}</div>
                ))}
                <div className="flex items-center gap-2 pt-1 border-t border-gray-100"><span className="w-3 h-3 rounded-full bg-orange-500/30 border border-orange-500" /> {t('map.alertZone')}</div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-700" /> {L('Foyer épidémiologique', 'Epidemiological cluster')}</div>
              </div>
            </div>
            <button
              onClick={() => { setSelectedId(null); setFlyTarget(null); }}
              className="absolute top-4 right-4 z-[400] bg-white/95 rounded-lg p-2 shadow-md text-gray-600 hover:text-unicef-blue"
              title={L('Réinitialiser la vue', 'Reset view')}
            >
              <Crosshair size={16} />
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">{L('Fond de carte OpenStreetMap · positions GPS des formations sanitaires (WGS84) · zones d\'alerte proportionnelles à la population exposée.', 'OpenStreetMap basemap · facility GPS positions (WGS84) · alert zones proportional to exposed population.')}</p>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {selected ? (
            <div className="card border-2 border-unicef-blue/20 animate-in">
              <div className="flex items-center gap-2 mb-1"><StatusDot status={selected.status} /><h3 className="text-sm font-semibold text-gray-800">{selected.name}</h3></div>
              <p className="text-xs text-gray-500 mb-3">{selected.district}, {selected.region} · {selected.base.type} · {nf(selected.base.childrenUnder5, language)} {L('enfants <5', 'children <5')}</p>
              <LinkBadge link={selected.link} labels={linkLabels} />
              <div className="mt-3 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="flex items-center gap-1 text-gray-600"><Sun size={12} className="text-yellow-500" /> {t('centers.battery')}</span><b className="tabular-nums">{selected.battery_pct.toFixed(0)} %</b></div>
                  <Bar value={selected.battery_pct} tone="battery" />
                  <p className="text-[11px] text-gray-400 mt-1">{selected.solar_kw.toFixed(1)} / {selected.base.solarSystem.capacity_kw} kW</p>
                </div>
                <div>
                  <div className="flex items-center justify-between text-xs mb-1"><span className="flex items-center gap-1 text-gray-600"><Droplets size={12} className="text-blue-500" /> {t('centers.water')}</span><b className="tabular-nums">{selected.water_pct.toFixed(0)} %</b></div>
                  <Bar value={selected.water_pct} tone="water" />
                </div>
                <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1 text-gray-600"><Thermometer size={12} className="text-cyan-500" /> {t('centers.coldChain')}</span>
                  <b className={selected.coldStatus === 'optimal' ? 'text-green-600' : selected.coldStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'}>{selected.cold_c.toFixed(1)} °C</b></div>
                {selected.base.note && <p className="text-[11px] text-orange-700 bg-orange-50 rounded px-2 py-1">{selected.base.note[language]}</p>}
                <Link to={`/centres/${selected.id}`} className="btn-primary text-xs block text-center">{L('Ouvrir la fiche', 'Open facility')}</Link>
              </div>
            </div>
          ) : (
            <div className="card bg-blue-50/60 border-blue-100">
              <p className="text-xs text-blue-800">{L('Cliquez sur un centre pour afficher ses indicateurs en direct.', 'Click a centre to display its live indicators.')}</p>
            </div>
          )}

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('map.activeAlerts')}</h3>
            <div className="space-y-2">
              {activeClimate.map(a => (
                <button key={a.id} onClick={() => { const p = districtCoords(a.district); if (p) setFlyTarget(p); }} className="w-full text-left flex items-start gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg">
                  <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: SEV_COLOR[a.severity] }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700">{t(`climate.${{ heat_wave: 'heatWave', flood: 'flood', drought: 'drought', dust_storm: 'dustStorm', heavy_rain: 'heavyRain' }[a.type]}` as 'climate.heatWave')}</p>
                    <p className="text-[11px] text-gray-500">{a.district} · {nf(a.childrenAffected, language)} {t('climate.children')}</p>
                  </div>
                </button>
              ))}
              {live.healthAlerts.filter(a => a.severity === 'critical' || a.severity === 'high').map(a => (
                <button key={a.id} onClick={() => { const p = districtCoords(a.district); if (p) setFlyTarget(p); }} className="w-full text-left flex items-start gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg">
                  <HeartPulse size={12} className={`mt-0.5 flex-shrink-0 ${a.severity === 'critical' ? 'text-red-600' : 'text-orange-500'}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-700">{t(`health.${a.type}` as 'health.malaria')}</p>
                    <p className="text-[11px] text-gray-500">{a.district} · {a.childrenCases} {t('map.childrenCases')}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('map.summary')}</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-gray-500">{t('map.centersDisplayed')}</span><b>{live.centers.length}</b></div>
              <div className="flex justify-between"><span className="text-gray-500 flex items-center gap-1"><Users size={11} /> {L('Enfants couverts', 'Children covered')}</span><b>{nf(live.centers.reduce((s, c) => s + c.base.childrenUnder5, 0), language)}</b></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('map.activeClimateAlerts')}</span><b className="text-orange-600">{live.climateAlerts.filter(a => a.status === 'active').length}</b></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('map.criticalHealthAlerts')}</span><b className="text-red-600">{live.healthAlerts.filter(a => a.severity === 'critical').length}</b></div>
              <div className="flex justify-between"><span className="text-gray-500">{t('map.regionsCovered')}</span><b>{new Set(live.centers.map(c => c.region)).size} / 13</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
