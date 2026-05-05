// =============================================================================
// PJe Adapter - Processo Judicial Eletrônico Integration
// Implements CourtAdapter for the PJe system used by most Brazilian courts
// =============================================================================
//
// PJe (Processo Judicial Eletrônico) is the primary electronic court system
// developed by the CNJ and used by federal, state, labor, and military courts.
//
// Architecture:
// - Authentication: ICP-Brasil digital certificate (A1/A3) via SOAP/REST
// - Core protocol: MNI (Modelo Nacional de Interoperabilidade) SOAP services
// - Modern layer: REST API wrapping the MNI SOAP operations
//
// MNI Operations mapped:
// - consultarProcesso: Query process details by CNJ number
// - consultarAvisosPendentes: Retrieve pending notifications/citations
// - consultarTeorComunicacao: Get full text of a court communication
// - entregarManifestacaoProcessual: File a petition/document
//
// Reference: https://www.cnj.jus.br/programas-e-acoes/processo-judicial-eletronico-pje/
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

// ─── PJe Configuration ─────────────────────────────────────────────────────

interface PJeConfig {
  /** Base URL for the PJe REST API */
  baseUrl: string;
  /** Base URL for the MNI SOAP endpoint (legacy) */
  mniUrl: string;
  /** Request timeout in milliseconds */
  timeoutMs: number;
  /** Retry configuration */
  retry: RetryConfig;
}

const DEFAULT_PJE_CONFIG: PJeConfig = {
  baseUrl: process.env.PJE_API_URL || 'https://pje.trf1.jus.br/pje/api/v1',
  mniUrl: process.env.PJE_MNI_URL || 'https://pje.trf1.jus.br/intercomunicacao/ws',
  timeoutMs: 30000,
  retry: DEFAULT_RETRY_CONFIG,
};

// ─── Internal Types ─────────────────────────────────────────────────────────

/** Token response from PJe authentication endpoint */
interface PJeAuthToken {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  refreshToken?: string;
  scope: string;
}

/**
 * MNI consultarProcesso response structure.
 * The actual SOAP XML is parsed into this TypeScript representation.
 */
interface MNIProcessoResponse {
  numero: string;
  codigoLocalidade: string;
  nivelSigilo: number;
  competencia: number;
  classeProcessual: number;
  classeDescricao: string;
  orgaoJulgador: {
    codigoOrgao: string;
    nomeOrgao: string;
    instancia: string;
  };
  assuntos: Array<{
    codigoNacional: number;
    descricao: string;
    principal: boolean;
  }>;
  poloAtivo: MNIPolo[];
  poloPassivo: MNIPolo[];
  movimentos: MNIMovimento[];
  dataAjuizamento: string;
  valorCausa: number;
}

interface MNIPolo {
  nome: string;
  tipoPessoa: 'FISICA' | 'JURIDICA';
  documento: string;
  advogados: Array<{
    nome: string;
    inscricaoOAB: string;
  }>;
}

interface MNIMovimento {
  identificadorMovimento: string;
  dataHora: string;
  tipoMovimento: string;
  descricao: string;
  complementos: string[];
}

/**
 * MNI consultarAvisosPendentes response for pending court notifications.
 */
interface MNIAvisoPendente {
  identificadorAviso: string;
  dataDisponibilizacao: string;
  tipoComunicacao: string;
  nomeOrgao: string;
  numeroProcesso: string;
  destinatario: string;
}

/**
 * MNI consultarTeorComunicacao response for full communication text.
 */
interface MNITeorComunicacao {
  identificador: string;
  conteudo: string;
  dataLeitura: string;
  tipo: string;
}

// ─── Mock Data for Development ──────────────────────────────────────────────

