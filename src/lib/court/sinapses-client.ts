// =============================================================================
// SINAPSES Client - CNJ Artificial Intelligence Platform
// Access to 150+ judicial AI models for case analysis and classification
// =============================================================================
//
// SINAPSES is the CNJ's centralized AI platform that provides judicial AI
// models as a service to courts and authorized legal professionals.
//
// Platform capabilities:
// - 150+ pre-trained AI models for judicial tasks
// - Case classification by subject matter and class
// - Precedent matching and similarity analysis
// - Document type identification
// - Sentiment analysis of legal texts
// - Named entity recognition for legal documents
// - Automatic summarization of judicial decisions
//
// Models are developed by courts and shared through SINAPSES:
// - VICTOR (STF): Repercussao geral theme classification
// - ATHOS (STJ): Case clustering and similarity
// - PROMETEU (TJMG): Sentencing prediction
// - BERNA (TJRS): Document classification
// - Various others from TRTs, TRFs, and state courts
//
// Reference: https://www.cnj.jus.br/tecnologia-da-informacao-e-comunicacao/sinapses/
// =============================================================================

import {
  CourtAdapterError,
  DEFAULT_RETRY_CONFIG,
  withRetry,
} from './court-adapter';

import type { RetryConfig } from './court-adapter';

// ─── Configuration ──────────────────────────────────────────────────────────

interface SinapsesConfig {
  baseUrl: string;
  timeoutMs: number;
  retry: RetryConfig;
}

const DEFAULT_SINAPSES_CONFIG: SinapsesConfig = {
  baseUrl: process.env.SINAPSES_API_URL || 'https://sinapses.cnj.jus.br/api/v1',
  timeoutMs: 60000,
  retry: DEFAULT_RETRY_CONFIG,
};

// ─── SINAPSES Types ─────────────────────────────────────────────────────────

/** Authentication credentials for SINAPSES */
export interface SinapsesCredentials {
  /** Institutional API key issued by CNJ */
  apiKey: string;
  /** Institution identifier */
  institutionId: string;
}

/** Available AI model in the SINAPSES catalog */
export interface SinapsesModel {
  id: string;
  name: string;
  version: string;
  description: string;
  provider: string;
  category: SinapsesModelCategory;
  inputType: 'text' | 'document' | 'structured';
  accuracy: number;
  lastUpdated: string;
  isActive: boolean;
}

export type SinapsesModelCategory =
  | 'classification'
  | 'similarity'
  | 'extraction'
  | 'summarization'
  | 'prediction'
  | 'ner'
  | 'sentiment';

/** Request to run an AI model prediction */
export interface SinapsesPredictionRequest {
  modelId: string;
  input: {
    text?: string;
    document?: string;
    structured?: Record<string, unknown>;
  };
  options?: {
    /** Number of top results to return */
    topK?: number;
    /** Minimum confidence threshold */
    minConfidence?: number;
    /** Whether to include explanation/reasoning */
    explain?: boolean;
  };
}

/** Result from an AI model prediction */
export interface SinapsesPredictionResult {
  modelId: string;
  modelName: string;
  predictions: SinapsesPrediction[];
  processingTimeMs: number;
  explanation?: string;
}

