'use client';

import { useState, useMemo } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Plus, Clock, User,
  Stethoscope, X, ExternalLink, RefreshCw,
} from 'lucide-react';

interface Appointment {
  id: string;
  time: string;
  duration: number;
  patient: string;
  procedure: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  color: string;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = Array.from({ length: 20 }, (_, i) => {
  const hour = Math.floor(i / 2) + 8;
  const min = i % 2 === 0 ? '00' : '30';
  return `${hour.toString().padStart(2, '0')}:${min}`;
});

const MOCK_APPOINTMENTS: Record<string, Appointment[]> = {
  '2026-03-13': [
    { id: '1', time: '08:30', duration: 60, patient: 'Maria Silva', procedure: 'Limpeza e Profilaxia', status: 'confirmed', color: 'teal' },
    { id: '2', time: '09:30', duration: 90, patient: 'João Oliveira', procedure: 'Restauração Classe II', status: 'confirmed', color: 'blue' },
    { id: '3', time: '11:00', duration: 60, patient: 'Ana Costa', procedure: 'Avaliação Ortodôntica', status: 'pending', color: 'purple' },
    { id: '4', time: '14:00', duration: 120, patient: 'Carlos Lima', procedure: 'Implante Unitário', status: 'confirmed', color: 'emerald' },
    { id: '5', time: '16:00', duration: 60, patient: 'Fernanda Alves', procedure: 'Clareamento Dental', status: 'confirmed', color: 'amber' },
  ],
  '2026-03-14': [
    { id: '6', time: '08:00', duration: 60, patient: 'Roberto Souza', procedure: 'Extração 3o Molar', status: 'confirmed', color: 'red' },
    { id: '7', time: '09:30', duration: 90, patient: 'Luciana Santos', procedure: 'Tratamento de Canal', status: 'confirmed', color: 'blue' },
    { id: '8', time: '11:00', duration: 60, patient: 'Pedro Martins', procedure: 'Consulta de Avaliação', status: 'pending', color: 'teal' },
    { id: '9', time: '14:00', duration: 60, patient: 'Camila Dias', procedure: 'Aplicação de Flúor', status: 'confirmed', color: 'green' },
  ],
  '2026-03-15': [
    { id: '10', time: '08:30', duration: 90, patient: 'André Ferreira', procedure: 'Prótese Fixa', status: 'confirmed', color: 'purple' },
    { id: '11', time: '10:00', duration: 60, patient: 'Patrícia Lima', procedure: 'Limpeza e Profilaxia', status: 'confirmed', color: 'teal' },
    { id: '12', time: '14:30', duration: 120, patient: 'Marcos Vieira', procedure: 'Cirurgia Periodontal', status: 'pending', color: 'red' },
  ],
};

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day + 1);
  return Array.from({ length: 6 }, (_, i) => {
    const dd = new Date(start);
    dd.setDate(start.getDate() + i);
    return dd;
  });
}

function formatDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'week' | 'day'>('week');
  const [showNewAppointment, setShowNewAppointment] = useState(false);

  const weekDays = useMemo(() => getWeekDays(currentDate), [currentDate]);
  const todayKey = new Date().toISOString().split('T')[0];

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === 'week' ? dir * 7 : dir));
    setCurrentDate(d);
  };

  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    teal: { bg: 'bg-[#C4956A]/15', border: 'border-l-[#C4956A]', text: 'text-[#D4A76A]' },
    blue: { bg: 'bg-blue-500/15', border: 'border-l-blue-400', text: 'text-blue-300' },
    purple: { bg: 'bg-purple-500/15', border: 'border-l-purple-400', text: 'text-purple-300' },
    emerald: { bg: 'bg-emerald-500/15', border: 'border-l-emerald-400', text: 'text-emerald-300' },
    amber: { bg: 'bg-amber-500/15', border: 'border-l-amber-400', text: 'text-amber-300' },
    red: { bg: 'bg-red-500/15', border: 'border-l-red-400', text: 'text-red-300' },
    green: { bg: 'bg-green-500/15', border: 'border-l-green-400', text: 'text-green-300' },
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            Agenda
          </h1>
          <p className="text-sm text-[#86868B] mt-1">Gerenciamento de consultas e horários</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl bg-white border border-[#E5E5EA] px-4 py-2.5 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] hover:border-[#D1D1D6] transition-all">
            <RefreshCw className="h-3.5 w-3.5" />
            Sincronizar Google Calendar
            <ExternalLink className="h-3 w-3" />
          </button>
          <button
            onClick={() => setShowNewAppointment(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C4956A] to-[#A0784C] px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-[#C4956A]/20 transition-all"
          >
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white border border-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F] transition-all">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={() => navigate(1)} className="p-2 rounded-xl bg-white border border-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F] transition-all">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="rounded-xl bg-white border border-[#E5E5EA] px-4 py-2 text-xs text-[#C4956A] hover:bg-[#C4956A]/10 transition-all">
            Hoje
          </button>
          <h2 className="text-base font-semibold text-[#1D1D1F] ml-3">
            {view === 'week'
              ? `${weekDays[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${weekDays[5].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            }
          </h2>
        </div>
        <div className="flex rounded-xl bg-white border border-[#E5E5EA] overflow-hidden">
          <button onClick={() => setView('day')} className={`px-4 py-2 text-xs font-medium transition-all ${view === 'day' ? 'bg-[#C4956A]/20 text-[#C4956A]' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}>
            Dia
          </button>
          <button onClick={() => setView('week')} className={`px-4 py-2 text-xs font-medium transition-all ${view === 'week' ? 'bg-[#C4956A]/20 text-[#C4956A]' : 'text-[#86868B] hover:text-[#1D1D1F]'}`}>
            Semana
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="rounded-2xl bg-white border border-[#E5E5EA] overflow-hidden">
        {/* Day Headers */}
        <div className="grid border-b border-[#E8E8ED]" style={{ gridTemplateColumns: view === 'week' ? '60px repeat(6, 1fr)' : '60px 1fr' }}>
          <div className="p-3 border-r border-[#E8E8ED]" />
          {(view === 'week' ? weekDays : [currentDate]).map((day, i) => {
            const key = formatDateKey(day);
            const isToday = key === todayKey;
            return (
              <div key={i} className={`p-3 text-center border-r border-[#E8E8ED] last:border-r-0 ${isToday ? 'bg-[#C4956A]/5' : ''}`}>
                <p className="text-[10px] text-[#AEAEB2] uppercase">{DAYS_OF_WEEK[day.getDay()]}</p>
                <p className={`text-lg font-bold ${isToday ? 'text-[#C4956A]' : 'text-[#1D1D1F]'}`}>
                  {day.getDate()}
                </p>
                {isToday && <div className="h-1 w-6 rounded-full bg-[#C4956A] mx-auto mt-1" />}
              </div>
            );
          })}
        </div>

        {/* Time Grid */}
        <div className="relative max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#D1D1D6]">
          {HOURS.map((time) => (
            <div
              key={time}
              className="grid border-b border-[#ECECEE]"
              style={{ gridTemplateColumns: view === 'week' ? '60px repeat(6, 1fr)' : '60px 1fr', minHeight: '40px' }}
            >
              <div className="px-2 py-1 border-r border-[#E8E8ED] flex items-start justify-end">
                <span className="text-[10px] text-[#AEAEB2] font-mono">{time}</span>
              </div>
              {(view === 'week' ? weekDays : [currentDate]).map((day, di) => {
                const key = formatDateKey(day);
                const dayAppts = MOCK_APPOINTMENTS[key] || [];
                const slotAppts = dayAppts.filter((a) => a.time === time);
                const isToday = key === todayKey;
                return (
                  <div key={di} className={`border-r border-[#ECECEE] last:border-r-0 relative min-h-[40px] ${isToday ? 'bg-[#C4956A]/[0.04]' : ''} hover:bg-[#FAFAFA]/50 cursor-pointer transition-colors`}>
                    {slotAppts.map((apt) => {
                      const c = colorMap[apt.color] || colorMap.teal;
                      const slots = Math.ceil(apt.duration / 30);
                      return (
                        <div
                          key={apt.id}
                          className={`absolute inset-x-1 ${c.bg} border-l-2 ${c.border} rounded-r-lg px-2 py-1 z-10 cursor-pointer hover:brightness-110 transition-all`}
                          style={{ height: `${slots * 40 - 4}px` }}
                        >
                          <p className={`text-[10px] font-medium ${c.text} truncate`}>{apt.patient}</p>
                          <p className="text-[9px] text-[#86868B] truncate">{apt.procedure}</p>
                          {slots > 1 && (
                            <p className="text-[9px] text-[#AEAEB2] mt-0.5">{apt.time} - {apt.duration}min</p>
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

      {/* New Appointment Modal */}
      {showNewAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E5E5EA] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1D1D1F]">Novo Agendamento</h2>
              <button onClick={() => setShowNewAppointment(false)} className="text-[#AEAEB2] hover:text-[#1D1D1F]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#6E6E73] mb-1 block">Paciente</label>
                <input type="text" placeholder="Buscar paciente..." className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#AEAEB2] focus:border-[#C4956A]/50 focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#6E6E73] mb-1 block">Data</label>
                  <input type="date" className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] focus:border-[#C4956A]/50 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6E6E73] mb-1 block">Horário</label>
                  <input type="time" className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] focus:border-[#C4956A]/50 focus:outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6E6E73] mb-1 block">Procedimento</label>
                <select className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] focus:border-[#C4956A]/50 focus:outline-none transition-all">
                  <option value="">Selecione o procedimento...</option>
                  <option>Consulta de Avaliação</option>
                  <option>Limpeza e Profilaxia</option>
                  <option>Restauração</option>
                  <option>Tratamento de Canal</option>
                  <option>Extração</option>
                  <option>Implante</option>
                  <option>Clareamento</option>
                  <option>Ortodontia</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6E6E73] mb-1 block">Duração (minutos)</label>
                <select className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] focus:border-[#C4956A]/50 focus:outline-none transition-all">
                  <option>30</option>
                  <option>60</option>
                  <option>90</option>
                  <option>120</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6E6E73] mb-1 block">Observações</label>
                <textarea rows={2} placeholder="Observações opcionais..." className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#AEAEB2] focus:border-[#C4956A]/50 focus:outline-none transition-all resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewAppointment(false)} className="flex-1 rounded-xl bg-[#E5E5EA] px-4 py-2.5 text-sm text-[#6E6E73] hover:text-[#1D1D1F] transition-all">
                Cancelar
              </button>
              <button onClick={() => setShowNewAppointment(false)} className="flex-1 rounded-xl bg-gradient-to-r from-[#C4956A] to-[#A0784C] px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-[#C4956A]/20 transition-all">
                Agendar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
