'use client';

// =============================================================================
// StatCardGrid - Responsive grid of stat cards
// APEX Legal Design System — navy + silver + gold theme
// Uses MetricCard concept from ReportCharts.tsx, generalized for any stat
// =============================================================================

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StatCardItem {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  /** 'up' | 'down' | 'flat' */
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  /**
   * When true: up = positive (green / gold), down = negative (red).
   * When false: up = negative (e.g. cost increase). Defaults to true.
   */
  trendPositive?: boolean;
  /**
   * Tailwind-compatible CSS color string for the icon background tint.
   * Defaults to gold accent.
   */
  color?: string;
}

export interface StatCardGridProps {
  cards: StatCardItem[];
  className?: string;
}

// ─── Single Card ──────────────────────────────────────────────────────────────

interface StatCardProps {
  card: StatCardItem;
}

function StatCard({ card }: StatCardProps) {
  const {
    label,
    value,
    icon,
    trend = 'flat',
    trendLabel,
    trendPositive = true,
    color = '#D4AF37',
  } = card;

  // Determine trend color
  let trendColor: string;
  if (trend === 'flat') {
    trendColor = '#718096';
  } else if (trendPositive) {
    trendColor = trend === 'up' ? '#4ADE80' : '#F87171';
  } else {
    trendColor = trend === 'up' ? '#F87171' : '#4ADE80';
  }

  // Whether the trend is semantically positive for gold accent
  const isPositiveTrend =
    trend !== 'flat' && (trendPositive ? trend === 'up' : trend === 'down');

  const TrendIcon =
    trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        'rounded-xl border border-[rgba(192,192,192,0.10)] bg-[#0d1f3c]',
        'p-5 flex flex-col gap-3',
        'transition-all duration-300',
        'hover:border-[rgba(192,192,192,0.20)] hover:bg-[#121f36]',
        'hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)]'
      )}
    >
      {/* Top row: icon + trend */}
      <div className="flex items-start justify-between">
        {icon ? (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${color}1a` }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
        ) : (
          <div
            className="h-10 w-10 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${color}1a` }}
          />
        )}

        {trend !== 'flat' && (
          <div
            className="flex items-center gap-1"
            style={{ color: trendColor }}
            aria-label={`Tendência: ${trendLabel ?? trend}`}
          >
            <TrendIcon size={14} />
            {trendLabel && (
              <span
                className="text-xs font-semibold"
                style={{ color: isPositiveTrend ? '#D4AF37' : trendColor }}
              >
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Value + label */}
      <div>
        <p className="text-2xl font-bold text-white leading-tight">
          {value}
        </p>
        <p className="text-xs text-[#718096] mt-1 uppercase tracking-wider font-medium">
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

export function StatCardGrid({ cards, className }: StatCardGridProps) {
  if (!cards || cards.length === 0) return null;

  return (
    <div
      className={cn(
        'grid gap-4',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {cards.map((card, idx) => (
        <StatCard key={idx} card={card} />
      ))}
    </div>
  );
}
