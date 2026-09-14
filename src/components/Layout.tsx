import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, CloudLightning, HeartPulse, Sun, FlaskConical, MessageSquare, Map, Bell, Menu, X, Radio,
  Brain, ScrollText, Printer, Server, Cpu, ShieldCheck, LogOut, ChevronDown, UserCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useL } from '../i18n/useL';
import { useLive, liveEngine } from '../context/LiveDataContext';
import { useAuth } from '../context/AuthContext';
import { startBackendSync } from '../services/api';
import { ouagaTime, ouagaDate } from '../data/dates';
import { EventRow } from './ui';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [clock, setClock] = useState(new Date());
  const { language, setLanguage, t } = useLanguage();
  const L = useL();
  const live = useLive();
  const navigate = useNavigate();
  const bellRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => { startBackendSync(); }, []);
  useEffect(() => { const i = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const groups = [
    {
      title: L('Surveillance', 'Monitoring'),
      items: [
        { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
        { path: '/centres', label: t('nav.centers'), icon: Building2 },
        { path: '/realtime', label: L('Temps réel IoT', 'Real-time IoT'), icon: Radio },
        { path: '/carte', label: t('nav.map'), icon: Map },
        { path: '/energie', label: t('nav.energy'), icon: Sun },
      ],
    },
    {
      title: L('Anticipation', 'Anticipation'),
      items: [
        { path: '/alertes-climat', label: t('nav.climateAlerts'), icon: CloudLightning },
        { path: '/alertes-sante', label: t('nav.healthAlerts'), icon: HeartPulse },
        { path: '/predictions', label: L('Prédictions IA', 'AI Predictions'), icon: Brain },
        { path: '/simulation', label: t('nav.simulation'), icon: FlaskConical },
      ],
    },
    {
      title: L('Action & pilotage', 'Action & steering'),
      items: [
        { path: '/prevention', label: t('nav.prevention'), icon: MessageSquare },
        { path: '/journal', label: L('Journal des opérations', 'Operations log'), icon: ScrollText },
      ],
    },
  ];

  const onlineNodes = live.centers.filter(c => c.link !== 'offline').length;
  const criticalCount = live.events.filter(e => e.severity === 'critical' && Date.now() - new Date(e.at).getTime() < 24 * 3600_000).length;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside
        className={`print:hidden fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-64 bg-unicef-darkblue text-white flex flex-col transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="px-4 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <img src="/brand/unicef-logo-white.svg" alt="UNICEF" className="h-8 w-auto" />
              <h1 className="text-sm font-bold leading-tight mt-2.5">{L('Plateforme Climat-Santé', 'Climate-Health Platform')}</h1>
              <p className="text-[11px] text-blue-200">Burkina Faso · {L('Alerte précoce', 'Early warning')}</p>
            </div>
            <button className="lg:hidden text-white" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {groups.map(g => (
            <div key={g.title}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-blue-300/80">{g.title}</p>
              <div className="space-y-0.5">
                {g.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                        isActive ? 'bg-white/15 text-white shadow-inner' : 'text-blue-100/90 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <item.icon size={17} strokeWidth={1.8} />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          <div className="bg-white/10 rounded-lg p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-blue-200">{t('nav.pilotPhase')}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-unicef-yellow text-unicef-darkblue font-bold">v1.2-pilot</span>
            </div>
            <p className="text-xs font-medium">{L('10 formations sanitaires · 3 régions', '10 health facilities · 3 regions')}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-200">
              <Cpu size={11} />
              <span>{L('Passerelle IoT', 'IoT gateway')} · {onlineNodes}/10 {L('nœuds', 'nodes')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-200">
              <ShieldCheck size={11} />
              <span>{L('Bien public numérique · MIT', 'Digital Public Good · MIT')}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="print:hidden bg-white/95 backdrop-blur border-b border-gray-200 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden text-gray-600" onClick={() => setSidebarOpen(true)}><Menu size={22} /></button>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-gray-800 truncate">{t('header.platform')}</h2>
              <p className="text-[11px] text-gray-500 tabular-nums">
                Ouagadougou · {ouagaDate(clock, language)} · <span className="font-mono">{ouagaTime(clock)}</span> UTC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Backend status */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                live.backend === 'connected' ? 'bg-green-50 text-green-700' : live.backend === 'checking' ? 'bg-gray-100 text-gray-500' : 'bg-amber-50 text-amber-700'
              }`}
              title={live.backend === 'connected' ? `API FastAPI · ${live.backendLatencyMs} ms` : L('Backend non joignable — mode autonome', 'Backend unreachable — standalone mode')}
            >
              <Server size={12} />
              {live.backend === 'connected'
                ? <>API {L('connectée', 'connected')} · {live.backendLatencyMs} ms</>
                : live.backend === 'checking' ? L('Connexion API…', 'Connecting API…') : L('Mode autonome', 'Standalone mode')}
            </div>

            <button onClick={() => window.print()} className="hidden sm:flex p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100" title={L('Exporter la page (PDF)', 'Export page (PDF)')}>
              <Printer size={18} />
            </button>

            {/* Language */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {(['fr', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${language === l ? 'bg-white text-unicef-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Notifications */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => { setBellOpen(o => !o); liveEngine.markEventsRead(); }}
                className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <Bell size={19} />
                {live.unreadEvents > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-unicef-red text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {live.unreadEvents > 9 ? '9+' : live.unreadEvents}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">{L('Notifications', 'Notifications')}</p>
                    <span className="text-[11px] text-gray-500">{criticalCount} {L('critiques (24 h)', 'critical (24 h)')}</span>
                  </div>
                  <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50 px-3">
                    {live.events.slice(0, 8).map(ev => <EventRow key={ev.id} ev={ev} lang={language} compact />)}
                  </div>
                  <button
                    onClick={() => { setBellOpen(false); navigate('/journal'); }}
                    className="w-full py-2.5 text-xs font-medium text-unicef-blue hover:bg-blue-50 border-t border-gray-100"
                  >
                    {L('Voir le journal complet', 'View full log')} →
                  </button>
                </div>
              )}
            </div>

            {/* User */}
            <div className="relative pl-2 border-l border-gray-200" ref={userRef}>
              <button onClick={() => setUserOpen(o => !o)} className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-gray-100">
                <div className="w-8 h-8 bg-unicef-blue rounded-full flex items-center justify-center text-white text-xs font-semibold">{user?.initials ?? 'CO'}</div>
                <div className="hidden lg:block leading-tight text-left">
                  <p className="text-xs font-medium text-gray-800">{user?.name}</p>
                  <p className="text-[10px] text-gray-500 max-w-[180px] truncate">{user?.role[language]}</p>
                </div>
                <ChevronDown size={14} className="hidden lg:block text-gray-400" />
              </button>
              {userOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    <UserCircle size={28} className="text-unicef-blue" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 text-[11px] text-gray-500">
                    <p>{user?.role[language]}</p>
                    <p className="mt-0.5">{L('Connecté depuis', 'Signed in since')} {user ? new Date(user.loginAt).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Ouagadougou' }) : ''}</p>
                  </div>
                  <button
                    onClick={() => { setUserOpen(false); logout(); navigate('/login'); }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                  >
                    <LogOut size={15} /> {L('Se déconnecter', 'Sign out')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          {/* En-tête visible uniquement à l'impression / export PDF */}
          <div className="hidden print:flex items-center justify-between mb-6 pb-3 border-b border-gray-200">
            <img src="/brand/unicef-logo.svg" alt="UNICEF" className="h-10 w-auto" />
            <div className="text-right text-[11px] text-gray-500">
              <p className="font-semibold text-gray-800">{t('header.platform')} · Burkina Faso</p>
              <p>{ouagaDate(clock, language)} · {ouagaTime(clock)} UTC</p>
            </div>
          </div>
          <Outlet />
        </main>

        <footer className="print:hidden px-6 py-3 text-[11px] text-gray-400 border-t border-gray-200 flex flex-wrap gap-x-4 gap-y-1 justify-between">
          <span>© UNICEF Burkina Faso · {L('Plateforme climat-santé', 'Climate-health platform')} · {L('Prototype pilote', 'Pilot prototype')}</span>
          <span>{L('Sources : ANAM · DHIS2 · CHIRPS · ECMWF · capteurs IoT', 'Sources: ANAM · DHIS2 · CHIRPS · ECMWF · IoT sensors')}</span>
        </footer>
      </div>
    </div>
  );
}
