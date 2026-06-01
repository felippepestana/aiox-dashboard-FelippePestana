// =============================================================================
// Approval Workflow — Petition approval state machine with Supabase persistence
// =============================================================================

import { snakeToCamel } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export type ApprovalStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'revision_requested'
  | 'final';

export type ApprovalAction =
  | 'submit_for_review'
  | 'approve'
  | 'request_revision'
  | 'finalize'
  | 'revert_to_draft';

export interface ApprovalComment {
  id: string;
  petitionId: string;
  userId: string;
  comment: string;
  action: ApprovalAction;
  previousStatus: ApprovalStatus;
  newStatus: ApprovalStatus;
  createdAt: string;
}

export interface ApprovalState {
  petitionId: string;
  status: ApprovalStatus;
  updatedAt: string;
  updatedBy: string;
}

// ─── Transition Table ─────────────────────────────────────────────────────────

/**
 * Maps (currentStatus, action) → nextStatus. Returns null if the transition
 * is not valid from the current state.
 */
export const TRANSITIONS: Record<ApprovalStatus, Partial<Record<ApprovalAction, ApprovalStatus>>> = {
  draft: {
    submit_for_review: 'pending_review',
  },
  pending_review: {
    approve: 'approved',
    request_revision: 'revision_requested',
  },
  approved: {
    finalize: 'final',
    request_revision: 'revision_requested',
  },
  revision_requested: {
    submit_for_review: 'pending_review',
    revert_to_draft: 'draft',
  },
  final: {
    // terminal state — no transitions allowed
  },
};

export function getAllowedActions(status: ApprovalStatus): ApprovalAction[] {
  return Object.keys(TRANSITIONS[status] ?? {}) as ApprovalAction[];
}

export function getNextStatus(
  current: ApprovalStatus,
  action: ApprovalAction
): ApprovalStatus | null {
  return TRANSITIONS[current]?.[action] ?? null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Workflow API Functions ───────────────────────────────────────────────────

/**
 * Submits a draft petition for review (draft → pending_review).
 */
export async function submitForReview(
  petitionId: string,
  userId = 'advogado',
  comment = ''
): Promise<ApprovalComment> {
  const res = await apiFetch<{ entry: Record<string, unknown> }>('/api/legal/approvals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petitionId, action: 'submit_for_review', userId, comment }),
  });
  return snakeToCamel(res.entry) as unknown as ApprovalComment;
}

/**
 * Approves a petition under review (pending_review → approved).
 */
export async function approveDocument(
  petitionId: string,
  userId = 'advogado',
  comment = 'Aprovado.'
): Promise<ApprovalComment> {
  const res = await apiFetch<{ entry: Record<string, unknown> }>('/api/legal/approvals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petitionId, action: 'approve', userId, comment }),
  });
  return snakeToCamel(res.entry) as unknown as ApprovalComment;
}

/**
 * Requests revisions on a petition (pending_review|approved → revision_requested).
 */
export async function requestRevision(
  petitionId: string,
  comment: string,
  userId = 'advogado'
): Promise<ApprovalComment> {
  const res = await apiFetch<{ entry: Record<string, unknown> }>('/api/legal/approvals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petitionId, action: 'request_revision', userId, comment }),
  });
  return snakeToCamel(res.entry) as unknown as ApprovalComment;
}

/**
 * Finalizes an approved petition (approved → final). No further edits permitted.
 */
export async function finalizeDocument(
  petitionId: string,
  userId = 'advogado',
  comment = 'Documento finalizado.'
): Promise<ApprovalComment> {
  const res = await apiFetch<{ entry: Record<string, unknown> }>('/api/legal/approvals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petitionId, action: 'finalize', userId, comment }),
  });
  return snakeToCamel(res.entry) as unknown as ApprovalComment;
}

/**
 * Retrieves the full approval history for a petition, oldest first.
 */
export async function getApprovalHistory(petitionId: string): Promise<ApprovalComment[]> {
  const res = await apiFetch<{ entries: Record<string, unknown>[] }>(
    `/api/legal/approvals?petitionId=${encodeURIComponent(petitionId)}`
  );
  return res.entries.map((e) => snakeToCamel(e) as unknown as ApprovalComment);
}

/**
 * Returns the current approval status for a petition by inspecting the latest
 * history entry. Falls back to 'draft' if no history exists.
 */
export async function getCurrentApprovalStatus(petitionId: string): Promise<ApprovalStatus> {
  const history = await getApprovalHistory(petitionId);
  if (history.length === 0) return 'draft';
  const sorted = [...history].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return sorted[0].newStatus;
}
