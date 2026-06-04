'use client';

import { useState, useMemo } from 'react';
import {
  Clock,
  CalendarDays,
  List,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  Save,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import type { DeadlineType, DeadlineStatus } from '@/types/legal';
import { ExportPDFButton } from '@/components/legal/ExportPDFButton';
import { DeadlineCalendar } from '@/components/legal/DeadlineCalendar';
import {
  PageHeader,
  StatCardGrid,
  FilterBar,
  EmptyState,
} from '@/components/legal/shared';
import type { FilterValues } from '@/components/legal/shared';

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

  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    type: '',
    status: '',
  });

  const sortedDeadlines = useMemo(() => {
    return [...deadlines].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
  }, [deadlines]);

  const filteredDeadlines = useMemo(() => {
    return sortedDeadlines.filter((d) => {
      if (filterValues.type && d.type !== filterValues.type) return false;
      if (filterValues.status && d.status !== filterValues.status) return false;
      if (filterValues.search) {
        const q = filterValues.search.toLowerCase();
        const process = getProcessById(d.processId);
        if (
          !d.title.toLowerCase().includes(q) &&
          !(process?.cnj || '').toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [sortedDeadlines, filterValues, getProcessById]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const overdueCount = useMemo(() =>
    deadlines.filter((d) => d.status === 'pending' && new Date(d.dueDate) < now).length,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [deadlines]);

  const todayCount = useMemo(() => {
    const todayStr = now.toDateString();
    return deadlines.filter(
      (d) => d.status === 'pending' && new Date(d.dueDate).toDateString() === todayStr
    ).length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlines]);

  const next7Days = useMemo(() => {
    const end = new Date(now);
    end.setDate(end.getDate() + 7);
    return deadlines.filter(
      (d) =>
        d.status === 'pending' &&
        new Date(d.dueDate) >= now &&
        new Date(d.dueDate) <= end
    ).length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadlines]);

  const pendingCount = deadlines.filter((d) => d.status === 'pending').length;

  const statCards = [
    {
      label: 'Total Prazos',
      value: deadlines.length,
      icon: <CalendarClock className="h-5 w-5" />,
      color: '#D4AF37',
    },
    {
      label: 'Vencidos',
      value: overdueCount,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: '#F87171',
    },
    {
      label: 'Hoje',
      value: todayCount,
      icon: <Clock className="h-5 w-5" />,
      color: '#FBBF24',
    },
    {
      label: 'Próximos 7 Dias',
      value: next7Days,
      icon: <CalendarDays className="h-5 w-5" />,
      color: '#34D399',
    },
  ];

  const filterConfigs = [
    {
      type: 'search' as const,
      key: 'search',
      placeholder: 'Buscar prazo ou CNJ...',
    },
    {
      type: 'select' as const,
      key: 'type',
      label: 'Todos os Tipos',
      options: DEADLINE_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    {
      type: 'select' as const,
      key: 'status',
      label: 'Todos os Status',
      options: [
        { value: 'pending', label: 'Pendente' },
        { value: 'completed', label: 'Concluído' },
        { value: 'missed', label: 'Perdido' },
        { value: 'extended', label: 'Prorrogado' },
      ],
    },
  ];

  function getDaysUntil(dateStr: string): number {
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

  const viewToggle = (
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
  );

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      <PageHeader
        title="Prazos"
        subtitle={`${pendingCount} prazos pendentes`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Prazos', href: '/legal/deadlines' },
        ]}
        actions={
          <>
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
            {viewToggle}
          </>
        }
      />

      <StatCardGrid cards={statCards} />

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
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Contestação - Processo CNJ..."
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Tipo *</label>
              <select
                value={form.type}
                onChange={(e) => setForm(f => ({ ...f, type: e.target.value as DeadlineType }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                {DEADLINE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Data de Vencimento *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Processo</label>
              <select
                value={form.processId}
                onChange={(e) => setForm(f => ({ ...f, processId: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Selecionar processo...</option>
                {processes.filter(p => p.status === 'active').map((p) => (
                  <option key={p.id} value={p.id}>{p.cnj} — {p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Responsável</label>
              <input
                type="text"
                value={form.assignedTo}
                onChange={(e) => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                placeholder="Dr. Nome"
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Observações</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notas..."
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#1a2332]">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
            >
              Cancelar
            </button>
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
        <>
          <FilterBar
            filters={filterConfigs}
            values={filterValues}
            onFilterChange={(key, value) =>
              setFilterValues((prev) => ({ ...prev, [key]: value }))
            }
            onClear={() => setFilterValues({ search: '', type: '', status: '' })}
          />

          <div className="space-y-3">
            {filteredDeadlines.length === 0 ? (
              <EmptyState
                icon={<Clock className="h-8 w-8" />}
                title="Nenhum prazo encontrado"
                description="Cadastre o primeiro prazo para começar."
                action={{ label: 'Novo Prazo', onClick: () => setShowForm(true) }}
              />
            ) : (
              filteredDeadlines.map((deadline) => {
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
        </>
      )}

      {/* Calendar View */}
      {view === 'calendar' && (
        <DeadlineCalendar
          deadlines={deadlines}
          processMap={processMap}
          onComplete={completeDeadline}
        />
      )}
    </div>
  );
}
