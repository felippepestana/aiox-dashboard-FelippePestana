// =============================================================================
// DataJud Adapter - CNJ Public API for Judicial Data
// Access to 144M+ judicial processes across all Brazilian courts
// =============================================================================
//
// DataJud is the CNJ's centralized judicial data platform providing public
// access to process data from all branches of the Brazilian judiciary.
//
// API Documentation: https://datajud-wiki.cnj.jus.br/
// Base URL: https://api-publica.datajud.cnj.jus.br/
//
// Key characteristics:
// - Public API with API key authentication (no certificate required)
// - Read-only: no filing capabilities
// - Covers all 5 justice segments and 91 courts
// - Elasticsearch-based query engine
// - Rate limited: varies by plan (public vs. institutional)
// =============================================================================

import type {
  CourtSystem,
  CourtSearchResult,
  FilingReceipt,
  ProcessMovement,
  Publication,
} from '@/types/legal';

import type {
  CourtAdapter,
  CourtCredentials,
  CourtDeadline,
  FilingPayload,
  RetryConfig,
} from './court-adapter';

import {
  CourtAdapterError,
  DEFAULT_RETRY_CONFIG,
  withRetry,
} from './court-adapter';

import { isValidCNJ, parseCNJ } from './cnj-utils';
import { DATAJUD_NOT_CONFIGURED_MESSAGE } from './datajud';
import { getDatajudAlias } from './tribunal-map';

// ─── DataJud Configuration ──────────────────────────────────────────────────

interface DataJudConfig {
  baseUrl: string;
  timeoutMs: number;
  retry: RetryConfig;
  /** Maximum results per page */
  pageSize: number;
  /** Rate limit: milliseconds between requests */
  rateLimitMs: number;
}

const DEFAULT_DATAJUD_CONFIG: DataJudConfig = {
  baseUrl: process.env.DATAJUD_API_URL || 'https://api-publica.datajud.cnj.jus.br',
  timeoutMs: 30000,
  retry: DEFAULT_RETRY_CONFIG,
  pageSize: 10,
  rateLimitMs: 1000,
};

// ─── DataJud Response Types ─────────────────────────────────────────────────

/**
 * DataJud uses Elasticsearch as its backend, returning results in the
 * standard Elasticsearch hits format.
 */
interface DataJudSearchResponse {
  hits: {
    total: {
      value: number;
      relation: string;
    };
    hits: DataJudHit[];
  };
}

interface DataJudHit {
  _index: string;
  _id: string;
  _score: number;
  _source: DataJudProcess;
}

/**
 * A single process record from DataJud.
 * Structure follows CNJ Resolução 331/2020 data model.
 */
interface DataJudProcess {
  /** Número único CNJ */
  numeroProcesso: string;
  /** Classe processual according to TPU (Tabelas Processuais Unificadas) */
  classe: {
    codigo: number;
    nome: string;
  };
  /** Sistema processual de origem */
  sistema: {
    codigo: number;
    nome: string;
  };
  /** Formato do processo */
  formato: {
    codigo: number;
    nome: string;
  };
  /** Tribunal de origem */
  tribunal: string;
  /** Data de ajuizamento */
  dataAjuizamento: string;
  /** Data da última atualização */
  dataHoraUltimaAtualizacao: string;
  /** Grau de jurisdição */
  grau: string;
  /** Nível de sigilo (0 = público) */
  nivelSigilo: number;
  /** Órgão julgador */
  orgaoJulgador: {
    codigo: number;
    nome: string;
    codigoMunicipioIBGE: number;
  };
  /** Assuntos processuais */
  assuntos: Array<{
    codigo: number;
    nome: string;
  }>;
  /** Movimentações processuais */
  movimentos: DataJudMovimento[];
}

interface DataJudMovimento {
  codigo: number;
  nome: string;
  dataHora: string;
  complementosTabelados: Array<{
    codigo: number;
    nome: string;
    valor: number;
    descricao: string;
  }>;
}

// ─── DataJud Adapter Implementation ─────────────────────────────────────────

/**
 * CourtAdapter implementation for the CNJ DataJud public API.
 *
 * DataJud provides read-only access to 144M+ judicial processes across all
 * Brazilian courts. It uses Elasticsearch as its query backend and requires
 * an API key for authentication.
 *
 * Limitations:
 * - Read-only: fileDocument() is not supported
 * - No deadline information available
 * - No publication monitoring (DJE not included)
 * - Rate limited to prevent abuse
 *
 * @example
 * ```typescript
 * const datajud = new DataJudAdapter();
 * await datajud.authenticate({
 *   system: 'datajud',
 *   username: 'user@example.com',
 *   apiKey: 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV...',
 * });
 *
 * const result = await datajud.searchProcess('0001234-56.2024.8.26.0100');
 * ```
 */
export class DataJudAdapter implements CourtAdapter {
  readonly name: CourtSystem = 'datajud';

  private config: DataJudConfig;
  private apiKey: string | null = null;
  private authenticated: boolean = false;
  private lastRequestTime: number = 0;

