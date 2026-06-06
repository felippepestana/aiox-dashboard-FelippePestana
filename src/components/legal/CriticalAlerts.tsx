'use client';

// =============================================================================
// CriticalAlerts — Dashboard widget for alerts requiring immediate action
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React from 'react';
import {
  AlertTriangle,
  Clock,
  Bell,
  Calendar,
  DollarSign,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CriticalAlert {
  id: string;
  type: 'prazo_vencido' | 'prazo_hoje' | 'intimacao' | 'audiencia_amanha' | 'pagamento_atrasado';
  title: string;
  description: string;
  processId?: string;
  deadline?: string;
  action: string;
  actionHref: string;
}

export interface CriticalAlertsProps {
  alerts: CriticalAlert[];
  maxVisible?: number;
  onViewAll?: () => void;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALERT_CONFIG: Record<
  CriticalAlert['type'],
  { color: string; label: string; icon: React.ElementType; urgency: number }
> = {
  prazo_vencido:      { color: '#F87171', label: 'Prazo Vencido',     icon: AlertTriangle, urgency: 0 },
  prazo_hoje:         { color: '#FBBF24', label: 'Prazo Hoje',        icon: Clock,         urgency: 1 },
  intimacao:          { color: '#60A5FA', label: 'Intimação',         icon: Bell,          urgency: 2 },
  audiencia_amanha:   { color: '#D4AF37', label: 'Audiência Amanhã',  icon: Calendar,      urgency: 3 },
  pagamento_atrasado: { color: '#F87171', label: 'Pagamento Atrasado',icon: DollarSign,    urgency: 4 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeLabel(type: CriticalAlert['type'], deadline?: string): { text: string; color: string } {
  if (!deadline) {
    if (type === 'prazo_vencido' || type === 'pagamento_atrasado') {
      return { text: 'Vencido', color: '#F87171' };
    }
    if (type === 'prazo_hoje') {
      return { text: 'Hoje', color: '#FBBF24' };
    }
    return { text: '', color: '#718096' };
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const dl = new Date(deadline + 'T00:00:00');
  const diffMs = dl.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { text: `Vencido há ${Math.abs(diffDays)} dia${Math.abs(diffDays) !== 1 ? 's' : ''}`, color: '#F87171' };
  }
  if (diffDays === 0) {
    return { text: 'Vence hoje', color: '#FBBF24' };
  }
  if (diffDays === 1) {
    return { text: 'Vence amanhã', color: '#FBBF24' };
  }
  return {
    text: `${diffDays} dias restantes`,
    color: diffDays <= 3 ? '#FBBF24' : '#718096',
  };
}

// ─── Alert Card ───────────────────────────────────────────────────────────────

interface AlertCardProps {
  alert: CriticalAlert;
}

function AlertCard({ alert }: AlertCardProps) {
  const config = ALERT_CONFIG[alert.type];
  const { color, label, icon: Icon } = config;
  const timeInfo = getTimeLabel(alert.type, alert.deadline);

  return (
    <div
      className={cn(
        'rounded-lg p-3 flex gap-3 items-start cursor-default',
        'transition-colors duration-200',
        'bg-[#0a1628] hover:bg-[rgba(192,192,192,0.04)]'
      )}
      style={{ borderLeft: `3px solid ${color}` }}
      role="listitem"
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-full mt-0.5"
        style={{
          width: 32,
          height: 32,
          backgroundColor: `${color}1f`,
        }}
      >
        <Icon size={14} style={{ color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-white leading-tight truncate">
            {alert.title}
          </p>
          <span
            className="text-[10px] font-medium shrink-0 px-1.5 py-0.5 rounded"
            style={{
              color: color,
              background: `${color}18`,
            }}
          >
            {label}
          </span>
        </div>

        <p className="text-xs text-[#A0AEC0] mt-0.5 line-clamp-2">
          {alert.description}
        </p>

        {alert.processId && (
          <p className="text-[10px] text-[#718096] mt-0.5 truncate">
            Processo: {alert.processId}
          </p>
        )}

        <div className="flex items-center justify-between mt-1.5 gap-2">
          {timeInfo.text && (
            <span className="text-[10px] font-medium" style={{ color: timeInfo.color }}>
              {timeInfo.text}
            </span>
          )}
          <a
            href={alert.actionHref}
            className="text-[11px] flex items-center gap-0.5 transition-colors ml-auto"
            style={{ color: '#D4AF37' }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            {alert.action}
            <ChevronRight size={11} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CriticalAlerts({
  alerts,
  maxVisible = 5,
  onViewAll,
  className,
}: CriticalAlertsProps) {
  const [showAll, setShowAll] = React.useState(false);

  // Sort by urgency (lower urgency number = more urgent)
  const sorted = React.useMemo(
    () => [...alerts].sort((a, b) => ALERT_CONFIG[a.type].urgency - ALERT_CONFIG[b.type].urgency),
    [alerts]
  );

  const visible = showAll ? sorted : sorted.slice(0, maxVisible);
  const overflow = sorted.length - maxVisible;
  const hasAlerts = alerts.length > 0;

  return (
    <div
      className={cn(
        'bg-[#0d1f3c] rounded-xl border border-[rgba(192,192,192,0.10)] p-4',
        className
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-[#F87171]" />
          <span className="text-sm font-medium text-white">Alertas Críticos</span>
          {hasAlerts && (
            <span
              className="flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[11px] font-semibold animate-pulse"
              style={{
                backgroundColor: 'rgba(248,113,113,0.15)',
                color: '#F87171',
              }}
            >
              {alerts.length}
            </span>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-[rgba(192,192,192,0.08)] mb-3" />

      {/* ── Content ── */}
      {hasAlerts ? (
        <>
          <div className="flex flex-col gap-2" role="list">
            {visible.map(alert => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>

          {/* Overflow / View All */}
          {!showAll && overflow > 0 && (
            <button
              className="w-full mt-3 text-[11px] font-medium text-center py-1.5 rounded-lg transition-colors"
              style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.07)' }}
              onClick={() => {
                if (onViewAll) {
                  onViewAll();
                } else {
                  setShowAll(true);
                }
              }}
            >
              Ver todos ({sorted.length})
            </button>
          )}
          {showAll && overflow > 0 && (
            <button
              className="w-full mt-3 text-[11px] font-medium text-center py-1.5 rounded-lg transition-colors"
              style={{ color: '#718096', background: 'rgba(192,192,192,0.05)' }}
              onClick={() => setShowAll(false)}
            >
              Ver menos
            </button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div
            className="flex items-center justify-center w-12 h-12 rounded-full"
            style={{ background: 'rgba(74,222,128,0.10)' }}
          >
            <CheckCircle size={24} style={{ color: '#4ADE80' }} />
          </div>
          <p className="text-sm text-[#718096]">Nenhum alerta pendente</p>
        </div>
      )}
    </div>
  );
}

export default CriticalAlerts;
