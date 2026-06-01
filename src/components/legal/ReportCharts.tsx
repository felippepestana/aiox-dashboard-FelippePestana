'use client';

// =============================================================================
// ReportCharts - Pure SVG chart components for AIOX Legal reporting
// No external chart libraries. All values in raw numbers (not cents).
// =============================================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatBRLShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}R$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}R$${(abs / 1_000).toFixed(0)}k`;
  return `${sign}R$${abs.toFixed(0)}`;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

export interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  trendPositive?: boolean; // if true, up=green; if false, up=red (e.g. expenses)
  accentColor?: string;
  icon?: React.ReactNode;
  target?: string;
  progressPct?: number; // 0-100
}

export function MetricCard({
  label,
  value,
  subValue,
  trend = 'flat',
  trendLabel,
  trendPositive = true,
  accentColor = '#f59e0b',
  icon,
  target,
  progressPct,
}: MetricCardProps) {
  const trendColor =
    trend === 'flat'
      ? '#6b7a8d'
      : trendPositive
      ? trend === 'up'
        ? '#22c55e'
        : '#ef4444'
      : trend === 'up'
      ? '#ef4444'
      : '#22c55e';

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${accentColor}1a` }}
        >
          {icon ?? (
            <div className="h-5 w-5 rounded-full" style={{ backgroundColor: accentColor }} />
          )}
        </div>
        {trend !== 'flat' && (
          <div className="flex items-center gap-1" style={{ color: trendColor }}>
            <TrendIcon size={14} />
            {trendLabel && <span className="text-xs font-medium">{trendLabel}</span>}
          </div>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-white leading-tight">{value}</p>
        {subValue && <p className="text-xs text-[#6b7a8d] mt-0.5">{subValue}</p>}
        <p className="text-xs text-[#6b7a8d] mt-1 uppercase tracking-wider">{label}</p>
      </div>

      {(target !== undefined || progressPct !== undefined) && (
        <div>
          {target && (
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[#6b7a8d]">Meta: {target}</span>
              {progressPct !== undefined && (
                <span
                  className="font-medium"
                  style={{
                    color:
                      progressPct >= 80
                        ? '#22c55e'
                        : progressPct >= 60
                        ? '#f59e0b'
                        : '#ef4444',
                  }}
                >
                  {progressPct.toFixed(0)}%
                </span>
              )}
            </div>
          )}
          {progressPct !== undefined && (
            <div className="h-1.5 rounded-full bg-[#1a2332]">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, progressPct)}%`,
                  backgroundColor:
                    progressPct >= 80 ? '#22c55e' : progressPct >= 60 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── BarChart ─────────────────────────────────────────────────────────────────

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
  formatValue?: (v: number) => string;
}

export interface BarChartProps {
  data: BarChartItem[];
  orientation?: 'vertical' | 'horizontal';
  height?: number;
  currency?: boolean;
  title?: string;
  emptyText?: string;
  maxItems?: number;
}

