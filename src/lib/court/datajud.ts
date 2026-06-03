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
import { isValidCNJ, parseCNJ, getDatajudIndex } from './cnj-utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const DATAJUD_BASE_URL =
  process.env.DATAJUD_API_URL || 'https://api-publica.datajud.cnj.jus.br';

const DEFAULT_TIMEOUT_MS = 30_000;

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
    }>;
  };
}

// ─── Public result types ──────────────────────────────────────────────────────

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

// ─── Core fetch helper ────────────────────────────────────────────────────────

async function datajudSearch(
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
  if (!isValidCNJ(cnj)) {
    throw new Error(`CNJ inválido: "${cnj}". Formato esperado: NNNNNNN-DD.AAAA.J.TR.OOOO`);
  }

  const parsed = parseCNJ(cnj)!;
  const index  = parsed.datajudIndex;

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
  if (!isValidCNJ(cnj)) {
    throw new Error(`CNJ inválido: "${cnj}". Formato esperado: NNNNNNN-DD.AAAA.J.TR.OOOO`);
  }

  const parsed = parseCNJ(cnj)!;
  const index  = parsed.datajudIndex;

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

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapProcessInfo(source: DataJudProcessSource): DataJudProcessInfo {
  return {
    cnj:             source.numeroProcesso,
    tribunal:        source.tribunal,
    classe:          source.classe.nome,
    assuntos:        (source.assuntos || []).map((a) => a.nome),
    orgaoJulgador:   source.orgaoJulgador?.nome || '',
    dataAjuizamento: source.dataAjuizamento,
    ultimaAtualizacao: source.dataHoraUltimaAtualizacao || source.dataAjuizamento,
    grau:            source.grau || 'G1',
    nivelSigilo:     source.nivelSigilo ?? 0,
  };
}

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
