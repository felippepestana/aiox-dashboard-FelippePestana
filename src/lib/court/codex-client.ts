// =============================================================================
// CODEX Client - CNJ Data Lake for Judicial Intelligence
// Access to 386M+ judicial processes for analytics and AI training
// =============================================================================
//
// CODEX is the CNJ's centralized data lake containing comprehensive judicial
// data from all Brazilian courts. Unlike DataJud (which is a public API for
// process consultation), CODEX is designed for:
//
// - Large-scale data extraction for analytics
// - Statistical queries across the entire judiciary
// - Sanitized datasets for AI model training
// - Research and policy planning
//
// The data lake contains:
// - 386M+ judicial process records
// - Structured movement data (1B+ events)
// - Court performance metrics
// - Anonymized party information for research
//
// Access requires institutional authorization from the CNJ.
// Reference: https://www.cnj.jus.br/sistemas/codex/
// =============================================================================

import {
  CourtAdapterError,
  DEFAULT_RETRY_CONFIG,
  withRetry,
} from './court-adapter';

import type { RetryConfig } from './court-adapter';

// ─── Configuration ──────────────────────────────────────────────────────────

interface CodexConfig {
  baseUrl: string;
  timeoutMs: number;
  retry: RetryConfig;
}

const DEFAULT_CODEX_CONFIG: CodexConfig = {
  baseUrl: process.env.CODEX_API_URL || 'https://codex.cnj.jus.br/api/v1',
  timeoutMs: 60000,
  retry: DEFAULT_RETRY_CONFIG,
};

// ─── CODEX Types ────────────────────────────────────────────────────────────

/** Authentication credentials for CODEX access */
export interface CodexCredentials {
  /** Institutional API key issued by CNJ */
  apiKey: string;
  /** Institution identifier */
  institutionId: string;
}

/** Statistical query for aggregated judicial data */
export interface CodexStatisticalQuery {
  /** Target dimension: tribunal, classe, assunto, tempo, etc. */
  dimension: CodexDimension;
  /** Filters to apply */
  filters?: CodexFilter[];
  /** Aggregation type */
  aggregation: CodexAggregation;
  /** Date range for the query */
  dateRange?: {
    start: string;
    end: string;
  };
  /** Maximum number of results */
  limit?: number;
}

export type CodexDimension =
  | 'tribunal'
  | 'classe_processual'
  | 'assunto'
  | 'orgao_julgador'
  | 'tempo_tramitacao'
  | 'movimentos'
  | 'partes'
  | 'localidade';

export type CodexAggregation =
  | 'count'
  | 'avg'
  | 'sum'
  | 'min'
  | 'max'
  | 'percentile'
  | 'histogram';

export interface CodexFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: string | number | string[];
}

/** Result of a statistical query */
export interface CodexStatisticalResult {
  query: CodexStatisticalQuery;
  executedAt: string;
  totalRecords: number;
  data: CodexDataPoint[];
  metadata: {
    executionTimeMs: number;
    cacheTTL: number;
    dataFreshness: string;
  };
}

export interface CodexDataPoint {
  key: string;
  label: string;
  value: number;
  count: number;
  children?: CodexDataPoint[];
}

/** Request for a sanitized dataset extraction */
export interface CodexDatasetRequest {
  /** Name/identifier for the dataset */
  name: string;
  /** Description of the dataset purpose */
  purpose: string;
  /** Columns to include */
  columns: string[];
  /** Filters for data selection */
  filters?: CodexFilter[];
  /** Date range */
  dateRange?: {
    start: string;
    end: string;
  };
  /** Output format */
  format: 'csv' | 'parquet' | 'json';
  /** Whether to anonymize party data */
  anonymize: boolean;
  /** Maximum number of records */
  maxRecords?: number;
}

/** Status of a dataset extraction job */
export interface CodexDatasetJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  recordsProcessed: number;
  totalRecords: number;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
}

