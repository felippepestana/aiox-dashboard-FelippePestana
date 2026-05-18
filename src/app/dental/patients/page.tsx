'use client';

import { useState } from 'react';
import {
  Users, Search, Plus, Phone, Mail, Calendar, MapPin, FileText,
  ChevronRight, Heart, Shield, AlertTriangle, Clock, Edit, Trash2,
  Filter, X, User,
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  lastVisit: string;
  nextAppointment: string | null;
  status: 'active' | 'inactive';
  allergies: string[];
  treatments: number;
}

const MOCK_PATIENTS: Patient[] = [
  { id: '1', name: 'Maria Silva dos Santos', cpf: '***.***.***-01', phone: '(69) 99901-0001', email: 'maria@email.com', dateOfBirth: '1985-03-15', lastVisit: '2026-03-10', nextAppointment: '2026-03-20', status: 'active', allergies: ['Penicilina'], treatments: 5 },
  { id: '2', name: 'João Pedro Oliveira', cpf: '***.***.***-02', phone: '(69) 99901-0002', email: 'joao@email.com', dateOfBirth: '1990-07-22', lastVisit: '2026-03-08', nextAppointment: '2026-03-15', status: 'active', allergies: [], treatments: 3 },
  { id: '3', name: 'Ana Carolina Costa', cpf: '***.***.***-03', phone: '(69) 99901-0003', email: 'ana@email.com', dateOfBirth: '1978-11-05', lastVisit: '2026-02-28', nextAppointment: null, status: 'active', allergies: ['Látex'], treatments: 8 },
  { id: '4', name: 'Carlos Eduardo Lima', cpf: '***.***.***-04', phone: '(69) 99901-0004', email: 'carlos@email.com', dateOfBirth: '1995-01-30', lastVisit: '2026-03-12', nextAppointment: '2026-03-18', status: 'active', allergies: [], treatments: 2 },
  { id: '5', name: 'Fernanda Ribeiro Alves', cpf: '***.***.***-05', phone: '(69) 99901-0005', email: 'fernanda@email.com', dateOfBirth: '1982-09-14', lastVisit: '2026-01-15', nextAppointment: null, status: 'inactive', allergies: ['Dipirona', 'Ibuprofeno'], treatments: 12 },
  { id: '6', name: 'Roberto Nunes Souza', cpf: '***.***.***-06', phone: '(69) 99901-0006', email: 'roberto@email.com', dateOfBirth: '1970-05-20', lastVisit: '2026-03-11', nextAppointment: '2026-03-25', status: 'active', allergies: [], treatments: 7 },
  { id: '7', name: 'Luciana Ferreira Santos', cpf: '***.***.***-07', phone: '(69) 99901-0007', email: 'luciana@email.com', dateOfBirth: '1988-12-03', lastVisit: '2026-03-05', nextAppointment: '2026-03-22', status: 'active', allergies: ['Anestésico Articaína'], treatments: 4 },
  { id: '8', name: 'Pedro Henrique Martins', cpf: '***.***.***-08', phone: '(69) 99901-0008', email: 'pedro@email.com', dateOfBirth: '2000-06-18', lastVisit: '2026-02-20', nextAppointment: null, status: 'inactive', allergies: [], treatments: 1 },
];

