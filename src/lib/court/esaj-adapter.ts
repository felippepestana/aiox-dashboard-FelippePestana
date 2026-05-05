// =============================================================================
// e-SAJ Adapter - Sistema de Automação da Justiça (TJSP and others)
// Web-based court system integration
// =============================================================================
//
// e-SAJ is the electronic court system developed by Softplan and used primarily
// by the Tribunal de Justiça de São Paulo (TJSP), the largest state court in
// Latin America handling 30%+ of all Brazilian judicial processes.
//
// Also adopted by: TJCE, TJMS, TJAM, TJSC (partially), and others.
//
// Architecture:
// - Web-based with REST API endpoints
// - Authentication: username/password + OAB registration
// - Process consultation via web service
// - Publication monitoring through DJE endpoints
// - Filing through peticionamento eletrônico
//
// Reference: https://esaj.tjsp.jus.br/
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

// ─── e-SAJ Configuration ───────────────────────────────────────────────────

interface ESAJConfig {
  baseUrl: string;
  timeoutMs: number;
  retry: RetryConfig;
}

const DEFAULT_ESAJ_CONFIG: ESAJConfig = {
  baseUrl: process.env.ESAJ_API_URL || 'https://esaj.tjsp.jus.br',
  timeoutMs: 30000,
  retry: DEFAULT_RETRY_CONFIG,
};

// ─── e-SAJ Response Types ───────────────────────────────────────────────────

interface ESAJSessionResponse {
  sessionId: string;
  expiresAt: string;
  userName: string;
  oabNumber: string;
}

interface ESAJProcessResponse {
  numeroProcesso: string;
  classe: string;
  assunto: string;
  foro: string;
  vara: string;
  juiz: string;
  dataDistribuicao: string;
  valorAcao: number;
  partes: {
    ativo: ESAJParte[];
    passivo: ESAJParte[];
  };
  andamentos: ESAJAndamento[];
  situacao: string;
  area: string;
}

interface ESAJParte {
  nome: string;
  tipo: string;
  documento: string;
  advogados: string[];
}

interface ESAJAndamento {
  data: string;
  titulo: string;
  descricao: string;
  tipo: string;
}

interface ESAJPublicacao {
  id: string;
  dataPublicacao: string;
  caderno: string;
  pagina: number;
  conteudo: string;
  numeroProcesso?: string;
  vara?: string;
  comarca?: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_ESAJ_PROCESS: ESAJProcessResponse = {
  numeroProcesso: '1001234-56.2024.8.26.0100',
  classe: 'Procedimento Comum Cível',
  assunto: 'Indenização por Dano Moral',
  foro: 'Foro Central Cível',
  vara: '1a Vara Cível',
  juiz: 'Dr. Antonio Silva',
  dataDistribuicao: '2024-10-15',
  valorAcao: 75000.0,
  partes: {
    ativo: [
      {
        nome: 'Maria Oliveira Santos',
        tipo: 'Autor',
        documento: '987.654.321-00',
        advogados: ['Dr. Carlos Mendes - OAB/SP 123456'],
      },
    ],
    passivo: [
      {
        nome: 'Telecom Brasil S.A.',
        tipo: 'Réu',
        documento: '33.000.167/0001-01',
        advogados: ['Dra. Fernanda Rocha - OAB/SP 654321'],
      },
    ],
  },
  andamentos: [
    {
      data: '2024-11-20',
      titulo: 'Juntada de Petição',
      descricao: 'Juntada a petição de contestação da parte ré',
      tipo: 'JUNTADA',
    },
    {
      data: '2024-11-15',
      titulo: 'Despacho',
      descricao: 'Vistos. Cite-se a parte ré para contestar no prazo de 15 dias úteis.',
      tipo: 'DESPACHO',
    },
    {
      data: '2024-11-10',
      titulo: 'Conclusão ao Juiz',
      descricao: 'Autos conclusos ao juiz para despacho.',
      tipo: 'CONCLUSAO',
    },
    {
      data: '2024-10-15',
      titulo: 'Distribuição',
      descricao: 'Distribuído por sorteio ao juiz Dr. Antonio Silva - 1a Vara Cível.',
      tipo: 'DISTRIBUICAO',
    },
  ],
  situacao: 'Em andamento',
  area: 'Cível',
};

// ─── e-SAJ Adapter Implementation ───────────────────────────────────────────

/**
 * CourtAdapter implementation for the e-SAJ system.
 *
 * e-SAJ (Sistema de Automação da Justiça) is used by TJSP and several other
 * state courts. It provides web-based process consultation, filing, and
 * DJE publication monitoring.
 *
 * Key features:
 * - Process search by CNJ or internal number
 * - Movement/andamento retrieval
 * - DJE (Diário de Justiça Eletrônico) publication monitoring
 * - Electronic filing (peticionamento)
 * - CPOSG (Consulta de Processos do Segundo Grau) for appeals
 *
 * @example
 * ```typescript
 * const esaj = new ESAJAdapter();
 * await esaj.authenticate({
 *   system: 'esaj',
 *   username: 'advogado@oab.org.br',
 *   password: 'password123',
 * });
 *
 * const result = await esaj.searchProcess('1001234-56.2024.8.26.0100');
 * const pubs = await esaj.getPublications('SP123456');
 * ```
 */
export class ESAJAdapter implements CourtAdapter {
  readonly name: CourtSystem = 'esaj';

