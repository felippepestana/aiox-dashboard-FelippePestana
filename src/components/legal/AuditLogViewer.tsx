'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  Clock,
  Filter,
  X,
} from 'lucide-react';
import type { AuditEvent, AuditAction, AuditResourceType } from '@/lib/audit-log';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLogPage {
  entries: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface Filters {
  userId: string;
  resourceType: string;
  action: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Criação',
  read: 'Consulta',
  update: 'Atualização',
  delete: 'Exclusão',
  export: 'Exportação',
  login: 'Login',
  logout: 'Logout',
  share: 'Compartilhamento',
};

const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'bg-green-500/15 text-green-400 border-green-500/25',
  read: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  update: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  delete: 'bg-red-500/15 text-red-400 border-red-500/25',
  export: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  login: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  logout: 'bg-gray-500/15 text-gray-400 border-gray-500/25',
  share: 'bg-pink-500/15 text-pink-400 border-pink-500/25',
};

const RESOURCE_LABELS: Record<AuditResourceType, string> = {
  process: 'Processo',
  client: 'Cliente',
  petition: 'Petição',
  deadline: 'Prazo',
  financial: 'Financeiro',
  credential: 'Credencial',
};

const ACTIONS: AuditAction[] = ['create', 'read', 'update', 'delete', 'export', 'login', 'logout', 'share'];
const RESOURCE_TYPES: AuditResourceType[] = ['process', 'client', 'petition', 'deadline', 'financial', 'credential'];
const PAGE_SIZE = 25;

// ─── Component ────────────────────────────────────────────────────────────────

