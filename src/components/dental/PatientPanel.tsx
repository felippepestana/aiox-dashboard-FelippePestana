'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  Calendar,
  FileText,
  ClipboardList,
  User,
  X,
  ChevronRight,
  Phone,
  Mail,
  Shield,
  Clock,
  AlertTriangle,
  Edit2,
  Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Patient {
  id: string;
  name: string;
  cpf?: string;
  email?: string;
  phone?: string;
  dateOfBirth: string;
  gender?: 'M' | 'F' | 'O';
  photoUrl?: string;
  lastVisit?: string;
  nextAppointment?: string;
  notes?: string;
  medicalHistory?: MedicalEvent[];
  allergies?: string[];
  medications?: string[];
}

interface MedicalEvent {
  id: string;
  date: string;
  type: 'consultation' | 'procedure' | 'exam' | 'note';
  title: string;
  description: string;
  professional?: string;
}

export interface PatientPanelProps {
  patients?: Patient[];
  onSelectPatient?: (patient: Patient) => void;
  onNewAppointment?: (patient: Patient) => void;
  onNewTreatmentPlan?: (patient: Patient) => void;
  onRequestExam?: (patient: Patient) => void;
  onSavePatient?: (patient: Partial<Patient>) => void;
  className?: string;
}

const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'Maria Silva Santos',
    cpf: '123.456.789-00',
    email: 'maria.silva@email.com',
    phone: '(11) 98765-4321',
    dateOfBirth: '1992-05-15',
    gender: 'F',
    lastVisit: '2026-02-28',
    nextAppointment: '2026-03-20',
    notes: 'Paciente com sensibilidade em dentes posteriores.',
    allergies: ['Dipirona', 'Látex'],
    medications: ['Losartana 50mg'],
    medicalHistory: [
      { id: 'e1', date: '2026-02-28', type: 'consultation', title: 'Consulta de Rotina', description: 'Avaliação periódica. Identificada necessidade de restauração no dente 16.', professional: 'Dr. Sbarzi' },
      { id: 'e2', date: '2026-01-10', type: 'procedure', title: 'Limpeza Profissional', description: 'Profilaxia completa com raspagem supragengival.', professional: 'Dra. Oliveira' },
      { id: 'e3', date: '2025-08-20', type: 'exam', title: 'Radiografia Panorâmica', description: 'Exame de imagem sem alterações significativas.', professional: 'Dr. Sbarzi' },
    ],
  },
  {
    id: '2',
    name: 'João Pedro Oliveira',
    cpf: '987.654.321-00',
    email: 'joao.oliveira@email.com',
    phone: '(11) 91234-5678',
    dateOfBirth: '1985-11-22',
    gender: 'M',
    lastVisit: '2026-03-05',
    allergies: [],
    medications: [],
    medicalHistory: [
      { id: 'e4', date: '2026-03-05', type: 'procedure', title: 'Restauração Classe II', description: 'Restauração em resina composta no dente 36.', professional: 'Dr. Sbarzi' },
    ],
  },
  {
    id: '3',
    name: 'Ana Carolina Mendes',
    cpf: '456.789.123-00',
    phone: '(11) 99876-5432',
    dateOfBirth: '1998-03-08',
    gender: 'F',
    lastVisit: '2025-12-15',
    allergies: ['Penicilina'],
    medications: [],
    medicalHistory: [
      { id: 'e5', date: '2025-12-15', type: 'consultation', title: 'Avaliação Ortodôntica', description: 'Paciente com má oclusão classe II. Indicado tratamento ortodôntico.', professional: 'Dra. Ferreira' },
    ],
  },
  {
    id: '4',
    name: 'Carlos Eduardo Lima',
    dateOfBirth: '1975-07-30',
    gender: 'M',
    phone: '(11) 97654-3210',
    lastVisit: '2026-01-20',
    allergies: [],
    medications: ['Metformina 500mg', 'AAS 100mg'],
    medicalHistory: [],
  },
];

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

