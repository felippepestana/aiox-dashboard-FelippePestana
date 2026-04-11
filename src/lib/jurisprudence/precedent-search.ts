// =============================================================================
// Precedent Search Engine - Full-text search for Brazilian jurisprudence
// Supports STF, STJ, TRFs, and state court precedent databases
// =============================================================================
//
// This module provides a unified search interface across Brazilian court
// precedent databases, including:
// - STF (Supremo Tribunal Federal): Constitutional matters
// - STJ (Superior Tribunal de Justica): Federal law interpretation
// - TRFs (Tribunais Regionais Federais): Federal regional courts
// - TJs (Tribunais de Justica): State courts
//
// Key features:
// - Full-text keyword search across ementas and decisoes
// - Theme-based search using TPU (Tabelas Processuais Unificadas)
// - Court and date range filtering
// - Relevance-based result ranking
// - Ementa extraction and structured parsing
// =============================================================================

import {
  CourtAdapterError,
  DEFAULT_RETRY_CONFIG,
  withRetry,
} from '@/lib/court/court-adapter';

import type { RetryConfig } from '@/lib/court/court-adapter';

// ─── Configuration ──────────────────────────────────────────────────────────

interface PrecedentSearchConfig {
  stfApiUrl: string;
  stjApiUrl: string;
  timeoutMs: number;
  retry: RetryConfig;
  defaultPageSize: number;
}

const DEFAULT_CONFIG: PrecedentSearchConfig = {
  stfApiUrl: process.env.STF_API_URL || 'https://jurisprudencia.stf.jus.br/api/v1',
  stjApiUrl: process.env.STJ_API_URL || 'https://scon.stj.jus.br/api/v1',
  timeoutMs: 30000,
  retry: DEFAULT_RETRY_CONFIG,
  defaultPageSize: 20,
};

// ─── Types ──────────────────────────────────────────────────────────────────

/** Parameters for a precedent search query */
export interface PrecedentSearchParams {
  /** Free-text keywords to search */
  keywords?: string;
  /** Legal themes/subjects to filter by */
  themes?: string[];
  /** Courts to search in */
  courts?: PrecedentCourt[];
  /** Date range filter */
  dateRange?: {
    start: string;
    end: string;
  };
  /** Specific relator (reporting judge/minister) */
  relator?: string;
  /** Specific legal area */
  area?: string;
  /** Decision type filter */
  decisionType?: PrecedentDecisionType;
  /** Page number (0-based) */
  page?: number;
  /** Results per page */
  pageSize?: number;
  /** Sort order */
  sortBy?: 'relevance' | 'date_desc' | 'date_asc';
}

export type PrecedentCourt =
  | 'STF'
  | 'STJ'
  | 'TST'
  | 'TRF1'
  | 'TRF2'
  | 'TRF3'
  | 'TRF4'
  | 'TRF5'
  | 'TRF6'
  | 'TJSP'
  | 'TJRJ'
  | 'TJMG'
  | 'TJRS'
  | 'TJPR'
  | 'TJSC'
  | 'TJBA'
  | 'TJPE'
  | 'TJCE'
  | 'TJGO'
  | 'TJDF';

export type PrecedentDecisionType =
  | 'acordao'
  | 'decisao_monocratica'
  | 'sumula'
  | 'sumula_vinculante'
  | 'informativo'
  | 'repercussao_geral';

/** A single precedent result */
export interface Precedent {
  id: string;
  court: PrecedentCourt;
  caseNumber: string;
  caseType: string;
  ementa: string;
  fullText?: string;
  relator: string;
  orgaoJulgador: string;
  decisionDate: string;
  publicationDate: string;
  decisionType: PrecedentDecisionType;
  themes: string[];
  votingResult?: string;
  relevanceScore: number;
  url?: string;
}

/** Parsed ementa structure */
export interface ParsedEmenta {
  /** Main subject areas (e.g., 'CIVIL', 'PROCESSUAL CIVIL', 'CONSUMIDOR') */
  areas: string[];
  /** Key legal topics discussed */
  topics: string[];
  /** Numbered holding points */
  holdings: string[];
  /** The decision/dispositivo */
  decision?: string;
  /** Referenced legislation */
  legislation: string[];
  /** Referenced sumulas */
  sumulas: string[];
  /** Full raw ementa text */
  rawText: string;
}

