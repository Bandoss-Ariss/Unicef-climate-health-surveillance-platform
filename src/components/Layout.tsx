import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  CloudLightning,
  HeartPulse,
  Sun,
  FlaskConical,
  MessageSquare,
  Map,
  Bell,
  Menu,
  X,
  Globe,
  Radio
} from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { path: '/', label: t('nav.dashboard'), icon: LayoutDashboard },
    { path: '/centres', label: t('nav.centers'), icon: Building2 },
    { path: '/alertes-climat', label: t('nav.climateAlerts'), icon: CloudLightning },
    { path: '/alertes-sante', label: t('nav.healthAlerts'), icon: HeartPulse },
    { path: '/energie', label: t('nav.energy'), icon: Sun },
    { path: '/realtime', label: language === 'fr' ? 'Temps réel' : 'Real-time', icon: Radio },
    { path: '/simulation', label: t('nav.simulation'), icon: FlaskConical },
    { path: '/prevention', label: t('nav.prevention'), icon: MessageSquare },
    { path: '/carte', label: t('nav.map'), icon: Map },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-unicef-darkblue text-white transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">UNICEF</h1>
              <p className="text-xs text-blue-200">{t('nav.subtitle')}</p>
            </div>
            <button
              className="lg:hidden text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-white/10 rounded-lg p-3">
            <p className="text-xs text-blue-200">{t('nav.pilotPhase')}</p>
            <p className="text-sm font-medium">{t('nav.activeCenters')}</p>
            <p className="text-xs text-blue-200 mt-1">{t('nav.priorityDistricts')}</p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-gray-600"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-sm font-medium text-gray-500">{t('header.platform')}</h2>
              <p className="text-xs text-gray-400">{t('header.lastUpdate')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setLanguage('fr')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  language === 'fr' ? 'bg-white text-unicef-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                FR
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  language === 'en' ? 'bg-white text-unicef-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                EN
              </button>
            </div>

            <button className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 bg-unicef-blue rounded-full flex items-center justify-center text-white text-sm font-medium">
              BF
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
