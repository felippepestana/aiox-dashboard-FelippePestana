'use client';

import React, { useState, useRef, useCallback } from 'react';
import type { MonthlyPoint, MonthlyProjection } from '@/lib/cash-flow-forecast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TooltipState {
  x: number;
  y: number;
  point: MonthlyPoint;
}

interface CashFlowChartProps {
  data: MonthlyPoint[];
  height?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatBRLShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}R$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}R$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}R$${abs.toFixed(0)}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CashFlowChart({ data, height = 320 }: CashFlowChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const PAD = { top: 24, right: 24, bottom: 40, left: 64 };

  // Use a viewBox approach — layout is computed relative to 800 wide
  const VW = 800;
  const VH = height;
  const chartW = VW - PAD.left - PAD.right;
  const chartH = VH - PAD.top - PAD.bottom;

  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320]"
        style={{ height }}
      >
        <p className="text-sm text-[#6b7a8d]">Sem dados para exibir</p>
      </div>
    );
  }

  // Compute value range across income, expenses, balance (optimistic/pessimistic too)
  const allValues: number[] = [];
  for (const p of data) {
    allValues.push(p.income, p.expenses, p.balance);
    if (p.isProjected) {
      allValues.push(
        p.incomeOptimistic,
        p.incomesPessimistic,
        p.balanceOptimistic,
        p.balancePessimistic,
      );
    }
  }
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const padding = (rawMax - rawMin) * 0.1 || 1000;
  const yMin = rawMin - padding;
  const yMax = rawMax + padding;
  const yRange = yMax - yMin;

  // Coordinate mappers
  const xOf = (index: number) => PAD.left + (index / (data.length - 1 || 1)) * chartW;
  const yOf = (value: number) => PAD.top + ((yMax - value) / yRange) * chartH;

  // Build polyline point strings
  function polyline(values: number[]): string {
    return values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ');
  }

  // Confidence shaded area for projections (income band)
  const projStart = data.findIndex((p) => p.isProjected);
  const projData = projStart >= 0 ? data.slice(projStart) : [];
  const projIndexOffset = projStart >= 0 ? projStart : 0;

  // Build confidence band polygon for balance
  let confidencePath = '';
  if (projData.length >= 1) {
    const top = projData
      .map((p, i) =>
        p.isProjected
          ? `${xOf(projIndexOffset + i)},${yOf(p.balanceOptimistic)}`
          : `${xOf(projIndexOffset + i)},${yOf(p.balance)}`,
      )
      .join(' ');
    const bottom = [...projData]
      .reverse()
      .map((p, ri) => {
        const i = projData.length - 1 - ri;
        return p.isProjected
          ? `${xOf(projIndexOffset + i)},${yOf(p.balancePessimistic)}`
          : `${xOf(projIndexOffset + i)},${yOf(p.balance)}`;
      })
      .join(' ');
    confidencePath = `${top} ${bottom}`;
  }

  // Zero line y position
  const zeroY = yOf(0);

  // Y-axis tick count
  const TICKS = 5;
  const yTicks = Array.from({ length: TICKS + 1 }, (_, i) =>
    yMin + (yRange / TICKS) * i,
  );

  // Mouse move handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const svgX = ((e.clientX - rect.left) / rect.width) * VW;
      const relX = svgX - PAD.left;
      if (relX < 0 || relX > chartW) {
        setTooltip(null);
        return;
      }
      const idx = Math.round((relX / chartW) * (data.length - 1));
      const safeIdx = Math.max(0, Math.min(idx, data.length - 1));
      const point = data[safeIdx];
      setTooltip({ x: xOf(safeIdx), y: e.clientY - rect.top, point });
    },
    [data, chartW, PAD.left, VW],
  );

  const handleMouseLeave = () => setTooltip(null);

  return (
    <div className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VW} ${VH}`}
        className="w-full"
        style={{ height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={PAD.left + chartW}
              y1={yOf(v)}
              y2={yOf(v)}
              stroke="#1a2332"
              strokeWidth="1"
            />
            <text
              x={PAD.left - 6}
              y={yOf(v) + 4}
              textAnchor="end"
              fill="#6b7a8d"
              fontSize="10"
            >
              {formatBRLShort(v)}
            </text>
          </g>
        ))}

        {/* Zero line */}
        {zeroY >= PAD.top && zeroY <= PAD.top + chartH && (
          <line
            x1={PAD.left}
            x2={PAD.left + chartW}
            y1={zeroY}
            y2={zeroY}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        )}

        {/* Projected region shading */}
        {projStart >= 0 && (
          <rect
            x={xOf(projStart)}
            y={PAD.top}
            width={xOf(data.length - 1) - xOf(projStart)}
            height={chartH}
            fill="#1a2332"
            fillOpacity="0.35"
          />
        )}

        {/* Projected separator line */}
        {projStart >= 0 && (
          <line
            x1={xOf(projStart)}
            x2={xOf(projStart)}
            y1={PAD.top}
            y2={PAD.top + chartH}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        )}

        {/* Confidence band polygon (balance ±15%) */}
        {confidencePath && (
          <polygon
            points={confidencePath}
            fill="#3b82f6"
            fillOpacity="0.08"
          />
        )}

        {/* Income line — green */}
        <polyline
          points={polyline(data.map((p) => p.income))}
          fill="none"
          stroke="#22c55e"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Projected income dashed extension */}
        {projData.length > 0 && (
          <polyline
            points={polyline(
              data.map((p, i) =>
                i >= projIndexOffset ? p.income : NaN,
              ).filter((v) => !isNaN(v)),
            )}
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeDasharray="6 3"
            strokeLinejoin="round"
          />
        )}

        {/* Expense line — red */}
        <polyline
          points={polyline(data.map((p) => p.expenses))}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Balance line — blue */}
        <polyline
          points={polyline(data.map((p) => p.balance))}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Data point dots */}
        {data.map((p, i) => (
          <g key={p.monthKey}>
            {/* Balance dot */}
            <circle
              cx={xOf(i)}
              cy={yOf(p.balance)}
              r={tooltip?.point.monthKey === p.monthKey ? 5 : 3}
              fill={p.isProjected ? '#1e3a5f' : '#3b82f6'}
              stroke="#3b82f6"
              strokeWidth="1.5"
            />
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((p, i) => {
          // Show every label if <= 7 points, else every 2nd or 3rd
          const step = data.length <= 7 ? 1 : data.length <= 12 ? 2 : 3;
          if (i % step !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={p.monthKey}
              x={xOf(i)}
              y={PAD.top + chartH + 20}
              textAnchor="middle"
              fill={p.isProjected ? '#6b7a8d' : '#9ca3af'}
              fontSize="10"
              fontStyle={p.isProjected ? 'italic' : 'normal'}
            >
              {p.label}
            </text>
          );
        })}

        {/* Tooltip vertical hairline */}
        {tooltip && (
          <line
            x1={tooltip.x}
            x2={tooltip.x}
            y1={PAD.top}
            y2={PAD.top + chartH}
            stroke="#4b5563"
            strokeWidth="1"
            strokeDasharray="3 2"
          />
        )}
      </svg>

      {/* Tooltip overlay */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 min-w-[180px] rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3 shadow-xl text-xs"
          style={{
            left: Math.min(tooltip.x * (100 / VW), 70) + '%',
            top: '8px',
          }}
        >
          <p className="font-semibold text-white mb-2 border-b border-[#1a2332] pb-1 flex items-center gap-1.5">
            {tooltip.point.label}
            {tooltip.point.isProjected && (
              <span className="text-[10px] text-[#6b7a8d] font-normal">(projeção)</span>
            )}
          </p>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-green-400">Receita</span>
              <span className="text-white font-medium">{formatBRL(tooltip.point.income)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-red-400">Despesas</span>
              <span className="text-white font-medium">{formatBRL(tooltip.point.expenses)}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-[#1a2332]">
              <span className="text-blue-400">Saldo Mês</span>
              <span
                className={`font-semibold ${
                  tooltip.point.balance >= 0 ? 'text-blue-400' : 'text-red-400'
                }`}
              >
                {formatBRL(tooltip.point.balance)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[#6b7a8d]">Acumulado</span>
              <span
                className={`font-medium ${
                  tooltip.point.cumulative >= 0 ? 'text-white' : 'text-red-400'
                }`}
              >
                {formatBRL(tooltip.point.cumulative)}
              </span>
            </div>
            {tooltip.point.isProjected && (
              <>
                <div className="pt-1 border-t border-[#1a2332] text-[10px] text-[#6b7a8d]">
                  Intervalo de confiança (±15%)
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-emerald-400 text-[10px]">Otimista</span>
                  <span className="text-emerald-400 font-medium text-[10px]">
                    {formatBRL(tooltip.point.balanceOptimistic)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-orange-400 text-[10px]">Pessimista</span>
                  <span className="text-orange-400 font-medium text-[10px]">
                    {formatBRL(tooltip.point.balancePessimistic)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 px-1">
        <LegendItem color="#22c55e" label="Receita" />
        <LegendItem color="#ef4444" label="Despesas" />
        <LegendItem color="#3b82f6" label="Saldo Mensal" />
        <div className="flex items-center gap-1.5 ml-auto">
          <div className="w-6 h-3 rounded bg-[#1a2332] opacity-70" />
          <span className="text-[10px] text-[#6b7a8d]">Projeção</span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-5 h-0.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-[10px] text-[#6b7a8d]">{label}</span>
    </div>
  );
}
