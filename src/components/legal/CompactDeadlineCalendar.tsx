'use client';

// =============================================================================
// CompactDeadlineCalendar — Compact monthly calendar widget with deadline dots
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CalendarDeadline {
  date: string;         // ISO date string YYYY-MM-DD
  title: string;
  type: 'fatal' | 'ordinario' | 'audiencia';
  processId?: string;
}

export interface CompactDeadlineCalendarProps {
  deadlines: CalendarDeadline[];
  month?: Date;
  onDateClick?: (date: Date, deadlines: CalendarDeadline[]) => void;
  onMonthChange?: (month: Date) => void;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

// Deadline type config
const TYPE_CONFIG = {
  fatal:     { dot: 'bg-[#F87171]', color: '#F87171', label: 'Fatal'     },
  audiencia: { dot: 'bg-[#60A5FA]', color: '#60A5FA', label: 'Audiência' },
  ordinario: { dot: 'bg-[#FBBF24]', color: '#FBBF24', label: 'Ordinário' },
} as const satisfies Record<CalendarDeadline['type'], { dot: string; color: string; label: string }>;

// Priority order for dots when > 3 deadlines on same day
const TYPE_PRIORITY: CalendarDeadline['type'][] = ['fatal', 'audiencia', 'ordinario'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function sortByPriority(deadlines: CalendarDeadline[]): CalendarDeadline[] {
  return [...deadlines].sort(
    (a, b) => TYPE_PRIORITY.indexOf(a.type) - TYPE_PRIORITY.indexOf(b.type),
  );
}

// ─── Popover ─────────────────────────────────────────────────────────────────

interface PopoverProps {
  deadlines: CalendarDeadline[];
}

function DeadlinePopover({ deadlines }: PopoverProps) {
  const sorted   = sortByPriority(deadlines);
  const visible  = sorted.slice(0, 4);
  const overflow = sorted.length - 4;

  return (
    <div
      className={cn(
        'absolute top-full left-1/2 z-50 mt-1 w-48',
        '-translate-x-1/2',
        'rounded-lg border border-[rgba(192,192,192,0.15)]',
        'bg-[#0a1628] shadow-lg p-2',
        'pointer-events-none',
      )}
    >
      <div className="space-y-1.5">
        {visible.map((dl, idx) => (
          <div key={idx} className="flex items-start gap-1.5">
            <span
              className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: TYPE_CONFIG[dl.type].color }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] leading-tight text-white truncate">{dl.title}</p>
              <span
                className="text-[9px] font-medium uppercase tracking-wide"
                style={{ color: TYPE_CONFIG[dl.type].color }}
              >
                {TYPE_CONFIG[dl.type].label}
              </span>
            </div>
          </div>
        ))}
        {overflow > 0 && (
          <p className="text-[9px] text-[#718096] pl-3.5">+{overflow} mais</p>
        )}
      </div>
    </div>
  );
}

// ─── DayCell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  day: number | null;               // null = padding cell
  isToday?: boolean;
  isOutside?: boolean;
  deadlines: CalendarDeadline[];
  onClick?: () => void;
}

