// =============================================================================
// Document Versioning — Petition Version Control with Supabase persistence
// =============================================================================

import { snakeToCamel } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DiffLine {
  type: 'unchanged' | 'added' | 'removed';
  content: string;
  lineNumber: number;
}

export interface DocumentDiff {
  lines: DiffLine[];
  additions: number;
  removals: number;
}

export interface DocumentVersion {
  id: string;
  petitionId: string;
  version: number;
  content: string;
  createdAt: string;
  createdBy: string;
  changeDescription: string;
  diff: DocumentDiff | null;
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

// ─── Diff Engine ─────────────────────────────────────────────────────────────

/**
 * Computes a simple line-by-line diff between two text strings.
 * Uses a greedy LCS-based approach keeping output readable.
 */
export function computeDiff(oldContent: string, newContent: string): DocumentDiff {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  // Build LCS table
  const m = oldLines.length;
  const n = newLines.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to produce diff
  const diffLines: DiffLine[] = [];
  let i = m;
  let j = n;
  const segments: Array<{ type: 'unchanged' | 'added' | 'removed'; content: string }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      segments.unshift({ type: 'unchanged', content: oldLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      segments.unshift({ type: 'added', content: newLines[j - 1] });
      j--;
    } else {
      segments.unshift({ type: 'removed', content: oldLines[i - 1] });
      i--;
    }
  }

  let lineNumber = 0;
  let additions = 0;
  let removals = 0;

  for (const seg of segments) {
    lineNumber++;
    diffLines.push({ ...seg, lineNumber });
    if (seg.type === 'added') additions++;
    if (seg.type === 'removed') removals++;
  }

  return { lines: diffLines, additions, removals };
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Creates a new version for a petition and persists it via API.
 */
export async function createVersion(
  petitionId: string,
  content: string,
  description: string,
  createdBy = 'advogado'
): Promise<DocumentVersion> {
  const res = await apiFetch<{ version: Record<string, unknown> }>('/api/legal/versions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petitionId, content, description, createdBy }),
  });
  return snakeToCamel(res.version) as unknown as DocumentVersion;
}

/**
 * Retrieves the full version history for a petition, newest first.
 */
export async function getVersionHistory(petitionId: string): Promise<DocumentVersion[]> {
  const res = await apiFetch<{ versions: Record<string, unknown>[] }>(
    `/api/legal/versions?petitionId=${encodeURIComponent(petitionId)}`
  );
  return res.versions.map((v) => snakeToCamel(v) as unknown as DocumentVersion);
}

/**
 * Gets a specific version by version number.
 */
export async function getVersion(
  petitionId: string,
  versionNumber: number
): Promise<DocumentVersion | null> {
  const versions = await getVersionHistory(petitionId);
  return versions.find((v) => v.version === versionNumber) ?? null;
}

/**
 * Restores a petition's content to a specific version.
 * Optionally creates a new version entry recording the restore.
 */
export async function restoreVersion(
  petitionId: string,
  versionNumber: number
): Promise<DocumentVersion> {
  const res = await apiFetch<{ version: Record<string, unknown> }>('/api/legal/versions', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ petitionId, version: versionNumber }),
  });
  return snakeToCamel(res.version) as unknown as DocumentVersion;
}
