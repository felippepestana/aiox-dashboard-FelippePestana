'use client';

import React, { useState } from 'react';
import { BookOpen, Bookmark, ChevronDown, ChevronUp } from 'lucide-react';

export interface PrecedentData {
  id: string;
  ementa: string;
  court: string;
  date: string;
  relator: string;
  similarityScore: number;
  theme?: string;
  numero?: string;
}

export interface PrecedentCardProps {
  precedent: PrecedentData;
  onSave?: (id: string) => void;
  onViewFull?: (id: string) => void;
}

const COURT_COLORS: Record<string, string> = {
  STF: 'bg-red-500/20 text-red-400 border-red-500/30',
  STJ: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  TST: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  TJ: 'bg-green-500/20 text-green-400 border-green-500/30',
  TRF: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  TRT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export function PrecedentCard({ precedent, onSave, onViewFull }: PrecedentCardProps) {
  const [expanded, setExpanded] = useState(false);

  const courtColor = COURT_COLORS[precedent.court] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  const truncatedEmenta = precedent.ementa.length > 200
    ? precedent.ementa.substring(0, 200) + '...'
    : precedent.ementa;

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  function getSimilarityColor(score: number): string {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getSimilarityBarColor(score: number): string {
    if (score >= 0.8) return 'bg-green-500';
    if (score >= 0.5) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${courtColor}`}>
            {precedent.court}
          </span>
          {precedent.numero && (
            <span className="text-xs text-[#6b7a8d] font-mono">{precedent.numero}</span>
          )}
          {precedent.theme && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-500/10 text-amber-400">
              {precedent.theme}
            </span>
          )}
        </div>
        <span className="text-xs text-[#6b7a8d] flex-shrink-0">{formatDate(precedent.date)}</span>
      </div>

      {/* Ementa */}
      <div className="mb-3">
        <p className="text-sm text-white leading-relaxed">
          {expanded ? precedent.ementa : truncatedEmenta}
        </p>
        {precedent.ementa.length > 200 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 mt-1 transition-colors"
          >
            {expanded ? (
              <>Menos <ChevronUp className="h-3 w-3" /></>
            ) : (
              <>Mais <ChevronDown className="h-3 w-3" /></>
            )}
          </button>
        )}
      </div>

      {/* Relator */}
      <p className="text-xs text-[#6b7a8d] mb-3">
        Relator(a): <span className="text-white">{precedent.relator}</span>
      </p>

      {/* Similarity Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#6b7a8d]">Similaridade</span>
          <span className={`text-xs font-medium ${getSimilarityColor(precedent.similarityScore)}`}>
            {(precedent.similarityScore * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[#1a2332]">
          <div
            className={`h-1.5 rounded-full ${getSimilarityBarColor(precedent.similarityScore)}`}
            style={{ width: `${precedent.similarityScore * 100}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {onViewFull && (
          <button
            onClick={() => onViewFull(precedent.id)}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            <BookOpen className="h-3 w-3" />
            Ver Inteiro Teor
          </button>
        )}
        {onSave && (
          <button
            onClick={() => onSave(precedent.id)}
            className="flex items-center gap-1.5 rounded-lg bg-[#1a2332] px-3 py-1.5 text-xs font-medium text-[#8899aa] hover:text-white hover:bg-[#2a3342] transition-colors border border-[#1a2332]"
          >
            <Bookmark className="h-3 w-3" />
            Salvar Precedente
          </button>
        )}
      </div>
    </div>
  );
}
