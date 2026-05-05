'use client';

import React from 'react';
import {
  Phone,
  FileText,
  X,
  TrendingUp,
  Users,
  Megaphone,
  GitBranch,
  RefreshCw,
  Calendar,
  Tag,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import type { LegalArea } from '@/types/legal';
import type { OpportunitySource } from './OpportunityGenerator';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface OpportunityCardData {
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

export interface OpportunityCardProps {
  opportunity: OpportunityCardData;
  onContact?: () => void;
  onCreateProposal?: () => void;
  onDismiss?: () => void;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<
  OpportunitySource,
  { icon: typeof Megaphone; label: string; color: string }
> = {
  marketing: {
    icon: Megaphone,
    label: 'Marketing',
    color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  },
  referral: {
    icon: Users,
    label: 'Indicação',
    color: 'text-green-400 bg-green-500/10 border-green-500/20',
  },
  cross_sell: {
    icon: GitBranch,
    label: 'Cross-sell',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  upsell: {
    icon: TrendingUp,
    label: 'Upsell',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  reactivation: {
    icon: RefreshCw,
    label: 'Reativação',
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  },
};

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

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-400';
  if (confidence >= 0.6) return 'text-yellow-400';
  return 'text-red-400';
}

function getConfidenceBarColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.6) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Component ──────────────────────────────────────────────────────────────

export function OpportunityCard({
  opportunity,
  onContact,
  onCreateProposal,
  onDismiss,
}: OpportunityCardProps) {
  const sourceConf = SOURCE_CONFIG[opportunity.type];
  const SourceIcon = sourceConf.icon;
  const daysUntilExpiry = opportunity.expiresAt
    ? getDaysUntil(opportunity.expiresAt)
    : null;

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-[#2a3342] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium border ${sourceConf.color}`}
            >
              <SourceIcon className="h-2.5 w-2.5" />
              {sourceConf.label}
            </span>
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#1a2332] text-[#8899aa]">
              {AREA_LABELS[opportunity.area]}
            </span>
            {daysUntilExpiry !== null && daysUntilExpiry <= 7 && (
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                <Calendar className="h-2.5 w-2.5" />
                {daysUntilExpiry <= 0 ? 'Expirada' : `${daysUntilExpiry}d restantes`}
              </span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-white">{opportunity.title}</h4>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[#6b7a8d] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1a2332]"
            title="Dispensar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Client */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/10">
          <Users className="h-3 w-3 text-amber-400" />
        </div>
        <span className="text-xs text-white font-medium">{opportunity.clientName}</span>
      </div>

      {/* Description */}
      <p className="text-xs text-[#8899aa] leading-relaxed mb-4">{opportunity.description}</p>

      {/* Value & Confidence */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] text-[#6b7a8d] uppercase">Valor Estimado</span>
          </div>
          <p className="text-sm font-semibold text-amber-400">
            {formatCurrency(opportunity.estimatedValue)}
          </p>
        </div>
        <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2">
          <div className="flex items-center gap-1.5 mb-1">
            <BarChart3 className="h-3 w-3 text-[#6b7a8d]" />
            <span className="text-[10px] text-[#6b7a8d] uppercase">Confiança</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold ${getConfidenceColor(opportunity.confidence)}`}>
              {Math.round(opportunity.confidence * 100)}%
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-[#1a2332]">
              <div
                className={`h-1.5 rounded-full ${getConfidenceBarColor(opportunity.confidence)}`}
                style={{ width: `${opportunity.confidence * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Source */}
      <div className="flex items-center gap-1.5 text-[10px] text-[#6b7a8d] mb-3">
        <span>Fonte:</span>
        <span className="text-white">{opportunity.source}</span>
        <span className="mx-1">|</span>
        <Calendar className="h-2.5 w-2.5" />
        <span>{formatDate(opportunity.createdAt)}</span>
      </div>

      {/* Tags */}
      {opportunity.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <Tag className="h-3 w-3 text-[#6b7a8d]" />
          {opportunity.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-[#1a2332] text-[#6b7a8d]"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#1a2332]">
        {onContact && (
          <button
            onClick={onContact}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            <Phone className="h-3 w-3" />
            Contatar
          </button>
        )}
        {onCreateProposal && (
          <button
            onClick={onCreateProposal}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a2332] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2a3342] transition-colors border border-[#1a2332]"
          >
            <FileText className="h-3 w-3" />
            Criar Proposta
          </button>
        )}
      </div>
    </div>
  );
}
