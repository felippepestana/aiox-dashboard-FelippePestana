'use client';

import React, { useState } from 'react';
import {
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  Eye,
  Tag,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Procedure {
  id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  price: number;
  toothRegion?: string;
  complexity: 1 | 2 | 3 | 4 | 5;
  durationMinutes: number;
}

export interface ProcedureCardProps {
  procedure: Procedure;
  onAddToPlan?: (procedure: Procedure) => void;
  onViewDetails?: (procedure: Procedure) => void;
  className?: string;
  compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Restauração': 'bg-blue-50 text-blue-700 border-blue-200',
  'Endodontia': 'bg-red-50 text-red-700 border-red-200',
  'Periodontia': 'bg-green-50 text-green-700 border-green-200',
  'Cirurgia': 'bg-amber-50 text-amber-700 border-amber-200',
  'Prótese': 'bg-purple-50 text-purple-700 border-purple-200',
  'Ortodontia': 'bg-pink-50 text-pink-700 border-pink-200',
  'Implante': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Estética': 'bg-teal-50 text-teal-700 border-teal-200',
  'Prevenção': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const DEFAULT_CATEGORY_COLOR = 'bg-gray-50 text-gray-700 border-gray-200';

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function ProcedureCard({
  procedure,
  onAddToPlan,
  onViewDetails,
  className,
  compact = false,
}: ProcedureCardProps) {
  const [expanded, setExpanded] = useState(false);

  const categoryColor = CATEGORY_COLORS[procedure.category] || DEFAULT_CATEGORY_COLOR;

  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group',
        className
      )}
    >
      <div className={cn('px-5 py-4', compact && 'px-4 py-3')}>
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border',
                  categoryColor
                )}
              >
                {procedure.category}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">{procedure.code}</span>
            </div>
            <h4 className={cn('font-semibold text-gray-900', compact ? 'text-sm' : 'text-base')}>
              {procedure.name}
            </h4>
          </div>
          <div className="text-right shrink-0">
            <p className={cn('font-bold', compact ? 'text-sm' : 'text-lg')} style={{ color: '#0D9488' }}>
              {formatBRL(procedure.price)}
            </p>
          </div>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {/* Duration */}
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{procedure.durationMinutes} min</span>
          </div>

          {/* Tooth region */}
          {procedure.toothRegion && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>{procedure.toothRegion}</span>
            </div>
          )}

          {/* Complexity */}
          <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
            <Tag className="w-3.5 h-3.5" />
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    i < procedure.complexity ? 'bg-[#D4A76A]' : 'bg-gray-200'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Expandable description */}
        {!compact && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-600 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? 'Ocultar descrição' : 'Ver descrição'}
            </button>
            {expanded && (
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{procedure.description}</p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2 bg-gray-50/50">
        {onAddToPlan && (
          <button
            onClick={() => onAddToPlan(procedure)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: '#0D9488' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0F766E')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0D9488')}
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar ao Plano
          </button>
        )}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(procedure)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Detalhes
          </button>
        )}
      </div>
    </div>
  );
}
