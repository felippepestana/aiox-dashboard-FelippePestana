'use client';

// =============================================================================
// useCommandPalette — Global command palette hook
// Cmd+K / Ctrl+K opens, searches pages + store data + quick actions
// =============================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getAllPages } from '@/lib/navigation-config';
import { SearchIndex, normalizeText } from '@/lib/search-index';
import { useLegalStore } from '@/stores/legal-store';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResultType = 'page' | 'process' | 'client' | 'deadline' | 'action';

export type CommandResult = {
  id: string;
  type: ResultType;
  title: string;
  subtitle?: string;
  href?: string;
  icon?: string; // lucide icon name
  action?: () => void;
};

// ─── Static actions ───────────────────────────────────────────────────────────

const QUICK_ACTIONS: CommandResult[] = [
  {
    id: 'action-new-process',
    type: 'action',
    title: 'Novo Processo',
    subtitle: 'Cadastrar novo processo',
    href: '/legal/processes/new',
    icon: 'FilePlus',
  },
  {
    id: 'action-new-client',
    type: 'action',
    title: 'Novo Cliente',
    subtitle: 'Cadastrar novo cliente',
    href: '/legal/clients/new',
    icon: 'UserPlus',
  },
  {
    id: 'action-new-petition',
    type: 'action',
    title: 'Nova Petição',
    subtitle: 'Criar nova peça processual',
    href: '/legal/petitions/new',
    icon: 'FileEdit',
  },
];

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  // Store data for searching
  const processes = useLegalStore((s) => s.processes);
  const clients = useLegalStore((s) => s.clients);
  const deadlines = useLegalStore((s) => s.deadlines);

  // ─── Keyboard shortcut ────────────────────────────────────────────────────

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset query when closed
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setQuery(''), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  // ─── Page results ─────────────────────────────────────────────────────────

  const allPages = useMemo(() => getAllPages(), []);

  const pageIndex = useMemo(() => {
    const idx = new SearchIndex<{ id: string; label: string; href: string; icon: string }>();
    idx.addDocuments(
      allPages.map((p) => ({ id: p.id, label: p.label, href: p.href, icon: p.icon })),
      ['label']
    );
    return idx;
  }, [allPages]);

  // ─── Process index ────────────────────────────────────────────────────────

  const processIndex = useMemo(() => {
    const idx = new SearchIndex<{ id: string; title: string; cnj: string }>();
    idx.addDocuments(
      processes.map((p) => ({ id: p.id, title: p.title, cnj: p.cnj ?? '' })),
      ['title', 'cnj']
    );
    return idx;
  }, [processes]);

  // ─── Client index ─────────────────────────────────────────────────────────

  const clientIndex = useMemo(() => {
    const idx = new SearchIndex<{ id: string; name: string; email: string }>();
    idx.addDocuments(
      clients.map((c) => ({ id: c.id, name: c.name, email: c.email ?? '' })),
      ['name', 'email']
    );
    return idx;
  }, [clients]);

  // ─── Deadline index ───────────────────────────────────────────────────────

  const deadlineIndex = useMemo(() => {
    const idx = new SearchIndex<{ id: string; title: string; notes: string }>();
    idx.addDocuments(
      deadlines.map((d) => ({ id: d.id, title: d.title, notes: d.notes ?? '' })),
      ['title', 'notes']
    );
    return idx;
  }, [deadlines]);

  // ─── Computed results ─────────────────────────────────────────────────────

  const results = useMemo<CommandResult[]>(() => {
    const MAX_TOTAL = 8;
    const q = query.trim();

    // No query → show quick actions + top pages
    if (q.length < 2) {
      const topPages: CommandResult[] = allPages.slice(0, 5).map((p) => ({
        id: `page-${p.id}`,
        type: 'page',
        title: p.label,
        href: p.href,
        icon: p.icon,
      }));
      return [...QUICK_ACTIONS, ...topPages].slice(0, MAX_TOTAL);
    }

    const norm = normalizeText(q);
    const out: CommandResult[] = [];

    // Actions matching query
    const matchedActions = QUICK_ACTIONS.filter((a) =>
      normalizeText(a.title).includes(norm) || normalizeText(a.subtitle ?? '').includes(norm)
    );
    out.push(...matchedActions);

    // Pages
    const pageHits = pageIndex.search(q, 4);
    for (const hit of pageHits) {
      out.push({
        id: `page-${hit.item.id}`,
        type: 'page',
        title: hit.item.label,
        href: hit.item.href,
        icon: hit.item.icon,
      });
    }

    // Processes
    const procHits = processIndex.search(q, 3);
    for (const hit of procHits) {
      const proc = processes.find((p) => p.id === hit.item.id);
      if (proc) {
        out.push({
          id: `process-${proc.id}`,
          type: 'process',
          title: proc.title,
          subtitle: proc.cnj,
          href: `/legal/processes/${proc.id}`,
          icon: 'Briefcase',
        });
      }
    }

    // Clients
    const clientHits = clientIndex.search(q, 3);
    for (const hit of clientHits) {
      const client = clients.find((c) => c.id === hit.item.id);
      if (client) {
        out.push({
          id: `client-${client.id}`,
          type: 'client',
          title: client.name,
          subtitle: client.email,
          href: `/legal/clients/${client.id}`,
          icon: 'Users',
        });
      }
    }

    // Deadlines
    const deadlineHits = deadlineIndex.search(q, 2);
    for (const hit of deadlineHits) {
      const dl = deadlines.find((d) => d.id === hit.item.id);
      if (dl) {
        out.push({
          id: `deadline-${dl.id}`,
          type: 'deadline',
          title: dl.title,
          subtitle: dl.dueDate ? new Date(dl.dueDate).toLocaleDateString('pt-BR') : undefined,
          href: `/legal/deadlines`,
          icon: 'Clock',
        });
      }
    }

    // Deduplicate by id and cap
    const seen = new Set<string>();
    const deduped: CommandResult[] = [];
    for (const item of out) {
      if (!seen.has(item.id)) {
        seen.add(item.id);
        deduped.push(item);
      }
      if (deduped.length >= MAX_TOTAL) break;
    }

    return deduped;
  }, [query, allPages, pageIndex, processIndex, clientIndex, deadlineIndex, processes, clients, deadlines]);

  // ─── Execute ─────────────────────────────────────────────────────────────

  const executeResult = useCallback(
    (result: CommandResult) => {
      close();
      if (result.action) {
        result.action();
      } else if (result.href) {
        router.push(result.href);
      }
    },
    [close, router]
  );

  return {
    isOpen,
    open,
    close,
    toggle,
    query,
    setQuery,
    results,
    executeResult,
  };
}
