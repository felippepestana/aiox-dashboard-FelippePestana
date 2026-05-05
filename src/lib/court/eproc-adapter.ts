// =============================================================================
// e-Proc Adapter - Electronic Process System for Federal Courts
// REST API integration for TRFs and Federal Justice
// =============================================================================
//
// e-Proc is the electronic court system used by the Federal Regional Tribunals
// (TRFs) and federal first-instance courts in Brazil.
//
// Primary users:
// - TRF4 (RS, PR, SC) - original developer
// - TRF1 (DF and 13 states) - adopted version
// - TRF2 (RJ, ES) - adopted version
// - Federal first-instance courts in those regions
//
// Architecture:
// - REST API with JSON responses
// - Certificate + username/password authentication
// - Full MNI compliance for interoperability
// - Strong deadline tracking and notification system
// - Document filing with PDF validation
//
// Reference: https://eproc.jfrs.jus.br/ (TRF4)
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
  isValidCNJ,
} from './court-adapter';

// ─── e-Proc Configuration ───────────────────────────────────────────────────

interface EProcConfig {
  baseUrl: string;
  timeoutMs: number;
  retry: RetryConfig;
}

const DEFAULT_EPROC_CONFIG: EProcConfig = {
  baseUrl: process.env.EPROC_API_URL || 'https://eproc.trf4.jus.br/api/v2',
  timeoutMs: 30000,
  retry: DEFAULT_RETRY_CONFIG,
};

// ─── e-Proc Response Types ──────────────────────────────────────────────────

interface EProcAuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  scope: string;
  userInfo: {
    nome: string;
    oab: string;
    cpf: string;
    perfil: string;
  };
}

interface EProcProcesso {
  numeroProcesso: string;
  classeJudicial: {
    codigo: number;
    descricao: string;
  };
  orgaoJulgador: {
    codigo: string;
    descricao: string;
    comarca: string;
  };
  assuntos: Array<{
    codigo: number;
    descricao: string;
    principal: boolean;
  }>;
  partes: {
    poloAtivo: EProcParte[];
    poloPassivo: EProcParte[];
  };
  eventos: EProcEvento[];
  valorCausa: number;
  dataAutuacao: string;
  situacao: string;
  nivelSigilo: number;
  prioridade: boolean;
  justicaGratuita: boolean;
}

interface EProcParte {
  nome: string;
  tipo: string;
  documento: string;
  advogados: Array<{
    nome: string;
    oab: string;
  }>;
}

interface EProcEvento {
  id: number;
  dataHora: string;
  tipo: string;
  descricao: string;
  usuario: string;
  documentos: Array<{
    id: string;
    nome: string;
    tipo: string;
  }>;
}

interface EProcPrazo {
  id: string;
  processoNumero: string;
  descricao: string;
  dataInicio: string;
  dataFim: string;
  tipo: 'FATAL' | 'DILIGENCIA' | 'AUDIENCIA' | 'PERICIA';
  situacao: 'ABERTO' | 'CUMPRIDO' | 'DECORRIDO';
  intimacao?: {
    id: string;
    dataIntimacao: string;
    tipo: string;
  };
}