export interface SinapsesPrediction {
  label: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

/** Precedent analysis request */
export interface PrecedentAnalysisRequest {
  /** Text of the case to analyze */
  caseText: string;
  /** Court to search for precedents (optional, searches all if omitted) */
  court?: string;
  /** Legal area filter */
  area?: string;
  /** Maximum number of precedents to return */
  maxResults?: number;
  /** Minimum similarity threshold (0.0 - 1.0) */
  minSimilarity?: number;
}

/** Result of precedent analysis */
export interface PrecedentAnalysisResult {
  query: string;
  totalFound: number;
  precedents: MatchedPrecedent[];
  themes: string[];
  suggestedClassifications: SinapsesPrediction[];
  processingTimeMs: number;
}

export interface MatchedPrecedent {
  id: string;
  court: string;
  caseNumber: string;
  ementa: string;
  similarity: number;
  date: string;
  relator: string;
  themes: string[];
  decision: string;
}

/** Case classification result */
export interface CaseClassification {
  classeProcessual: SinapsesPrediction[];
  assuntos: SinapsesPrediction[];
  repercussaoGeral: SinapsesPrediction[];
  complexidade: SinapsesPrediction[];
  urgencia: SinapsesPrediction[];
}

/** Legal entity extracted from text via NER */
export interface LegalEntity {
  /** Entity type: PERSON, ORGANIZATION, LAW, MONETARY, DATE, OAB, PROCESS_NUMBER */
  type: string;
  /** The extracted text */
  text: string;
  /** Start character position in the source text */
  start: number;
  /** End character position in the source text */
  end: number;
  /** Role or context of the entity (e.g., 'autor', 'advogado', 'fundamentacao') */
  role: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_MODELS: SinapsesModel[] = [
  {
    id: 'victor-rg-v3',
    name: 'VICTOR - Repercussao Geral',
    version: '3.2.1',
    description: 'Classifica recursos extraordinarios por temas de repercussao geral do STF. Identifica automaticamente o tema mais provavel dentre os 1.200+ temas catalogados.',
    provider: 'STF',
    category: 'classification',
    inputType: 'text',
    accuracy: 0.89,
    lastUpdated: '2024-08-15T00:00:00Z',
    isActive: true,
  },
  {
    id: 'athos-similarity-v2',
    name: 'ATHOS - Similaridade de Casos',
    version: '2.5.0',
    description: 'Motor de similaridade para identificacao de precedentes do STJ. Compara textos juridicos usando embeddings especializados para o dominio juridico brasileiro.',
    provider: 'STJ',
    category: 'similarity',
    inputType: 'text',
    accuracy: 0.85,
    lastUpdated: '2024-09-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'prometeu-sentencing-v1',
    name: 'PROMETEU - Predicao de Sentencas',
    version: '1.8.3',
    description: 'Modelo preditivo para desfechos processuais com base em historico de decisoes. Analisa padroes de julgamento e estima probabilidades.',
    provider: 'TJMG',
    category: 'prediction',
    inputType: 'text',
    accuracy: 0.78,
    lastUpdated: '2024-07-20T00:00:00Z',
    isActive: true,
  },
  {
    id: 'berna-docclass-v4',
    name: 'BERNA - Classificacao de Documentos',
    version: '4.1.0',
    description: 'Identifica tipos de documentos juridicos (peticao inicial, contestacao, recurso, sentenca, etc.) a partir do texto.',
    provider: 'TJRS',
    category: 'classification',
    inputType: 'document',
    accuracy: 0.92,
    lastUpdated: '2024-10-05T00:00:00Z',
    isActive: true,
  },
  {
    id: 'hermes-ner-v2',
    name: 'HERMES - Extracao de Entidades',
    version: '2.3.0',
    description: 'Reconhecimento de entidades nomeadas em textos juridicos: partes, advogados, juizes, valores monetarios, datas, legislacao citada.',
    provider: 'CNJ',
    category: 'ner',
    inputType: 'text',
    accuracy: 0.87,
    lastUpdated: '2024-11-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'diana-summarizer-v1',
    name: 'DIANA - Sumarizacao Juridica',
    version: '1.5.2',
    description: 'Gera sumarios (ementas) automaticos para decisoes e acordaos judiciais, mantendo os pontos juridicos essenciais.',
    provider: 'TRF4',
    category: 'summarization',
    inputType: 'text',
    accuracy: 0.82,
    lastUpdated: '2024-06-15T00:00:00Z',
    isActive: true,
  },
  {
    id: 'selene-sentiment-v1',
    name: 'SELENE - Analise de Sentimento Juridico',
    version: '1.2.0',
    description: 'Analisa o tom e posicionamento de textos juridicos, identificando se o texto e favoravel, desfavoravel ou neutro em relacao a teses especificas.',
    provider: 'CNJ',
    category: 'sentiment',
    inputType: 'text',
    accuracy: 0.79,
    lastUpdated: '2024-08-20T00:00:00Z',
    isActive: true,
  },
];

const MOCK_PRECEDENT_RESULT: PrecedentAnalysisResult = {
  query: '',
  totalFound: 47,
  precedents: [
    {
      id: 'stj-resp-1234567',
      court: 'STJ',
      caseNumber: 'REsp 1.234.567/SP',
      ementa: 'CIVIL. CONSUMIDOR. DANO MORAL. INSCRICAO INDEVIDA EM CADASTRO DE INADIMPLENTES. RESPONSABILIDADE OBJETIVA DO FORNECEDOR. QUANTUM INDENIZATORIO. RAZOABILIDADE. 1. A inscricao indevida do nome do consumidor em cadastros de inadimplentes configura dano moral in re ipsa. 2. O quantum indenizatorio deve atender aos principios da razoabilidade e proporcionalidade.',
      similarity: 0.92,
      date: '2024-05-15',
      relator: 'Min. Joao Otavio de Noronha',
      themes: ['Dano moral', 'Cadastro de inadimplentes', 'Consumidor'],
      decision: 'Recurso parcialmente provido',
    },
    {
      id: 'stj-resp-9876543',
      court: 'STJ',
      caseNumber: 'REsp 9.876.543/RJ',
      ementa: 'CIVIL. RESPONSABILIDADE CIVIL. DANO MORAL. VALOR DA INDENIZACAO. CRITERIOS. 1. O valor da indenizacao por danos morais deve ser fixado com moderacao, levando em conta a gravidade da lesao, a capacidade economica das partes e o carater pedagogico da medida. 2. Manutencao do valor fixado pelo Tribunal de origem.',
      similarity: 0.87,
      date: '2024-03-20',
      relator: 'Min. Marco Buzzi',
      themes: ['Dano moral', 'Quantum indenizatorio', 'Responsabilidade civil'],
      decision: 'Recurso nao provido',
    },
    {
      id: 'stf-re-654321',
      court: 'STF',
      caseNumber: 'RE 654.321/MG',
      ementa: 'CONSTITUCIONAL. DIREITO DO CONSUMIDOR. DANO MORAL COLETIVO. LEGITIMIDADE DO MINISTERIO PUBLICO. REPERCUSSAO GERAL. 1. O Ministerio Publico tem legitimidade para ajuizar acao civil publica em defesa de direitos individuais homogeneos do consumidor. Tema 462.',
      similarity: 0.78,
      date: '2024-01-10',
      relator: 'Min. Luis Roberto Barroso',
      themes: ['Consumidor', 'Dano moral coletivo', 'Repercussao geral'],
      decision: 'Recurso provido',
    },
  ],
  themes: ['Dano moral', 'Consumidor', 'Responsabilidade civil', 'Cadastro de inadimplentes'],
  suggestedClassifications: [
    { label: 'Indenizacao por Dano Moral', confidence: 0.94 },
    { label: 'Direito do Consumidor', confidence: 0.91 },
    { label: 'Responsabilidade Civil Objetiva', confidence: 0.85 },
  ],
  processingTimeMs: 1234,
};

// ─── SINAPSES Client Implementation ─────────────────────────────────────────

/**
 * Client for the CNJ SINAPSES AI platform.
 *
 * SINAPSES provides access to 150+ judicial AI models developed by
 * Brazilian courts and shared through the CNJ's centralized platform.
 * Models cover classification, similarity analysis, document processing,
 * summarization, and prediction tasks.
 *
 * Key integrations:
 * - VICTOR (STF): Repercussao geral theme classification
 * - ATHOS (STJ): Case similarity and precedent matching
 * - PROMETEU (TJMG): Outcome prediction
 * - BERNA (TJRS): Document type classification
 * - HERMES (CNJ): Legal named entity recognition
 * - DIANA (TRF4): Decision summarization
 *
 * @example
 * ```typescript
 * const sinapses = new SinapsesClient();
 * await sinapses.authenticate({
 *   apiKey: 'cnj-sinapses-key-xxx',
 *   institutionId: 'OAB-SP',
 * });
 *
 * const analysis = await sinapses.analyzePrecedents({
 *   caseText: 'Trata-se de acao de indenizacao por dano moral...',
 *   court: 'STJ',
 *   maxResults: 10,
 * });
 * ```
 */
export class SinapsesClient {
  private config: SinapsesConfig;
  private apiKey: string | null = null;
  private institutionId: string | null = null;
  private authenticated: boolean = false;
  private useMockData: boolean;

