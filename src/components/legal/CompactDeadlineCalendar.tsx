'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface CalendarDeadline {
  date: string;
  title: string;
  type: 'fatal' | 'ordinario' | 'audiencia';
  processId: string;
}

export interface CompactDeadlineCalendarProps {
  deadlines: CalendarDeadline[];
  month?: Date;
  onDeadlineClick?: (deadline: CalendarDeadline) => void;
  onMonthChange?: (date: Date) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const TYPE_COLORS: Record<CalendarDeadline['type'], string> = {
  fatal: '#F87171',
  ordinario: '#FBBF24',
  audiencia: '#60A5FA',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getMonthDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days: (Date | null)[] = [];

  // Add empty cells for days before the first of the month
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push(null);
  }

  // Add all days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Fill remaining cells to complete the grid (6 rows)
  while (days.length < 42) {
    days.push(null);
  }

  return days;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CompactDeadlineCalendar({
  deadlines,
  month,
  onDeadlineClick,
  onMonthChange,
}: CompactDeadlineCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(month || new Date());
  const [hoveredDay, setHoveredDay] = useState<Date | null>(null);

  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  const days = useMemo(
    () => getMonthDays(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  );

  const deadlinesByDate = useMemo(() => {
    const map = new Map<string, CalendarDeadline[]>();
    deadlines.forEach((deadline) => {
      const key = deadline.date.split('T')[0];
      const existing = map.get(key) || [];
      existing.push(deadline);
      map.set(key, existing);
    });
    return map;
  }, [deadlines]);

  const navigateMonth = (direction: -1 | 1) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + direction);
    setCurrentMonth(newMonth);
    onMonthChange?.(newMonth);
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now);
    onMonthChange?.(now);
  };

  const getDeadlinesForDay = (date: Date): CalendarDeadline[] => {
    const key = date.toISOString().split('T')[0];
    return deadlinesByDate.get(key) || [];
  };

  return (
    <div className="bg-[#0d1f3c] border border-[rgba(192,192,192,0.10)] rounded-xl p-4 max-w-[320px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-1 rounded hover:bg-[rgba(192,192,192,0.08)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#C0C0C0]" />
        </button>

        <button
          onClick={goToToday}
          className="text-sm font-medium text-white capitalize hover:text-[#D4AF37] transition-colors"
        >
          {formatMonthYear(currentMonth)}
        </button>

        <button
          onClick={() => navigateMonth(1)}
          className="p-1 rounded hover:bg-[rgba(192,192,192,0.08)] transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[#C0C0C0]" />
        </button>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] text-[#718096] font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={index} className="w-9 h-9" />;
          }

          const isToday = isSameDay(date, today);
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const dayDeadlines = getDeadlinesForDay(date);
          const isHovered = hoveredDay && isSameDay(date, hoveredDay);

          return (
            <div
              key={index}
              className="relative"
              onMouseEnter={() => setHoveredDay(date)}
              onMouseLeave={() => setHoveredDay(null)}
            >
              <button
                className={cn(
                  'w-9 h-9 flex flex-col items-center justify-center rounded transition-all duration-150',
                  isCurrentMonth ? 'text-white' : 'text-[#2D3748] opacity-50',
                  isToday && 'border border-[#D4AF37] font-bold',
                  !isToday && 'hover:bg-[rgba(192,192,192,0.08)]'
                )}
              >
                <span className="text-xs">{date.getDate()}</span>

                {/* Deadline dots */}
                {dayDeadlines.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayDeadlines.slice(0, 3).map((deadline, i) => (
                      <div
                        key={i}
                        className="w-1 h-1 rounded-full"
                        style={{ backgroundColor: TYPE_COLORS[deadline.type] }}
                      />
                    ))}
                  </div>
                )}
              </button>

              {/* Popover on hover */}
              {isHovered && dayDeadlines.length > 0 && (
                <div className="absolute z-20 left-1/2 -translate-x-1/2 top-full mt-1 w-48 bg-[#0a1628] border border-[rgba(192,192,192,0.15)] rounded-lg shadow-lg p-2">
                  <p className="text-[10px] text-[#718096] mb-1.5 uppercase tracking-wider">
                    {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-refined">
                    {dayDeadlines.map((deadline, i) => (
                      <button
                        key={i}
                        onClick={() => onDeadlineClick?.(deadline)}
                        className="w-full text-left px-2 py-1 rounded hover:bg-[rgba(192,192,192,0.08)] transition-colors"
                      >
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: TYPE_COLORS[deadline.type] }}
                          />
                          <span className="text-[11px] text-white truncate">
                            {deadline.title}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-[rgba(192,192,192,0.06)]">
        {Object.entries(TYPE_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[9px] text-[#718096] capitalize">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
