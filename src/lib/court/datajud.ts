// =============================================================================
// DataJud API Client
// Thin client for the CNJ public judiciary API (https://datajud-wiki.cnj.jus.br)
// =============================================================================
//
// DataJud provides read-only access to 144M+ judicial processes across all
// Brazilian courts via an Elasticsearch-based REST API.
//
// Base URL:  https://api-publica.datajud.cnj.jus.br
// Auth:      APIKey header — `Authorization: APIKey <key>`
// Endpoints: POST /api_publica_{tribunal}/_search  (ES query body)
//
// This module exposes three functions:
//   searchByCNJ     — find a process by its CNJ number
//   getMovements    — retrieve process movements (andamentos)
//   getProcessMeta  — fetch process metadata (classe, assuntos, tribunal…)
// =============================================================================

import type { ProcessMovement } from '@/types/legal';
import { isValidCNJ, parseCNJ } from './cnj-utils';
import { getDatajudAlias } from './tribunal-map';

// ─── Constants ────────────────────────────────────────────────────────────────

const DATAJUD_BASE_URL =
  process.env.DATAJUD_API_URL || 'https://api-publica.datajud.cnj.jus.br';

const DEFAULT_TIMEOUT_MS = 30_000;

// Retry only transient failures: CNJ throttling (429), server errors (5xx)
// and network/abort errors. Client errors (400/401/404) never retry.
const RETRY_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 1_000;
const RETRY_MAX_DELAY_MS = 8_000;

// ─── Response shape types ─────────────────────────────────────────────────────

interface DataJudMovimento {
  codigo: number;
  nome: string;
  dataHora: string;
  complementosTabelados?: Array<{
    codigo: number;
    nome: string;
    valor?: number;
    descricao: string;
  }>;
}

interface DataJudProcessSource {
  numeroProcesso: string;
  classe: { codigo: number; nome: string };
  sistema?: { codigo: number; nome: string };
  formato?: { codigo: number; nome: string };
  tribunal: string;
  dataAjuizamento: string;
  dataHoraUltimaAtualizacao?: string;
  grau?: string;
  nivelSigilo?: number;
  orgaoJulgador?: {
    codigo?: number;
    nome: string;
    codigoMunicipioIBGE?: number;
  };
  assuntos?: Array<{ codigo: number; nome: string }>;
  movimentos: DataJudMovimento[];
}

interface DataJudSearchResponse {
  hits: {
    total: { value: number; relation: string };
    hits: Array<{
      _index: string;
      _id: string;
      _score: number;
      _source: DataJudProcessSource;
      /** Sort values — present when the query sorts (search_after cursor) */
      sort?: Array<number | string>;
    }>;
  };
}

// ─── Public result types ──────────────────────────────────────────────────────

export interface DataJudProcessInfo {
  cnj: string;
  tribunal: string;
  classe: string;
  /** TPU code of the procedural class (classe.codigo) */
  classeCodigo: number;
  assuntos: string[];
  orgaoJulgador: string;
  /** DataJud code of the judging body, when present (orgaoJulgador.codigo) */
  orgaoJulgadorCodigo?: number;
  dataAjuizamento: string;
  ultimaAtualizacao: string;
  grau: string;
  nivelSigilo: number;
}

/** Parameters for a class + judging-body search (paginated via search_after). */
export interface ClassOrgaoSearchParams {
  /** Tribunal sigla, e.g. 'TJSP', 'TRT2', 'TRE-GO' */
  tribunal: string;
  /** TPU procedural-class code (classe.codigo) */
  classeCodigo: number;
  /** Judging-body code (orgaoJulgador.codigo) */
  orgaoJulgadorCodigo: number;
  /** Page size (1–100, default 20) */
  size?: number;
  /** Sort cursor returned by the previous page (nextSearchAfter) */
  searchAfter?: Array<number | string>;
}

