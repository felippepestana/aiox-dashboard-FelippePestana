'use client';

import React from 'react';
import type { Honorario } from '@/types/legal';

export interface HonorarioTrackerProps {
  honorario: Honorario;
}

const TYPE_LABELS: Record<string, string> = {
  contractual: 'Contratual',
  sucumbencial: 'Sucumbencial',
  ad_exitum: 'Ad Exitum',
  pro_bono: 'Pro Bono',
};

const TYPE_COLORS: Record<string, string> = {
  contractual: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  sucumbencial: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  ad_exitum: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  pro_bono: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  completed: 'Quitado',
  defaulted: 'Inadimplente',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  active: 'text-green-400',
  completed: 'text-blue-400',
  defaulted: 'text-red-400',
  cancelled: 'text-gray-400',
};

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function HonorarioTracker({ honorario }: HonorarioTrackerProps) {
  const progressPct =
    honorario.installments > 0
      ? Math.min((honorario.paidInstallments / honorario.installments) * 100, 100)
      : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
            TYPE_COLORS[honorario.type] ?? TYPE_COLORS.contractual
          }`}
        >
          {TYPE_LABELS[honorario.type] ?? honorario.type}
        </span>
        <span className={`text-xs font-medium ${STATUS_COLORS[honorario.status] ?? 'text-gray-400'}`}>
          {STATUS_LABELS[honorario.status] ?? honorario.status}
        </span>
      </div>

      {/* Amount */}
      <p className="text-lg font-bold text-white">
        {formatBRL(honorario.amount)}
      </p>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
          <span>
            {honorario.paidInstallments}/{honorario.installments} parcelas
          </span>
          <span>{progressPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Due day */}
      <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
        <span className="text-[11px] text-gray-500">Vencimento</span>
        <span className="text-xs text-gray-300 font-medium">
          Dia {honorario.dueDay}
        </span>
      </div>
    </div>
  );
}