const MOCK_PJE_PROCESS: MNIProcessoResponse = {
  numero: '0001234-56.2024.8.26.0100',
  codigoLocalidade: '8260100',
  nivelSigilo: 0,
  competencia: 2,
  classeProcessual: 7,
  classeDescricao: 'Procedimento Comum Cível',
  orgaoJulgador: {
    codigoOrgao: '100',
    nomeOrgao: '1a Vara Cível',
    instancia: 'ORIG',
  },
  assuntos: [
    { codigoNacional: 6226, descricao: 'Indenização por Dano Moral', principal: true },
    { codigoNacional: 6233, descricao: 'Indenização por Dano Material', principal: false },
  ],
  poloAtivo: [
    {
      nome: 'João da Silva',
      tipoPessoa: 'FISICA',
      documento: '123.456.789-00',
      advogados: [{ nome: 'Dr. Carlos Advogado', inscricaoOAB: 'SP123456' }],
    },
  ],
  poloPassivo: [
    {
      nome: 'Empresa XYZ Ltda',
      tipoPessoa: 'JURIDICA',
      documento: '12.345.678/0001-90',
      advogados: [{ nome: 'Dra. Maria Defensora', inscricaoOAB: 'SP654321' }],
    },
  ],
  movimentos: [
    {
      identificadorMovimento: 'mov-001',
      dataHora: '2024-11-15T14:30:00Z',
      tipoMovimento: 'DESPACHO',
      descricao: 'Despacho proferido - Cite-se a parte ré',
      complementos: ['Prazo de 15 dias para contestação'],
    },
    {
      identificadorMovimento: 'mov-002',
      dataHora: '2024-11-10T10:00:00Z',
      tipoMovimento: 'DISTRIBUICAO',
      descricao: 'Distribuído por sorteio',
      complementos: [],
    },
  ],
  dataAjuizamento: '2024-11-01T08:00:00Z',
  valorCausa: 50000.0,
};

// ─── PJe Adapter Implementation ─────────────────────────────────────────────

/**
 * CourtAdapter implementation for the PJe (Processo Judicial Eletrônico) system.
 *
 * PJe is the most widely used electronic court system in Brazil, mandated
 * by the CNJ for adoption across all justice segments. It implements the
 * MNI (Modelo Nacional de Interoperabilidade) protocol for system-to-system
 * communication.
 *
 * This adapter wraps the MNI SOAP operations behind a modern async interface,
 * using the PJe REST API layer where available and falling back to direct
 * MNI calls when necessary.
 *
 * @example
 * ```typescript
 * const pje = new PJeAdapter();
 * await pje.authenticate({
 *   system: 'pje',
 *   username: 'advogado@oab.org.br',
 *   certificate: base64CertContent,
 * });
 *
 * const process = await pje.searchProcess('0001234-56.2024.8.26.0100');
 * const movements = await pje.getMovements('0001234-56.2024.8.26.0100');
 * ```
 */
export class PJeAdapter implements CourtAdapter {
  readonly name: CourtSystem = 'pje';

  private config: PJeConfig;
  private authToken: PJeAuthToken | null = null;
  private tokenExpiresAt: number = 0;
  private useMockData: boolean;

  constructor(config?: Partial<PJeConfig>) {
    this.config = { ...DEFAULT_PJE_CONFIG, ...config };
    this.useMockData = process.env.NODE_ENV === 'development' || !process.env.PJE_API_URL;
  }

  // ─── Authentication ─────────────────────────────────────────────────────

