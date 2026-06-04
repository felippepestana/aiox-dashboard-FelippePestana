'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Mic,
  Plus,
  Clock,
  Users,
  BarChart3,
  Search,
  Play,
  Pause,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Filter,
  Zap,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  UserPlus,
  FileText,
  TrendingUp,
  CalendarDays,
  MessageSquare,
  AlertCircle,
  ListChecks,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import type { InterviewSession, LegalArea } from '@/types/legal';
import { PageHeader } from '@/components/legal/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

type InterviewType = 'consulta_inicial' | 'acompanhamento' | 'analise_caso';

interface ExtendedSession extends InterviewSession {
  clientName: string;
  duration: number;
  interviewType: InterviewType;
  notes?: string;
  aiSummary?: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const MOCK_SESSIONS: ExtendedSession[] = [
  {
    id: 'int-001',
    clientId: 'cli-001',
    clientName: 'Maria Silva Santos',
    area: 'trabalhista',
    interviewType: 'consulta_inicial',
    status: 'completed',
    startedAt: '2026-04-10T09:00:00Z',
    endedAt: '2026-04-10T09:45:00Z',
    duration: 45,
    notes:
      'Cliente demitida sem justa causa. Possui provas de horas extras não pagas (prints WhatsApp). Três testemunhas disponíveis. Trabalhou com produtos químicos sem EPI adequado por 2 anos.',
    aiSummary:
      'Caso trabalhista com forte potencial. Teses: verbas rescisórias, horas extras com reflexos, adicional de insalubridade e FGTS + multa 40%. Evidências sólidas (prints WhatsApp). Valor estimado: R$ 45k–75k.',
    transcriptEntries: Array.from({ length: 32 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? ('lawyer' as const) : ('client' as const),
      text: 'Transcrição...',
      timestamp: new Date(Date.now() - (32 - i) * 60000).toISOString(),
      confidence: 0.92,
    })),
    suggestions: [],
    strategyDraft: 'Estratégia gerada',
  },
  {
    id: 'int-002',
    clientId: 'cli-002',
    clientName: 'João Pedro Oliveira',
    area: 'civil',
    interviewType: 'acompanhamento',
    status: 'completed',
    startedAt: '2026-04-09T14:00:00Z',
    endedAt: '2026-04-09T14:30:00Z',
    duration: 30,
    notes: 'Atualização sobre andamento do processo. Cliente satisfeito com o progresso.',
    transcriptEntries: Array.from({ length: 18 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? ('lawyer' as const) : ('client' as const),
      text: 'Transcrição...',
      timestamp: new Date(Date.now() - (18 - i) * 60000).toISOString(),
      confidence: 0.88,
    })),
    suggestions: [],
    strategyDraft: 'Estratégia gerada',
  },
  {
    id: 'int-003',
    clientId: 'cli-003',
    clientName: 'Ana Beatriz Costa',
    area: 'consumidor',
    interviewType: 'analise_caso',
    status: 'completed',
    startedAt: '2026-04-08T10:00:00Z',
    endedAt: '2026-04-08T11:15:00Z',
    duration: 75,
    notes: 'Produto com defeito oculto. Empresa se recusa a trocar. Já tentou Procon sem sucesso.',
    transcriptEntries: Array.from({ length: 48 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? ('lawyer' as const) : ('client' as const),
      text: 'Transcrição...',
      timestamp: new Date(Date.now() - (48 - i) * 60000).toISOString(),
      confidence: 0.95,
    })),
    suggestions: [],
    strategyDraft: 'Estratégia gerada',
  },
  {
    id: 'int-004',
    clientId: 'cli-004',
    clientName: 'Roberto Carlos Mendes',
    area: 'tributario',
    interviewType: 'consulta_inicial',
    status: 'paused',
    startedAt: '2026-04-11T08:00:00Z',
    duration: 20,
    notes: 'Autuação fiscal em aberto. Precisa revisar documentos contábeis.',
    transcriptEntries: Array.from({ length: 12 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? ('lawyer' as const) : ('client' as const),
      text: 'Transcrição...',
      timestamp: new Date(Date.now() - (12 - i) * 60000).toISOString(),
      confidence: 0.9,
    })),
    suggestions: [],
  },
  {
    id: 'int-005',
    clientId: 'cli-005',
    clientName: 'Fernanda Lima Souza',
    area: 'familia',
    interviewType: 'acompanhamento',
    status: 'completed',
    startedAt: '2026-04-07T16:00:00Z',
    endedAt: '2026-04-07T17:00:00Z',
    duration: 60,
    notes: 'Divórcio consensual com partilha de bens imóveis. Guarda compartilhada acordada.',
    transcriptEntries: Array.from({ length: 40 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? ('lawyer' as const) : ('client' as const),
      text: 'Transcrição...',
      timestamp: new Date(Date.now() - (40 - i) * 60000).toISOString(),
      confidence: 0.91,
    })),
    suggestions: [],
    strategyDraft: 'Estratégia gerada',
  },
  {
    id: 'int-006',
    clientId: 'cli-006',
    clientName: 'Carlos Eduardo Barros',
    area: 'penal',
    interviewType: 'analise_caso',
    status: 'active',
    startedAt: '2026-04-11T10:30:00Z',
    duration: 15,
    notes: '',
    transcriptEntries: Array.from({ length: 8 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? ('lawyer' as const) : ('client' as const),
      text: 'Transcrição...',
      timestamp: new Date(Date.now() - (8 - i) * 60000).toISOString(),
      confidence: 0.87,
    })),
    suggestions: [],
  },
];

