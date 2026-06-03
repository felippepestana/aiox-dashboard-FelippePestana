'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  CalendarDays,
  List,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Save,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import type { DeadlineType, DeadlineStatus } from '@/types/legal';
import { ExportPDFButton } from '@/components/legal/ExportPDFButton';

const deadlineTypeBadge: Record<DeadlineType, { className: string; label: string }> = {
  fatal: { className: 'bg-red-500/10 text-red-400', label: 'Fatal' },
  judicial: { className: 'bg-blue-500/10 text-blue-400', label: 'Judicial' },
  internal: { className: 'bg-gray-500/10 text-gray-400', label: 'Interno' },
  hearing: { className: 'bg-purple-500/10 text-purple-400', label: 'Audiencia' },
  mediation: { className: 'bg-emerald-500/10 text-emerald-400', label: 'Mediacao' },
};

const deadlineStatusIcon: Record<DeadlineStatus, { icon: typeof Clock; className: string }> = {
  pending: { icon: Clock, className: 'text-yellow-400' },
  completed: { icon: CheckCircle2, className: 'text-green-400' },
  missed: { icon: XCircle, className: 'text-red-400' },
  extended: { icon: Clock, className: 'text-blue-400' },
};

const DEADLINE_TYPES: { value: DeadlineType; label: string }[] = [
  { value: 'fatal', label: 'Fatal' },
  { value: 'judicial', label: 'Judicial' },
  { value: 'internal', label: 'Interno' },
  { value: 'hearing', label: 'Audiência' },
  { value: 'mediation', label: 'Mediação' },
];

