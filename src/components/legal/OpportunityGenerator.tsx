'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Sparkles,
  TrendingUp,
  Users,
  Target,
  RefreshCw,
  Filter,
  Loader2,
  BarChart3,
  Megaphone,
  GitBranch,
  Briefcase,
} from 'lucide-react';
import { OpportunityCard } from './OpportunityCard';
import type { LegalArea } from '@/types/legal';

// ─── Types ──────────────────────────────────────────────────────────────────

export type OpportunitySource = 'marketing' | 'referral' | 'cross_sell' | 'upsell' | 'reactivation';

export interface Opportunity {
  id: string;
  clientName: string;
  clientId: string;
  area: LegalArea;
  type: OpportunitySource;
  title: string;
  description: string;
  estimatedValue: number;
  confidence: number;
  source: string;
  createdAt: string;
  expiresAt?: string;
  tags: string[];
}

export interface OpportunityGeneratorProps {
  onContact?: (opportunity: Opportunity) => void;
  onCreateProposal?: (opportunity: Opportunity) => void;
  onDismiss?: (opportunity: Opportunity) => void;
}

// ─── Mock Opportunity Data ──────────────────────────────────────────────────

const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'opp-001',
    clientName: 'Maria Silva Santos',
    clientId: 'cli-001',
    area: 'trabalhista',
    type: 'cross_sell',
    title: 'Revisão de FGTS - Expurgos Inflacionários',
    description: 'Cliente com reclamação trabalhista pode ter direito à revisão do FGTS referente a expurgos inflacionários dos planos econômicos. Potencial de recuperação significativo.',
    estimatedValue: 15000,
    confidence: 0.82,
    source: 'Análise de caso trabalhista INT-001',
    createdAt: '2026-04-10T14:00:00Z',
    tags: ['FGTS', 'expurgos', 'trabalhista'],
  },
  {
    id: 'opp-002',
    clientName: 'Tech Solutions Ltda.',
    clientId: 'cli-007',
    area: 'tributario',
    type: 'marketing',
    title: 'Recuperação de PIS/COFINS sobre ICMS',
    description: 'Lead captado via campanha LinkedIn sobre exclusão do ICMS da base de cálculo do PIS/COFINS (Tema 69 STF). Empresa com faturamento mensal de R$ 500k.',
    estimatedValue: 180000,
    confidence: 0.91,
    source: 'Campanha LinkedIn - Tributário Q1/2026',
    createdAt: '2026-04-09T10:00:00Z',
    expiresAt: '2026-04-20T23:59:00Z',
    tags: ['PIS/COFINS', 'ICMS', 'Tema 69', 'tributário'],
  },
  {
    id: 'opp-003',
    clientName: 'João Pedro Oliveira',
    clientId: 'cli-002',
    area: 'consumidor',
    type: 'cross_sell',
    title: 'Ação de Repetição de Indébito - Cartão de Crédito',
    description: 'Durante entrevista cível, cliente mencionou cobranças indevidas de seguro em cartão de crédito. Possível ação de repetição em dobro (art. 42, CDC).',
    estimatedValue: 8500,
    confidence: 0.75,
    source: 'Entrevista cível INT-002',
    createdAt: '2026-04-09T15:00:00Z',
    tags: ['consumidor', 'repetição de indébito', 'cartão'],
  },
  {
    id: 'opp-004',
    clientName: 'Roberto Carlos Mendes',
    clientId: 'cli-004',
    area: 'empresarial',
    type: 'upsell',
    title: 'Reestruturação Societária + Planejamento Tributário',
    description: 'Cliente com demanda tributária pode se beneficiar de reestruturação societária para otimização fiscal. Migração de Lucro Presumido para Simples Nacional.',
    estimatedValue: 35000,
    confidence: 0.68,
    source: 'Análise de perfil tributário',
    createdAt: '2026-04-08T09:00:00Z',
    tags: ['societário', 'planejamento tributário', 'reestruturação'],
  },
  {
    id: 'opp-005',
    clientName: 'Ana Beatriz Costa',
    clientId: 'cli-003',
    area: 'digital',
    type: 'cross_sell',
    title: 'Adequação LGPD para Empresa do Cliente',
    description: 'Cliente consumidora é sócia de pequena empresa. Identificada oportunidade de consultoria para adequação à LGPD e implementação de programa de privacidade.',
    estimatedValue: 22000,
    confidence: 0.72,
    source: 'Entrevista consumidor INT-003',
    createdAt: '2026-04-08T16:00:00Z',
    tags: ['LGPD', 'privacidade', 'consultoria'],
  },
  {
    id: 'opp-006',
    clientName: 'Fernanda Lima Souza',
    clientId: 'cli-005',
    area: 'previdenciario',
    type: 'referral',
    title: 'Revisão de Aposentadoria - Atividade Especial',
    description: 'Indicação do marido da cliente (caso de família). Ex-marido pode ter direito a revisão de aposentadoria por tempo especial como metalúrgico.',
    estimatedValue: 45000,
    confidence: 0.65,
    source: 'Indicação de cliente - Família INT-005',
    createdAt: '2026-04-07T11:00:00Z',
    tags: ['previdenciário', 'revisão', 'atividade especial'],
  },
  {
    id: 'opp-007',
    clientName: 'Marcos Antônio Pereira',
    clientId: 'cli-008',
    area: 'civil',
    type: 'reactivation',
    title: 'Nova Demanda - Vícios Construtivos em Imóvel',
    description: 'Ex-cliente (caso encerrado em 2025) registrou interesse em nova demanda por vícios construtivos em imóvel adquirido. Dentro da garantia legal.',
    estimatedValue: 55000,
    confidence: 0.78,
    source: 'Formulário site - Reativação',
    createdAt: '2026-04-06T08:00:00Z',
    tags: ['civil', 'vícios construtivos', 'imobiliário'],
  },
  {
    id: 'opp-008',
    clientName: 'Distribuidora ABC S.A.',
    clientId: 'cli-009',
    area: 'trabalhista',
    type: 'marketing',
    title: 'Consultoria Trabalhista Preventiva',
    description: 'Empresa captada via webinar sobre compliance trabalhista. Possui 150 funcionários e nenhuma assessoria jurídica trabalhista. Alto risco de passivo.',
    estimatedValue: 96000,
    confidence: 0.85,
    source: 'Webinar - Compliance Trabalhista Abr/2026',
    createdAt: '2026-04-05T14:00:00Z',
    tags: ['trabalhista', 'consultoria', 'preventivo', 'compliance'],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

const SOURCE_ICONS: Record<OpportunitySource, typeof Megaphone> = {
  marketing: Megaphone,
  referral: Users,
  cross_sell: GitBranch,
  upsell: TrendingUp,
  reactivation: RefreshCw,
};

const SOURCE_LABELS: Record<OpportunitySource, string> = {
  marketing: 'Marketing',
  referral: 'Indicação',
  cross_sell: 'Cross-sell',
  upsell: 'Upsell',
  reactivation: 'Reativação',
};

// ─── Component ──────────────────────────────────────────────────────────────

export function OpportunityGenerator({
  onContact,
  onCreateProposal,
  onDismiss,
}: OpportunityGeneratorProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(MOCK_OPPORTUNITIES);
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const filteredOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      if (dismissed.has(opp.id)) return false;
      if (sourceFilter === 'all') return true;
      return opp.type === sourceFilter;
    });
  }, [opportunities, sourceFilter, dismissed]);

  // Stats
  const totalValue = useMemo(
    () => filteredOpportunities.reduce((sum, o) => sum + o.estimatedValue, 0),
    [filteredOpportunities]
  );

  const avgConfidence = useMemo(
    () =>
      filteredOpportunities.length > 0
        ? filteredOpportunities.reduce((sum, o) => sum + o.confidence, 0) /
          filteredOpportunities.length
        : 0,
    [filteredOpportunities]
  );

  const bySource = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const o of opportunities) {
      if (dismissed.has(o.id)) continue;
      counts[o.type] = (counts[o.type] || 0) + 1;
    }
    return counts;
  }, [opportunities, dismissed]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsGenerating(false);
  }, []);

  const handleDismiss = useCallback(
    (opp: Opportunity) => {
      setDismissed((prev) => new Set([...prev, opp.id]));
      onDismiss?.(opp);
    },
    [onDismiss]
  );

  function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Sparkles className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Gerador de Oportunidades</h3>
            <p className="text-xs text-[#6b7a8d]">
              Oportunidades identificadas por IA a partir de marketing, processos e perfil de clientes
            </p>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isGenerating ? 'Gerando...' : 'Gerar Novas'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Oportunidades</p>
              <p className="text-2xl font-bold text-white mt-1">{filteredOpportunities.length}</p>
            </div>
            <Target className="h-5 w-5 text-amber-400" />
          </div>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Valor Potencial</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(totalValue)}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-amber-400" />
          </div>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Confiança Média</p>
              <p className="text-2xl font-bold text-white mt-1">{Math.round(avgConfidence * 100)}%</p>
            </div>
            <BarChart3 className="h-5 w-5 text-amber-400" />
          </div>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Clientes Únicos</p>
              <p className="text-2xl font-bold text-white mt-1">
                {new Set(filteredOpportunities.map((o) => o.clientId)).size}
              </p>
            </div>
            <Users className="h-5 w-5 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Source Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-[#6b7a8d]" />
        <button
          onClick={() => setSourceFilter('all')}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
            sourceFilter === 'all'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-[#0d1320] text-[#6b7a8d] border-[#1a2332] hover:text-white'
          }`}
        >
          Todas ({filteredOpportunities.length})
        </button>
        {(Object.entries(SOURCE_LABELS) as [OpportunitySource, string][]).map(([key, label]) => {
          const Icon = SOURCE_ICONS[key];
          const count = bySource[key] || 0;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setSourceFilter(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                sourceFilter === key
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-[#0d1320] text-[#6b7a8d] border-[#1a2332] hover:text-white'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Opportunity Cards */}
      {isGenerating ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 text-amber-400 animate-spin mb-3" />
          <p className="text-sm text-[#6b7a8d]">Analisando pipeline de leads e resultados de processos...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#6b7a8d]">
          <Sparkles className="h-12 w-12 mb-3 opacity-50" />
          <p className="text-sm">Nenhuma oportunidade nesta categoria</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onContact={() => onContact?.(opp)}
              onCreateProposal={() => onCreateProposal?.(opp)}
              onDismiss={() => handleDismiss(opp)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