/** Court performance metrics from CODEX */
export interface CodexCourtMetrics {
  tribunal: string;
  period: string;
  casesNew: number;
  casesResolved: number;
  casesPending: number;
  avgDurationDays: number;
  congestionRate: number;
  productivityIndex: number;
  clearanceRate: number;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_STATISTICAL_RESULT: CodexStatisticalResult = {
  query: {
    dimension: 'tribunal',
    aggregation: 'count',
  },
  executedAt: new Date().toISOString(),
  totalRecords: 386000000,
  data: [
    { key: 'TJSP', label: 'Tribunal de Justiça de São Paulo', value: 89000000, count: 89000000 },
    { key: 'TJRJ', label: 'Tribunal de Justiça do Rio de Janeiro', value: 32000000, count: 32000000 },
    { key: 'TJMG', label: 'Tribunal de Justiça de Minas Gerais', value: 28000000, count: 28000000 },
    { key: 'TJRS', label: 'Tribunal de Justiça do Rio Grande do Sul', value: 22000000, count: 22000000 },
    { key: 'TJPR', label: 'Tribunal de Justiça do Paraná', value: 18000000, count: 18000000 },
    { key: 'TJBA', label: 'Tribunal de Justiça da Bahia', value: 15000000, count: 15000000 },
    { key: 'TST', label: 'Tribunal Superior do Trabalho', value: 12000000, count: 12000000 },
    { key: 'TRF3', label: 'Tribunal Regional Federal da 3a Região', value: 9000000, count: 9000000 },
    { key: 'TJPE', label: 'Tribunal de Justiça de Pernambuco', value: 8500000, count: 8500000 },
    { key: 'TJSC', label: 'Tribunal de Justiça de Santa Catarina', value: 8000000, count: 8000000 },
  ],
  metadata: {
    executionTimeMs: 2345,
    cacheTTL: 3600,
    dataFreshness: '2024-11-20T00:00:00Z',
  },
};

const MOCK_COURT_METRICS: CodexCourtMetrics[] = [
  {
    tribunal: 'TJSP',
    period: '2024',
    casesNew: 5200000,
    casesResolved: 4800000,
    casesPending: 28000000,
    avgDurationDays: 540,
    congestionRate: 0.78,
    productivityIndex: 0.92,
    clearanceRate: 0.92,
  },
  {
    tribunal: 'TJRJ',
    period: '2024',
    casesNew: 2100000,
    casesResolved: 1900000,
    casesPending: 12000000,
    avgDurationDays: 620,
    congestionRate: 0.82,
    productivityIndex: 0.85,
    clearanceRate: 0.90,
  },
  {
    tribunal: 'TRF4',
    period: '2024',
    casesNew: 800000,
    casesResolved: 750000,
    casesPending: 3200000,
    avgDurationDays: 380,
    congestionRate: 0.72,
    productivityIndex: 0.95,
    clearanceRate: 0.94,
  },
];

// ─── CODEX Client Implementation ────────────────────────────────────────────

/**
 * Client for the CNJ CODEX data lake.
 *
 * CODEX provides access to 386M+ judicial processes for statistical analysis,
 * data extraction, and AI model training. Unlike DataJud (which is designed
 * for individual process consultation), CODEX is optimized for bulk data
 * operations and analytics.
 *
 * Features:
 * - Statistical queries across the entire judiciary
 * - Court performance metrics and benchmarks
 * - Sanitized dataset extraction for AI training
 * - Historical trend analysis
 * - Congestion rate and productivity calculations
 *
 * Access is restricted to authorized institutions and requires a
 * CNJ-issued institutional API key.
 *
 * @example
 * ```typescript
 * const codex = new CodexClient();
 * await codex.authenticate({
 *   apiKey: 'cnj-codex-key-xxx',
 *   institutionId: 'OAB-SP',
 * });
 *
 * const stats = await codex.queryStatistics({
 *   dimension: 'tribunal',
 *   aggregation: 'count',
 *   filters: [{ field: 'classe', operator: 'eq', value: 'Procedimento Comum Cível' }],
 * });
 * ```
 */
export class CodexClient {
  private config: CodexConfig;
  private apiKey: string | null = null;
  private institutionId: string | null = null;
  private authenticated: boolean = false;
  private useMockData: boolean;

  constructor(config?: Partial<CodexConfig>) {
    this.config = { ...DEFAULT_CODEX_CONFIG, ...config };
    this.useMockData = process.env.NODE_ENV === 'development' || !process.env.CODEX_API_URL;
  }

  // ─── Authentication ─────────────────────────────────────────────────────

