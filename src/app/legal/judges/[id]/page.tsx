'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import {
  Gavel,
  ArrowLeft,
  Scale,
  MapPin,
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Brain,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Target,
} from 'lucide-react';
import type { MagistrateProfile } from '@/lib/legal-intelligence';
import { PageHeader } from '@/components/legal/shared';
import { JudgeRadarChart } from '@/components/legal/JudgeRadarChart';

interface VotingPattern {
  area: string;
  favorable: number;
  unfavorable: number;
  total: number;
}

interface RecentDecision {
  id: string;
  number: string;
  area: string;
  date: string;
  result: 'favorable' | 'unfavorable' | 'partial';
  summary: string;
}

interface JudgeDetail {
  id: string;
  name: string;
  tribunal: string;
  vara: string;
  areas: string[];
  caseCount: number;
  sentiment: number;
  favorableRate: number;
  avgDuration: string;
  votingPatterns: VotingPattern[];
  recentDecisions: RecentDecision[];
  keyTopics: string[];
}

const JUDGES_DB: Record<string, JudgeDetail> = {
  'judge-1': {
    id: 'judge-1',
    name: 'Des. Maria Helena Diniz',
    tribunal: 'TJSP',
    vara: '2a Vara Civel',
    areas: ['Civil', 'Consumidor', 'Familia'],
    caseCount: 4280,
    sentiment: 72,
    favorableRate: 58,
    avgDuration: '14 meses',
    votingPatterns: [
      { area: 'Civil', favorable: 62, unfavorable: 38, total: 2100 },
      { area: 'Consumidor', favorable: 71, unfavorable: 29, total: 1400 },
      { area: 'Familia', favorable: 45, unfavorable: 55, total: 780 },
    ],
    recentDecisions: [
      { id: 'd1', number: '1234567-89.2025.8.26.0100', area: 'Civil', date: '2026-03-15', result: 'favorable', summary: 'Indenizacao por dano moral em relacao de consumo. Procedencia parcial com fixacao em R$ 15.000,00.' },
      { id: 'd2', number: '9876543-21.2025.8.26.0100', area: 'Consumidor', date: '2026-03-10', result: 'favorable', summary: 'Revisao contratual de emprestimo consignado. Reconhecida abusividade da taxa de juros.' },
      { id: 'd3', number: '5555555-55.2025.8.26.0100', area: 'Familia', date: '2026-02-28', result: 'unfavorable', summary: 'Acao de alimentos. Improcedencia por ausencia de comprovacao de necessidade.' },
      { id: 'd4', number: '1111111-11.2025.8.26.0100', area: 'Civil', date: '2026-02-20', result: 'partial', summary: 'Acao de cobranca. Procedencia parcial com reducao do valor cobrado.' },
      { id: 'd5', number: '2222222-22.2025.8.26.0100', area: 'Consumidor', date: '2026-02-12', result: 'favorable', summary: 'Acao declaratoria de inexistencia de debito. Fraude bancaria comprovada.' },
    ],
    keyTopics: ['Responsabilidade Civil', 'Relacao de Consumo', 'Dano Moral', 'Guarda Compartilhada', 'Revisao Contratual', 'Fraude Bancaria'],
  },
  'judge-2': {
    id: 'judge-2',
    name: 'Des. Paulo Roberto Gomes',
    tribunal: 'TJRJ',
    vara: '5a Vara Empresarial',
    areas: ['Empresarial', 'Recuperacao Judicial', 'Societario'],
    caseCount: 2150,
    sentiment: 65,
    favorableRate: 45,
    avgDuration: '18 meses',
    votingPatterns: [
      { area: 'Empresarial', favorable: 48, unfavorable: 52, total: 950 },
      { area: 'Recuperacao Judicial', favorable: 55, unfavorable: 45, total: 720 },
      { area: 'Societario', favorable: 38, unfavorable: 62, total: 480 },
    ],
    recentDecisions: [
      { id: 'd6', number: '0012345-67.2025.8.19.0001', area: 'Recuperacao Judicial', date: '2026-03-20', result: 'favorable', summary: 'Deferimento de processamento de recuperacao judicial. Empresa demonstrou viabilidade economica.' },
      { id: 'd7', number: '0098765-43.2025.8.19.0001', area: 'Empresarial', date: '2026-03-05', result: 'unfavorable', summary: 'Dissolucao parcial de sociedade. Indeferido pedido por ausencia de justa causa.' },
      { id: 'd8', number: '0054321-09.2025.8.19.0001', area: 'Societario', date: '2026-02-15', result: 'partial', summary: 'Exclusao de socio minoritario. Deferido parcialmente com apuracao de haveres.' },
    ],
    keyTopics: ['Recuperacao Judicial', 'Cram Down', 'Dissolucao Societaria', 'Contratos Empresariais', 'Falencia', 'Apuracao de Haveres'],
  },
  'judge-3': {
    id: 'judge-3',
    name: 'Juiz Fed. Ana Claudia Torres',
    tribunal: 'TRF3',
    vara: '1a Vara Federal Tributaria',
    areas: ['Tributario', 'Administrativo', 'Previdenciario'],
    caseCount: 3620,
    sentiment: 80,
    favorableRate: 62,
    avgDuration: '22 meses',
    votingPatterns: [
      { area: 'Tributario', favorable: 65, unfavorable: 35, total: 1800 },
      { area: 'Administrativo', favorable: 58, unfavorable: 42, total: 1200 },
      { area: 'Previdenciario', favorable: 70, unfavorable: 30, total: 620 },
    ],
    recentDecisions: [
      { id: 'd9', number: '5001234-56.2025.4.03.6100', area: 'Tributario', date: '2026-03-25', result: 'favorable', summary: 'Exclusao do ICMS da base de calculo do PIS/COFINS. Tese do Seculo aplicada.' },
      { id: 'd10', number: '5009876-54.2025.4.03.6100', area: 'Tributario', date: '2026-03-12', result: 'favorable', summary: 'Compensacao de creditos tributarios. Reconhecido direito a creditamento de IPI.' },
      { id: 'd11', number: '5005555-55.2025.4.03.6100', area: 'Previdenciario', date: '2026-02-25', result: 'favorable', summary: 'Aposentadoria especial de profissional de saude exposto a agentes biologicos.' },
    ],
    keyTopics: ['ICMS', 'PIS/COFINS', 'Compensacao Tributaria', 'Aposentadoria Especial', 'Mandado de Seguranca', 'Execucao Fiscal'],
  },
  'judge-4': {
    id: 'judge-4',
    name: 'Juiz Ricardo Souza Lima',
    tribunal: 'TRT2',
    vara: '12a Vara do Trabalho',
    areas: ['Trabalhista', 'Dano Moral', 'Acidente de Trabalho'],
    caseCount: 5100,
    sentiment: 55,
    favorableRate: 52,
    avgDuration: '10 meses',
    votingPatterns: [
      { area: 'Trabalhista', favorable: 55, unfavorable: 45, total: 3200 },
      { area: 'Dano Moral', favorable: 48, unfavorable: 52, total: 1200 },
      { area: 'Acidente de Trabalho', favorable: 60, unfavorable: 40, total: 700 },
    ],
    recentDecisions: [
      { id: 'd12', number: '1001234-56.2025.5.02.0012', area: 'Trabalhista', date: '2026-03-22', result: 'partial', summary: 'Reconhecido vinculo empregaticio de motorista de aplicativo com condenacao parcial.' },
      { id: 'd13', number: '1009876-54.2025.5.02.0012', area: 'Acidente de Trabalho', date: '2026-03-08', result: 'favorable', summary: 'Pensionamento vitalicio por acidente de trabalho com perda parcial de capacidade.' },
    ],
    keyTopics: ['Vinculo Empregaticio', 'Motorista de Aplicativo', 'Horas Extras', 'Assedio Moral', 'Acidente de Trabalho', 'Estabilidade Provisoria'],
  },
  'judge-5': {
    id: 'judge-5',
    name: 'Des. Fernanda Batista Neves',
    tribunal: 'TJSP',
    vara: '3a Camara de Direito Privado',
    areas: ['Civil', 'Digital', 'LGPD'],
    caseCount: 1890,
    sentiment: 88,
    favorableRate: 67,
    avgDuration: '16 meses',
    votingPatterns: [
      { area: 'Civil', favorable: 65, unfavorable: 35, total: 800 },
      { area: 'Digital', favorable: 72, unfavorable: 28, total: 650 },
      { area: 'LGPD', favorable: 78, unfavorable: 22, total: 440 },
    ],
    recentDecisions: [
      { id: 'd14', number: '1098765-43.2025.8.26.0100', area: 'Digital', date: '2026-03-28', result: 'favorable', summary: 'Dano moral por vazamento de dados pessoais. Condenacao do controlador em R$ 30.000,00.' },
      { id: 'd15', number: '1054321-09.2025.8.26.0100', area: 'LGPD', date: '2026-03-18', result: 'favorable', summary: 'Obrigacao de fazer para exclusao de dados pessoais de base de dados de marketing.' },
    ],
    keyTopics: ['LGPD', 'Vazamento de Dados', 'Privacidade Digital', 'Marco Civil da Internet', 'Dano Moral Digital', 'Direito ao Esquecimento'],
  },
};

