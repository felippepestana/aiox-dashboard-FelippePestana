'use client';

import { useMemo, useState } from 'react';
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
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Shield,
  Plus,
  Trash2,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  ExternalLink,
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

// ─── SWOT Types ──────────────────────────────────────────────────────────────

type SwotCategory = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

interface SwotItem {
  id: string;
  text: string;
}

interface SwotState {
  strengths: SwotItem[];
  weaknesses: SwotItem[];
  opportunities: SwotItem[];
  threats: SwotItem[];
}

const SWOT_DEFAULT: SwotState = {
  strengths: [
    { id: 's1', text: 'Equipe especializada com certificacoes atualizadas' },
    { id: 's2', text: 'Carteira fidelizada de clientes corporativos' },
    { id: 's3', text: 'Reputacao solida no mercado regional' },
  ],
  weaknesses: [
    { id: 'w1', text: 'Processos internos ainda manuais' },
    { id: 'w2', text: 'Alta dependencia de poucos socios' },
  ],
  opportunities: [
    { id: 'o1', text: 'Expansao para areas de compliance e LGPD' },
    { id: 'o2', text: 'Demanda crescente por assessoria em startups' },
    { id: 'o3', text: 'Parcerias com escritorios internacionais' },
  ],
  threats: [
    { id: 't1', text: 'Concorrencia de escritorios boutique especializados' },
    { id: 't2', text: 'Plataformas de servicos juridicos online (lawtechs)' },
  ],
};

// ─── Strategic Objectives Types ──────────────────────────────────────────────

type ObjectiveStatus = 'on_track' | 'at_risk' | 'completed' | 'not_started';

interface StrategicObjective {
  id: string;
  title: string;
  description: string;
  progress: number; // 0-100
  status: ObjectiveStatus;
  deadline: string;
  responsible: string;
}

const OBJECTIVES_DEFAULT: StrategicObjective[] = [
  {
    id: 'obj1',
    title: 'Crescimento de Receita 30%',
    description: 'Atingir faturamento mensal de R$ 130k ate dezembro',
    progress: 65,
    status: 'on_track',
    deadline: '2025-12-31',
    responsible: 'Dr. Carlos Mendes',
  },
  {
    id: 'obj2',
    title: 'Implantacao de CRM Juridico',
    description: 'Digitalizar gestao de clientes e processos',
    progress: 40,
    status: 'at_risk',
    deadline: '2025-09-30',
    responsible: 'Dra. Ana Lima',
  },
  {
    id: 'obj3',
    title: 'Certificacao ISO 27001',
    description: 'Obter certificacao de seguranca da informacao',
    progress: 100,
    status: 'completed',
    deadline: '2025-06-01',
    responsible: 'Dr. Roberto Alves',
  },
  {
    id: 'obj4',
    title: 'Programa de Mentoria Interna',
    description: 'Estruturar trilhas de desenvolvimento para associados',
    progress: 0,
    status: 'not_started',
    deadline: '2026-03-31',
    responsible: 'Dra. Patricia Costa',
  },
];

// ─── Action Plan Types ────────────────────────────────────────────────────────

type ActionStatus = 'pending' | 'in_progress' | 'done' | 'blocked';

interface ActionItem {
  id: string;
  objective: string;
  responsible: string;
  deadline: string;
  status: ActionStatus;
}

const ACTIONS_DEFAULT: ActionItem[] = [
  { id: 'a1', objective: 'Reuniao de alinhamento estrategico trimestral', responsible: 'Todos os socios', deadline: '2025-07-15', status: 'done' },
  { id: 'a2', objective: 'Levantamento de requisitos do CRM', responsible: 'Dra. Ana Lima', deadline: '2025-07-30', status: 'in_progress' },
  { id: 'a3', objective: 'Contratar especialista em compliance LGPD', responsible: 'RH', deadline: '2025-08-15', status: 'pending' },
  { id: 'a4', objective: 'Definir metas individuais de faturamento', responsible: 'Dr. Carlos Mendes', deadline: '2025-07-01', status: 'done' },
  { id: 'a5', objective: 'Elaborar programa de onboarding para associados', responsible: 'Dra. Patricia Costa', deadline: '2025-09-01', status: 'blocked' },
];

