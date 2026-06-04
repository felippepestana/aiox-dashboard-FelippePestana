'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { Deadline, DeadlineType, DeadlineStatus } from '@/types/legal';

// ─── Color config by type ─────────────────────────────────────────────────────

const typeConfig: Record<DeadlineType, { dot: string; bg: string; text: string; label: string }> = {
  fatal:     { dot: 'bg-red-500',     bg: 'bg-red-500/15 hover:bg-red-500/25',      text: 'text-red-400',     label: 'Fatal'     },
  judicial:  { dot: 'bg-blue-500',    bg: 'bg-blue-500/15 hover:bg-blue-500/25',    text: 'text-blue-400',    label: 'Judicial'  },
  internal:  { dot: 'bg-gray-500',    bg: 'bg-gray-500/15 hover:bg-gray-500/25',    text: 'text-gray-400',    label: 'Interno'   },
  hearing:   { dot: 'bg-purple-500',  bg: 'bg-purple-500/15 hover:bg-purple-500/25',text: 'text-purple-400',  label: 'Audiencia' },
  mediation: { dot: 'bg-emerald-500', bg: 'bg-emerald-500/15 hover:bg-emerald-500/25', text: 'text-emerald-400', label: 'Mediacao' },
};

const statusIcon: Record<DeadlineStatus, { icon: typeof Clock; className: string; label: string }> = {
  pending:   { icon: Clock,        className: 'text-yellow-400', label: 'Pendente'  },
  completed: { icon: CheckCircle2, className: 'text-green-400',  label: 'Concluido' },
  missed:    { icon: XCircle,      className: 'text-red-400',    label: 'Perdido'   },
  extended:  { icon: Clock,        className: 'text-blue-400',   label: 'Prorrogado'},
};

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DeadlineCalendarProps {
  deadlines: Deadline[];
  processMap?: Record<string, string>; // processId -> CNJ number
  onComplete?: (id: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DeadlineCalendar({ deadlines, processMap = {}, onComplete }: DeadlineCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [calMonth, setCalMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });

  // Selected day panel
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const firstDayOfWeek = new Date(calMonth.year, calMonth.month, 1).getDay();

  function prevMonth() {
    setCalMonth((prev) => {
      const m = prev.month - 1;
      if (m < 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: m };
    });
    setSelectedDay(null);
  }

  function nextMonth() {
    setCalMonth((prev) => {
      const m = prev.month + 1;
      if (m > 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: m };
    });
    setSelectedDay(null);
  }

  function goToday() {
    setCalMonth({ year: today.getFullYear(), month: today.getMonth() });
    setSelectedDay(today.getDate());
  }

  function getDeadlinesForDay(day: number): Deadline[] {
    const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return deadlines.filter((d) => d.dueDate.startsWith(dateStr));
  }

  function isOverdue(d: Deadline): boolean {
    if (d.status === 'completed' || d.status === 'missed') return false;
    const due = new Date(d.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function getDaysUntil(dateStr: string): number {
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Deadline counts for the month (for summary)
  const monthSummary = useMemo(() => {
    const monthPrefix = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}`;
    const monthDeadlines = deadlines.filter((d) => d.dueDate.startsWith(monthPrefix));
    return {
      total: monthDeadlines.length,
      fatal: monthDeadlines.filter((d) => d.type === 'fatal').length,
      pending: monthDeadlines.filter((d) => d.status === 'pending').length,
      overdue: monthDeadlines.filter((d) => isOverdue(d)).length,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlines, calMonth]);

  const selectedDeadlines = selectedDay !== null ? getDeadlinesForDay(selectedDay) : [];
  const isCurrentMonth =
    calMonth.year === today.getFullYear() && calMonth.month === today.getMonth();

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {(Object.keys(typeConfig) as DeadlineType[]).map((type) => (
          <div key={type} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${typeConfig[type].dot}`} />
            <span className="text-[11px] text-[#6b7a8d]">{typeConfig[type].label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <AlertTriangle className="h-3 w-3 text-red-400" />
          <span className="text-[11px] text-[#6b7a8d]">Atrasado</span>
        </div>
      </div>

      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a2332]">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="rounded-lg border border-[#1a2332] p-2 text-[#6b7a8d] hover:text-white hover:border-[#2a3342] transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextMonth}
              className="rounded-lg border border-[#1a2332] p-2 text-[#6b7a8d] hover:text-white hover:border-[#2a3342] transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <h2 className="text-lg font-semibold text-white">
            {MONTH_NAMES[calMonth.month]} {calMonth.year}
          </h2>

          <div className="flex items-center gap-2">
            {/* Monthly stats */}
            <div className="hidden md:flex items-center gap-3 text-xs text-[#6b7a8d] mr-2">
              <span className="text-white font-medium">{monthSummary.total}</span> prazos
              {monthSummary.overdue > 0 && (
                <span className="text-red-400 font-medium">
                  {monthSummary.overdue} atrasados
                </span>
              )}
            </div>
            {!isCurrentMonth && (
              <button
                onClick={goToday}
                className="rounded-lg border border-[#1a2332] px-3 py-1.5 text-xs text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/30 transition-colors"
              >
                Hoje
              </button>
            )}
          </div>
        </div>

        {/* Day name headers */}
        <div className="grid grid-cols-7 border-b border-[#1a2332]">
          {DAY_LABELS.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-[#4a5568] py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-[#1a2332]">
          {/* Empty leading cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-28 bg-[#080c14] p-1.5" />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayDeadlines = getDeadlinesForDay(day);
            const isToday =
              isCurrentMonth && today.getDate() === day;
            const isSelected = selectedDay === day;
            const hasOverdue = dayDeadlines.some((d) => isOverdue(d));

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className={`h-28 bg-[#0d1320] p-1.5 cursor-pointer transition-colors ${
                  isSelected
                    ? 'ring-1 ring-inset ring-amber-500/50 bg-amber-500/5'
                    : 'hover:bg-[#0f1826]'
                }`}
              >
                {/* Day number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium ${
                      isToday
                        ? 'bg-amber-500 text-black font-bold'
                        : isSelected
                        ? 'text-amber-400'
                        : 'text-[#6b7a8d]'
                    }`}
                  >
                    {day}
                  </span>
                  {hasOverdue && (
                    <AlertTriangle className="h-3 w-3 text-red-400 flex-shrink-0" />
                  )}
                </div>

                {/* Deadline pills */}
                <div className="space-y-0.5 overflow-hidden">
                  {dayDeadlines.slice(0, 3).map((dl) => {
                    const overdue = isOverdue(dl);
                    const conf = typeConfig[dl.type];
                    return (
                      <div
                        key={dl.id}
                        className={`rounded px-1 py-0.5 text-[9px] font-medium truncate leading-tight ${
                          overdue
                            ? 'bg-red-500/20 text-red-300 line-through opacity-70'
                            : dl.status === 'completed'
                            ? 'bg-green-500/10 text-green-400 line-through opacity-60'
                            : conf.bg + ' ' + conf.text
                        }`}
                        title={dl.title}
                      >
                        <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1 ${conf.dot}`} />
                        {dl.title}
                      </div>
                    );
                  })}
                  {dayDeadlines.length > 3 && (
                    <div className="text-[9px] text-[#4a5568] px-1">
                      +{dayDeadlines.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Detail Panel */}
      {selectedDay !== null && (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a2332]">
            <h3 className="text-base font-semibold text-white">
              {selectedDay} de {MONTH_NAMES[calMonth.month]} {calMonth.year}
            </h3>
            <button
              onClick={() => setSelectedDay(null)}
              className="text-[#6b7a8d] hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedDeadlines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-[#6b7a8d]">
              <Clock className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhum prazo neste dia</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1a2332]">
              {selectedDeadlines.map((dl) => {
                const overdue = isOverdue(dl);
                const conf = typeConfig[dl.type];
                const statusConf = statusIcon[dl.status];
                const StatusIcon = statusConf.icon;
                const days = getDaysUntil(dl.dueDate);

                return (
                  <div key={dl.id} className="flex items-center gap-4 px-6 py-4">
                    {/* Type dot */}
                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${conf.dot}`} />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-medium text-white ${dl.status === 'completed' ? 'line-through opacity-60' : ''}`}>
                          {dl.title}
                        </p>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${conf.bg} ${conf.text}`}>
                          {conf.label}
                        </span>
                        {overdue && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">
                            Atrasado
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {processMap[dl.processId] && (
                          <span className="text-xs text-[#6b7a8d] font-mono">
                            {processMap[dl.processId]}
                          </span>
                        )}
                        {dl.assignedTo && (
                          <span className="text-xs text-[#6b7a8d]">
                            Resp: {dl.assignedTo}
                          </span>
                        )}
                        {dl.notes && (
                          <span className="text-xs text-[#4a5568] italic">
                            {dl.notes}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-[#8899aa]">{formatDate(dl.dueDate)}</p>
                        <p className={`text-xs font-medium ${
                          dl.status === 'completed'
                            ? 'text-green-400'
                            : overdue
                            ? 'text-red-400'
                            : days === 0
                            ? 'text-amber-400'
                            : days <= 3
                            ? 'text-yellow-400'
                            : 'text-[#6b7a8d]'
                        }`}>
                          {dl.status === 'completed'
                            ? 'Concluido'
                            : dl.status === 'missed'
                            ? 'Perdido'
                            : overdue
                            ? `${Math.abs(days)}d atrasado`
                            : days === 0
                            ? 'Hoje'
                            : days === 1
                            ? 'Amanha'
                            : `${days} dias`}
                        </p>
                      </div>

                      <StatusIcon className={`h-4 w-4 ${statusConf.className}`} />

                      {dl.status === 'pending' && onComplete && (
                        <button
                          onClick={() => onComplete(dl.id)}
                          className="rounded-lg border border-[#1a2332] px-3 py-1.5 text-xs text-[#6b7a8d] hover:text-green-400 hover:border-green-500/30 transition-colors"
                        >
                          Concluir
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
