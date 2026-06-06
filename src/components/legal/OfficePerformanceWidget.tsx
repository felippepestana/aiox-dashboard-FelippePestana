'use client';

// =============================================================================
// OfficePerformanceWidget — Donut chart + metric bars for office performance
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React, { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OfficeMetrics {
  casesWon: number;
  casesLost: number;
  casesSettled: number;
  avgDurationDays: number;
  revenue: number;           // in BRL cents
  clientSatisfaction: number; // 0–100
}

export interface OfficePerformanceWidgetProps {
  metrics: OfficeMetrics;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DONUT_SIZE   = 180;
const STROKE_WIDTH = 24;
const RADIUS       = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const SEGMENT_COLORS = {
  won:     '#D4AF37',
  lost:    '#F87171',
  settled: '#60A5FA',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRevenue(cents: number): string {
  const value = cents / 100;
  if (value >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
  }
  if (value >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(0)}k`;
  }
  return `R$ ${value.toFixed(0)}`;
}

function revenueMax(cents: number): number {
  // Round up to nearest order of magnitude for a clean bar
  const value = cents / 100;
  if (value <= 0) return 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)) + 1);
  return magnitude;
}

// ─── Donut Chart ─────────────────────────────────────────────────────────────

interface DonutChartProps {
  won: number;
  lost: number;
  settled: number;
  total: number;
}

function DonutChart({ won, lost, settled, total }: DonutChartProps) {
  const cx = DONUT_SIZE / 2;
  const cy = DONUT_SIZE / 2;

  // Each segment: calculate dasharray / dashoffset
  // We rotate the entire SVG so the first segment starts at the top (-90°)
  const segments = useMemo(() => {
    if (total === 0) return [];

    const items = [
      { count: won,     color: SEGMENT_COLORS.won     },
      { count: lost,    color: SEGMENT_COLORS.lost    },
      { count: settled, color: SEGMENT_COLORS.settled },
    ];

    let offset = 0;
    return items.map(({ count, color }) => {
      const fraction = count / total;
      const dash = fraction * CIRCUMFERENCE;
      // Gap between segments: 2px
      const gap = total > 1 ? 2 : 0;
      const dashArray = `${Math.max(dash - gap, 0)} ${CIRCUMFERENCE - Math.max(dash - gap, 0)}`;
      const dashOffset = CIRCUMFERENCE - offset;
      offset += dash;
      return { color, dashArray, dashOffset };
    });
  }, [won, lost, settled, total]);

  return (
    <svg
      width={DONUT_SIZE}
      height={DONUT_SIZE}
      viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
      role="img"
      aria-label="Distribuição de processos"
    >
      {/* Background track */}
      <circle
        cx={cx}
        cy={cy}
        r={RADIUS}
        fill="none"
        stroke="rgba(192,192,192,0.08)"
        strokeWidth={STROKE_WIDTH}
      />

      {total === 0 ? (
        // Empty state ring
        <circle
          cx={cx}
          cy={cy}
          r={RADIUS}
          fill="none"
          stroke="rgba(192,192,192,0.12)"
          strokeWidth={STROKE_WIDTH}
          strokeDasharray={`${CIRCUMFERENCE * 0.97} ${CIRCUMFERENCE * 0.03}`}
          strokeDashoffset={CIRCUMFERENCE / 4}
          strokeLinecap="round"
        />
      ) : (
        segments.map((seg, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={RADIUS}
            fill="none"
            stroke={seg.color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={seg.dashArray}
            strokeDashoffset={seg.dashOffset}
            strokeLinecap="butt"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        ))
      )}

      {/* Center text */}
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize="24"
        fontWeight="700"
        fontFamily="inherit"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 16}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#718096"
        fontSize="10"
        fontWeight="500"
        fontFamily="inherit"
        letterSpacing="0.05em"
      >
        PROCESSOS
      </text>
    </svg>
  );
}

// ─── Legend Item ──────────────────────────────────────────────────────────────

interface LegendItemProps {
  color: string;
  label: string;
  count: number;
  total: number;
}

function LegendItem({ color, label, count, total }: LegendItemProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <span className="text-[11px] text-[#A0AEC0]">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">{count}</span>
      <span className="text-[10px]" style={{ color: `${color}cc` }}>
        {pct}%
      </span>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

interface ProgressBarProps {
  label: string;
  value: string;
  fill: number;   // 0–100
  color: string;
}

function ProgressBar({ label, value, fill, color }: ProgressBarProps) {
  const clampedFill = Math.min(Math.max(fill, 0), 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-[#A0AEC0]">{label}</span>
        <span className="text-xs font-medium text-white">{value}</span>
      </div>
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height: 6, background: 'rgba(192,192,192,0.06)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${clampedFill}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function OfficePerformanceWidget({
  metrics,
  className,
}: OfficePerformanceWidgetProps) {
  const {
    casesWon,
    casesLost,
    casesSettled,
    avgDurationDays,
    revenue,
    clientSatisfaction,
  } = metrics;

  const total = casesWon + casesLost + casesSettled;

  // Progress bar fills
  const durationFill   = Math.min((avgDurationDays / 365) * 100, 100);
  const satFill        = Math.min(Math.max(clientSatisfaction, 0), 100);
  const revMax         = revenueMax(revenue);
  const revFill        = revenue > 0 ? Math.min((revenue / 100 / revMax) * 100, 100) : 0;

  return (
    <div
      className={cn(
        'bg-[#0d1f3c] rounded-xl border border-[rgba(192,192,192,0.10)] p-5',
        className
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp size={16} className="text-[#D4AF37]" />
        <span className="text-sm font-medium text-white">Performance do Escritório</span>
      </div>

      {/* ── Donut + Legend ── */}
      <div className="flex flex-col items-center gap-4 mb-6">
        <DonutChart
          won={casesWon}
          lost={casesLost}
          settled={casesSettled}
          total={total}
        />

        {/* Legend */}
        <div className="flex items-start justify-center gap-6">
          <LegendItem
            color={SEGMENT_COLORS.won}
            label="Ganhos"
            count={casesWon}
            total={total}
          />
          <LegendItem
            color={SEGMENT_COLORS.lost}
            label="Perdidos"
            count={casesLost}
            total={total}
          />
          <LegendItem
            color={SEGMENT_COLORS.settled}
            label="Acordos"
            count={casesSettled}
            total={total}
          />
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-px bg-[rgba(192,192,192,0.08)] mb-4" />

      {/* ── Progress Bars ── */}
      <div className="flex flex-col gap-4">
        <ProgressBar
          label="Tempo Médio"
          value={`${avgDurationDays} dias`}
          fill={durationFill}
          color="#D4AF37"
        />
        <ProgressBar
          label="Satisfação dos Clientes"
          value={`${Math.round(clientSatisfaction)}%`}
          fill={satFill}
          color="#4ADE80"
        />
        <ProgressBar
          label="Receita"
          value={formatRevenue(revenue)}
          fill={revFill}
          color="#D4AF37"
        />
      </div>
    </div>
  );
}

export default OfficePerformanceWidget;