  constructor(config?: Partial<DataJudConfig>) {
    this.config = { ...DEFAULT_DATAJUD_CONFIG, ...config };
  }

  // ─── Authentication ─────────────────────────────────────────────────────

  /**
   * Authenticate with DataJud using an API key.
   *
   * DataJud uses a simple API key authentication scheme. The key is passed
   * in the `Authorization` header with the `APIKey` prefix.
   *
   * Public API keys are available from: https://datajud-wiki.cnj.jus.br/
   *
   * @param credentials - Must include apiKey field
   */
  async authenticate(credentials: CourtCredentials): Promise<void> {
    if (credentials.system !== 'datajud') {
      throw new CourtAdapterError(
        `DataJud adapter received credentials for ${credentials.system}`,
        'datajud',
        'AUTH_FAILED',
      );
    }

    if (!credentials.apiKey) {
      throw new CourtAdapterError(
        DATAJUD_NOT_CONFIGURED_MESSAGE,
        'datajud',
        'NOT_CONFIGURED',
        503,
      );
    }

    this.apiKey = credentials.apiKey;
    this.authenticated = true;

    // Validate the API key with a lightweight request
    try {
      const response = await fetch(
        `${this.config.baseUrl}/api_publica_stj/_search`,
        {
          method: 'POST',
          headers: {
            'Authorization': `APIKey ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ size: 0 }),
          signal: AbortSignal.timeout(this.config.timeoutMs),
        },
      );

      if (response.status === 401 || response.status === 403) {
        this.authenticated = false;
        this.apiKey = null;
        throw new CourtAdapterError(
          'Invalid DataJud API key',
          'datajud',
          'AUTH_FAILED',
          response.status,
        );
      }
    } catch (error) {
      // The key was never validated — do not leave the adapter authenticated
      this.authenticated = false;
      this.apiKey = null;
      if (error instanceof CourtAdapterError) throw error;

      throw new CourtAdapterError(
        `Failed to validate DataJud API key: ${error instanceof Error ? error.message : String(error)}`,
        'datajud',
        'NETWORK_ERROR',
        undefined,
        true,
      );
    }
  }

  isAuthenticated(): boolean {
    return this.authenticated && this.apiKey !== null;
  }

  // ─── Process Search ───────────────────────────────────────────────────────

  /**
   * Search for a process by CNJ number in the DataJud database.
   *
   * DataJud stores processes in tribunal-specific Elasticsearch indices.
   * The adapter determines the correct index from the CNJ number's tribunal
   * code and executes a targeted search.
   *
   * @param cnj - Unified CNJ process number
   * @returns Search result or null if not found
   */
  async searchProcess(cnj: string): Promise<CourtSearchResult | null> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'datajud',
        'INVALID_CNJ',
      );
    }

    const index = this.resolveIndexFromCNJ(cnj);

    return withRetry(async () => {
      await this.enforceRateLimit();

      const response = await this.elasticSearch(index, {
        query: {
          match: {
            numeroProcesso: cnj,
          },
        },
        size: 1,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new CourtAdapterError(
            'DataJud rate limit exceeded. Please wait before retrying.',
            'datajud',
            'RATE_LIMITED',
            429,
            true,
          );
        }
        throw new CourtAdapterError(
          `DataJud search failed: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as DataJudSearchResponse;

      if (data.hits.total.value === 0) {
        return null;
      }

      const process = data.hits.hits[0]._source;
      return this.mapToSearchResult(process);
    }, this.config.retry);
  }

  /**
   * Execute a custom DataJud query across one or more tribunals.
   * Useful for advanced searches by classe, assunto, or date range.
   *
   * @param tribunal - Tribunal code (e.g., 'TJSP', 'STJ')
   * @param query - Elasticsearch query body
   * @param page - Page number (0-based)
   * @returns Array of search results
   */
  async searchByQuery(
    tribunal: string,
    query: Record<string, unknown>,
    page: number = 0,
  ): Promise<{ results: CourtSearchResult[]; total: number }> {
    this.ensureAuthenticated();

    // Validate the tribunal before the rate-limit wait — an unsupported
    // alias should fail fast instead of sleeping first.
    const alias = getDatajudAlias(tribunal);
    if (!alias) {
      throw new CourtAdapterError(
        `Tribunal ${tribunal} sem cobertura na API pública do DataJud`,
        'datajud',
        'TRIBUNAL_NOT_SUPPORTED',
        422,
      );
    }
    const index = `api_publica_${alias}`;

    await this.enforceRateLimit();

    const response = await this.elasticSearch(index, {
      ...query,
      size: this.config.pageSize,
      from: page * this.config.pageSize,
    });

    if (!response.ok) {
      throw new CourtAdapterError(
        `DataJud query failed: HTTP ${response.status}`,
        'datajud',
        'SYSTEM_UNAVAILABLE',
        response.status,
        true,
      );
    }

    const data = (await response.json()) as DataJudSearchResponse;
    return {
      results: data.hits.hits.map((hit) => this.mapToSearchResult(hit._source)),
      total: data.hits.total.value,
    };
  }

  // ─── Movements ────────────────────────────────────────────────────────────

  /**
   * Retrieve movements for a process from DataJud.
   *
   * DataJud includes movements as nested objects within the process document.
   * This method fetches the process and extracts its movements.
   *
   * @param cnj - The CNJ process number
   * @param since - Optional date filter
   */
  async getMovements(cnj: string, since?: string): Promise<ProcessMovement[]> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'datajud',
        'INVALID_CNJ',
      );
    }