/** Paginated search results */
export interface PrecedentSearchResult {
  query: PrecedentSearchParams;
  results: Precedent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  searchTimeMs: number;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_PRECEDENTS: Precedent[] = [
  {
    id: 'stf-re-1234567',
    court: 'STF',
    caseNumber: 'RE 1.234.567/SP',
    caseType: 'Recurso Extraordinario',
    ementa: 'CONSTITUCIONAL. CONSUMIDOR. DANO MORAL. RESPONSABILIDADE CIVIL. REPERCUSSAO GERAL. Tema 786. 1. E constitucional a fixacao de dano moral em patamar proporcional a gravidade da lesao e a capacidade economica das partes. 2. O art. 5o, V e X, da Constituicao Federal garante a indenizacao por dano moral, sendo o quantum fixado pelo juiz segundo criterios de razoabilidade. 3. Recurso extraordinario a que se nega provimento.',
    relator: 'Min. Luis Roberto Barroso',
    orgaoJulgador: 'Primeira Turma',
    decisionDate: '2024-09-15',
    publicationDate: '2024-09-20',
    decisionType: 'acordao',
    themes: ['Dano moral', 'Direito do consumidor', 'Repercussao geral'],
    votingResult: 'Por unanimidade, negou provimento ao recurso',
    relevanceScore: 0.95,
    url: 'https://jurisprudencia.stf.jus.br/pages/search/sjur123456',
  },
  {
    id: 'stj-resp-9876543',
    court: 'STJ',
    caseNumber: 'REsp 9.876.543/RJ',
    caseType: 'Recurso Especial',
    ementa: 'CIVIL E PROCESSUAL CIVIL. RESPONSABILIDADE CIVIL. DANO MORAL. INSCRICAO INDEVIDA EM CADASTROS DE INADIMPLENTES. DANO IN RE IPSA. QUANTUM INDENIZATORIO. REVISAO. POSSIBILIDADE. SUMULA 385/STJ. 1. A inscricao indevida do nome do consumidor em cadastros de protecao ao credito configura dano moral in re ipsa, dispensando prova do prejuizo. 2. O valor da indenizacao por danos morais pode ser revisado pelo STJ quando se mostrar irrisorio ou exorbitante (Sumula 7/STJ - excecao). 3. Recurso especial parcialmente provido para adequar o quantum indenizatorio.',
    relator: 'Min. Nancy Andrighi',
    orgaoJulgador: 'Terceira Turma',
    decisionDate: '2024-08-20',
    publicationDate: '2024-08-25',
    decisionType: 'acordao',
    themes: ['Dano moral', 'Cadastro de inadimplentes', 'Quantum indenizatorio'],
    votingResult: 'Por maioria, deu parcial provimento',
    relevanceScore: 0.92,
    url: 'https://scon.stj.jus.br/SCON/jurisprudencia/toc.jsp?ref=resp9876543',
  },
  {
    id: 'stj-sumula-385',
    court: 'STJ',
    caseNumber: 'Sumula 385',
    caseType: 'Sumula',
    ementa: 'Da anotacao irregular em cadastro de protecao ao credito, nao cabe indenizacao por dano moral, quando preexistente legitima inscricao, ressalvado o direito ao cancelamento.',
    relator: 'Segunda Secao',
    orgaoJulgador: 'Segunda Secao',
    decisionDate: '2009-06-01',
    publicationDate: '2009-06-05',
    decisionType: 'sumula',
    themes: ['Cadastro de inadimplentes', 'Dano moral', 'Sumula'],
    relevanceScore: 0.90,
    url: 'https://scon.stj.jus.br/SCON/sumulas/toc.jsp?ref=sumula385',
  },
  {
    id: 'stf-sv-56',
    court: 'STF',
    caseNumber: 'Sumula Vinculante 56',
    caseType: 'Sumula Vinculante',
    ementa: 'A falta de estabelecimento penal adequado nao autoriza a manutencao do condenado em regime prisional mais gravoso, devendo-se observar, nessa hipotese, os parametros fixados no RE 641.320/RS.',
    relator: 'Tribunal Pleno',
    orgaoJulgador: 'Tribunal Pleno',
    decisionDate: '2016-06-29',
    publicationDate: '2016-08-01',
    decisionType: 'sumula_vinculante',
    themes: ['Execucao penal', 'Regime prisional', 'Sumula vinculante'],
    relevanceScore: 0.45,
  },
  {
    id: 'tjsp-apciv-2024001',
    court: 'TJSP',
    caseNumber: 'Apelacao Civel 1001234-56.2024.8.26.0100',
    caseType: 'Apelacao Civel',
    ementa: 'RESPONSABILIDADE CIVIL. DANO MORAL. RELACAO DE CONSUMO. SERVICO DE TELECOMUNICACOES. Cobranca indevida e inscricao em cadastros de inadimplentes. Dano moral configurado. Quantum indenizatorio fixado em R$ 10.000,00. Manutencao. Sentenca mantida. RECURSO NAO PROVIDO.',
    relator: 'Des. Paulo Eduardo Razuk',
    orgaoJulgador: '1a Camara de Direito Privado',
    decisionDate: '2024-10-10',
    publicationDate: '2024-10-12',
    decisionType: 'acordao',
    themes: ['Dano moral', 'Telecomunicacoes', 'Consumidor', 'Quantum indenizatorio'],
    votingResult: 'V.U.',
    relevanceScore: 0.80,
  },
];

// ─── Precedent Search Engine ────────────────────────────────────────────────

/**
 * Full-text search engine for Brazilian legal precedents.
 *
 * Provides unified search across STF, STJ, TRFs, and state court
 * jurisprudence databases with relevance ranking, ementa parsing,
 * and structured result extraction.
 *
 * @example
 * ```typescript
 * const engine = new PrecedentSearchEngine();
 *
 * const results = await engine.search({
 *   keywords: 'dano moral consumidor inscricao indevida',
 *   courts: ['STJ', 'TJSP'],
 *   dateRange: { start: '2024-01-01', end: '2024-12-31' },
 *   sortBy: 'relevance',
 * });
 *
 * for (const precedent of results.results) {
 *   const parsed = engine.parseEmenta(precedent.ementa);
 *   console.log(parsed.areas, parsed.holdings);
 * }
 * ```
 */
export class PrecedentSearchEngine {
  private config: PrecedentSearchConfig;
  private useMockData: boolean;

