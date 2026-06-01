'use client';

// =============================================================================
// DeadlineAlerts – Collapsible alert panel with urgency-sorted deadline list
// =============================================================================

import { useState } from 'react';
import Link from 'next/link';
import { Bell, ChevronDown, ChevronUp, AlertTriangle, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDeadlineAlerts } from '@/hooks/useDeadlineAlerts';
import type { DeadlineWithProcess } from '@/hooks/useDeadlineAlerts';
import type { DeadlineType } from '@/types/legal';

// ─── Type label map ──────────────────────────────────────────────────────────

const TYPE_LABELS: Record<DeadlineType, string> = {
  fatal: 'Fatal',
  judicial: 'Judicial',
  internal: 'Interno',
  hearing: 'Audiência',
  mediation: 'Mediação',
};

const TYPE_COLORS: Record<DeadlineType, string> = {
  fatal: 'bg-red-500/15 text-red-400 border-red-500/30',
  judicial: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  internal: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
  hearing: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  mediation: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

// ─── Helper: compute urgency style ──────────────────────────────────────────

interface UrgencyStyle {
  border: string;
  bg: string;
  dot: string;
  label: string;
  labelClass: string;
}

function getUrgencyStyle(d: DeadlineWithProcess): UrgencyStyle {
  if (d.daysOverdue !== undefined) {
    return {
      border: 'border-red-500/50',
      bg: 'bg-red-500/5 hover:bg-red-500/10',
      dot: 'bg-red-500',
      label: d.daysOverdue === 0 ? 'Hoje' : `${d.daysOverdue}d atrasado`,
      labelClass: 'text-red-400',
    };
  }
  if (d.daysUntil === 0) {
    return {
      border: 'border-yellow-500/60',
      bg: 'bg-yellow-500/5 hover:bg-yellow-500/10',
      dot: 'bg-yellow-400',
      label: 'Hoje',
      labelClass: 'text-yellow-400',
    };
  }
  if ((d.daysUntil ?? 99) <= 3) {
    return {
      border: 'border-yellow-500/30',
      bg: 'bg-yellow-500/5 hover:bg-yellow-500/8',
      dot: 'bg-yellow-500',
      label: `${d.daysUntil}d`,
      labelClass: 'text-yellow-400',
    };
  }
  return {
    border: 'border-[#1a2332]',
    bg: 'bg-[#0d1320] hover:bg-[#0f1929]',
    dot: 'bg-[#4a5568]',
    label: `${d.daysUntil}d`,
    labelClass: 'text-[#8899aa]',
  };
}

// ─── Single alert row ────────────────────────────────────────────────────────

function AlertRow({ deadline }: { deadline: DeadlineWithProcess }) {
  const style = getUrgencyStyle(deadline);

  return (
    <Link
      href="/legal/deadlines"
      className={cn(
        'flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors',
        style.border,
        style.bg
      )}
    >
      {/* Urgency dot */}
      <span className={cn('mt-1.5 h-2 w-2 rounded-full flex-shrink-0', style.dot)} />

      <div className="flex-1 min-w-0">
        {/* Title + type badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-white truncate">{deadline.title}</span>
          <span
            className={cn(
              'inline-flex items-center rounded border px-1 py-0 text-[9px] font-semibold uppercase leading-4',
              TYPE_COLORS[deadline.type]
            )}
          >
            {TYPE_LABELS[deadline.type]}
          </span>
        </div>

        {/* Process CNJ */}
        {deadline.process && (
          <p className="text-[10px] font-mono text-[#4a5568] mt-0.5 truncate">
            {deadline.process.cnj}
          </p>
        )}
      </div>

      {/* Days label */}
      <span className={cn('text-xs font-semibold flex-shrink-0 mt-0.5', style.labelClass)}>
        {style.label}
      </span>
    </Link>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeading({ label, count, className }: { label: string; count: number; className?: string }) {
  return (
    <p className={cn('px-1 pb-1 text-[10px] font-semibold uppercase tracking-widest', className)}>
      {label}
      <span className="ml-1.5 rounded-full px-1.5 py-0.5 bg-white/5 text-[9px]">{count}</span>
    </p>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export interface DeadlineAlertsProps {
  /** Max items to show when collapsed. Default 5 */
  previewCount?: number;
  className?: string;
}

export function DeadlineAlerts({ previewCount = 5, className }: DeadlineAlertsProps) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const { overdue, today, upcoming3, upcoming7, counts, allAlerts } = useDeadlineAlerts();

  if (allAlerts.length === 0) return null;

  const visibleAlerts = expanded ? allAlerts : allAlerts.slice(0, previewCount);
  const hasMore = allAlerts.length > previewCount;

  return (
    <div className={cn('rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden', className)}>
      {/* Panel header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-[#0f1929] transition-colors"
        aria-expanded={open}
      >
        <div className="relative flex-shrink-0">
          <Bell className="h-4 w-4 text-[#8899aa]" />
          {counts.total > 0 && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white leading-none">
              {counts.total > 9 ? '9+' : counts.total}
            </span>
          )}
        </div>

        <span className="flex-1 text-left text-xs font-semibold text-white">
          Alertas de Prazos
        </span>

        {/* Summary pills */}
        <div className="flex items-center gap-1.5 mr-1">
          {counts.overdue > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">
              <AlertTriangle className="h-2.5 w-2.5" />
              {counts.overdue}
            </span>
          )}
          {counts.today > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-500/20 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
              <Clock className="h-2.5 w-2.5" />
              {counts.today}
            </span>
          )}
        </div>

        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-[#4a5568]" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-[#4a5568]" />
        )}
      </button>

      {/* Body */}
      {open && (
        <div className="px-3 pb-3 space-y-3 border-t border-[#1a2332] pt-3">
          {/* Overdue section */}
          {counts.overdue > 0 && (
            <div>
              <SectionHeading label="Vencidos" count={counts.overdue} className="text-red-400" />
              <div className="space-y-1">
                {overdue
                  .filter((d) => visibleAlerts.includes(d))
                  .map((d) => (
                    <AlertRow key={d.id} deadline={d} />
                  ))}
              </div>
            </div>
          )}

          {/* Today section */}
          {counts.today > 0 && (
            <div>
              <SectionHeading label="Hoje" count={counts.today} className="text-yellow-400" />
              <div className="space-y-1">
                {today
                  .filter((d) => visibleAlerts.includes(d))
                  .map((d) => (
                    <AlertRow key={d.id} deadline={d} />
                  ))}
              </div>
            </div>
          )}

          {/* Upcoming 1-3 days */}
          {counts.upcoming3 > 0 && upcoming3.some((d) => visibleAlerts.includes(d)) && (
            <div>
              <SectionHeading label="Próximos 3 dias" count={counts.upcoming3} className="text-yellow-500/80" />
              <div className="space-y-1">
                {upcoming3
                  .filter((d) => visibleAlerts.includes(d))
                  .map((d) => (
                    <AlertRow key={d.id} deadline={d} />
                  ))}
              </div>
            </div>
          )}

          {/* Upcoming 4-7 days */}
          {counts.upcoming7 > 0 && upcoming7.some((d) => visibleAlerts.includes(d)) && (
            <div>
              <SectionHeading label="Esta semana" count={counts.upcoming7} className="text-[#8899aa]" />
              <div className="space-y-1">
                {upcoming7
                  .filter((d) => visibleAlerts.includes(d))
                  .map((d) => (
                    <AlertRow key={d.id} deadline={d} />
                  ))}
              </div>
            </div>
          )}

          {/* Show more / less */}
          {hasMore && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full rounded-lg border border-[#1a2332] py-1.5 text-[11px] text-[#6b7a8d] hover:text-white hover:bg-[#0f1929] transition-colors"
            >
              {expanded
                ? 'Mostrar menos'
                : `Ver todos os ${allAlerts.length} alertas`}
            </button>
          )}

          {/* Quick link */}
          <Link
            href="/legal/deadlines"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 py-1.5 text-[11px] font-medium text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            Gerenciar todos os prazos
          </Link>
        </div>
      )}
    </div>
  );
}
