import { useState } from 'react';
import { MessageSquare, Send, Phone, Users, Globe, Clock, CheckCircle, Plus, Filter, Volume2, Smartphone, Radio, X, Play, Pause, MapPin, Languages } from 'lucide-react';
import { PreventionMessage } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { useL, nf } from '../i18n/useL';
import { useLive, liveEngine } from '../context/LiveDataContext';
import { useToast } from '../context/ToastContext';
import { preventionMessageContent, preventionTriggerConditions } from '../i18n/dataTranslations';
import { KpiCard, Pill, SectionTitle } from '../components/ui';
import { formatDateTime } from '../data/dates';

const ALL_DISTRICTS = ['Koudougou', 'Réo', 'Sapouy', 'Dédougou', 'Boromo', 'Nouna', 'Djibo', 'Dori', 'Gorom-Gorom', 'Sebba'];

export default function Prevention() {
  const { t, language } = useLanguage();
  const L = useL();
  const live = useLive();
  const { toast } = useToast();
  const messages = live.preventionMessages;
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTarget, setSelectedTarget] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const [form, setForm] = useState({
    type: 'sms' as PreventionMessage['type'], target: 'mothers' as PreventionMessage['target'], language: 'moore' as PreventionMessage['language'],
    content: '', triggerCondition: '', districts: ['Djibo'] as string[],
  });

  const targetLabels: Record<string, string> = { mothers: t('prevention.mothers'), community_leaders: t('prevention.communityLeaders'), health_workers: t('prevention.healthWorkers'), all: t('prevention.all') };
  const typeLabels: Record<string, string> = { sms: t('prevention.sms'), voice: t('prevention.voice'), community: t('prevention.community') };
  const languageLabels: Record<string, string> = { french: t('prevention.french'), moore: t('prevention.moore'), dioula: t('prevention.dioula'), fulfulde: t('prevention.fulfulde') };
  const typeIcons: Record<string, typeof Smartphone> = { sms: Smartphone, voice: Volume2, community: Radio };
  const targetIcons: Record<string, typeof Users> = { mothers: Users, community_leaders: Globe, health_workers: Phone, all: Users };

  const filtered = messages.filter(m => (selectedType === 'all' || m.type === selectedType) && (selectedTarget === 'all' || m.target === selectedTarget));
  const totalSent = messages.reduce((s, m) => s + m.sentCount, 0);
  const delivered = messages.reduce((s, m) => s + m.sentCount * m.deliveryRate, 0);
  const reach = Math.round(totalSent * 0.71); // personnes uniques (dédoublonnage MSISDN)

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content.trim() || !form.triggerCondition.trim() || form.districts.length === 0) return;
    liveEngine.addPrevention({
      id: `pm-${Date.now()}`, type: form.type, target: form.target, language: form.language, content: form.content, triggerCondition: form.triggerCondition,
      sentCount: 0, lastSent: new Date().toISOString(), deliveryRate: 0, districts: form.districts, status: 'scheduled',
    });
    setShowNew(false);
    toast('success', t('prevention.messageCreated'), L(`Traduction ${languageLabels[form.language]} générée · validation par le relecteur communautaire requise`, `${languageLabels[form.language]} translation generated · community reviewer validation required`));
    setForm({ type: 'sms', target: 'mothers', language: 'moore', content: '', triggerCondition: '', districts: ['Djibo'] });
  };

  const resend = (m: PreventionMessage) => {
    const n = liveEngine.resendPrevention(m.id);
    toast('success', L(`Envoi en cours — ${nf(n, language)} destinataires`, `Sending — ${nf(n, language)} recipients`), `${typeLabels[m.type]} · ${languageLabels[m.language]} · ${m.districts.join(', ')}`);
  };

  const togglePlay = (id: string) => {
    if (playing === id) { setPlaying(null); return; }
    setPlaying(id);
    setTimeout(() => setPlaying(p => (p === id ? null : p)), 6000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('prevention.title')}</h1>
          <p className="text-gray-500 mt-1">{t('prevention.subtitle')} · {L('SMS, IVR vocal et relais communautaires en 4 langues', 'SMS, voice IVR and community relays in 4 languages')}</p>
        </div>
        <button onClick={() => setShowNew(!showNew)} className="btn-primary flex items-center gap-2">{showNew ? <X size={16} /> : <Plus size={16} />} {t('prevention.newMessage')}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label={t('prevention.messagesSent')} value={nf(totalSent, language)} icon={Send} tone="blue" sub={`${L('30 derniers jours', 'last 30 days')} · ${L('taux de livraison', 'delivery rate')} ${Math.round(delivered / Math.max(1, totalSent) * 100)} %`} />
        <KpiCard label={t('prevention.beneficiaries')} value={`≈ ${nf(reach, language)}`} icon={Users} tone="orange" sub={L('personnes uniques atteintes', 'unique people reached')} />
        <KpiCard label={t('prevention.languages')} value={new Set(messages.map(m => m.language)).size} icon={Languages} tone="purple" sub={L('Mooré · Dioula · Fulfuldé · Français', 'Mooré · Dioula · Fulfulde · French')} />
        <KpiCard label={t('prevention.activeMessages')} value={messages.filter(m => m.status === 'active').length} icon={MessageSquare} tone="green" sub={`${messages.filter(m => m.status === 'scheduled').length} ${L('programmés', 'scheduled')}`} />
      </div>

      {showNew && (
        <form onSubmit={submit} className="card border-2 border-unicef-blue/20 animate-in">
          <SectionTitle icon={Plus}>{t('prevention.createMessage')}</SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('prevention.broadcastType')}</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value as PreventionMessage['type'] }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="sms">{t('prevention.sms')}</option><option value="voice">{t('prevention.voice')} (IVR)</option><option value="community">{t('prevention.community')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('prevention.target')}</label>
              <select value={form.target} onChange={e => setForm(p => ({ ...p, target: e.target.value as PreventionMessage['target'] }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="mothers">{t('prevention.mothers')}</option><option value="health_workers">{t('prevention.healthWorkers')}</option><option value="community_leaders">{t('prevention.communityLeaders')}</option><option value="all">{t('prevention.all')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('prevention.language')}</label>
              <select value={form.language} onChange={e => setForm(p => ({ ...p, language: e.target.value as PreventionMessage['language'] }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="moore">{t('prevention.moore')}</option><option value="dioula">{t('prevention.dioula')}</option><option value="fulfulde">{t('prevention.fulfulde')}</option><option value="french">{t('prevention.french')}</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{L('Districts ciblés', 'Target districts')} ({form.districts.length})</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_DISTRICTS.map(dd => (
                  <button type="button" key={dd} onClick={() => setForm(p => ({ ...p, districts: p.districts.includes(dd) ? p.districts.filter(x => x !== dd) : [...p.districts, dd] }))}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${form.districts.includes(dd) ? 'bg-unicef-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{dd}</button>
                ))}
              </div>
            </div>
            <div className="md:col-span-1">
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('prevention.triggerCondition')}</label>
              <input type="text" value={form.triggerCondition} onChange={e => setForm(p => ({ ...p, triggerCondition: e.target.value }))} placeholder={t('prevention.triggerPlaceholder')} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" required />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('prevention.content')} ({L('rédigé en français, traduit automatiquement', 'written in French, auto-translated')})</label>
              <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))} placeholder={t('prevention.contentPlaceholder')} rows={3} maxLength={320} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" required />
              <p className={`text-xs mt-1 ${form.content.length > 160 ? 'text-orange-600' : 'text-gray-400'}`}>{form.content.length}/160 {t('prevention.characters')}{form.content.length > 160 && ` · ${L('2 segments', '2 segments')}`}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2"><Send size={16} /> {t('prevention.saveAndSchedule')}</button>
            <button type="button" onClick={() => setShowNew(false)} className="btn-secondary">{t('prevention.cancel')}</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs text-gray-500"><Filter size={14} /> {t('prevention.filter')}</span>
        <div className="flex gap-1">
          {[['all', t('prevention.all')], ...Object.entries(typeLabels)].map(([k, lab]) => (
            <button key={k} onClick={() => setSelectedType(k)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedType === k ? 'bg-unicef-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{lab}</button>
          ))}
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex gap-1">
          {[['all', t('prevention.all')], ...Object.entries(targetLabels).filter(([k]) => k !== 'all')].map(([k, lab]) => (
            <button key={k} onClick={() => setSelectedTarget(k)} className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${selectedTarget === k ? 'bg-unicef-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{lab}</button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {filtered.map(m => {
          const TypeIcon = typeIcons[m.type] || Smartphone;
          const TargetIcon = targetIcons[m.target] || Users;
          const tone = m.type === 'sms' ? 'blue' : m.type === 'voice' ? 'purple' : 'green';
          return (
            <div key={m.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-${tone}-100`}><TypeIcon size={20} className={`text-${tone}-600`} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Pill tone={tone as 'blue'}>{typeLabels[m.type]}{m.type === 'voice' ? ' · IVR' : ''}</Pill>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><TargetIcon size={12} /> {targetLabels[m.target]}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-500"><Languages size={12} /> {languageLabels[m.language]}</span>
                    <span className="flex items-center gap-1 text-xs text-gray-400"><MapPin size={12} /> {m.districts.join(', ')}</span>
                    <Pill tone={m.status === 'active' ? 'green' : m.status === 'scheduled' ? 'yellow' : 'gray'}>{m.status === 'active' ? L('Actif', 'Active') : m.status === 'scheduled' ? L('Programmé', 'Scheduled') : L('En pause', 'Paused')}</Pill>
                  </div>

                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">{preventionMessageContent[m.id]?.[language] || m.content}</p>

                  {m.type === 'voice' && (
                    <div className="mt-2 flex items-center gap-3 p-2 bg-purple-50 rounded-lg w-full max-w-md print:hidden">
                      <button onClick={() => togglePlay(m.id)} className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center flex-shrink-0">{playing === m.id ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}</button>
                      <div className="flex-1">
                        <div className="h-1.5 bg-purple-200 rounded-full overflow-hidden"><div className={`h-full bg-purple-600 rounded-full ${playing === m.id ? 'animate-[progress_6s_linear_forwards]' : 'w-0'}`} /></div>
                        <p className="text-[10px] text-purple-700 mt-1">{L('Message vocal', 'Voice message')} {languageLabels[m.language]} · 0:42 · {L('voix enregistrée par une sage-femme locale', 'recorded by a local midwife')}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 flex-wrap text-xs">
                    <span className="flex items-center gap-1 text-gray-500"><Clock size={12} /> {m.status === 'scheduled' ? L('Programmé', 'Scheduled') : t('prevention.lastSent')}: {formatDateTime(m.lastSent, language)}</span>
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle size={12} /> {nf(m.sentCount, language)} {t('prevention.sent')}{m.sentCount > 0 && ` · ${Math.round(m.deliveryRate * 100)} % ${L('livrés', 'delivered')}`}</span>
                    <span className="text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{t('prevention.trigger')}: {preventionTriggerConditions[m.id]?.[language] || m.triggerCondition}</span>
                  </div>
                </div>
                <button onClick={() => resend(m)} className="btn-secondary text-xs flex items-center gap-1 flex-shrink-0 print:hidden"><Send size={12} /> {m.status === 'scheduled' ? L('Envoyer maintenant', 'Send now') : t('prevention.resend')}</button>
              </div>
            </div>
          );
        })}
      </div>
      {filtered.length === 0 && <div className="text-center py-12"><MessageSquare size={48} className="text-gray-300 mx-auto" /><p className="text-gray-500 mt-3">{t('prevention.noMessages')}</p></div>}
      <span className="hidden bg-blue-100 text-blue-600 bg-purple-100 text-purple-600 bg-green-100 text-green-600" />
    </div>
  );
}
