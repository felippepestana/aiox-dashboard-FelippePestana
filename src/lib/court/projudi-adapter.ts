// =============================================================================
// PROJUDI Adapter - Processo Judicial Digital
// Web-based integration for state court systems
// =============================================================================
//
// PROJUDI (Processo Judicial Digital) is an electronic court system developed
// by the CNJ and adopted by several state courts as an alternative to PJe.
//
// Primary users:
// - TJPR (Paraná) - major adopter
// - TJGO (Goiás)
// - TJRN (Rio Grande do Norte)
// - TJBA (Bahia) - partial
// - Various other state courts transitioning to PJe
//
// Architecture:
// - Web-based system with screen-scraping API integration
// - Username/password authentication
// - Less standardized API compared to PJe
// - Process consultation via web service endpoints
// - Publication monitoring through integration with DJE
//
// Note: PROJUDI is being gradually replaced by PJe across Brazilian courts,
// but remains active in several jurisdictions.
//
// Reference: https://projudi.tjpr.jus.br/
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

// ─── PROJUDI Configuration ──────────────────────────────────────────────────

interface PROJUDIConfig {
  baseUrl: string;
  timeoutMs: number;
  retry: RetryConfig;
}

const DEFAULT_PROJUDI_CONFIG: PROJUDIConfig = {
  baseUrl: process.env.PROJUDI_API_URL || 'https://projudi.tjpr.jus.br/projudi_consulta',
  timeoutMs: 30000,
  retry: DEFAULT_RETRY_CONFIG,
};

// ─── PROJUDI Response Types ─────────────────────────────────────────────────

interface PROJUDIProcesso {
  numero: string;
  numeroAntigo?: string;
  classe: string;
  assunto: string;
  comarca: string;
  vara: string;
  juiz: string;
  dataDistribuicao: string;
  valorCausa: number;
  autor: string;
  reu: string;
  advogadoAutor: string;
  advogadoReu: string;
  situacao: string;
  andamentos: PROJUDIAndamento[];
}

interface PROJUDIAndamento {
  data: string;
  tipo: string;
  descricao: string;
  complemento?: string;
  visibilidade: 'PUBLICA' | 'RESTRITA';
}

interface PROJUDIPublicacao {
  id: string;
  dataPublicacao: string;
  diario: string;
  conteudo: string;
  processo?: string;
  vara?: string;
  comarca?: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_PROJUDI_PROCESSO: PROJUDIProcesso = {
  numero: '0001234-56.2024.8.16.0001',
  numeroAntigo: '2024.001234-5',
  classe: 'Ação Indenizatória',
  assunto: 'Responsabilidade Civil - Acidente de Trânsito',
  comarca: 'Curitiba',
  vara: '1a Vara Cível de Curitiba',
  juiz: 'Dra. Ana Paula Ferreira',
  dataDistribuicao: '2024-09-20',
  valorCausa: 45000.0,
  autor: 'Pedro Henrique Souza',
  reu: 'Seguradora Confiança S.A.',
  advogadoAutor: 'Dr. Marcos Ribeiro - OAB/PR 45678',
  advogadoReu: 'Dra. Luciana Costa - OAB/PR 87654',
  situacao: 'Em Andamento',
  andamentos: [
    {
      data: '2024-11-18',
      tipo: 'SENTENCA',
      descricao: 'Sentença proferida - Julgo procedente o pedido para condenar a ré ao pagamento de R$ 30.000,00 a título de danos materiais e R$ 15.000,00 por danos morais.',
      visibilidade: 'PUBLICA',
    },
    {
      data: '2024-11-05',
      tipo: 'AUDIENCIA',
      descricao: 'Realizada audiência de instrução e julgamento. Ouvidas as partes e testemunhas. Autos conclusos para sentença.',
      complemento: 'Ata de audiência juntada aos autos',
      visibilidade: 'PUBLICA',
    },
    {
      data: '2024-10-15',
      tipo: 'DESPACHO',
      descricao: 'Vistos. Defiro a produção de prova oral. Designo audiência de instrução e julgamento para o dia 05/11/2024, às 14h.',
      visibilidade: 'PUBLICA',
    },
    {
      data: '2024-10-01',
      tipo: 'CONTESTACAO',
      descricao: 'Juntada de contestação pela parte ré. Impugna o valor pretendido e alega culpa concorrente.',
      complemento: 'Peças: Contestação + 5 documentos',
      visibilidade: 'PUBLICA',
    },
    {
      data: '2024-09-25',
      tipo: 'CITACAO',
      descricao: 'Parte ré citada via oficial de justiça. Prazo de 15 dias para contestação.',
      visibilidade: 'PUBLICA',
    },
    {
      data: '2024-09-20',
      tipo: 'DISTRIBUICAO',
      descricao: 'Distribuído por sorteio à 1a Vara Cível de Curitiba.',
      visibilidade: 'PUBLICA',
    },
  ],
};

// ─── PROJUDI Adapter Implementation ─────────────────────────────────────────

/**
 * CourtAdapter implementation for the PROJUDI system.
 *
 * PROJUDI (Processo Judicial Digital) is used by several state courts,
 * particularly TJPR. It provides web-based process consultation,
 * movement tracking, and publication monitoring.
 *
 * Being gradually replaced by PJe, PROJUDI has a less standardized API
 * and relies more on web-based interactions. This adapter normalizes
 * the PROJUDI interface to match the unified CourtAdapter contract.
 *
 * Limitations compared to PJe:
 * - Less structured API responses
 * - Limited filing capabilities in some jurisdictions
 * - Older authentication mechanism
 * - No MNI compliance in some installations
 *
 * @example
 * ```typescript
 * const projudi = new PROJUDIAdapter();
 * await projudi.authenticate({
 *   system: 'projudi',
 *   username: 'advogado@email.com',
 *   password: 'password123',
 * });
 *
 * const result = await projudi.searchProcess('0001234-56.2024.8.16.0001');
 * ```
 */
export class PROJUDIAdapter implements CourtAdapter {
  readonly name: CourtSystem = 'projudi';

