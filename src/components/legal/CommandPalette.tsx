'use client';

// =============================================================================
// CommandPalette — Global Cmd+K command palette
// APEX Legal Performance — navy + silver + gold theme
// =============================================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCommandPalette, type CommandResult, type ResultType } from '@/hooks/useCommandPalette';
import {
  Search,
  Briefcase,
  Users,
  Clock,
  FileText,
  Bell,
  DollarSign,
  Receipt,
  CreditCard,
  Building2,
  Target,
  LayoutDashboard,
  BarChart3,
  Megaphone,
  Sparkles,
  Scale,
  Mic,
  BookOpen,
  User,
  FileSearch,
  MessageCircle,
  Wand2,
  MessageSquare,
  ShieldCheck,
  Store,
  Settings,
  FilePlus,
  UserPlus,
  FileEdit,
  X,
  ChevronRight,
} from 'lucide-react';

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Scale,
  Briefcase,
  Users,
  Clock,
  FileText,
  Bell,
  DollarSign,
  Receipt,
  CreditCard,
  Building2,
  Target,
  LayoutDashboard,
  BarChart3,
  Megaphone,
  Sparkles,
  Mic,
  BookOpen,
  User,
  FileSearch,
  MessageCircle,
  Wand2,
  MessageSquare,
  ShieldCheck,
  Store,
  Settings,
  FilePlus,
  UserPlus,
  FileEdit,
  Search,
};

function NavIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return <Search className={className} />;
  const Icon = ICON_MAP[name] ?? Search;
  return <Icon className={className} />;
}

// ─── Result type labels ───────────────────────────────────────────────────────

const TYPE_LABELS: Record<ResultType, string> = {
  page: 'Páginas',
  process: 'Processos',
  client: 'Clientes',
  deadline: 'Prazos',
  action: 'Ações',
};

const TYPE_ORDER: ResultType[] = ['action', 'page', 'process', 'client', 'deadline'];

// ─── Component ────────────────────────────────────────────────────────────────

export function CommandPalette() {
  const { isOpen, close, query, setQuery, results, executeResult } = useCommandPalette();
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const result = results[activeIndex];
        if (result) executeResult(result);
      }
    },
    [results, activeIndex, executeResult]
  );

  if (!isOpen) return null;

  // Group results by type, preserving TYPE_ORDER
  const grouped = TYPE_ORDER.reduce<{ type: ResultType; items: Array<{ result: CommandResult; flatIndex: number }> }[]>(
    (acc, type) => {
      let flatOffset = 0;
      for (const t of TYPE_ORDER) {
        if (t === type) break;
        flatOffset += results.filter((r) => r.type === t).length;
      }
      const items = results
        .map((r, i) => ({ result: r, flatIndex: i }))
        .filter(({ result }) => result.type === type);
      if (items.length > 0) {
        acc.push({ type, items });
      }
      return acc;
    },
    []
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Palette */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        className="fixed left-1/2 top-[15vh] z-[9999] w-full max-w-xl -translate-x-1/2 rounded-xl border border-[#1a2d52]/80 bg-[#0a1628] shadow-2xl shadow-black/60 overflow-hidden"
        style={{ animation: 'cmdk-in 0.15s ease-out' }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-[#1a2d52]/60 px-4 py-3">
          <Search className="h-4 w-4 flex-shrink-0 text-[#4A5568]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar páginas, processos, clientes..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-[#4A5568] outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-[#4A5568] hover:text-white transition-colors"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[#1a2d52] bg-[#060d1a] px-1.5 py-0.5 text-[10px] text-[#4A5568]">
            Esc
          </kbd>
        </div>

        {/* Results */}
        <ul
          ref={listRef}
          className="max-h-[50vh] overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-[#1a2d52]"
        >
          {results.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-[#4A5568]">
              {query.trim().length >= 2
                ? `Nenhum resultado para "${query}"`
                : 'Comece a digitar para buscar...'}
            </li>
          ) : (
            grouped.map(({ type, items }) => (
              <li key={type}>
                {/* Group header */}
                <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-widest text-[#2D3748]">
                  {TYPE_LABELS[type]}
                </p>
                <ul>
                  {items.map(({ result, flatIndex }) => {
                    const isActive = flatIndex === activeIndex;
                    return (
                      <li
                        key={result.id}
                        data-index={flatIndex}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => executeResult(result)}
                        onMouseEnter={() => setActiveIndex(flatIndex)}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors ${
                          isActive
                            ? 'bg-[#C0C0C0]/10 text-white'
                            : 'text-[#A0AEC0] hover:bg-[#0d1f3c]'
                        }`}
                      >
                        {/* Icon */}
                        <span
                          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md ${
                            isActive ? 'bg-[#C0C0C0]/15' : 'bg-[#0d1f3c]'
                          }`}
                        >
                          <NavIcon
                            name={result.icon}
                            className={`h-3.5 w-3.5 ${isActive ? 'text-[#C0C0C0]' : 'text-[#4A5568]'}`}
                          />
                        </span>

                        {/* Text */}
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className={`truncate text-sm font-medium ${isActive ? 'text-white' : 'text-[#A0AEC0]'}`}>
                            {result.title}
                          </span>
                          {result.subtitle && (
                            <span className="truncate text-[11px] text-[#4A5568]">
                              {result.subtitle}
                            </span>
                          )}
                        </span>

                        {/* Chevron hint */}
                        {isActive && (
                          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-[#4A5568]" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))
          )}
        </ul>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-[#1a2d52]/60 px-4 py-2">
          <span className="flex items-center gap-1 text-[10px] text-[#2D3748]">
            <kbd className="inline-flex items-center rounded border border-[#1a2d52] bg-[#060d1a] px-1 py-0.5 font-sans text-[9px] text-[#4A5568]">
              ↑↓
            </kbd>
            navegar
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#2D3748]">
            <kbd className="inline-flex items-center rounded border border-[#1a2d52] bg-[#060d1a] px-1 py-0.5 font-sans text-[9px] text-[#4A5568]">
              Enter
            </kbd>
            selecionar
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#2D3748]">
            <kbd className="inline-flex items-center rounded border border-[#1a2d52] bg-[#060d1a] px-1 py-0.5 font-sans text-[9px] text-[#4A5568]">
              Esc
            </kbd>
            fechar
          </span>
        </div>
      </div>

      <style>{`
        @keyframes cmdk-in {
          from { opacity: 0; transform: translateX(-50%) translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1); }
        }
      `}</style>
    </>
  );
}
