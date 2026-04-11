// =============================================================================
// Court Adapter - Unified Interface for Brazilian Court System Integration
// Supports PJe, e-SAJ, e-Proc, PROJUDI, DataJud, and manual systems
// =============================================================================

import type {
  CourtSystem,
  CourtSearchResult,
  FilingReceipt,
  ProcessMovement,
  Publication,
} from '@/types/legal';

// ─── Authentication Credentials ─────────────────────────────────────────────

/**
 * Credentials required to authenticate with a Brazilian court system.
 * Different systems accept different credential types:
 * - PJe: certificate-based (ICP-Brasil A3 token or A1 file)
 * - e-SAJ: username/password
 * - e-Proc: certificate + username/password
 * - PROJUDI: username/password
 * - DataJud: API key (public API)
 */
export interface CourtCredentials {
  system: CourtSystem;
  username: string;
  password?: string;
  /** Base64-encoded PKCS#12 certificate for ICP-Brasil authentication */
  certificate?: string;
  /** API key for services that use key-based auth (e.g., DataJud) */
  apiKey?: string;
}

// ─── Filing Payload ─────────────────────────────────────────────────────────

/**
 * Payload for filing a document (petição) to a court system.
 * Follows the MNI (Modelo Nacional de Interoperabilidade) structure
 * for entregarManifestacaoProcessual.
 */
export interface FilingPayload {
  /** Type of petition being filed (e.g., 'inicial', 'contestacao', 'recurso') */
  petitionType: string;
  /** Main text content of the petition in HTML or plain text */
  content: string;
  /** Attached documents encoded as base64 */
  documents: FilingDocument[];
}

export interface FilingDocument {
  /** Display name of the document */
  name: string;
  /** Base64-encoded document content */
  data: string;
  /** MIME type (e.g., 'application/pdf', 'image/jpeg') */
  mimeType: string;
}

// ─── Court Deadline ─────────────────────────────────────────────────────────

/**
 * A procedural deadline returned from a court system.
 * Deadlines can be fatal (prazo fatal) or judicial (prazo judicial).
 */
export interface CourtDeadline {
  /** The CNJ process number this deadline belongs to */
  processId: string;
  /** Human-readable title of the deadline */
  title: string;
  /** ISO 8601 date string for the deadline */
  dueDate: string;
  /** Type classification: 'fatal', 'judicial', 'internal', 'hearing', 'mediation' */
  type: string;
  /** Source system that reported this deadline */
  source: string;
}

// ─── Adapter Error ──────────────────────────────────────────────────────────

/**
 * Structured error type for court adapter operations.
 * Provides enough context for retry logic and user messaging.
 */
export class CourtAdapterError extends Error {
  constructor(
    message: string,
    public readonly system: CourtSystem,
    public readonly code: CourtErrorCode,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'CourtAdapterError';
  }
}

export type CourtErrorCode =
  | 'AUTH_FAILED'
  | 'AUTH_EXPIRED'
  | 'CERTIFICATE_INVALID'
  | 'PROCESS_NOT_FOUND'
  | 'SYSTEM_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'FILING_REJECTED'
  | 'INVALID_CNJ'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'UNKNOWN';

// ─── Unified Court Adapter Interface ────────────────────────────────────────

/**
 * Unified interface for interacting with Brazilian court systems.
 *
 * All Brazilian court systems implement some variant of MNI
 * (Modelo Nacional de Interoperabilidade) defined by the CNJ.
 * This adapter provides a normalized interface across PJe, e-SAJ,
 * e-Proc, PROJUDI, and DataJud systems.
 *
 * Usage:
 * ```typescript
 * const adapter = createCourtAdapter('pje');
 * await adapter.authenticate(credentials);
 * const result = await adapter.searchProcess('0000000-00.0000.0.00.0000');
 * ```
 */
export interface CourtAdapter {
  /** The court system this adapter connects to */
  readonly name: CourtSystem;

  /**
   * Authenticate with the court system.
   * Must be called before any other operation.
   * @throws CourtAdapterError with code AUTH_FAILED or CERTIFICATE_INVALID
   */
  authenticate(credentials: CourtCredentials): Promise<void>;

  /**
   * Search for a process by its CNJ unified number.
   * CNJ format: NNNNNNN-DD.AAAA.J.TR.OOOO
   * @param cnj - The CNJ process number
   * @returns The search result or null if not found
   */
  searchProcess(cnj: string): Promise<CourtSearchResult | null>;

  /**
   * Retrieve procedural movements (andamentos) for a given process.
   * Movements are returned in reverse chronological order.
   * @param cnj - The CNJ process number
   * @param since - Optional ISO 8601 date to filter movements after
   */
  getMovements(cnj: string, since?: string): Promise<ProcessMovement[]>;

  /**
   * File a document (peticionar) in a process.
   * Maps to MNI entregarManifestacaoProcessual operation.
   * @param cnj - The CNJ process number
   * @param document - The filing payload with petition content and attachments
   * @returns A receipt with the protocol number and timestamp
   */
  fileDocument(cnj: string, document: FilingPayload): Promise<FilingReceipt>;

  /**
   * Retrieve pending deadlines (prazos) for a process.
   * @param cnj - The CNJ process number
   */
  getDeadlines(cnj: string): Promise<CourtDeadline[]>;

  /**
   * Retrieve publications from the Diário de Justiça Eletrônico (DJE)
   * matching a given OAB registration number.
   * @param oab - The OAB number (e.g., 'SP123456')
   * @param since - Optional ISO 8601 date to filter publications after
   */
  getPublications(oab: string, since?: string): Promise<Publication[]>;

  /**
   * Check whether the adapter is currently authenticated and the token/session
   * is still valid.
   */
  isAuthenticated(): boolean;
}

// ─── CNJ Number Validation ──────────────────────────────────────────────────

/**
 * Validates a CNJ process number format.
 * Expected format: NNNNNNN-DD.AAAA.J.TR.OOOO
 * Where:
 * - N: sequential number (7 digits)
 * - D: verification digits (2 digits)
 * - A: year (4 digits)
 * - J: justice segment (1 digit)
 * - TR: court/tribunal (2 digits)
 * - O: origin/vara (4 digits)
 */
export function isValidCNJ(cnj: string): boolean {
  const pattern = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
  return pattern.test(cnj);
}

/**
 * Extracts components from a CNJ process number.
 */
export function parseCNJ(cnj: string): CNJComponents | null {
  if (!isValidCNJ(cnj)) return null;

  const parts = cnj.replace(/[-.]/g, '');
  return {
    sequencial: parts.substring(0, 7),
    digito: parts.substring(7, 9),
    ano: parts.substring(9, 13),
    justica: parts.substring(13, 14),
    tribunal: parts.substring(14, 16),
    origem: parts.substring(16, 20),
  };
}

export interface CNJComponents {
  sequencial: string;
  digito: string;
  ano: string;
  /** Segmento de justiça: 1=STF, 2=CNJ, 5=Trabalho, 8=Estadual, etc. */
  justica: string;
  /** Código do tribunal (e.g., '26' = TJSP) */
  tribunal: string;
  /** Código da comarca/vara de origem */
  origem: string;
}

// ─── Retry Configuration ────────────────────────────────────────────────────

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

/**
 * Execute a function with exponential backoff retry logic.
 * Only retries on errors marked as retryable.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<T> {
  let lastError: Error | undefined;
  let delay = config.baseDelayMs;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof CourtAdapterError && !error.retryable) {
        throw error;
      }

      if (attempt === config.maxRetries) {
        throw lastError;
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw lastError;
}