  private config: PROJUDIConfig;
  private sessionToken: string | null = null;
  private sessionExpiresAt: number = 0;
  private useMockData: boolean;

  constructor(config?: Partial<PROJUDIConfig>) {
    this.config = { ...DEFAULT_PROJUDI_CONFIG, ...config };
    this.useMockData = process.env.NODE_ENV === 'development' || !process.env.PROJUDI_API_URL;
  }

  // ─── Authentication ─────────────────────────────────────────────────────

  /**
   * Authenticate with PROJUDI using username and password.
   *
   * PROJUDI uses simple credential-based authentication. The session
   * token returned is used for all subsequent requests.
   *
   * @param credentials - Must include username and password
   */
  async authenticate(credentials: CourtCredentials): Promise<void> {
    if (credentials.system !== 'projudi') {
      throw new CourtAdapterError(
        `PROJUDI adapter received credentials for ${credentials.system}`,
        'projudi',
        'AUTH_FAILED',
      );
    }

    if (this.useMockData) {
      this.sessionToken = 'mock-projudi-session-' + Date.now();
      this.sessionExpiresAt = Date.now() + 3600 * 1000;
      return;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuario: credentials.username,
          senha: credentials.password,
        }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (response.status === 401 || response.status === 403) {
        throw new CourtAdapterError(
          'Invalid PROJUDI credentials',
          'projudi',
          'AUTH_FAILED',
          response.status,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `PROJUDI authentication failed: HTTP ${response.status}`,
          'projudi',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as {
        token: string;
        validade: number;
      };

      this.sessionToken = data.token;
      this.sessionExpiresAt = Date.now() + (data.validade - 60) * 1000;
    } catch (error) {
      if (error instanceof CourtAdapterError) throw error;
      throw new CourtAdapterError(
        `Failed to connect to PROJUDI: ${error instanceof Error ? error.message : String(error)}`,
        'projudi',
        'NETWORK_ERROR',
        undefined,
        true,
      );
    }
  }

  isAuthenticated(): boolean {
    return this.sessionToken !== null && Date.now() < this.sessionExpiresAt;
  }

  // ─── Process Search ───────────────────────────────────────────────────────

  /**
   * Search for a process in PROJUDI by CNJ number.
   *
   * PROJUDI supports both the unified CNJ number and the old format
   * (número antigo). This method searches by CNJ number.
   */
  async searchProcess(cnj: string): Promise<CourtSearchResult | null> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'projudi',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockSearchProcess(cnj);
    }

