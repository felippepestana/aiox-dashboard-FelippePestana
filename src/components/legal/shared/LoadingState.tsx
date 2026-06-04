'use client';

// =============================================================================
// LoadingState - Skeleton loading patterns for table, cards, and full page
// APEX Legal Design System — navy + silver + gold theme
// Uses the .skeleton utility from globals.css (pulse animation)
// =============================================================================

import React from 'react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LoadingStateProps {
  type: 'table' | 'cards' | 'page';
  /** Number of skeleton rows (table) or cards. Defaults: table=5, cards=4 */
  count?: number;
  className?: string;
}

// ─── Skeleton primitives ──────────────────────────────────────────────────────

function SkeletonBar({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={cn(
        'skeleton rounded',
        'bg-[rgba(192,192,192,0.08)]',
        className
      )}
      style={style}
      aria-hidden
    />
  );
}

// ─── Table skeleton ───────────────────────────────────────────────────────────

function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      className="rounded-xl border border-[rgba(192,192,192,0.10)] overflow-hidden"
      role="status"
      aria-label="Carregando tabela..."
    >
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-[rgba(192,192,192,0.10)] bg-[#0a1628]">
        {[40, 120, 100, 80, 60].map((w, i) => (
          <SkeletonBar key={i} className="h-3 rounded" style={{ width: w }} />
        ))}
      </div>

      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={cn(
            'flex items-center gap-4 px-4 py-3',
            'border-b border-[rgba(192,192,192,0.06)]',
            rowIdx % 2 === 0 ? 'bg-[#0d1f3c]' : 'bg-[#0a1628]'
          )}
        >
          {/* Vary widths per row for realism */}
          {[48, 130, 90, 70, 55].map((baseW, colIdx) => {
            const variance = ((rowIdx * 7 + colIdx * 13) % 30) - 15;
            return (
              <SkeletonBar
                key={colIdx}
                className="h-3 rounded"
                style={{ width: Math.max(30, baseW + variance) }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Cards skeleton ───────────────────────────────────────────────────────────

function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      role="status"
      aria-label="Carregando cards..."
    >
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-xl border border-[rgba(192,192,192,0.10)] bg-[#0d1f3c] p-5 flex flex-col gap-4"
        >
          {/* Icon + trend row */}
          <div className="flex items-start justify-between">
            <SkeletonBar className="h-10 w-10 rounded-lg" />
            <SkeletonBar className="h-4 w-14 rounded" />
          </div>
          {/* Value */}
          <SkeletonBar className="h-7 w-24 rounded" />
          {/* Label */}
          <SkeletonBar className="h-2.5 w-20 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Full-page skeleton ───────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-label="Carregando página..."
    >
      {/* Page header skeleton */}
      <div className="flex flex-col gap-3 pb-4 border-b border-[rgba(192,192,192,0.10)]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1">
          <SkeletonBar className="h-3 w-16 rounded" />
          <SkeletonBar className="h-3 w-2 rounded" />
          <SkeletonBar className="h-3 w-20 rounded" />
        </div>
        {/* Title + actions row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <SkeletonBar className="h-6 w-48 rounded" />
            <SkeletonBar className="h-4 w-28 rounded" />
          </div>
          <SkeletonBar className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* Stat cards */}
      <CardsSkeleton count={4} />

      {/* Filter bar */}
      <div className="rounded-xl border border-[rgba(192,192,192,0.10)] bg-[#0a1628] p-3">
        <div className="flex items-center gap-3">
          {[100, 120, 90, 140].map((w, i) => (
            <SkeletonBar key={i} className="h-9 rounded-md" style={{ width: w }} />
          ))}
        </div>
      </div>

      {/* Table */}
      <TableSkeleton rows={5} />
    </div>
  );
}

// ─── LoadingState ─────────────────────────────────────────────────────────────

export function LoadingState({ type, count, className }: LoadingStateProps) {
  return (
    <div className={className}>
      {type === 'table' && <TableSkeleton rows={count ?? 5} />}
      {type === 'cards' && <CardsSkeleton count={count ?? 4} />}
      {type === 'page' && <PageSkeleton />}
    </div>
  );
}
