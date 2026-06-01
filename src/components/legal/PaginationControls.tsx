'use client';

// =============================================================================
// PaginationControls - Reusable pagination UI
// Page buttons with ellipsis, prev/next, page-size selector, result count
// =============================================================================

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ───────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  /** Compact layout: hides result text and compresses buttons (mobile). */
  compact?: boolean;
  /** Additional class applied to the root element. */
  className?: string;
  /** Show first/last page jump buttons (default: true). */
  showJump?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build the list of page buttons to render.
 * Uses ellipsis ("...") when the range is large.
 *
 * Examples:
 *   totalPages=5, page=3 → [1,2,3,4,5]
 *   totalPages=10, page=5 → [1,'...',4,5,6,'...',10]
 *   totalPages=10, page=1 → [1,2,3,'...',10]
 */
function buildPageItems(page: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const items: (number | '...')[] = [];
  const delta = 1; // pages around current page

  // Always show first page
  items.push(1);

  const rangeStart = Math.max(2, page - delta);
  const rangeEnd = Math.min(totalPages - 1, page + delta);

  if (rangeStart > 2) items.push('...');

  for (let i = rangeStart; i <= rangeEnd; i++) {
    items.push(i);
  }

  if (rangeEnd < totalPages - 1) items.push('...');

  // Always show last page
  items.push(totalPages);

  return items;
}

/** Human-readable result range: "Mostrando 21-40 de 150 resultados" */
function formatRange(page: number, pageSize: number, total: number): string {
  if (total === 0) return 'Nenhum resultado';
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return `Mostrando ${from}-${to} de ${total} resultado${total !== 1 ? 's' : ''}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PaginationControls({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  compact = false,
  className,
  showJump = true,
}: PaginationControlsProps) {
  if (totalPages <= 1 && total <= pageSize) return null;

  const pageItems = buildPageItems(page, totalPages);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between',
        compact && 'gap-1',
        className
      )}
    >
      {/* Result count text */}
      {!compact && (
        <p className="text-xs text-muted-foreground shrink-0">
          {formatRange(page, pageSize, total)}
        </p>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-1 flex-wrap">
        {/* Jump to first */}
        {showJump && !compact && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(1)}
            disabled={!canPrev}
            aria-label="Primeira pagina"
            title="Primeira pagina"
          >
            <ChevronsLeft />
          </Button>
        )}

        {/* Previous */}
        <Button
          variant="outline"
          size={compact ? 'icon-xs' : 'icon-sm'}
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
          aria-label="Pagina anterior"
          title="Pagina anterior"
        >
          <ChevronLeft />
        </Button>

        {/* Page number buttons */}
        {!compact &&
          pageItems.map((item, idx) => {
            if (item === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-xs text-muted-foreground select-none"
                  aria-hidden
                >
                  ...
                </span>
              );
            }
            const isActive = item === page;
            return (
              <Button
                key={item}
                variant={isActive ? 'default' : 'outline'}
                size="icon-sm"
                onClick={() => onPageChange(item)}
                aria-label={`Pagina ${item}`}
                aria-current={isActive ? 'page' : undefined}
                className={cn('min-w-[32px] text-xs', isActive && 'font-semibold')}
              >
                {item}
              </Button>
            );
          })}

        {/* Compact: just show "page / total" */}
        {compact && (
          <span className="px-2 text-xs text-muted-foreground select-none whitespace-nowrap">
            {page} / {totalPages}
          </span>
        )}

        {/* Next */}
        <Button
          variant="outline"
          size={compact ? 'icon-xs' : 'icon-sm'}
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
          aria-label="Proxima pagina"
          title="Proxima pagina"
        >
          <ChevronRight />
        </Button>

        {/* Jump to last */}
        {showJump && !compact && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => onPageChange(totalPages)}
            disabled={!canNext}
            aria-label="Ultima pagina"
            title="Ultima pagina"
          >
            <ChevronsRight />
          </Button>
        )}

        {/* Page size selector */}
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={cn(
              'ml-2 h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground',
              'focus:outline-none focus:ring-1 focus:ring-ring',
              compact && 'h-6 ml-1'
            )}
            aria-label="Itens por pagina"
            title="Itens por pagina"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s} / pag
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Compact result count (below buttons on very small screens) */}
      {compact && total > 0 && (
        <p className="text-[10px] text-muted-foreground">
          {formatRange(page, pageSize, total)}
        </p>
      )}
    </div>
  );
}