    return withRetry(async () => {
      const response = await this.apiRequest(
        `/api/processos/consulta?numero=${encodeURIComponent(cnj)}`,
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `PROJUDI search failed: HTTP ${response.status}`,
          'projudi',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as PROJUDIProcesso;
      return this.mapToSearchResult(data);
    }, this.config.retry);
  }

  // ─── Movements ────────────────────────────────────────────────────────────

  /**
   * Retrieve movements (andamentos) from PROJUDI.
   *
   * PROJUDI lists movements as "andamentos" with type, description,
   * and optional complement text. Only public visibility items are
   * returned (RESTRITA items require special permissions).
   */
  async getMovements(cnj: string, since?: string): Promise<ProcessMovement[]> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'projudi',
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
        `/api/processos/${encodeURIComponent(cnj)}/andamentos?${params.toString()}`,
      );

      if (response.status === 404) {
        throw new CourtAdapterError(
          `Process ${cnj} not found in PROJUDI`,
          'projudi',
          'PROCESS_NOT_FOUND',
          404,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to fetch PROJUDI movements: HTTP ${response.status}`,
          'projudi',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as { andamentos: PROJUDIAndamento[] };
      return data.andamentos
        .filter((a) => a.visibilidade === 'PUBLICA')
        .map((a, index) => this.mapAndamento(a, cnj, index));
    }, this.config.retry);
  }

  // ─── Filing ───────────────────────────────────────────────────────────────

  /**
   * File a petition through PROJUDI.
   *
   * PROJUDI filing support varies by jurisdiction. Some courts allow
   * full electronic filing while others require physical filing for
   * certain petition types.
   */
  async fileDocument(cnj: string, document: FilingPayload): Promise<FilingReceipt> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'projudi',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockFileDocument(cnj, document);
    }

    return withRetry(async () => {
      const response = await this.apiRequest(
        `/api/processos/${encodeURIComponent(cnj)}/peticionar`,
        {
          method: 'POST',
          body: JSON.stringify({
            tipo: document.petitionType,
            conteudo: document.content,
            arquivos: document.documents.map((doc) => ({
              nome: doc.name,
              dados: doc.data,
              tipo: doc.mimeType,
            })),
          }),
        },
      );

      if (response.status === 422 || response.status === 400) {
        const errorBody = await response.text();
        throw new CourtAdapterError(
          `PROJUDI filing rejected: ${errorBody}`,
          'projudi',
          'FILING_REJECTED',
          response.status,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `PROJUDI filing failed: HTTP ${response.status}`,
          'projudi',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const result = (await response.json()) as {
        protocolo: string;
        data: string;
        vara: string;
      };

      return {
        protocolNumber: result.protocolo,
        filedAt: result.data,
        court: result.vara,
        cnj,
        system: 'projudi' as const,
      };
    }, this.config.retry);
  }

  // ─── Deadlines ────────────────────────────────────────────────────────────

  /**
   * Retrieve deadlines from PROJUDI.
   * PROJUDI provides basic deadline tracking through its web interface.
   */
  async getDeadlines(cnj: string): Promise<CourtDeadline[]> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return this.mockGetDeadlines(cnj);
    }

    return withRetry(async () => {
      const response = await this.apiRequest(
        `/api/processos/${encodeURIComponent(cnj)}/prazos`,
      );

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as {
        prazos: Array<{
          descricao: string;
          dataFinal: string;
          tipo: string;
        }>;
      };

      return data.prazos.map((p) => ({
        processId: cnj,
        title: p.descricao,
        dueDate: p.dataFinal,
        type: p.tipo.toLowerCase(),
        source: 'projudi',
      }));
    }, this.config.retry);
  }

  // ─── Publications ─────────────────────────────────────────────────────────

  /**
   * Retrieve DJE publications from PROJUDI.
   *
   * PROJUDI integrates with the local DJE (Diário de Justiça Eletrônico)
   * and provides publication search by OAB number.
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
        `/api/publicacoes?${params.toString()}`,
      );

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to fetch PROJUDI publications: HTTP ${response.status}`,
          'projudi',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as { publicacoes: PROJUDIPublicacao[] };

      return data.publicacoes.map((pub) => ({
        id: pub.id,
        processId: pub.processo,
        source: `DJE ${pub.diario}`,
        content: pub.conteudo,
        publicationDate: pub.dataPublicacao,
        isRead: false,
        matchedOab: oab,
        createdAt: new Date().toISOString(),
      }));
    }, this.config.retry);
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  private ensureAuthenticated(): void {
    if (!this.isAuthenticated()) {
      throw new CourtAdapterError(
        'PROJUDI adapter is not authenticated. Call authenticate() first.',
        'projudi',
        'AUTH_EXPIRED',
      );
    }
  }

