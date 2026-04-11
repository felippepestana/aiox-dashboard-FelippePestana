'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Pause,
  Play,
  Square,
  Clock,
  ArrowLeft,
  Lightbulb,
  AlertTriangle,
  BookOpen,
  Target,
  MessageSquare,
  Star,
  StickyNote,
  Search,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  Zap,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import type {
  TranscriptEntry,
  InterviewSuggestion,
  LegalArea,
} from '@/types/legal';

// ─── Mock Data for completed session ────────────────────────────────────────

const MOCK_TRANSCRIPT: TranscriptEntry[] = [
  { id: 'te-1', speaker: 'lawyer', text: 'Bom dia, pode me contar o que aconteceu?', timestamp: '2026-04-11T09:00:00Z', confidence: 0.98 },
  { id: 'te-2', speaker: 'client', text: 'Bom dia, doutor. Fui demitida sem justa causa depois de 5 anos na empresa. Eles não pagaram minhas verbas rescisórias.', timestamp: '2026-04-11T09:00:30Z', confidence: 0.94 },
  { id: 'te-3', speaker: 'lawyer', text: 'Entendo. Quando exatamente foi a demissão?', timestamp: '2026-04-11T09:01:00Z', confidence: 0.97 },
  { id: 'te-4', speaker: 'client', text: 'Foi no dia 15 de março de 2026. Me entregaram o aviso prévio indenizado.', timestamp: '2026-04-11T09:01:30Z', confidence: 0.92 },
  { id: 'te-5', speaker: 'lawyer', text: 'E o FGTS, sabe se foi depositado corretamente durante o contrato?', timestamp: '2026-04-11T09:02:00Z', confidence: 0.96 },
  { id: 'te-6', speaker: 'client', text: 'Não sei ao certo. Nunca conferi o extrato do FGTS. Mas sei que trabalhei muitas horas extras e nunca recebi.', timestamp: '2026-04-11T09:02:30Z', confidence: 0.89 },
  { id: 'te-7', speaker: 'lawyer', text: 'Havia controle de ponto na empresa? Você batia ponto?', timestamp: '2026-04-11T09:03:00Z', confidence: 0.95 },
  { id: 'te-8', speaker: 'client', text: 'Sim, tinha ponto eletrônico. Mas muitas vezes meu chefe mandava eu não registrar as horas extras.', timestamp: '2026-04-11T09:03:30Z', confidence: 0.91 },
  { id: 'te-9', speaker: 'lawyer', text: 'Isso é muito relevante. Você tem algum comprovante, mensagem de WhatsApp, email do chefe pedindo para não registrar?', timestamp: '2026-04-11T09:04:00Z', confidence: 0.96 },
  { id: 'te-10', speaker: 'client', text: 'Tenho sim! Tenho prints de WhatsApp onde ele manda eu ficar até mais tarde e não bater ponto. Tenho uns 20 prints.', timestamp: '2026-04-11T09:04:30Z', confidence: 0.93 },
  { id: 'te-11', speaker: 'lawyer', text: 'Excelente. Guarde todos esses prints com cuidado. Havia testemunhas que também faziam horas extras sem registro?', timestamp: '2026-04-11T09:05:00Z', confidence: 0.97 },
  { id: 'te-12', speaker: 'client', text: 'Sim, a equipe toda. Pelo menos 3 colegas que podem confirmar.', timestamp: '2026-04-11T09:05:30Z', confidence: 0.90 },
  { id: 'te-13', speaker: 'lawyer', text: 'E sobre insalubridade, o ambiente de trabalho tinha alguma condição insalubre?', timestamp: '2026-04-11T09:06:00Z', confidence: 0.95 },
  { id: 'te-14', speaker: 'client', text: 'Trabalhávamos com produtos químicos no laboratório sem equipamento adequado. Só deram EPI depois de 2 anos.', timestamp: '2026-04-11T09:06:30Z', confidence: 0.88 },
  { id: 'te-15', speaker: 'lawyer', text: 'Isso configura adicional de insalubridade. Quanto era seu salário?', timestamp: '2026-04-11T09:07:00Z', confidence: 0.96 },
  { id: 'te-16', speaker: 'client', text: 'R$ 3.500,00 por mês. Entrei ganhando R$ 2.200,00 em março de 2021.', timestamp: '2026-04-11T09:07:30Z', confidence: 0.94 },
];

