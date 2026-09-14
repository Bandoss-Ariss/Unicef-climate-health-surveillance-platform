import { ReactNode } from 'react';
import {
  Activity, AlertTriangle, MessageSquare, Wrench, Brain, CheckCircle2, Server, Thermometer, Droplets, Wifi, WifiOff, LucideIcon,
} from 'lucide-react';
import { EventKind, PlatformEvent } from '../types';
import { LinkStatus } from '../data/liveEngine';

// ---------------------------------------------------------------------------
// KPI
// ---------------------------------------------------------------------------

export function KpiCard({
  label, value, sub, icon: Icon, tone = 'blue', trend,
}: {
  label: string; value: ReactNode; sub?: ReactNode; icon: LucideIcon;
  tone?: 'blue' | 'green' | 'yellow' | 'red' | 'orange' | 'purple' | 'cyan' | 'gray';
  trend?: { value: string; positive?: boolean };
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-unicef-blue', green: 'bg-green-50 text-green-600', yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600', orange: 'bg-orange-50 text-orange-600', purple: 'bg-purple-50 text-purple-600',
    cyan: 'bg-cyan-50 text-cyan-600', gray: 'bg-gray-100 text-gray-600',
  };
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tones[tone]}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-2 text-xs">
          {trend && (
            <span className={`font-medium ${trend.positive === false ? 'text-red-600' : 'text-green-600'}`}>{trend.value}</span>
          )}
          {sub && <span className="text-gray-500">{sub}</span>}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export function SeverityBadge({ severity, label }: { severity: string; label: string }) {
  const cls: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 ring-red-200', high: 'bg-orange-100 text-orange-800 ring-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 ring-yellow-200', low: 'bg-blue-100 text-blue-800 ring-blue-200',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${cls[severity] ?? cls.low}`}>{label}</span>;
}

export function StatusDot({ status }: { status: 'operational' | 'partial' | 'offline' }) {
  const cls = status === 'operational' ? 'bg-green-500' : status === 'partial' ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status !== 'operational' && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-60 ${cls}`} />}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${cls}`} />
    </span>
  );
}

export function LinkBadge({ link, labels }: { link: LinkStatus; labels: { connected: string; intermittent: string; offline: string } }) {
  const cls = link === 'connected' ? 'text-green-600' : link === 'intermittent' ? 'text-yellow-600' : 'text-red-600';
  const Icon = link === 'offline' ? WifiOff : Wifi;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${cls}`}>
      <Icon size={12} /> {labels[link]}
    </span>
  );
}

export function Pill({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'orange' }) {
  const cls: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700', green: 'bg-green-100 text-green-700', red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-800', blue: 'bg-blue-100 text-blue-700', purple: 'bg-purple-100 text-purple-700', orange: 'bg-orange-100 text-orange-700',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${cls[tone]}`}>{children}</span>;
}

// ---------------------------------------------------------------------------
// Barres de progression
// ---------------------------------------------------------------------------

export function Bar({ value, tone, height = 'h-1.5' }: { value: number; tone: 'battery' | 'water' | 'auto'; height?: string }) {
  const color = tone === 'water'
    ? value > 50 ? 'bg-blue-500' : value > 25 ? 'bg-yellow-500' : 'bg-red-500'
    : value > 60 ? 'bg-green-500' : value > 30 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className={`w-full ${height} bg-gray-100 rounded-full overflow-hidden`}>
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Événements
// ---------------------------------------------------------------------------

export const EVENT_ICONS: Record<EventKind, LucideIcon> = {
  sensor: Activity, alert: AlertTriangle, sms: MessageSquare, maintenance: Wrench, prediction: Brain,
  ack: CheckCircle2, system: Server, coldchain: Thermometer, water: Droplets,
};

export function EventRow({ ev, lang, compact = false }: { ev: PlatformEvent; lang: 'fr' | 'en'; compact?: boolean }) {
  const Icon = EVENT_ICONS[ev.kind];
  const tone = ev.severity === 'critical' ? 'bg-red-100 text-red-600' : ev.severity === 'warning' ? 'bg-orange-100 text-orange-600' :
    ev.severity === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-unicef-blue';
  const time = new Date(ev.at).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Ouagadougou' });
  return (
    <div className={`flex items-start gap-3 ${compact ? 'py-2' : 'p-3 bg-gray-50 rounded-lg'}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${tone}`}><Icon size={14} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800 leading-snug">{ev.title[lang]}</p>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400">
          <span className="font-mono">{time}</span>
          {ev.actor && <span>· {ev.actor}</span>}
          {ev.detail && <span>· {ev.detail[lang]}</span>}
        </div>
      </div>
    </div>
  );
}

export function SectionTitle({ icon: Icon, children, right }: { icon?: LucideIcon; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        {Icon && <Icon size={16} className="text-unicef-blue" />}
        {children}
      </h3>
      {right}
    </div>
  );
}