  /**
   * Authenticate with the CODEX data lake.
   *
   * Requires an institutional API key issued by the CNJ. The key identifies
   * both the institution and the access level (read-only, extraction, etc.).
   *
   * @param credentials - Institutional API key and institution identifier
   */
  async authenticate(credentials: CodexCredentials): Promise<void> {
    if (!credentials.apiKey && !this.useMockData) {
      throw new CourtAdapterError(
        'CODEX requires an institutional API key',
        'datajud',
        'AUTH_FAILED',
      );
    }

    this.apiKey = credentials.apiKey || 'mock-codex-key';
    this.institutionId = credentials.institutionId || 'mock-institution';

    if (this.useMockData) {
      this.authenticated = true;
      return;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Institution-Id': this.institutionId,
        },
        body: JSON.stringify({ institutionId: this.institutionId }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (!response.ok) {
        throw new CourtAdapterError(
          `CODEX authentication failed: HTTP ${response.status}`,
          'datajud',
          'AUTH_FAILED',
          response.status,
        );
      }

      this.authenticated = true;
    } catch (error) {
      if (error instanceof CourtAdapterError) throw error;
      throw new CourtAdapterError(
        `Failed to authenticate with CODEX: ${error instanceof Error ? error.message : String(error)}`,
        'datajud',
        'NETWORK_ERROR',
        undefined,
        true,
      );
    }
  }

  isAuthenticated(): boolean {
    return this.authenticated;
  }

  // ─── Statistical Queries ──────────────────────────────────────────────────

  /**
   * Execute a statistical query against the CODEX data lake.
   *
   * Statistical queries aggregate data across the entire judiciary,
   * providing counts, averages, and distributions by various dimensions.
   *
   * Available dimensions:
   * - `tribunal`: Aggregate by court/tribunal
   * - `classe_processual`: Aggregate by case class (TPU code)
   * - `assunto`: Aggregate by subject matter
   * - `orgao_julgador`: Aggregate by judging body
   * - `tempo_tramitacao`: Duration distribution
   * - `movimentos`: Movement type distribution
   * - `localidade`: Geographic distribution
   *
   * @param query - The statistical query parameters
   * @returns Aggregated results with metadata
   */
  async queryStatistics(query: CodexStatisticalQuery): Promise<CodexStatisticalResult> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return { ...MOCK_STATISTICAL_RESULT, query };
    }

