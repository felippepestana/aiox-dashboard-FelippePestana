// =============================================================================
// Court Systems Registry
// Maps Brazilian court systems to tribunals and exposes a unified lookup API
// =============================================================================
//
// Brazilian electronic court systems:
//
//   PJE    — Processo Judicial Eletrônico (CNJ standard, most federal + labor courts)
//   ESAJ   — Sistema de Automação da Justiça (TJSP, TJMS, TJAM, etc.)
//   PROJUDI— Processo Judicial Digital (TJPR, TJGO transitioning to PJe)
//   EPROC  — Processo Eletrônico (TRFs — federal regional courts)
//   DataJud— CNJ public API, read-only, covers all courts
// =============================================================================

import type { CourtSystem } from '@/types/legal';
import type { CourtSearchResult, ProcessMovement } from '@/types/legal';
import type { CourtDeadline } from './court-adapter';
import { getTribunalFromCNJ } from './cnj-utils';

// ─── CourtSystem descriptor ──────────────────────────────────────────────────

export interface CourtSystemDescriptor {
  /** Short identifier matching CourtSystem union type */
  type: CourtSystem;
  /** Full Portuguese name */
  name: string;
  /** Short display name for UI badges */
  shortName: string;
  /** Base URL template — use {tribunal} as placeholder where applicable */
  baseUrlTemplate: string;
  /** Array of tribunal codes that primarily use this system */
  tribunals: string[];
  /** Whether public consultation is available without authentication */
  hasPublicConsultation: boolean;
  /** Authentication type required for authenticated operations */
  authType: 'certificate' | 'password' | 'apikey' | 'none';
}

export const COURT_SYSTEMS: Record<CourtSystem, CourtSystemDescriptor> = {
  pje: {
    type: 'pje',
    name: 'Processo Judicial Eletrônico',
    shortName: 'PJe',
    baseUrlTemplate: 'https://pje.{tribunal}.jus.br/pje',
    tribunals: [
      'TST',
      'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8',
      'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15',
      'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22',
      'TRT23', 'TRT24',
      'TJDFT', 'TJBA', 'TJCE', 'TJMA', 'TJPI', 'TJRN', 'TJSE',
      'TJAL', 'TJPB', 'TJAC', 'TJAM', 'TJAP', 'TJPA', 'TJRR', 'TJTO',
      'TRF1', 'TRF3', 'TRF5',
    ],
    hasPublicConsultation: true,
    authType: 'certificate',
  },

  esaj: {
    type: 'esaj',
    name: 'Sistema de Automação da Justiça',
    shortName: 'e-SAJ',
    baseUrlTemplate: 'https://esaj.{tribunal}.jus.br',
    tribunals: ['TJSP', 'TJMS', 'TJAM', 'TJSC'],
    hasPublicConsultation: true,
    authType: 'password',
  },

  projudi: {
    type: 'projudi',
    name: 'Processo Judicial Digital',
    shortName: 'PROJUDI',
    baseUrlTemplate: 'https://projudi.{tribunal}.jus.br/projudi_consulta',
    tribunals: ['TJPR', 'TJGO'],
    hasPublicConsultation: true,
    authType: 'password',
  },

  eproc: {
    type: 'eproc',
    name: 'Processo Eletrônico',
    shortName: 'e-Proc',
    baseUrlTemplate: 'https://eproc.{tribunal}.jus.br',
    tribunals: ['TRF4', 'TRF1', 'TRF2'],
    hasPublicConsultation: false,
    authType: 'certificate',
  },

  datajud: {
    type: 'datajud',
    name: 'Base Nacional de Dados do Poder Judiciário',
    shortName: 'DataJud',
    baseUrlTemplate: 'https://api-publica.datajud.cnj.jus.br',
    // DataJud covers all Brazilian courts
    tribunals: ['*'],
    hasPublicConsultation: true,
    authType: 'apikey',
  },

  manual: {
    type: 'manual',
    name: 'Acompanhamento Manual',
    shortName: 'Manual',
    baseUrlTemplate: '',
    tribunals: [],
    hasPublicConsultation: false,
    authType: 'none',
  },
};

// ─── Tribunal → system lookup ────────────────────────────────────────────────

/**
 * Return the preferred CourtSystem for a given tribunal code.
 *
 * Priority order:
 *   1. ESAJ (TJSP is by far the highest volume)
 *   2. e-Proc (federal courts — TRF4/1/2)
 *   3. PROJUDI (state courts in transition)
 *   4. PJe (most other courts)
 *   5. DataJud (public-only fallback)
 *
 * @example
 * getCourtSystemForTribunal('TJSP')  // 'esaj'
 * getCourtSystemForTribunal('TRF4')  // 'eproc'
 * getCourtSystemForTribunal('TRT2')  // 'pje'
 * getCourtSystemForTribunal('STF')   // 'datajud'
 */
export function getCourtSystemForTribunal(tribunalCode: string): CourtSystem {
  const upper = tribunalCode.toUpperCase().trim();

  // ESAJ courts
  if (['TJSP', 'TJMS', 'TJAM', 'TJSC'].includes(upper)) return 'esaj';

  // e-Proc courts (TRF4 is canonical, but TRF1/2 also use it)
  if (['TRF4', 'TRF1', 'TRF2'].includes(upper)) return 'eproc';

  // PROJUDI courts (being phased out but still live)
  if (['TJPR', 'TJGO'].includes(upper)) return 'projudi';

  // PJe — most Justiça do Trabalho, several TJs, TRF3/5
  if (
    upper.startsWith('TRT') ||
    upper === 'TST' ||
    upper === 'TJDFT' ||
    ['TJBA', 'TJCE', 'TJMA', 'TJPI', 'TJRN', 'TJSE', 'TJAL', 'TJPB',
     'TJAC', 'TJAP', 'TJPA', 'TJRR', 'TJTO', 'TRF3', 'TRF5'].includes(upper)
  ) {
    return 'pje';
  }

  // Superior courts and everything else → read-only DataJud
  return 'datajud';
}

