'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Printer,
  CheckCircle2,
  Clock,
  FileText,
  Heart,
  ArrowRight,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TreatmentProcedure {
  id: string;
  name: string;
  description: string;
  patientDescription: string;
  toothNumbers?: number[];
  estimatedDuration: string;
  price: number;
  imageUrl?: string;
  beforeDescription?: string;
  afterDescription?: string;
  benefits?: string[];
}

export interface TreatmentPlan {
  id: string;
  title: string;
  createdAt: string;
  procedures: TreatmentProcedure[];
  notes?: string;
  validUntil?: string;
}

export interface PatientInfo {
  name: string;
  age?: number;
  photoUrl?: string;
}

export interface TreatmentPresentationProps {
  treatmentPlan?: TreatmentPlan;
  patient?: PatientInfo;
  onApprove?: (planId: string) => void;
  className?: string;
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const MOCK_PLAN: TreatmentPlan = {
  id: 'tp-001',
  title: 'Plano de Tratamento Restaurador',
  createdAt: '2026-03-10',
  validUntil: '2026-06-10',
  notes: 'Tratamento completo com acompanhamento periódico recomendado.',
  procedures: [
    {
      id: 'proc-1',
      name: 'Restauração em Resina Composta',
      description: 'Restauração direta em resina composta fotopolimerizável classe II.',
      patientDescription:
        'Vamos restaurar o dente com um material da cor natural do seu dente. O procedimento é rápido, seguro e o resultado fica muito bonito e natural.',
      toothNumbers: [16],
      estimatedDuration: '1 hora',
      price: 350,
      beforeDescription: 'Dente com cárie na superfície de contato.',
      afterDescription: 'Dente restaurado com aspecto natural e função mastigatória recuperada.',
      benefits: ['Resultado estético natural', 'Preservação da estrutura dental', 'Durabilidade de 5-10 anos'],
    },
    {
      id: 'proc-2',
      name: 'Tratamento de Canal',
      description: 'Endodontia unirradicular com obturação e restauração provisória.',
      patientDescription:
        'Este tratamento remove a infecção de dentro do dente, eliminando a dor. Depois, o dente é selado para ficar protegido. Usamos anestesia, então você não sentirá dor durante o procedimento.',
      toothNumbers: [24],
      estimatedDuration: '2 sessões de 1h',
      price: 900,
      beforeDescription: 'Dente com comprometimento pulpar e dor espontânea.',
      afterDescription: 'Canal tratado, dente sem dor e pronto para restauração definitiva.',
      benefits: ['Eliminação da dor', 'Preservação do dente natural', 'Evita extração'],
    },
    {
      id: 'proc-3',
      name: 'Limpeza Profissional',
      description: 'Profilaxia dental com raspagem supragengival e polimento coronário.',
      patientDescription:
        'Uma limpeza profissional completa para remover o tártaro e as manchas dos dentes. Seus dentes ficarão mais limpos, brancos e suas gengivas mais saudáveis.',
      estimatedDuration: '45 minutos',
      price: 200,
      beforeDescription: 'Acúmulo de tártaro e placa bacteriana.',
      afterDescription: 'Dentes limpos, polidos e gengivas saudáveis.',
      benefits: ['Prevenção de doenças', 'Dentes mais brancos', 'Gengivas saudáveis', 'Hálito fresco'],
    },
  ],
};

const MOCK_PATIENT: PatientInfo = {
  name: 'Maria Silva',
  age: 34,
};

export function TreatmentPresentation({
  treatmentPlan,
  patient,
  onApprove,
  className,
}: TreatmentPresentationProps) {
  const plan = treatmentPlan || MOCK_PLAN;
  const patientData = patient || MOCK_PATIENT;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Slides: intro + each procedure + summary
  const totalSlides = plan.procedures.length + 2;

  const goNext = useCallback(() => {
    setCurrentSlide((s) => Math.min(s + 1, totalSlides - 1));
  }, [totalSlides]);

  const goPrev = useCallback(() => {
    setCurrentSlide((s) => Math.max(s - 1, 0));
  }, []);

  const totalCost = useMemo(
    () => plan.procedures.reduce((sum, p) => sum + p.price, 0),
    [plan.procedures]
  );

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v);
  }, []);

  const handlePrint = useCallback(() => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 300);
  }, []);

  const renderIntroSlide = () => (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 py-12">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#0D9488' }}>
        <Heart className="w-8 h-8 text-white" />
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        {plan.title}
      </h2>
      <p className="text-lg text-gray-500 mb-6">
        Preparado especialmente para <span className="font-semibold text-gray-700">{patientData.name}</span>
      </p>
      <div className="flex items-center gap-6 text-sm text-gray-500 mb-8">
        <div className="flex items-center gap-1.5">
          <FileText className="w-4 h-4" />
          <span>{plan.procedures.length} procedimento{plan.procedures.length > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>Criado em {new Date(plan.createdAt).toLocaleDateString('pt-BR')}</span>
        </div>
      </div>
      <p className="text-sm text-gray-400 max-w-md">
        Navegue pelas próximas telas para ver cada procedimento explicado de forma clara e acessível.
      </p>
      <button
        onClick={goNext}
        className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-colors"
        style={{ backgroundColor: '#0D9488' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0F766E')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0D9488')}
      >
        Ver Procedimentos
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );

  const renderProcedureSlide = (proc: TreatmentProcedure, index: number) => (
    <div className="flex flex-col h-full px-6 md:px-10 py-8 overflow-y-auto">
      {/* Slide header */}
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ backgroundColor: '#0D9488' }}
        >
          {index + 1}
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{proc.name}</h3>
          {proc.toothNumbers && proc.toothNumbers.length > 0 && (
            <p className="text-xs text-gray-500">
              Dente{proc.toothNumbers.length > 1 ? 's' : ''}: {proc.toothNumbers.join(', ')}
            </p>
          )}
        </div>
        <div className="ml-auto text-right shrink-0">
          <p className="text-lg font-bold" style={{ color: '#0D9488' }}>
            {formatBRL(proc.price)}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {proc.estimatedDuration}
          </div>
        </div>
      </div>

      {/* Patient-friendly explanation */}
      <div className="bg-teal-50/50 rounded-xl p-5 mb-6 border border-teal-100">
        <h4 className="text-sm font-semibold text-teal-800 mb-2">O que vamos fazer?</h4>
        <p className="text-sm text-gray-700 leading-relaxed">{proc.patientDescription}</p>
      </div>

      {/* Before/After */}
      {(proc.beforeDescription || proc.afterDescription) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {proc.beforeDescription && (
            <div className="rounded-xl border border-red-100 bg-red-50/30 p-4">
              <h5 className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">Situação Atual</h5>
              <div className="w-full h-28 rounded-lg bg-red-100/50 flex items-center justify-center mb-3">
                <span className="text-xs text-red-400">Imagem ilustrativa</span>
              </div>
              <p className="text-sm text-gray-600">{proc.beforeDescription}</p>
            </div>
          )}
          {proc.afterDescription && (
            <div className="rounded-xl border border-green-100 bg-green-50/30 p-4">
              <h5 className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Resultado Esperado</h5>
              <div className="w-full h-28 rounded-lg bg-green-100/50 flex items-center justify-center mb-3">
                <span className="text-xs text-green-400">Projeção do resultado</span>
              </div>
              <p className="text-sm text-gray-600">{proc.afterDescription}</p>
            </div>
          )}
        </div>
      )}

      {/* Benefits */}
      {proc.benefits && proc.benefits.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Benefícios</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {proc.benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <Star className="w-4 h-4 shrink-0" style={{ color: '#D4A76A' }} />
                {b}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSummarySlide = () => (
    <div className="flex flex-col h-full px-6 md:px-10 py-8 overflow-y-auto">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Resumo do Plano de Tratamento</h3>
        <p className="text-sm text-gray-500">
          {patientData.name} {patientData.age ? `- ${patientData.age} anos` : ''}
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {plan.procedures.map((proc, i) => (
          <div
            key={proc.id}
            className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 bg-gray-50/50"
          >
            <div className="flex items-center gap-3">
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: '#0D9488' }}
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{proc.name}</p>
                {proc.toothNumbers && (
                  <p className="text-xs text-gray-500">Dentes: {proc.toothNumbers.join(', ')}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold" style={{ color: '#0D9488' }}>
                {formatBRL(proc.price)}
              </p>
              <p className="text-xs text-gray-400">{proc.estimatedDuration}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div
        className="rounded-xl p-5 mb-6"
        style={{ backgroundColor: '#0D9488' }}
      >
        <div className="flex items-center justify-between text-white">
          <span className="text-lg font-semibold">Valor Total</span>
          <span className="text-2xl font-bold">{formatBRL(totalCost)}</span>
        </div>
        {plan.validUntil && (
          <p className="text-teal-100 text-xs mt-2">
            Proposta válida até {new Date(plan.validUntil).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      {plan.notes && (
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 mb-6">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Observações:</span> {plan.notes}
          </p>
        </div>
      )}

      {onApprove && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => onApprove(plan.id)}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-white font-semibold text-base transition-colors shadow-lg"
            style={{ backgroundColor: '#0D9488' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0F766E')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0D9488')}
          >
            <CheckCircle2 className="w-5 h-5" />
            Aprovar Plano de Tratamento
          </button>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-6">
        Sbarzi Odontologia e Saúde - Cuidando do seu sorriso com excelência
      </p>
    </div>
  );

  const renderCurrentSlide = () => {
    if (currentSlide === 0) return renderIntroSlide();
    if (currentSlide === totalSlides - 1) return renderSummarySlide();
    return renderProcedureSlide(plan.procedures[currentSlide - 1], currentSlide - 1);
  };

  if (isPrintMode) {
    return (
      <div className="bg-white p-8 print:p-4">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
          <p className="text-gray-500">Paciente: {patientData.name}</p>
        </div>
        {plan.procedures.map((proc, i) => (
          <div key={proc.id} className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="font-semibold text-lg">
              {i + 1}. {proc.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{proc.patientDescription}</p>
            <div className="flex gap-4 mt-2 text-sm text-gray-500">
              <span>Duração: {proc.estimatedDuration}</span>
              <span>Valor: {formatBRL(proc.price)}</span>
              {proc.toothNumbers && <span>Dentes: {proc.toothNumbers.join(', ')}</span>}
            </div>
          </div>
        ))}
        <div className="text-right text-xl font-bold mt-4" style={{ color: '#0D9488' }}>
          Total: {formatBRL(totalCost)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col',
        isFullscreen && 'fixed inset-0 z-50 rounded-none border-0',
        className
      )}
    >
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#F0FDFA' }}>
            <FileText className="w-4 h-4" style={{ color: '#0D9488' }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{plan.title}</h3>
            <p className="text-xs text-gray-500">{patientData.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrint}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            title="Imprimir"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
            title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Slide progress */}
      <div className="px-4 py-2 flex items-center gap-1.5 shrink-0">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i === currentSlide ? 'flex-[3]' : 'flex-1',
            )}
            style={{
              backgroundColor: i === currentSlide ? '#0D9488' : i < currentSlide ? '#99F6E4' : '#E5E7EB',
            }}
          />
        ))}
      </div>

      {/* Slide content */}
      <div className="flex-1 min-h-[400px] overflow-hidden">
        {renderCurrentSlide()}
      </div>

      {/* Navigation */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-white shrink-0">
        <button
          onClick={goPrev}
          disabled={currentSlide === 0}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            currentSlide === 0
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <span className="text-xs text-gray-500">
          {currentSlide + 1} / {totalSlides}
        </span>
        <button
          onClick={goNext}
          disabled={currentSlide === totalSlides - 1}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            currentSlide === totalSlides - 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-white'
          )}
          style={{
            backgroundColor: currentSlide === totalSlides - 1 ? undefined : '#0D9488',
          }}
        >
          Próximo
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
