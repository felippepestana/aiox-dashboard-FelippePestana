'use client';

// =============================================================================
// OnboardingWizard — Guided first-time setup for APEX Legal Performance
// 5-step flow: Escritório → Processo → Cliente → IA → Pronto!
// =============================================================================

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Building2,
  Briefcase,
  Users,
  Brain,
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

// ─── Step 1: Escritório ───────────────────────────────────────────────────────

interface EscritorioData {
  nome: string;
  oab: string;
  estado: string;
  numAdvogados: string;
}

const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
];

function StepEscritorio({
  data,
  onChange,
}: {
  data: EscritorioData;
  onChange: (d: EscritorioData) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
          Nome do escritório
        </label>
        <input
          type="text"
          placeholder="Ex.: Silva & Associados Advogados"
          value={data.nome}
          onChange={(e) => onChange({ ...data, nome: e.target.value })}
          className="w-full rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#060d1a] px-4 py-2.5 text-sm text-white placeholder-[#4A5568] outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
          OAB do responsável
        </label>
        <input
          type="text"
          placeholder="Ex.: SP 123.456"
          value={data.oab}
          onChange={(e) => onChange({ ...data, oab: e.target.value })}
          className="w-full rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#060d1a] px-4 py-2.5 text-sm text-white placeholder-[#4A5568] outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
            Estado (UF)
          </label>
          <select
            value={data.estado}
            onChange={(e) => onChange({ ...data, estado: e.target.value })}
            className="w-full rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#060d1a] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors appearance-none"
          >
            <option value="" className="bg-[#0d1f3c]">Selecione</option>
            {UF_LIST.map((uf) => (
              <option key={uf} value={uf} className="bg-[#0d1f3c]">
                {uf}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
            Número de advogados
          </label>
          <select
            value={data.numAdvogados}
            onChange={(e) => onChange({ ...data, numAdvogados: e.target.value })}
            className="w-full rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#060d1a] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors appearance-none"
          >
            <option value="" className="bg-[#0d1f3c]">Selecione</option>
            <option value="1-5" className="bg-[#0d1f3c]">1 – 5</option>
            <option value="6-15" className="bg-[#0d1f3c]">6 – 15</option>
            <option value="16-50" className="bg-[#0d1f3c]">16 – 50</option>
            <option value="50+" className="bg-[#0d1f3c]">50+</option>
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Primeiro Processo ────────────────────────────────────────────────

interface ProcessoData {
  cnj: string;
  titulo: string;
  area: string;
  skip: boolean;
}

function StepProcesso({
  data,
  onChange,
}: {
  data: ProcessoData;
  onChange: (d: ProcessoData) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
          Número CNJ
        </label>
        <input
          type="text"
          placeholder="0000000-00.0000.0.00.0000"
          value={data.cnj}
          onChange={(e) => onChange({ ...data, cnj: e.target.value, skip: false })}
          className="w-full rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#060d1a] px-4 py-2.5 text-sm text-white placeholder-[#4A5568] outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors font-mono"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
          Título / Descrição
        </label>
        <input
          type="text"
          placeholder="Ex.: Indenização por danos morais"
          value={data.titulo}
          onChange={(e) => onChange({ ...data, titulo: e.target.value, skip: false })}
          className="w-full rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#060d1a] px-4 py-2.5 text-sm text-white placeholder-[#4A5568] outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
          Área
        </label>
        <select
          value={data.area}
          onChange={(e) => onChange({ ...data, area: e.target.value, skip: false })}
          className="w-full rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#060d1a] px-4 py-2.5 text-sm text-white outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors appearance-none"
        >
          <option value="" className="bg-[#0d1f3c]">Selecione a área</option>
          <option value="civil" className="bg-[#0d1f3c]">Cível</option>
          <option value="trabalhista" className="bg-[#0d1f3c]">Trabalhista</option>
          <option value="penal" className="bg-[#0d1f3c]">Criminal</option>
          <option value="tributario" className="bg-[#0d1f3c]">Tributário</option>
          <option value="previdenciario" className="bg-[#0d1f3c]">Previdenciário</option>
        </select>
      </div>
      <div className="pt-1">
        <button
          type="button"
          onClick={() => onChange({ cnj: '', titulo: '', area: '', skip: true })}
          className="text-sm text-[#4A5568] hover:text-[#A0AEC0] underline underline-offset-2 transition-colors"
        >
          Ou importe depois
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Primeiro Cliente ─────────────────────────────────────────────────

interface ClienteData {
  nome: string;
  tipo: 'pf' | 'pj';
  cpfCnpj: string;
  email: string;
  skip: boolean;
}

function StepCliente({
  data,
  onChange,
}: {
  data: ClienteData;
  onChange: (d: ClienteData) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
          Nome
        </label>
        <input
          type="text"
          placeholder="Nome completo ou razão social"
          value={data.nome}
          onChange={(e) => onChange({ ...data, nome: e.target.value, skip: false })}
          className="w-full rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#060d1a] px-4 py-2.5 text-sm text-white placeholder-[#4A5568] outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors"
        />
      </div>

      {/* PF / PJ Toggle */}
      <div>
        <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
          Tipo
        </label>
        <div className="flex rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#060d1a] overflow-hidden">
          {(['pf', 'pj'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onChange({ ...data, tipo: t, skip: false })}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                data.tipo === t
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                  : 'text-[#4A5568] hover:text-[#A0AEC0]'
              }`}
            >
              {t === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
          {data.tipo === 'pf' ? 'CPF' : 'CNPJ'}
        </label>
        <input
          type="text"
          placeholder={data.tipo === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
          value={data.cpfCnpj}
          onChange={(e) => onChange({ ...data, cpfCnpj: e.target.value, skip: false })}
          className="w-full rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#060d1a] px-4 py-2.5 text-sm text-white placeholder-[#4A5568] outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors font-mono"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#A0AEC0] mb-1.5">
          E-mail
        </label>
        <input
          type="email"
          placeholder="cliente@exemplo.com.br"
          value={data.email}
          onChange={(e) => onChange({ ...data, email: e.target.value, skip: false })}
          className="w-full rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#060d1a] px-4 py-2.5 text-sm text-white placeholder-[#4A5568] outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 transition-colors"
        />
      </div>
      <div className="pt-1">
        <button
          type="button"
          onClick={() => onChange({ nome: '', tipo: 'pf', cpfCnpj: '', email: '', skip: true })}
          className="text-sm text-[#4A5568] hover:text-[#A0AEC0] underline underline-offset-2 transition-colors"
        >
          Ou cadastre depois
        </button>
      </div>
    </div>
  );
}

// ─── Step 4: Configure a IA ───────────────────────────────────────────────────

interface IAData {
  chatJuridico: boolean;
  analiseDocumentos: boolean;
  geracaoPecas: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-[rgba(192,192,192,0.1)] bg-[#060d1a] px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-[#4A5568] mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors duration-200 ${
          checked ? 'bg-[#D4AF37]' : 'bg-[#1a2d52]'
        }`}
      >
        <span
          className={`absolute h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

function StepIA({
  data,
  onChange,
}: {
  data: IAData;
  onChange: (d: IAData) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#A0AEC0] leading-relaxed">
        O APEX integra inteligência artificial para turbinar sua prática jurídica.
        Ative as funcionalidades que deseja usar agora — tudo pode ser ajustado depois.
      </p>

      <div className="space-y-2">
        <Toggle
          checked={data.chatJuridico}
          onChange={(v) => onChange({ ...data, chatJuridico: v })}
          label="Chat Jurídico"
          description="Consulte legislação, jurisprudência e tire dúvidas em linguagem natural"
        />
        <Toggle
          checked={data.analiseDocumentos}
          onChange={(v) => onChange({ ...data, analiseDocumentos: v })}
          label="Análise de Documentos"
          description="Resumo automático de contratos, petições e decisões judiciais"
        />
        <Toggle
          checked={data.geracaoPecas}
          onChange={(v) => onChange({ ...data, geracaoPecas: v })}
          label="Geração de Peças"
          description="Gere minutas de petições, contratos e pareceres com IA"
        />
      </div>

      <div className="rounded-lg border border-[rgba(192,192,192,0.08)] bg-[#D4AF37]/5 px-4 py-3">
        <p className="text-xs text-[#A0AEC0] leading-relaxed">
          Todas as funcionalidades de IA podem ser ajustadas depois nas configurações.
          Uma chave de API pode ser configurada opcionalmente para uso avançado.
        </p>
      </div>
    </div>
  );
}

// ─── Step 5: Tudo Pronto! ─────────────────────────────────────────────────────

function StepPronto({
  processoAdded,
  clienteAdded,
  onExplore,
}: {
  processoAdded: boolean;
  clienteAdded: boolean;
  onExplore: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center space-y-6">
      {/* Gold checkmark with scale-in animation */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 animate-[scaleIn_0.4s_ease-out_forwards]">
        <CheckCircle className="h-10 w-10 text-[#D4AF37]" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-2">Configuração concluída!</h3>
        <p className="text-sm text-[#A0AEC0] leading-relaxed">
          Seu escritório está pronto para operar no APEX Legal Performance.
        </p>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-3 py-1 text-xs font-medium text-[#D4AF37]">
          <Check className="h-3 w-3" /> Escritório configurado
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${processoAdded ? 'border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-[rgba(192,192,192,0.1)] bg-[rgba(192,192,192,0.05)] text-[#4A5568]'}`}>
          <Check className="h-3 w-3" />
          {processoAdded ? '1 processo adicionado' : '0 processos'}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${clienteAdded ? 'border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37]' : 'border-[rgba(192,192,192,0.1)] bg-[rgba(192,192,192,0.05)] text-[#4A5568]'}`}>
          <Check className="h-3 w-3" />
          {clienteAdded ? '1 cliente cadastrado' : '0 clientes'}
        </span>
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={onExplore}
        className="w-full rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#060d1a] hover:bg-[#B8941F] transition-colors shadow-lg shadow-[#D4AF37]/20"
      >
        Explorar Dashboard
      </button>

      {/* Quick links */}
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/legal/processes"
          onClick={onExplore}
          className="text-sm text-[#A0AEC0] hover:text-white transition-colors underline underline-offset-2"
        >
          Ver Processos
        </Link>
        <Link
          href="/legal/ai-chat"
          onClick={onExplore}
          className="text-sm text-[#A0AEC0] hover:text-white transition-colors underline underline-offset-2"
        >
          Abrir Chat IA
        </Link>
        <Link
          href="/legal/deadlines"
          onClick={onExplore}
          className="text-sm text-[#A0AEC0] hover:text-white transition-colors underline underline-offset-2"
        >
          Configurar Prazos
        </Link>
      </div>
    </div>
  );
}

// ─── Progress Dots ────────────────────────────────────────────────────────────

function ProgressDots({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const isCompleted = i < current;
        const isActive = i === current;
        return (
          <span
            key={i}
            className={`transition-all duration-300 rounded-full ${
              isActive
                ? 'h-2.5 w-2.5 bg-[#D4AF37]'
                : isCompleted
                ? 'h-2 w-2 border border-[#D4AF37] bg-transparent flex items-center justify-center'
                : 'h-2 w-2 bg-[#1a2d52]'
            }`}
          />
        );
      })}
    </div>
  );
}

// ─── Step meta ────────────────────────────────────────────────────────────────

const STEP_META = [
  {
    id: 'escritorio',
    title: 'Seu Escritório',
    description: 'Informe os dados básicos do seu escritório de advocacia.',
    Icon: Building2,
  },
  {
    id: 'processo',
    title: 'Primeiro Processo',
    description: 'Adicione seu primeiro processo ao sistema ou importe depois.',
    Icon: Briefcase,
  },
  {
    id: 'cliente',
    title: 'Primeiro Cliente',
    description: 'Cadastre um cliente ou pule e faça isso mais tarde.',
    Icon: Users,
  },
  {
    id: 'ia',
    title: 'Configure a IA',
    description: 'Ative as funcionalidades de inteligência artificial do APEX.',
    Icon: Brain,
  },
  {
    id: 'pronto',
    title: 'Tudo Pronto!',
    description: 'Seu ambiente está configurado e pronto para uso.',
    Icon: CheckCircle,
  },
];

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');

  const { addProcess, addClient } = useLegalStore();

  // Form states
  const [escritorioData, setEscritorioData] = useState<EscritorioData>({
    nome: '',
    oab: '',
    estado: '',
    numAdvogados: '',
  });

  const [processoData, setProcessoData] = useState<ProcessoData>({
    cnj: '',
    titulo: '',
    area: '',
    skip: false,
  });

  const [clienteData, setClienteData] = useState<ClienteData>({
    nome: '',
    tipo: 'pf',
    cpfCnpj: '',
    email: '',
    skip: false,
  });

  const [iaData, setIAData] = useState<IAData>({
    chatJuridico: true,
    analiseDocumentos: true,
    geracaoPecas: false,
  });

  const [processoAdded, setProcessoAdded] = useState(false);
  const [clienteAdded, setClienteAdded] = useState(false);

  const totalSteps = STEP_META.length;
  const currentMeta = STEP_META[step];

  const navigate = useCallback(
    (nextStep: number) => {
      if (animating) return;
      setDirection(nextStep > step ? 'forward' : 'back');
      setAnimating(true);
      setTimeout(() => {
        setStep(nextStep);
        setAnimating(false);
      }, 180);
    },
    [animating, step]
  );

  const handleNext = useCallback(() => {
    if (step === totalSteps - 1) return;

    // Persist data at each step transition
    if (step === 1 && !processoData.skip && processoData.cnj) {
      addProcess({
        cnj: processoData.cnj,
        title: processoData.titulo || processoData.cnj,
        area: (processoData.area as import('@/types/legal').LegalArea) || 'civil',
        status: 'active',
        urgency: 'medium',
        clientId: '',
        opposingParty: '',
        opposingLawyer: '',
        court: '',
        judge: '',
        vara: '',
        comarca: '',
        state: '',
        object: '',
        causeValue: 0,
        feeType: 'fixed',
        feeAmount: 0,
        courtSystem: 'manual',
        tags: [],
      });
      setProcessoAdded(true);
    }

    if (step === 2 && !clienteData.skip && clienteData.nome) {
      addClient({
        type: clienteData.tipo,
        name: clienteData.nome,
        cpfCnpj: clienteData.cpfCnpj,
        email: clienteData.email,
        phone: '',
        whatsapp: '',
        address: {
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: escritorioData.estado,
          zipCode: '',
        },
        notes: '',
      });
      setClienteAdded(true);
    }

    navigate(step + 1);
  }, [step, totalSteps, processoData, clienteData, escritorioData, addProcess, addClient, navigate]);

  const handleBack = useCallback(() => {
    if (step > 0) navigate(step - 1);
  }, [step, navigate]);

  const isLastStep = step === totalSteps - 1;

  // Animation class based on direction & state
  const contentClass = animating
    ? direction === 'forward'
      ? 'opacity-0 translate-x-4'
      : 'opacity-0 -translate-x-4'
    : 'opacity-100 translate-x-0';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060d1a]/95 backdrop-blur-md px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Assistente de configuração inicial"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-[rgba(192,192,192,0.15)] bg-[#0d1f3c] shadow-2xl">

        {/* Skip button */}
        <button
          type="button"
          onClick={onSkip}
          className="absolute right-4 top-4 flex items-center gap-1.5 text-xs text-[#4A5568] hover:text-[#A0AEC0] transition-colors"
          aria-label="Pular configuração inicial"
        >
          <X className="h-3.5 w-3.5" />
          Pular tudo
        </button>

        {/* Header: logo + title */}
        <div className="flex flex-col items-center px-8 pt-8 pb-6 border-b border-[rgba(192,192,192,0.08)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#C0C0C0] to-[#718096] shadow-lg shadow-[#C0C0C0]/15 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="APEX">
              <defs>
                <linearGradient id="apex-onboarding-logo" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E8E8ED" />
                  <stop offset="45%" stopColor="#C0C0C0" />
                  <stop offset="75%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#B8941F" />
                </linearGradient>
              </defs>
              <path d="M12 2L22 20H2L12 2Z" fill="url(#apex-onboarding-logo)" />
              <rect x="7" y="13.5" width="10" height="2" rx="1" fill="#0a1628" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-white tracking-tight">
            Bem-vindo ao APEX Legal Performance
          </h1>
          <p className="text-xs text-[#4A5568] mt-1 text-center max-w-xs">
            Configure seu ambiente em poucos passos e comece a trabalhar com excelência jurídica.
          </p>

          {/* Progress dots */}
          <div className="mt-4">
            <ProgressDots total={totalSteps} current={step} />
          </div>
        </div>

        {/* Step body */}
        <div className="px-8 py-6">
          {/* Step header */}
          <div
            className={`flex items-center gap-3 mb-5 transition-all duration-[180ms] ${contentClass}`}
          >
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              <currentMeta.Icon className="h-4.5 w-4.5 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{currentMeta.title}</h2>
              <p className="text-xs text-[#4A5568]">{currentMeta.description}</p>
            </div>
          </div>

          {/* Step content */}
          <div className={`transition-all duration-[180ms] ${contentClass}`}>
            {step === 0 && (
              <StepEscritorio data={escritorioData} onChange={setEscritorioData} />
            )}
            {step === 1 && (
              <StepProcesso data={processoData} onChange={setProcessoData} />
            )}
            {step === 2 && (
              <StepCliente data={clienteData} onChange={setClienteData} />
            )}
            {step === 3 && (
              <StepIA data={iaData} onChange={setIAData} />
            )}
            {step === 4 && (
              <StepPronto
                processoAdded={processoAdded}
                clienteAdded={clienteAdded}
                onExplore={onComplete}
              />
            )}
          </div>
        </div>

        {/* Navigation footer — hidden on last step (it has its own CTA) */}
        {!isLastStep && (
          <div className="flex items-center justify-between px-8 pb-6 pt-2">
            {/* Back */}
            {step > 0 ? (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1.5 text-sm text-[#4A5568] hover:text-[#A0AEC0] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Voltar
              </button>
            ) : (
              <div />
            )}

            {/* Next */}
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-[#060d1a] hover:bg-[#B8941F] transition-colors shadow-md shadow-[#D4AF37]/20"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Keyframe for checkmark scale-in */}
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
