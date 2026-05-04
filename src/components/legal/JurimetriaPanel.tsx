'use client';

import { TrendingUp, TrendingDown, Minus, Clock, DollarSign, BarChart3 } from 'lucide-react';

export interface TribunalStats {
  tribunal: string;
  favoravel: number;
  desfavoravel: number;
  parcial: number;
  valorMedio: number;
  duracaoMedia: string;
}

export interface JurimetriaPanelProps {
  stats: TribunalStats[];
  area: string;
  tipoAcao: string;
}

function getSuccessColor(rate: number): string {
  if (rate > 60) return 'text-green-400';
  if (rate >= 40) return 'text-yellow-400';
  return 'text-red-400';
}

function getBarColor(rate: number): string {
  if (rate > 60) return 'bg-green-500';
  if (rate >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getBarBg(rate: number): string {
  if (rate > 60) return 'bg-green-500/10';
  if (rate >= 40) return 'bg-yellow-500/10';
  return 'bg-red-500/10';
}

export function JurimetriaPanel({ stats, area, tipoAcao }: JurimetriaPanelProps) {
  const avgSuccess =
    stats.length > 0
      ? Math.round(stats.reduce((sum, s) => sum + s.favoravel, 0) / stats.length)
      : 0;
  const avgValor =
    stats.length > 0
      ? stats.reduce((sum, s) => sum + s.valorMedio, 0) / stats.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-[#6b7a8d] uppercase tracking-wider">Taxa de Sucesso</span>
          </div>
          <p className={`text-3xl font-bold ${getSuccessColor(avgSuccess)}`}>
            {avgSuccess}%
          </p>
          <p className="text-xs text-[#6b7a8d] mt-1">Media entre tribunais</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-[#6b7a8d] uppercase tracking-wider">Valor Medio</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {avgValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-[#6b7a8d] mt-1">Condenacao media</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4 text-amber-400" />
            <span className="text-xs text-[#6b7a8d] uppercase tracking-wider">Duracao Media</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {stats.length > 0 ? stats[0].duracaoMedia : '--'}
          </p>
          <p className="text-xs text-[#6b7a8d] mt-1">Tempo ate julgamento</p>
        </div>
      </div>

      {/* Tribunal Comparison Bars */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h3 className="text-sm font-semibold text-white mb-5">
          Comparativo por Tribunal - {area} / {tipoAcao}
        </h3>
        <div className="space-y-5">
          {stats.map((stat) => {
            const total = stat.favoravel + stat.desfavoravel + stat.parcial;
            const favPct = total > 0 ? (stat.favoravel / total) * 100 : 0;
            const desfPct = total > 0 ? (stat.desfavoravel / total) * 100 : 0;
            const parcPct = total > 0 ? (stat.parcial / total) * 100 : 0;

            return (
              <div key={stat.tribunal} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-white w-14">
                      {stat.tribunal}
                    </span>
                    <span className={`text-sm font-bold ${getSuccessColor(favPct)}`}>
                      {Math.round(favPct)}% favoravel
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#6b7a8d]">
                    <span>
                      {stat.valorMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </span>
                    <span>{stat.duracaoMedia}</span>
                  </div>
                </div>
                {/* Stacked bar */}
                <div className="flex h-6 w-full overflow-hidden rounded-lg bg-[#0a0f1a]">
                  <div
                    className="bg-green-500 transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${favPct}%` }}
                  >
                    {favPct > 10 && (
                      <span className="text-[10px] font-bold text-white">
                        {Math.round(favPct)}%
                      </span>
                    )}
                  </div>
                  <div
                    className="bg-yellow-500 transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${parcPct}%` }}
                  >
                    {parcPct > 10 && (
                      <span className="text-[10px] font-bold text-white">
                        {Math.round(parcPct)}%
                      </span>
                    )}
                  </div>
                  <div
                    className="bg-red-500 transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${desfPct}%` }}
                  >
                    {desfPct > 10 && (
                      <span className="text-[10px] font-bold text-white">
                        {Math.round(desfPct)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-5 pt-4 border-t border-[#1a2332]">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span className="text-xs text-[#6b7a8d]">Favoravel</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-yellow-500" />
            <span className="text-xs text-[#6b7a8d]">Parcial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span className="text-xs text-[#6b7a8d]">Desfavoravel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
