'use client';

import { useState } from 'react';
import {
  FileText, Plus, Search, Filter, Clock, CheckCircle2, AlertCircle,
  Image as ImageIcon, Download, Eye, X, Upload, Stethoscope,
  ArrowRight, Calendar,
} from 'lucide-react';

interface ExamRequest {
  id: string;
  patientName: string;
  examType: string;
  region: string;
  justification: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  status: 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'delivered';
  requestedAt: string;
  scheduledAt: string | null;
  completedAt: string | null;
}

const EXAM_TYPES = [
  { id: 'panoramic', name: 'Radiografia Panorâmica', code: 'RX-PAN', category: 'Imagem' },
  { id: 'periapical', name: 'Radiografia Periapical', code: 'RX-PER', category: 'Imagem' },
  { id: 'bite_wing', name: 'Radiografia Interproximal (Bite-Wing)', code: 'RX-BW', category: 'Imagem' },
  { id: 'occlusal', name: 'Radiografia Oclusal', code: 'RX-OCL', category: 'Imagem' },
  { id: 'ct_scan', name: 'Tomografia Computadorizada (CBCT)', code: 'TC-CBCT', category: 'Imagem' },
  { id: 'cephalometric', name: 'Telerradiografia Lateral', code: 'TLR-LAT', category: 'Imagem' },
  { id: 'photos', name: 'Fotografias Clínicas', code: 'FOTO', category: 'Documentação' },
  { id: 'models', name: 'Modelos de Estudo', code: 'MOD', category: 'Complementar' },
  { id: 'hemogram', name: 'Hemograma Completo', code: 'LAB-HEM', category: 'Laboratorial' },
  { id: 'coagulation', name: 'Coagulograma', code: 'LAB-COA', category: 'Laboratorial' },
  { id: 'glycemia', name: 'Glicemia de Jejum', code: 'LAB-GLI', category: 'Laboratorial' },
];

