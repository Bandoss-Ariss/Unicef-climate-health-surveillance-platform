import { useState } from 'react';
import { HeartPulse, TrendingUp, TrendingDown, Minus, Users, Plus, X, CheckCircle } from 'lucide-react';
import { healthAlerts as initialAlerts } from '../data/mockData';
import { HealthAlert } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

const regions = ['Sahel', 'Boucle du Mouhoun', 'Centre-Ouest'];
const districtsByRegion: Record<string, string[]> = {
  'Sahel': ['Djibo', 'Dori', 'Gorom-Gorom', 'Sebba'],
  'Boucle du Mouhoun': ['Dédougou', 'Boromo', 'Nouna'],
  'Centre-Ouest': ['Koudougou', 'Réo', 'Sapouy'],
};

export default function HealthAlertsPage() {
  const { t, language } = useLanguage();
  const [alerts, setAlerts] = useState<HealthAlert[]>(initialAlerts);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [form, setForm] = useState({
    type: 'malaria' as HealthAlert['type'],
    severity: 'medium' as HealthAlert['severity'],
    region: 'Sahel',
    district: 'Djibo',
    cases: 0,
    childrenCases: 0,
    trend: 'stable' as HealthAlert['trend'],
    startDate: '2026-05-17',
    recommendations: [''],
  });

  const typeLabels: Record<string, string> = {
    malaria: t('health.malaria'),
    cholera: t('health.cholera'),
    meningitis: t('health.meningitis'),
    malnutrition: t('health.malnutrition'),
    dehydration: t('health.dehydration'),
    respiratory: t('health.respiratory'),
  };

  const typeColors: Record<string, string> = {
    malaria: 'bg-purple-100 text-purple-700',
    cholera: 'bg-blue-100 text-blue-700',
    meningitis: 'bg-red-100 text-red-700',
    malnutrition: 'bg-orange-100 text-orange-700',
    dehydration: 'bg-cyan-100 text-cyan-700',
    respiratory: 'bg-green-100 text-green-700',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAlert: HealthAlert = {
      id: `ha-${Date.now()}`,
      type: form.type,
      severity: form.severity,
      region: form.region,
      district: form.district,
      cases: form.cases,
      childrenCases: form.childrenCases,
      trend: form.trend,
      startDate: form.startDate,
      recommendations: form.recommendations.filter(r => r.trim() !== ''),
    };
    setAlerts([newAlert, ...alerts]);
    setShowForm(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setForm({
      type: 'malaria',
      severity: 'medium',
      region: 'Sahel',
      district: 'Djibo',
      cases: 0,
      childrenCases: 0,
      trend: 'stable',
      startDate: '2026-05-17',
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
          <h1 className="text-2xl font-bold text-gray-900">{t('health.title')}</h1>
          <p className="text-gray-500 mt-1">{t('health.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          <span className="flex items-center gap-2">
            {showForm ? <X size={16} /> : <HeartPulse size={16} />}
            {t('health.declareCase')}
          </span>
        </button>
      </div>

      {/* Success notification */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-sm font-medium text-green-800">{t('health.caseCreated')}</p>
        </div>
      )}

      {/* New case form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card border-2 border-unicef-blue/20">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-unicef-blue" />
            {t('health.createCase')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('health.pathologyType')}</label>
              <select
                value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as HealthAlert['type'] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="malaria">{t('health.malaria')}</option>
                <option value="cholera">{t('health.cholera')}</option>
                <option value="meningitis">{t('health.meningitis')}</option>
                <option value="malnutrition">{t('health.malnutrition')}</option>
                <option value="dehydration">{t('health.dehydration')}</option>
                <option value="respiratory">{t('health.respiratory')}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('climate.severity')}</label>
              <select
                value={form.severity}
                onChange={(e) => setForm(prev => ({ ...prev, severity: e.target.value as HealthAlert['severity'] }))}
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
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('health.casesCount')}</label>
              <input
                type="number"
                value={form.cases || ''}
                onChange={(e) => setForm(prev => ({ ...prev, cases: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                min="1"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('health.childrenCount')}</label>
              <input
                type="number"
                value={form.childrenCases || ''}
                onChange={(e) => setForm(prev => ({ ...prev, childrenCases: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                min="0"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('health.trend')}</label>
              <select
                value={form.trend}
                onChange={(e) => setForm(prev => ({ ...prev, trend: e.target.value as HealthAlert['trend'] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="increasing">{t('health.increasing')}</option>
                <option value="stable">{t('health.stable')}</option>
                <option value="decreasing">{t('health.decreasing')}</option>
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

            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('health.recommendedActions')}</label>
              <div className="space-y-2">
                {form.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={rec}
                      onChange={(e) => updateRecommendation(i, e.target.value)}
                      placeholder={`${language === 'fr' ? 'Action recommandée' : 'Recommended action'} ${i + 1}`}
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
                  <Plus size={12} /> {language === 'fr' ? 'Ajouter une action' : 'Add an action'}
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
        <div className="card">
          <p className="text-xs text-gray-500">{t('health.totalCases')}</p>
          <p className="text-2xl font-bold text-gray-900">
            {alerts.reduce((sum, a) => sum + a.cases, 0)}
          </p>
          <p className="text-xs text-red-500 mt-1">↑ {t('health.risingThisWeek')}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">{t('health.childrenCases')}</p>
          <p className="text-2xl font-bold text-unicef-blue">
            {alerts.reduce((sum, a) => sum + a.childrenCases, 0)}
          </p>
          <p className="text-xs text-gray-400">
            {((alerts.reduce((sum, a) => sum + a.childrenCases, 0) / alerts.reduce((sum, a) => sum + a.cases, 0)) * 100).toFixed(0)}% {t('health.ofTotal')}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">{t('health.activePathologies')}</p>
          <p className="text-2xl font-bold text-gray-900">{new Set(alerts.map(a => a.type)).size}</p>
          <p className="text-xs text-gray-400">{t('health.differentTypes')}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500">{t('health.affectedDistricts')}</p>
          <p className="text-2xl font-bold text-gray-900">
            {new Set(alerts.map(a => a.district)).size}
          </p>
          <p className="text-xs text-gray-400">{t('health.onPilotDistricts')}</p>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`card border-l-4 ${
              alert.severity === 'critical' ? 'border-l-red-500' :
              alert.severity === 'high' ? 'border-l-orange-500' :
              alert.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${typeColors[alert.type]}`}>
                    {typeLabels[alert.type]}
                  </span>
                  <span className={`alert-badge ${
                    alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                    alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.severity === 'critical' ? t('severity.critical') :
                     alert.severity === 'high' ? t('severity.high') : t('severity.medium')}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    {alert.trend === 'increasing' ? (
                      <><TrendingUp size={12} className="text-red-500" /> {t('health.increasing')}</>
                    ) : alert.trend === 'decreasing' ? (
                      <><TrendingDown size={12} className="text-green-500" /> {t('health.decreasing')}</>
                    ) : (
                      <><Minus size={12} className="text-gray-400" /> {t('health.stable')}</>
                    )}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">{t('health.totalCasesLabel')}</p>
                    <p className="text-lg font-bold text-gray-900">{alert.cases}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('health.childrenUnder5')}</p>
                    <p className="text-lg font-bold text-unicef-blue">{alert.childrenCases}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('common.district')}</p>
                    <p className="text-sm font-medium text-gray-700">{alert.district}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{t('health.since')}</p>
                    <p className="text-sm font-medium text-gray-700">
                      {new Date(alert.startDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            {alert.recommendations.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">{t('health.recommendedActions')}</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  {alert.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                      <span className="text-unicef-blue mt-0.5">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