interface EProcIntimacao {
  id: string;
  processoNumero: string;
  dataDisponibilizacao: string;
  dataIntimacao: string;
  tipo: string;
  descricao: string;
  conteudo: string;
  situacao: 'PENDENTE' | 'LIDA' | 'RESPONDIDA';
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_EPROC_PROCESSO: EProcProcesso = {
  numeroProcesso: '5001234-56.2024.4.04.7100',
  classeJudicial: {
    codigo: 7,
    descricao: 'Ação Civil Pública',
  },
  orgaoJulgador: {
    codigo: '7100',
    descricao: '1a Vara Federal de Porto Alegre',
    comarca: 'Porto Alegre/RS',
  },
  assuntos: [
    { codigo: 10110, descricao: 'Direito Tributário - IRPF', principal: true },
    { codigo: 10111, descricao: 'Imposto de Renda', principal: false },
  ],
  partes: {
    poloAtivo: [
      {
        nome: 'Roberto Ferreira Lima',
        tipo: 'AUTOR',
        documento: '111.222.333-44',
        advogados: [{ nome: 'Dr. Paulo Advocacia', oab: 'RS98765' }],
      },
    ],
    poloPassivo: [
      {
        nome: 'União Federal - Fazenda Nacional',
        tipo: 'REU',
        documento: '00.394.460/5166-01',
        advogados: [{ nome: 'Procuradoria da Fazenda Nacional', oab: 'PFN' }],
      },
    ],
  },
  eventos: [
    {
      id: 1001,
      dataHora: '2024-11-18T16:45:00Z',
      tipo: 'DECISAO',
      descricao: 'Decisão - Deferida a tutela de urgência para suspender a exigibilidade do crédito tributário',
      usuario: 'Juiz Federal Substituto',
      documentos: [
        { id: 'doc-001', nome: 'Decisão Interlocutória', tipo: 'application/pdf' },
      ],
    },
    {
      id: 1000,
      dataHora: '2024-11-15T09:00:00Z',
      tipo: 'PETICAO',
      descricao: 'Petição Inicial protocolada com pedido de tutela de urgência',
      usuario: 'Dr. Paulo Advocacia',
      documentos: [
        { id: 'doc-002', nome: 'Petição Inicial', tipo: 'application/pdf' },
        { id: 'doc-003', nome: 'Procuração', tipo: 'application/pdf' },
        { id: 'doc-004', nome: 'Declaração IRPF', tipo: 'application/pdf' },
      ],
    },
    {
      id: 999,
      dataHora: '2024-11-15T08:30:00Z',
      tipo: 'DISTRIBUICAO',
      descricao: 'Distribuído por sorteio à 1a Vara Federal de Porto Alegre',
      usuario: 'Sistema',
      documentos: [],
    },
  ],
  valorCausa: 125000.0,
  dataAutuacao: '2024-11-15T08:30:00Z',
  situacao: 'EM_ANDAMENTO',
  nivelSigilo: 0,
  prioridade: false,
  justicaGratuita: true,
};

// ─── e-Proc Adapter Implementation ──────────────────────────────────────────

/**
 * CourtAdapter implementation for the e-Proc system used by federal courts.
 *
 * e-Proc is the electronic process management system used by TRF4 and other
 * federal regional tribunals. It provides a modern REST API with strong
 * support for deadline tracking and document management.
 *
 * Key features:
 * - REST API with certificate + password authentication
 * - Full process consultation with parties, events, and documents
 * - Advanced deadline/prazo tracking with intimation support
 * - Electronic filing with PDF validation
 * - Priority process handling (idoso, saúde, etc.)
 * - Justiça gratuita flag support
 *
 * @example
 * ```typescript
 * const eproc = new EProcAdapter();
 * await eproc.authenticate({
 *   system: 'eproc',
 *   username: 'advogado@oab.org.br',
 *   password: 'password',
 *   certificate: base64CertContent,
 * });
 *
 * const deadlines = await eproc.getDeadlines('5001234-56.2024.4.04.7100');
 * ```
 */
export class EProcAdapter implements CourtAdapter {
  readonly name: CourtSystem = 'eproc';

  private config: EProcConfig;
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiresAt: number = 0;
  private useMockData: boolean;

  constructor(config?: Partial<EProcConfig>) {
    this.config = { ...DEFAULT_EPROC_CONFIG, ...config };
    this.useMockData = process.env.NODE_ENV === 'development' || !process.env.EPROC_API_URL;
  }

  // ─── Authentication ─────────────────────────────────────────────────────