const MOCK_EXAMS: ExamRequest[] = [
  { id: '1', patientName: 'Maria Silva', examType: 'Radiografia Panorâmica', region: 'Arcada completa', justification: 'Avaliação geral para plano de tratamento', urgency: 'routine', status: 'completed', requestedAt: '2026-03-05', scheduledAt: '2026-03-07', completedAt: '2026-03-07' },
  { id: '2', patientName: 'João Oliveira', examType: 'Tomografia (CBCT)', region: 'Região anterior superior', justification: 'Planejamento de implante unitário - elemento 21', urgency: 'routine', status: 'scheduled', requestedAt: '2026-03-10', scheduledAt: '2026-03-15', completedAt: null },
  { id: '3', patientName: 'Ana Costa', examType: 'Radiografia Periapical', region: 'Dentes 36 e 37', justification: 'Investigação de dor espontânea e sensibilidade ao frio', urgency: 'urgent', status: 'requested', requestedAt: '2026-03-12', scheduledAt: null, completedAt: null },
  { id: '4', patientName: 'Carlos Lima', examType: 'Radiografia Panorâmica', region: 'Arcada completa', justification: 'Avaliação de terceiros molares inclusos', urgency: 'routine', status: 'delivered', requestedAt: '2026-03-01', scheduledAt: '2026-03-03', completedAt: '2026-03-03' },
  { id: '5', patientName: 'Fernanda Alves', examType: 'Hemograma Completo', region: '-', justification: 'Pré-operatório para exodontia múltipla', urgency: 'routine', status: 'completed', requestedAt: '2026-03-08', scheduledAt: '2026-03-09', completedAt: '2026-03-10' },
  { id: '6', patientName: 'Roberto Souza', examType: 'Telerradiografia Lateral', region: 'Lateral', justification: 'Análise cefalométrica para planejamento ortodôntico', urgency: 'routine', status: 'in_progress', requestedAt: '2026-03-11', scheduledAt: '2026-03-13', completedAt: null },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  requested: { label: 'Solicitado', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: Clock },
  scheduled: { label: 'Agendado', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', icon: Calendar },
  in_progress: { label: 'Em Execução', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Stethoscope },
  completed: { label: 'Concluído', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', icon: CheckCircle2 },
  delivered: { label: 'Entregue', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', icon: Download },
};

const URGENCY_MAP: Record<string, { label: string; color: string }> = {
  routine: { label: 'Rotina', color: 'text-[#6b7a8d]' },
  urgent: { label: 'Urgente', color: 'text-amber-400' },
  emergency: { label: 'Emergência', color: 'text-red-400' },
};

export default function ExamsPage() {
  const [search, setSearch] = useState('');
  const [showNewExam, setShowNewExam] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filtered = MOCK_EXAMS.filter((e) => {
    const matchSearch = e.patientName.toLowerCase().includes(search.toLowerCase()) || e.examType.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const statusCounts = MOCK_EXAMS.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700">
              <ImageIcon className="h-5 w-5 text-white" />
            </div>
            Solicitação de Exames
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">Gerenciamento de exames e resultados conforme normas CFO/ANS</p>
        </div>
        <button
          onClick={() => setShowNewExam(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          Solicitar Exame
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {Object.entries(STATUS_MAP).map(([key, conf]) => {
          const Icon = conf.icon;
          return (
            <button
              key={key}
              onClick={() => setFilterStatus(filterStatus === key ? 'all' : key)}
              className={`rounded-xl border p-3 transition-all ${
                filterStatus === key ? conf.bg : 'bg-[#111827] border-[#1e293b] hover:border-[#2d3748]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${filterStatus === key ? conf.color : 'text-[#4a5568]'}`} />
                <span className={`text-lg font-bold ${filterStatus === key ? conf.color : 'text-white'}`}>
                  {statusCounts[key] || 0}
                </span>
              </div>
              <p className="text-[10px] text-[#6b7a8d] mt-1">{conf.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
        <input
          type="text"
          placeholder="Buscar por paciente ou tipo de exame..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-[#111827] border border-[#1e293b] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all"
        />
      </div>

      {/* Exam List */}
      <div className="space-y-3">
        {filtered.map((exam) => {
          const statusConf = STATUS_MAP[exam.status];
          const urgencyConf = URGENCY_MAP[exam.urgency];
          const StatusIcon = statusConf.icon;
          return (
            <div key={exam.id} className="rounded-2xl bg-[#111827] border border-[#1e293b] p-5 hover:border-teal-500/10 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="text-sm font-semibold text-white">{exam.examType}</p>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusConf.bg} ${statusConf.color}`}>
                      <StatusIcon className="inline h-3 w-3 mr-1" />
                      {statusConf.label}
                    </span>
                    {exam.urgency !== 'routine' && (
                      <span className={`text-[10px] font-medium ${urgencyConf.color}`}>
                        <AlertCircle className="inline h-3 w-3 mr-1" />
                        {urgencyConf.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-6 mb-2">
                    <span className="text-xs text-[#8899aa] flex items-center gap-1.5">
                      <span className="text-[#4a5568]">Paciente:</span> {exam.patientName}
                    </span>
                    <span className="text-xs text-[#8899aa] flex items-center gap-1.5">
                      <span className="text-[#4a5568]">Região:</span> {exam.region}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7a8d] leading-relaxed">
                    <span className="text-[#4a5568]">Justificativa:</span> {exam.justification}
                  </p>
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-[#4a5568]">
                    <span>Solicitado: {new Date(exam.requestedAt).toLocaleDateString('pt-BR')}</span>
                    {exam.scheduledAt && <span>Agendado: {new Date(exam.scheduledAt).toLocaleDateString('pt-BR')}</span>}
                    {exam.completedAt && <span>Concluído: {new Date(exam.completedAt).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  {(exam.status === 'completed' || exam.status === 'delivered') && (
                    <button className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 text-[10px] font-medium text-teal-400 hover:bg-teal-500/20 transition-all">
                      <Eye className="h-3 w-3" /> Ver Resultado
                    </button>
                  )}
                  <button className="flex items-center gap-1.5 rounded-lg bg-[#1e293b] border border-[#2d3748] px-3 py-1.5 text-[10px] font-medium text-[#8899aa] hover:text-white transition-all">
                    <FileText className="h-3 w-3" /> Detalhes
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Exam Modal */}
      {showNewExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-[#111827] border border-[#1e293b] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-amber-400" />
                Nova Solicitação de Exame
              </h2>
              <button onClick={() => setShowNewExam(false)} className="text-[#4a5568] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-[#8899aa] mb-1 block">Paciente</label>
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#8899aa] mb-2 block">Tipo de Exame</label>
                <div className="grid grid-cols-2 gap-2">
                  {EXAM_TYPES.map((exam) => (
                    <button
                      key={exam.id}
                      className="flex items-center gap-3 rounded-xl bg-[#0d1320] border border-[#1a2332] p-3 hover:border-teal-500/30 transition-all text-left"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                        <ImageIcon className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white">{exam.name}</p>
                        <p className="text-[10px] text-[#4a5568]">{exam.code} - {exam.category}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[#8899aa] mb-1 block">Região Anatômica</label>
                <input
                  type="text"
                  placeholder="Ex: Dentes 36 e 37, Arcada completa..."
                  className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#8899aa] mb-1 block">Justificativa Clínica</label>
                <textarea
                  rows={3}
                  placeholder="Descreva a indicação clínica para o exame..."
                  className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#8899aa] mb-2 block">Urgência</label>
                <div className="flex gap-3">
                  {[
                    { value: 'routine', label: 'Rotina', desc: 'Prazo normal' },
                    { value: 'urgent', label: 'Urgente', desc: 'Prioridade alta' },
                    { value: 'emergency', label: 'Emergência', desc: 'Imediato' },
                  ].map((u) => (
                    <button
                      key={u.value}
                      className="flex-1 rounded-xl bg-[#0d1320] border border-[#1a2332] p-3 hover:border-teal-500/30 transition-all text-center"
                    >
                      <p className="text-xs font-medium text-white">{u.label}</p>
                      <p className="text-[10px] text-[#4a5568]">{u.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewExam(false)} className="flex-1 rounded-xl bg-[#1e293b] px-4 py-2.5 text-sm text-[#8899aa] hover:text-white transition-all">
                Cancelar
              </button>
              <button onClick={() => setShowNewExam(false)} className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all">
                Solicitar Exame
              </button>
            </div>

            <p className="text-[9px] text-[#4a5568] text-center mt-4">
              Solicitação conforme normas do CFO (Conselho Federal de Odontologia) e ANS (Agência Nacional de Saúde)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
