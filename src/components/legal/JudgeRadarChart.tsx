'use client';

// =============================================================================
// JudgeRadarChart — SVG radar chart for judge decision profile visualization
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JudgeMetrics {
  favorReu: number;      // 0-100
  favorAutor: number;    // 0-100
  acordos: number;       // 0-100
  sentencas: number;     // 0-100
  tempoMedio: number;    // 0-100 (normalized)
  reformas: number;      // 0-100
}

export interface JudgeRadarChartProps {
  data: JudgeMetrics;
  judgeName?: string;
  className?: string;
}

// ─── Axis config ─────────────────────────────────────────────────────────────

const AXES: { key: keyof JudgeMetrics; label: string }[] = [
  { key: 'favorReu',    label: 'Favor Réu'    },
  { key: 'favorAutor',  label: 'Favor Autor'  },
  { key: 'acordos',     label: 'Acordos'      },
  { key: 'sentencas',   label: 'Sentenças'    },
  { key: 'tempoMedio',  label: 'Tempo Médio'  },
  { key: 'reformas',    label: 'Reformas'     },
];

const N_AXES    = AXES.length;   // 6 — hexagonal
const SVG_SIZE  = 280;
const CX        = SVG_SIZE / 2;
const CY        = SVG_SIZE / 2;
const RADIUS    = 98;
const LEVELS    = 5;
const LABEL_PAD = 26;

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function vertexAngle(i: number): number {
  // Start at the top (-π/2) and go clockwise
  return (Math.PI * 2 * i) / N_AXES - Math.PI / 2;
}

function polarToXY(r: number, angle: number): { x: number; y: number } {
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  };
}

function dataPoint(i: number, value: number): { x: number; y: number } {
  return polarToXY((value / 100) * RADIUS, vertexAngle(i));
}

function labelPoint(i: number): { x: number; y: number } {
  return polarToXY(RADIUS + LABEL_PAD, vertexAngle(i));
}

function levelPolygon(level: number): string {
  const r = (level / LEVELS) * RADIUS;
  return Array.from({ length: N_AXES }, (_, i) => {
    const { x, y } = polarToXY(r, vertexAngle(i));
    return `${x},${y}`;
  }).join(' ');
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function JudgeRadarChart({ data, judgeName, className }: JudgeRadarChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    label: '',
    value: 0,
  });

  const handlePointEnter = useCallback(
    (
      e: React.MouseEvent<SVGCircleElement>,
      label: string,
      value: number,
    ) => {
      const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement)
        .getBoundingClientRect();
      const cx = (e.currentTarget as SVGCircleElement).getBoundingClientRect();
      setTooltip({
        visible: true,
        x: cx.left - rect.left + cx.width / 2,
        y: cx.top  - rect.top  - 8,
        label,
        value,
      });
    },
    [],
  );

  const handlePointLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  // Build data polygon path
  const dataPolygonPoints = AXES.map((ax, i) =>
    dataPoint(i, data[ax.key]),
  )
    .map(({ x, y }) => `${x},${y}`)
    .join(' ');

  return (
    <div
      className={cn(
        'rounded-xl border border-[rgba(192,192,192,0.10)] bg-[#0d1f3c] p-5',
        className,
      )}
    >
      {/* Optional judge name header */}
      {judgeName && (
        <p className="text-sm font-medium text-white mb-3">{judgeName}</p>
      )}

      {/* SVG radar */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full overflow-visible"
          style={{ minWidth: 280, maxWidth: 400 }}
          aria-label={judgeName ? `Radar do juiz ${judgeName}` : 'Radar de decisões'}
        >
          {/* ── Grid polygons ──────────────────────────────────── */}
          {Array.from({ length: LEVELS }, (_, li) => (
            <polygon
              key={`grid-${li}`}
              points={levelPolygon(li + 1)}
              fill="none"
              stroke="rgba(192,192,192,0.08)"
              strokeWidth={1}
            />
          ))}

          {/* ── Axis lines ─────────────────────────────────────── */}
          {AXES.map((_, i) => {
            const { x, y } = polarToXY(RADIUS, vertexAngle(i));
            return (
              <line
                key={`axis-${i}`}
                x1={CX}
                y1={CY}
                x2={x}
                y2={y}
                stroke="rgba(192,192,192,0.06)"
                strokeWidth={1}
              />
            );
          })}

          {/* ── Labels ─────────────────────────────────────────── */}
          {AXES.map((ax, i) => {
            const { x, y } = labelPoint(i);
            return (
              <text
                key={`label-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fill="#718096"
              >
                {ax.label}
              </text>
            );
          })}

          {/* ── Data area ──────────────────────────────────────── */}
          <polygon
            points={dataPolygonPoints}
            fill="rgba(212,175,55,0.15)"
            stroke="#D4AF37"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />

          {/* ── Data points with hover ─────────────────────────── */}
          {AXES.map((ax, i) => {
            const { x, y } = dataPoint(i, data[ax.key]);
            return (
              <circle
                key={`dot-${i}`}
                cx={x}
                cy={y}
                r={4}
                fill="#D4AF37"
                className="cursor-pointer transition-all hover:r-[6] hover:opacity-90"
                onMouseEnter={(e) => handlePointEnter(e, ax.label, data[ax.key])}
                onMouseLeave={handlePointLeave}
              />
            );
          })}
        </svg>

        {/* ── Tooltip ──────────────────────────────────────────── */}
        {tooltip.visible && (
          <div
            className="pointer-events-none absolute z-50 whitespace-nowrap rounded-lg border border-[rgba(192,192,192,0.15)] bg-[#0a1628] px-2.5 py-1.5 shadow-lg"
            style={{
              left:      tooltip.x,
              top:       tooltip.y,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <span className="text-[10px] text-[#718096]">{tooltip.label}:&nbsp;</span>
            <span className="text-xs font-semibold text-[#D4AF37]">{tooltip.value}</span>
          </div>
        )}
      </div>

      {/* ── Legend / mini stat row ────────────────────────────── */}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
        {AXES.map((ax) => (
          <div key={ax.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full flex-shrink-0 bg-[#D4AF37]" />
            <span className="text-[10px] text-[#718096]">{ax.label}</span>
            <span className="text-xs font-medium text-white">{data[ax.key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
