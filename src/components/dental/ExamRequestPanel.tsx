'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  X,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Send,
  Image,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ExamStatus = 'requested' | 'scheduled' | 'in_progress' | 'completed' | 'delivered';

export interface ExamRequest {
  id: string;
  patientName: string;
  patientId: string;
  examType: string;
  region: string;
  toothNumbers?: number[];
  clinicalJustification: string;
  urgency: 'routine' | 'urgent' | 'emergency';
  status: ExamStatus;
  requestDate: string;
  scheduledDate?: string;
  completedDate?: string;
  deliveredDate?: string;
  notes?: string;
  professional: string;
  imageUrl?: string;
}

export interface ExamRequestPanelProps {
  examRequests?: ExamRequest[];
  onCreateRequest?: (request: Omit<ExamRequest, 'id' | 'status' | 'requestDate'>) => void;
  onUpdateStatus?: (id: string, status: ExamStatus) => void;
  className?: string;
}

const EXAM_TYPES = [
  'Radiografia Periapical',
  'Radiografia Panorâmica',
  'Radiografia Interproximal (Bite-Wing)',
  'Tomografia Computadorizada (Cone Beam)',
  'Telerradiografia',
  'Radiografia Oclusal',
  'Modelos de Estudo',
  'Exame Microbiológico',
  'Biópsia',
  'Hemograma Completo',
  'Coagulograma',
  'Glicemia em Jejum',
];

const REGIONS = [
  'Arcada Superior Completa',
  'Arcada Inferior Completa',
  'Quadrante Superior Direito',
  'Quadrante Superior Esquerdo',
  'Quadrante Inferior Esquerdo',
  'Quadrante Inferior Direito',
  'Região Anterior Superior',
  'Região Anterior Inferior',
  'Região Posterior Superior Direita',
  'Região Posterior Superior Esquerda',
  'Região Posterior Inferior Esquerda',
  'Região Posterior Inferior Direita',
  'Boca Completa',
  'ATM Bilateral',
];