/** One page of a class + judging-body search. */
export interface ClassOrgaoSearchResult {
  processes: DataJudProcessInfo[];
  /** Total matching processes reported by the index */
  total: number;
  /** Cursor for the next page, or null when this was the last page */
  nextSearchAfter: Array<number | string> | null;
}

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function datajudSearch(
  index: string,
  query: Record<string, unknown>,
  apiKey: string,
): Promise<DataJudSearchResponse> {
  let lastError: unknown;
  let delay = RETRY_BASE_DELAY_MS;

  for (let attempt = 0; attempt < RETRY_MAX_ATTEMPTS; attempt++) {
    try {
      return await datajudSearchOnce(index, query, apiKey);
    } catch (error) {
      lastError = error;
      if (!isRetryableError(error) || attempt === RETRY_MAX_ATTEMPTS - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * 2, RETRY_MAX_DELAY_MS);
    }
  }

  throw lastError;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof DataJudError) {
    return error.status === 429 || (error.status !== undefined && error.status >= 500);
  }
  // Network failures and aborted (timed-out) requests are worth retrying
  return error instanceof TypeError ||
    (error instanceof Error && error.name === 'AbortError');
}

async function datajudSearchOnce(
  index: string,
  query: Record<string, unknown>,
  apiKey: string,
): Promise<DataJudSearchResponse> {
  const url = `${DATAJUD_BASE_URL}/${index}/_search`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `APIKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 429) {
        throw new DataJudError('Limite de requisições do DataJud atingido', 429);
      }
      const body = await res.json().catch(() => ({}));
      throw new DataJudError(
        body.error?.reason || `DataJud HTTP ${res.status}`,
        res.status,
      );
    }

    return res.json() as Promise<DataJudSearchResponse>;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolve the DataJud index for a CNJ or throw a DataJudError that routes
 * can surface directly (422 = tribunal exists but has no public index).
 */
function requireIndexForCNJ(cnj: string): string {
  if (!isValidCNJ(cnj)) {
    throw new Error(`CNJ inválido: "${cnj}". Formato esperado: NNNNNNN-DD.AAAA.J.TR.OOOO`);
  }
  const parsed = parseCNJ(cnj)!;
  if (!parsed.datajudIndex) {
    throw new DataJudError(
      `Tribunal ${parsed.tribunalName} sem cobertura na API pública do DataJud`,
      422,
    );
  }
  return parsed.datajudIndex;
}

// ─── API key helpers ──────────────────────────────────────────────────────────

/** Shared user-facing message for a missing DataJud API key (503 responses). */
export const DATAJUD_NOT_CONFIGURED_MESSAGE =
  'DATAJUD_API_KEY não configurada no servidor — obtenha uma chave em https://datajud-wiki.cnj.jus.br/';

/** Returns the DataJud API key from the environment, or null when not set. */
export function getDatajudApiKey(): string | null {
  return process.env.DATAJUD_API_KEY || null;
}

// ─── Custom error ─────────────────────────────────────────────────────────────

export class DataJudError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'DataJudError';
  }
}

// ─── Exported functions ───────────────────────────────────────────────────────

/**
 * Search for a process in DataJud by its CNJ number.
 *
 * @param cnj    - CNJ process number (e.g., '0001234-56.2024.8.26.0100')
 * @param apiKey - DataJud API key from env
 * @returns Process metadata, or null if not found
 *
 * @throws DataJudError on HTTP/network errors
 * @throws Error when CNJ format is invalid
 */
export async function searchByCNJ(
  cnj: string,
  apiKey: string,
): Promise<DataJudProcessInfo | null> {
  const index = requireIndexForCNJ(cnj);

  const data = await datajudSearch(
    index,
    {
      query: { match: { numeroProcesso: cnj } },
      size: 1,
    },
    apiKey,
  );

  if (data.hits.total.value === 0 || data.hits.hits.length === 0) {
    return null;
  }

  return mapProcessInfo(data.hits.hits[0]._source);
}

/**
 * Fetch process movements (andamentos processuais) from DataJud.
 *
 * Movements are returned in reverse chronological order (newest first).
 *
 * @param cnj       - CNJ process number
 * @param apiKey    - DataJud API key
 * @param processId - Internal process ID to associate movements with
 * @param since     - Optional ISO 8601 date; only movements on or after this date
 * @returns Array of ProcessMovement objects compatible with the legal store
 *
 * @throws DataJudError when the process is not found or HTTP errors occur
 */
export async function getMovements(
  cnj: string,
  apiKey: string,
  processId: string,
  since?: string,
): Promise<ProcessMovement[]> {
  const index = requireIndexForCNJ(cnj);

  const data = await datajudSearch(
    index,
    {
      query: { match: { numeroProcesso: cnj } },
      _source: ['movimentos', 'numeroProcesso'],
      size: 1,
    },
    apiKey,
  );

  if (data.hits.total.value === 0 || data.hits.hits.length === 0) {
    throw new DataJudError(`Processo ${cnj} não encontrado no DataJud`, 404);
  }

  const source    = data.hits.hits[0]._source;
  let movements   = (source.movimentos || []).map((m) =>
    mapMovement(m, processId),
  );

  if (since) {
    const sinceMs = new Date(since).getTime();
    movements = movements.filter((m) => new Date(m.date).getTime() >= sinceMs);
  }

  return movements.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * Fetch full process metadata from DataJud including movements.
 *
 * @param cnj    - CNJ process number
 * @param apiKey - DataJud API key
 * @returns Full process source document, or null when not found
 */
export async function getProcessMeta(
  cnj: string,
  apiKey: string,
): Promise<DataJudProcessInfo | null> {
  return searchByCNJ(cnj, apiKey);
}

/**
 * Search DataJud by procedural class + judging body, paginated with
 * Elasticsearch `search_after` (query pattern adapted from
 * busca-processos-judiciais, MIT — João Textor).
 *
 * Pass the returned `nextSearchAfter` back as `params.searchAfter` to fetch
 * the next page; a null cursor means the last page was reached.
 *
 * @throws DataJudError 422 when the tribunal has no public DataJud index
 * @throws DataJudError on HTTP errors (429 rate limit is retried first)
 */
export async function searchByClassAndOrgao(
  params: ClassOrgaoSearchParams,
  apiKey: string,
): Promise<ClassOrgaoSearchResult> {
  const alias = getDatajudAlias(params.tribunal);
  if (!alias) {
    throw new DataJudError(
      `Tribunal ${params.tribunal} sem cobertura na API pública do DataJud`,
      422,
    );
  }

  const size = Math.min(Math.max(params.size ?? 20, 1), 100);

  const query: Record<string, unknown> = {
    size,
    query: {
      bool: {
        must: [
          { match: { 'classe.codigo': params.classeCodigo } },
          { match: { 'orgaoJulgador.codigo': params.orgaoJulgadorCodigo } },
        ],
      },
    },
    sort: [{ '@timestamp': { order: 'asc' } }],
  };
  if (params.searchAfter && params.searchAfter.length > 0) {
    query.search_after = params.searchAfter;
  }

  const data = await datajudSearch(`api_publica_${alias}`, query, apiKey);

  const hits = data.hits.hits;
  const lastSort = hits.length > 0 ? hits[hits.length - 1].sort : undefined;

  return {
    processes: hits.map((h) => mapProcessInfo(h._source)),
    total: data.hits.total.value,
    // A short page means the result set is exhausted — no next cursor
    nextSearchAfter: hits.length === size && lastSort ? lastSort : null,
  };
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapProcessInfo(source: DataJudProcessSource): DataJudProcessInfo {
  return {
    cnj:             source.numeroProcesso,
    tribunal:        source.tribunal,
    classe:          source.classe.nome,
    classeCodigo:    source.classe.codigo,
    assuntos:        (source.assuntos || []).map((a) => a.nome),
    orgaoJulgadorCodigo: source.orgaoJulgador?.codigo,
    orgaoJulgador:   source.orgaoJulgador?.nome || '',
    dataAjuizamento: source.dataAjuizamento,
    ultimaAtualizacao: source.dataHoraUltimaAtualizacao || source.dataAjuizamento,
    grau:            source.grau || 'G1',
    nivelSigilo:     source.nivelSigilo ?? 0,
  };
}

// INVARIANT: `type` (String(codigo)) and `date` (raw dataHora) form the
// `${type}-${date}` dedup key persisted in the movements table. Changing
// either format re-inserts every historical movement on the next sync.
function mapMovement(
  mov: DataJudMovimento,
  processId: string,
): ProcessMovement {
  const complementos = (mov.complementosTabelados || [])
    .map((c) => c.descricao)
    .filter(Boolean)
    .join('; ');

  return {
    id:          `datajud-${mov.codigo}-${mov.dataHora}`,
    processId,
    date:        mov.dataHora,
    description: complementos ? `${mov.nome} — ${complementos}` : mov.nome,
    type:        String(mov.codigo),
    source:      'datajud',
    isRead:      false,
  };
}