// ─── Helpers & Constants ─────────────────────────────────────────────────────

const AREA_LABELS: Record<LegalArea, string> = {
  civil: 'Cível',
  trabalhista: 'Trabalhista',
  tributario: 'Tributário',
  penal: 'Penal',
  administrativo: 'Administrativo',
  consumidor: 'Consumidor',
  familia: 'Família',
  empresarial: 'Empresarial',
  previdenciario: 'Previdenciário',
  ambiental: 'Ambiental',
  digital: 'Digital',
};

const AREA_COLORS: Record<string, string> = {
  civil: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  trabalhista: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  tributario: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  penal: 'bg-red-500/10 text-red-400 border-red-500/20',
  administrativo: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  consumidor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  familia: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  empresarial: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  previdenciario: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ambiental: 'bg-green-500/10 text-green-400 border-green-500/20',
  digital: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Play; color: string }> = {
  active: { label: 'Em Andamento', icon: Play, color: 'text-green-400 bg-green-500/10' },
  paused: { label: 'Pausada', icon: Pause, color: 'text-yellow-400 bg-yellow-500/10' },
  completed: { label: 'Concluída', icon: CheckCircle2, color: 'text-blue-400 bg-blue-500/10' },
  scheduled: { label: 'Agendada', icon: CalendarDays, color: 'text-purple-400 bg-purple-500/10' },
};

const INTERVIEW_TYPE_CONFIG: Record<
  InterviewType,
  { label: string; description: string; color: string }