const STATUS_CONFIG: Record<ExamStatus, { label: string; bg: string; icon: typeof Clock }> = {
  requested: { label: 'Solicitado', bg: 'bg-blue-100 text-blue-700', icon: Send },
  scheduled: { label: 'Agendado', bg: 'bg-purple-100 text-purple-700', icon: Calendar },
  in_progress: { label: 'Em Andamento', bg: 'bg-amber-100 text-amber-700', icon: Clock },
  completed: { label: 'Concluído', bg: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  delivered: { label: 'Entregue', bg: 'bg-teal-100 text-teal-700', icon: Image },
};

const URGENCY_CONFIG: Record<string, { label: string; bg: string }> = {
  routine: { label: 'Rotina', bg: 'bg-gray-100 text-gray-600' },
  urgent: { label: 'Urgente', bg: 'bg-amber-100 text-amber-700' },
  emergency: { label: 'Emergência', bg: 'bg-red-100 text-red-700' },
};

const MOCK_REQUESTS: ExamRequest[] = [
  {
    id: 'ex-1',
    patientName: 'Maria Silva Santos',
    patientId: '1',
    examType: 'Radiografia Panorâmica',
    region: 'Boca Completa',
    clinicalJustification: 'Avaliação geral para planejamento de tratamento restaurador e verificação de terceiros molares.',
    urgency: 'routine',
    status: 'completed',
    requestDate: '2026-02-15',
    scheduledDate: '2026-02-20',
    completedDate: '2026-02-20',
    deliveredDate: '2026-02-22',
    professional: 'Dr. Sbarzi',
  },
  {
    id: 'ex-2',
    patientName: 'João Pedro Oliveira',
    patientId: '2',
    examType: 'Radiografia Periapical',
    region: 'Quadrante Inferior Esquerdo',
    toothNumbers: [36, 37],
    clinicalJustification: 'Dor espontânea no dente 36. Verificar comprometimento periapical.',
    urgency: 'urgent',
    status: 'scheduled',
    requestDate: '2026-03-10',
    scheduledDate: '2026-03-15',
    professional: 'Dr. Sbarzi',
  },
  {
    id: 'ex-3',
    patientName: 'Ana Carolina Mendes',
    patientId: '3',
    examType: 'Tomografia Computadorizada (Cone Beam)',
    region: 'Boca Completa',
    clinicalJustification: 'Planejamento ortodôntico. Avaliação de estruturas ósseas e posição de dentes inclusos.',
    urgency: 'routine',
    status: 'requested',
    requestDate: '2026-03-12',
    professional: 'Dra. Ferreira',
  },
];

export function ExamRequestPanel({
  examRequests,
  onCreateRequest,
  onUpdateStatus,
  className,
}: ExamRequestPanelProps) {
  const requests = examRequests || MOCK_REQUESTS;

  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ExamStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    examType: '',
    region: '',
    toothNumbers: '',
    clinicalJustification: '',
    urgency: 'routine' as 'routine' | 'urgent' | 'emergency',
    professional: 'Dr. Sbarzi',
    notes: '',
  });

  const filteredRequests = useMemo(() => {
    let list = requests;
    if (filterStatus) {
      list = list.filter((r) => r.status === filterStatus);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.patientName.toLowerCase().includes(q) ||
          r.examType.toLowerCase().includes(q)
      );
    }
    return list;
  }, [requests, filterStatus, searchQuery]);

  const handleSubmit = useCallback(() => {
    if (!formData.patientName || !formData.examType || !formData.region || !formData.clinicalJustification) return;

    const toothNums = formData.toothNumbers
      ? formData.toothNumbers
          .split(',')
          .map((s) => parseInt(s.trim(), 10))
          .filter((n) => !isNaN(n))
      : undefined;

    onCreateRequest?.({
      patientName: formData.patientName,
      patientId: formData.patientId || 'new',
      examType: formData.examType,
      region: formData.region,
      toothNumbers: toothNums,
      clinicalJustification: formData.clinicalJustification,
      urgency: formData.urgency,
      professional: formData.professional,
      notes: formData.notes || undefined,
    });

    setFormData({
      patientName: '',
      patientId: '',
      examType: '',
      region: '',
      toothNumbers: '',
      clinicalJustification: '',
      urgency: 'routine',
      professional: 'Dr. Sbarzi',
      notes: '',
    });
    setShowForm(false);
  }, [formData, onCreateRequest]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of requests) {
      counts[r.status] = (counts[r.status] || 0) + 1;
    }
    return counts;
  }, [requests]);

  return (
    <div className={cn('rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Solicitação de Exames</h3>
            <p className="text-xs text-gray-500">{requests.length} solicitação{requests.length !== 1 ? 'ões' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
          style={{ backgroundColor: '#0D9488' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0F766E')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0D9488')}
        >
          <Plus className="w-3.5 h-3.5" />
          Nova Solicitação
        </button>
      </div>

      {/* Status summary */}
      <div className="px-4 py-3 border-b border-gray-100 flex gap-2 overflow-x-auto shrink-0">
        <button
          onClick={() => setFilterStatus('')}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0',
            filterStatus === '' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Todos ({requests.length})
        </button>
        {(Object.keys(STATUS_CONFIG) as ExamStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? '' : s)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors shrink-0',
              filterStatus === s ? 'bg-gray-900 text-white' : cn(STATUS_CONFIG[s].bg, 'hover:opacity-80')
            )}
          >
            {STATUS_CONFIG[s].label} ({statusCounts[s] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por paciente ou tipo de exame..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
          />
        </div>
      </div>

      {/* Requests list */}
      <div className="flex-1 overflow-y-auto">
        {filteredRequests.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhuma solicitação encontrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredRequests.map((req) => {
              const statusConf = STATUS_CONFIG[req.status];
              const StatusIcon = statusConf.icon;
              const urgencyConf = URGENCY_CONFIG[req.urgency];
              const isExpanded = expandedId === req.id;

              return (
                <div key={req.id} className="px-4 py-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : req.id)}
                    className="w-full text-left flex items-center gap-3"
                  >
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', statusConf.bg)}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{req.examType}</p>
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', urgencyConf.bg)}>
                          {urgencyConf.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span>{req.patientName}</span>
                        <span className="text-gray-300">|</span>
                        <span>{new Date(req.requestDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0', statusConf.bg)}>
                      {statusConf.label}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 ml-11 space-y-3">
                      <div className="rounded-lg bg-gray-50 p-3 space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Região:</span>
                            <p className="font-medium text-gray-800">{req.region}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Profissional:</span>
                            <p className="font-medium text-gray-800">{req.professional}</p>
                          </div>
                          {req.toothNumbers && (
                            <div>
                              <span className="text-gray-500">Dentes:</span>
                              <p className="font-medium text-gray-800">{req.toothNumbers.join(', ')}</p>
                            </div>
                          )}
                          {req.scheduledDate && (
                            <div>
                              <span className="text-gray-500">Data Agendada:</span>
                              <p className="font-medium text-gray-800">
                                {new Date(req.scheduledDate).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Justificativa Clínica:</span>
                          <p className="text-xs text-gray-800 mt-0.5">{req.clinicalJustification}</p>
                        </div>
                      </div>

                      {/* Status update buttons */}
                      {onUpdateStatus && req.status !== 'delivered' && (
                        <div className="flex gap-2 flex-wrap">
                          {req.status === 'requested' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'scheduled')}
                              className="text-xs px-3 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                            >
                              Marcar como Agendado
                            </button>
                          )}
                          {req.status === 'scheduled' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'in_progress')}
                              className="text-xs px-3 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                            >
                              Em Andamento
                            </button>
                          )}
                          {req.status === 'in_progress' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'completed')}
                              className="text-xs px-3 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                            >
                              Marcar como Concluído
                            </button>
                          )}
                          {req.status === 'completed' && (
                            <button
                              onClick={() => onUpdateStatus(req.id, 'delivered')}
                              className="text-xs px-3 py-1 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
                            >
                              Marcar como Entregue
                            </button>
                          )}
                        </div>
                      )}

                      {/* Integration point notice */}
                      {(req.status === 'completed' || req.status === 'delivered') && (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/50 px-3 py-2 flex items-center gap-2">
                          <Image className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {req.imageUrl
                              ? 'Imagem do exame disponível'
                              : 'Ponto de integração: resultados de imagem serão exibidos aqui'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ANS/CFO compliance */}
      <div className="px-4 py-2 border-t border-gray-100 shrink-0">
        <div className="flex items-start gap-2">
          <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Solicitações em conformidade com as normas da ANS (Agência Nacional de Saúde Suplementar) e CFO (Conselho Federal de Odontologia). Prontuário mantido conforme Resolução CFO-118/2012.
          </p>
        </div>
      </div>

      {/* New Request Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Nova Solicitação de Exame</h3>
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
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Exame *</label>
                <select
                  value={formData.examType}
                  onChange={(e) => setFormData((f) => ({ ...f, examType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                >
                  <option value="">Selecionar tipo de exame</option>
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Região *</label>
                <select
                  value={formData.region}
                  onChange={(e) => setFormData((f) => ({ ...f, region: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                >
                  <option value="">Selecionar região</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Dentes (opcional)</label>
                <input
                  type="text"
                  value={formData.toothNumbers}
                  onChange={(e) => setFormData((f) => ({ ...f, toothNumbers: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                  placeholder="Ex: 36, 37 (notação FDI)"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Justificativa Clínica *</label>
                <textarea
                  value={formData.clinicalJustification}
                  onChange={(e) => setFormData((f) => ({ ...f, clinicalJustification: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none"
                  rows={3}
                  placeholder="Descreva a indicação clínica para este exame..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Urgência *</label>
                  <select
                    value={formData.urgency}
                    onChange={(e) => setFormData((f) => ({ ...f, urgency: e.target.value as 'routine' | 'urgent' | 'emergency' }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400"
                  >
                    <option value="routine">Rotina</option>
                    <option value="urgent">Urgente</option>
                    <option value="emergency">Emergência</option>
                  </select>
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
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Observações (opcional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-200 focus:border-teal-400 resize-none"
                  rows={2}
                  placeholder="Informações adicionais..."
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
                onClick={handleSubmit}
                disabled={!formData.patientName || !formData.examType || !formData.region || !formData.clinicalJustification}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#0D9488' }}
              >
                <Send className="w-3.5 h-3.5" />
                Solicitar Exame
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
