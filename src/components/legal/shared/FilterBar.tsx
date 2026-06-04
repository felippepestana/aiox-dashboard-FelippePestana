'use client';

// =============================================================================
// FilterBar - Horizontal filter bar with dropdowns, date pickers, search input
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React, { useState } from 'react';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectOption {
  label: string;
  value: string;
}

export type FilterConfig =
  | {
      type: 'select';
      key: string;
      label: string;
      options: SelectOption[];
    }
  | {
      type: 'dateRange';
      key: string;
      label: string;
    }
  | {
      type: 'search';
      key: string;
      placeholder?: string;
    };

export type FilterValues = Record<string, string>;

export interface FilterBarProps {
  filters: FilterConfig[];
  values?: FilterValues;
  onFilterChange: (key: string, value: string) => void;
  onClear: () => void;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countActive(values: FilterValues): number {
  return Object.values(values).filter((v) => v && v.trim() !== '').length;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SelectFilterProps {
  config: Extract<FilterConfig, { type: 'select' }>;
  value: string;
  onChange: (val: string) => void;
}

function SelectFilter({ config, value, onChange }: SelectFilterProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'h-9 pl-3 pr-8 rounded-md text-sm appearance-none',
          'bg-[#0a1628] border',
          value
            ? 'border-[rgba(212,175,55,0.45)] text-[#D4AF37]'
            : 'border-[rgba(192,192,192,0.12)] text-[#A0AEC0]',
          'focus:outline-none focus:border-[rgba(192,192,192,0.35)]',
          'transition-colors duration-150 cursor-pointer'
        )}
        aria-label={config.label}
        title={config.label}
      >
        <option value="">{config.label}</option>
        {config.options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#718096] pointer-events-none"
      />
    </div>
  );
}

interface DateRangeFilterProps {
  config: Extract<FilterConfig, { type: 'dateRange' }>;
  value: string;
  onChange: (val: string) => void;
}

function DateRangeFilter({ config, value, onChange }: DateRangeFilterProps) {
  return (
    <div className="relative">
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={config.label}
        className={cn(
          'h-9 px-3 rounded-md text-sm',
          'bg-[#0a1628] border',
          value
            ? 'border-[rgba(212,175,55,0.45)] text-[#D4AF37]'
            : 'border-[rgba(192,192,192,0.12)] text-[#A0AEC0]',
          'focus:outline-none focus:border-[rgba(192,192,192,0.35)]',
          'transition-colors duration-150',
          '[color-scheme:dark]'
        )}
        aria-label={config.label}
        title={config.label}
      />
    </div>
  );
}

interface SearchFilterProps {
  config: Extract<FilterConfig, { type: 'search' }>;
  value: string;
  onChange: (val: string) => void;
}

function SearchFilter({ config, value, onChange }: SearchFilterProps) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={config.placeholder ?? 'Buscar...'}
      className={cn(
        'h-9 px-3 rounded-md text-sm min-w-[180px]',
        'bg-[#0a1628] border',
        value
          ? 'border-[rgba(212,175,55,0.45)] text-white'
          : 'border-[rgba(192,192,192,0.12)] text-[#A0AEC0]',
        'placeholder:text-[#4A5568]',
        'focus:outline-none focus:border-[rgba(192,192,192,0.35)]',
        'transition-colors duration-150'
      )}
    />
  );
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

export function FilterBar({
  filters,
  values = {},
  onFilterChange,
  onClear,
  className,
}: FilterBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const activeCount = countActive(values);

  return (
    <div
      className={cn(
        'rounded-xl border border-[rgba(192,192,192,0.10)] bg-[#0a1628] p-3',
        className
      )}
    >
      {/* Header row with toggle on mobile */}
      <div className="flex items-center justify-between gap-2 mb-0 sm:hidden">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2 text-sm text-[#A0AEC0] hover:text-white transition-colors"
          aria-expanded={!collapsed}
        >
          <SlidersHorizontal size={14} />
          <span>Filtros</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full text-[10px] font-bold bg-[#D4AF37] text-[#0a1628]">
              {activeCount}
            </span>
          )}
          <ChevronDown
            size={12}
            className={cn(
              'transition-transform duration-200',
              !collapsed && 'rotate-180'
            )}
          />
        </button>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-[#718096] hover:text-[#F87171] transition-colors"
          >
            <X size={12} />
            Limpar
          </button>
        )}
      </div>

      {/* Filters grid — always visible on sm+, collapsible on mobile */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-2',
          collapsed ? 'hidden sm:flex' : 'flex'
        )}
      >
        {/* Desktop active count badge */}
        <div className="hidden sm:flex items-center gap-2 mr-1">
          <SlidersHorizontal size={14} className="text-[#718096]" />
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold bg-[#D4AF37] text-[#0a1628]">
              {activeCount}
            </span>
          )}
        </div>

        {filters.map((filter) => {
          const val = values[filter.key] ?? '';
          if (filter.type === 'select') {
            return (
              <SelectFilter
                key={filter.key}
                config={filter}
                value={val}
                onChange={(v) => onFilterChange(filter.key, v)}
              />
            );
          }
          if (filter.type === 'dateRange') {
            return (
              <DateRangeFilter
                key={filter.key}
                config={filter}
                value={val}
                onChange={(v) => onFilterChange(filter.key, v)}
              />
            );
          }
          if (filter.type === 'search') {
            return (
              <SearchFilter
                key={filter.key}
                config={filter}
                value={val}
                onChange={(v) => onFilterChange(filter.key, v)}
              />
            );
          }
          return null;
        })}

        {/* Clear button — desktop */}
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="hidden sm:flex items-center gap-1.5 text-xs text-[#718096] hover:text-[#F87171] hover:bg-[rgba(248,113,113,0.08)] ml-auto"
          >
            <X size={12} />
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}
