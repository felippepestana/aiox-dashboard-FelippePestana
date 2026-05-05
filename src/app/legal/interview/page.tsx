'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import type { InterviewSession, LegalArea } from '@/types/legal';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_SESSIONS: (InterviewSession & { clientName: string; duration: number })[] = [
  {
    id: 'int-001',
    clientId: 'cli-001',
    clientName: 'Maria Silva Santos',
    area: 'trabalhista',
    status: 'completed',
    startedAt: '2026-04-10T09:00:00Z',
    endedAt: '2026-04-10T09:45:00Z',
    duration: 45,
    transcriptEntries: Array.from({ length: 32 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? 'lawyer' as const : 'client' as const,
      text: 'Transcrição da entrevista...',
      timestamp: new Date(Date.now() - (32 - i) * 60000).toISOString(),
      confidence: 0.92,
    })),
    suggestions: [],
    strategyDraft: 'Estratégia gerada com sucesso',
  },
  {
    id: 'int-002',
    clientId: 'cli-002',
    clientName: 'João Pedro Oliveira',
    area: 'civil',
    status: 'completed',
    startedAt: '2026-04-09T14:00:00Z',
    endedAt: '2026-04-09T14:30:00Z',
    duration: 30,
    transcriptEntries: Array.from({ length: 18 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? 'lawyer' as const : 'client' as const,
      text: 'Transcrição da entrevista...',
      timestamp: new Date(Date.now() - (18 - i) * 60000).toISOString(),
      confidence: 0.88,
    })),
    suggestions: [],
    strategyDraft: 'Estratégia gerada com sucesso',
  },
  {
    id: 'int-003',
    clientId: 'cli-003',
    clientName: 'Ana Beatriz Costa',
    area: 'consumidor',
    status: 'completed',
    startedAt: '2026-04-08T10:00:00Z',
    endedAt: '2026-04-08T11:15:00Z',
    duration: 75,
    transcriptEntries: Array.from({ length: 48 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? 'lawyer' as const : 'client' as const,
      text: 'Transcrição da entrevista...',
      timestamp: new Date(Date.now() - (48 - i) * 60000).toISOString(),
      confidence: 0.95,
    })),
    suggestions: [],
    strategyDraft: 'Estratégia gerada com sucesso',
  },
  {
    id: 'int-004',
    clientId: 'cli-004',
    clientName: 'Roberto Carlos Mendes',
    area: 'tributario',
    status: 'paused',
    startedAt: '2026-04-11T08:00:00Z',
    duration: 20,
    transcriptEntries: Array.from({ length: 12 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? 'lawyer' as const : 'client' as const,
      text: 'Transcrição da entrevista...',
      timestamp: new Date(Date.now() - (12 - i) * 60000).toISOString(),
      confidence: 0.90,
    })),
    suggestions: [],
  },
  {
    id: 'int-005',
    clientId: 'cli-005',
    clientName: 'Fernanda Lima Souza',
    area: 'familia',
    status: 'completed',
    startedAt: '2026-04-07T16:00:00Z',
    endedAt: '2026-04-07T17:00:00Z',
    duration: 60,
    transcriptEntries: Array.from({ length: 40 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? 'lawyer' as const : 'client' as const,
      text: 'Transcrição da entrevista...',
      timestamp: new Date(Date.now() - (40 - i) * 60000).toISOString(),
      confidence: 0.91,
    })),
    suggestions: [],
    strategyDraft: 'Estratégia gerada com sucesso',
  },
  {
    id: 'int-006',
    clientId: 'cli-006',
    clientName: 'Carlos Eduardo Barros',
    area: 'penal',
    status: 'active',
    startedAt: '2026-04-11T10:30:00Z',
    duration: 15,
    transcriptEntries: Array.from({ length: 8 }, (_, i) => ({
      id: `te-${i}`,
      speaker: i % 2 === 0 ? 'lawyer' as const : 'client' as const,
      text: 'Transcrição da entrevista...',
      timestamp: new Date(Date.now() - (8 - i) * 60000).toISOString(),
      confidence: 0.87,
    })),
    suggestions: [],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

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
};

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

// ─── Component ──────────────────────────────────────────────────────────────

export default function InterviewListPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSessions = useMemo(() => {
    return MOCK_SESSIONS.filter((session) => {
      const matchesSearch =
        !searchQuery ||
        session.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        AREA_LABELS[session.area].toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || session.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // Stats
  const totalInterviews = MOCK_SESSIONS.length;
  const avgDuration = Math.round(
    MOCK_SESSIONS.reduce((sum, s) => sum + s.duration, 0) / totalInterviews
  );
  const completedWithStrategy = MOCK_SESSIONS.filter((s) => s.strategyDraft).length;
  const strategyRate = Math.round((completedWithStrategy / totalInterviews) * 100);
  const activeNow = MOCK_SESSIONS.filter((s) => s.status === 'active').length;

  const stats = [
    { label: 'Total Entrevistas', value: totalInterviews.toString(), icon: Users },
    { label: 'Duração Média', value: `${avgDuration} min`, icon: Clock },
    { label: 'Taxa Estratégia', value: `${strategyRate}%`, icon: Zap },
    { label: 'Em Andamento', value: activeNow.toString(), icon: Mic },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Mic className="h-7 w-7 text-amber-400" />
            Assistente de Entrevista
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Transcrição em tempo real, sugestões de perguntas e geração de estratégia
          </p>
        </div>
        <Link
          href="/legal/interview/new"
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          Nova Entrevista
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <stat.icon className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
          <input
            type="text"
            placeholder="Buscar por cliente ou área..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0d1320] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#6b7a8d] focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#6b7a8d]" />
          {['all', 'active', 'paused', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                statusFilter === status
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-[#0d1320] text-[#6b7a8d] border-[#1a2332] hover:text-white hover:bg-[#1a2332]'
              }`}
            >
              {status === 'all'
                ? 'Todas'
                : STATUS_CONFIG[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {/* Session List */}
      <div className="space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[#6b7a8d]">
            <Mic className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">Nenhuma entrevista encontrada</p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const statusConf = STATUS_CONFIG[session.status];
            const StatusIcon = statusConf.icon;

            return (
              <Link
                key={session.id}
                href={`/legal/interview/${session.id}`}
                className="flex items-center justify-between rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-amber-500/30 hover:bg-[#0d1320]/80 transition-all group"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Status indicator */}
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${statusConf.color}`}
                  >
                    <StatusIcon className="h-5 w-5" />
                  </div>

                  {/* Session info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-sm font-semibold text-white truncate">
                        {session.clientName}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                          AREA_COLORS[session.area] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }`}
                      >
                        {AREA_LABELS[session.area]}
                      </span>
                      {session.strategyDraft && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/20">
                          <Zap className="h-2.5 w-2.5" />
                          Estratégia
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="flex items-center gap-1 text-xs text-[#6b7a8d]">
                        <Calendar className="h-3 w-3" />
                        {formatDate(session.startedAt)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#6b7a8d]">
                        <Clock className="h-3 w-3" />
                        {formatTime(session.startedAt)} - {session.duration} min
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#6b7a8d]">
                        <BarChart3 className="h-3 w-3" />
                        {session.transcriptEntries.length} entradas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight className="h-4 w-4 text-[#6b7a8d] group-hover:text-amber-400 transition-colors flex-shrink-0" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
