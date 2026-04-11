'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KPICardProps {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend?: 'up' | 'down' | 'flat';
}

export function KPICard({ name, value, target, unit, trend = 'flat' }: KPICardProps) {
  const pct = target > 0 ? (value / target) * 100 : 0;
  const clampedPct = Math.min(pct, 100);

  function getColor(): string {
    if (pct >= 80) return 'text-green-400';
    if (pct >= 60) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getBarColor(): string {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  function getTrendIcon() {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-400" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <Minus className="h-4 w-4 text-[#6b7a8d]" />;
  }

  function formatValue(v: number): string {
    if (unit === 'R$') return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    if (unit === '%') return `${v.toFixed(1)}%`;
    return `${v.toLocaleString('pt-BR')} ${unit}`;
  }

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">{name}</p>
          <p className={`text-xl font-bold mt-1 ${getColor()}`}>
            {formatValue(value)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-[#1a2332] mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-[#6b7a8d]">
          Meta: {formatValue(target)}
        </span>
        <span className={getColor()}>
          {pct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
