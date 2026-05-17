import { useState } from 'react';
import { CloudLightning, Thermometer, CloudRain, Wind, Droplets, Users, Calendar, Plus, X, CheckCircle } from 'lucide-react';
import { climateAlerts as initialAlerts } from '../data/mockData';
import { ClimateAlert } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

const typeIcons: Record<string, typeof CloudLightning> = {
  heat_wave: Thermometer,
  flood: CloudRain,
  drought: Droplets,
  dust_storm: Wind,
  heavy_rain: CloudRain,
};

const regions = ['Sahel', 'Boucle du Mouhoun', 'Centre-Ouest', 'Centre', 'Est', 'Nord'];
const districtsByRegion: Record<string, string[]> = {
  'Sahel': ['Djibo', 'Dori', 'Gorom-Gorom', 'Sebba'],
  'Boucle du Mouhoun': ['Dédougou', 'Boromo', 'Nouna'],
  'Centre-Ouest': ['Koudougou', 'Réo', 'Sapouy'],
  'Centre': ['Ouagadougou', 'Ziniaré'],
  'Est': ['Fada N\'Gourma', 'Diapaga'],
  'Nord': ['Ouahigouya', 'Yako'],
};

export default function ClimateAlerts() {
  const { t, language } = useLanguage();
  const [alerts, setAlerts] = useState<ClimateAlert[]>(initialAlerts);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({
    type: 'heat_wave' as ClimateAlert['type'],
    severity: 'medium' as ClimateAlert['severity'],
    region: 'Sahel',
    district: 'Djibo',
    message: '',
    startDate: '2026-05-20',
    endDate: '',
    affectedPopulation: 0,
    childrenAffected: 0,
    recommendations: [''],
  });

  const typeLabels: Record<string, string> = {
    heat_wave: t('climate.heatWave'),
    flood: t('climate.flood'),
    drought: t('climate.drought'),
    dust_storm: t('climate.dustStorm'),
    heavy_rain: t('climate.heavyRain'),
  };

  const severityColors: Record<string, string> = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    medium: 'border-yellow-500 bg-yellow-50',
    low: 'border-blue-500 bg-blue-50',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: ClimateAlert = {
      id: `ca-${Date.now()}`,
      type: form.type,
      severity: form.severity,
      region: form.region,
      district: form.district,
      message: form.message,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      affectedPopulation: form.affectedPopulation,
      childrenAffected: form.childrenAffected,
      recommendations: form.recommendations.filter(r => r.trim() !== ''),
      status: 'active',
    };
    setAlerts([newAlert, ...alerts]);
    setShowForm(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    // Reset form
    setForm({
      type: 'heat_wave',
      severity: 'medium',
      region: 'Sahel',
      district: 'Djibo',
      message: '',
      startDate: '2026-05-20',
      endDate: '',
      affectedPopulation: 0,
      childrenAffected: 0,
      recommendations: [''],
    });
  };

  const addRecommendation = () => {
    setForm(prev => ({ ...prev, recommendations: [...prev.recommendations, ''] }));
  };

  const updateRecommendation = (index: number, value: string) => {
    setForm(prev => ({
      ...prev,
      recommendations: prev.recommendations.map((r, i) => i === index ? value : r)
    }));
  };

  const removeRecommendation = (index: number) => {
    setForm(prev => ({
      ...prev,
      recommendations: prev.recommendations.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('climate.title')}</h1>
          <p className="text-gray-500 mt-1">{t('climate.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          <span className="flex items-center gap-2">
            {showForm ? <X size={16} /> : <CloudLightning size={16} />}
            {t('climate.newAlert')}
          </span>
        </button>
      </div>

      {/* Success notification */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-sm font-medium text-green-800">{t('climate.alertCreated')}</p>
        </div>
      )}

      {/* New alert form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card border-2 border-unicef-blue/20">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-unicef-blue" />
            {t('climate.createAlert')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.alertType')}</label>
              <select
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as ClimateAlert['type'] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="heat_wave">{t('climate.heatWave')}</option>
                <option value="flood">{t('climate.flood')}</option>
                <option value="drought">{t('climate.drought')}</option>
                <option value="dust_storm">{t('climate.dustStorm')}</option>
                <option value="heavy_rain">{t('climate.heavyRain')}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.severity')}</label>
              <select
                value={form.severity}
                onChange={(e) => setForm(prev => ({ ...prev, severity: e.target.value as ClimateAlert['severity'] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="low">{t('severity.low')}</option>
                <option value="medium">{t('severity.medium')}</option>
                <option value="high">{t('severity.high')}</option>
                <option value="critical">{t('severity.critical')}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.region')}</label>
              <select
                value={form.region}
                onChange={(e) => {
                  const region = e.target.value;
                  setForm(prev => ({ ...prev, region, district: districtsByRegion[region]?.[0] || '' }));
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              >
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.district')}</label>
              <select
                value={form.district}
                onChange={(e) => setForm(prev => ({ ...prev, district: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              >
                {(districtsByRegion[form.region] || []).map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.startDate')}</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.endDate')}</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.affectedPopulation')}</label>
              <input
                type="number"
                value={form.affectedPopulation || ''}
                onChange={(e) => setForm(prev => ({ ...prev, affectedPopulation: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                min="0"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.childrenAffected')}</label>
              <input
                type="number"
                value={form.childrenAffected || ''}
                onChange={(e) => setForm(prev => ({ ...prev, childrenAffected: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                min="0"
                required
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.message')}</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder={t('climate.messagePlaceholder')}
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                required
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('climate.recommendations')}</label>
              <div className="space-y-2">
                {form.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={rec}
                      onChange={(e) => updateRecommendation(i, e.target.value)}
                      placeholder={`Recommandation ${i + 1}`}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    />
                    {form.recommendations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRecommendation(i)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addRecommendation}
                  className="text-xs text-unicef-blue hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> Ajouter une recommandation
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <CheckCircle size={16} />
              {t('climate.submit')}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
              {t('climate.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card bg-red-50 border-red-100">
          <p className="text-xs text-red-600 font-medium">{t('severity.critical')}s</p>
          <p className="text-2xl font-bold text-red-800">
            {alerts.filter(a => a.severity === 'critical').length}
          </p>
        </div>
        <div className="card bg-orange-50 border-orange-100">
          <p className="text-xs text-orange-600 font-medium">{t('severity.high')}s</p>
          <p className="text-2xl font-bold text-orange-800">
            {alerts.filter(a => a.severity === 'high').length}
          </p>
        </div>
        <div className="card bg-yellow-50 border-yellow-100">
          <p className="text-xs text-yellow-600 font-medium">{t('severity.medium')}s</p>
          <p className="text-2xl font-bold text-yellow-800">
            {alerts.filter(a => a.severity === 'medium').length}
          </p>
        </div>
        <div className="card bg-blue-50 border-blue-100">
          <p className="text-xs text-blue-600 font-medium">{t('climate.affectedPop')}</p>
          <p className="text-2xl font-bold text-blue-800">
            {(alerts.reduce((sum, a) => sum + a.affectedPopulation, 0) / 1000).toFixed(0)}k
          </p>
        </div>
      </div>

      {/* Alerts list */}
      <div className="space-y-4">
        {alerts.map((alert) => {
          const Icon = typeIcons[alert.type] || CloudLightning;
          return (
            <div
              key={alert.id}
              className={`card border-l-4 ${severityColors[alert.severity]}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    alert.severity === 'critical' ? 'bg-red-100' :
                    alert.severity === 'high' ? 'bg-orange-100' : 'bg-yellow-100'
                  }`}>
                    <Icon size={20} className={
                      alert.severity === 'critical' ? 'text-red-600' :
                      alert.severity === 'high' ? 'text-orange-600' : 'text-yellow-600'
                    } />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-800">
                        {typeLabels[alert.type]}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        alert.status === 'active' ? 'bg-red-100 text-red-700' :
                        alert.status === 'monitoring' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {alert.status === 'active' ? t('status.active') :
                         alert.status === 'monitoring' ? t('status.monitoring') : t('status.resolved')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {new Date(alert.startDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                        {alert.endDate && ` → ${new Date(alert.endDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}`}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Users size={12} />
                        {alert.childrenAffected.toLocaleString()} {t('climate.children')}
                      </span>
                      <span className="text-xs text-gray-500">
                        📍 {alert.district}, {alert.region}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {alert.recommendations.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('climate.recommendations')}</h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {alert.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="text-green-500 mt-0.5">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