> = {
  consulta_inicial: {
    label: 'Consulta Inicial',
    description: 'Primeira consulta com novo cliente',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  acompanhamento: {
    label: 'Acompanhamento',
    description: 'Atualização de processo em andamento',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  analise_caso: {
    label: 'Análise de Caso',
    description: 'Análise aprofundada de situação jurídica',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  },
};

// Suggested questions by area for the AI questionnaire
const AREA_QUESTIONS: Record<string, string[]> = {
  trabalhista: [
    'Qual era o cargo e função exercida?',
    'Quanto tempo de empresa?',
    'Houve aviso prévio? Indenizado ou trabalhado?',
    'As verbas rescisórias foram pagas integralmente?',
    'Havia controle de ponto? Era respeitado?',
    'Existem horas extras não pagas?',
    'Havia insalubridade ou periculosidade no ambiente?',
    'O FGTS foi depositado corretamente?',
    'Existem testemunhas disponíveis?',
    'Há documentos, prints ou e-mails relevantes?',
  ],
  civil: [
    'Qual é a natureza da relação com a outra parte?',
    'Há contrato escrito? Está disponível?',
    'Qual o valor envolvido na disputa?',
    'Há provas documentais (recibos, e-mails, fotos)?',
    'Qual foi a última tentativa de resolver amigavelmente?',
    'Há outros envolvidos no caso?',
    'Quando ocorreu o fato gerador?',
    'Houve alguma comunicação formal entre as partes?',
  ],
  consumidor: [
    'Qual produto/serviço foi adquirido?',
    'Quando foi a compra? Há nota fiscal?',
    'Qual o defeito ou problema apresentado?',
    'A empresa foi acionada? Qual foi a resposta?',
    'Tentou Procon ou plataforma de reclamação?',
    'Há laudo técnico do defeito?',
    'Qual o valor do produto/serviço?',
    'Houve dano material ou moral comprovável?',
  ],
  familia: [
    'Qual o estado civil atual? Há documentação?',
    'Há filhos menores? Quantos e quais idades?',
    'Existe acordo entre as partes?',
    'Quais bens compõem o patrimônio?',
    'Qual o regime de bens do casamento?',
    'Há dívidas em comum?',
    'A guarda é objeto de disputa?',
    'Há pensão alimentícia a discutir?',
  ],
  tributario: [
    'Qual o porte e regime tributário da empresa?',
    'Qual tributo é objeto da autuação?',
    'Qual o valor do auto de infração?',
    'Há documentação contábil completa?',
    'Já houve impugnação administrativa?',
    'Quais são os prazos para recurso?',
    'Há parcelamentos tributários em andamento?',
    'A empresa usa contabilidade terceirizada?',
  ],
  penal: [
    'Qual o crime imputado?',
    'Há boletim de ocorrência? Número?',
    'O cliente foi intimado ou preso?',
    'Há inquérito ou ação penal em curso?',
    'Existem testemunhas de defesa?',
    'Há provas que contrariam a acusação?',
    'O cliente tem antecedentes criminais?',
    'Qual é o estado emocional do cliente?',
  ],
};

const DEFAULT_QUESTIONS = [
  'Pode me contar o que aconteceu com suas próprias palavras?',
  'Quando os fatos ocorreram exatamente?',
  'Há documentos ou provas disponíveis?',
  'Houve tentativa de resolver amigavelmente?',
  'Quais são suas expectativas com relação a este caso?',
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── New Interview Modal ──────────────────────────────────────────────────────

interface NewInterviewModalProps {
  onClose: () => void;
  onStart: (session: Omit<ExtendedSession, 'id' | 'transcriptEntries' | 'suggestions'>) => void;
}

function NewInterviewModal({ onClose, onStart }: NewInterviewModalProps) {
  const { clients } = useLegalStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [clientMode, setClientMode] = useState<'existing' | 'new'>('existing');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [selectedArea, setSelectedArea] = useState<LegalArea>('trabalhista');
  const [selectedType, setSelectedType] = useState<InterviewType>('consulta_inicial');
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionsGenerated, setQuestionsGenerated] = useState(false);

  const clientName =
    clientMode === 'existing'
      ? clients.find((c) => c.id === selectedClientId)?.name || ''
      : newClientName;

  const canProceedStep1 =
    clientMode === 'existing' ? !!selectedClientId : newClientName.trim().length > 0;

  const canProceedStep2 = !!selectedArea && !!selectedType;

  async function handleGenerateQuestions() {
    setGeneratingQuestions(true);
    setQuestionsGenerated(false);

    // Try to call the AI; fallback to local template questions
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Você é um advogado especialista em ${AREA_LABELS[selectedArea]}.
Gere 8 perguntas estratégicas para uma entrevista do tipo "${INTERVIEW_TYPE_CONFIG[selectedType].label}" na área de ${AREA_LABELS[selectedArea]}.
Foque nas informações jurídicas mais importantes a coletar.
Responda APENAS com as perguntas, uma por linha, numeradas de 1 a 8. Sem explicações adicionais.`,
            },
          ],
          taskType: 'chat_response',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const lines = (data.content as string)
          .split('\n')
          .map((l: string) => l.replace(/^\d+\.\s*/, '').trim())
          .filter((l: string) => l.length > 10)
          .slice(0, 8);
        setQuestions(lines.length > 0 ? lines : AREA_QUESTIONS[selectedArea] || DEFAULT_QUESTIONS);
      } else {
        throw new Error('AI unavailable');
      }
    } catch {
      // Graceful fallback
      setQuestions(AREA_QUESTIONS[selectedArea] || DEFAULT_QUESTIONS);
    } finally {
      setGeneratingQuestions(false);
      setQuestionsGenerated(true);
    }
  }

  function handleStart() {
    onStart({
      clientId: clientMode === 'existing' ? selectedClientId : undefined,
      clientName,
      area: selectedArea,
      interviewType: selectedType,
      status: 'active',
      startedAt: new Date().toISOString(),
      duration: 0,
      notes: '',
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-[#1a2d52]/80 bg-[#0d1f3c] shadow-2xl shadow-black/60 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1a2d52]/60 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Mic className="h-5 w-5 text-amber-400" />
              Nova Entrevista
            </h2>
            <p className="text-xs text-[#4A5568] mt-0.5">
              Passo {step} de 3 —{' '}
              {step === 1
                ? 'Selecionar cliente'
                : step === 2
                ? 'Tipo de entrevista'
                : 'Roteiro de perguntas'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#4A5568] hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-0 border-b border-[#1a2d52]/40">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 transition-colors ${
                s <= step ? 'bg-amber-400' : 'bg-[#1a2d52]'
              }`}
            />
          ))}
        </div>

        <div className="px-6 py-6">
          {/* Step 1: Client */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setClientMode('existing')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
                    clientMode === 'existing'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-[#060d1a] text-[#4A5568] border-[#1a2d52]/80 hover:text-white'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Cliente Existente
                </button>
                <button
                  onClick={() => setClientMode('new')}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
                    clientMode === 'new'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-[#060d1a] text-[#4A5568] border-[#1a2d52]/80 hover:text-white'
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  Novo Cliente
                </button>
              </div>

              {clientMode === 'existing' ? (
                <div>
                  <label className="block text-xs font-medium text-[#A0AEC0] mb-2">
                    Selecionar cliente
                  </label>
                  {clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#1a2d52]/80 bg-[#060d1a] p-6 text-[#4A5568]">
                      <Users className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">Nenhum cliente cadastrado</p>
                      <button
                        onClick={() => setClientMode('new')}
                        className="mt-2 text-xs text-amber-400 hover:text-amber-300"
                      >
                        Criar novo cliente
                      </button>
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                      {clients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedClientId(c.id)}
                          className={`w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                            selectedClientId === c.id
                              ? 'border-amber-500/40 bg-amber-500/5'
                              : 'border-[#1a2d52]/60 bg-[#060d1a] hover:border-[#1a2d52]'
                          }`}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a2d52] text-xs font-bold text-[#C0C0C0] flex-shrink-0">
                            {c.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{c.name}</p>
                            <p className="text-xs text-[#4A5568]">
                              {c.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                              {c.email ? ` · ${c.email}` : ''}
                            </p>
                          </div>
                          {selectedClientId === c.id && (
                            <CheckCircle2 className="h-4 w-4 text-amber-400 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-[#A0AEC0] mb-2">
                    Nome do cliente
                  </label>
                  <input
                    type="text"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Digite o nome completo..."
                    className="w-full rounded-lg border border-[#1a2d52]/80 bg-[#060d1a] px-3 py-2.5 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500/40 transition-colors"
                    autoFocus
                  />
                  <p className="mt-1.5 text-xs text-[#4A5568]">
                    O cliente será cadastrado após a entrevista.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Area + Type */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-[#A0AEC0] mb-2">
                  Área Jurídica
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {(Object.keys(AREA_LABELS) as LegalArea[]).map((area) => (
                    <button
                      key={area}
                      onClick={() => setSelectedArea(area)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                        selectedArea === area
                          ? AREA_COLORS[area] || 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-[#060d1a] text-[#4A5568] border-[#1a2d52]/80 hover:text-[#A0AEC0] hover:border-[#1a2d52]'
                      }`}
                    >
                      {AREA_LABELS[area]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#A0AEC0] mb-2">
                  Tipo de Entrevista
                </label>
                <div className="space-y-2">
                  {(Object.keys(INTERVIEW_TYPE_CONFIG) as InterviewType[]).map((type) => {
                    const cfg = INTERVIEW_TYPE_CONFIG[type];
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedType(type)}
                        className={`w-full flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors ${
                          selectedType === type
                            ? 'border-amber-500/40 bg-amber-500/5'
                            : 'border-[#1a2d52]/60 bg-[#060d1a] hover:border-[#1a2d52]'
                        }`}
                      >
                        <div className="mt-0.5">
                          <FileText
                            className={`h-4 w-4 ${
                              selectedType === type ? 'text-amber-400' : 'text-[#4A5568]'
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm font-medium ${
                              selectedType === type ? 'text-white' : 'text-[#A0AEC0]'
                            }`}
                          >
                            {cfg.label}
                          </p>
                          <p className="text-xs text-[#4A5568] mt-0.5">{cfg.description}</p>
                        </div>
                        {selectedType === type && (
                          <CheckCircle2 className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: AI Questionnaire */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    Roteiro de Perguntas — {AREA_LABELS[selectedArea]}
                  </p>
                  <p className="text-xs text-[#4A5568] mt-0.5">
                    {INTERVIEW_TYPE_CONFIG[selectedType].label} · {clientName}
                  </p>
                </div>
                <button
                  onClick={handleGenerateQuestions}
                  disabled={generatingQuestions}
                  className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {generatingQuestions ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )}
                  {questionsGenerated ? 'Regenerar com IA' : 'Gerar com IA'}
                </button>
              </div>

              <div className="rounded-lg border border-[#1a2d52]/60 bg-[#060d1a] divide-y divide-[#1a2d52]/40 max-h-72 overflow-y-auto">
                {(questions.length > 0
                  ? questions
                  : AREA_QUESTIONS[selectedArea] || DEFAULT_QUESTIONS
                ).map((q, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-sm text-[#A0AEC0] leading-relaxed">{q}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2.5">
                <AlertCircle className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-300/80">
                  Este roteiro servirá como guia durante a entrevista. O Assistente de IA irá
                  sugerir perguntas adicionais em tempo real.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#1a2d52]/60 px-6 py-4">
          <button
            onClick={() => (step > 1 ? setStep((s) => (s - 1) as 1 | 2 | 3) : onClose())}
            className="text-sm text-[#4A5568] hover:text-white transition-colors"
          >
            {step > 1 ? 'Voltar' : 'Cancelar'}
          </button>

          {step < 3 ? (
            <button
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href="/legal/interview/new"
              onClick={handleStart}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20"
            >
              <Mic className="h-4 w-4" />
              Iniciar Entrevista
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Session Card ────────────────────────────────────────────────────────────

function SessionCard({ session }: { session: ExtendedSession }) {
  const [expanded, setExpanded] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState(session.aiSummary || '');

  const statusConf = STATUS_CONFIG[session.status];
  const StatusIcon = statusConf.icon;

  async function handleSummarize() {
    if (!session.notes) return;
    setSummarizing(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: `Resuma em 2-3 frases concisas as seguintes notas de entrevista jurídica (área: ${AREA_LABELS[session.area]}).
Inclua: situação principal, pontos-chave e próxima ação recomendada.
Notas: "${session.notes}"`,
            },
          ],
          taskType: 'chat_response',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.content as string);
      } else {
        setSummary(
          `Resumo automático indisponível. Configure a OPENROUTER_API_KEY para usar a IA.`
        );
      }
    } catch {
      setSummary(`Erro ao gerar resumo. Verifique a configuração da IA.`);
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#1a2d52]/60 bg-[#0d1f3c] transition-all hover:border-[#1a2d52]">
      {/* Main Row */}
      <div className="flex items-center justify-between p-5">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Status icon */}
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${statusConf.color}`}
          >
            <StatusIcon className="h-5 w-5" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white truncate">{session.clientName}</h3>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                  AREA_COLORS[session.area] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}
              >
                {AREA_LABELS[session.area]}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                  INTERVIEW_TYPE_CONFIG[session.interviewType]?.color ||
                  'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}
              >
                {INTERVIEW_TYPE_CONFIG[session.interviewType]?.label}
              </span>
              {session.strategyDraft && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                  <Zap className="h-2.5 w-2.5" />
                  Estratégia
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-[#4A5568]">
                <Calendar className="h-3 w-3" />
                {formatDate(session.startedAt)}
              </span>
              <span className="flex items-center gap-1 text-xs text-[#4A5568]">
                <Clock className="h-3 w-3" />
                {formatTime(session.startedAt)} · {session.duration} min
              </span>
              <span className="flex items-center gap-1 text-xs text-[#4A5568]">
                <MessageSquare className="h-3 w-3" />
                {session.transcriptEntries.length} trechos
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <Link
            href={`/legal/interview/${session.id}`}
            className="flex items-center gap-1.5 rounded-lg bg-[#060d1a] border border-[#1a2d52]/80 px-3 py-1.5 text-xs font-medium text-[#A0AEC0] hover:text-white hover:border-[#1a2d52] transition-colors"
          >
            Abrir
            <ArrowRight className="h-3 w-3" />
          </Link>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[#4A5568] hover:text-white transition-colors p-1.5"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#1a2d52]/40 px-5 pb-5 pt-4 space-y-4">
          {/* Notes */}
          {session.notes ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4A5568] mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Notas da Entrevista
              </p>
              <p className="text-sm text-[#A0AEC0] leading-relaxed">{session.notes}</p>
            </div>
          ) : (
            <p className="text-xs text-[#4A5568] italic">Sem notas registradas.</p>
          )}

          {/* AI Summary */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4A5568] flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Resumo por IA
              </p>
              {session.notes && (
                <button
                  onClick={handleSummarize}
                  disabled={summarizing}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {summarizing ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="h-3 w-3" />
                  )}
                  {summary ? 'Resumir novamente' : 'Gerar Resumo'}
                </button>
              )}
            </div>
            {summary ? (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5">
                <p className="text-xs text-[#A0AEC0] leading-relaxed">{summary}</p>
              </div>
            ) : (
              <p className="text-xs text-[#4A5568] italic">
                Clique em &quot;Gerar Resumo&quot; para criar um resumo automático com IA.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function InterviewListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [sessions] = useState<ExtendedSession[]>(MOCK_SESSIONS);

  const filteredSessions = useMemo(() => {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const rangeMs =
      dateRange === '7d'
        ? 7 * dayMs
        : dateRange === '30d'
        ? 30 * dayMs
        : dateRange === '90d'
        ? 90 * dayMs
        : Infinity;

    return sessions.filter((session) => {
      const matchesSearch =
        !searchQuery ||
        session.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        AREA_LABELS[session.area].toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
      const matchesType = typeFilter === 'all' || session.interviewType === typeFilter;
      const matchesDate =
        dateRange === 'all' ||
        now - new Date(session.startedAt).getTime() <= rangeMs;

      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });
  }, [searchQuery, statusFilter, typeFilter, dateRange, sessions]);

  // Stats
  const totalInterviews = sessions.length;
  const thisMonth = sessions.filter((s) => {
    const d = new Date(s.startedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const avgDuration = Math.round(
    sessions.reduce((sum, s) => sum + s.duration, 0) / totalInterviews
  );
  const conversionRate = Math.round(
    (sessions.filter((s) => s.strategyDraft).length / totalInterviews) * 100
  );

  const handleNewInterviewStart = useCallback(
    (_session: Omit<ExtendedSession, 'id' | 'transcriptEntries' | 'suggestions'>) => {
      setShowNewModal(false);
      // In production: create session in store and redirect
    },
    []
  );

  return (
    <div className="min-h-screen bg-[#060d1a] p-6 space-y-6">
      {/* New Interview Modal */}
      {showNewModal && (
        <NewInterviewModal
          onClose={() => setShowNewModal(false)}
          onStart={handleNewInterviewStart}
        />
      )}

      {/* Header */}
      <PageHeader
        title="Assistente de Entrevista"
        subtitle="Transcrição em tempo real, roteiro assistido por IA e geração de estratégia"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Entrevistas', href: '/legal/interview' },
        ]}
        actions={
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            Nova Entrevista
          </button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Total de Entrevistas',
            value: totalInterviews.toString(),
            icon: Users,
            sub: 'registradas',
          },
          {
            label: 'Este Mês',
            value: thisMonth.toString(),
            icon: CalendarDays,
            sub: 'entrevistas',
          },
          {
            label: 'Duração Média',
            value: `${avgDuration} min`,
            icon: Clock,
            sub: 'por sessão',
          },
          {
            label: 'Taxa de Conversão',
            value: `${conversionRate}%`,
            icon: TrendingUp,
            sub: 'entrevista → estratégia',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#1a2d52]/60 bg-[#0d1f3c] p-5 hover:border-[#1a2d52] transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-[#4A5568] uppercase tracking-wider">{stat.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                <p className="text-[10px] text-[#4A5568] mt-0.5">{stat.sub}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#C0C0C0]/10">
                <stat.icon className="h-4.5 w-4.5 text-[#C0C0C0] h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interview type breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(Object.keys(INTERVIEW_TYPE_CONFIG) as InterviewType[]).map((type) => {
          const cfg = INTERVIEW_TYPE_CONFIG[type];
          const count = sessions.filter((s) => s.interviewType === type).length;
          const pct = Math.round((count / totalInterviews) * 100);
          return (
            <div
              key={type}
              className="flex items-center gap-4 rounded-xl border border-[#1a2d52]/60 bg-[#0d1f3c] px-5 py-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#A0AEC0]">{cfg.label}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1.5 rounded-full bg-[#1a2d52]">
                    <div
                      className="h-1.5 rounded-full bg-[#D4AF37]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-white">{count}</span>
                </div>
              </div>
              <ListChecks className="h-4 w-4 text-[#4A5568] flex-shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4A5568]" />
          <input
            type="text"
            placeholder="Buscar por cliente ou área..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1a2d52]/60 bg-[#0d1f3c] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4A5568] focus:outline-none focus:ring-1 focus:ring-[#C0C0C0]/20 focus:border-[#C0C0C0]/20 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-[#4A5568]" />

          {/* Status filter */}
          {(['all', 'active', 'paused', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                statusFilter === status
                  ? 'bg-[#C0C0C0]/10 text-[#C0C0C0] border-[#C0C0C0]/20'
                  : 'bg-[#0d1f3c] text-[#4A5568] border-[#1a2d52]/60 hover:text-white hover:border-[#1a2d52]'
              }`}
            >
              {status === 'all' ? 'Todas' : STATUS_CONFIG[status]?.label || status}
            </button>
          ))}

          {/* Divider */}
          <div className="h-4 w-px bg-[#1a2d52]" />

          {/* Type filter */}
          {(['all', 'consulta_inicial', 'acompanhamento', 'analise_caso'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                typeFilter === type
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-[#0d1f3c] text-[#4A5568] border-[#1a2d52]/60 hover:text-white hover:border-[#1a2d52]'
              }`}
            >
              {type === 'all' ? 'Todos tipos' : INTERVIEW_TYPE_CONFIG[type].label}
            </button>
          ))}

          {/* Divider */}
          <div className="h-4 w-px bg-[#1a2d52]" />

          {/* Date range */}
          {(['all', '7d', '30d', '90d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                dateRange === range
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  : 'bg-[#0d1f3c] text-[#4A5568] border-[#1a2d52]/60 hover:text-white hover:border-[#1a2d52]'
              }`}
            >
              {range === 'all'
                ? 'Todo período'
                : range === '7d'
                ? '7 dias'
                : range === '30d'
                ? '30 dias'
                : '90 dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || dateRange !== 'all') && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-[#4A5568]">
            {filteredSessions.length} de {sessions.length} entrevistas
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setTypeFilter('all');
              setDateRange('all');
            }}
            className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {/* Session List */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#4A5568]">
            <Mic className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm font-medium text-[#A0AEC0]">Nenhuma entrevista encontrada</p>
            <p className="text-xs mt-1">Tente ajustar os filtros ou inicie uma nova entrevista</p>
            <button
              onClick={() => setShowNewModal(true)}
              className="mt-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova Entrevista
            </button>
          </div>
        ) : (
          filteredSessions.map((session) => <SessionCard key={session.id} session={session} />)
        )}
      </div>
    </div>
  );
}
