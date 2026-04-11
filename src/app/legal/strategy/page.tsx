'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Target,
  LayoutDashboard,
  BarChart3,
  Rocket,
  Users,
  ArrowRight,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { useLegalStrategyStore } from '@/stores/legal-strategy-store';
import { SelemRadar } from '@/components/legal/SelemRadar';
import type { SelemPillar } from '@/types/legal';

const PILLAR_LABELS: Record<SelemPillar, string> = {
  synergy: 'Sinergia',
  strategy: 'Estrategia',
  leadership: 'Lideranca',
  education: 'Educacao',
  mastery: 'Maestria',
};

export default function StrategyPage() {
  const {
    getLatestAssessments,
    getSelemOverallScore,
    selemAssessments,
    kpis,
    addAssessment,
  } = useLegalStrategyStore();

  const latestAssessments = getLatestAssessments();
  const overallScore = getSelemOverallScore();

  const radarScores = useMemo(() => {
    const pillars: SelemPillar[] = ['synergy', 'strategy', 'leadership', 'education', 'mastery'];
    return pillars.map((p) => {
      const assessment = latestAssessments.find((a) => a.pillar === p);
      return {
        pillar: p,
        label: PILLAR_LABELS[p],
        score: assessment?.score ?? 0,
      };
    });
  }, [latestAssessments]);

  const allActionItems = useMemo(() => {
    return latestAssessments.flatMap((a) =>
      a.actionItems.map((item) => ({
        pillar: a.pillar,
        item,
      }))
    );
  }, [latestAssessments]);

  const kpisOnTarget = kpis.filter((k) => k.target > 0 && (k.value / k.target) >= 0.8).length;
  const kpisBelowTarget = kpis.filter((k) => k.target > 0 && (k.value / k.target) < 0.6).length;

  function seedDemoData() {
    const pillars: SelemPillar[] = ['synergy', 'strategy', 'leadership', 'education', 'mastery'];
    const scores = [7.5, 8.0, 6.5, 7.0, 8.5];
    const actions = [
      ['Alinhar equipe em reunioes semanais', 'Integrar setores operacionais'],
      ['Revisar posicionamento de mercado', 'Definir metas trimestrais'],
      ['Programa de mentoria interna', 'Avaliar pipeline de lideranca'],
      ['Treinamento mensal obrigatorio', 'Plataforma de e-learning'],
      ['Certificacoes especializadas', 'Benchmarking com concorrentes'],
    ];
    pillars.forEach((pillar, idx) => {
      addAssessment({
        pillar,
        score: scores[idx],
        notes: `Avaliacao inicial do pilar ${PILLAR_LABELS[pillar]}`,
        date: new Date().toISOString(),
        actionItems: actions[idx],
      });
    });
  }

  const quickLinks = [
    { label: 'Legal Canvas', icon: LayoutDashboard, href: '/legal/canvas' },
    { label: 'KPIs', icon: BarChart3, href: '/legal/kpis' },
    { label: 'Scaling Up', icon: Rocket, href: '/legal/scaling' },
    { label: 'Lideranca', icon: Users, href: '/legal/leadership' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Target className="h-7 w-7 text-amber-400" />
            Painel Estrategico
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Metodologia SELEM - Gestao Estrategica do Escritorio
          </p>
        </div>
        {selemAssessments.length === 0 && (
          <button
            onClick={seedDemoData}
            className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            Carregar Dados Demo
          </button>
        )}
      </div>

      {/* Overall Score + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Score */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6 flex flex-col items-center justify-center">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-2">Score SELEM Geral</p>
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg width="128" height="128" viewBox="0 0 128 128">
              <circle cx="64" cy="64" r="56" fill="none" stroke="#1a2332" strokeWidth="8" />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(overallScore / 10) * 352} 352`}
                transform="rotate(-90 64 64)"
              />
            </svg>
            <span className="absolute text-3xl font-bold text-amber-400">
              {overallScore.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-[#6b7a8d] mt-2">de 10.0</p>
        </div>

        {/* Radar */}
        <div className="lg:col-span-2 rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Radar SELEM - 5 Pilares</h2>
          {radarScores.some((s) => s.score > 0) ? (
            <SelemRadar scores={radarScores} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[#6b7a8d]">
              <Target className="h-8 w-8 mb-2" />
              <p className="text-sm">Nenhuma avaliacao SELEM registrada</p>
              <p className="text-xs mt-1">Clique em &quot;Carregar Dados Demo&quot; para comecar</p>
            </div>
          )}
        </div>
      </div>

      {/* Pillar Scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {radarScores.map((pillar) => {
          const pct = (pillar.score / 10) * 100;
          const color = pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400';
          const barColor = pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-yellow-500' : 'bg-red-500';
          return (
            <div key={pillar.pillar} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
              <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">{pillar.label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{pillar.score.toFixed(1)}</p>
              <div className="w-full h-1.5 rounded-full bg-[#1a2332] mt-2">
                <div
                  className={`h-1.5 rounded-full ${barColor}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Items + Quick Nav */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Items */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            Acoes Estrategicas
          </h2>
          {allActionItems.length === 0 ? (
            <p className="text-sm text-[#6b7a8d]">Nenhuma acao definida</p>
          ) : (
            <div className="space-y-2">
              {allActionItems.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-3">
                  <CheckCircle className="h-4 w-4 text-[#6b7a8d] mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">{item.item}</p>
                    <span className="text-[10px] text-amber-400 uppercase">
                      {PILLAR_LABELS[item.pillar]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Navigation + KPI Summary */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Navegacao Rapida</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-3 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-3 hover:bg-[#1a2332] hover:border-amber-500/20 transition-all group"
                >
                  <link.icon className="h-5 w-5 text-[#6b7a8d] group-hover:text-amber-400 transition-colors" />
                  <span className="text-sm text-white">{link.label}</span>
                  <ArrowRight className="h-3 w-3 text-[#6b7a8d] ml-auto group-hover:text-amber-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-amber-400" />
              Resumo KPIs
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{kpis.length}</p>
                <p className="text-xs text-[#6b7a8d]">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{kpisOnTarget}</p>
                <p className="text-xs text-[#6b7a8d]">Na Meta</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{kpisBelowTarget}</p>
                <p className="text-xs text-[#6b7a8d]">Abaixo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