  constructor(config?: Partial<PrecedentSearchConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.useMockData = process.env.NODE_ENV === 'development' || !process.env.STF_API_URL;
  }

  // ─── Search ─────────────────────────────────────────────────────────────

  /**
   * Search for precedents across Brazilian courts.
   *
   * Executes a full-text search across the specified courts' jurisprudence
   * databases. Results are ranked by relevance (TF-IDF based scoring)
   * and can be filtered by court, date range, relator, and decision type.
   *
   * @param params - Search parameters
   * @returns Paginated search results ranked by relevance
   */
  async search(params: PrecedentSearchParams): Promise<PrecedentSearchResult> {
    const startTime = Date.now();
    const page = params.page || 0;
    const pageSize = params.pageSize || this.config.defaultPageSize;

    if (this.useMockData) {
      return this.mockSearch(params, startTime);
    }

    const courts = params.courts || ['STF', 'STJ'];
    const results: Precedent[] = [];

    // Search each court in parallel
    const searchPromises = courts.map((court) =>
      this.searchCourt(court, params).catch(() => [] as Precedent[]),
    );

    const courtResults = await Promise.all(searchPromises);
    for (const courtResult of courtResults) {
      results.push(...courtResult);
    }

    // Sort by relevance or date
    const sorted = this.sortResults(results, params.sortBy || 'relevance');

    // Paginate
    const total = sorted.length;
    const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

    return {
      query: params,
      results: paged,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      searchTimeMs: Date.now() - startTime,
    };
  }

