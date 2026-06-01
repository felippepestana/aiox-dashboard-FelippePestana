'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Send,
  Lock,
  RotateCcw,
  ArrowRight,
  MessageSquare,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  submitForReview,
  approveDocument,
  requestRevision,
  finalizeDocument,
  getApprovalHistory,
  getCurrentApprovalStatus,
  getAllowedActions,
  type ApprovalStatus,
  type ApprovalAction,
  type ApprovalComment,
} from '@/lib/approval-workflow';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApprovalWorkflowProps {
  petitionId: string;
  onStatusChange?: (status: ApprovalStatus) => void;
}

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ApprovalStatus,
  { label: string; color: string; icon: React.ElementType; description: string }
> = {
  draft: {
    label: 'Rascunho',
    color: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    icon: Clock,
    description: 'Documento em elaboração',
  },
  pending_review: {
    label: 'Em Revisão',
    color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: Send,
    description: 'Aguardando aprovação',
  },
  approved: {
    label: 'Aprovado',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    icon: CheckCircle,
    description: 'Documento aprovado',
  },
  revision_requested: {
    label: 'Revisão Solicitada',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: AlertCircle,
    description: 'Requer ajustes',
  },
  final: {
    label: 'Finalizado',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: Lock,
    description: 'Documento finalizado e bloqueado',
  },
};

const ACTION_CONFIG: Record<
  ApprovalAction,
  { label: string; color: string; icon: React.ElementType; needsComment: boolean }
> = {
  submit_for_review: {
    label: 'Enviar para Revisão',
    color: 'bg-blue-500/20 border-blue-500/40 text-blue-300 hover:bg-blue-500/30',
    icon: Send,
    needsComment: false,
  },
  approve: {
    label: 'Aprovar',
    color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30',
    icon: CheckCircle,
    needsComment: false,
  },
  request_revision: {
    label: 'Solicitar Revisão',
    color: 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30',
    icon: AlertCircle,
    needsComment: true,
  },
  finalize: {
    label: 'Finalizar Documento',
    color: 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30',
    icon: Lock,
    needsComment: false,
  },
  revert_to_draft: {
    label: 'Reverter para Rascunho',
    color: 'bg-gray-500/20 border-gray-500/40 text-gray-300 hover:bg-gray-500/30',
    icon: RotateCcw,
    needsComment: false,
  },
};

const ACTION_FN: Record<
  ApprovalAction,
  (petitionId: string, userId: string, comment: string) => Promise<ApprovalComment>
> = {
  submit_for_review: (id, u, c) => submitForReview(id, u, c),
  approve: (id, u, c) => approveDocument(id, u, c),
  request_revision: (id, u, c) => requestRevision(id, c, u),
  finalize: (id, u, c) => finalizeDocument(id, u, c),
  revert_to_draft: (id, u, c) => submitForReview(id, u, c), // handled via API POST with action
};

// ─── Workflow Diagram ─────────────────────────────────────────────────────────

const WORKFLOW_STEPS: ApprovalStatus[] = [
  'draft',
  'pending_review',
  'approved',
  'final',
];