    return withRetry(async () => {
      const response = await this.apiRequest('/statistics/query', {
        method: 'POST',
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new CourtAdapterError(
          `CODEX statistical query failed: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      return (await response.json()) as CodexStatisticalResult;
    }, this.config.retry);
  }

  // ─── Court Metrics ────────────────────────────────────────────────────────

  /**
   * Retrieve performance metrics for one or more courts.
   *
   * Court metrics include:
   * - New cases filed
   * - Cases resolved
   * - Pending case inventory
   * - Average duration (time to resolution)
   * - Congestion rate (pending / (pending + resolved))
   * - Productivity index
   * - Clearance rate (resolved / new)
   *
   * @param tribunals - Array of tribunal codes (e.g., ['TJSP', 'TJRJ'])
   * @param period - Year or year-month (e.g., '2024', '2024-06')
   * @returns Array of court metrics
   */
  async getCourtMetrics(
    tribunals: string[],
    period: string,
  ): Promise<CodexCourtMetrics[]> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return MOCK_COURT_METRICS.filter(
        (m) => tribunals.length === 0 || tribunals.includes(m.tribunal),
      );
    }

    return withRetry(async () => {
      const params = new URLSearchParams({ period });
      for (const t of tribunals) {
        params.append('tribunal', t);
      }

      const response = await this.apiRequest(
        `/metrics/courts?${params.toString()}`,
      );

      if (!response.ok) {
        throw new CourtAdapterError(
          `CODEX metrics query failed: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      return (await response.json()) as CodexCourtMetrics[];
    }, this.config.retry);
  }

  // ─── Dataset Extraction ───────────────────────────────────────────────────

  /**
   * Request a sanitized dataset extraction from CODEX.
   *
   * Dataset extraction is an asynchronous operation. The method returns
   * a job identifier that can be polled for status. Once complete,
   * the dataset can be downloaded as CSV, Parquet, or JSON.
   *
   * All datasets can optionally be anonymized (party names, documents)
   * for research and AI training purposes.
   *
   * @param request - Dataset extraction parameters
   * @returns A job object with status and download URL when complete
   */
  async requestDataset(request: CodexDatasetRequest): Promise<CodexDatasetJob> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return {
        id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        status: 'queued',
        progress: 0,
        recordsProcessed: 0,
        totalRecords: request.maxRecords || 100000,
        createdAt: new Date().toISOString(),
      };
    }

    return withRetry(async () => {
      const response = await this.apiRequest('/datasets/extract', {
        method: 'POST',
        body: JSON.stringify({
          ...request,
          institutionId: this.institutionId,
        }),
      });

      if (!response.ok) {
        throw new CourtAdapterError(
          `CODEX dataset request failed: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      return (await response.json()) as CodexDatasetJob;
    }, this.config.retry);
  }

  /**
   * Check the status of a dataset extraction job.
   *
   * @param jobId - The job identifier from requestDataset()
   * @returns Current job status with progress and download URL
   */
  async getDatasetJobStatus(jobId: string): Promise<CodexDatasetJob> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return {
        id: jobId,
        status: 'completed',
        progress: 100,
        recordsProcessed: 50000,
        totalRecords: 50000,
        downloadUrl: `https://codex.cnj.jus.br/downloads/${jobId}.parquet`,
        createdAt: new Date(Date.now() - 300000).toISOString(),
        completedAt: new Date().toISOString(),
      };
    }

    return withRetry(async () => {
      const response = await this.apiRequest(`/datasets/jobs/${jobId}`);

      if (response.status === 404) {
        throw new CourtAdapterError(
          `Dataset job ${jobId} not found`,
          'datajud',
          'PROCESS_NOT_FOUND',
          404,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to check CODEX job status: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      return (await response.json()) as CodexDatasetJob;
    }, this.config.retry);
  }

  // ─── Trend Analysis ───────────────────────────────────────────────────────

  /**
   * Query time-series trends for judicial data.
   *
   * Returns data points over time for the specified metric and filters.
   * Useful for identifying patterns, seasonal variations, and long-term
   * trends in the judiciary.
   *
   * @param metric - The metric to track ('cases_new', 'cases_resolved', etc.)
   * @param granularity - Time granularity ('month', 'quarter', 'year')
   * @param filters - Optional filters
   * @returns Array of time-series data points
   */
  async queryTrends(
    metric: string,
    granularity: 'month' | 'quarter' | 'year',
    filters?: CodexFilter[],
  ): Promise<CodexDataPoint[]> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return this.mockTrendData(metric, granularity);
    }

    return withRetry(async () => {
      const response = await this.apiRequest('/statistics/trends', {
        method: 'POST',
        body: JSON.stringify({ metric, granularity, filters }),
      });

      if (!response.ok) {
        throw new CourtAdapterError(
          `CODEX trend query failed: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as { dataPoints: CodexDataPoint[] };
      return data.dataPoints;
    }, this.config.retry);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private ensureAuthenticated(): void {
    if (!this.isAuthenticated()) {
      throw new CourtAdapterError(
        'CODEX client is not authenticated. Call authenticate() first.',
        'datajud',
        'AUTH_EXPIRED',
      );
    }
  }

  private async apiRequest(path: string, init?: RequestInit): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;
    return fetch(url, {
      ...init,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Institution-Id': this.institutionId || '',
        ...(init?.headers as Record<string, string>),
      },
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });
  }

  private mockTrendData(metric: string, granularity: string): CodexDataPoint[] {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const baseValue = metric === 'cases_new' ? 500000 : 450000;

    if (granularity === 'month') {
      return months.map((m, i) => ({
        key: `2024-${String(i + 1).padStart(2, '0')}`,
        label: `${m}/2024`,
        value: baseValue + Math.floor(Math.random() * 100000 - 50000),
        count: 1,
      }));
    }

    return [
      { key: '2024-Q1', label: '1o Trimestre 2024', value: baseValue * 3.1, count: 3 },
      { key: '2024-Q2', label: '2o Trimestre 2024', value: baseValue * 2.9, count: 3 },
      { key: '2024-Q3', label: '3o Trimestre 2024', value: baseValue * 3.0, count: 3 },
      { key: '2024-Q4', label: '4o Trimestre 2024', value: baseValue * 2.8, count: 3 },
    ];
  }
}
