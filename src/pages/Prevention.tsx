import { useState } from 'react';
import {
  MessageSquare,
  Send,
  Phone,
  Users,
  Globe,
  Clock,
  CheckCircle,
  Plus,
  Filter,
  Volume2,
  Smartphone,
  Radio,
  X
} from 'lucide-react';
import { preventionMessages as initialMessages } from '../data/mockData';
import { PreventionMessage } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

export default function Prevention() {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<PreventionMessage[]>(initialMessages);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newMessage, setNewMessage] = useState({
    type: 'sms' as PreventionMessage['type'],
    target: 'mothers' as PreventionMessage['target'],
    language: 'french' as PreventionMessage['language'],
    content: '',
    triggerCondition: '',
  });

  const targetLabels: Record<string, string> = {
    mothers: t('prevention.mothers'),
    community_leaders: t('prevention.communityLeaders'),
    health_workers: t('prevention.healthWorkers'),
    all: t('prevention.all'),
  };

  const typeLabels: Record<string, string> = {
    sms: t('prevention.sms'),
    voice: t('prevention.voice'),
    community: t('prevention.community'),
  };

  const languageLabels: Record<string, string> = {
    french: t('prevention.french'),
    moore: t('prevention.moore'),
    dioula: t('prevention.dioula'),
    fulfulde: t('prevention.fulfulde'),
  };

  const languageFlags: Record<string, string> = {
    french: '🇫🇷',
    moore: '🇧🇫',
    dioula: '🇧🇫',
    fulfulde: '🇧🇫',
  };

  const typeIcons: Record<string, typeof Smartphone> = {
    sms: Smartphone,
    voice: Volume2,
    community: Radio,
  };

  const targetIcons: Record<string, typeof Users> = {
    mothers: Users,
    community_leaders: Globe,
    health_workers: Phone,
    all: Users,
  };

  const filteredMessages = messages.filter(msg => {
    if (selectedType !== 'all' && msg.type !== selectedType) return false;
    if (selectedTarget !== 'all' && msg.target !== selectedTarget) return false;
    return true;
  });

  const totalSent = messages.reduce((sum, m) => sum + m.sentCount, 0);
  const uniqueLanguages = new Set(messages.map(m => m.language)).size;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.content.trim() || !newMessage.triggerCondition.trim()) return;

    const msg: PreventionMessage = {
      id: `pm-${Date.now()}`,
      type: newMessage.type,
      target: newMessage.target,
      language: newMessage.language,
      content: newMessage.content,
      triggerCondition: newMessage.triggerCondition,
      sentCount: 0,
      lastSent: new Date().toISOString(),
    };
    setMessages([msg, ...messages]);
    setShowNewMessage(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
    setNewMessage({
      type: 'sms',
      target: 'mothers',
      language: 'french',
      content: '',
      triggerCondition: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('prevention.title')}</h1>
          <p className="text-gray-500 mt-1">{t('prevention.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowNewMessage(!showNewMessage)}
          className="btn-primary flex items-center gap-2"
        >
          {showNewMessage ? <X size={16} /> : <Plus size={16} />}
          {t('prevention.newMessage')}
        </button>
      </div>

      {/* Success notification */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3 animate-in">
          <CheckCircle size={20} className="text-green-600" />
          <p className="text-sm font-medium text-green-800">{t('prevention.messageCreated')}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Send size={16} className="text-unicef-blue" />
            <span className="text-xs text-gray-500">{t('prevention.messagesSent')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalSent.toLocaleString()}</p>
          <p className="text-xs text-green-500">{t('prevention.thisMonth')}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-green-500" />
            <span className="text-xs text-gray-500">{t('prevention.activeMessages')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
          <p className="text-xs text-gray-400">{t('prevention.configured')}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-purple-500" />
            <span className="text-xs text-gray-500">{t('prevention.languages')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{uniqueLanguages}</p>
          <p className="text-xs text-gray-400">{t('prevention.localLanguages')}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-orange-500" />
            <span className="text-xs text-gray-500">{t('prevention.beneficiaries')}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">~47k</p>
          <p className="text-xs text-gray-400">{t('prevention.peopleReached')}</p>
        </div>
      </div>

      {/* New message form */}
      {showNewMessage && (
        <form onSubmit={handleSubmit} className="card border-2 border-unicef-blue/20">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Plus size={16} className="text-unicef-blue" />
            {t('prevention.createMessage')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('prevention.broadcastType')}</label>
              <select
                value={newMessage.type}
                onChange={(e) => setNewMessage(prev => ({ ...prev, type: e.target.value as PreventionMessage['type'] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="sms">{t('prevention.sms')}</option>
                <option value="voice">{t('prevention.voice')}</option>
                <option value="community">{t('prevention.community')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('prevention.target')}</label>
              <select
                value={newMessage.target}
                onChange={(e) => setNewMessage(prev => ({ ...prev, target: e.target.value as PreventionMessage['target'] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="mothers">{t('prevention.mothers')}</option>
                <option value="health_workers">{t('prevention.healthWorkers')}</option>
                <option value="community_leaders">{t('prevention.communityLeaders')}</option>
                <option value="all">{t('prevention.all')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('prevention.language')}</label>
              <select
                value={newMessage.language}
                onChange={(e) => setNewMessage(prev => ({ ...prev, language: e.target.value as PreventionMessage['language'] }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="french">{t('prevention.french')}</option>
                <option value="moore">{t('prevention.moore')}</option>
                <option value="dioula">{t('prevention.dioula')}</option>
                <option value="fulfulde">{t('prevention.fulfulde')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('prevention.triggerCondition')}</label>
              <input
                type="text"
                value={newMessage.triggerCondition}
                onChange={(e) => setNewMessage(prev => ({ ...prev, triggerCondition: e.target.value }))}
                placeholder={t('prevention.triggerPlaceholder')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-500 uppercase mb-1 block">{t('prevention.content')}</label>
              <textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                placeholder={t('prevention.contentPlaceholder')}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1">{newMessage.content.length}/160 {t('prevention.characters')}</p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Send size={16} />
              {t('prevention.saveAndSchedule')}
            </button>
            <button
              type="button"
              onClick={() => setShowNewMessage(false)}
              className="btn-secondary"
            >
              {t('prevention.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">{t('prevention.filter')}</span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedType === 'all' ? 'bg-unicef-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('prevention.all')}
          </button>
          {Object.entries(typeLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedType(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedType === key ? 'bg-unicef-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="w-px h-4 bg-gray-200" />
        <div className="flex gap-1">
          <button
            onClick={() => setSelectedTarget('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedTarget === 'all' ? 'bg-unicef-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('prevention.all')}
          </button>
          {Object.entries(targetLabels).filter(([k]) => k !== 'all').map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedTarget(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedTarget === key ? 'bg-unicef-purple text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages list */}
      <div className="space-y-4">
        {filteredMessages.map((msg) => {
          const TypeIcon = typeIcons[msg.type] || Smartphone;
          const TargetIcon = targetIcons[msg.target] || Users;
          return (
            <div key={msg.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  msg.type === 'sms' ? 'bg-blue-100' :
                  msg.type === 'voice' ? 'bg-purple-100' : 'bg-green-100'
                }`}>
                  <TypeIcon size={20} className={
                    msg.type === 'sms' ? 'text-blue-600' :
                    msg.type === 'voice' ? 'text-purple-600' : 'text-green-600'
                  } />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      msg.type === 'sms' ? 'bg-blue-100 text-blue-700' :
                      msg.type === 'voice' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {typeLabels[msg.type]}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <TargetIcon size={12} />
                      {targetLabels[msg.target]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {languageFlags[msg.language]} {languageLabels[msg.language]}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">{msg.content}</p>

                  <div className="flex items-center gap-4 mt-3 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      {t('prevention.lastSent')}: {new Date(msg.lastSent).toLocaleDateString(
                        language === 'fr' ? 'fr-FR' : 'en-US',
                        { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }
                      )}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle size={12} />
                      {msg.sentCount.toLocaleString()} {t('prevention.sent')}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                      {t('prevention.trigger')}: {msg.triggerCondition}
                    </span>
                  </div>
                </div>

                <button className="btn-secondary text-xs flex items-center gap-1 flex-shrink-0">
                  <Send size={12} />
                  {t('prevention.resend')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredMessages.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare size={48} className="text-gray-300 mx-auto" />
          <p className="text-gray-500 mt-3">{t('prevention.noMessages')}</p>
        </div>
      )}
    </div>
  );
}