  constructor(config?: Partial<SinapsesConfig>) {
    this.config = { ...DEFAULT_SINAPSES_CONFIG, ...config };
    this.useMockData = process.env.NODE_ENV === 'development' || !process.env.SINAPSES_API_URL;
  }

  // ─── Authentication ─────────────────────────────────────────────────────

  /**
   * Authenticate with the SINAPSES platform.
   *
   * @param credentials - Institutional API key and institution identifier
   */
  async authenticate(credentials: SinapsesCredentials): Promise<void> {
    if (!credentials.apiKey && !this.useMockData) {
      throw new CourtAdapterError(
        'SINAPSES requires an institutional API key',
        'datajud',
        'AUTH_FAILED',
      );
    }

    this.apiKey = credentials.apiKey || 'mock-sinapses-key';
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
          `SINAPSES authentication failed: HTTP ${response.status}`,
          'datajud',
          'AUTH_FAILED',
          response.status,
        );
      }

      this.authenticated = true;
    } catch (error) {
      if (error instanceof CourtAdapterError) throw error;
      throw new CourtAdapterError(
        `Failed to authenticate with SINAPSES: ${error instanceof Error ? error.message : String(error)}`,
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

  // ─── Model Catalog ────────────────────────────────────────────────────────

  /**
   * List available AI models in the SINAPSES catalog.
   *
   * @param category - Optional filter by model category
   * @returns Array of available models with metadata
   */
  async listModels(category?: SinapsesModelCategory): Promise<SinapsesModel[]> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return category
        ? MOCK_MODELS.filter((m) => m.category === category)
        : MOCK_MODELS;
    }

    return withRetry(async () => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);

      const response = await this.apiRequest(`/models?${params.toString()}`);

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to list SINAPSES models: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      return (await response.json()) as SinapsesModel[];
    }, this.config.retry);
  }

  // ─── Prediction ───────────────────────────────────────────────────────────

  /**
   * Run a prediction using a specific AI model.
   *
   * @param request - Model ID, input data, and prediction options
   * @returns Prediction results with confidence scores
   */
  async predict(request: SinapsesPredictionRequest): Promise<SinapsesPredictionResult> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return this.mockPredict(request);
    }

    return withRetry(async () => {
      const response = await this.apiRequest('/predict', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new CourtAdapterError(
          `SINAPSES prediction failed: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      return (await response.json()) as SinapsesPredictionResult;
    }, this.config.retry);
  }

  // ─── Precedent Analysis ───────────────────────────────────────────────────

  /**
   * Analyze a case text to find matching precedents.
   *
   * Uses the ATHOS similarity engine (from STJ) to compare the input
   * text against the precedent database and return ranked matches.
   * Also runs classification models to suggest subject matter and
   * repercussao geral themes.
   *
   * @param request - Case text and analysis parameters
   * @returns Matched precedents, themes, and classifications
   */
  async analyzePrecedents(
    request: PrecedentAnalysisRequest,
  ): Promise<PrecedentAnalysisResult> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return {
        ...MOCK_PRECEDENT_RESULT,
        query: request.caseText.substring(0, 200),
        precedents: MOCK_PRECEDENT_RESULT.precedents
          .filter((p) => !request.court || p.court === request.court)
          .filter((p) => p.similarity >= (request.minSimilarity || 0.7))
          .slice(0, request.maxResults || 10),
      };
    }

    return withRetry(async () => {
      const response = await this.apiRequest('/analysis/precedents', {
        method: 'POST',
        body: JSON.stringify({
          text: request.caseText,
          court: request.court,
          area: request.area,
          maxResults: request.maxResults || 10,
          minSimilarity: request.minSimilarity || 0.7,
        }),
      });

      if (!response.ok) {
        throw new CourtAdapterError(
          `SINAPSES precedent analysis failed: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      return (await response.json()) as PrecedentAnalysisResult;
    }, this.config.retry);
  }

  // ─── Case Classification ──────────────────────────────────────────────────

  /**
   * Classify a case by running multiple classification models.
   *
   * Runs the following models in parallel:
   * - VICTOR: Repercussao geral theme identification
   * - BERNA: Document/case class identification
   * - Subject matter classification
   * - Complexity estimation
   * - Urgency assessment
   *
   * @param caseText - The text of the case to classify
   * @returns Multi-dimensional classification results
   */
  async classifyCase(caseText: string): Promise<CaseClassification> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return this.mockClassifyCase();
    }

    return withRetry(async () => {
      const response = await this.apiRequest('/analysis/classify', {
        method: 'POST',
        body: JSON.stringify({ text: caseText }),
      });

      if (!response.ok) {
        throw new CourtAdapterError(
          `SINAPSES classification failed: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      return (await response.json()) as CaseClassification;
    }, this.config.retry);
  }

  // ─── Text Summarization ───────────────────────────────────────────────────

  /**
   * Generate an automatic summary (ementa) for a judicial decision.
   *
   * Uses the DIANA summarization model to create a concise ementa
   * that captures the essential legal points of the decision.
   *
   * @param decisionText - Full text of the judicial decision
   * @param maxLength - Maximum length of the summary in characters
   * @returns Generated summary text
   */
  async summarizeDecision(
    decisionText: string,
    maxLength: number = 500,
  ): Promise<{ summary: string; confidence: number }> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return {
        summary: 'CIVIL. CONSUMIDOR. DANO MORAL. INSCRICAO INDEVIDA. RESPONSABILIDADE OBJETIVA. 1. A inscricao indevida em cadastro de inadimplentes configura dano moral presumido. 2. Quantum indenizatorio fixado em observancia aos principios da razoabilidade e proporcionalidade. 3. Recurso parcialmente provido.',
        confidence: 0.88,
      };
    }

    return withRetry(async () => {
      const response = await this.apiRequest('/analysis/summarize', {
        method: 'POST',
        body: JSON.stringify({
          text: decisionText,
          maxLength,
          modelId: 'diana-summarizer-v1',
        }),
      });

      if (!response.ok) {
        throw new CourtAdapterError(
          `SINAPSES summarization failed: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      return (await response.json()) as { summary: string; confidence: number };
    }, this.config.retry);
  }

  // ─── Named Entity Recognition ─────────────────────────────────────────────

  /**
   * Extract legal entities from text using the HERMES NER model.
   *
   * Identifies:
   * - Person names (parties, judges, lawyers)
   * - Organizations
   * - Monetary values
   * - Dates and deadlines
   * - Legal references (laws, articles, sumulas)
   * - Process numbers
   * - OAB registrations
   *
   * @param text - Legal text to process
   * @returns Array of recognized entities with positions and types
   */
  async extractEntities(text: string): Promise<LegalEntity[]> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return this.mockExtractEntities();
    }

    return withRetry(async () => {
      const response = await this.apiRequest('/analysis/ner', {
        method: 'POST',
        body: JSON.stringify({
          text,
          modelId: 'hermes-ner-v2',
        }),
      });

      if (!response.ok) {
        throw new CourtAdapterError(
          `SINAPSES NER extraction failed: HTTP ${response.status}`,
          'datajud',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      return (await response.json()) as LegalEntity[];
    }, this.config.retry);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private ensureAuthenticated(): void {
    if (!this.isAuthenticated()) {
      throw new CourtAdapterError(
        'SINAPSES client is not authenticated. Call authenticate() first.',
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

  private mockPredict(request: SinapsesPredictionRequest): SinapsesPredictionResult {
    const model = MOCK_MODELS.find((m) => m.id === request.modelId) || MOCK_MODELS[0];
    return {
      modelId: model.id,
      modelName: model.name,
      predictions: [
        { label: 'Dano Moral - Consumidor', confidence: 0.91 },
        { label: 'Responsabilidade Civil Objetiva', confidence: 0.85 },
        { label: 'Relacao de Consumo', confidence: 0.78 },
      ].slice(0, request.options?.topK || 3),
      processingTimeMs: 456,
      explanation: request.options?.explain
        ? 'O texto apresenta caracteristicas compativeis com acao de indenizacao por dano moral em relacao de consumo. Palavras-chave identificadas: "inscricao indevida", "cadastro", "consumidor", "dano moral". Padrao similar a 89% dos casos classificados nesta categoria.'
        : undefined,
    };
  }

  private mockClassifyCase(): CaseClassification {
    return {
      classeProcessual: [
        { label: 'Procedimento Comum Civel', confidence: 0.93 },
        { label: 'Acao de Obrigacao de Fazer', confidence: 0.72 },
      ],
      assuntos: [
        { label: 'Indenizacao por Dano Moral', confidence: 0.95 },
        { label: 'Inclusao Indevida em Cadastro de Inadimplentes', confidence: 0.88 },
        { label: 'Direito do Consumidor', confidence: 0.86 },
      ],
      repercussaoGeral: [
        { label: 'Tema 786 - Dano moral e quantum indenizatorio', confidence: 0.65 },
        { label: 'Tema 462 - Legitimidade do MP em direitos individuais homogeneos', confidence: 0.42 },
      ],
      complexidade: [
        { label: 'Baixa', confidence: 0.75 },
        { label: 'Media', confidence: 0.20 },
        { label: 'Alta', confidence: 0.05 },
      ],
      urgencia: [
        { label: 'Normal', confidence: 0.82 },
        { label: 'Prioritaria', confidence: 0.18 },
      ],
    };
  }

  private mockExtractEntities(): LegalEntity[] {
    return [
      { type: 'PERSON', text: 'Joao da Silva', start: 0, end: 14, role: 'autor' },
      { type: 'ORGANIZATION', text: 'Telecom Brasil S.A.', start: 20, end: 39, role: 'reu' },
      { type: 'PERSON', text: 'Dr. Carlos Mendes', start: 45, end: 62, role: 'advogado' },
      { type: 'OAB', text: 'OAB/SP 123456', start: 65, end: 78, role: 'registro' },
      { type: 'MONETARY', text: 'R$ 50.000,00', start: 100, end: 112, role: 'valor_causa' },
      { type: 'DATE', text: '15/11/2024', start: 130, end: 140, role: 'data_despacho' },
      { type: 'LAW', text: 'Art. 14, CDC', start: 160, end: 172, role: 'fundamentacao' },
      { type: 'LAW', text: 'Sumula 385/STJ', start: 180, end: 195, role: 'jurisprudencia' },
      { type: 'PROCESS_NUMBER', text: '0001234-56.2024.8.26.0100', start: 200, end: 225, role: 'processo' },
    ];
  }
}