function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function PatientsPage() {
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = MOCK_PATIENTS.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.cpf.includes(search);
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700">
              <Users className="h-5 w-5 text-white" />
            </div>
            Pacientes
          </h1>
          <p className="text-sm text-[#86868B] mt-1">{MOCK_PATIENTS.length} pacientes cadastrados</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C4956A] to-[#A0784C] px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-[#C4956A]/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          Novo Paciente
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AEAEB2]" />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-white border border-[#E5E5EA] pl-10 pr-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#AEAEB2] focus:border-[#C4956A]/50 focus:outline-none transition-all"
          />
        </div>
        <div className="flex rounded-xl bg-white border border-[#E5E5EA] overflow-hidden">
          {(['all', 'active', 'inactive'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 text-xs font-medium transition-all ${
                filterStatus === s ? 'bg-[#C4956A]/20 text-[#C4956A]' : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              {s === 'all' ? 'Todos' : s === 'active' ? 'Ativos' : 'Inativos'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="col-span-2 space-y-2">
          {filtered.map((patient) => (
            <div
              key={patient.id}
              onClick={() => setSelectedPatient(patient)}
              className={`flex items-center gap-4 rounded-2xl bg-white border p-4 cursor-pointer transition-all hover:scale-[1.01] ${
                selectedPatient?.id === patient.id ? 'border-[#C4956A]/40 bg-[#C4956A]/5' : 'border-[#E5E5EA] hover:border-[#D1D1D6]'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#C4956A]/20 to-[#A0784C]/20 border border-[#C4956A]/20">
                <User className="h-5 w-5 text-[#C4956A]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#1D1D1F] truncate">{patient.name}</p>
                  {patient.allergies.length > 0 && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-[#86868B]">{calculateAge(patient.dateOfBirth)} anos</span>
                  <span className="text-xs text-[#86868B] flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {patient.phone}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                  patient.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-[#E5E5EA] text-[#AEAEB2] border border-[#D1D1D6]'
                }`}>
                  {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                </span>
                <p className="text-[10px] text-[#AEAEB2] mt-1">
                  Última visita: {new Date(patient.lastVisit).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-[#AEAEB2]" />
            </div>
          ))}
        </div>

        {/* Patient Detail */}
        <div>
          {selectedPatient ? (
            <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1D1D1F]">Detalhes do Paciente</h3>
                <button onClick={() => setSelectedPatient(null)} className="text-[#AEAEB2] hover:text-[#1D1D1F]">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#C4956A]/20 to-blue-500/20 border border-[#C4956A]/20 mb-3">
                  <User className="h-8 w-8 text-[#C4956A]" />
                </div>
                <p className="text-base font-semibold text-[#1D1D1F] text-center">{selectedPatient.name}</p>
                <p className="text-xs text-[#86868B] mt-1">{calculateAge(selectedPatient.dateOfBirth)} anos</p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-xs">
                  <Phone className="h-3.5 w-3.5 text-[#AEAEB2]" />
                  <span className="text-[#48484A]">{selectedPatient.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Mail className="h-3.5 w-3.5 text-[#AEAEB2]" />
                  <span className="text-[#48484A]">{selectedPatient.email}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Shield className="h-3.5 w-3.5 text-[#AEAEB2]" />
                  <span className="text-[#48484A]">CPF: {selectedPatient.cpf}</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <Calendar className="h-3.5 w-3.5 text-[#AEAEB2]" />
                  <span className="text-[#48484A]">Nasc: {new Date(selectedPatient.dateOfBirth).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {selectedPatient.allergies.length > 0 && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 mb-4">
                  <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Alergias
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPatient.allergies.map((a) => (
                      <span key={a} className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] text-amber-300">{a}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-3 text-center">
                  <p className="text-lg font-bold text-[#C4956A]">{selectedPatient.treatments}</p>
                  <p className="text-[10px] text-[#AEAEB2]">Tratamentos</p>
                </div>
                <div className="rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-3 text-center">
                  <p className="text-lg font-bold text-blue-400">
                    {selectedPatient.nextAppointment ? new Date(selectedPatient.nextAppointment).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '--'}
                  </p>
                  <p className="text-[10px] text-[#AEAEB2]">Próxima Consulta</p>
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#C4956A]/10 border border-[#C4956A]/20 px-4 py-2.5 text-xs font-medium text-[#C4956A] hover:bg-[#C4956A]/20 transition-all">
                  <FileText className="h-3.5 w-3.5" /> Novo Plano de Tratamento
                </button>
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-500/10 border border-blue-500/20 px-4 py-2.5 text-xs font-medium text-blue-400 hover:bg-blue-500/20 transition-all">
                  <Calendar className="h-3.5 w-3.5" /> Agendar Consulta
                </button>
              </div>

              <div className="mt-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-3">
                <p className="text-[9px] text-[#AEAEB2] leading-relaxed flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Dados protegidos conforme LGPD - Lei Geral de Proteção de Dados
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-[#E5E5EA] p-8 text-center">
              <Users className="h-12 w-12 text-[#D1D1D6] mx-auto mb-3" />
              <p className="text-sm text-[#AEAEB2]">Selecione um paciente para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* New Patient Modal */}
      {showNewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-[#E5E5EA] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#1D1D1F]">Novo Paciente</h2>
              <button onClick={() => setShowNewForm(false)} className="text-[#AEAEB2] hover:text-[#1D1D1F]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Nome Completo', placeholder: 'Nome do paciente', type: 'text' },
                { label: 'CPF', placeholder: '000.000.000-00', type: 'text' },
                { label: 'Data de Nascimento', placeholder: '', type: 'date' },
                { label: 'Telefone', placeholder: '(69) 99999-0000', type: 'tel' },
                { label: 'E-mail', placeholder: 'paciente@email.com', type: 'email' },
              ].map((field) => (
                <div key={field.label}>
                  <label className="text-xs font-medium text-[#6E6E73] mb-1 block">{field.label}</label>
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#AEAEB2] focus:border-[#C4956A]/50 focus:outline-none transition-all"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-[#6E6E73] mb-1 block">Alergias Conhecidas</label>
                <textarea
                  placeholder="Liste alergias separadas por vírgula..."
                  rows={2}
                  className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#AEAEB2] focus:border-[#C4956A]/50 focus:outline-none transition-all resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewForm(false)} className="flex-1 rounded-xl bg-[#E5E5EA] px-4 py-2.5 text-sm text-[#6E6E73] hover:text-[#1D1D1F] transition-all">
                Cancelar
              </button>
              <button onClick={() => setShowNewForm(false)} className="flex-1 rounded-xl bg-gradient-to-r from-[#C4956A] to-[#A0784C] px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-[#C4956A]/20 transition-all">
                Salvar Paciente
              </button>
            </div>
            <p className="text-[9px] text-[#AEAEB2] mt-4 text-center flex items-center justify-center gap-1">
              <Shield className="h-3 w-3" /> Dados armazenados em conformidade com a LGPD
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