function getResultBadge(result: string) {
  switch (result) {
    case 'favorable':
      return { label: 'Favoravel', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
    case 'unfavorable':
      return { label: 'Desfavoravel', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
    case 'partial':
      return { label: 'Parcial', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
    default:
      return { label: result, color: 'bg-[#1a2332] text-[#6b7a8d] border-[#1a2332]' };
  }
}

export default function JudgeDetailPage() {
  const params = useParams();
  const judgeId = params.id as string;

  const [aiProfile, setAiProfile] = useState<MagistrateProfile | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const judge = JUDGES_DB[judgeId];

  async function generateAiProfile() {
    if (!judge) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/legal/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'profile-magistrate',
          judge: judge.name,
          tribunal: judge.tribunal,
        }),
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
      setAiLoading(false);
    }
  }

  if (!judge) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] p-6 flex items-center justify-center">
        <div className="text-center">
          <Gavel className="h-12 w-12 text-[#6b7a8d] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Magistrado nao encontrado</h2>
          <p className="text-sm text-[#6b7a8d] mb-4">O perfil solicitado nao esta disponivel.</p>
          <Link
            href="/legal/judges"
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  function getSentimentColor(score: number) {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getSentimentBarColor(score: number) {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title={judge.name}
        subtitle="Perfil detalhado e padroes de decisao"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Magistrados', href: '/legal/judges' },
          { label: judge.name, href: `/legal/judges/${judgeId}` },
        ]}
        actions={
          <button
            onClick={generateAiProfile}
            disabled={aiLoading}
            className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {aiLoading ? 'Analisando...' : 'Perfil por IA'}
          </button>
        }
      />

      {aiError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{aiError}</p>
        </div>
      )}

      {/* AI Profile Section */}
      {aiProfile && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-5">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-amber-400">Analise de Inteligencia Artificial</h2>
          </div>

          {/* AI Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-amber-500/10 bg-[#0a0f1a] p-3 text-center">
              <p className="text-lg font-bold text-white">{aiProfile.totalDecisions.toLocaleString('pt-BR')}</p>
              <p className="text-[10px] text-[#6b7a8d]">Decisoes Analisadas</p>
            </div>
            <div className="rounded-xl border border-amber-500/10 bg-[#0a0f1a] p-3 text-center">
              <p className="text-lg font-bold text-white">{aiProfile.overallFavorabilityRate}%</p>
              <p className="text-[10px] text-[#6b7a8d]">Taxa Favoravel</p>
            </div>
            <div className="rounded-xl border border-amber-500/10 bg-[#0a0f1a] p-3 text-center">
              <p className="text-lg font-bold text-white">{aiProfile.averageDecisionTimeDays}d</p>
              <p className="text-[10px] text-[#6b7a8d]">Duracao Media</p>
            </div>
            <div className="rounded-xl border border-amber-500/10 bg-[#0a0f1a] p-3 text-center">
              <p className={`text-lg font-bold ${getSentimentColor(aiProfile.sentimentScore)}`}>{aiProfile.sentimentScore}</p>
              <p className="text-[10px] text-[#6b7a8d]">Score Sentimento</p>
            </div>
          </div>

          {/* AI Tendencies */}
          {aiProfile.tendencies && aiProfile.tendencies.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-amber-400" />
                Tendencias por Area (IA)
              </h3>
              <div className="space-y-3">
                {aiProfile.tendencies.map((t) => (
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
                    {t.commonPatterns && t.commonPatterns.slice(0, 2).map((p, i) => (
                      <p key={i} className="text-[11px] text-[#6b7a8d] mt-1 flex items-start gap-1">
                        <span className="text-amber-500">•</span> {p}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {aiProfile.strategicRecommendations && aiProfile.strategicRecommendations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="h-4 w-4 text-amber-400" />
                Recomendacoes Estrategicas para este Magistrado
              </h3>
              <div className="space-y-2">
                {aiProfile.strategicRecommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg bg-[#0a0f1a] border border-[#1a2332] p-3">
                    <CheckCircle2 className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#c0c8d4]">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Notable Decisions */}
          {aiProfile.notableDecisions && aiProfile.notableDecisions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-amber-400" />
                Decisoes Notaveis (IA)
              </h3>
              <div className="space-y-2">
                {aiProfile.notableDecisions.map((d, i) => (
                  <div key={i} className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white">{d.caseNumber}</span>
                      <span className="text-[10px] text-[#6b7a8d]">{new Date(d.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-xs text-[#c0c8d4]">{d.summary}</p>
                    <p className="text-[10px] text-amber-400 mt-1">{d.outcome}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[10px] text-[#6b7a8d]">
            Analise gerada por IA. Use como referencia estrategica, nao como garantia de resultado.
          </p>
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Informacoes do Perfil</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Scale className="h-4 w-4 text-[#6b7a8d]" />
                <div>
                  <p className="text-xs text-[#6b7a8d]">Tribunal</p>
                  <p className="text-sm text-white">{judge.tribunal}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-[#6b7a8d]" />
                <div>
                  <p className="text-xs text-[#6b7a8d]">Vara / Camara</p>
                  <p className="text-sm text-white">{judge.vara}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-[#6b7a8d]" />
                <div>
                  <p className="text-xs text-[#6b7a8d]">Areas de Atuacao</p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {judge.areas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] text-amber-400 border border-amber-500/20"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4 text-center">
              <BarChart3 className="h-5 w-5 text-[#6b7a8d] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{judge.caseCount.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-[#6b7a8d]">Processos</p>
            </div>
            <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4 text-center">
              <TrendingUp className="h-5 w-5 text-[#6b7a8d] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{judge.favorableRate}%</p>
              <p className="text-xs text-[#6b7a8d]">Taxa Favoravel</p>
            </div>
            <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4 text-center">
              <Clock className="h-5 w-5 text-[#6b7a8d] mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">{judge.avgDuration}</p>
              <p className="text-xs text-[#6b7a8d]">Duracao Media</p>
            </div>
            <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4 text-center">
              <Scale className="h-5 w-5 text-[#6b7a8d] mx-auto mb-2" />
              <p className={`text-2xl font-bold ${getSentimentColor(judge.sentiment)}`}>{judge.sentiment}%</p>
              <p className="text-xs text-[#6b7a8d]">Sentimento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <JudgeRadarChart
          judgeName={judge.name}
          data={{
            favorReu: 100 - judge.favorableRate,
            favorAutor: judge.favorableRate,
            acordos: Math.round(judge.favorableRate * 0.65),
            sentencas: judge.sentiment,
            tempoMedio: Math.max(0, 100 - Math.round((judge.caseCount / 60))),
            reformas: Math.round((100 - judge.sentiment) * 0.3),
          }}
        />
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6 flex flex-col justify-center gap-4">
          <h2 className="text-base font-semibold text-white">Resumo Estatístico</h2>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#6b7a8d]">Taxa Favorável ao Autor</span>
                <span className="text-xs font-medium text-green-400">{judge.favorableRate}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1a2332]">
                <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${judge.favorableRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#6b7a8d]">Taxa Favorável ao Réu</span>
                <span className="text-xs font-medium text-red-400">{100 - judge.favorableRate}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1a2332]">
                <div className="h-1.5 rounded-full bg-red-500" style={{ width: `${100 - judge.favorableRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[#6b7a8d]">Score de Sentimento</span>
                <span className={`text-xs font-medium ${getSentimentColor(judge.sentiment)}`}>{judge.sentiment}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#1a2332]">
                <div className={`h-1.5 rounded-full ${getSentimentBarColor(judge.sentiment)}`} style={{ width: `${judge.sentiment}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-[#1a2332] grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[#6b7a8d]">Total de Processos</p>
                <p className="text-sm font-semibold text-white">{judge.caseCount.toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-xs text-[#6b7a8d]">Duração Média</p>
                <p className="text-sm font-semibold text-white">{judge.avgDuration}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting Patterns */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-amber-400" />
          Padroes de Votacao por Area
        </h2>
        <div className="space-y-4">
          {judge.votingPatterns.map((pattern) => (
            <div key={pattern.area}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">{pattern.area}</span>
                <span className="text-xs text-[#6b7a8d]">{pattern.total} processos</span>
              </div>
              <div className="flex h-6 rounded-lg overflow-hidden">
                <div
                  className="bg-green-500 flex items-center justify-center transition-all"
                  style={{ width: `${pattern.favorable}%` }}
                >
                  <span className="text-[10px] font-bold text-white">
                    {pattern.favorable}%
                  </span>
                </div>
                <div
                  className="bg-red-500 flex items-center justify-center transition-all"
                  style={{ width: `${pattern.unfavorable}%` }}
                >
                  <span className="text-[10px] font-bold text-white">
                    {pattern.unfavorable}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1.5">
                  <ThumbsUp className="h-3 w-3 text-green-400" />
                  <span className="text-[10px] text-green-400">Favoravel</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ThumbsDown className="h-3 w-3 text-red-400" />
                  <span className="text-[10px] text-red-400">Desfavoravel</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sentiment Score */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Score de Sentimento</h2>
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
            <svg width="96" height="96" viewBox="0 0 96 96">
              <circle cx="48" cy="48" r="40" fill="none" stroke="#1a2332" strokeWidth="6" />
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={judge.sentiment >= 75 ? '#22c55e' : judge.sentiment >= 50 ? '#eab308' : '#ef4444'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(judge.sentiment / 100) * 251} 251`}
                transform="rotate(-90 48 48)"
              />
            </svg>
            <span className={`absolute text-xl font-bold ${getSentimentColor(judge.sentiment)}`}>
              {judge.sentiment}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-[#6b7a8d] mb-2">
              O score de sentimento indica a tendencia geral das decisoes do magistrado com base na analise de jurisprudencia recente.
            </p>
            <div className="w-full h-2 rounded-full bg-[#1a2332]">
              <div
                className={`h-2 rounded-full ${getSentimentBarColor(judge.sentiment)}`}
                style={{ width: `${judge.sentiment}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-red-400">Desfavoravel</span>
              <span className="text-[10px] text-yellow-400">Neutro</span>
              <span className="text-[10px] text-green-400">Favoravel</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Decisions */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-400" />
          Decisoes Recentes
        </h2>
        <div className="space-y-3">
          {judge.recentDecisions.map((decision) => {
            const badge = getResultBadge(decision.result);
            return (
              <div
                key={decision.id}
                className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-4 hover:border-[#2a3342] transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-white">{decision.number}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="rounded-full bg-[#1a2332] px-2.5 py-0.5 text-[10px] text-[#6b7a8d]">
                        {decision.area}
                      </span>
                      <span className="text-[10px] text-[#6b7a8d]">
                        {new Date(decision.date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${badge.color}`}>
                    {badge.label}
                  </span>
                </div>
                <p className="text-xs text-[#c0c8d4] leading-relaxed">{decision.summary}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Topics */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-amber-400" />
          Topicos-Chave
        </h2>
        <div className="flex flex-wrap gap-2">
          {judge.keyTopics.map((topic) => (
            <span
              key={topic}
              className="rounded-lg bg-[#1a2332] border border-[#2a3342] px-3 py-1.5 text-sm text-white"
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