  /**
   * Authenticate with e-Proc using certificate + password.
   *
   * e-Proc supports dual authentication: ICP-Brasil certificate for identity
   * verification plus username/password for the session. Some installations
   * accept password-only authentication for lower-security operations.
   *
   * @param credentials - Must include username, password, and optionally certificate
   */
  async authenticate(credentials: CourtCredentials): Promise<void> {
    if (credentials.system !== 'eproc') {
      throw new CourtAdapterError(
        `e-Proc adapter received credentials for ${credentials.system}`,
        'eproc',
        'AUTH_FAILED',
      );
    }

    if (this.useMockData) {
      this.authToken = 'mock-eproc-token-' + Date.now();
      this.refreshToken = 'mock-eproc-refresh-' + Date.now();
      this.tokenExpiresAt = Date.now() + 3600 * 1000;
      return;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: credentials.username,
          senha: credentials.password,
          certificado: credentials.certificate,
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (response.status === 401) {
        throw new CourtAdapterError(
          'Invalid e-Proc credentials or certificate',
          'eproc',
          'AUTH_FAILED',
          401,
        );
      }

      if (response.status === 403) {
        throw new CourtAdapterError(
          'Certificate not recognized by e-Proc. Ensure it is a valid ICP-Brasil certificate.',
          'eproc',
          'CERTIFICATE_INVALID',
          403,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `e-Proc authentication failed: HTTP ${response.status}`,
          'eproc',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as EProcAuthResponse;
      this.authToken = data.token;
      this.refreshToken = data.refreshToken;
      this.tokenExpiresAt = Date.now() + (data.expiresIn - 60) * 1000;
    } catch (error) {
      if (error instanceof CourtAdapterError) throw error;
      throw new CourtAdapterError(
        `Failed to connect to e-Proc: ${error instanceof Error ? error.message : String(error)}`,
        'eproc',
        'NETWORK_ERROR',
        undefined,
        true,
      );
    }
  }

  isAuthenticated(): boolean {
    return this.authToken !== null && Date.now() < this.tokenExpiresAt;
  }

  // ─── Process Search ───────────────────────────────────────────────────────

  /**
   * Search for a process by CNJ number in e-Proc.
   */
  async searchProcess(cnj: string): Promise<CourtSearchResult | null> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'eproc',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockSearchProcess(cnj);
    }

    return withRetry(async () => {
      const response = await this.apiRequest(
        `/processos/${encodeURIComponent(cnj)}`,
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `e-Proc search failed: HTTP ${response.status}`,
          'eproc',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as EProcProcesso;
      return this.mapToSearchResult(data);
    }, this.config.retry);
  }

  // ─── Movements ────────────────────────────────────────────────────────────

  /**
   * Retrieve events (eventos) for a process from e-Proc.
   *
   * e-Proc uses "eventos" instead of "movimentos" - each event can have
   * associated documents and user attribution.
   */
  async getMovements(cnj: string, since?: string): Promise<ProcessMovement[]> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'eproc',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockGetMovements(cnj, since);
    }