export function AuditLogViewer() {
  const [result, setResult] = useState<AuditLogPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    userId: '',
    resourceType: '',
    action: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  });

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.resourceType) params.set('resourceType', filters.resourceType);
      if (filters.action) params.set('action', filters.action);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      if (filters.search) params.set('search', filters.search);

      const res = await fetch(`/api/legal/audit?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  function handleFilterChange(key: keyof Filters, value: string) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters({ userId: '', resourceType: '', action: '', dateFrom: '', dateTo: '', search: '' });
    setPage(1);
  }

  function formatTimestamp(ts?: string): string {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function exportCSV() {
    if (!result) return;

    const headers = ['Timestamp', 'Usuário', 'Ação', 'Recurso', 'ID do Recurso', 'IP', 'Detalhes'];
    const rows = result.entries.map((e) => [
      formatTimestamp(e.timestamp),
      e.userId,
      ACTION_LABELS[e.action] ?? e.action,
      RESOURCE_LABELS[e.resourceType] ?? e.resourceType,
      e.resourceId ?? '',
      e.ipAddress ?? '',
      e.details ? JSON.stringify(e.details) : '',
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Group entries by day for timeline view
  const groupedByDay = result
    ? result.entries.reduce<Record<string, AuditEvent[]>>((acc, entry) => {
        const day = entry.timestamp
          ? new Date(entry.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
          : 'Sem data';
        if (!acc[day]) acc[day] = [];
        acc[day].push(entry);
        return acc;
      }, {})
    : {};

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
          <input
            type="text"
            placeholder="Buscar nos detalhes..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full bg-[#0d1320] border border-[#1a2332] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              hasActiveFilters
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-[#1a2332] text-[#6b7a8d] hover:text-white hover:bg-[#1a2332]'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/30 text-amber-400 text-[10px] font-bold">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>

          {/* View toggle */}
          <div className="flex rounded-lg border border-[#1a2332] overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm transition-colors ${viewMode === 'table' ? 'bg-amber-500/10 text-amber-400' : 'text-[#6b7a8d] hover:text-white'}`}
              title="Tabela"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-2 text-sm border-l border-[#1a2332] transition-colors ${viewMode === 'timeline' ? 'bg-amber-500/10 text-amber-400' : 'text-[#6b7a8d] hover:text-white'}`}
              title="Linha do Tempo"
            >
              <Clock className="h-4 w-4" />
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={exportCSV}
            disabled={!result || result.entries.length === 0}
            className="flex items-center gap-2 rounded-lg border border-[#1a2332] px-3 py-2 text-sm text-[#6b7a8d] hover:text-white hover:bg-[#1a2332] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">Filtros</span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-[#6b7a8d] hover:text-red-400 transition-colors">
                <X className="h-3 w-3" />
                Limpar tudo
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div>
              <label className="block text-[11px] text-[#6b7a8d] mb-1 uppercase tracking-wider">Ação</label>
              <select
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full bg-[#0a0f1a] border border-[#1a2332] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Todas</option>
                {ACTIONS.map((a) => (
                  <option key={a} value={a}>{ACTION_LABELS[a]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#6b7a8d] mb-1 uppercase tracking-wider">Recurso</label>
              <select
                value={filters.resourceType}
                onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                className="w-full bg-[#0a0f1a] border border-[#1a2332] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="">Todos</option>
                {RESOURCE_TYPES.map((r) => (
                  <option key={r} value={r}>{RESOURCE_LABELS[r]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-[#6b7a8d] mb-1 uppercase tracking-wider">Usuário ID</label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="ID do usuário"
                className="w-full bg-[#0a0f1a] border border-[#1a2332] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#6b7a8d] mb-1 uppercase tracking-wider">De</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full bg-[#0a0f1a] border border-[#1a2332] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-[11px] text-[#6b7a8d] mb-1 uppercase tracking-wider">Até</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full bg-[#0a0f1a] border border-[#1a2332] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      {result && (
        <p className="text-xs text-[#6b7a8d]">
          {result.total.toLocaleString('pt-BR')} {result.total === 1 ? 'registro' : 'registros'} encontrado{result.total === 1 ? '' : 's'}
        </p>
      )}

      {/* Table view */}
      {viewMode === 'table' && (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            </div>
          ) : !result || result.entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#6b7a8d]">
              <Clock className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">Nenhum registro de auditoria</p>
              <p className="text-xs mt-1">Ajuste os filtros ou aguarde novas ações</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1a2332]">
                    {['Timestamp', 'Usuário', 'Ação', 'Recurso', 'ID', 'IP', 'Detalhes'].map((col) => (
                      <th key={col} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#6b7a8d]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2332]">
                  {result.entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 text-xs text-[#8899aa] font-mono whitespace-nowrap">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-xs text-white font-mono max-w-[120px] truncate" title={entry.userId}>
                        {entry.userId}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ACTION_COLORS[entry.action] ?? 'bg-gray-500/15 text-gray-400'}`}>
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#8899aa]">
                        {RESOURCE_LABELS[entry.resourceType] ?? entry.resourceType}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6b7a8d] font-mono max-w-[100px] truncate" title={entry.resourceId}>
                        {entry.resourceId ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6b7a8d] font-mono whitespace-nowrap">
                        {entry.ipAddress ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#6b7a8d] max-w-[200px] truncate" title={entry.details ? JSON.stringify(entry.details) : undefined}>
                        {entry.details ? JSON.stringify(entry.details) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Timeline view */}
      {viewMode === 'timeline' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
            </div>
          ) : Object.keys(groupedByDay).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#6b7a8d]">
              <Clock className="h-10 w-10 mb-3" />
              <p className="text-sm font-medium">Nenhum registro de auditoria</p>
            </div>
          ) : (
            Object.entries(groupedByDay).map(([day, entries]) => (
              <div key={day}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-px flex-1 bg-[#1a2332]" />
                  <span className="text-xs font-semibold text-[#6b7a8d] uppercase tracking-widest whitespace-nowrap">
                    {day}
                  </span>
                  <div className="h-px flex-1 bg-[#1a2332]" />
                </div>

                <div className="space-y-2 pl-4 border-l-2 border-[#1a2332]">
                  {entries.map((entry) => (
                    <div key={entry.id} className="relative -ml-[9px] flex items-start gap-3">
                      <div className="mt-1.5 h-3 w-3 rounded-full border-2 border-[#1a2332] bg-[#0a0f1a] flex-shrink-0" />
                      <div className="flex-1 rounded-lg border border-[#1a2332] bg-[#0d1320] px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${ACTION_COLORS[entry.action] ?? 'bg-gray-500/15 text-gray-400'}`}>
                            {ACTION_LABELS[entry.action] ?? entry.action}
                          </span>
                          <span className="text-xs text-[#8899aa]">
                            {RESOURCE_LABELS[entry.resourceType] ?? entry.resourceType}
                            {entry.resourceId && <span className="text-[#6b7a8d] font-mono"> · {entry.resourceId}</span>}
                          </span>
                          <span className="ml-auto text-[11px] text-[#6b7a8d] font-mono whitespace-nowrap">
                            {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString('pt-BR') : ''}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-4 text-[11px] text-[#6b7a8d]">
                          <span className="font-mono">{entry.userId}</span>
                          {entry.ipAddress && <span>{entry.ipAddress}</span>}
                          {entry.details && (
                            <span className="truncate max-w-xs">{JSON.stringify(entry.details)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {result && result.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#6b7a8d]">
            Página {result.page} de {result.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={result.page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg border border-[#1a2332] px-3 py-1.5 text-sm text-[#6b7a8d] hover:text-white hover:bg-[#1a2332] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <button
              disabled={result.page >= result.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-[#1a2332] px-3 py-1.5 text-sm text-[#6b7a8d] hover:text-white hover:bg-[#1a2332] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