// ─── Helper Functions ─────────────────────────────────────────────────────────

const statusConfig: Record<ObjectiveStatus, { label: string; className: string }> = {
  on_track: { label: 'No Prazo', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  at_risk: { label: 'Em Risco', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  completed: { label: 'Concluido', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  not_started: { label: 'Nao Iniciado', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
};

const actionStatusConfig: Record<ActionStatus, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-gray-500/10 text-gray-400' },
  in_progress: { label: 'Em Andamento', className: 'bg-amber-500/10 text-amber-400' },
  done: { label: 'Concluido', className: 'bg-green-500/10 text-green-400' },
  blocked: { label: 'Bloqueado', className: 'bg-red-500/10 text-red-400' },
};

const swotConfig: Record<SwotCategory, { label: string; icon: typeof TrendingUp; color: string; borderColor: string }> = {
  strengths: { label: 'Forcas', icon: TrendingUp, color: 'text-green-400', borderColor: 'border-green-500/20' },
  weaknesses: { label: 'Fraquezas', icon: TrendingDown, color: 'text-red-400', borderColor: 'border-red-500/20' },
  opportunities: { label: 'Oportunidades', icon: Lightbulb, color: 'text-amber-400', borderColor: 'border-amber-500/20' },
  threats: { label: 'Ameacas', icon: Shield, color: 'text-purple-400', borderColor: 'border-purple-500/20' },
};

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

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

  // SWOT state (local, persistent per session)
  const [swot, setSwot] = useState<SwotState>(SWOT_DEFAULT);
  const [swotNewItem, setSwotNewItem] = useState<Record<SwotCategory, string>>({
    strengths: '',
    weaknesses: '',
    opportunities: '',
    threats: '',
  });

  // Strategic objectives
  const [objectives, setObjectives] = useState<StrategicObjective[]>(OBJECTIVES_DEFAULT);

  // Action plan
  const [actions, setActions] = useState<ActionItem[]>(ACTIONS_DEFAULT);

  // Sections expand/collapse
  const [sectionsOpen, setSectionsOpen] = useState({
    selem: true,
    objectives: true,
    swot: true,
    advantage: true,
    actions: true,
  });

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

  function toggleSection(key: keyof typeof sectionsOpen) {
    setSectionsOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // SWOT helpers
  function addSwotItem(category: SwotCategory) {
    const text = swotNewItem[category].trim();
    if (!text) return;
    setSwot((prev) => ({
      ...prev,
      [category]: [...prev[category], { id: generateId(), text }],
    }));
    setSwotNewItem((prev) => ({ ...prev, [category]: '' }));
  }

  function removeSwotItem(category: SwotCategory, id: string) {
    setSwot((prev) => ({
      ...prev,
      [category]: prev[category].filter((item) => item.id !== id),
    }));
  }

  // Objective helpers
  function updateObjectiveProgress(id: string, progress: number) {
    setObjectives((prev) =>
      prev.map((obj) =>
        obj.id === id
          ? {
              ...obj,
              progress,
              status: progress === 100 ? 'completed' : progress > 0 ? 'on_track' : 'not_started',
            }
          : obj
      )
    );
  }

  const quickLinks = [
    { label: 'Legal Canvas', icon: LayoutDashboard, href: '/legal/canvas' },
    { label: 'KPIs', icon: BarChart3, href: '/legal/kpis' },
    { label: 'Scaling Up', icon: Rocket, href: '/legal/scaling' },
    { label: 'Lideranca', icon: Users, href: '/legal/leadership' },
  ];

  const SWOT_CATEGORIES: SwotCategory[] = ['strengths', 'weaknesses', 'opportunities', 'threats'];

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
            Metodologia SELEM — Gestao Estrategica do Escritorio
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selemAssessments.length === 0 && (
            <button
              onClick={seedDemoData}
              className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
            >
              Carregar Dados Demo
            </button>
          )}
          <Link
            href="/legal/canvas"
            className="flex items-center gap-2 rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white hover:border-amber-500/30 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Legal Canvas
          </Link>
        </div>
      </div>

      {/* ── SELEM Assessment Section ── */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
        <button
          onClick={() => toggleSection('selem')}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#1a2332]/40 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-400" />
            Avaliacao SELEM — 5 Pilares
          </h2>
          {sectionsOpen.selem ? (
            <ChevronUp className="h-4 w-4 text-[#6b7a8d]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#6b7a8d]" />
          )}
        </button>

        {sectionsOpen.selem && (
          <div className="px-6 pb-6 space-y-6">
            {/* Overall Score + Radar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Score */}
              <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-6 flex flex-col items-center justify-center">
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
              <div className="lg:col-span-2 rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-6">
                <h3 className="text-base font-semibold text-white mb-4">Radar SELEM</h3>
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
                  <div key={pillar.pillar} className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4">
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

            {/* Action Items */}
            {allActionItems.length > 0 && (
              <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  Acoes Estrategicas SELEM
                </h3>
                <div className="space-y-2">
                  {allActionItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-lg border border-[#1a2332] bg-[#0d1320] px-4 py-3">
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Strategic Objectives Section ── */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
        <button
          onClick={() => toggleSection('objectives')}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#1a2332]/40 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Objetivos Estrategicos
          </h2>
          {sectionsOpen.objectives ? (
            <ChevronUp className="h-4 w-4 text-[#6b7a8d]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#6b7a8d]" />
          )}
        </button>

        {sectionsOpen.objectives && (
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {objectives.map((obj) => {
                const conf = statusConfig[obj.status];
                return (
                  <div key={obj.id} className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-white">{obj.title}</h3>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${conf.className}`}>
                            {conf.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7a8d] mt-1">{obj.description}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-xs text-[#6b7a8d]">
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {new Date(obj.deadline).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-[#6b7a8d] mt-0.5">
                          <User className="h-3 w-3 inline mr-1" />
                          {obj.responsible}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 rounded-full bg-[#1a2332]">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            obj.status === 'completed'
                              ? 'bg-blue-500'
                              : obj.status === 'at_risk'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          style={{ width: `${obj.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#8899aa] w-10 text-right">
                        {obj.progress}%
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={obj.progress}
                        onChange={(e) => updateObjectiveProgress(obj.id, Number(e.target.value))}
                        className="w-24 accent-amber-400"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── SWOT Analysis Section ── */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
        <button
          onClick={() => toggleSection('swot')}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#1a2332]/40 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-400" />
            Analise SWOT
          </h2>
          {sectionsOpen.swot ? (
            <ChevronUp className="h-4 w-4 text-[#6b7a8d]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#6b7a8d]" />
          )}
        </button>

        {sectionsOpen.swot && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SWOT_CATEGORIES.map((category) => {
                const conf = swotConfig[category];
                const Icon = conf.icon;
                return (
                  <div
                    key={category}
                    className={`rounded-xl border ${conf.borderColor} bg-[#0a0f1a] p-5`}
                  >
                    <h3 className={`text-sm font-semibold ${conf.color} mb-3 flex items-center gap-2`}>
                      <Icon className="h-4 w-4" />
                      {conf.label}
                    </h3>
                    <div className="space-y-2 mb-3">
                      {swot[category].map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 group rounded-lg border border-[#1a2332] bg-[#0d1320] px-3 py-2"
                        >
                          <span className="flex-1 text-xs text-[#b0bec5]">{item.text}</span>
                          <button
                            onClick={() => removeSwotItem(category, item.id)}
                            className="opacity-0 group-hover:opacity-100 text-[#6b7a8d] hover:text-red-400 transition-all flex-shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {swot[category].length === 0 && (
                        <p className="text-xs text-[#6b7a8d] text-center py-2">Nenhum item ainda</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={swotNewItem[category]}
                        onChange={(e) =>
                          setSwotNewItem((prev) => ({ ...prev, [category]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === 'Enter' && addSwotItem(category)}
                        placeholder="Adicionar item..."
                        className="flex-1 rounded-lg border border-[#1a2332] bg-[#0d1320] px-3 py-1.5 text-xs text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50"
                      />
                      <button
                        onClick={() => addSwotItem(category)}
                        className="rounded-lg border border-[#1a2332] p-1.5 text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/30 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Competitive Advantage Section ── */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
        <button
          onClick={() => toggleSection('advantage')}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#1a2332]/40 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Vantagem Competitiva
          </h2>
          {sectionsOpen.advantage ? (
            <ChevronUp className="h-4 w-4 text-[#6b7a8d]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#6b7a8d]" />
          )}
        </button>

        {sectionsOpen.advantage && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: 'Especializacao',
                  value: 'Direito Empresarial + Compliance',
                  desc: 'Nicho de alta demanda com baixa concorrencia qualificada na regiao',
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/5 border-blue-500/20',
                },
                {
                  title: 'Relacionamento',
                  value: '87% de retencao de clientes',
                  desc: 'Carteira fidelizada construida ao longo de 12 anos de atuacao',
                  color: 'text-green-400',
                  bg: 'bg-green-500/5 border-green-500/20',
                },
                {
                  title: 'Tecnologia',
                  value: 'Digitalizado + IA Juridica',
                  desc: 'Uso de IA para pesquisa, minuta e monitoramento de prazos',
                  color: 'text-amber-400',
                  bg: 'bg-amber-500/5 border-amber-500/20',
                },
              ].map((item) => (
                <div key={item.title} className={`rounded-xl border ${item.bg} p-5`}>
                  <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-1">{item.title}</p>
                  <p className={`text-base font-bold ${item.color} mb-2`}>{item.value}</p>
                  <p className="text-xs text-[#8899aa]">{item.desc}</p>
                </div>
              ))}
            </div>

            {/* Quick Nav + KPI Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Navegacao Rapida</h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-3 rounded-lg border border-[#1a2332] bg-[#0d1320] px-3 py-2.5 hover:bg-[#1a2332] hover:border-amber-500/20 transition-all group"
                    >
                      <link.icon className="h-4 w-4 text-[#6b7a8d] group-hover:text-amber-400 transition-colors" />
                      <span className="text-xs text-white">{link.label}</span>
                      <ArrowRight className="h-3 w-3 text-[#6b7a8d] ml-auto group-hover:text-amber-400 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#1a2332] bg-[#0a0f1a] p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-amber-400" />
                  Resumo KPIs
                </h3>
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
        )}
      </div>

      {/* ── Action Plan Section ── */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
        <button
          onClick={() => toggleSection('actions')}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#1a2332]/40 transition-colors"
        >
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Plano de Acao
          </h2>
          {sectionsOpen.actions ? (
            <ChevronUp className="h-4 w-4 text-[#6b7a8d]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#6b7a8d]" />
          )}
        </button>

        {sectionsOpen.actions && (
          <div className="px-6 pb-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1a2332]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">Objetivo / Acao</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">Responsavel</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">Prazo</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2332]">
                  {actions.map((action) => {
                    const conf = actionStatusConfig[action.status];
                    return (
                      <tr key={action.id} className="hover:bg-[#0a0f1a] transition-colors">
                        <td className="py-3 px-4">
                          <p className="text-white text-sm">{action.objective}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-[#8899aa] text-xs">{action.responsible}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-[#8899aa] text-xs font-mono">
                            {new Date(action.deadline).toLocaleDateString('pt-BR')}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={action.status}
                            onChange={(e) =>
                              setActions((prev) =>
                                prev.map((a) =>
                                  a.id === action.id
                                    ? { ...a, status: e.target.value as ActionStatus }
                                    : a
                                )
                              )
                            }
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium border-0 focus:outline-none cursor-pointer ${conf.className}`}
                          >
                            {(Object.keys(actionStatusConfig) as ActionStatus[]).map((s) => (
                              <option key={s} value={s} className="bg-[#0d1320] text-white">
                                {actionStatusConfig[s].label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => setActions((prev) => prev.filter((a) => a.id !== action.id))}
                            className="text-[#6b7a8d] hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