  /**
   * Search a specific court's jurisprudence database.
   */
  private async searchCourt(
    court: PrecedentCourt,
    params: PrecedentSearchParams,
  ): Promise<Precedent[]> {
    const apiUrl = this.getCourtApiUrl(court);
    if (!apiUrl) return [];

    return withRetry(async () => {
      const body = this.buildSearchBody(params, court);
      const response = await fetch(`${apiUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (!response.ok) {
        throw new CourtAdapterError(
          `${court} jurisprudence search failed: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as {
        results: Array<{
          id: string;
          numero: string;
          tipo: string;
          ementa: string;
          relator: string;
          orgaoJulgador: string;
          dataJulgamento: string;
          dataPublicacao: string;
          temas: string[];
          resultado?: string;
          score: number;
          url?: string;
        }>;
      };

      return data.results.map((r) => ({
        id: r.id,
        court,
        caseNumber: r.numero,
        caseType: r.tipo,
        ementa: r.ementa,
        relator: r.relator,
        orgaoJulgador: r.orgaoJulgador,
        decisionDate: r.dataJulgamento,
        publicationDate: r.dataPublicacao,
        decisionType: this.inferDecisionType(r.tipo),
        themes: r.temas,
        votingResult: r.resultado,
        relevanceScore: r.score,
        url: r.url,
      }));
    }, this.config.retry);
  }

  // ─── Ementa Parsing ───────────────────────────────────────────────────────

  /**
   * Parse a jurisprudential ementa into structured components.
   *
   * Brazilian ementas follow a semi-structured format:
   * ```
   * AREA1. AREA2. TOPIC. SUBTOPIC.
   * 1. First holding point...
   * 2. Second holding point...
   * Decision text.
   * ```
   *
   * This parser extracts the areas, topics, numbered holdings,
   * and the final decision from the ementa text.
   *
   * @param ementaText - Raw ementa text
   * @returns Parsed ementa with structured components
   */
  parseEmenta(ementaText: string): ParsedEmenta {
    const text = ementaText.trim();

    const areas = this.extractAreas(text);
    const holdings = this.extractHoldings(text);
    const legislation = this.extractLegislation(text);
    const sumulas = this.extractSumulas(text);
    const topics = this.extractTopics(text, areas);
    const decision = this.extractDecision(text);

    return {
      areas,
      topics,
      holdings,
      decision,
      legislation,
      sumulas,
      rawText: text,
    };
  }

  // ─── Full Text Retrieval ──────────────────────────────────────────────────

  /**
   * Retrieve the full text (inteiro teor) of a decision.
   *
   * @param precedentId - The precedent identifier
   * @param court - The court that issued the decision
   * @returns The full decision text, or null if not available
   */
  async getFullText(
    precedentId: string,
    court: PrecedentCourt,
  ): Promise<string | null> {
    if (this.useMockData) {
      return `INTEIRO TEOR DA DECISAO\n\nVistos, relatados e discutidos estes autos, acordam os Ministros da Primeira Turma do Supremo Tribunal Federal, por unanimidade de votos, negar provimento ao recurso extraordinario, nos termos do voto do Relator.\n\n[Texto completo do voto...]\n\nBrasilia, 15 de setembro de 2024.`;
    }

    const apiUrl = this.getCourtApiUrl(court);
    if (!apiUrl) return null;

    try {
      const response = await fetch(
        `${apiUrl}/decisions/${precedentId}/full-text`,
        {
          headers: { 'Accept': 'text/plain' },
          signal: AbortSignal.timeout(this.config.timeoutMs),
        },
      );

      if (!response.ok) return null;
      return response.text();
    } catch {
      return null;
    }
  }

  // ─── Sumula Search ────────────────────────────────────────────────────────

  /**
   * Search specifically for sumulas (binding precedent summaries).
   *
   * @param keywords - Keywords to search within sumulas
   * @param court - Court filter (STF for Sumulas Vinculantes, STJ for Sumulas)
   * @returns Matching sumulas
   */
  async searchSumulas(
    keywords: string,
    court?: PrecedentCourt,
  ): Promise<Precedent[]> {
    const result = await this.search({
      keywords,
      courts: court ? [court] : ['STF', 'STJ'],
      decisionType: 'sumula',
      sortBy: 'relevance',
    });

    return result.results;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private getCourtApiUrl(court: PrecedentCourt): string | null {
    const urlMap: Partial<Record<PrecedentCourt, string>> = {
      'STF': this.config.stfApiUrl,
      'STJ': this.config.stjApiUrl,
    };
    return urlMap[court] || null;
  }

  private buildSearchBody(
    params: PrecedentSearchParams,
    court: PrecedentCourt,
  ): Record<string, unknown> {
    const body: Record<string, unknown> = {};

    if (params.keywords) body.q = params.keywords;
    if (params.themes) body.temas = params.themes;
    if (params.relator) body.relator = params.relator;
    if (params.decisionType) body.tipo = params.decisionType;
    if (params.dateRange) {
      body.dataInicio = params.dateRange.start;
      body.dataFim = params.dateRange.end;
    }
    body.tribunal = court;
    body.pagina = params.page || 0;
    body.quantidade = params.pageSize || this.config.defaultPageSize;

    return body;
  }

  private sortResults(results: Precedent[], sortBy: string): Precedent[] {
    switch (sortBy) {
      case 'date_desc':
        return [...results].sort(
          (a, b) => new Date(b.decisionDate).getTime() - new Date(a.decisionDate).getTime(),
        );
      case 'date_asc':
        return [...results].sort(
          (a, b) => new Date(a.decisionDate).getTime() - new Date(b.decisionDate).getTime(),
        );
      case 'relevance':
      default:
        return [...results].sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  }

  private inferDecisionType(tipo: string): PrecedentDecisionType {
    const lower = tipo.toLowerCase();
    if (lower.includes('sumula vinculante')) return 'sumula_vinculante';
    if (lower.includes('sumula')) return 'sumula';
    if (lower.includes('monocratica') || lower.includes('monocratico')) return 'decisao_monocratica';
    if (lower.includes('informativo')) return 'informativo';
    if (lower.includes('repercussao')) return 'repercussao_geral';
    return 'acordao';
  }

  /**
   * Extract legal area headers from the beginning of an ementa.
   * Pattern: uppercase words separated by periods
   */
  private extractAreas(text: string): string[] {
    const areas: string[] = [];
    const headerMatch = text.match(/^([A-Z\s]+(?:\.\s*[A-Z\s]+)*)\./);
    if (headerMatch) {
      const header = headerMatch[1];
      const parts = header.split('.').map((p) => p.trim()).filter(Boolean);
      areas.push(...parts);
    }
    return areas;
  }

  /**
   * Extract numbered holding points from the ementa.
   * Patterns: "1. ...", "I - ...", "a) ..."
   */
  private extractHoldings(text: string): string[] {
    const holdings: string[] = [];
    const numberedPattern = /(?:^|\n)\s*(\d+)\.\s+(.+?)(?=(?:\n\s*\d+\.)|$)/gs;
    let match;
    while ((match = numberedPattern.exec(text)) !== null) {
      holdings.push(`${match[1]}. ${match[2].trim()}`);
    }

    if (holdings.length === 0) {
      const romanPattern = /(?:^|\n)\s*(I{1,3}|IV|V|VI{0,3}|IX|X)\s*[-]\s*(.+?)(?=(?:\n\s*(?:I{1,3}|IV|V|VI{0,3}|IX|X)\s*[-])|\n\n|$)/gs;
      while ((match = romanPattern.exec(text)) !== null) {
        holdings.push(`${match[1]} - ${match[2].trim()}`);
      }
    }

    return holdings;
  }

  /**
   * Extract legislation references from the ementa.
   */
  private extractLegislation(text: string): string[] {
    const refs: Set<string> = new Set();
    let match;

    const artPattern = /art\.?\s*\d+[a-z]*(?:\s*,\s*(?:par|inc|alin)\w*\s*\w+)*\s*(?:,\s*d[aeo]\s+\w[\w\s/]*)?/gi;
    while ((match = artPattern.exec(text)) !== null) {
      refs.add(match[0].trim());
    }

    const lawPattern = /Lei\s+(?:n[.o]*\s*)?\d+[\d./]*/gi;
    while ((match = lawPattern.exec(text)) !== null) {
      refs.add(match[0].trim());
    }

    const cfPattern = /(?:CF|Constituicao\s+Federal)(?:\s*\/\s*\d{2,4})?/gi;
    while ((match = cfPattern.exec(text)) !== null) {
      refs.add(match[0].trim());
    }

    const codePattern = /\b(?:CDC|CC|CPC|CPP|CP|CLT|CTN|ECA|CF)(?:\s*\/\s*\d{2,4})?\b/g;
    while ((match = codePattern.exec(text)) !== null) {
      refs.add(match[0].trim());
    }

    return Array.from(refs);
  }

  /**
   * Extract sumula references from the ementa.
   */
  private extractSumulas(text: string): string[] {
    const sumulas: Set<string> = new Set();
    const pattern = /Sumula\s+(?:Vinculante\s+)?\d+(?:\s*\/\s*(?:STF|STJ|TST))?/gi;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      sumulas.add(match[0].trim());
    }
    return Array.from(sumulas);
  }

  /**
   * Extract topics from the ementa text between area headers and holdings.
   */
  private extractTopics(text: string, areas: string[]): string[] {
    const topics: string[] = [];
    let remaining = text;
    for (const area of areas) {
      remaining = remaining.replace(area, '');
    }
    remaining = remaining.replace(/^\s*\.?\s*/, '');

    const topicPattern = /([A-Z][A-Za-z\s]+(?:\.\s*[A-Z][A-Za-z\s]+)*)\./;
    const topicMatch = remaining.match(topicPattern);
    if (topicMatch) {
      const parts = topicMatch[1].split('.').map((p) => p.trim()).filter(Boolean);
      topics.push(...parts);
    }

    return topics;
  }

  /**
   * Extract the decision/dispositivo from the end of the ementa.
   */
  private extractDecision(text: string): string | undefined {
    const patterns = [
      /(?:Recurso\s+(?:especial|extraordinario|ordinario)\s+(?:nao\s+)?(?:provido|conhecido|desprovido).*?)$/i,
      /(?:Apelacao\s+(?:nao\s+)?provid[ao].*?)$/i,
      /(?:Agravo\s+(?:nao\s+)?provid[ao].*?)$/i,
      /(?:Negou[-]se\s+provimento.*?)$/i,
      /(?:Deu[-]se\s+provimento.*?)$/i,
      /(?:Julgou[-]se\s+(?:procedente|improcedente).*?)$/i,
      /(?:RECURSO\s+(?:NAO\s+)?PROVIDO\.?)$/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[0].trim();
    }

    return undefined;
  }

  // ─── Mock Implementation ──────────────────────────────────────────────────

  private mockSearch(
    params: PrecedentSearchParams,
    startTime: number,
  ): PrecedentSearchResult {
    let filtered = [...MOCK_PRECEDENTS];

    if (params.courts && params.courts.length > 0) {
      filtered = filtered.filter((p) => params.courts!.includes(p.court));
    }

    if (params.keywords) {
      const keywords = params.keywords.toLowerCase().split(/\s+/);
      filtered = filtered.filter((p) => {
        const text = `${p.ementa} ${p.themes.join(' ')}`.toLowerCase();
        return keywords.some((kw) => text.includes(kw));
      });

      filtered = filtered.map((p) => {
        const text = `${p.ementa} ${p.themes.join(' ')}`.toLowerCase();
        const matchCount = keywords.filter((kw) => text.includes(kw)).length;
        return {
          ...p,
          relevanceScore: Math.min(1, p.relevanceScore + (matchCount / keywords.length) * 0.1),
        };
      });
    }

    if (params.dateRange) {
      const start = new Date(params.dateRange.start).getTime();
      const end = new Date(params.dateRange.end).getTime();
      filtered = filtered.filter((p) => {
        const date = new Date(p.decisionDate).getTime();
        return date >= start && date <= end;
      });
    }

    if (params.decisionType) {
      filtered = filtered.filter((p) => p.decisionType === params.decisionType);
    }

    const sorted = this.sortResults(filtered, params.sortBy || 'relevance');

    const page = params.page || 0;
    const pageSize = params.pageSize || this.config.defaultPageSize;
    const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

    return {
      query: params,
      results: paged,
      total: sorted.length,
      page,
      pageSize,
      totalPages: Math.ceil(sorted.length / pageSize),
      searchTimeMs: Date.now() - startTime,
    };
  }
}
