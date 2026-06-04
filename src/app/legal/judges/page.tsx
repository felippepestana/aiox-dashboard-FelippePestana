'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Gavel,
  Search,
  MapPin,
  Scale,
  BarChart3,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Loader2,
  AlertCircle,
  Brain,
} from 'lucide-react';
import type { MagistrateProfile } from '@/lib/legal-intelligence';
import { PageHeader, StatCardGrid, EmptyState } from '@/components/legal/shared';

interface JudgeProfile {
  id: string;
  name: string;
  tribunal: string;
  vara: string;
  areas: string[];
  caseCount: number;
  sentiment: number; // 0-100
  favorableRate: number;
  avgDuration: string;
}

const MOCK_JUDGES: JudgeProfile[] = [
  {
    id: 'judge-1',
    name: 'Des. Maria Helena Diniz',
    tribunal: 'TJSP',
    vara: '2a Vara Civel',
    areas: ['Civil', 'Consumidor', 'Familia'],
    caseCount: 4280,
    sentiment: 72,
    favorableRate: 58,
    avgDuration: '14 meses',
  },
  {
    id: 'judge-2',
    name: 'Des. Paulo Roberto Gomes',
    tribunal: 'TJRJ',
    vara: '5a Vara Empresarial',
    areas: ['Empresarial', 'Recuperacao Judicial', 'Societario'],
    caseCount: 2150,
    sentiment: 65,
    favorableRate: 45,
    avgDuration: '18 meses',
  },
  {
    id: 'judge-3',
    name: 'Juiz Fed. Ana Claudia Torres',
    tribunal: 'TRF3',
    vara: '1a Vara Federal Tributaria',
    areas: ['Tributario', 'Administrativo', 'Previdenciario'],
    caseCount: 3620,
    sentiment: 80,
    favorableRate: 62,
    avgDuration: '22 meses',
  },
  {
    id: 'judge-4',
    name: 'Juiz Ricardo Souza Lima',
    tribunal: 'TRT2',
    vara: '12a Vara do Trabalho',
    areas: ['Trabalhista', 'Dano Moral', 'Acidente de Trabalho'],
    caseCount: 5100,
    sentiment: 55,
    favorableRate: 52,
    avgDuration: '10 meses',
  },
  {
    id: 'judge-5',
    name: 'Des. Fernanda Batista Neves',
    tribunal: 'TJSP',
    vara: '3a Camara de Direito Privado',
    areas: ['Civil', 'Digital', 'LGPD'],
    caseCount: 1890,
    sentiment: 88,
    favorableRate: 67,
    avgDuration: '16 meses',
  },
];

const TRIBUNALS = ['Todos', 'TJSP', 'TJRJ', 'TRF3', 'TRT2', 'STJ', 'STF', 'TST'];
const JUDGE_AREAS = ['Todas', 'Civil', 'Consumidor', 'Familia', 'Empresarial', 'Tributario', 'Trabalhista', 'Digital', 'Administrativo', 'Previdenciario'];

function SkeletonProfileCard() {
  return (
    <div className="rounded-xl border border-amber-500/10 bg-[#0d1320] p-5 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="h-4 w-48 rounded bg-[#1a2332] mb-2" />
          <div className="h-3 w-32 rounded bg-[#1a2332] mb-1" />
          <div className="h-3 w-16 rounded-full bg-[#1a2332]" />
        </div>
      </div>
      <div className="flex gap-1.5 mb-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-4 w-16 rounded-full bg-[#1a2332]" />)}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-12 rounded bg-[#1a2332]" />)}
      </div>
      <div className="h-1.5 rounded-full bg-[#1a2332]" />
    </div>
  );
}

