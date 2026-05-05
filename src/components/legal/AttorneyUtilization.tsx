'use client';

import React from 'react';
import { User, DollarSign, Clock } from 'lucide-react';

export interface AttorneyUtilizationProps {
  name: string;
  level: string;
  billedHours: number;
  targetHours: number;
  revenueGenerated: number;
}

const LEVEL_LABELS: Record<string, string> = {
  junior_associate: 'Associado Junior',
  senior_associate: 'Associado Senior',
  partner: 'Socio',
  managing_partner: 'Socio Gestor',
};

export function AttorneyUtilization({
  name,
  level,
  billedHours,
  targetHours,
  revenueGenerated,
}: AttorneyUtilizationProps) {
  const utilization = targetHours > 0 ? (billedHours / targetHours) * 100 : 0;
  const clampedUtil = Math.min(utilization, 100);

  function getUtilColor(): string {
    if (utilization >= 80) return 'text-green-400';
    if (utilization >= 60) return 'text-yellow-400';
    return 'text-red-400';
  }

  function getBarColor(): string {
    if (utilization >= 80) return 'bg-green-500';
    if (utilization >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10">
          <User className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">{name}</p>
          <p className="text-xs text-[#6b7a8d]">{LEVEL_LABELS[level] ?? level}</p>
        </div>
      </div>

      {/* Utilization bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#6b7a8d]">Utilizacao</span>
          <span className={`text-xs font-medium ${getUtilColor()}`}>
            {utilization.toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#1a2332]">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getBarColor()}`}
            style={{ width: `${clampedUtil}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-[#6b7a8d]" />
          <div>
            <p className="text-xs text-[#6b7a8d]">Horas</p>
            <p className="text-sm font-medium text-white">{billedHours}/{targetHours}h</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5 text-[#6b7a8d]" />
          <div>
            <p className="text-xs text-[#6b7a8d]">Receita</p>
            <p className="text-sm font-medium text-white">
              R$ {revenueGenerated.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