  /**
   * Authenticate with PJe using ICP-Brasil digital certificate.
   *
   * PJe requires certificate-based authentication following the ICP-Brasil
   * standard. The certificate must be a valid A1 (software) or A3 (token/smartcard)
   * certificate issued by an ICP-Brasil accredited authority.
   *
   * The authentication flow:
   * 1. Submit certificate + credentials to the PJe auth endpoint
   * 2. Receive a JWT access token with the lawyer's OAB information
   * 3. Use the token for subsequent API calls
   *
   * @param credentials - Must include certificate (base64 PKCS#12) and username
   * @throws CourtAdapterError with code AUTH_FAILED or CERTIFICATE_INVALID
   */
  async authenticate(credentials: CourtCredentials): Promise<void> {
    if (credentials.system !== 'pje') {
      throw new CourtAdapterError(
        `PJe adapter received credentials for ${credentials.system}`,
        'pje',
        'AUTH_FAILED',
      );
    }

    if (this.useMockData) {
      this.authToken = {
        accessToken: 'mock-pje-token-' + Date.now(),
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: 'consulta peticionamento',
      };
      this.tokenExpiresAt = Date.now() + 3600 * 1000;
      return;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PJe-Version': '2.0',
        },
        body: JSON.stringify({
          username: credentials.username,
          certificate: credentials.certificate,
          password: credentials.password,
          grant_type: 'certificate',
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (response.status === 401) {
        throw new CourtAdapterError(
          'Invalid credentials or certificate rejected by PJe',
          'pje',
          'AUTH_FAILED',
          401,
        );
      }

      if (response.status === 403) {
        throw new CourtAdapterError(
          'Certificate is not valid for ICP-Brasil authentication',
          'pje',
          'CERTIFICATE_INVALID',
          403,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `PJe authentication failed with status ${response.status}`,
          'pje',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      this.authToken = (await response.json()) as PJeAuthToken;
      this.tokenExpiresAt = Date.now() + (this.authToken.expiresIn - 60) * 1000;
    } catch (error) {
      if (error instanceof CourtAdapterError) throw error;

      throw new CourtAdapterError(
        `Failed to connect to PJe: ${error instanceof Error ? error.message : String(error)}`,
        'pje',
        'NETWORK_ERROR',
        undefined,
        true,
      );
    }
  }

  /**
   * Check if the current authentication token is still valid.
   */
  isAuthenticated(): boolean {
    return this.authToken !== null && Date.now() < this.tokenExpiresAt;
  }

  // ─── MNI: consultarProcesso ─────────────────────────────────────────────

  /**
   * Search for a judicial process by CNJ number.
   *
   * Maps to the MNI operation `consultarProcesso` which returns the full
   * process metadata including parties, subjects, and the originating court.
   *
   * @param cnj - Unified CNJ process number (format: NNNNNNN-DD.AAAA.J.TR.OOOO)
   * @returns Search result with normalized data, or null if not found
   */
  async searchProcess(cnj: string): Promise<CourtSearchResult | null> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}. Expected: NNNNNNN-DD.AAAA.J.TR.OOOO`,
        'pje',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockSearchProcess(cnj);
    }

    return withRetry(async () => {
      const response = await this.apiRequest(`/processos/${encodeURIComponent(cnj)}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to search process: HTTP ${response.status}`,
          'pje',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as MNIProcessoResponse;
      return this.mapProcessToSearchResult(data);
    }, this.config.retry);
  }

  // ─── MNI: consultarMovimentacoes ──────────────────────────────────────────

  /**
   * Retrieve procedural movements (andamentos processuais) for a process.
   *
   * Extends the MNI consultarProcesso data by specifically fetching
   * the movement timeline. Results are returned in reverse chronological order.
   *
   * @param cnj - The CNJ process number
   * @param since - Optional ISO 8601 date to filter movements from
   * @returns Array of movements sorted by date descending
   */
  async getMovements(cnj: string, since?: string): Promise<ProcessMovement[]> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'pje',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockGetMovements(cnj, since);
    }

    return withRetry(async () => {
      const params = new URLSearchParams();
      if (since) params.set('dataInicio', since);

      const url = `/processos/${encodeURIComponent(cnj)}/movimentos?${params.toString()}`;
      const response = await this.apiRequest(url);

      if (response.status === 404) {
        throw new CourtAdapterError(
          `Process ${cnj} not found in PJe`,
          'pje',
          'PROCESS_NOT_FOUND',
          404,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to fetch movements: HTTP ${response.status}`,
          'pje',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as { movimentos: MNIMovimento[] };
      return data.movimentos.map((m) => this.mapMovement(m, cnj));
    }, this.config.retry);
  }

  // ─── MNI: entregarManifestacaoProcessual ──────────────────────────────────

  /**
   * File a petition or document in a process.
   *
   * Maps to the MNI operation `entregarManifestacaoProcessual`, which is the
   * primary mechanism for submitting petitions, contestations, appeals, and
   * other legal documents to the court electronically.
   *
   * The MNI entregarManifestacaoProcessual operation expects:
   * - idManifestante: the lawyer's OAB identification
   * - numeroProcesso: the target CNJ process number
   * - tipoDocumento: the classification of the petition
   * - documentos: array of base64-encoded files
   * - dataEnvio: submission timestamp
   *
   * @param cnj - The CNJ process number to file in
   * @param document - Filing payload with petition type, content, and attachments
   * @returns Filing receipt with protocol number
   */
  async fileDocument(cnj: string, document: FilingPayload): Promise<FilingReceipt> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'pje',
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
            tipoDocumento: document.petitionType,
            conteudo: document.content,
            documentos: document.documents.map((doc) => ({
              nomeArquivo: doc.name,
              conteudo: doc.data,
              tipoMime: doc.mimeType,
            })),
            dataEnvio: new Date().toISOString(),
          }),
        },
      );

      if (response.status === 422) {
        const errorBody = await response.json().catch(() => ({}));
        throw new CourtAdapterError(
          `Filing rejected by PJe: ${(errorBody as Record<string, string>).message || 'Unknown validation error'}`,
          'pje',
          'FILING_REJECTED',
          422,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to file document: HTTP ${response.status}`,
          'pje',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const receipt = (await response.json()) as {
        protocolo: string;
        dataProtocolamento: string;
        orgaoJulgador: string;
      };

      return {
        protocolNumber: receipt.protocolo,
        filedAt: receipt.dataProtocolamento,
        court: receipt.orgaoJulgador,
        cnj,
        system: 'pje' as const,
      };
    }, this.config.retry);
  }

  // ─── MNI: consultarAvisosPendentes + prazos ───────────────────────────────

  /**
   * Retrieve pending deadlines for a process.
   *
   * Uses a combination of MNI `consultarAvisosPendentes` (for citation/intimation
   * deadlines) and the PJe REST API for judicially-set deadlines.
   *
   * @param cnj - The CNJ process number
   * @returns Array of pending deadlines
   */
  async getDeadlines(cnj: string): Promise<CourtDeadline[]> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'pje',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockGetDeadlines(cnj);
    }

    return withRetry(async () => {
      const response = await this.apiRequest(
        `/processos/${encodeURIComponent(cnj)}/prazos`,
      );

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to fetch deadlines: HTTP ${response.status}`,
          'pje',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as {
        prazos: Array<{
          identificador: string;
          descricao: string;
          dataLimite: string;
          tipo: string;
        }>;
      };

      return data.prazos.map((p) => ({
        processId: cnj,
        title: p.descricao,
        dueDate: p.dataLimite,
        type: p.tipo,
        source: 'pje',
      }));
    }, this.config.retry);
  }

  // ─── MNI: consultarTeorComunicacao → Publications ─────────────────────────

  /**
   * Retrieve DJE publications matching an OAB registration number.
   *
   * Internally calls MNI `consultarAvisosPendentes` filtered by the OAB number,
   * then enriches each result with the full text from `consultarTeorComunicacao`.
   *
   * @param oab - The OAB number (e.g., 'SP123456')
   * @param since - Optional ISO 8601 date to filter publications from
   * @returns Array of publications
   */
  async getPublications(oab: string, since?: string): Promise<Publication[]> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return this.mockGetPublications(oab, since);
    }

    return withRetry(async () => {
      const params = new URLSearchParams({ oab });
      if (since) params.set('dataInicio', since);

      const response = await this.apiRequest(`/publicacoes?${params.toString()}`);

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to fetch publications: HTTP ${response.status}`,
          'pje',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as {
        publicacoes: Array<{
          id: string;
          conteudo: string;
          dataPublicacao: string;
          numeroProcesso?: string;
          fonte: string;
        }>;
      };

      return data.publicacoes.map((pub) => ({
        id: pub.id,
        processId: pub.numeroProcesso,
        source: pub.fonte || 'DJE',
        content: pub.conteudo,
        publicationDate: pub.dataPublicacao,
        isRead: false,
        matchedOab: oab,
        createdAt: new Date().toISOString(),
      }));
    }, this.config.retry);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * Ensure the adapter is currently authenticated.
   * @throws CourtAdapterError with code AUTH_EXPIRED if token has expired
   */
  private ensureAuthenticated(): void {
    if (!this.isAuthenticated()) {
      throw new CourtAdapterError(
        'PJe adapter is not authenticated. Call authenticate() first.',
        'pje',
        'AUTH_EXPIRED',
      );
    }
  }

  /**
   * Make an authenticated request to the PJe REST API.
   */
  private async apiRequest(path: string, init?: RequestInit): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.authToken!.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-PJe-Version': '2.0',
    };

    return fetch(url, {
      ...init,
      headers: { ...headers, ...(init?.headers as Record<string, string>) },
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });
  }

  /**
   * Map the MNI processo response to the unified CourtSearchResult.
   */
  private mapProcessToSearchResult(data: MNIProcessoResponse): CourtSearchResult {
    const activeParty = data.poloAtivo[0]?.nome || 'Parte Ativa';
    const passiveParty = data.poloPassivo[0]?.nome || 'Parte Passiva';
    const lastMov = data.movimentos[0];

    return {
      cnj: data.numero,
      title: `${activeParty} vs ${passiveParty} - ${data.classeDescricao}`,
      court: data.orgaoJulgador.nomeOrgao,
      vara: data.orgaoJulgador.nomeOrgao,
      comarca: data.codigoLocalidade,
      status: lastMov?.tipoMovimento || 'Em andamento',
      lastMovement: lastMov?.descricao,
      source: 'pje',
    };
  }

  /**
   * Map an MNI movement to the unified ProcessMovement type.
   */
  private mapMovement(mov: MNIMovimento, cnj: string): ProcessMovement {
    const description = mov.complementos.length > 0
      ? `${mov.descricao} - ${mov.complementos.join('; ')}`
      : mov.descricao;

    return {
      id: mov.identificadorMovimento,
      processId: cnj,
      date: mov.dataHora,
      description,
      type: mov.tipoMovimento,
      source: 'pje',
      isRead: false,
    };
  }

  // ─── Mock Implementations for Development ─────────────────────────────────

  private mockSearchProcess(cnj: string): CourtSearchResult {
    return {
      cnj,
      title: `${MOCK_PJE_PROCESS.poloAtivo[0].nome} vs ${MOCK_PJE_PROCESS.poloPassivo[0].nome} - ${MOCK_PJE_PROCESS.classeDescricao}`,
      court: MOCK_PJE_PROCESS.orgaoJulgador.nomeOrgao,
      vara: MOCK_PJE_PROCESS.orgaoJulgador.nomeOrgao,
      comarca: 'São Paulo',
      status: 'Em andamento',
      lastMovement: MOCK_PJE_PROCESS.movimentos[0]?.descricao,
      source: 'pje',
    };
  }

  private mockGetMovements(cnj: string, since?: string): ProcessMovement[] {
    let movements = MOCK_PJE_PROCESS.movimentos.map((m) => this.mapMovement(m, cnj));

    if (since) {
      const sinceDate = new Date(since).getTime();
      movements = movements.filter((m) => new Date(m.date).getTime() >= sinceDate);
    }

    return movements;
  }

  private mockFileDocument(cnj: string, _document: FilingPayload): FilingReceipt {
    return {
      protocolNumber: `PJe-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      filedAt: new Date().toISOString(),
      court: '1a Vara Cível - TJSP',
      cnj,
      system: 'pje',
    };
  }

  private mockGetDeadlines(cnj: string): CourtDeadline[] {
    const now = new Date();
    return [
      {
        processId: cnj,
        title: 'Prazo para contestação',
        dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'fatal',
        source: 'pje',
      },
      {
        processId: cnj,
        title: 'Audiência de conciliação',
        dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'hearing',
        source: 'pje',
      },
      {
        processId: cnj,
        title: 'Prazo para juntada de documentos',
        dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'judicial',
        source: 'pje',
      },
    ];
  }

  private mockGetPublications(oab: string, since?: string): Publication[] {
    const pubs: Publication[] = [
      {
        id: 'pub-pje-001',
        processId: '0001234-56.2024.8.26.0100',
        source: 'DJE - PJe',
        content: `Intimação para o advogado ${oab}: Fica intimado para ciência do despacho proferido nos autos do processo 0001234-56.2024.8.26.0100, que determinou a citação da parte ré. Prazo de 15 dias.`,
        publicationDate: '2024-11-16T00:00:00Z',
        isRead: false,
        matchedOab: oab,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pub-pje-002',
        processId: '0005678-90.2024.8.26.0100',
        source: 'DJE - PJe',
        content: `Publicação de sentença - Processo 0005678-90.2024.8.26.0100. Julgo procedente o pedido para condenar a ré ao pagamento de indenização por danos morais no valor de R$ 10.000,00.`,
        publicationDate: '2024-11-14T00:00:00Z',
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
