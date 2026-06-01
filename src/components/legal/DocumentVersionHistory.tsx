'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  History,
  RotateCcw,
  GitCompare,
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  FileText,
  Plus,
  Minus,
} from 'lucide-react';
import {
  getVersionHistory,
  restoreVersion,
  computeDiff,
  type DocumentVersion,
  type DiffLine,
} from '@/lib/document-versioning';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DocumentVersionHistoryProps {
  petitionId: string;
  onRestore?: (version: DocumentVersion) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function DiffView({ lines }: { lines: DiffLine[] }) {
  return (
    <div className="font-mono text-xs overflow-x-auto rounded-lg border border-[#1a2332] bg-[#060c15]">
      {lines.map((line, idx) => {
        const isAdded = line.type === 'added';
        const isRemoved = line.type === 'removed';
        return (
          <div
            key={idx}
            className={`flex items-start gap-2 px-3 py-0.5 leading-5 ${
              isAdded
                ? 'bg-emerald-500/10 text-emerald-400'
                : isRemoved
                  ? 'bg-red-500/10 text-red-400'
                  : 'text-gray-500'
            }`}
          >
            <span className="shrink-0 w-4 text-center select-none">
              {isAdded ? (
                <Plus className="w-3 h-3 inline" />
              ) : isRemoved ? (
                <Minus className="w-3 h-3 inline" />
              ) : (
                <span className="opacity-30"> </span>
              )}
            </span>
            <span className="whitespace-pre-wrap break-all">{line.content || ' '}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentVersionHistory({
  petitionId,
  onRestore,
}: DocumentVersionHistoryProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  // Compare mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<number | null>(null);
  const [compareB, setCompareB] = useState<number | null>(null);
  const [compareDiff, setCompareDiff] = useState<DiffLine[] | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVersionHistory(petitionId);
      setVersions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar versões');
    } finally {
      setLoading(false);
    }
  }, [petitionId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  async function handleRestore(version: DocumentVersion) {
    setRestoring(version.id);
    try {
      const restored = await restoreVersion(petitionId, version.version);
      onRestore?.(restored);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao restaurar versão');
    } finally {
      setRestoring(null);
    }
  }

  function handleCompare() {
    if (compareA === null || compareB === null) return;
    const vA = versions.find((v) => v.version === compareA);
    const vB = versions.find((v) => v.version === compareB);
    if (!vA || !vB) return;

    const [older, newer] = vA.version < vB.version ? [vA, vB] : [vB, vA];
    const diff = computeDiff(older.content, newer.content);
    setCompareDiff(diff.lines);
  }

  // ── Empty / Loading States ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 text-sm gap-2">
        <Clock className="w-4 h-4 animate-spin" />
        Carregando histórico de versões...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        <History className="w-8 h-8 mx-auto mb-2 opacity-30" />
        Nenhuma versão registrada para esta petição.
      </div>
    );
  }

  // ── Main Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-white">
            {versions.length} {versions.length === 1 ? 'versão' : 'versões'}
          </span>
        </div>

        <button
          onClick={() => {
            setCompareMode((prev) => !prev);
            setCompareDiff(null);
            setCompareA(null);
            setCompareB(null);
          }}
          className="flex items-center gap-1.5 rounded-lg border border-[#2a3342] px-3 py-1.5 text-xs font-medium text-gray-400 hover:text-white hover:border-amber-500/50 transition-colors"
        >
          <GitCompare className="w-3.5 h-3.5" />
          Comparar versões
        </button>
      </div>

      {/* Compare Selector */}
      {compareMode && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
          <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
            Comparar versões
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">De:</span>
              <select
                value={compareA ?? ''}
                onChange={(e) => setCompareA(Number(e.target.value) || null)}
                className="rounded border border-[#2a3342] bg-[#0a0f1a] text-white text-xs px-2 py-1"
              >
                <option value="">— versão —</option>
                {[...versions].reverse().map((v) => (
                  <option key={v.id} value={v.version}>
                    v{v.version} — {v.changeDescription || 'Sem descrição'}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Para:</span>
              <select
                value={compareB ?? ''}
                onChange={(e) => setCompareB(Number(e.target.value) || null)}
                className="rounded border border-[#2a3342] bg-[#0a0f1a] text-white text-xs px-2 py-1"
              >
                <option value="">— versão —</option>
                {[...versions].reverse().map((v) => (
                  <option key={v.id} value={v.version}>
                    v{v.version} — {v.changeDescription || 'Sem descrição'}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCompare}
              disabled={compareA === null || compareB === null || compareA === compareB}
              className="rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs px-3 py-1 hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Ver diff
            </button>
          </div>

          {compareDiff && (
            <div className="mt-3">
              <DiffView lines={compareDiff} />
            </div>
          )}
        </div>
      )}

      {/* Version Timeline */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[19px] top-4 bottom-4 w-px bg-white/10" />

        <div className="space-y-1">
          {versions.map((version, index) => {
            const isExpanded = expandedId === version.id;
            const isLatest = index === 0;
            const hasDiff =
              version.diff &&
              typeof version.diff === 'object' &&
              Array.isArray((version.diff as { lines?: unknown[] }).lines);

            return (
              <div key={version.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative shrink-0 flex items-start pt-3.5 z-10">
                  <span
                    className={`w-2.5 h-2.5 rounded-full border-2 ${
                      isLatest
                        ? 'bg-amber-500 border-amber-400'
                        : 'bg-gray-600 border-gray-500'
                    }`}
                  />
                </div>

                {/* Card */}
                <div className="flex-1 min-w-0 mb-2">
                  <div
                    className={`rounded-lg border bg-white/5 transition-colors hover:bg-white/8 ${
                      isLatest ? 'border-amber-500/30' : 'border-[#1a2332]'
                    }`}
                  >
                    {/* Header row */}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      onClick={() => toggleExpand(version.id)}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            isLatest
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                          }`}
                        >
                          v{version.version}
                        </span>
                        <span className="text-sm text-white truncate">
                          {version.changeDescription || 'Sem descrição'}
                        </span>
                        {isLatest && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                            Atual
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {version.diff && (
                          <div className="flex items-center gap-1.5 text-[10px]">
                            <span className="text-emerald-400">
                              +{(version.diff as { additions?: number }).additions ?? 0}
                            </span>
                            <span className="text-red-400">
                              -{(version.diff as { removals?: number }).removals ?? 0}
                            </span>
                          </div>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </button>

                    {/* Meta row */}
                    <div className="px-4 pb-2 flex items-center gap-4 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(version.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.createdBy}
                      </span>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-4 border-t border-[#1a2332] pt-4">
                        {/* Actions */}
                        {!isLatest && (
                          <button
                            onClick={() => handleRestore(version)}
                            disabled={restoring === version.id}
                            className="flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 text-xs px-3 py-1.5 hover:bg-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <RotateCcw
                              className={`w-3.5 h-3.5 ${restoring === version.id ? 'animate-spin' : ''}`}
                            />
                            {restoring === version.id ? 'Restaurando...' : 'Restaurar esta versão'}
                          </button>
                        )}

                        {/* Diff view */}
                        {hasDiff ? (
                          <div className="space-y-2">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                              <GitCompare className="w-3.5 h-3.5" />
                              Diferenças em relação à versão anterior
                            </p>
                            <DiffView
                              lines={
                                (version.diff as { lines: DiffLine[] }).lines
                              }
                            />
                          </div>
                        ) : (
                          /* Show full content for first version */
                          <div className="space-y-2">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5" />
                              Conteúdo
                            </p>
                            <pre className="font-mono text-xs text-gray-400 whitespace-pre-wrap break-words rounded-lg border border-[#1a2332] bg-[#060c15] p-3 max-h-60 overflow-y-auto">
                              {version.content || '(vazio)'}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