const EVENT_TYPE_STYLES: Record<MedicalEvent['type'], { bg: string; icon: typeof Clock; label: string }> = {
  consultation: { bg: 'bg-blue-100 text-blue-700', icon: User, label: 'Consulta' },
  procedure: { bg: 'bg-teal-100 text-teal-700', icon: ClipboardList, label: 'Procedimento' },
  exam: { bg: 'bg-amber-100 text-amber-700', icon: FileText, label: 'Exame' },
  note: { bg: 'bg-gray-100 text-gray-600', icon: Edit2, label: 'Nota' },
};

export function PatientPanel({
  patients,
  onSelectPatient,
  onNewAppointment,
  onNewTreatmentPlan,
  onRequestExam,
  onSavePatient,
  className,
}: PatientPanelProps) {
  const patientList = patients || MOCK_PATIENTS;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({});
  const [filterGender, setFilterGender] = useState<'' | 'M' | 'F' | 'O'>('');

  const filteredPatients = useMemo(() => {
    let list = patientList;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.cpf?.includes(q) ||
          p.phone?.includes(q)
      );
    }
    if (filterGender) {
      list = list.filter((p) => p.gender === filterGender);
    }
    return list;
  }, [patientList, searchQuery, filterGender]);

  const handleSelectPatient = useCallback(
    (p: Patient) => {
      setSelectedPatient(p);
      onSelectPatient?.(p);
    },
    [onSelectPatient]
  );

  const handleSaveForm = useCallback(() => {
    if (formData.name && formData.dateOfBirth) {
      onSavePatient?.(formData);
      setShowForm(false);
      setFormData({});
    }
  }, [formData, onSavePatient]);

  const openEditForm = useCallback((p: Patient) => {
    setFormData(p);
    setShowForm(true);
  }, []);

  return (
    <div className={cn('rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
            <User className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Pacientes</h3>
            <p className="text-xs text-gray-500">{filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setFormData({});
            setShowForm(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
          style={{ backgroundColor: '#0D9488' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0F766E')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0D9488')}
        >
          <Plus className="w-3.5 h-3.5" />
          Novo Paciente
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100 flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, CPF ou telefone..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
          />
        </div>
        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value as '' | 'M' | 'F' | 'O')}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-200"
        >
          <option value="">Todos</option>
          <option value="M">Masculino</option>
          <option value="F">Feminino</option>
          <option value="O">Outro</option>
        </select>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Patient list */}
        <div className={cn('flex-1 overflow-y-auto', selectedPatient && 'hidden md:block md:w-80 md:flex-none md:border-r md:border-gray-100')}>
          {filteredPatients.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <User className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Nenhum paciente encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectPatient(p)}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3',
                    selectedPatient?.id === p.id && 'bg-teal-50/50'
                  )}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0 text-gray-500 text-sm font-semibold">
                    {p.name
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{calculateAge(p.dateOfBirth)} anos</span>
                      {p.lastVisit && (
                        <>
                          <span className="text-gray-300">|</span>
                          <span>Última visita: {new Date(p.lastVisit).toLocaleDateString('pt-BR')}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Patient detail */}
        {selectedPatient && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedPatient(null)}
                className="md:hidden text-gray-500 hover:text-gray-700"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h4 className="text-sm font-semibold text-gray-900">{selectedPatient.name}</h4>
              <button
                onClick={() => openEditForm(selectedPatient)}
                className="text-gray-500 hover:text-teal-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {/* Patient info */}
            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xl font-semibold">
                  {selectedPatient.name
                    .split(' ')
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedPatient.name}</p>
                  <p className="text-sm text-gray-500">
                    {calculateAge(selectedPatient.dateOfBirth)} anos
                    {selectedPatient.gender && ` - ${selectedPatient.gender === 'M' ? 'Masculino' : selectedPatient.gender === 'F' ? 'Feminino' : 'Outro'}`}
                  </p>
                  {selectedPatient.cpf && (
                    <p className="text-xs text-gray-400">CPF: {selectedPatient.cpf}</p>
                  )}
                </div>
              </div>

              {/* Contact */}
              <div className="flex flex-wrap gap-3">
                {selectedPatient.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    {selectedPatient.phone}
                  </div>
                )}
                {selectedPatient.email && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {selectedPatient.email}
                  </div>
                )}
              </div>

              {/* Allergies & Medications */}
              {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Alergias
                  </div>
                  <p className="text-xs text-red-600">{selectedPatient.allergies.join(', ')}</p>
                </div>
              )}

              {selectedPatient.medications && selectedPatient.medications.length > 0 && (
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2">
                  <p className="text-xs font-semibold text-blue-700 mb-1">Medicamentos em Uso</p>
                  <p className="text-xs text-blue-600">{selectedPatient.medications.join(', ')}</p>
                </div>
              )}

              {/* Quick actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onNewAppointment?.(selectedPatient)}
                  className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
                >
                  <Calendar className="w-5 h-5" style={{ color: '#0D9488' }} />
                  <span className="text-[10px] font-medium text-gray-700">Agendar</span>
                </button>
                <button
                  onClick={() => onNewTreatmentPlan?.(selectedPatient)}
                  className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
                >
                  <ClipboardList className="w-5 h-5" style={{ color: '#0D9488' }} />
                  <span className="text-[10px] font-medium text-gray-700">Plano</span>
                </button>
                <button
                  onClick={() => onRequestExam?.(selectedPatient)}
                  className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-200 hover:border-teal-300 hover:bg-teal-50/50 transition-colors"
                >
                  <FileText className="w-5 h-5" style={{ color: '#0D9488' }} />
                  <span className="text-[10px] font-medium text-gray-700">Exame</span>
                </button>
              </div>

              {/* Medical history timeline */}
              {selectedPatient.medicalHistory && selectedPatient.medicalHistory.length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Histórico Clínico
                  </h5>
                  <div className="space-y-3">
                    {selectedPatient.medicalHistory.map((event) => {
                      const style = EVENT_TYPE_STYLES[event.type];
                      const IconComp = style.icon;
                      return (
                        <div key={event.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', style.bg)}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="w-px flex-1 bg-gray-200 mt-1" />
                          </div>
                          <div className="pb-4">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium text-gray-900">{event.title}</p>
                              <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', style.bg)}>
                                {style.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mb-1">
                              {new Date(event.date).toLocaleDateString('pt-BR')}
                              {event.professional && ` - ${event.professional}`}
                            </p>
                            <p className="text-sm text-gray-600">{event.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* LGPD Notice */}
              <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 flex items-start gap-2">
                <Shield className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-gray-500 leading-relaxed">
                  Os dados pessoais deste paciente são protegidos pela Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018). O acesso, uso e compartilhamento dessas informações devem seguir as políticas de privacidade da clínica e o consentimento do titular.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Patient Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {formData.id ? 'Editar Paciente' : 'Novo Paciente'}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                  placeholder="Nome completo do paciente"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Data de Nascimento *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => setFormData((f) => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sexo</label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData((f) => ({ ...f, gender: e.target.value as 'M' | 'F' | 'O' }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                  >
                    <option value="">Selecionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="O">Outro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CPF</label>
                <input
                  type="text"
                  value={formData.cpf || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, cpf: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData((f) => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                    placeholder="email@exemplo.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none"
                  rows={3}
                  placeholder="Alergias, medicamentos, condições especiais..."
                />
              </div>

              {/* LGPD consent */}
              <div className="rounded-lg bg-teal-50 border border-teal-100 px-3 py-2 flex items-start gap-2">
                <Shield className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-teal-700 leading-relaxed">
                  Ao cadastrar este paciente, você declara que obteve o consentimento para coleta e tratamento dos dados pessoais conforme a LGPD (Lei 13.709/2018).
                </p>
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
                onClick={handleSaveForm}
                disabled={!formData.name || !formData.dateOfBirth}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#0D9488' }}
              >
                {formData.id ? 'Salvar Alterações' : 'Cadastrar Paciente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
