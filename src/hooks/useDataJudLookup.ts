// =============================================================================
// useDataJudLookup — React hook for looking up Brazilian court processes
// via the DataJud public API (CNJ).
//
// Usage:
//   const { loading, result, movements, status, lookup, clear } = useDataJudLookup();
//
//   // Trigger lookup when the user finishes typing a CNJ
//   <input onBlur={(e) => lookup(e.target.value)} />
//
// The hook calls GET /api/legal/court/datajud?cnj=... and returns:
//   result    — DataJudProcessInfo (classe, assuntos, tribunal, orgaoJulgador…)
//   movements — ProcessMovement[] from DataJud (up to 20 most recent)
//   status    — 'idle' | 'loading' | 'found' | 'not_found' | 'error'
//   error     — error message string when status === 'error'
// =============================================================================

'use client';

import { useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Mirrors DataJudProcessInfo from src/lib/court/datajud.ts */
export interface DataJudProcessInfo {
  cnj: string;
  tribunal: string;
  classe: string;
  assuntos: string[];
  orgaoJulgador: string;
  dataAjuizamento: string;
  ultimaAtualizacao: string;
  grau: string;
  nivelSigilo: number;
}

/** Mirrors ProcessMovement from src/types/legal.ts */
export interface DataJudMovimento {
  id: string;
  processId: string;
  date: string;
  description: string;
  type: string;
  source: string;
  isRead: boolean;
}

export type DataJudLookupStatus =
  | 'idle'
  | 'loading'
  | 'found'
  | 'not_found'
  | 'error';

export interface DataJudLookupState {
  /** True while the API call is in progress */
  loading: boolean;
  /** Process info returned by DataJud, or null if not found / not yet searched */
  result: DataJudProcessInfo | null;
  /** Movements returned by DataJud for the process */
  movements: DataJudMovimento[];
  /** Current lookup state */
  status: DataJudLookupStatus;
  /** Error message when status === 'error' */
  error: string | null;
  /**
   * Trigger a DataJud lookup for the given CNJ.
   * No-ops when the CNJ is shorter than 25 characters (not yet complete).
   */
  lookup: (cnj: string) => Promise<void>;
  /** Reset state to idle */
  clear: () => void;
}

// ─── CNJ minimum length guard ─────────────────────────────────────────────────

/** A fully formatted CNJ has 25 chars: NNNNNNN-DD.AAAA.J.TR.OOOO */
const MIN_CNJ_LENGTH = 25;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useDataJudLookup(): DataJudLookupState {
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState<DataJudProcessInfo | null>(null);
  const [movements, setMovements] = useState<DataJudMovimento[]>([]);
  const [status,    setStatus]    = useState<DataJudLookupStatus>('idle');
  const [error,     setError]     = useState<string | null>(null);

  const lookup = useCallback(async (cnj: string) => {
    // Skip if CNJ is not yet fully typed
    if (!cnj || cnj.trim().length < MIN_CNJ_LENGTH) return;

    setLoading(true);
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch(
        `/api/legal/court/datajud?cnj=${encodeURIComponent(cnj.trim())}`,
      );
      const data = await res.json();

      if (res.status === 503) {
        // API key not configured — treat as a server-side configuration issue
        setStatus('error');
        setError(data.message || 'DataJud não está configurado no servidor.');
        return;
      }

      if (res.status === 404 || !data.success) {
        setStatus('not_found');
        setResult(null);
        setMovements([]);
        return;
      }

      if (data.success && data.data) {
        setResult(data.data as DataJudProcessInfo);
        setMovements((data.movements as DataJudMovimento[]) || []);
        setStatus('found');
        return;
      }

      // Fallback: treat any unexpected shape as not found
      setStatus('not_found');
      setResult(null);
      setMovements([]);
    } catch {
      setStatus('error');
      setError('Falha ao consultar DataJud. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setLoading(false);
    setResult(null);
    setMovements([]);
    setStatus('idle');
    setError(null);
  }, []);

  return { loading, result, movements, status, error, lookup, clear };
}