function WorkflowDiagram({ current }: { current: ApprovalStatus }) {
  const isRevision = current === 'revision_requested';

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {WORKFLOW_STEPS.map((step, idx) => {
        const cfg = STATUS_CONFIG[step];
        const Icon = cfg.icon;
        const isActive = current === step;
        const isPast =
          WORKFLOW_STEPS.indexOf(step) < WORKFLOW_STEPS.indexOf(current) && !isRevision;

        return (
          <div key={step} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold transition-all ${
                isActive
                  ? cfg.color + ' ring-1 ring-white/20'
                  : isPast
                    ? 'bg-white/5 text-gray-500 border-white/10'
                    : 'bg-white/3 text-gray-600 border-white/5'
              }`}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
            </div>
            {idx < WORKFLOW_STEPS.length - 1 && (
              <ArrowRight className="w-3 h-3 text-gray-600 shrink-0" />
            )}
          </div>
        );
      })}

      {/* Revision side note */}
      {isRevision && (
        <div className="flex items-center gap-1 ml-2">
          <AlertCircle className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-amber-400 font-semibold">Revisão Solicitada</span>
        </div>
      )}
    </div>
  );
}

// ─── History Item ─────────────────────────────────────────────────────────────

function HistoryEntry({ entry }: { entry: ApprovalComment }) {
  const actionCfg = ACTION_CONFIG[entry.action];
  const toStatusCfg = STATUS_CONFIG[entry.newStatus];
  const Icon = actionCfg?.icon ?? Clock;

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

  return (
    <div className="relative flex gap-3">
      <div className="relative shrink-0 flex items-start pt-1 z-10">
        <span
          className={`w-6 h-6 rounded-full border flex items-center justify-center ${toStatusCfg?.color ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
        >
          <Icon className="w-3 h-3" />
        </span>
      </div>

      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-white font-medium">
            {actionCfg?.label ?? entry.action}
          </span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border uppercase ${toStatusCfg?.color ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}
          >
            {toStatusCfg?.label ?? entry.newStatus}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {entry.userId}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(entry.createdAt)}
          </span>
        </div>

        {entry.comment && (
          <div className="mt-2 rounded-lg border border-[#1a2332] bg-white/5 px-3 py-2 text-sm text-gray-300 flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-gray-500" />
            <p>{entry.comment}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ApprovalWorkflow({ petitionId, onStatusChange }: ApprovalWorkflowProps) {
  const [status, setStatus] = useState<ApprovalStatus>('draft');
  const [history, setHistory] = useState<ApprovalComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeAction, setActiveAction] = useState<ApprovalAction | null>(null);
  const [comment, setComment] = useState('');
  const [showHistory, setShowHistory] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [currentStatus, hist] = await Promise.all([
        getCurrentApprovalStatus(petitionId),
        getApprovalHistory(petitionId),
      ]);
      setStatus(currentStatus);
      setHistory(hist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar aprovação');
    } finally {
      setLoading(false);
    }
  }, [petitionId]);

  useEffect(() => {
    load();
  }, [load]);

  const allowedActions = getAllowedActions(status);

  async function handleAction(action: ApprovalAction) {
    const cfg = ACTION_CONFIG[action];
    if (cfg.needsComment && !comment.trim()) {
      setError('Insira um comentário explicando as revisões necessárias.');
      return;
    }

    setActing(true);
    setError(null);

    try {
      // Use the direct API for revert_to_draft since it isn't in ACTION_FN
      let result: ApprovalComment;
      if (action === 'revert_to_draft') {
        const res = await fetch('/api/legal/approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            petitionId,
            action: 'revert_to_draft',
            userId: 'advogado',
            comment: comment || '',
          }),
        });
        const data = await res.json() as { entry: ApprovalComment; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Erro');
        result = data.entry;
      } else {
        result = await ACTION_FN[action](petitionId, 'advogado', comment || '');
      }

      const newStatus = result.newStatus;
      setStatus(newStatus);
      onStatusChange?.(newStatus);
      setHistory((prev) => [...prev, result]);
      setActiveAction(null);
      setComment('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao executar ação');
    } finally {
      setActing(false);
    }
  }

  // ── Status badge ────────────────────────────────────────────────────────────

  const statusCfg = STATUS_CONFIG[status];
  const StatusIcon = statusCfg.icon;

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-gray-500 text-sm">
        <Clock className="w-4 h-4 animate-spin" />
        Carregando fluxo de aprovação...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Status + Workflow Diagram */}
      <div className="rounded-lg border border-[#1a2332] bg-white/5 p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold ${statusCfg.color}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusCfg.label}
            </span>
            <span className="text-xs text-gray-500">{statusCfg.description}</span>
          </div>
        </div>

        <WorkflowDiagram current={status} />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      {allowedActions.length > 0 && status !== 'final' && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
            Ações disponíveis
          </p>

          <div className="flex flex-wrap gap-2">
            {allowedActions.map((action) => {
              const cfg = ACTION_CONFIG[action];
              const Icon = cfg.icon;
              const isActive = activeAction === action;

              return (
                <button
                  key={action}
                  onClick={() => {
                    setActiveAction(isActive ? null : action);
                    setError(null);
                    setComment('');
                  }}
                  disabled={acting}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${cfg.color} ${isActive ? 'ring-1 ring-white/20' : ''}`}
                >
                  <Icon className="w-4 h-4" />
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Comment / Confirm Panel */}
          {activeAction && (
            <div className="rounded-lg border border-[#2a3342] bg-white/5 p-4 space-y-3">
              <p className="text-sm font-medium text-white">
                {ACTION_CONFIG[activeAction].label}
              </p>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Comentário
                  {ACTION_CONFIG[activeAction].needsComment && (
                    <span className="text-red-400 ml-0.5">*</span>
                  )}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={
                    activeAction === 'request_revision'
                      ? 'Descreva as revisões necessárias...'
                      : 'Comentário opcional...'
                  }
                  rows={3}
                  className="w-full rounded-lg border border-[#2a3342] bg-[#0a0f1a] text-sm text-white placeholder-gray-600 px-3 py-2 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction(activeAction)}
                  disabled={acting || (ACTION_CONFIG[activeAction].needsComment && !comment.trim())}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${ACTION_CONFIG[activeAction].color}`}
                >
                  {acting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {acting ? 'Processando...' : 'Confirmar'}
                </button>
                <button
                  onClick={() => {
                    setActiveAction(null);
                    setComment('');
                    setError(null);
                  }}
                  className="rounded-lg border border-[#2a3342] px-4 py-2 text-sm text-gray-400 hover:text-white hover:border-[#3a4352] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Final state notice */}
      {status === 'final' && (
        <div className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-3 text-sm text-purple-300">
          <Lock className="w-4 h-4 shrink-0" />
          Documento finalizado. Nenhuma alteração adicional é permitida.
        </div>
      )}

      {/* Approval History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowHistory((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide hover:text-white transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Histórico de aprovações ({history.length})
            {showHistory ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showHistory && (
            <div className="relative pl-1">
              {/* Connector line */}
              <div className="absolute left-[11px] top-0 bottom-0 w-px bg-white/10" />

              <div>
                {[...history]
                  .sort(
                    (a, b) =>
                      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                  )
                  .map((entry) => (
                    <HistoryEntry key={entry.id} entry={entry} />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