    const index = this.resolveIndexFromCNJ(cnj);

    return withRetry(async () => {
      await this.enforceRateLimit();

      const response = await this.elasticSearch(index, {
        query: { match: { numeroProcesso: cnj } },
        _source: ['movimentos', 'numeroProcesso'],
        size: 1,
      });

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to fetch DataJud movements: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as DataJudSearchResponse;

      if (data.hits.total.value === 0) {
        throw new CourtAdapterError(
          `Process ${cnj} not found in DataJud`,
          'datajud',
          'PROCESS_NOT_FOUND',
          404,
        );
      }

      const process = data.hits.hits[0]._source;
      let movements = process.movimentos.map((m) => this.mapMovement(m, cnj));

      if (since) {
        const sinceDate = new Date(since).getTime();
        movements = movements.filter((m) => new Date(m.date).getTime() >= sinceDate);
      }

      return movements.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }, this.config.retry);
  }

  // ─── Unsupported Operations ───────────────────────────────────────────────

  /**
   * Filing is not supported by DataJud.
   * DataJud is a read-only public data API.
   * @throws CourtAdapterError always
   */
  async fileDocument(_cnj: string, _document: FilingPayload): Promise<FilingReceipt> {
    throw new CourtAdapterError(
      'DataJud is a read-only API and does not support document filing. Use PJe, e-SAJ, e-Proc, or PROJUDI for filing.',
      'datajud',
      'FILING_REJECTED',
    );
  }

  /**
   * Deadline tracking is not available through DataJud.
   * Returns an empty array.
   */
  async getDeadlines(_cnj: string): Promise<CourtDeadline[]> {
    return [];
  }

  /**
   * Publication monitoring is not available through DataJud.
   * Returns an empty array. Use PJe or e-SAJ for DJE publications.
   */
  async getPublications(_oab: string, _since?: string): Promise<Publication[]> {
    return [];
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private ensureAuthenticated(): void {
    if (!this.isAuthenticated()) {
      throw new CourtAdapterError(
        'DataJud adapter is not authenticated. Call authenticate() first.',
        'datajud',
        'AUTH_EXPIRED',
      );
    }
  }

  /**
   * Enforce rate limiting by waiting if the minimum interval between
   * requests has not elapsed.
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.config.rateLimitMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.rateLimitMs - elapsed),
      );
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Execute an Elasticsearch query against a DataJud index.
   */
  private async elasticSearch(
    index: string,
    body: Record<string, unknown>,
  ): Promise<Response> {
    const url = `${this.config.baseUrl}/${index}/_search`;
    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `APIKey ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });
  }

  /**
   * Resolve the DataJud Elasticsearch index from a CNJ number.
   * @throws CourtAdapterError when the tribunal has no public DataJud index
   */
  private resolveIndexFromCNJ(cnj: string): string {
    const index = parseCNJ(cnj)?.datajudIndex;
    if (!index) {
      throw new CourtAdapterError(
        `Tribunal do processo ${cnj} sem cobertura na API pública do DataJud`,
        'datajud',
        'TRIBUNAL_NOT_SUPPORTED',
        422,
      );
    }
    return index;
  }

  /**
   * Map a DataJud process document to the unified CourtSearchResult.
   */
  private mapToSearchResult(process: DataJudProcess): CourtSearchResult {
    const lastMov = process.movimentos[0];
    return {
      cnj: process.numeroProcesso,
      title: `${process.classe.nome} - ${process.assuntos.map((a) => a.nome).join(', ')}`,
      court: process.tribunal,
      vara: process.orgaoJulgador.nome,
      comarca: process.orgaoJulgador.nome,
      status: lastMov?.nome || 'Dados disponíveis',
      lastMovement: lastMov
        ? `${lastMov.nome} (${new Date(lastMov.dataHora).toLocaleDateString('pt-BR')})`
        : undefined,
      source: 'datajud',
    };
  }

  /**
   * Map a DataJud movement to the unified ProcessMovement type.
   */
  private mapMovement(mov: DataJudMovimento, cnj: string): ProcessMovement {
    const complementos = mov.complementosTabelados
      .map((c) => c.descricao)
      .filter(Boolean)
      .join('; ');

    return {
      id: `datajud-${mov.codigo}-${mov.dataHora}`,
      processId: cnj,
      date: mov.dataHora,
      description: complementos ? `${mov.nome} - ${complementos}` : mov.nome,
      type: String(mov.codigo),
      source: 'datajud',
      isRead: false,
    };
  }

}