function DayCell({ day, isToday, isOutside, deadlines, onClick }: DayCellProps) {
  const [hovered, setHovered] = useState(false);
  const hasDeadlines = deadlines.length > 0;

  if (day === null) {
    return <div className="h-9 w-full" />;
  }

  // Pick up to 3 dots by priority
  const sorted  = sortByPriority(deadlines);
  const dotShow = sorted.slice(0, 3);

  return (
    <div className="relative flex justify-center">
      <div
        className={cn(
          'relative flex h-9 w-9 flex-col items-center justify-center',
          'rounded-md text-xs transition-colors duration-150',
          isOutside && 'opacity-50 text-[#2D3748]',
          !isOutside && !isToday && 'text-[#A0AEC0]',
          !isOutside && isToday && 'border border-[#D4AF37] font-bold text-white',
          hasDeadlines && !isOutside && 'cursor-pointer hover:bg-[rgba(192,192,192,0.06)]',
        )}
        onMouseEnter={() => hasDeadlines && setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => hasDeadlines && onClick?.()}
        aria-label={hasDeadlines ? `${day}, ${deadlines.length} prazo(s)` : String(day)}
      >
        {/* Day number */}
        <span className="leading-none">{day}</span>

        {/* Deadline dots */}
        {dotShow.length > 0 && (
          <div className="mt-0.5 flex items-center gap-0.5">
            {dotShow.map((dl, idx) => (
              <span
                key={idx}
                className={cn('h-1 w-1 rounded-full flex-shrink-0', TYPE_CONFIG[dl.type].dot)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Hover popover */}
      {hovered && hasDeadlines && (
        <DeadlinePopover deadlines={deadlines} />
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CompactDeadlineCalendar({
  deadlines,
  month,
  onDateClick,
  onMonthChange,
  className,
}: CompactDeadlineCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const initialDate = month ?? today;

  const [current, setCurrent] = useState({
    year:  initialDate.getFullYear(),
    month: initialDate.getMonth(),
  });

  const navigate = useCallback(
    (delta: -1 | 1) => {
      setCurrent((prev) => {
        let m = prev.month + delta;
        let y = prev.year;
        if (m < 0)  { m = 11; y -= 1; }
        if (m > 11) { m = 0;  y += 1; }
        const next = new Date(y, m, 1);
        onMonthChange?.(next);
        return { year: y, month: m };
      });
    },
    [onMonthChange],
  );

  // Build deadline lookup: "YYYY-MM-DD" → CalendarDeadline[]
  const deadlineMap = useMemo(() => {
    const map: Record<string, CalendarDeadline[]> = {};
    for (const dl of deadlines) {
      const key = dl.date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(dl);
    }
    return map;
  }, [deadlines]);

  const daysInMonth   = new Date(current.year, current.month + 1, 0).getDate();
  const firstWeekday  = new Date(current.year, current.month, 1).getDay();     // 0=Sun
  const isCurrentMonth =
    current.year === today.getFullYear() && current.month === today.getMonth();

  // Total cells needed (leading padding + days + trailing padding to fill grid)
  const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const cells: Array<{ day: number | null; isOutside: boolean }> = [];

  // Leading padding (days from prev month)
  for (let i = 0; i < firstWeekday; i++) {
    const prevMonthDays = new Date(current.year, current.month, 0).getDate();
    cells.push({ day: prevMonthDays - firstWeekday + 1 + i, isOutside: true });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isOutside: false });
  }

  // Trailing padding (days from next month)
  let nextDay = 1;
  while (cells.length < totalCells) {
    cells.push({ day: nextDay++, isOutside: true });
  }

  function getDeadlines(cellDay: number | null, outside: boolean): CalendarDeadline[] {
    if (cellDay === null || outside) return [];
    const key = isoDate(current.year, current.month, cellDay);
    return deadlineMap[key] ?? [];
  }

  function handleDayClick(day: number) {
    const date       = new Date(current.year, current.month, day);
    const dayKey     = isoDate(current.year, current.month, day);
    const dayDeadlines = deadlineMap[dayKey] ?? [];
    onDateClick?.(date, dayDeadlines);
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-[rgba(192,192,192,0.10)] bg-[#0d1f3c] p-4',
        'max-w-[320px]',
        className,
      )}
    >
      {/* ── Month navigation ─────────────────────────────────── */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-[#A0AEC0] hover:text-[#C0C0C0] transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-sm font-medium text-white">
          {MONTH_NAMES[current.month]} {current.year}
        </span>

        <button
          onClick={() => navigate(1)}
          className="text-[#A0AEC0] hover:text-[#C0C0C0] transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* ── Day-of-week header ───────────────────────────────── */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] uppercase tracking-wider text-[#718096]"
          >
            {label}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((cell, idx) => {
          const isToday =
            !cell.isOutside &&
            isCurrentMonth &&
            cell.day === today.getDate();

          return (
            <DayCell
              key={idx}
              day={cell.day}
              isToday={isToday}
              isOutside={cell.isOutside}
              deadlines={getDeadlines(cell.day, cell.isOutside)}
              onClick={
                cell.day !== null && !cell.isOutside
                  ? () => handleDayClick(cell.day as number)
                  : undefined
              }
            />
          );
        })}
      </div>

      {/* ── Legend ───────────────────────────────────────────── */}
      <div className="mt-3 flex items-center gap-4 border-t border-[rgba(192,192,192,0.06)] pt-3">
        {(Object.keys(TYPE_CONFIG) as CalendarDeadline['type'][]).map((type) => (
          <div key={type} className="flex items-center gap-1">
            <span
              className={cn('h-2 w-2 rounded-full flex-shrink-0', TYPE_CONFIG[type].dot)}
            />
            <span className="text-[10px] text-[#718096]">{TYPE_CONFIG[type].label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
