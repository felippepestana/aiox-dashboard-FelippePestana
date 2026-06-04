'use client';

// =============================================================================
// DataTable - Shared searchable, sortable, paginated data table
// APEX Legal Design System — navy + silver + gold theme
// Uses useSearch hook and PaginationControls from the existing codebase
// =============================================================================

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSearch } from '@/hooks/useSearch';
import { PaginationControls } from '@/components/legal/PaginationControls';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  /** Custom renderer. Receives the row value for this column and the full row. */
  render?: (value: unknown, row: T) => React.ReactNode;
  /** Optional column header className */
  headerClassName?: string;
  /** Optional cell className */
  cellClassName?: string;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: ColumnDef<T>[];
  data: T[];
  /** Enable built-in search bar */
  searchable?: boolean;
  /** Fields to search (required when searchable=true) */
  searchFields?: (keyof T)[];
  /** Enable pagination */
  paginated?: boolean;
  /** Default page size (default: 20) */
  pageSize?: number;
  /** Called when a row is clicked */
  onRowClick?: (row: T) => void;
  /** Message shown when no rows exist */
  emptyMessage?: string;
  /** When set, renders an "Exportar" button (calls this fn) */
  onExport?: () => void;
  /** Label for export button (default: "Exportar") */
  exportLabel?: string;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getNestedValue(obj: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, k) => {
    if (acc !== null && acc !== undefined && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
}

function sortData<T extends Record<string, unknown>>(
  data: T[],
  key: string,
  direction: 'asc' | 'desc'
): T[] {
  return [...data].sort((a, b) => {
    const aVal = getNestedValue(a, key);
    const bVal = getNestedValue(b, key);

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    let cmp = 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal).localeCompare(String(bVal), 'pt-BR');
    }

    return direction === 'asc' ? cmp : -cmp;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = false,
  searchFields = [],
  paginated = false,
  pageSize: defaultPageSize = 20,
  onRowClick,
  emptyMessage = 'Nenhum registro encontrado.',
  onExport,
  exportLabel = 'Exportar',
  className,
}: DataTableProps<T>) {
  // ─── Sort state ─────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // ─── Pagination state ────────────────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // ─── Search ──────────────────────────────────────────────────────────────────
  const { query, setQuery, results: searchResults, isSearching } = useSearch<T>(
    data,
    searchFields.length > 0 ? searchFields : (columns.map((c) => c.key) as (keyof T)[]),
    { debounceMs: 250 }
  );

  // Use search results when searchable and query exists, else use full data
  const filteredData = searchable && query.trim().length >= 2 ? searchResults : data;

  // ─── Sort ────────────────────────────────────────────────────────────────────
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return sortData(filteredData, sortKey, sortDir);
  }, [filteredData, sortKey, sortDir]);

  // ─── Pagination ───────────────────────────────────────────────────────────────
  const total = sortedData.length;
  const totalPages = paginated ? Math.max(1, Math.ceil(total / pageSize)) : 1;
  const pagedData = paginated
    ? sortedData.slice((page - 1) * pageSize, page * pageSize)
    : sortedData;

  // Reset to page 1 when data / sort / search changes
  const stableResetPage = useCallback(() => setPage(1), []);
  React.useEffect(() => { stableResetPage(); }, [filteredData.length, sortKey, sortDir, stableResetPage]);

  // ─── Sort handler ─────────────────────────────────────────────────────────────
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Toolbar: search + export */}
      {(searchable || onExport) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {searchable && (
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#718096] pointer-events-none"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className={cn(
                  'w-full h-9 pl-8 pr-3 rounded-md text-sm',
                  'bg-[#0a1628] border border-[rgba(192,192,192,0.12)]',
                  'text-white placeholder:text-[#4A5568]',
                  'focus:outline-none focus:border-[rgba(192,192,192,0.35)]',
                  'transition-colors duration-150'
                )}
              />
              {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#718096]">
                  ...
                </span>
              )}
            </div>
          )}

          {onExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-1.5 text-xs border-[rgba(212,175,55,0.35)] text-[#D4AF37] hover:bg-[rgba(212,175,55,0.08)]"
            >
              <Download size={13} />
              {exportLabel}
            </Button>
          )}
        </div>
      )}

      {/* Table wrapper — horizontal scroll on mobile */}
      <div className="overflow-x-auto rounded-xl border border-[rgba(192,192,192,0.10)]">
        <table className="w-full min-w-full border-collapse text-sm">
          {/* Head */}
          <thead>
            <tr className="border-b border-[rgba(192,192,192,0.10)] bg-[#0a1628]">
              {columns.map((col) => {
                const key = String(col.key);
                const isActive = sortKey === key;
                return (
                  <th
                    key={key}
                    scope="col"
                    className={cn(
                      'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider',
                      'text-[#A0AEC0] select-none whitespace-nowrap',
                      col.sortable && 'cursor-pointer hover:text-[#C0C0C0] transition-colors',
                      isActive && 'text-[#C0C0C0]',
                      col.headerClassName
                    )}
                    onClick={col.sortable ? () => handleSort(key) : undefined}
                    aria-sort={
                      isActive
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        <span className="text-[#4A5568]">
                          {isActive ? (
                            sortDir === 'asc' ? (
                              <ChevronUp size={12} className="text-[#C0C0C0]" />
                            ) : (
                              <ChevronDown size={12} className="text-[#C0C0C0]" />
                            )
                          ) : (
                            <ChevronsUpDown size={12} />
                          )}
                        </span>
                      )}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {pagedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-[#718096]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              pagedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-[rgba(192,192,192,0.06)] bg-[#0d1f3c]',
                    'transition-colors duration-150',
                    onRowClick
                      ? 'cursor-pointer hover:bg-[#121f36] hover:border-[rgba(212,175,55,0.15)]'
                      : 'hover:bg-[#121f36]',
                    rowIdx % 2 === 1 && 'bg-[#0a1628]'
                  )}
                >
                  {columns.map((col) => {
                    const key = String(col.key);
                    const rawValue = getNestedValue(row, key);
                    const cellContent = col.render
                      ? col.render(rawValue, row)
                      : rawValue !== undefined && rawValue !== null
                        ? String(rawValue)
                        : '—';

                    return (
                      <td
                        key={key}
                        className={cn(
                          'px-4 py-3 text-sm text-[#FAFAFA] whitespace-nowrap',
                          col.cellClassName
                        )}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {paginated && total > pageSize && (
        <PaginationControls
          page={page}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      )}
    </div>
  );
}