  private async apiRequest(path: string, init?: RequestInit): Promise<Response> {
    const url = `${this.config.baseUrl}${path}`;
    return fetch(url, {
      ...init,
      headers: {
        'Authorization': `Token ${this.sessionToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(init?.headers as Record<string, string>),
      },
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });
  }

  private mapToSearchResult(data: PROJUDIProcesso): CourtSearchResult {
    const lastAndamento = data.andamentos[0];
    return {
      cnj: data.numero,
      title: `${data.autor} vs ${data.reu} - ${data.classe}`,
      court: data.vara,
      vara: data.vara,
      comarca: data.comarca,
      status: data.situacao,
      lastMovement: lastAndamento?.descricao,
      source: 'projudi',
    };
  }

  private mapAndamento(
    andamento: PROJUDIAndamento,
    cnj: string,
    index: number,
  ): ProcessMovement {
    const description = andamento.complemento
      ? `${andamento.descricao} (${andamento.complemento})`
      : andamento.descricao;

    return {
      id: `projudi-${cnj}-${index}`,
      processId: cnj,
      date: new Date(andamento.data).toISOString(),
      description,
      type: andamento.tipo,
      source: 'pje',
      isRead: false,
    };
  }

  // ─── Mock Implementations ─────────────────────────────────────────────────

  private mockSearchProcess(cnj: string): CourtSearchResult {
    const mock = { ...MOCK_PROJUDI_PROCESSO, numero: cnj };
    return this.mapToSearchResult(mock);
  }

  private mockGetMovements(cnj: string, since?: string): ProcessMovement[] {
    let movements = MOCK_PROJUDI_PROCESSO.andamentos
      .filter((a) => a.visibilidade === 'PUBLICA')
      .map((a, i) => this.mapAndamento(a, cnj, i));

    if (since) {
      const sinceDate = new Date(since).getTime();
      movements = movements.filter((m) => new Date(m.date).getTime() >= sinceDate);
    }

    return movements;
  }

  private mockFileDocument(cnj: string, _document: FilingPayload): FilingReceipt {
    return {
      protocolNumber: `PROJUDI-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      filedAt: new Date().toISOString(),
      court: '1a Vara Cível de Curitiba - TJPR',
      cnj,
      system: 'projudi',
    };
  }

  private mockGetDeadlines(cnj: string): CourtDeadline[] {
    const now = new Date();
    return [
      {
        processId: cnj,
        title: 'Prazo para interposição de recurso de apelação',
        dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'fatal',
        source: 'projudi',
      },
      {
        processId: cnj,
        title: 'Prazo para cumprimento de sentença',
        dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'judicial',
        source: 'projudi',
      },
    ];
  }

  private mockGetPublications(oab: string, since?: string): Publication[] {
    const pubs: Publication[] = [
      {
        id: 'pub-projudi-001',
        processId: '0001234-56.2024.8.16.0001',
        source: 'DJE - TJPR',
        content: `PODER JUDICIÁRIO DO ESTADO DO PARANÁ - 1a Vara Cível de Curitiba - Processo 0001234-56.2024.8.16.0001 - Ação Indenizatória - Autor: Pedro Henrique Souza - Réu: Seguradora Confiança S.A. - SENTENÇA: Julgo procedente o pedido para condenar a ré. Intimem-se as partes. Advogado: ${oab}`,
        publicationDate: '2024-11-19T00:00:00Z',
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
