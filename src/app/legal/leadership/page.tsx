'use client';

import { useState } from 'react';
import {
  Users,
  ChevronRight,
  Briefcase,
  GraduationCap,
  Star,
  Crown,
  Target,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { useLegalStrategyStore } from '@/stores/legal-strategy-store';
import type { AttorneyLevel, LeadershipEntry } from '@/stores/legal-strategy-store';

const LEVEL_META: Record<AttorneyLevel, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  junior_associate: { label: 'Associado Junior', icon: GraduationCap, color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  senior_associate: { label: 'Associado Senior', icon: Briefcase, color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/20' },
  partner: { label: 'Socio', icon: Star, color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  managing_partner: { label: 'Socio-Gestor', icon: Crown, color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
};

const LEVELS: AttorneyLevel[] = ['junior_associate', 'senior_associate', 'partner', 'managing_partner'];

const MOCK_PIPELINE: Omit<LeadershipEntry, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Ana Carolina Silva',
    level: 'junior_associate',
    yearsExperience: 2,
    skills: ['Direito Civil', 'Pesquisa Jurisprudencial', 'Redacao de Peticoes'],
    developmentGoals: ['Atuar em audiencias solo', 'Captar 3 clientes proprios'],
    targetHours: 160,
    billedHours: 142,
    revenueGenerated: 28000,
  },
  {
    name: 'Pedro Henrique Costa',
    level: 'junior_associate',
    yearsExperience: 1,
    skills: ['Direito Trabalhista', 'Contratos', 'Compliance'],
    developmentGoals: ['Concluir pos-graduacao', 'Publicar 2 artigos academicos'],
    targetHours: 160,
    billedHours: 155,
    revenueGenerated: 32000,
  },
  {
    name: 'Mariana Oliveira',
    level: 'senior_associate',
    yearsExperience: 6,
    skills: ['Direito Tributario', 'Planejamento Fiscal', 'Consultoria Empresarial'],
    developmentGoals: ['Liderar equipe de 3 juniors', 'Desenvolver carteira de R$ 500k'],
    targetHours: 180,
    billedHours: 172,
    revenueGenerated: 185000,
  },
  {
    name: 'Rafael Mendes',
    level: 'senior_associate',
    yearsExperience: 8,
    skills: ['Direito Digital', 'LGPD', 'Propriedade Intelectual', 'Startups'],
    developmentGoals: ['Preparar para sociedade', 'Expandir area de Direito Digital'],
    targetHours: 180,
    billedHours: 190,
    revenueGenerated: 320000,
  },
  {
    name: 'Dra. Fernanda Rocha',
    level: 'partner',
    yearsExperience: 14,
    skills: ['Direito Empresarial', 'M&A', 'Governanca Corporativa', 'Arbitragem'],
    developmentGoals: ['Expandir carteira internacional', 'Mentoring de 2 seniors'],
    targetHours: 150,
    billedHours: 148,
    revenueGenerated: 780000,
  },
  {
    name: 'Dr. Carlos Eduardo Lima',
    level: 'managing_partner',
    yearsExperience: 22,
    skills: ['Gestao Estrategica', 'Direito Civil', 'Contencioso Estrategico', 'Mediacao'],
    developmentGoals: ['Implementar Scaling Up', 'Expandir para 3 novas cidades'],
    targetHours: 120,
    billedHours: 98,
    revenueGenerated: 1200000,
  },
];

export default function LeadershipPage() {
  const { leadershipPipeline, addLeadershipEntry } = useLegalStrategyStore();
  const [selectedLevel, setSelectedLevel] = useState<AttorneyLevel | 'all'>('all');

  const pipeline = leadershipPipeline.length > 0 ? leadershipPipeline : [];
  const hasMockData = leadershipPipeline.length === 0;

  const displayData: (LeadershipEntry | (typeof MOCK_PIPELINE)[0] & { id: string; createdAt: string; updatedAt: string })[] =
    hasMockData
      ? MOCK_PIPELINE.map((m, i) => ({ ...m, id: `mock-${i}`, createdAt: '', updatedAt: '' }))
      : pipeline;

  function seedData() {
    MOCK_PIPELINE.forEach((entry) => addLeadershipEntry(entry));
  }

  const filtered =
    selectedLevel === 'all'
      ? displayData
      : displayData.filter((e) => e.level === selectedLevel);

  const countByLevel = (level: AttorneyLevel) =>
    displayData.filter((e) => e.level === level).length;

  const totalRevenue = displayData.reduce((sum, e) => sum + e.revenueGenerated, 0);
  const totalBilled = displayData.reduce((sum, e) => sum + e.billedHours, 0);
  const totalTarget = displayData.reduce((sum, e) => sum + e.targetHours, 0);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="h-7 w-7 text-amber-400" />
            Pipeline de Lideranca
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Gestao de carreira e desenvolvimento da equipe juridica
          </p>
        </div>
        {hasMockData && (
          <button
            onClick={seedData}
            className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            Carregar Dados Demo
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Total Equipe</p>
          <p className="text-2xl font-bold text-white mt-1">{displayData.length}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Receita Gerada</p>
          <p className="text-2xl font-bold text-white mt-1">
            R$ {(totalRevenue / 1000).toFixed(0)}k
          </p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Horas Faturadas</p>
          <p className="text-2xl font-bold text-white mt-1">{totalBilled}h</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Utilizacao</p>
          <p className="text-2xl font-bold text-white mt-1">
            {totalTarget > 0 ? ((totalBilled / totalTarget) * 100).toFixed(0) : 0}%
          </p>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Visualizacao do Pipeline</h2>
        <div className="flex items-center gap-2">
          {LEVELS.map((level, idx) => {
            const meta = LEVEL_META[level];
            const Icon = meta.icon;
            const count = countByLevel(level);
            return (
              <div key={level} className="flex items-center flex-1">
                <button
                  onClick={() => setSelectedLevel(selectedLevel === level ? 'all' : level)}
                  className={`flex-1 rounded-xl border p-4 text-center transition-all ${
                    selectedLevel === level
                      ? `${meta.bgColor} border-current`
                      : 'border-[#1a2332] bg-[#0a0f1a] hover:border-[#2a3342]'
                  }`}
                >
                  <Icon className={`h-6 w-6 mx-auto mb-2 ${meta.color}`} />
                  <p className={`text-sm font-medium ${meta.color}`}>{meta.label}</p>
                  <p className="text-2xl font-bold text-white mt-1">{count}</p>
                </button>
                {idx < LEVELS.length - 1 && (
                  <ChevronRight className="h-5 w-5 text-[#6b7a8d] flex-shrink-0 mx-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((entry) => {
          const meta = LEVEL_META[entry.level];
          const Icon = meta.icon;
          const utilization = entry.targetHours > 0 ? (entry.billedHours / entry.targetHours) * 100 : 0;

          return (
            <div
              key={entry.id}
              className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-[#2a3342] transition-colors"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className={`rounded-lg p-2 ${meta.bgColor} border`}>
                  <Icon className={`h-5 w-5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{entry.name}</h3>
                  <p className={`text-xs ${meta.color}`}>{meta.label}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <Clock className="h-3.5 w-3.5 text-[#6b7a8d] mx-auto mb-1" />
                  <p className="text-xs text-[#6b7a8d]">Experiencia</p>
                  <p className="text-sm font-semibold text-white">{entry.yearsExperience} anos</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="h-3.5 w-3.5 text-[#6b7a8d] mx-auto mb-1" />
                  <p className="text-xs text-[#6b7a8d]">Utilizacao</p>
                  <p className="text-sm font-semibold text-white">{utilization.toFixed(0)}%</p>
                </div>
                <div className="text-center">
                  <Target className="h-3.5 w-3.5 text-[#6b7a8d] mx-auto mb-1" />
                  <p className="text-xs text-[#6b7a8d]">Receita</p>
                  <p className="text-sm font-semibold text-white">
                    R$ {(entry.revenueGenerated / 1000).toFixed(0)}k
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-2">Competencias</p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.skills.slice(0, 3).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-[#1a2332] px-2.5 py-0.5 text-[10px] text-[#6b7a8d]"
                    >
                      {skill}
                    </span>
                  ))}
                  {entry.skills.length > 3 && (
                    <span className="rounded-full bg-[#1a2332] px-2.5 py-0.5 text-[10px] text-[#6b7a8d]">
                      +{entry.skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-2">Metas de Desenvolvimento</p>
                <div className="space-y-1.5">
                  {entry.developmentGoals.map((goal) => (
                    <div key={goal} className="flex items-start gap-2">
                      <div className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                      <p className="text-xs text-white">{goal}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