export default function DeadlinesPage() {
  const { deadlines, processes, getProcessById, completeDeadline, addDeadline } = useLegalStore();

  const processMap = useMemo(() => {
    const map: Record<string, string> = {};
    processes.forEach((p) => { map[p.id] = p.cnj; });
    return map;
  }, [processes]);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    type: 'judicial' as DeadlineType,
    processId: '',
    dueDate: '',
    assignedTo: '',
    notes: '',
  });
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const sortedDeadlines = useMemo(() => {
    return [...deadlines].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [deadlines]);

  function getDaysUntil(dateStr: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function getDateColor(dateStr: string, status: DeadlineStatus): string {
    if (status === 'completed') return 'border-l-green-500';
    if (status === 'missed') return 'border-l-red-500';
    const days = getDaysUntil(dateStr);
    if (days < 0) return 'border-l-red-500';
    if (days <= 3) return 'border-l-yellow-500';
    return 'border-l-green-500';
  }

  function getDateTextColor(dateStr: string, status: DeadlineStatus): string {
    if (status === 'completed') return 'text-green-400';
    if (status === 'missed') return 'text-red-400';
    const days = getDaysUntil(dateStr);
    if (days < 0) return 'text-red-400';
    if (days <= 3) return 'text-yellow-400';
    return 'text-green-400';
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function formatDateShort(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  }

  // Calendar helpers
  function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }

  function getFirstDayOfMonth(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  function getDeadlinesForDay(year: number, month: number, day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return deadlines.filter((d) => d.dueDate.startsWith(dateStr));
  }

  const daysInMonth = getDaysInMonth(calendarMonth.year, calendarMonth.month);
  const firstDay = getFirstDayOfMonth(calendarMonth.year, calendarMonth.month);

  function prevMonth() {
    setCalendarMonth((prev) => {
      const m = prev.month - 1;
      if (m < 0) return { year: prev.year - 1, month: 11 };
      return { ...prev, month: m };
    });
  }

  function nextMonth() {
    setCalendarMonth((prev) => {
      const m = prev.month + 1;
      if (m > 11) return { year: prev.year + 1, month: 0 };
      return { ...prev, month: m };
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Clock className="h-7 w-7 text-amber-400" />
            Prazos
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            {deadlines.filter((d) => d.status === 'pending').length} prazos pendentes
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <ExportPDFButton
            type="deadlines"
            data={{ deadlines: sortedDeadlines, processMap, title: 'Agenda de Prazos' }}
            label="Exportar PDF"
          />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" /> Novo Prazo
          </button>

        <div className="flex items-center gap-1 rounded-lg border border-[#1a2332] bg-[#0d1320] p-1">
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
              view === 'list'
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-[#6b7a8d] hover:text-white'
            }`}
          >
            <List className="h-4 w-4" />
            Lista
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
              view === 'calendar'
                ? 'bg-amber-500/10 text-amber-400'
                : 'text-[#6b7a8d] hover:text-white'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendario
          </button>
        </div>
        </div>
      </div>

      {/* New Deadline Form */}
      {showForm && (
        <div className="rounded-xl border border-amber-500/20 bg-[#0d1320] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Novo Prazo</h2>
            <button onClick={() => setShowForm(false)} className="text-[#6b7a8d] hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Título *</label>
              <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Contestação - Processo CNJ..."
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Tipo *</label>
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as DeadlineType }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
                {DEADLINE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Data de Vencimento *</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Processo</label>
              <select value={form.processId} onChange={(e) => setForm(f => ({ ...f, processId: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
                <option value="">Selecionar processo...</option>
                {processes.filter(p => p.status === 'active').map((p) => (
                  <option key={p.id} value={p.id}>{p.cnj} — {p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Responsável</label>
              <input type="text" value={form.assignedTo} onChange={(e) => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                placeholder="Dr. Nome"
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Observações</label>
              <input type="text" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notas..."
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#1a2332]">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors">Cancelar</button>
            <button
              onClick={() => {
                if (!form.title.trim() || !form.dueDate) return;
                addDeadline({
                  processId: form.processId,
                  title: form.title.trim(),
                  type: form.type,
                  dueDate: new Date(form.dueDate).toISOString(),
                  reminderDays: [3, 1],
                  status: 'pending',
                  assignedTo: form.assignedTo,
                  notes: form.notes,
                });
                setForm({ title: '', type: 'judicial', processId: '', dueDate: '', assignedTo: '', notes: '' });
                setShowForm(false);
              }}
              disabled={!form.title.trim() || !form.dueDate}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" /> Salvar
            </button>
          </div>
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="space-y-3">
          {sortedDeadlines.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] py-16">
              <Clock className="h-12 w-12 text-[#6b7a8d] mb-3" />
              <p className="text-[#6b7a8d] text-sm">Nenhum prazo cadastrado</p>
            </div>
          ) : (
            sortedDeadlines.map((deadline) => {
              const process = getProcessById(deadline.processId);
              const days = getDaysUntil(deadline.dueDate);
              const statusInfo = deadlineStatusIcon[deadline.status];
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={deadline.id}
                  className={`flex items-center gap-4 rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 border-l-4 ${getDateColor(
                    deadline.dueDate,
                    deadline.status
                  )}`}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0a0f1a]">
                    <StatusIcon className={`h-5 w-5 ${statusInfo.className}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">
                        {deadline.title}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          deadlineTypeBadge[deadline.type].className
                        }`}
                      >
                        {deadlineTypeBadge[deadline.type].label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {process && (
                        <span className="text-xs text-[#6b7a8d] font-mono">
                          {process.cnj}
                        </span>
                      )}
                      {deadline.assignedTo && (
                        <span className="text-xs text-[#6b7a8d]">
                          Resp: {deadline.assignedTo}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-sm font-medium ${getDateTextColor(
                        deadline.dueDate,
                        deadline.status
                      )}`}
                    >
                      {formatDate(deadline.dueDate)}
                    </p>
                    <p className="text-xs text-[#6b7a8d]">
                      {deadline.status === 'completed'
                        ? 'Concluido'
                        : deadline.status === 'missed'
                        ? 'Perdido'
                        : days < 0
                        ? `${Math.abs(days)} dias atrasado`
                        : days === 0
                        ? 'Hoje'
                        : days === 1
                        ? 'Amanha'
                        : `${days} dias`}
                    </p>
                  </div>

                  {deadline.status === 'pending' && (
                    <button
                      onClick={() => completeDeadline(deadline.id)}
                      className="flex-shrink-0 rounded-lg border border-[#1a2332] px-3 py-1.5 text-xs text-[#6b7a8d] hover:text-green-400 hover:border-green-500/30 transition-colors"
                    >
                      Concluir
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={prevMonth}
              className="rounded-lg border border-[#1a2332] p-2 text-[#6b7a8d] hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold text-white">
              {monthNames[calendarMonth.month]} {calendarMonth.year}
            </h2>
            <button
              onClick={nextMonth}
              className="rounded-lg border border-[#1a2332] p-2 text-[#6b7a8d] hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-[#6b7a8d] py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 rounded-lg bg-[#0a0f1a]/50" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayDeadlines = getDeadlinesForDay(
                calendarMonth.year,
                calendarMonth.month,
                day
              );
              const today = new Date();
              const isToday =
                today.getFullYear() === calendarMonth.year &&
                today.getMonth() === calendarMonth.month &&
                today.getDate() === day;

              return (
                <div
                  key={day}
                  className={`h-24 rounded-lg border p-1.5 overflow-hidden ${
                    isToday
                      ? 'border-amber-500/30 bg-amber-500/5'
                      : 'border-[#1a2332] bg-[#0a0f1a]'
                  }`}
                >
                  <span
                    className={`text-xs font-medium ${
                      isToday ? 'text-amber-400' : 'text-[#6b7a8d]'
                    }`}
                  >
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayDeadlines.slice(0, 2).map((dl) => (
                      <div
                        key={dl.id}
                        className={`rounded px-1 py-0.5 text-[10px] truncate ${
                          dl.status === 'completed'
                            ? 'bg-green-500/10 text-green-400'
                            : dl.type === 'fatal'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {dl.title}
                      </div>
                    ))}
                    {dayDeadlines.length > 2 && (
                      <div className="text-[10px] text-[#6b7a8d] px-1">
                        +{dayDeadlines.length - 2} mais
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