    return withRetry(async () => {
      const params = new URLSearchParams();
      if (since) params.set('dataInicio', since);

      const response = await this.apiRequest(
        `/processos/${encodeURIComponent(cnj)}/eventos?${params.toString()}`,
      );

      if (response.status === 404) {
        throw new CourtAdapterError(
          `Process ${cnj} not found in e-Proc`,
          'eproc',
          'PROCESS_NOT_FOUND',
          404,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to fetch e-Proc events: HTTP ${response.status}`,
          'eproc',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as { eventos: EProcEvento[] };
      return data.eventos.map((e) => this.mapEvento(e, cnj));
    }, this.config.retry);
  }

  // ─── Filing ───────────────────────────────────────────────────────────────

  /**
   * File a petition in e-Proc.
   *
   * e-Proc has strict validation for filed documents:
   * - All documents must be PDF/A format
   * - Maximum file size per document: 15MB
   * - Total filing size: 50MB
   * - OCR validation on scanned documents
   */
  async fileDocument(cnj: string, document: FilingPayload): Promise<FilingReceipt> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'eproc',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockFileDocument(cnj, document);
    }

    return withRetry(async () => {
      const response = await this.apiRequest(
        `/processos/${encodeURIComponent(cnj)}/peticionar`,
        {
          method: 'POST',
          body: JSON.stringify({
            tipo: document.petitionType,
            descricao: document.content,
            documentos: document.documents.map((doc) => ({
              nome: doc.name,
              conteudo: doc.data,
              mimeType: doc.mimeType,
            })),
          }),
        },
      );

      if (response.status === 422) {
        const errorBody = await response.json().catch(() => ({}));
        throw new CourtAdapterError(
          `e-Proc filing rejected: ${(errorBody as Record<string, string>).mensagem || 'Validation error'}`,
          'eproc',
          'FILING_REJECTED',
          422,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `e-Proc filing failed: HTTP ${response.status}`,
          'eproc',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const result = (await response.json()) as {
        protocolo: string;
        dataProtocolamento: string;
        orgaoJulgador: string;
        evento: number;
      };

      return {
        protocolNumber: result.protocolo,
        filedAt: result.dataProtocolamento,
        court: result.orgaoJulgador,
        cnj,
        system: 'eproc' as const,
      };
    }, this.config.retry);
  }

  // ─── Deadlines ────────────────────────────────────────────────────────────

  /**
   * Retrieve pending deadlines (prazos) from e-Proc.
   *
   * e-Proc has one of the most robust deadline tracking systems among
   * Brazilian court platforms. It tracks:
   * - Fatal deadlines (prazos fatais) from intimations
   * - Hearing dates (audiências)
   * - Expert examination deadlines (perícias)
   * - Administrative deadlines (diligências)
   */
  async getDeadlines(cnj: string): Promise<CourtDeadline[]> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'eproc',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockGetDeadlines(cnj);
    }

    return withRetry(async () => {
      const response = await this.apiRequest(
        `/processos/${encodeURIComponent(cnj)}/prazos?situacao=ABERTO`,
      );

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to fetch e-Proc deadlines: HTTP ${response.status}`,
          'eproc',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as { prazos: EProcPrazo[] };

      return data.prazos
        .filter((p) => p.situacao === 'ABERTO')
        .map((p) => ({
          processId: cnj,
          title: p.descricao,
          dueDate: p.dataFim,
          type: this.mapPrazoType(p.tipo),
          source: 'eproc',
        }));
    }, this.config.retry);
  }

  // ─── Publications ─────────────────────────────────────────────────────────

  /**
   * Retrieve electronic intimations from e-Proc.
   *
   * e-Proc uses electronic intimation (citação/intimação eletrônica) instead
   * of DJE publication. Intimations are delivered directly to the lawyer's
   * inbox within the system.
   */
  async getPublications(oab: string, since?: string): Promise<Publication[]> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return this.mockGetPublications(oab, since);
    }

