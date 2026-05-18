'use client';

import { useState } from 'react';
import {
  ClipboardList, Plus, ChevronRight, ChevronLeft, Eye, Printer,
  Maximize2, CheckCircle2, Clock, DollarSign, Stethoscope,
  FileText, Sparkles, X, Play, Pause, SkipForward,
} from 'lucide-react';

interface TreatmentPlan {
  id: string;
  patientName: string;
  status: 'draft' | 'presented' | 'approved' | 'in_progress' | 'completed';
  procedures: { name: string; tooth: string; price: number; status: string }[];
  total: number;
  createdAt: string;
}

const MOCK_TREATMENTS: TreatmentPlan[] = [
  {
    id: '1', patientName: 'Maria Silva dos Santos', status: 'in_progress',
    procedures: [
      { name: 'Restauração Classe II', tooth: '36', price: 350, status: 'completed' },
      { name: 'Tratamento de Canal', tooth: '46', price: 1200, status: 'in_progress' },
      { name: 'Coroa de Porcelana', tooth: '46', price: 2500, status: 'pending' },
      { name: 'Limpeza e Profilaxia', tooth: '-', price: 200, status: 'pending' },
    ],
    total: 4250, createdAt: '2026-02-15',
  },
  {
    id: '2', patientName: 'João Pedro Oliveira', status: 'approved',
    procedures: [
      { name: 'Implante Unitário', tooth: '21', price: 4500, status: 'pending' },
      { name: 'Prótese sobre Implante', tooth: '21', price: 3000, status: 'pending' },
      { name: 'Enxerto Ósseo', tooth: '21', price: 2000, status: 'pending' },
    ],
    total: 9500, createdAt: '2026-03-01',
  },
  {
    id: '3', patientName: 'Ana Carolina Costa', status: 'presented',
    procedures: [
      { name: 'Clareamento Dental', tooth: '-', price: 1500, status: 'pending' },
      { name: 'Faceta de Porcelana', tooth: '11', price: 2800, status: 'pending' },
      { name: 'Faceta de Porcelana', tooth: '12', price: 2800, status: 'pending' },
      { name: 'Faceta de Porcelana', tooth: '21', price: 2800, status: 'pending' },
      { name: 'Faceta de Porcelana', tooth: '22', price: 2800, status: 'pending' },
    ],
    total: 12700, createdAt: '2026-03-08',
  },
  {
    id: '4', patientName: 'Carlos Eduardo Lima', status: 'draft',
    procedures: [
      { name: 'Extração de 3o Molar', tooth: '38', price: 600, status: 'pending' },
      { name: 'Extração de 3o Molar', tooth: '48', price: 600, status: 'pending' },
    ],
    total: 1200, createdAt: '2026-03-12',
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-[#86868B]', bg: 'bg-[#E5E5EA]/50 border-[#D1D1D6]' },
  presented: { label: 'Apresentado', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  approved: { label: 'Aprovado', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  in_progress: { label: 'Em Andamento', color: 'text-[#C4956A]', bg: 'bg-[#C4956A]/10 border-[#C4956A]/20' },
  completed: { label: 'Concluído', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
};

// Presentation Component
function TreatmentPresentation({ plan, onClose }: { plan: TreatmentPlan; onClose: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = plan.procedures.length + 2; // intro + procedures + summary

  return (
    <div className="fixed inset-0 z-50 bg-[#F5F5F7] flex flex-col">
      {/* Presentation Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E8ED]">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#C4956A] to-[#A0784C] text-white">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-[#D4A76A] tracking-widest">SBARZI ODONTOLOGIA</p>
            <p className="text-sm text-[#1D1D1F] font-medium">Plano de Tratamento - {plan.patientName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5EA] transition-all">
            <Printer className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="p-2 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#E5E5EA] transition-all">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        {currentSlide === 0 ? (
          // Intro Slide
          <div className="text-center max-w-2xl">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C4956A] to-[#A0784C] mx-auto mb-6 shadow-lg shadow-[#C4956A]/30">
              <Stethoscope className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#1D1D1F] mb-2">Plano de Tratamento</h1>
            <p className="text-xl text-[#D4A76A] mb-6">{plan.patientName}</p>
            <p className="text-sm text-[#86868B] leading-relaxed max-w-md mx-auto">
              Preparamos este plano personalizado para restaurar a saúde e beleza do seu sorriso.
              Cada procedimento foi cuidadosamente planejado pensando no melhor resultado possível.
            </p>
            <div className="mt-8 flex justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#C4956A]">{plan.procedures.length}</p>
                <p className="text-xs text-[#86868B]">Procedimentos</p>
              </div>
              <div className="h-12 w-px bg-[#E5E5EA]" />
              <div className="text-center">
                <p className="text-2xl font-bold text-[#D4A76A]">
                  {plan.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <p className="text-xs text-[#86868B]">Investimento Total</p>
              </div>
            </div>
          </div>
        ) : currentSlide <= plan.procedures.length ? (
          // Procedure Slides
          <div className="max-w-3xl w-full">
            {(() => {
              const proc = plan.procedures[currentSlide - 1];
              return (
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <span className="text-xs text-[#C4956A] font-medium tracking-wider uppercase">
                      Procedimento {currentSlide} de {plan.procedures.length}
                    </span>
                    <h2 className="text-2xl font-bold text-[#1D1D1F] mt-2 mb-4">{proc.name}</h2>
                    {proc.tooth !== '-' && (
                      <div className="inline-flex items-center gap-2 rounded-xl bg-[#C4956A]/10 border border-[#C4956A]/20 px-3 py-1.5 mb-4">
                        <span className="text-xs text-[#C4956A]">Dente {proc.tooth}</span>
                      </div>
                    )}
                    <p className="text-sm text-[#6E6E73] leading-relaxed mb-6">
                      Este procedimento é realizado com técnicas avançadas e materiais de alta qualidade,
                      garantindo conforto durante o tratamento e resultados duradouros para sua saúde bucal.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-[#AEAEB2]" />
                        <span className="text-xs text-[#6E6E73]">Duração estimada: 45-60 minutos</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-[#AEAEB2]" />
                        <span className="text-xs text-[#6E6E73]">
                          Investimento: {proc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    {/* Tooth Visualization Placeholder */}
                    <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-[#F5F5F7] to-[#ECECEE] border border-[#E5E5EA] flex flex-col items-center justify-center">
                      <div className="text-6xl mb-3">🦷</div>
                      <p className="text-xs text-[#AEAEB2]">Visualização do procedimento</p>
                      {proc.tooth !== '-' && (
                        <p className="text-lg font-bold text-[#C4956A] mt-2">Dente {proc.tooth}</p>
                      )}
                      <div className="mt-4 grid grid-cols-2 gap-3 w-48">
                        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
                          <p className="text-[10px] text-red-400 font-medium">Antes</p>
                          <p className="text-xs text-[#86868B] mt-1">Situação atual</p>
                        </div>
                        <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-center">
                          <p className="text-[10px] text-green-400 font-medium">Depois</p>
                          <p className="text-xs text-[#86868B] mt-1">Resultado esperado</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          // Summary Slide
          <div className="max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-[#1D1D1F] text-center mb-6">Resumo do Tratamento</h2>
            <div className="rounded-2xl bg-white border border-[#E5E5EA] overflow-hidden">
              <div className="divide-y divide-[#E8E8ED]">
                {plan.procedures.map((proc, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#C4956A]/10 text-[10px] font-bold text-[#C4956A]">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm text-[#1D1D1F]">{proc.name}</p>
                        {proc.tooth !== '-' && <p className="text-[10px] text-[#AEAEB2]">Dente {proc.tooth}</p>}
                      </div>
                    </div>
                    <p className="text-sm font-medium text-[#D4A76A]">
                      {proc.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#C4956A]/20 bg-[#C4956A]/5 px-6 py-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1D1D1F]">Total do Tratamento</p>
                <p className="text-xl font-bold text-[#C4956A]">
                  {plan.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
            <p className="text-xs text-[#AEAEB2] text-center mt-4 leading-relaxed">
              Valores sujeitos a condições de pagamento. Consulte opções de parcelamento.
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[#E8E8ED]">
        <button
          onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
          disabled={currentSlide === 0}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-[#86868B] hover:text-[#1D1D1F] disabled:opacity-30 transition-all"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all ${
                i === currentSlide ? 'w-8 bg-[#C4956A]' : 'w-2 bg-[#E5E5EA] hover:bg-[#D1D1D6]'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrentSlide(Math.min(totalSlides - 1, currentSlide + 1))}
          disabled={currentSlide === totalSlides - 1}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-[#C4956A] hover:text-[#D4A76A] disabled:opacity-30 transition-all"
        >
          Próximo <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function TreatmentsPage() {
  const [selectedPlan, setSelectedPlan] = useState<TreatmentPlan | null>(null);
  const [showPresentation, setShowPresentation] = useState(false);
  const [presentingPlan, setPresentingPlan] = useState<TreatmentPlan | null>(null);

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            Planos de Tratamento
          </h1>
          <p className="text-sm text-[#86868B] mt-1">{MOCK_TREATMENTS.length} planos ativos</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C4956A] to-[#A0784C] px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-[#C4956A]/20 transition-all">
          <Plus className="h-4 w-4" />
          Novo Plano
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-2 gap-4">
        {MOCK_TREATMENTS.map((plan) => {
          const statusConf = STATUS_CONFIG[plan.status];
          const completedCount = plan.procedures.filter((p) => p.status === 'completed').length;
          const progress = Math.round((completedCount / plan.procedures.length) * 100);
          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className="rounded-2xl bg-white border border-[#E5E5EA] p-6 cursor-pointer hover:border-[#C4956A]/20 hover:scale-[1.01] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-base font-semibold text-[#1D1D1F]">{plan.patientName}</p>
                  <p className="text-xs text-[#AEAEB2] mt-1">
                    Criado em {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${statusConf.bg} ${statusConf.color}`}>
                  {statusConf.label}
                </span>
              </div>

              {/* Procedures List */}
              <div className="space-y-1.5 mb-4">
                {plan.procedures.map((proc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className={`h-1.5 w-1.5 rounded-full ${
                      proc.status === 'completed' ? 'bg-green-400' :
                      proc.status === 'in_progress' ? 'bg-[#C4956A]' : 'bg-[#D1D1D6]'
                    }`} />
                    <span className={proc.status === 'completed' ? 'text-[#AEAEB2] line-through' : 'text-[#6E6E73]'}>
                      {proc.name}
                    </span>
                    {proc.tooth !== '-' && (
                      <span className="text-[10px] text-[#AEAEB2]">(dente {proc.tooth})</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#AEAEB2]">Progresso</span>
                  <span className="text-[10px] text-[#C4956A] font-medium">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#E8E8ED]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#C4956A] to-[#C4956A] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-[#D4A76A]">
                  {plan.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPresentingPlan(plan); setShowPresentation(true); }}
                    className="flex items-center gap-1.5 rounded-lg bg-[#C4956A]/10 border border-[#C4956A]/20 px-3 py-1.5 text-[10px] font-medium text-[#C4956A] hover:bg-[#C4956A]/20 transition-all"
                  >
                    <Eye className="h-3 w-3" /> Apresentar
                  </button>
                  <button className="flex items-center gap-1.5 rounded-lg bg-[#E5E5EA] border border-[#D1D1D6] px-3 py-1.5 text-[10px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-all">
                    <Printer className="h-3 w-3" /> Imprimir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Presentation Mode */}
      {showPresentation && presentingPlan && (
        <TreatmentPresentation plan={presentingPlan} onClose={() => setShowPresentation(false)} />
      )}
    </div>
  );
}
