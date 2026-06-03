'use client';

import { useState, useMemo } from 'react';
import {
  Bell,
  Search,
  Eye,
  EyeOff,
  Calendar,
  Briefcase,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';

// ─── Sync result types ────────────────────────────────────────────────────────

interface SyncProcessResult {
  processId: string;
  cnj: string;
  newMovements: number;
  error?: string;
}

interface SyncState {
  status: 'idle' | 'syncing' | 'done' | 'error';
  totalSynced: number;
  results: SyncProcessResult[];
  errorMessage?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PublicationsPage() {
  const { movements, processes, getProcessById, markMovementRead, hydrateFromApi } =
    useLegalStore();

  const [searchQuery, setSearchQuery]   = useState('');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [syncState, setSyncState]       = useState<SyncState>({
    status: 'idle',
    totalSynced: 0,
    results: [],
  });
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  // ─── Filtered / sorted movement list ──────────────────────────────────────

  const sortedMovements = useMemo(() => {
    return [...movements]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((m) => {
        if (showUnreadOnly && m.isRead) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const process = getProcessById(m.processId);
          if (
            !m.description.toLowerCase().includes(q) &&
            !(process?.cnj || '').toLowerCase().includes(q) &&
            !m.source.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      });
  }, [movements, searchQuery, showUnreadOnly, getProcessById]);

  const unreadCount = movements.filter((m) => !m.isRead).length;

  // ─── DataJud sync handler ─────────────────────────────────────────────────

  async function handleDatajudSync() {
    // Collect only processes that have a valid CNJ
    const syncTargets = processes
      .filter((p) => p.cnj && p.cnj.trim().length > 0)
      .map((p) => ({ processId: p.id, cnj: p.cnj }));

    if (syncTargets.length === 0) {
      setSyncState({
        status: 'error',
        totalSynced: 0,
        results: [],
        errorMessage:
          'Nenhum processo com número CNJ encontrado. Cadastre processos antes de sincronizar.',
      });
      setShowSyncPanel(true);
      return;
    }

    setSyncState({ status: 'syncing', totalSynced: 0, results: [] });
    setShowSyncPanel(true);

    try {
      const res = await fetch('/api/legal/datajud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processIds: syncTargets }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSyncState({
          status: 'error',
          totalSynced: 0,
          results: [],
          errorMessage: json.error || json.message || `Erro HTTP ${res.status}`,
        });
        return;
      }

      setSyncState({
        status: 'done',
        totalSynced: json.synced ?? 0,
        results: json.results ?? [],
      });

      // Reload movements from Supabase if new ones were added
      if ((json.synced ?? 0) > 0) {
        await hydrateFromApi();
      }
    } catch (err) {
      setSyncState({
        status: 'error',
        totalSynced: 0,
        results: [],
        errorMessage:
          err instanceof Error ? err.message : 'Falha na comunicação com o servidor',
      });
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const sourceBadge: Record<string, string> = {
    manual:   'bg-gray-500/10 text-gray-400',
    dje:      'bg-amber-500/10 text-amber-400',
    pje:      'bg-blue-500/10 text-blue-400',
    datajud:  'bg-emerald-500/10 text-emerald-400',
    esaj:     'bg-purple-500/10 text-purple-400',
    eproc:    'bg-cyan-500/10 text-cyan-400',
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="h-7 w-7 text-amber-400" />
            Movimentações e Publicações
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            {movements.length} movimentações registradas
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                {unreadCount} não lidas
              </span>
            )}
          </p>
        </div>

        {/* DataJud sync button */}
        <button
          onClick={handleDatajudSync}
          disabled={syncState.status === 'syncing'}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors border
            ${
              syncState.status === 'syncing'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-not-allowed opacity-70'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
            }`}
        >
          <RefreshCw
            className={`h-4 w-4 ${syncState.status === 'syncing' ? 'animate-spin' : ''}`}
          />
          {syncState.status === 'syncing' ? 'Sincronizando…' : 'Sincronizar com DataJud'}
        </button>
      </div>

      {/* Sync result panel */}
      {showSyncPanel && syncState.status !== 'idle' && syncState.status !== 'syncing' && (
        <div
          className={`rounded-xl border p-4 relative ${
            syncState.status === 'error'
              ? 'border-red-500/20 bg-red-500/[0.04]'
              : syncState.totalSynced > 0
              ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
              : 'border-[#1a2332] bg-[#0d1320]'
          }`}
        >
          <button
            onClick={() => setShowSyncPanel(false)}
            className="absolute top-3 right-3 text-[#6b7a8d] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {syncState.status === 'error' ? (
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-400">Erro na sincronização</p>
                <p className="text-xs text-[#6b7a8d] mt-0.5">{syncState.errorMessage}</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-3 mb-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">
                    Sincronização concluída
                  </p>
                  <p className="text-xs text-[#6b7a8d] mt-0.5">
                    {syncState.totalSynced === 0
                      ? 'Nenhuma movimentação nova encontrada — tudo atualizado.'
                      : `${syncState.totalSynced} nova${syncState.totalSynced !== 1 ? 's' : ''} movimentação${syncState.totalSynced !== 1 ? 'ões' : ''} importada${syncState.totalSynced !== 1 ? 's' : ''} do DataJud.`}
                  </p>
                </div>
              </div>

              {syncState.results.length > 0 && (
                <div className="space-y-1 pl-8">
                  {syncState.results.map((r) => {
                    const proc = processes.find((p) => p.id === r.processId);
                    return (
                      <div key={r.processId} className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-[#6b7a8d]">{r.cnj}</span>
                        {proc && (
                          <span className="text-[#4a5568]">— {proc.title}</span>
                        )}
                        {r.error ? (
                          <span className="text-red-400 ml-auto">{r.error}</span>
                        ) : (
                          <span
                            className={`ml-auto ${
                              r.newMovements > 0 ? 'text-emerald-400' : 'text-[#6b7a8d]'
                            }`}
                          >
                            {r.newMovements > 0
                              ? `+${r.newMovements} nova${r.newMovements !== 1 ? 's' : ''}`
                              : 'sem novidades'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a8d]" />
          <input
            type="text"
            placeholder="Buscar por CNJ, conteúdo ou fonte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] pl-10 pr-4 py-2 text-sm text-white placeholder-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
          />
        </div>
        <button
          onClick={() => setShowUnreadOnly(!showUnreadOnly)}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            showUnreadOnly
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'text-[#6b7a8d] border border-[#1a2332] hover:text-white'
          }`}
        >
          {showUnreadOnly ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showUnreadOnly ? 'Não lidas' : 'Todas'}
        </button>
      </div>

      {/* Movements List */}
      {sortedMovements.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] py-16">
          <Bell className="h-12 w-12 text-[#6b7a8d] mb-3" />
          <p className="text-[#6b7a8d] text-sm">
            {showUnreadOnly
              ? 'Nenhuma movimentação não lida'
              : 'Nenhuma movimentação registrada'}
          </p>
          <p className="text-xs text-[#4a5568] mt-2">
            Clique em &ldquo;Sincronizar com DataJud&rdquo; para importar movimentações dos seus processos
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedMovements.map((mov) => {
            const process = getProcessById(mov.processId);
            return (
              <div
                key={mov.id}
                className={`rounded-xl border bg-[#0d1320] p-5 transition-colors ${
                  mov.isRead
                    ? 'border-[#1a2332]'
                    : 'border-amber-500/20 bg-amber-500/[0.02]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        sourceBadge[mov.source] || sourceBadge.manual
                      }`}
                    >
                      {mov.source.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-[#6b7a8d]">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(mov.date)}
                    </div>
                    {mov.type && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-400">
                        {mov.type}
                      </span>
                    )}
                    {!mov.isRead && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                        Nova
                      </span>
                    )}
                  </div>
                  {!mov.isRead && (
                    <button
                      onClick={() => markMovementRead(mov.id)}
                      className="rounded-lg border border-[#1a2332] px-2.5 py-1 text-xs text-[#6b7a8d] hover:text-white transition-colors flex-shrink-0"
                    >
                      Marcar lida
                    </button>
                  )}
                </div>

                {process && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-2">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span className="font-mono">{process.cnj}</span>
                    <span className="text-[#6b7a8d]">— {process.title}</span>
                  </div>
                )}

                <p className="text-sm text-[#8899aa] leading-relaxed">{mov.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