    return withRetry(async () => {
      const params = new URLSearchParams({ oab });
      if (since) params.set('dataInicio', since);

      const response = await this.apiRequest(
        `/intimacoes?${params.toString()}`,
      );

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to fetch e-Proc intimations: HTTP ${response.status}`,
          'eproc',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as { intimacoes: EProcIntimacao[] };

      return data.intimacoes.map((int) => ({
        id: int.id,
        processId: int.processoNumero,
        source: `e-Proc Intimação - ${int.tipo}`,
        content: int.conteudo,
        publicationDate: int.dataDisponibilizacao,
        isRead: int.situacao !== 'PENDENTE',
        matchedOab: oab,
        createdAt: new Date().toISOString(),
      }));
    }, this.config.retry);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private ensureAuthenticated(): void {
    if (!this.isAuthenticated()) {
      throw new CourtAdapterError(
        'e-Proc adapter is not authenticated. Call authenticate() first.',
        'eproc',
        'AUTH_EXPIRED',
      );
    }
  }

  private async apiRequest(path: string, init?: RequestInit): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;
    return fetch(url, {
      ...init,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(init?.headers as Record<string, string>),
      },
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });
  }

  private mapToSearchResult(data: EProcProcesso): CourtSearchResult {
    const activeParty = data.partes.poloAtivo[0]?.nome || 'Autor';
    const passiveParty = data.partes.poloPassivo[0]?.nome || 'Réu';
    const lastEvento = data.eventos[0];

    return {
      cnj: data.numeroProcesso,
      title: `${activeParty} vs ${passiveParty} - ${data.classeJudicial.descricao}`,
      court: data.orgaoJulgador.descricao,
      vara: data.orgaoJulgador.descricao,
      comarca: data.orgaoJulgador.comarca,
      status: data.situacao === 'EM_ANDAMENTO' ? 'Em andamento' : data.situacao,
      lastMovement: lastEvento?.descricao,
      source: 'eproc',
    };
  }

  private mapEvento(evento: EProcEvento, cnj: string): ProcessMovement {
    const docsInfo = evento.documentos.length > 0
      ? ` [${evento.documentos.length} documento(s) anexado(s)]`
      : '';

    return {
      id: `eproc-${evento.id}`,
      processId: cnj,
      date: evento.dataHora,
      description: `${evento.descricao}${docsInfo}`,
      type: evento.tipo,
      source: 'pje',
      isRead: false,
    };
  }

  private mapPrazoType(tipo: string): string {
    const typeMap: Record<string, string> = {
      'FATAL': 'fatal',
      'DILIGENCIA': 'judicial',
      'AUDIENCIA': 'hearing',
      'PERICIA': 'judicial',
    };
    return typeMap[tipo] || 'judicial';
  }

  // ─── Mock Implementations ─────────────────────────────────────────────────

  private mockSearchProcess(cnj: string): CourtSearchResult {
    const mock = { ...MOCK_EPROC_PROCESSO, numeroProcesso: cnj };
    return this.mapToSearchResult(mock);
  }

  private mockGetMovements(cnj: string, since?: string): ProcessMovement[] {
    let movements = MOCK_EPROC_PROCESSO.eventos.map((e) =>
      this.mapEvento(e, cnj),
    );

    if (since) {
      const sinceDate = new Date(since).getTime();
      movements = movements.filter((m) => new Date(m.date).getTime() >= sinceDate);
    }

    return movements.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  private mockFileDocument(cnj: string, _document: FilingPayload): FilingReceipt {
    return {
      protocolNumber: `EPROC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      filedAt: new Date().toISOString(),
      court: '1a Vara Federal de Porto Alegre - TRF4',
      cnj,
      system: 'eproc',
    };
  }

  private mockGetDeadlines(cnj: string): CourtDeadline[] {
    const now = new Date();
    return [
      {
        processId: cnj,
        title: 'Prazo para manifestação sobre a decisão liminar',
        dueDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'fatal',
        source: 'eproc',
      },
      {
        processId: cnj,
        title: 'Prazo para juntada de documentos complementares',
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'judicial',
        source: 'eproc',
      },
      {
        processId: cnj,
        title: 'Audiência de conciliação por videoconferência',
        dueDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'hearing',
        source: 'eproc',
      },
    ];
  }

  private mockGetPublications(oab: string, since?: string): Publication[] {
    const pubs: Publication[] = [
      {
        id: 'int-eproc-001',
        processId: '5001234-56.2024.4.04.7100',
        source: 'e-Proc Intimação Eletrônica',
        content: `INTIMAÇÃO - Processo 5001234-56.2024.4.04.7100 - 1a Vara Federal de Porto Alegre - Fica Vossa Senhoria intimado(a) da decisão que deferiu a tutela de urgência pleiteada. Prazo de 15 dias para a União apresentar contestação. Advogado destinatário: ${oab}`,
        publicationDate: '2024-11-19T00:00:00Z',
        isRead: false,
        matchedOab: oab,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'int-eproc-002',
        processId: '5009876-54.2024.4.04.7100',
        source: 'e-Proc Citação Eletrônica',
        content: `CITAÇÃO - Processo 5009876-54.2024.4.04.7100 - 3a Vara Federal de Porto Alegre - Fica citado para, no prazo de 30 dias, apresentar contestação à Ação Ordinária ajuizada por Maria da Silva contra a União Federal. Advogado: ${oab}`,
        publicationDate: '2024-11-17T00:00:00Z',
        isRead: false,
        matchedOab: oab,
        createdAt: new Date().toISOString(),
      },
    ];

    if (since) {
      const sinceDate = new Date(since).getTime();
      return pubs.filter((p) => new Date(p.publicationDate).getTime() >= sinceDate);
    }

    return pubs;
  }
}