export function BarChart({
  data,
  orientation = 'vertical',
  height = 200,
  currency = false,
  title,
  emptyText = 'Sem dados disponíveis',
  maxItems,
}: BarChartProps) {
  const items = maxItems ? data.slice(0, maxItems) : data;
  const maxValue = Math.max(...items.map((d) => d.value), 1);

  const fmt = (v: number) =>
    currency ? formatBRLShort(v) : v.toLocaleString('pt-BR');

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-xs text-[#4a5568]">{emptyText}</p>
      </div>
    );
  }

  if (orientation === 'horizontal') {
    return (
      <div>
        {title && <p className="text-xs font-semibold text-[#6b7a8d] mb-3 uppercase tracking-wider">{title}</p>}
        <div className="space-y-2.5">
          {items.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#8899aa] truncate max-w-[55%]">{item.label}</span>
                <span className="text-white font-medium ml-2 flex-shrink-0">{fmt(item.value)}</span>
              </div>
              <div className="h-3 rounded-full bg-[#1a2332]">
                <div
                  className="h-3 rounded-full transition-all duration-700"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.color || '#f59e0b',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vertical bar chart using SVG
  const PAD = { top: 20, right: 8, bottom: 36, left: 40 };
  const VW = 600;
  const VH = height;
  const chartW = VW - PAD.left - PAD.right;
  const chartH = VH - PAD.top - PAD.bottom;
  const barW = Math.max(8, (chartW / items.length) * 0.6);
  const gap = chartW / items.length;

  const yTicks = 4;
  const tickValues = Array.from({ length: yTicks + 1 }, (_, i) => (maxValue / yTicks) * i);

  return (
    <div>
      {title && <p className="text-xs font-semibold text-[#6b7a8d] mb-2 uppercase tracking-wider">{title}</p>}
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height }}>
        {/* Y-axis grid + labels */}
        {tickValues.map((v) => {
          const y = PAD.top + ((maxValue - v) / maxValue) * chartH;
          return (
            <g key={v}>
              <line
                x1={PAD.left}
                x2={PAD.left + chartW}
                y1={y}
                y2={y}
                stroke="#1a2332"
                strokeWidth="1"
              />
              <text x={PAD.left - 4} y={y + 4} textAnchor="end" fill="#6b7a8d" fontSize="9">
                {fmt(v)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {items.map((item, idx) => {
          const barH = Math.max(2, (item.value / maxValue) * chartH);
          const x = PAD.left + idx * gap + gap / 2 - barW / 2;
          const y = PAD.top + chartH - barH;
          return (
            <g key={idx}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="3"
                fill={item.color || '#f59e0b'}
                opacity="0.9"
              />
              {/* Value label above bar */}
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="8"
              >
                {fmt(item.value)}
              </text>
              {/* X-axis label */}
              <text
                x={x + barW / 2}
                y={PAD.top + chartH + 14}
                textAnchor="middle"
                fill="#6b7a8d"
                fontSize="9"
              >
                {item.label.length > 5 ? item.label.slice(0, 5) : item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── PieChart (donut) ─────────────────────────────────────────────────────────

export interface PieChartItem {
  label: string;
  value: number;
  color: string;
}

export interface PieChartProps {
  data: PieChartItem[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  showLegend?: boolean;
  title?: string;
  emptyText?: string;
}

export function PieChart({
  data,
  size = 140,
  centerLabel,
  centerValue,
  showLegend = true,
  title,
  emptyText = 'Sem dados',
}: PieChartProps) {
  const nonZero = data.filter((d) => d.value > 0);
  const total = nonZero.reduce((s, d) => s + d.value, 0);

  if (nonZero.length === 0 || total === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <p className="text-xs text-[#4a5568]">{emptyText}</p>
      </div>
    );
  }

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.55; // donut hole

  // Build arc paths
  let cumAngle = -Math.PI / 2; // start at top
  const arcs = nonZero.map((item) => {
    const angle = (item.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const x1 = cx + outerR * Math.cos(startAngle);
    const y1 = cy + outerR * Math.sin(startAngle);
    const x2 = cx + outerR * Math.cos(endAngle);
    const y2 = cy + outerR * Math.sin(endAngle);
    const ix1 = cx + innerR * Math.cos(endAngle);
    const iy1 = cy + innerR * Math.sin(endAngle);
    const ix2 = cx + innerR * Math.cos(startAngle);
    const iy2 = cy + innerR * Math.sin(startAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${x1} ${y1}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix1} ${iy1}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
      'Z',
    ].join(' ');

    return { ...item, path, pct: ((item.value / total) * 100).toFixed(1) };
  });

  return (
    <div className={showLegend ? 'flex items-center gap-4' : undefined}>
      <div className="relative flex-shrink-0">
        {title && (
          <p className="text-xs font-semibold text-[#6b7a8d] mb-2 uppercase tracking-wider">{title}</p>
        )}
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {arcs.map((arc, i) => (
            <path key={i} d={arc.path} fill={arc.color} opacity="0.9" />
          ))}
          {/* Center text */}
          {centerValue && (
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              fill="white"
              fontSize={size > 120 ? 16 : 12}
              fontWeight="bold"
            >
              {centerValue}
            </text>
          )}
          {centerLabel && (
            <text
              x={cx}
              y={cy + (centerValue ? 14 : 4)}
              textAnchor="middle"
              fill="#6b7a8d"
              fontSize="9"
            >
              {centerLabel}
            </text>
          )}
        </svg>
      </div>

      {showLegend && (
        <div className="space-y-1.5 flex-1 min-w-0">
          {arcs.map((arc, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: arc.color }}
              />
              <span className="text-xs text-[#8899aa] truncate flex-1">{arc.label}</span>
              <span className="text-xs font-medium text-white flex-shrink-0">{arc.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── LineChart ────────────────────────────────────────────────────────────────

export interface LineChartSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
  dashed?: boolean;
}

export interface LineChartProps {
  labels: string[]; // x-axis labels (same length as each series.values)
  series: LineChartSeries[];
  height?: number;
  currency?: boolean;
  title?: string;
  showLegend?: boolean;
  emptyText?: string;
}

export function LineChart({
  labels,
  series,
  height = 200,
  currency = false,
  title,
  showLegend = true,
  emptyText = 'Sem dados disponíveis',
}: LineChartProps) {
  if (labels.length === 0 || series.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-xs text-[#4a5568]">{emptyText}</p>
      </div>
    );
  }

  const PAD = { top: 20, right: 16, bottom: 32, left: 52 };
  const VW = 700;
  const VH = height;
  const chartW = VW - PAD.left - PAD.right;
  const chartH = VH - PAD.top - PAD.bottom;

  const allValues = series.flatMap((s) => s.values);
  const rawMin = Math.min(...allValues);
  const rawMax = Math.max(...allValues);
  const padding = (rawMax - rawMin) * 0.12 || 100;
  const yMin = Math.min(rawMin - padding, 0);
  const yMax = rawMax + padding;
  const yRange = yMax - yMin || 1;

  const xOf = (i: number) =>
    PAD.left + (labels.length <= 1 ? chartW / 2 : (i / (labels.length - 1)) * chartW);
  const yOf = (v: number) => PAD.top + ((yMax - v) / yRange) * chartH;

  const TICKS = 4;
  const tickValues = Array.from(
    { length: TICKS + 1 },
    (_, i) => yMin + (yRange / TICKS) * i
  );

  const fmt = (v: number) =>
    currency ? formatBRLShort(v) : v.toLocaleString('pt-BR');

  return (
    <div>
      {title && <p className="text-xs font-semibold text-[#6b7a8d] mb-2 uppercase tracking-wider">{title}</p>}
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height }}>
        {/* Grid + Y labels */}
        {tickValues.map((v) => (
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
              x={PAD.left - 5}
              y={yOf(v) + 4}
              textAnchor="end"
              fill="#6b7a8d"
              fontSize="9"
            >
              {fmt(v)}
            </text>
          </g>
        ))}

        {/* Zero line */}
        {yMin < 0 && yMax > 0 && (
          <line
            x1={PAD.left}
            x2={PAD.left + chartW}
            y1={yOf(0)}
            y2={yOf(0)}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
        )}

        {/* Series */}
        {series.map((s) => {
          const points = s.values.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ');
          return (
            <g key={s.key}>
              <polyline
                points={points}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeDasharray={s.dashed ? '6 3' : undefined}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Dots */}
              {s.values.map((v, i) => (
                <circle
                  key={i}
                  cx={xOf(i)}
                  cy={yOf(v)}
                  r="3"
                  fill={s.color}
                  opacity="0.8"
                />
              ))}
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.map((lbl, i) => {
          const step = labels.length <= 7 ? 1 : labels.length <= 12 ? 2 : 3;
          if (i % step !== 0 && i !== labels.length - 1) return null;
          return (
            <text
              key={i}
              x={xOf(i)}
              y={PAD.top + chartH + 16}
              textAnchor="middle"
              fill="#6b7a8d"
              fontSize="9"
            >
              {lbl}
            </text>
          );
        })}
      </svg>

      {showLegend && (
        <div className="flex flex-wrap gap-4 mt-2">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div
                className={`h-0.5 w-5 rounded-full ${s.dashed ? 'opacity-60' : ''}`}
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs text-[#6b7a8d]">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ComplianceBar (specialized for deadline rate) ────────────────────────────

export interface ComplianceBarProps {
  data: { month: string; rate: number; met: number; missed: number; total: number }[];
  height?: number;
}

export function ComplianceBar({ data, height = 160 }: ComplianceBarProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-xs text-[#4a5568]">Sem dados de prazos</p>
      </div>
    );
  }

  const PAD = { top: 24, right: 8, bottom: 32, left: 36 };
  const VW = 600;
  const VH = height;
  const chartW = VW - PAD.left - PAD.right;
  const chartH = VH - PAD.top - PAD.bottom;
  const gap = chartW / data.length;
  const barW = Math.max(8, gap * 0.55);

  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height }}>
      {/* Y-axis ticks at 0, 50, 100 */}
      {[0, 50, 100].map((v) => {
        const y = PAD.top + ((100 - v) / 100) * chartH;
        return (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={PAD.left + chartW}
              y1={y}
              y2={y}
              stroke="#1a2332"
              strokeWidth="1"
            />
            <text x={PAD.left - 4} y={y + 4} textAnchor="end" fill="#6b7a8d" fontSize="9">
              {v}%
            </text>
          </g>
        );
      })}

      {data.map((item, idx) => {
        const rate = Math.min(100, item.rate);
        const barH = Math.max(2, (rate / 100) * chartH);
        const x = PAD.left + idx * gap + gap / 2 - barW / 2;
        const y = PAD.top + chartH - barH;
        const color = rate >= 80 ? '#22c55e' : rate >= 60 ? '#f59e0b' : '#ef4444';

        return (
          <g key={idx}>
            {/* Background bar */}
            <rect
              x={x}
              y={PAD.top}
              width={barW}
              height={chartH}
              rx="3"
              fill="#1a2332"
              opacity="0.5"
            />
            {/* Rate bar */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx="3"
              fill={color}
              opacity="0.85"
            />
            {/* Rate label above */}
            {item.total > 0 && (
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                fill={color}
                fontSize="8"
                fontWeight="bold"
              >
                {rate.toFixed(0)}%
              </text>
            )}
            {/* Month label */}
            <text
              x={x + barW / 2}
              y={PAD.top + chartH + 14}
              textAnchor="middle"
              fill="#6b7a8d"
              fontSize="9"
            >
              {item.month}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