  private config: ESAJConfig;
  private sessionId: string | null = null;
  private sessionExpiresAt: number = 0;
  private useMockData: boolean;

  constructor(config?: Partial<ESAJConfig>) {
    this.config = { ...DEFAULT_ESAJ_CONFIG, ...config };
    this.useMockData = process.env.NODE_ENV === 'development' || !process.env.ESAJ_API_URL;
  }

  // ─── Authentication ─────────────────────────────────────────────────────

  /**
   * Authenticate with e-SAJ using username and password.
   *
   * e-SAJ uses session-based authentication. The login endpoint returns
   * a session cookie that must be included in subsequent requests.
   *
   * @param credentials - Must include username (OAB email) and password
   */
  async authenticate(credentials: CourtCredentials): Promise<void> {
    if (credentials.system !== 'esaj') {
      throw new CourtAdapterError(
        `e-SAJ adapter received credentials for ${credentials.system}`,
        'esaj',
        'AUTH_FAILED',
      );
    }

    if (this.useMockData) {
      this.sessionId = 'mock-esaj-session-' + Date.now();
      this.sessionExpiresAt = Date.now() + 3600 * 1000;
      return;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/sajcas/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: credentials.username,
          password: credentials.password || '',
          lt: '',
          execution: 'e1s1',
          _eventId: 'submit',
        }).toString(),
        signal: AbortSignal.timeout(this.config.timeoutMs),
        redirect: 'manual',
      });

      // e-SAJ redirects on successful login (302)
      if (response.status === 302 || response.status === 200) {
        const cookies = response.headers.get('set-cookie') || '';
        const sessionMatch = cookies.match(/JSESSIONID=([^;]+)/);

        if (sessionMatch) {
          this.sessionId = sessionMatch[1];
          this.sessionExpiresAt = Date.now() + 3600 * 1000;
          return;
        }
      }

      if (response.status === 401 || response.status === 403) {
        throw new CourtAdapterError(
          'Invalid e-SAJ credentials',
          'esaj',
          'AUTH_FAILED',
          response.status,
        );
      }

      throw new CourtAdapterError(
        `e-SAJ authentication failed with status ${response.status}`,
        'esaj',
        'SYSTEM_UNAVAILABLE',
        response.status,
        true,
      );
    } catch (error) {
      if (error instanceof CourtAdapterError) throw error;
      throw new CourtAdapterError(
        `Failed to connect to e-SAJ: ${error instanceof Error ? error.message : String(error)}`,
        'esaj',
        'NETWORK_ERROR',
        undefined,
        true,
      );
    }
  }

  isAuthenticated(): boolean {
    return this.sessionId !== null && Date.now() < this.sessionExpiresAt;
  }

  // ─── Process Search ───────────────────────────────────────────────────────

  /**
   * Search for a process in e-SAJ by CNJ number.
   *
   * e-SAJ provides two consultation endpoints:
   * - CPOPG (Consulta de Processos do Primeiro Grau) for first instance
   * - CPOSG (Consulta de Processos do Segundo Grau) for appeals
   *
   * This method tries CPOPG first and falls back to CPOSG.
   */
  async searchProcess(cnj: string): Promise<CourtSearchResult | null> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'esaj',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockSearchProcess(cnj);
    }

    return withRetry(async () => {
      // Try first instance (CPOPG)
      const cpopgResponse = await this.apiRequest(
        `/cpopg/search.do?conversationId=&dadosConsulta.localPesquisa.cdLocal=-1&cbPesquisa=NUMPROC&dadosConsulta.tipoNuProcesso=UNIFICADO&numeroDigitoAnoUnificado=${cnj.substring(0, 15)}&foroNumeroUnificado=${cnj.substring(21)}&dadosConsulta.valorConsultaNuUnificado=${cnj}`,
      );

      if (cpopgResponse.ok) {
        const data = await cpopgResponse.json();
        if (data && (data as ESAJProcessResponse).numeroProcesso) {
          return this.mapProcessToSearchResult(data as ESAJProcessResponse);
        }
      }

      // Try second instance (CPOSG) if not found
      const cposgResponse = await this.apiRequest(
        `/cposg/search.do?conversationId=&paginaConsulta=0&cbPesquisa=NUMPROC&tipoNuProcesso=UNIFICADO&numeroDigitoAnoUnificado=${cnj.substring(0, 15)}&foroNumeroUnificado=${cnj.substring(21)}&dePesquisaNuUnificado=${cnj}`,
      );

      if (cposgResponse.ok) {
        const data = await cposgResponse.json();
        if (data && (data as ESAJProcessResponse).numeroProcesso) {
          return this.mapProcessToSearchResult(data as ESAJProcessResponse);
        }
      }

      return null;
    }, this.config.retry);
  }

  // ─── Movements ────────────────────────────────────────────────────────────

  /**
   * Retrieve movements (andamentos) for a process from e-SAJ.
   *
   * Movements are fetched from the CPOPG/CPOSG detail page which lists
   * all procedural events in reverse chronological order.
   */
  async getMovements(cnj: string, since?: string): Promise<ProcessMovement[]> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'esaj',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockGetMovements(cnj, since);
    }

    return withRetry(async () => {
      const response = await this.apiRequest(
        `/cpopg/show.do?processo.numero=${encodeURIComponent(cnj)}&output=json`,
      );

      if (response.status === 404) {
        throw new CourtAdapterError(
          `Process ${cnj} not found in e-SAJ`,
          'esaj',
          'PROCESS_NOT_FOUND',
          404,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to fetch e-SAJ movements: HTTP ${response.status}`,
          'esaj',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as ESAJProcessResponse;
      let movements = data.andamentos.map((a, index) =>
        this.mapAndamento(a, cnj, index),
      );

      if (since) {
        const sinceDate = new Date(since).getTime();
        movements = movements.filter((m) => new Date(m.date).getTime() >= sinceDate);
      }

      return movements;
    }, this.config.retry);
  }

  // ─── Filing ───────────────────────────────────────────────────────────────

  /**
   * File a petition through e-SAJ peticionamento eletrônico.
   *
   * e-SAJ filing requires:
   * 1. Valid session with lawyer authentication
   * 2. Process must exist and be accessible to the lawyer
   * 3. Petition type must be valid for the process stage
   * 4. Documents must be PDF format
   */
  async fileDocument(cnj: string, document: FilingPayload): Promise<FilingReceipt> {
    this.ensureAuthenticated();

    if (!isValidCNJ(cnj)) {
      throw new CourtAdapterError(
        `Invalid CNJ format: ${cnj}`,
        'esaj',
        'INVALID_CNJ',
      );
    }

    if (this.useMockData) {
      return this.mockFileDocument(cnj, document);
    }

    return withRetry(async () => {
      const formData = new FormData();
      formData.append('numeroProcesso', cnj);
      formData.append('tipoPeticao', document.petitionType);
      formData.append('descricao', document.content);

      for (const doc of document.documents) {
        const blob = new Blob(
          [Buffer.from(doc.data, 'base64')],
          { type: doc.mimeType },
        );
        formData.append('arquivos', blob, doc.name);
      }

      const response = await fetch(
        `${this.config.baseUrl}/pastadigital/peticionar.do`,
        {
          method: 'POST',
          headers: {
            'Cookie': `JSESSIONID=${this.sessionId}`,
          },
          body: formData,
          signal: AbortSignal.timeout(this.config.timeoutMs),
        },
      );

      if (response.status === 422 || response.status === 400) {
        const errorText = await response.text();
        throw new CourtAdapterError(
          `Filing rejected by e-SAJ: ${errorText}`,
          'esaj',
          'FILING_REJECTED',
          response.status,
        );
      }

      if (!response.ok) {
        throw new CourtAdapterError(
          `e-SAJ filing failed: HTTP ${response.status}`,
          'esaj',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const result = (await response.json()) as {
        protocolo: string;
        dataProtocolo: string;
        vara: string;
      };

      return {
        protocolNumber: result.protocolo,
        filedAt: result.dataProtocolo,
        court: result.vara,
        cnj,
        system: 'esaj' as const,
      };
    }, this.config.retry);
  }

  // ─── Deadlines ────────────────────────────────────────────────────────────

  /**
   * Retrieve deadlines from e-SAJ.
   * e-SAJ provides deadline information through the intimation panel.
   */
  async getDeadlines(cnj: string): Promise<CourtDeadline[]> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return this.mockGetDeadlines(cnj);
    }

    return withRetry(async () => {
      const response = await this.apiRequest(
        `/pastadigital/prazos.do?processo.numero=${encodeURIComponent(cnj)}&output=json`,
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
        type: p.tipo,
        source: 'esaj',
      }));
    }, this.config.retry);
  }

  // ─── Publications ─────────────────────────────────────────────────────────

  /**
   * Retrieve DJE publications from e-SAJ matching an OAB number.
   *
   * e-SAJ provides access to the Diário de Justiça Eletrônico (DJE) with
   * search capabilities by OAB number, party name, or process number.
   * Publications are available from the DJE cadernos (sections):
   * - Caderno 1: Judicial (Primeira Instância)
   * - Caderno 2: Judicial (Segunda Instância)
   * - Caderno 3: Extrajudicial
   */
  async getPublications(oab: string, since?: string): Promise<Publication[]> {
    this.ensureAuthenticated();

    if (this.useMockData) {
      return this.mockGetPublications(oab, since);
    }

    return withRetry(async () => {
      const params = new URLSearchParams({
        dadosConsulta: oab,
        tipoPesquisa: 'OAB',
        output: 'json',
      });
      if (since) params.set('dtInicio', since);

      const response = await this.apiRequest(
        `/dje/consultaPublicacoes.do?${params.toString()}`,
      );

      if (!response.ok) {
        throw new CourtAdapterError(
          `Failed to fetch DJE publications: HTTP ${response.status}`,
          'esaj',
          'SYSTEM_UNAVAILABLE',
          response.status,
          true,
        );
      }

      const data = (await response.json()) as { publicacoes: ESAJPublicacao[] };

      return data.publicacoes.map((pub) => ({
        id: pub.id,
        processId: pub.numeroProcesso,
        source: `DJE ${pub.caderno} - Pág. ${pub.pagina}`,
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
        'e-SAJ adapter is not authenticated. Call authenticate() first.',
        'esaj',
        'AUTH_EXPIRED',
      );
    }
  }

  private async apiRequest(path: string, init?: RequestInit): Promise<Response> {
    const url = path.startsWith('http') ? path : `${this.config.baseUrl}${path}`;
    return fetch(url, {
      ...init,
      headers: {
        'Cookie': `JSESSIONID=${this.sessionId}`,
        'Accept': 'application/json',
        ...(init?.headers as Record<string, string>),
      },
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });
  }

  private mapProcessToSearchResult(data: ESAJProcessResponse): CourtSearchResult {
    const lastAndamento = data.andamentos[0];
    return {
      cnj: data.numeroProcesso,
      title: `${data.partes.ativo[0]?.nome || 'Autor'} vs ${data.partes.passivo[0]?.nome || 'Réu'} - ${data.classe}`,
      court: data.foro,
      vara: data.vara,
      comarca: data.foro,
      status: data.situacao,
      lastMovement: lastAndamento?.descricao,
      source: 'esaj',
    };
  }

  private mapAndamento(
    andamento: ESAJAndamento,
    cnj: string,
    index: number,
  ): ProcessMovement {
    return {
      id: `esaj-${cnj}-${index}`,
      processId: cnj,
      date: new Date(andamento.data).toISOString(),
      description: `${andamento.titulo}: ${andamento.descricao}`,
      type: andamento.tipo,
      source: 'pje', // e-SAJ movements are normalized to the common source type
      isRead: false,
    };
  }

  // ─── Mock Implementations ─────────────────────────────────────────────────

  private mockSearchProcess(cnj: string): CourtSearchResult {
    const mock = { ...MOCK_ESAJ_PROCESS, numeroProcesso: cnj };
    return this.mapProcessToSearchResult(mock);
  }

  private mockGetMovements(cnj: string, since?: string): ProcessMovement[] {
    let movements = MOCK_ESAJ_PROCESS.andamentos.map((a, i) =>
      this.mapAndamento(a, cnj, i),
    );

    if (since) {
      const sinceDate = new Date(since).getTime();
      movements = movements.filter((m) => new Date(m.date).getTime() >= sinceDate);
    }

    return movements;
  }

  private mockFileDocument(cnj: string, _document: FilingPayload): FilingReceipt {
    return {
      protocolNumber: `ESAJ-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      filedAt: new Date().toISOString(),
      court: 'Foro Central Cível - TJSP',
      cnj,
      system: 'esaj',
    };
  }

  private mockGetDeadlines(cnj: string): CourtDeadline[] {
    const now = new Date();
    return [
      {
        processId: cnj,
        title: 'Prazo para réplica à contestação',
        dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'fatal',
        source: 'esaj',
      },
      {
        processId: cnj,
        title: 'Audiência de instrução e julgamento',
        dueDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'hearing',
        source: 'esaj',
      },
    ];
  }

  private mockGetPublications(oab: string, since?: string): Publication[] {
    const pubs: Publication[] = [
      {
        id: 'pub-esaj-001',
        processId: '1001234-56.2024.8.26.0100',
        source: 'DJE Caderno 1 - Judicial - Pág. 234',
        content: `PODER JUDICIÁRIO - TRIBUNAL DE JUSTIÇA DO ESTADO DE SÃO PAULO - 1a Vara Cível do Foro Central - Processo 1001234-56.2024.8.26.0100 - Indenização por Dano Moral - Autor: Maria Oliveira Santos - Réu: Telecom Brasil S.A. - Vistos. Cite-se a parte ré para, querendo, contestar a ação no prazo de 15 (quinze) dias úteis. Int. Advogado: ${oab}`,
        publicationDate: '2024-11-18T00:00:00Z',
        isRead: false,
        matchedOab: oab,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'pub-esaj-002',
        processId: '1009876-54.2024.8.26.0100',
        source: 'DJE Caderno 2 - Judicial - Pág. 567',
        content: `TRIBUNAL DE JUSTIÇA DO ESTADO DE SÃO PAULO - 5a Câmara de Direito Privado - Apelação Cível 1009876-54.2024.8.26.0100 - Comarca: São Paulo - Apelante: Banco do Crédito S.A. - Apelado: José Roberto Lima - V. Acórdão: Negaram provimento ao recurso. Advogado: ${oab}`,
        publicationDate: '2024-11-16T00:00:00Z',
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
