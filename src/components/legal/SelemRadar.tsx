'use client';

import React from 'react';

export interface SelemRadarProps {
  scores: { pillar: string; label: string; score: number }[];
  maxScore?: number;
}

export function SelemRadar({ scores, maxScore = 10 }: SelemRadarProps) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 120;
  const levels = 5;
  const n = scores.length || 5;

  function getPoint(index: number, value: number): { x: number; y: number } {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = (value / maxScore) * radius;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  function getLabelPoint(index: number): { x: number; y: number } {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const r = radius + 28;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  }

  // Build grid polygons for each level
  const gridPolygons = Array.from({ length: levels }, (_, levelIdx) => {
    const levelValue = ((levelIdx + 1) / levels) * maxScore;
    const points = Array.from({ length: n }, (_, i) => {
      const pt = getPoint(i, levelValue);
      return `${pt.x},${pt.y}`;
    }).join(' ');
    return points;
  });

  // Build data polygon
  const dataPoints = scores.map((s, i) => {
    const pt = getPoint(i, s.score);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  return (
    <div className="flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        {/* Grid polygons */}
        {gridPolygons.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="#1a2332"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {scores.map((_, i) => {
          const pt = getPoint(i, maxScore);
          return (
            <line
              key={`axis-${i}`}
              x1={cx}
              y1={cy}
              x2={pt.x}
              y2={pt.y}
              stroke="#1a2332"
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <polygon
          points={dataPoints}
          fill="rgba(245, 158, 11, 0.2)"
          stroke="#f59e0b"
          strokeWidth={2}
        />

        {/* Data points */}
        {scores.map((s, i) => {
          const pt = getPoint(i, s.score);
          return (
            <circle
              key={`dot-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill="#f59e0b"
              stroke="#0a0f1a"
              strokeWidth={2}
            />
          );
        })}

        {/* Labels */}
        {scores.map((s, i) => {
          const lp = getLabelPoint(i);
          return (
            <text
              key={`label-${i}`}
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-[#8899aa] text-[11px] font-medium"
            >
              {s.label}
            </text>
          );
        })}

        {/* Score values next to labels */}
        {scores.map((s, i) => {
          const lp = getLabelPoint(i);
          return (
            <text
              key={`score-${i}`}
              x={lp.x}
              y={lp.y + 14}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-amber-400 text-[12px] font-bold"
            >
              {s.score.toFixed(1)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