const MOCK_SUGGESTIONS: InterviewSuggestion[] = [
  { id: 'sug-1', type: 'question', content: 'O FGTS foi depositado corretamente durante o contrato?', relevance: 0.95, timestamp: '2026-04-11T09:01:00Z', accepted: true },
  { id: 'sug-2', type: 'question', content: 'Havia controle de ponto na empresa?', relevance: 0.92, timestamp: '2026-04-11T09:02:00Z', accepted: true },
  { id: 'sug-3', type: 'precedent', content: 'TST - Tema 1046: Validade de acordo coletivo sobre horas extras', relevance: 0.85, timestamp: '2026-04-11T09:03:00Z', accepted: false },
  { id: 'sug-4', type: 'warning', content: 'Informação pendente: Data exata de admissão para cálculo preciso', relevance: 0.90, timestamp: '2026-04-11T09:04:00Z', accepted: false },
  { id: 'sug-5', type: 'strategy', content: 'Estratégia: com prints de WhatsApp, alta chance de comprovação de horas extras', relevance: 0.88, timestamp: '2026-04-11T09:05:00Z', accepted: false },
  { id: 'sug-6', type: 'question', content: 'Recebia adicional de insalubridade ou periculosidade?', relevance: 0.91, timestamp: '2026-04-11T09:05:30Z', accepted: true },
  { id: 'sug-7', type: 'precedent', content: 'Precedente: requisitos insalubridade por agentes químicos (NR 15)', relevance: 0.87, timestamp: '2026-04-11T09:06:30Z', accepted: false },
  { id: 'sug-8', type: 'warning', content: 'Verificar se há laudo técnico do ambiente de trabalho', relevance: 0.86, timestamp: '2026-04-11T09:07:00Z', accepted: false },
];

// ─── Strategy Mock ──────────────────────────────────────────────────────────