function AiProfileModal({ profile, onClose }: { profile: MagistrateProfile; onClose: () => void }) {
  const sentimentColor = profile.sentimentScore >= 75 ? 'text-green-400' : profile.sentimentScore >= 50 ? 'text-amber-400' : 'text-red-400';
  const sentimentBar = profile.sentimentScore >= 75 ? 'bg-green-500' : profile.sentimentScore >= 50 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-amber-500/20 bg-[#0d1320] p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-5 w-5 text-amber-400" />
              <span className="text-xs text-amber-400 font-medium uppercase tracking-wider">Perfil por IA</span>
            </div>
            <h2 className="text-lg font-bold text-white">{profile.name}</h2>
            <p className="text-sm text-[#6b7a8d]">{profile.vara || profile.position} — {profile.tribunal}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-[#1a2332] px-3 py-1.5 text-xs text-[#6b7a8d] hover:text-white transition-colors"
          >
            Fechar
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-3 text-center">
            <p className="text-lg font-bold text-white">{profile.totalDecisions.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] text-[#6b7a8d]">Decisoes</p>
          </div>
          <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-3 text-center">
            <p className="text-lg font-bold text-white">{profile.overallFavorabilityRate}%</p>
            <p className="text-[10px] text-[#6b7a8d]">Taxa Favoravel</p>
          </div>
          <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-3 text-center">
            <p className="text-lg font-bold text-white">{profile.averageDecisionTimeDays}d</p>
            <p className="text-[10px] text-[#6b7a8d]">Duracao Media</p>
          </div>
          <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-3 text-center">
            <p className={`text-lg font-bold ${sentimentColor}`}>{profile.sentimentScore}</p>
            <p className="text-[10px] text-[#6b7a8d]">Sentimento</p>
          </div>
        </div>

        {/* Sentiment bar */}
        <div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-[#6b7a8d]">Score de Sentimento</span>
            <span className={`text-xs font-medium ${sentimentColor}`}>{profile.sentimentScore}/100</span>
          </div>
          <div className="h-2 rounded-full bg-[#1a2332]">
            <div className={`h-2 rounded-full ${sentimentBar} transition-all`} style={{ width: `${profile.sentimentScore}%` }} />
          </div>
        </div>

        {/* Tendencies */}
        {profile.tendencies && profile.tendencies.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Tendencias por Area</h3>
            <div className="space-y-3">
              {profile.tendencies.map((t) => (
                <div key={t.area}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white">{t.area}</span>
                    <span className="text-xs text-[#6b7a8d]">{t.totalDecisions} decisoes</span>
                  </div>
                  <div className="flex h-5 rounded-lg overflow-hidden bg-[#0a0f1a]">
                    <div className="bg-green-500 flex items-center justify-center" style={{ width: `${t.favorableRate}%` }}>
                      {t.favorableRate > 15 && <span className="text-[9px] font-bold text-white">{t.favorableRate}%</span>}
                    </div>
                    <div className="bg-red-500 flex items-center justify-center" style={{ width: `${100 - t.favorableRate}%` }}>
                      {(100 - t.favorableRate) > 15 && <span className="text-[9px] font-bold text-white">{100 - t.favorableRate}%</span>}
                    </div>
                  </div>
                  {t.commonPatterns && t.commonPatterns.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5">
                      {t.commonPatterns.slice(0, 2).map((p, i) => (
                        <li key={i} className="text-[11px] text-[#6b7a8d] flex items-start gap-1.5">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {profile.strategicRecommendations && profile.strategicRecommendations.length > 0 && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
            <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Recomendacoes Estrategicas
            </h3>
            <ul className="space-y-2">
              {profile.strategicRecommendations.map((rec, i) => (
                <li key={i} className="text-sm text-[#c0c8d4] flex items-start gap-2">
                  <span className="text-amber-400 font-bold mt-0.5">{i + 1}.</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Topics */}
        {profile.keyTopics && profile.keyTopics.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">Topicos-Chave</h3>
            <div className="flex flex-wrap gap-2">
              {profile.keyTopics.map((topic) => (
                <span key={topic} className="rounded-lg bg-[#1a2332] border border-[#2a3342] px-3 py-1 text-xs text-white">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-[10px] text-[#6b7a8d] border-t border-[#1a2332] pt-3">
          Perfil gerado por IA com base em dados historicos. Use como referencia estrategica, nao como garantia de resultado.
        </p>
      </div>
    </div>
  );
}

export default function JudgesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [tribunalFilter, setTribunalFilter] = useState('Todos');
  const [areaFilter, setAreaFilter] = useState('Todas');

  // AI profiling state
  const [aiJudgeName, setAiJudgeName] = useState('');
  const [aiTribunal, setAiTribunal] = useState('');
  const [aiLoading, setAiLoading] = useState<string | null>(null); // stores judge name being profiled
  const [aiProfile, setAiProfile] = useState<MagistrateProfile | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let results = MOCK_JUDGES;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (j) =>
          j.name.toLowerCase().includes(q) ||
          j.vara.toLowerCase().includes(q) ||
          j.tribunal.toLowerCase().includes(q),
      );
    }

    if (tribunalFilter !== 'Todos') {
      results = results.filter((j) => j.tribunal === tribunalFilter);
    }

    if (areaFilter !== 'Todas') {
      results = results.filter((j) =>
        j.areas.some((a) => a.toLowerCase().includes(areaFilter.toLowerCase())),
      );
    }

    return results;
  }, [searchQuery, tribunalFilter, areaFilter]);

  async function profileJudgeWithAI(name: string, tribunal?: string) {
    setAiLoading(name);
    setAiError(null);

    try {
      const response = await fetch('/api/legal/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'profile-magistrate', judge: name, tribunal }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || `Erro ${response.status}`);
      }

      const profile: MagistrateProfile = await response.json();
      setAiProfile(profile);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Erro ao gerar perfil');
    } finally {
      setAiLoading(null);
    }
  }

  async function handleCustomAiProfile() {
    if (!aiJudgeName.trim()) return;
    await profileJudgeWithAI(aiJudgeName, aiTribunal || undefined);
  }

  function getSentimentColor(score: number) {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getSentimentLabel(score: number) {
    if (score >= 75) return 'Favoravel';
    if (score >= 50) return 'Neutro';
    return 'Desfavoravel';
  }

  function getSentimentBarColor(score: number) {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* AI Profile Modal */}
      {aiProfile && <AiProfileModal profile={aiProfile} onClose={() => setAiProfile(null)} />}

      {/* Header */}
      <PageHeader
        title="Perfil de Magistrados"
        subtitle="Perfis, padrões de decisão e análise de magistrados"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Perfil de Magistrados', href: '/legal/judges' },
        ]}
      />

      {/* AI Profile by Name */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-400">Perfil de Magistrado por IA</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Gavel className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
            <input
              value={aiJudgeName}
              onChange={(e) => setAiJudgeName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCustomAiProfile()}
              placeholder="Nome do magistrado (ex: Min. Nancy Andrighi)"
              className="w-full rounded-lg bg-[#0a0f1a] border border-amber-500/30 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/60"
            />
          </div>
          <div className="relative">
            <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
            <input
              value={aiTribunal}
              onChange={(e) => setAiTribunal(e.target.value)}
              placeholder="Tribunal (opcional)"
              className="rounded-lg bg-[#0a0f1a] border border-amber-500/30 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/60 w-48"
            />
          </div>
          <button
            onClick={handleCustomAiProfile}
            disabled={!!aiLoading || !aiJudgeName.trim()}
            className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {aiLoading === aiJudgeName ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Gerar Perfil
          </button>
        </div>

        {aiError && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{aiError}</p>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, tribunal ou vara..."
              className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-[#6b7a8d]" />
            <select
              value={tribunalFilter}
              onChange={(e) => setTribunalFilter(e.target.value)}
              className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {TRIBUNALS.map((t) => (
                <option key={t} value={t}>{t === 'Todos' ? 'Todos os Tribunais' : t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#6b7a8d]" />
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {JUDGE_AREAS.map((a) => (
                <option key={a} value={a}>{a === 'Todas' ? 'Todas as Areas' : a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <StatCardGrid
        cards={[
          {
            label: 'Magistrados Mapeados',
            value: MOCK_JUDGES.length,
            icon: <Gavel className="h-5 w-5" />,
          },
          {
            label: 'Total de Processos',
            value: MOCK_JUDGES.reduce((s, j) => s + j.caseCount, 0).toLocaleString('pt-BR'),
            icon: <BarChart3 className="h-5 w-5" />,
          },
          {
            label: 'Sentimento Médio',
            value: `${(MOCK_JUDGES.reduce((s, j) => s + j.sentiment, 0) / MOCK_JUDGES.length).toFixed(0)}%`,
            icon: <TrendingUp className="h-5 w-5" />,
          },
          {
            label: 'Taxa Favorável Média',
            value: `${(MOCK_JUDGES.reduce((s, j) => s + j.favorableRate, 0) / MOCK_JUDGES.length).toFixed(0)}%`,
            icon: <Scale className="h-5 w-5" />,
          },
        ]}
      />

      {/* Judge Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((judge) => (
          <div
            key={judge.id}
            className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-amber-500/10 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white truncate">{judge.name}</h3>
                <p className="text-xs text-[#6b7a8d] mt-0.5 truncate">{judge.vara}</p>
                <span className="inline-block rounded-full bg-[#1a2332] px-2.5 py-0.5 text-[10px] text-[#6b7a8d] mt-1">
                  {judge.tribunal}
                </span>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={() => profileJudgeWithAI(judge.name, judge.tribunal)}
                  disabled={!!aiLoading}
                  title="Gerar perfil com IA"
                  className="flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1.5 text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  {aiLoading === judge.name ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Brain className="h-3.5 w-3.5" />
                  )}
                  <span className="text-[10px] font-medium">IA</span>
                </button>
                <Link
                  href={`/legal/judges/${judge.id}`}
                  className="rounded-lg bg-[#1a2332] p-1.5 text-[#6b7a8d] hover:text-amber-400 transition-colors"
                >
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {judge.areas.map((area) => (
                <span
                  key={area}
                  className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] text-amber-400 border border-amber-500/20"
                >
                  {area}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center">
                <BarChart3 className="h-3.5 w-3.5 text-[#6b7a8d] mx-auto mb-1" />
                <p className="text-xs text-[#6b7a8d]">Processos</p>
                <p className="text-sm font-semibold text-white">{judge.caseCount.toLocaleString('pt-BR')}</p>
              </div>
              <div className="text-center">
                <TrendingUp className="h-3.5 w-3.5 text-[#6b7a8d] mx-auto mb-1" />
                <p className="text-xs text-[#6b7a8d]">Favoravel</p>
                <p className="text-sm font-semibold text-white">{judge.favorableRate}%</p>
              </div>
              <div className="text-center">
                <Scale className="h-3.5 w-3.5 text-[#6b7a8d] mx-auto mb-1" />
                <p className="text-xs text-[#6b7a8d]">Duracao</p>
                <p className="text-sm font-semibold text-white">{judge.avgDuration}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-[#6b7a8d]">Sentimento</span>
                <span className={`text-xs font-medium ${getSentimentColor(judge.sentiment)}`}>
                  {getSentimentLabel(judge.sentiment)} ({judge.sentiment}%)
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#1a2332]">
                <div
                  className={`h-1.5 rounded-full ${getSentimentBarColor(judge.sentiment)}`}
                  style={{ width: `${judge.sentiment}%` }}
                />
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-[#1a2332] bg-[#0d1320]">
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="Nenhum magistrado encontrado"
              description="Tente ajustar os filtros ou a busca para encontrar o magistrado desejado."
            />
          </div>
        )}
      </div>

      {/* Skeleton loading cards while AI is processing */}
      {aiLoading && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 rounded-xl border border-amber-500/20 bg-[#0d1320] px-4 py-3 shadow-xl">
          <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />
          <p className="text-sm text-amber-400">Gerando perfil com IA...</p>
        </div>
      )}
    </div>
  );
}
