'use client';

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  User,
  Calendar as CalendarIcon,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Appointment {
  id: string;
  patientName: string;
  patientId?: string;
  procedureType: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  professional?: string;
}

export interface AppointmentCalendarProps {
  appointments?: Appointment[];
  onCreateAppointment?: (appointment: Omit<Appointment, 'id'>) => void;
  onSelectAppointment?: (appointment: Appointment) => void;
  onGoogleSync?: () => void;
  className?: string;
}

type ViewMode = 'week' | 'day';

const HOURS = Array.from({ length: 21 }, (_, i) => {
  const hour = 8 + Math.floor(i / 2);
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${minute}`;
});

const PROCEDURE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Consulta': { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-800' },
  'Restauração': { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-800' },
  'Limpeza': { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800' },
  'Canal': { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800' },
  'Extração': { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800' },
  'Ortodontia': { bg: 'bg-pink-50', border: 'border-pink-300', text: 'text-pink-800' },
  'Implante': { bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-800' },
  'Prótese': { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-800' },
  'Avaliação': { bg: 'bg-cyan-50', border: 'border-cyan-300', text: 'text-cyan-800' },
};

const DEFAULT_COLOR = { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-800' };

const STATUS_LABELS: Record<Appointment['status'], string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em Atendimento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
};

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
}

function getDayName(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
}

function getFormattedDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function timeToSlotIndex(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h - 8) * 2 + (m >= 30 ? 1 : 0);
}

function slotDuration(start: string, end: string): number {
  return timeToSlotIndex(end) - timeToSlotIndex(start);
}

const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-1',
    patientName: 'Maria Silva Santos',
    patientId: '1',
    procedureType: 'Consulta',
    date: formatDateKey(new Date()),
    startTime: '09:00',
    endTime: '09:30',
    status: 'confirmed',
    professional: 'Dr. Sbarzi',
  },
  {
    id: 'apt-2',
    patientName: 'João Pedro Oliveira',
    patientId: '2',
    procedureType: 'Restauração',
    date: formatDateKey(new Date()),
    startTime: '10:00',
    endTime: '11:00',
    status: 'scheduled',
    professional: 'Dr. Sbarzi',
  },
  {
    id: 'apt-3',
    patientName: 'Ana Carolina Mendes',
    patientId: '3',
    procedureType: 'Ortodontia',
    date: formatDateKey(new Date()),
    startTime: '14:00',
    endTime: '15:00',
    status: 'scheduled',
    professional: 'Dra. Ferreira',
  },
  {
    id: 'apt-4',
    patientName: 'Carlos Eduardo Lima',
    procedureType: 'Limpeza',
    date: formatDateKey((() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })()),
    startTime: '08:00',
    endTime: '08:30',
    status: 'scheduled',
    professional: 'Dra. Oliveira',
  },
  {
    id: 'apt-5',
    patientName: 'Fernanda Costa',
    procedureType: 'Canal',
    date: formatDateKey((() => { const d = new Date(); d.setDate(d.getDate() + 2); return d; })()),
    startTime: '11:00',
    endTime: '12:30',
    status: 'scheduled',
    professional: 'Dr. Sbarzi',
  },
];

const PROCEDURE_TYPES = [
  'Consulta',
  'Avaliação',
  'Restauração',
  'Limpeza',
  'Canal',
  'Extração',
  'Ortodontia',
  'Implante',
  'Prótese',
];

export function AppointmentCalendar({
  appointments,
  onCreateAppointment,
  onSelectAppointment,
  onGoogleSync,
  className,
}: AppointmentCalendarProps) {
  const appts = appointments || MOCK_APPOINTMENTS;

  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [dragStart, setDragStart] = useState<{ date: string; time: string } | null>(null);

  const [formData, setFormData] = useState({
    patientName: '',
    procedureType: 'Consulta',
    date: formatDateKey(new Date()),
    startTime: '09:00',
    endTime: '09:30',
    notes: '',
    professional: 'Dr. Sbarzi',
  });

  const today = useMemo(() => formatDateKey(new Date()), []);

  const weekDays = useMemo(() => {
    const monday = getMonday(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const displayDays = useMemo(
    () => (viewMode === 'week' ? weekDays.slice(0, 6) : [currentDate]),
    [viewMode, weekDays, currentDate]
  );

  const appointmentsByDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of appts) {
      if (!map[a.date]) map[a.date] = [];
      map[a.date].push(a);
    }
    return map;
  }, [appts]);

  const navigatePrev = useCallback(() => {
    setCurrentDate((d) => {
      const newD = new Date(d);
      newD.setDate(d.getDate() - (viewMode === 'week' ? 7 : 1));
      return newD;
    });
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    setCurrentDate((d) => {
      const newD = new Date(d);
      newD.setDate(d.getDate() + (viewMode === 'week' ? 7 : 1));
      return newD;
    });
  }, [viewMode]);

  const goToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const handleCellClick = useCallback(
    (date: string, time: string) => {
      const [h, m] = time.split(':').map(Number);
      const endH = m === 30 ? h + 1 : h;
      const endM = m === 30 ? '00' : '30';
      setFormData((f) => ({
        ...f,
        date,
        startTime: time,
        endTime: `${endH.toString().padStart(2, '0')}:${endM}`,
      }));
      setShowForm(true);
    },
    []
  );

  const handleDragStart = useCallback((date: string, time: string) => {
    setDragStart({ date, time });
  }, []);

  const handleDragEnd = useCallback(
    (date: string, time: string) => {
      if (dragStart && dragStart.date === date) {
        const startIdx = timeToSlotIndex(dragStart.time);
        const endIdx = timeToSlotIndex(time);
        const actualStart = startIdx <= endIdx ? dragStart.time : time;
        const actualEnd = startIdx <= endIdx ? time : dragStart.time;
        // Add one slot to end
        const [eh, em] = actualEnd.split(':').map(Number);
        const endH = em === 30 ? eh + 1 : eh;
        const endM = em === 30 ? '00' : '30';
        setFormData((f) => ({
          ...f,
          date,
          startTime: actualStart,
          endTime: `${endH.toString().padStart(2, '0')}:${endM}`,
        }));
        setShowForm(true);
      }
      setDragStart(null);
    },
    [dragStart]
  );

  const handleSubmitForm = useCallback(() => {
    if (!formData.patientName || !formData.procedureType) return;
    onCreateAppointment?.({
      patientName: formData.patientName,
      procedureType: formData.procedureType,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      notes: formData.notes || undefined,
      status: 'scheduled',
      professional: formData.professional,
    });
    setShowForm(false);
    setFormData({
      patientName: '',
      procedureType: 'Consulta',
      date: formatDateKey(new Date()),
      startTime: '09:00',
      endTime: '09:30',
      notes: '',
      professional: 'Dr. Sbarzi',
    });
  }, [formData, onCreateAppointment]);

  const handleAppointmentClick = useCallback(
    (apt: Appointment, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedAppointment(apt);
      onSelectAppointment?.(apt);
    },
    [onSelectAppointment]
  );

  const currentHour = new Date().getHours();
  const currentMinute = new Date().getMinutes();
  const nowSlotPosition = ((currentHour - 8) * 2 + currentMinute / 30) * 32;

  const headerDateRange = useMemo(() => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    }
    const first = displayDays[0];
    const last = displayDays[displayDays.length - 1];
    return `${first.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${last.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  }, [viewMode, currentDate, displayDays]);

  return (
    <div className={cn('rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Agenda</h3>
            <p className="text-xs text-gray-500 capitalize">{headerDateRange}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onGoogleSync && (
            <button
              onClick={onGoogleSync}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
              title="Sincronizar com Google Calendar"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Google Calendar
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: '#0D9488' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0F766E')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0D9488')}
          >
            <Plus className="w-3.5 h-3.5" />
            Agendar
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={navigatePrev}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Hoje
          </button>
          <button
            onClick={navigateNext}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('day')}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Dia
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={cn(
              'px-3 py-1 rounded-md text-xs font-medium transition-colors',
              viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Semana
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[600px]">
          {/* Day headers */}
          <div className="flex border-b border-gray-100 sticky top-0 bg-white z-10">
            <div className="w-16 shrink-0" />
            {displayDays.map((day) => {
              const key = formatDateKey(day);
              const isToday = key === today;
              return (
                <div
                  key={key}
                  className={cn(
                    'flex-1 text-center py-2 border-l border-gray-100',
                    isToday && 'bg-teal-50/50'
                  )}
                >
                  <p className="text-[10px] text-gray-500 uppercase">{getDayName(day)}</p>
                  <p
                    className={cn(
                      'text-sm font-semibold',
                      isToday ? 'text-white w-7 h-7 rounded-full flex items-center justify-center mx-auto' : 'text-gray-900'
                    )}
                    style={isToday ? { backgroundColor: '#0D9488' } : undefined}
                  >
                    {day.getDate()}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          <div className="relative">
            {/* Today indicator line */}
            {displayDays.some((d) => formatDateKey(d) === today) && currentHour >= 8 && currentHour < 18 && (
              <div
                className="absolute left-16 right-0 z-20 pointer-events-none"
                style={{ top: `${nowSlotPosition}px` }}
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                  <div className="flex-1 h-px bg-red-500" />
                </div>
              </div>
            )}

            {HOURS.map((time) => (
              <div key={time} className="flex h-8 border-b border-gray-50">
                <div className="w-16 shrink-0 pr-2 text-right">
                  {time.endsWith(':00') && (
                    <span className="text-[10px] text-gray-400 -mt-1.5 block">{time}</span>
                  )}
                </div>
                {displayDays.map((day) => {
                  const dateKey = formatDateKey(day);
                  const isToday = dateKey === today;
                  const dayAppts = appointmentsByDate[dateKey] || [];
                  const slotIdx = timeToSlotIndex(time);

                  // Check if an appointment starts at this slot
                  const startingAppts = dayAppts.filter((a) => a.startTime === time);

                  return (
                    <div
                      key={dateKey}
                      className={cn(
                        'flex-1 border-l border-gray-100 relative cursor-pointer hover:bg-gray-50/50 transition-colors',
                        isToday && 'bg-teal-50/20',
                        time.endsWith(':00') && 'border-t border-gray-100'
                      )}
                      onClick={() => handleCellClick(dateKey, time)}
                      onMouseDown={() => handleDragStart(dateKey, time)}
                      onMouseUp={() => handleDragEnd(dateKey, time)}
                    >
                      {startingAppts.map((apt) => {
                        const duration = slotDuration(apt.startTime, apt.endTime);
                        const colors = PROCEDURE_COLORS[apt.procedureType] || DEFAULT_COLOR;
                        return (
                          <div
                            key={apt.id}
                            onClick={(e) => handleAppointmentClick(apt, e)}
                            className={cn(
                              'absolute inset-x-0.5 z-10 rounded-md border-l-2 px-1.5 py-0.5 overflow-hidden cursor-pointer hover:shadow-md transition-shadow',
                              colors.bg,
                              colors.border,
                              apt.status === 'cancelled' && 'opacity-50 line-through'
                            )}
                            style={{ height: `${duration * 32 - 2}px` }}
                            title={`${apt.patientName} - ${apt.procedureType} (${apt.startTime} - ${apt.endTime})`}
                          >
                            <p className={cn('text-[10px] font-semibold truncate', colors.text)}>
                              {apt.patientName}
                            </p>
                            {duration > 1 && (
                              <p className="text-[9px] text-gray-500 truncate">
                                {apt.procedureType} | {apt.startTime}-{apt.endTime}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Procedure type legend */}
      <div className="px-4 py-2 border-t border-gray-100 flex flex-wrap gap-3 shrink-0">
        {Object.entries(PROCEDURE_COLORS)
          .slice(0, 6)
          .map(([name, colors]) => (
            <div key={name} className="flex items-center gap-1.5">
              <span className={cn('w-2.5 h-2.5 rounded-sm border', colors.bg, colors.border)} />
              <span className="text-[10px] text-gray-500">{name}</span>
            </div>
          ))}
      </div>

      {/* Appointment detail popover */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setSelectedAppointment(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Detalhes do Agendamento</h4>
              <button onClick={() => setSelectedAppointment(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-semibold">
                  {selectedAppointment.patientName
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{selectedAppointment.patientName}</p>
                  <p className="text-xs text-gray-500">{selectedAppointment.procedureType}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Data</span>
                  <p className="font-medium text-gray-800">
                    {new Date(selectedAppointment.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Horário</span>
                  <p className="font-medium text-gray-800">
                    {selectedAppointment.startTime} - {selectedAppointment.endTime}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Status</span>
                  <p className="font-medium text-gray-800">{STATUS_LABELS[selectedAppointment.status]}</p>
                </div>
                {selectedAppointment.professional && (
                  <div>
                    <span className="text-gray-500">Profissional</span>
                    <p className="font-medium text-gray-800">{selectedAppointment.professional}</p>
                  </div>
                )}
              </div>
              {selectedAppointment.notes && (
                <div className="text-xs">
                  <span className="text-gray-500">Observações</span>
                  <p className="text-gray-800 mt-0.5">{selectedAppointment.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Novo Agendamento</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Paciente *</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => setFormData((f) => ({ ...f, patientName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                  placeholder="Nome do paciente"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Procedimento *</label>
                <select
                  value={formData.procedureType}
                  onChange={(e) => setFormData((f) => ({ ...f, procedureType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                >
                  {PROCEDURE_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Início *</label>
                  <select
                    value={formData.startTime}
                    onChange={(e) => setFormData((f) => ({ ...f, startTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Fim *</label>
                  <select
                    value={formData.endTime}
                    onChange={(e) => setFormData((f) => ({ ...f, endTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Profissional</label>
                <input
                  type="text"
                  value={formData.professional}
                  onChange={(e) => setFormData((f) => ({ ...f, professional: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none"
                  rows={2}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitForm}
                disabled={!formData.patientName}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#0D9488' }}
              >
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