const MOCK_STRATEGY = {
  summary: 'Reclamação trabalhista com pedidos de verbas rescisórias, horas extras, adicional de insalubridade e dano moral. Evidências fortes (prints WhatsApp) e testemunhas disponíveis.',
  claims: [
    { title: 'Verbas rescisórias', strength: 'strong' as const, basis: 'CLT art. 477' },
    { title: 'Horas extras + reflexos', strength: 'strong' as const, basis: 'CLT art. 59, CF art. 7o XVI' },
    { title: 'Adicional insalubridade', strength: 'moderate' as const, basis: 'CLT art. 189-192' },
    { title: 'FGTS + multa 40%', strength: 'strong' as const, basis: 'Lei 8.036/90 art. 18' },
    { title: 'Dano moral (fraude ponto)', strength: 'moderate' as const, basis: 'CLT art. 223-A a 223-G' },
  ],
  nextSteps: [
    'Coletar prints de WhatsApp do cliente',
    'Solicitar extrato FGTS e CNIS',
    'Identificar 3 testemunhas e colher declarações',
    'Pesquisar jurisprudência TRT local sobre fraude em ponto',
    'Elaborar reclamação trabalhista',
  ],
  riskLevel: 'Baixo - Evidências sólidas disponíveis',
  estimatedValue: 'R$ 45.000 - R$ 75.000',
  estimatedDuration: '8-14 meses',
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const AREA_LABELS: Record<LegalArea, string> = {
  civil: 'Cível', trabalhista: 'Trabalhista', tributario: 'Tributário',
  penal: 'Penal', administrativo: 'Administrativo', consumidor: 'Consumidor',
  familia: 'Família', empresarial: 'Empresarial', previdenciario: 'Previdenciário',
  ambiental: 'Ambiental', digital: 'Digital',
};

const SUGGESTION_ICONS: Record<string, typeof Lightbulb> = {
  question: MessageSquare,
  precedent: BookOpen,
  strategy: Target,
  warning: AlertTriangle,
};

const SUGGESTION_COLORS: Record<string, string> = {
  question: 'border-blue-500/30 bg-blue-500/5',
  precedent: 'border-purple-500/30 bg-purple-500/5',
  strategy: 'border-emerald-500/30 bg-emerald-500/5',
  warning: 'border-yellow-500/30 bg-yellow-500/5',
};

const SUGGESTION_ICON_COLORS: Record<string, string> = {
  question: 'text-blue-400',
  precedent: 'text-purple-400',
  strategy: 'text-emerald-400',
  warning: 'text-yellow-400',
};

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function InterviewSessionPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(480); // 8 minutes elapsed for mock
  const [transcript, setTranscript] = useState<TranscriptEntry[]>(MOCK_TRANSCRIPT);
  const [suggestions, setSuggestions] = useState<InterviewSuggestion[]>(MOCK_SUGGESTIONS);
  const [showStrategy, setShowStrategy] = useState(false);
  const [activeTab, setActiveTab] = useState<'suggestions' | 'precedents' | 'strategy'>('suggestions');
  const [markedEntries, setMarkedEntries] = useState<Set<string>>(new Set());
  const [noteText, setNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsed((prev: number) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const formatElapsed = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? `${h}:` : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    setIsPaused(false);
  }, []);

  const handlePauseRecording = useCallback(() => {
    setIsPaused(true);
  }, []);

  const handleResumeRecording = useCallback(() => {
    setIsPaused(false);
  }, []);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    setIsPaused(false);
    setShowStrategy(true);
  }, []);

  const handleMarkImportant = useCallback((entryId: string) => {
    setMarkedEntries((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  }, []);

  const handleAddNote = useCallback(() => {
    if (!noteText.trim()) return;
    const entry: TranscriptEntry = {
      id: `te-note-${Date.now()}`,
      speaker: 'system',
      text: `[NOTA] ${noteText}`,
      timestamp: new Date().toISOString(),
      confidence: 1.0,
    };
    setTranscript((prev: TranscriptEntry[]) => [...prev, entry]);
    setNoteText('');
    setShowNoteInput(false);
  }, [noteText]);

  const handleAcceptSuggestion = useCallback((id: string) => {
    setSuggestions((prev: InterviewSuggestion[]) =>
      prev.map((s: InterviewSuggestion) => (s.id === id ? { ...s, accepted: !s.accepted } : s))
    );
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (activeTab === 'precedents') return suggestions.filter((s: InterviewSuggestion) => s.type === 'precedent');
    if (activeTab === 'strategy') return suggestions.filter((s: InterviewSuggestion) => s.type === 'strategy' || s.type === 'warning');
    return suggestions;
  }, [suggestions, activeTab]);

  const strengthColor = (s: string) => {
    if (s === 'strong') return 'text-green-400 bg-green-500/10';
    if (s === 'moderate') return 'text-yellow-400 bg-yellow-500/10';
    return 'text-red-400 bg-red-500/10';
  };

  const strengthLabel = (s: string) => {
    if (s === 'strong') return 'Forte';
    if (s === 'moderate') return 'Moderada';
    return 'Fraca';
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0f1a]">
      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-[#1a2332] bg-[#0d1320] px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/legal/interview"
            className="flex items-center gap-1 text-[#6b7a8d] hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div className="h-6 w-px bg-[#1a2332]" />
          <div>
            <h2 className="text-sm font-semibold text-white">Maria Silva Santos</h2>
            <span className="text-xs text-amber-400">{AREA_LABELS.trabalhista}</span>
          </div>
        </div>

        {/* Recording controls */}
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div className="flex items-center gap-2 rounded-lg bg-[#0a0f1a] px-3 py-1.5 border border-[#1a2332]">
            <Clock className="h-4 w-4 text-[#6b7a8d]" />
            <span className={`text-sm font-mono ${isRecording && !isPaused ? 'text-red-400' : 'text-white'}`}>
              {formatElapsed(elapsed)}
            </span>
            {isRecording && !isPaused && (
              <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>

          {/* Controls */}
          {!isRecording ? (
            <button
              onClick={handleStartRecording}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-400 transition-colors"
            >
              <Mic className="h-4 w-4" />
              Gravar
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={handleResumeRecording}
                  className="flex items-center gap-2 rounded-lg bg-green-500/10 px-4 py-1.5 text-sm font-medium text-green-400 hover:bg-green-500/20 transition-colors border border-green-500/20"
                >
                  <Play className="h-4 w-4" />
                  Retomar
                </button>
              ) : (
                <button
                  onClick={handlePauseRecording}
                  className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-1.5 text-sm font-medium text-yellow-400 hover:bg-yellow-500/20 transition-colors border border-yellow-500/20"
                >
                  <Pause className="h-4 w-4" />
                  Pausar
                </button>
              )}
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-2 rounded-lg bg-[#1a2332] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2a3342] transition-colors border border-[#1a2332]"
              >
                <Square className="h-4 w-4" />
                Finalizar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content - Split View */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Transcript */}
        <div className="flex-1 flex flex-col border-r border-[#1a2332]">
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#1a2332] bg-[#0d1320]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Mic className="h-4 w-4 text-amber-400" />
              Transcrição ao Vivo
            </h3>
            <span className="text-xs text-[#6b7a8d]">{transcript.length} entradas</span>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
            {transcript.map((entry) => (
              <div
                key={entry.id}
                className={`group flex gap-3 ${
                  entry.speaker === 'system' ? 'justify-center' : ''
                }`}
              >
                {entry.speaker !== 'system' && (
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                      entry.speaker === 'lawyer'
                        ? 'bg-amber-500/10'
                        : 'bg-blue-500/10'
                    }`}
                  >
                    {entry.speaker === 'lawyer' ? (
                      <Briefcase className="h-4 w-4 text-amber-400" />
                    ) : (
                      <User className="h-4 w-4 text-blue-400" />
                    )}
                  </div>
                )}

                <div
                  className={`flex-1 ${
                    entry.speaker === 'system'
                      ? 'text-center'
                      : ''
                  }`}
                >
                  {entry.speaker !== 'system' && (
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium ${
                          entry.speaker === 'lawyer' ? 'text-amber-400' : 'text-blue-400'
                        }`}
                      >
                        {entry.speaker === 'lawyer' ? 'Advogado' : 'Cliente'}
                      </span>
                      <span className="text-[10px] text-[#6b7a8d]">
                        {formatTime(entry.timestamp)}
                      </span>
                      <span className="text-[10px] text-[#6b7a8d]">
                        {Math.round(entry.confidence * 100)}%
                      </span>
                      {markedEntries.has(entry.id) && (
                        <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                  )}

                  <p
                    className={`text-sm leading-relaxed ${
                      entry.speaker === 'system'
                        ? 'text-[#6b7a8d] italic text-xs'
                        : 'text-white'
                    } ${markedEntries.has(entry.id) ? 'border-l-2 border-amber-400 pl-2' : ''}`}
                  >
                    {entry.text}
                  </p>

                  {/* Mark as important button */}
                  {entry.speaker !== 'system' && (
                    <button
                      onClick={() => handleMarkImportant(entry.id)}
                      className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-[#6b7a8d] hover:text-amber-400 flex items-center gap-1"
                    >
                      <Star className="h-2.5 w-2.5" />
                      {markedEntries.has(entry.id) ? 'Desmarcar' : 'Marcar importante'}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>

          {/* Bottom Bar - Quick Actions */}
          <div className="flex items-center gap-2 px-6 py-3 border-t border-[#1a2332] bg-[#0d1320]">
            <button
              onClick={() => setShowNoteInput(!showNoteInput)}
              className="flex items-center gap-1.5 rounded-lg bg-[#1a2332] px-3 py-1.5 text-xs font-medium text-[#8899aa] hover:text-white hover:bg-[#2a3342] transition-colors"
            >
              <StickyNote className="h-3.5 w-3.5" />
              Adicionar Nota
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-[#1a2332] px-3 py-1.5 text-xs font-medium text-[#8899aa] hover:text-white hover:bg-[#2a3342] transition-colors">
              <Search className="h-3.5 w-3.5" />
              Buscar Precedente
            </button>
            <button className="flex items-center gap-1.5 rounded-lg bg-[#1a2332] px-3 py-1.5 text-xs font-medium text-[#8899aa] hover:text-white hover:bg-[#2a3342] transition-colors">
              <Download className="h-3.5 w-3.5" />
              Exportar
            </button>

            {showNoteInput && (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  placeholder="Digite a nota..."
                  className="flex-1 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-1.5 text-xs text-white placeholder-[#6b7a8d] focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                  autoFocus
                />
                <button
                  onClick={handleAddNote}
                  className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  Salvar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - AI Suggestions / Strategy */}
        <div className="w-[420px] flex flex-col bg-[#0d1320]">
          {/* Panel Tabs */}
          <div className="flex items-center border-b border-[#1a2332]">
            {[
              { key: 'suggestions', label: 'Sugestões', icon: Lightbulb },
              { key: 'precedents', label: 'Precedentes', icon: BookOpen },
              { key: 'strategy', label: 'Estratégia', icon: Target },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors border-b-2 ${
                  activeTab === tab.key
                    ? 'text-amber-400 border-amber-400'
                    : 'text-[#6b7a8d] border-transparent hover:text-white'
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {!showStrategy ? (
              /* Suggestions during interview */
              filteredSuggestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#6b7a8d]">
                  <Lightbulb className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-xs">Nenhuma sugestão nesta categoria</p>
                </div>
              ) : (
                filteredSuggestions.map((suggestion) => {
                  const Icon = SUGGESTION_ICONS[suggestion.type] || Lightbulb;
                  const colorClass = SUGGESTION_COLORS[suggestion.type] || '';
                  const iconColor = SUGGESTION_ICON_COLORS[suggestion.type] || 'text-amber-400';

                  return (
                    <div
                      key={suggestion.id}
                      className={`rounded-lg border p-3 ${colorClass} ${
                        suggestion.accepted ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white leading-relaxed">
                            {suggestion.content}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-[#6b7a8d]">
                                Relevância: {Math.round(suggestion.relevance * 100)}%
                              </span>
                              <span className="text-[10px] text-[#6b7a8d]">
                                {formatTime(suggestion.timestamp)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleAcceptSuggestion(suggestion.id)}
                              className={`text-[10px] flex items-center gap-1 ${
                                suggestion.accepted
                                  ? 'text-green-400'
                                  : 'text-[#6b7a8d] hover:text-amber-400'
                              } transition-colors`}
                            >
                              {suggestion.accepted ? (
                                <><CheckCircle2 className="h-3 w-3" /> Usada</>
                              ) : (
                                <><Zap className="h-3 w-3" /> Usar</>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              /* Post-interview strategy */
              <div className="space-y-4">
                {/* Summary */}
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5" />
                    Resumo da Estratégia
                  </h4>
                  <p className="text-xs text-white leading-relaxed">{MOCK_STRATEGY.summary}</p>
                </div>

                {/* Claims */}
                <div>
                  <h4 className="text-xs font-semibold text-[#6b7a8d] uppercase tracking-wider mb-2">
                    Teses Identificadas
                  </h4>
                  <div className="space-y-2">
                    {MOCK_STRATEGY.claims.map((claim, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2"
                      >
                        <div>
                          <p className="text-xs text-white font-medium">{claim.title}</p>
                          <p className="text-[10px] text-[#6b7a8d]">{claim.basis}</p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${strengthColor(claim.strength)}`}
                        >
                          {strengthLabel(claim.strength)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Risk / Value / Duration */}
                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2">
                    <p className="text-[10px] text-[#6b7a8d] uppercase">Nível de Risco</p>
                    <p className="text-xs text-green-400 font-medium">{MOCK_STRATEGY.riskLevel}</p>
                  </div>
                  <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2">
                    <p className="text-[10px] text-[#6b7a8d] uppercase">Valor Estimado</p>
                    <p className="text-xs text-white font-medium">{MOCK_STRATEGY.estimatedValue}</p>
                  </div>
                  <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2">
                    <p className="text-[10px] text-[#6b7a8d] uppercase">Duração Estimada</p>
                    <p className="text-xs text-white font-medium">{MOCK_STRATEGY.estimatedDuration}</p>
                  </div>
                </div>

                {/* Next Steps */}
                <div>
                  <h4 className="text-xs font-semibold text-[#6b7a8d] uppercase tracking-wider mb-2">
                    Próximos Passos
                  </h4>
                  <div className="space-y-1.5">
                    {MOCK_STRATEGY.nextSteps.map((step, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-white"
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Export Actions */}
                <div className="flex flex-col gap-2 pt-2">
                  <button className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-black hover:bg-amber-400 transition-colors">
                    <FileText className="h-3.5 w-3.5" />
                    Gerar Petição Inicial
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-lg bg-[#1a2332] px-4 py-2 text-xs font-medium text-white hover:bg-[#2a3342] transition-colors border border-[#1a2332]">
                    <Download className="h-3.5 w-3.5" />
                    Exportar Relatório
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