/**
 * Derive the court system directly from a CNJ process number.
 * Returns 'datajud' when the CNJ is invalid or the tribunal is unknown.
 */
export function getCourtSystemForCNJ(cnj: string): CourtSystem {
  const tribunal = getTribunalFromCNJ(cnj);
  if (!tribunal) return 'datajud';
  return getCourtSystemForTribunal(tribunal);
}

/**
 * Build the public consultation URL for a process in its court system.
 * Returns null for systems without public consultation or when URL cannot
 * be constructed.
 */
export function buildConsultationUrl(cnj: string, system?: CourtSystem): string | null {
  const tribunal = getTribunalFromCNJ(cnj);
  const resolvedSystem = system ?? (tribunal ? getCourtSystemForTribunal(tribunal) : 'datajud');

  switch (resolvedSystem) {
    case 'pje': {
      if (!tribunal) return null;
      // PJe tribunal subdomain uses lowercase, e.g., trf1, trt2, tjsp
      const sub = tribunal.toLowerCase();
      return `https://pje.${sub}.jus.br/pje/ConsultaPublica/listView.seam`;
    }

    case 'esaj': {
      // TJSP is the canonical ESAJ instance
      const sub = tribunal ? tribunal.toLowerCase() : 'tjsp';
      return `https://esaj.${sub}.jus.br/cpopg/open.do`;
    }

    case 'projudi': {
      if (!tribunal) return null;
      const sub = tribunal.toLowerCase();
      return `https://projudi.${sub}.jus.br/projudi_consulta/login.do`;
    }

    case 'eproc': {
      if (!tribunal) return null;
      const sub = tribunal.toLowerCase();
      return `https://eproc.${sub}.jus.br/eproc/externo_controlador.php?acao=processo_consulta_publica`;
    }

    case 'datajud':
      return `https://datajud-wiki.cnj.jus.br/api-publica/consulta`;

    default:
      return null;
  }
}

// ─── Unified result types for cross-system operations ────────────────────────

export interface CourtProcessData {
  cnj: string;
  system: CourtSystem;
  tribunal: string;
  /** Fetched from court system */
  searchResult: CourtSearchResult | null;
  movements: ProcessMovement[];
  deadlines: CourtDeadline[];
  /** Parties parsed from the court system */
  parties: CourtParty[];
  /** Documents listed at the court system */
  documents: CourtDocumentRef[];
  syncedAt: string;
  error?: string;
}

export interface CourtParty {
  role: 'autor' | 'reu' | 'advogado_autor' | 'advogado_reu' | 'terceiro' | 'outro';
  name: string;
  cpfCnpj?: string;
  oab?: string;
}

export interface CourtDocumentRef {
  id: string;
  title: string;
  type: string;
  date: string;
  url?: string;
}

// ─── Abstract base adapter with standard null-safe helpers ───────────────────

/**
 * Abstract base that concrete court adapters extend.
 * Every method returns null / empty array on failure — never throws —
 * so callers don't need try/catch for graceful degradation.
 */
export abstract class BaseCourtAdapter {
  abstract readonly system: CourtSystem;

  /** Search for a process by CNJ. Returns null when not found or unreachable. */
  abstract searchProcess(cnj: string): Promise<CourtSearchResult | null>;

  /** Return recent movements. Returns [] when unreachable. */
  abstract getMovements(cnj: string, since?: string): Promise<ProcessMovement[]>;

  /** Return parties. Returns [] when unreachable. */
  abstract getParties(cnj: string): Promise<CourtParty[]>;

  /** Return document list. Returns [] when unreachable. */
  abstract getDocuments(cnj: string): Promise<CourtDocumentRef[]>;

  /** Return pending deadlines. Returns [] when unreachable. */
  abstract getDeadlines(cnj: string): Promise<CourtDeadline[]>;

  /**
   * Perform a full sync of all available data for a process.
   * Aggregates results from all methods into a single CourtProcessData object.
   * Never throws — errors are captured in the `error` field.
   */
  async syncProcess(cnj: string): Promise<CourtProcessData> {
    const tribunal = getTribunalFromCNJ(cnj) ?? 'DESCONHECIDO';
    const syncedAt = new Date().toISOString();

    let searchResult: CourtSearchResult | null = null;
    let movements: ProcessMovement[] = [];
    let deadlines: CourtDeadline[] = [];
    let parties: CourtParty[] = [];
    let documents: CourtDocumentRef[] = [];
    let error: string | undefined;

    try {
      [searchResult, movements, deadlines, parties, documents] = await Promise.all([
        this.searchProcess(cnj).catch(() => null),
        this.getMovements(cnj).catch(() => []),
        this.getDeadlines(cnj).catch(() => []),
        this.getParties(cnj).catch(() => []),
        this.getDocuments(cnj).catch(() => []),
      ]);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    return {
      cnj,
      system: this.system,
      tribunal,
      searchResult,
      movements,
      deadlines,
      parties,
      documents,
      syncedAt,
      error,
    };
  }
}
