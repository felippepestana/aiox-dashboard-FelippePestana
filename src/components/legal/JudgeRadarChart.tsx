'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface JudgeProfile {
  favorReu: number;
  favorAutor: number;
  acordos: number;
  sentencas: number;
  tempoMedio: number;
  reformas: number;
}

export interface JudgeRadarChartProps {
  judgeData: JudgeProfile;
  judgeName?: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const AXES = [
  { key: 'favorReu', label: 'Favor Reu', shortLabel: 'Reu' },
  { key: 'favorAutor', label: 'Favor Autor', shortLabel: 'Autor' },
  { key: 'acordos', label: 'Acordos', shortLabel: 'Acordos' },
  { key: 'sentencas', label: 'Sentencas', shortLabel: 'Sent.' },
  { key: 'tempoMedio', label: 'Tempo Medio', shortLabel: 'Tempo' },
  { key: 'reformas', label: 'Reformas', shortLabel: 'Ref.' },
] as const;

const CENTER = 150;
const MAX_RADIUS = 100;
const LEVELS = 5;
const GOLD = '#D4AF37';
const GRID_COLOR = 'rgba(192,192,192,0.08)';

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function polarToCartesian(angle: number, radius: number): { x: number; y: number } {
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  };
}

function getPolygonPoints(values: number[]): string {
  return values
    .map((value, i) => {
      const angle = (360 / values.length) * i;
      const radius = (value / 100) * MAX_RADIUS;
      const { x, y } = polarToCartesian(angle, radius);
      return `${x},${y}`;
    })
    .join(' ');
}

// =============================================================================
// COMPONENT
// =============================================================================

export function JudgeRadarChart({ judgeData, judgeName }: JudgeRadarChartProps) {
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);

  const values = AXES.map((axis) => judgeData[axis.key as keyof JudgeProfile]);

  return (
    <div className="bg-[#0d1f3c] border border-[rgba(192,192,192,0.10)] rounded-xl p-5">
      {judgeName && (
        <h3 className="text-sm font-medium text-white mb-4 text-center">
          Perfil Decisorio - {judgeName}
        </h3>
      )}

      {/* SVG Radar Chart */}
      <div className="flex justify-center mb-4">
        <svg
          viewBox="0 0 300 300"
          className="w-full max-w-[280px] md:max-w-[400px]"
        >
          {/* Grid levels (hexagons) */}
          {Array.from({ length: LEVELS }).map((_, levelIdx) => {
            const radius = ((levelIdx + 1) / LEVELS) * MAX_RADIUS;
            const points = AXES.map((_, i) => {
              const angle = (360 / AXES.length) * i;
              const { x, y } = polarToCartesian(angle, radius);
              return `${x},${y}`;
            }).join(' ');

            return (
              <polygon
                key={levelIdx}
                points={points}
                fill="none"
                stroke={GRID_COLOR}
                strokeWidth="1"
              />
            );
          })}

          {/* Axis lines */}
          {AXES.map((_, i) => {
            const angle = (360 / AXES.length) * i;
            const { x, y } = polarToCartesian(angle, MAX_RADIUS);

            return (
              <line
                key={i}
                x1={CENTER}
                y1={CENTER}
                x2={x}
                y2={y}
                stroke={GRID_COLOR}
                strokeWidth="1"
              />
            );
          })}

          {/* Data polygon */}
          <polygon
            points={getPolygonPoints(values)}
            fill="rgba(212,175,55,0.15)"
            stroke={GOLD}
            strokeWidth="2"
          />

          {/* Data points */}
          {values.map((value, i) => {
            const angle = (360 / AXES.length) * i;
            const radius = (value / 100) * MAX_RADIUS;
            const { x, y } = polarToCartesian(angle, radius);
            const axis = AXES[i];
            const isHovered = hoveredAxis === axis.key;

            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 6 : 4}
                  fill={GOLD}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={() => setHoveredAxis(axis.key)}
                  onMouseLeave={() => setHoveredAxis(null)}
                />

                {/* Tooltip on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={x - 25}
                      y={y - 28}
                      width="50"
                      height="20"
                      rx="4"
                      fill="#0d1f3c"
                      stroke={GOLD}
                      strokeWidth="1"
                    />
                    <text
                      x={x}
                      y={y - 14}
                      textAnchor="middle"
                      className="text-[11px] font-medium fill-white"
                    >
                      {value}%
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Axis labels */}
          {AXES.map((axis, i) => {
            const angle = (360 / AXES.length) * i;
            const { x, y } = polarToCartesian(angle, MAX_RADIUS + 20);

            return (
              <text
                key={axis.key}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-[10px] fill-[#718096]"
              >
                {axis.shortLabel}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2">
        {AXES.map((axis) => {
          const value = judgeData[axis.key as keyof JudgeProfile];
          const isHovered = hoveredAxis === axis.key;

          return (
            <div
              key={axis.key}
              className={cn(
                'px-2 py-1.5 rounded border transition-all duration-150 cursor-pointer',
                isHovered
                  ? 'bg-[rgba(212,175,55,0.08)] border-[rgba(212,175,55,0.25)]'
                  : 'bg-[#0a1628] border-[rgba(192,192,192,0.06)]'
              )}
              onMouseEnter={() => setHoveredAxis(axis.key)}
              onMouseLeave={() => setHoveredAxis(null)}
            >
              <p className="text-[10px] text-[#718096] mb-0.5">{axis.label}</p>
              <p className="text-sm font-medium text-white">{value}%</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
