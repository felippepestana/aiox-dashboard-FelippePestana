'use client';

// =============================================================================
// WeeklyAgenda — Weekly schedule widget showing events across 7 days
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgendaEvent {
  date: string;        // ISO date YYYY-MM-DD
  time?: string;       // HH:mm
  title: string;
  type: 'prazo_fatal' | 'prazo_ordinario' | 'audiencia' | 'reuniao' | 'diligencia';
  processId?: string;
  location?: string;
}

export interface WeeklyAgendaProps {
  events: AgendaEvent[];
  weekStart?: Date;
  onEventClick?: (event: AgendaEvent) => void;
  onWeekChange?: (weekStart: Date) => void;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_COLORS: Record<AgendaEvent['type'], string> = {
  prazo_fatal:    '#F87171',
  prazo_ordinario:'#FBBF24',
  audiencia:      '#60A5FA',
  reuniao:        '#D4AF37',
  diligencia:     '#4ADE80',
};

const EVENT_LABELS: Record<AgendaEvent['type'], string> = {
  prazo_fatal:     'Prazo Fatal',
  prazo_ordinario: 'Prazo',
  audiencia:       'Audiência',
  reuniao:         'Reunião',
  diligencia:      'Diligência',
};

const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns Monday of the week containing `date`. */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatMonthRange(start: Date, end: Date): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  if (start.getMonth() === end.getMonth()) {
    return `${months[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${months[start.getMonth()]} – ${months[end.getMonth()]} ${end.getFullYear()}`;
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
  event: AgendaEvent;
  onClose: () => void;
}

function EventTooltip({ event }: TooltipProps) {
  const color = EVENT_COLORS[event.type];
  return (
    <div
      className="absolute z-50 left-0 top-full mt-1 w-48 rounded-lg border shadow-xl p-2.5"
      style={{
        background: '#0a1628',
        borderColor: `${color}40`,
        boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${color}20`,
      }}
    >
      <p className="text-[11px] font-semibold text-white leading-tight mb-1 truncate">
        {event.title}
      </p>
      <p className="text-[10px] font-medium mb-1.5" style={{ color }}>
        {EVENT_LABELS[event.type]}
      </p>
      {event.time && (
        <p className="text-[10px] text-[#A0AEC0]">
          Horário: <span className="text-white">{event.time}</span>
        </p>
      )}
      {event.processId && (
        <p className="text-[10px] text-[#A0AEC0] truncate">
          Processo: <span className="text-white">{event.processId}</span>
        </p>
      )}
      {event.location && (
        <p className="text-[10px] text-[#A0AEC0] truncate">
          Local: <span className="text-white">{event.location}</span>
        </p>
      )}
    </div>
  );
}

// ─── Event Pill ───────────────────────────────────────────────────────────────

interface EventPillProps {
  event: AgendaEvent;
  onClick?: (e: AgendaEvent) => void;
}

function EventPill({ event, onClick }: EventPillProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const color = EVENT_COLORS[event.type];
  const ref = useRef<HTMLDivElement>(null);

  // Close tooltip on outside click
  useEffect(() => {
    if (!showTooltip) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowTooltip(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTooltip]);

  return (
    <div ref={ref} className="relative">
      <div
        role="button"
        tabIndex={0}
        className="flex items-center gap-1 rounded-r px-2 py-1 cursor-pointer select-none"
        style={{
          backgroundColor: `${color}1f`,
          borderLeft: `2px solid ${color}`,
        }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => {
          onClick?.(event);
          setShowTooltip(v => !v);
        }}
        onKeyDown={e => e.key === 'Enter' && onClick?.(event)}
      >
        {event.time && (
          <span className="text-[10px] shrink-0" style={{ color: `${color}cc` }}>
            {event.time}
          </span>
        )}
        <span className="text-[11px] text-white truncate leading-tight">
          {event.title}
        </span>
      </div>
      {showTooltip && (
        <EventTooltip event={event} onClose={() => setShowTooltip(false)} />
      )}
    </div>
  );
}

// ─── Day Column ───────────────────────────────────────────────────────────────

interface DayColumnProps {
  date: Date;
  events: AgendaEvent[];
  isToday: boolean;
  onEventClick?: (e: AgendaEvent) => void;
}

function DayColumn({ date, events, isToday, onEventClick }: DayColumnProps) {
  const [showAll, setShowAll] = useState(false);
  const MAX = 3;
  const dayIndex = (date.getDay() + 6) % 7; // Mon=0
  const dayName = DAY_NAMES[dayIndex];
  const dayNum = date.getDate();

  const visible = showAll ? events : events.slice(0, MAX);
  const overflow = events.length - MAX;

  return (
    <div
      className="flex flex-col gap-0.5 min-w-[120px] flex-1"
      style={isToday ? { background: 'rgba(212,175,55,0.03)', borderRadius: '8px' } : {}}
    >
      {/* Day header */}
      <div className="flex flex-col items-center pb-2 px-1">
        <span
          className="text-[10px] uppercase font-medium tracking-wider"
          style={{ color: isToday ? '#D4AF37' : '#718096' }}
        >
          {dayName}
        </span>
        <span
          className={cn(
            'text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full',
            isToday ? 'text-[#0d1f3c]' : 'text-[#A0AEC0]'
          )}
          style={isToday ? { background: '#D4AF37' } : {}}
        >
          {dayNum}
        </span>
      </div>

      {/* Events */}
      <div className="flex flex-col gap-1 px-1 pb-2">
        {visible.map((ev, i) => (
          <EventPill key={i} event={ev} onClick={onEventClick} />
        ))}
        {!showAll && overflow > 0 && (
          <button
            className="text-[10px] text-[#718096] hover:text-[#A0AEC0] text-left px-2 transition-colors"
            onClick={() => setShowAll(true)}
          >
            +{overflow} mais
          </button>
        )}
        {showAll && overflow > 0 && (
          <button
            className="text-[10px] text-[#718096] hover:text-[#A0AEC0] text-left px-2 transition-colors"
            onClick={() => setShowAll(false)}
          >
            Ver menos
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function WeeklyAgenda({
  events,
  weekStart: initialWeekStart,
  onEventClick,
  onWeekChange,
  className,
}: WeeklyAgendaProps) {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    getMondayOfWeek(initialWeekStart ?? new Date())
  );

  const today = toISODate(new Date());

  // Build 7-day range Mon → Sun
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const weekEnd = days[6];

  // Group events by date
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, AgendaEvent[]> = {};
    for (const ev of events) {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    }
    return map;
  }, [events]);

  const hasAnyEvent = days.some(d => (eventsByDate[toISODate(d)]?.length ?? 0) > 0);

  function navigate(dir: -1 | 1) {
    const next = new Date(weekStart);
    next.setDate(weekStart.getDate() + dir * 7);
    setWeekStart(next);
    onWeekChange?.(next);
  }

  function goToday() {
    const monday = getMondayOfWeek(new Date());
    setWeekStart(monday);
    onWeekChange?.(monday);
  }

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
          <CalendarDays size={16} className="text-[#D4AF37]" />
          <span className="text-sm font-medium text-white">Agenda Semanal</span>
          <span className="text-xs text-[#718096] ml-1">
            {formatMonthRange(weekStart, weekEnd)}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#A0AEC0] hover:text-white hover:bg-[rgba(192,192,192,0.06)] transition-colors"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <button
            onClick={goToday}
            className="px-2.5 py-1 rounded text-xs font-medium transition-colors"
            style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.10)' }}
          >
            Hoje
          </button>

          <button
            onClick={() => navigate(1)}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#A0AEC0] hover:text-white hover:bg-[rgba(192,192,192,0.06)] transition-colors"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-[rgba(192,192,192,0.08)] mb-4" />

      {/* ── Grid ── */}
      {hasAnyEvent ? (
        <div className="overflow-x-auto">
          <div className="flex gap-1 min-w-[840px]">
            {days.map((day, i) => (
              <DayColumn
                key={i}
                date={day}
                events={eventsByDate[toISODate(day)] ?? []}
                isToday={toISODate(day) === today}
                onEventClick={onEventClick}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <CalendarDays size={32} className="text-[#2d4a6e]" />
          <p className="text-sm text-[#718096]">Nenhum compromisso esta semana</p>
        </div>
      )}
    </div>
  );
}

export default WeeklyAgenda;
