// =============================================================================
// Court Factory - Creates appropriate CourtAdapter instances
// Centralizes adapter instantiation and system discovery
// =============================================================================

import type { CourtSystem } from '@/types/legal';
import type { CourtAdapter } from './court-adapter';
import { CourtAdapterError } from './court-adapter';
import { PJeAdapter } from './pje-adapter';
import { DataJudAdapter } from './datajud-adapter';
import { ESAJAdapter } from './esaj-adapter';
import { EProcAdapter } from './eproc-adapter';
import { PROJUDIAdapter } from './projudi-adapter';

// ─── System Metadata ────────────────────────────────────────────────────────

export interface CourtSystemInfo {
  system: CourtSystem;
  displayName: string;
  description: string;
  /** Whether the system supports document filing */
  supportsFiling: boolean;
  /** Whether the system supports deadline tracking */
  supportsDeadlines: boolean;
  /** Whether the system supports DJE publication monitoring */
  supportsPublications: boolean;
  /** Authentication method required */
  authMethod: 'certificate' | 'password' | 'apikey' | 'manual';
  /** Courts/tribunals that use this system */
  courts: string[];
}

/**
 * Metadata for all supported court systems.
 */
const SYSTEM_INFO: Record<CourtSystem, CourtSystemInfo> = {
  pje: {
    system: 'pje',
    displayName: 'PJe - Processo Judicial Eletrônico',
    description: 'Primary CNJ electronic court system used by most Brazilian courts. Requires ICP-Brasil digital certificate.',
    supportsFiling: true,
    supportsDeadlines: true,
    supportsPublications: true,
    authMethod: 'certificate',
    courts: [
      'TST', 'TRTs', 'TJDFT', 'TJBA', 'TJCE', 'TJMA', 'TJPI',
      'TJRN', 'TJSE', 'TJAL', 'TJPB', 'TRF1', 'TRF3', 'TRF5',
    ],
  },
  esaj: {
    system: 'esaj',
    displayName: 'e-SAJ - Sistema de Automação da Justiça',
    description: 'Court system used by TJSP (largest state court) and other São Paulo courts. Supports username/password authentication.',
    supportsFiling: true,
    supportsDeadlines: true,
    supportsPublications: true,
    authMethod: 'password',
    courts: ['TJSP', 'TJCE', 'TJMS', 'TJAM', 'TJSC'],
  },
  eproc: {
    system: 'eproc',
    displayName: 'e-Proc - Processo Eletrônico',
    description: 'Electronic system for federal courts (TRFs). Supports certificate + password dual authentication.',
    supportsFiling: true,
    supportsDeadlines: true,
    supportsPublications: true,
    authMethod: 'certificate',
    courts: ['TRF4', 'TRF1', 'TRF2'],
  },
  projudi: {
    system: 'projudi',
    displayName: 'PROJUDI - Processo Judicial Digital',
    description: 'Digital court system used by TJPR, TJGO, and others. Being gradually replaced by PJe.',
    supportsFiling: true,
    supportsDeadlines: true,
    supportsPublications: true,
    authMethod: 'password',
    courts: ['TJPR', 'TJGO', 'TJRN', 'TJBA'],
  },
  datajud: {
    system: 'datajud',
    displayName: 'DataJud - Base Nacional de Dados do Poder Judiciário',
    description: 'CNJ public API providing read-only access to 144M+ processes. Requires API key.',
    supportsFiling: false,
    supportsDeadlines: false,
    supportsPublications: false,
    authMethod: 'apikey',
    courts: ['All Brazilian courts (read-only)'],
  },
  manual: {
    system: 'manual',
    displayName: 'Manual',
    description: 'Manual process tracking without court system integration.',
    supportsFiling: false,
    supportsDeadlines: false,
    supportsPublications: false,
    authMethod: 'manual',
    courts: [],
  },
};

// ─── Factory Function ───────────────────────────────────────────────────────

/**
 * Create a CourtAdapter instance for the specified court system.
 *
 * This factory function returns the appropriate adapter implementation
 * based on the court system identifier. Each adapter handles authentication,
 * process search, movement retrieval, filing, and publication monitoring
 * specific to that court system.
 *
 * @param system - The court system to create an adapter for
 * @returns An uninitialized CourtAdapter instance (call authenticate() before use)
 * @throws CourtAdapterError if the system is not supported
 *
 * @example
 * ```typescript
 * const adapter = createCourtAdapter('pje');
 * await adapter.authenticate(credentials);
 * const result = await adapter.searchProcess(cnj);
 * ```
 */
export function createCourtAdapter(system: CourtSystem): CourtAdapter {
  switch (system) {
    case 'pje':
      return new PJeAdapter();
    case 'esaj':
      return new ESAJAdapter();
    case 'eproc':
      return new EProcAdapter();
    case 'projudi':
      return new PROJUDIAdapter();
    case 'datajud':
      return new DataJudAdapter();
    case 'manual':
      throw new CourtAdapterError(
        'Manual system does not support automated court integration. Use the manual process management interface instead.',
        'manual',
        'SYSTEM_UNAVAILABLE',
      );
    default: {
      const _exhaustive: never = system;
      throw new CourtAdapterError(
        `Unsupported court system: ${_exhaustive}`,
        system,
        'UNKNOWN',
      );
    }
  }
}

/**
 * Get a list of all available (non-manual) court systems with their metadata.
 *
 * @returns Array of CourtSystem identifiers that can be passed to createCourtAdapter
 */
export function getAvailableSystems(): CourtSystem[] {
  return ['pje', 'esaj', 'eproc', 'projudi', 'datajud'];
}

/**
 * Get metadata for all supported court systems.
 *
 * @returns Array of CourtSystemInfo objects with display names, descriptions,
 * and capability flags.
 */
export function getSystemsInfo(): CourtSystemInfo[] {
  return Object.values(SYSTEM_INFO);
}

/**
 * Get metadata for a specific court system.
 *
 * @param system - The court system to get info for
 * @returns CourtSystemInfo object
 */
export function getSystemInfo(system: CourtSystem): CourtSystemInfo {
  return SYSTEM_INFO[system];
}

/**
 * Determine which court system a tribunal likely uses based on its code.
 *
 * This is a best-effort mapping. Some courts have multiple systems or
 * are in transition between systems.
 *
 * @param tribunal - Tribunal code (e.g., 'TJSP', 'TRF4', 'TST')
 * @returns The primary CourtSystem used by the tribunal, or 'datajud' as fallback
 */
export function inferSystemFromTribunal(tribunal: string): CourtSystem {
  const upper = tribunal.toUpperCase();

  // e-SAJ courts
  if (['TJSP'].includes(upper)) return 'esaj';

  // e-Proc courts
  if (['TRF4', 'TRF1', 'TRF2'].includes(upper)) return 'eproc';

  // PROJUDI courts
  if (['TJPR', 'TJGO'].includes(upper)) return 'projudi';

  // PJe courts (default for most others)
  if (
    upper.startsWith('TJ') ||
    upper.startsWith('TRT') ||
    upper === 'TST' ||
    upper === 'TJDFT' ||
    upper.startsWith('TRF')
  ) {
    return 'pje';
  }

  // Fallback to DataJud for read-only access
  return 'datajud';
}

/**
 * Search for a process across multiple court systems simultaneously.
 *
 * Useful when the court system for a process is unknown. Queries DataJud
 * first (broadest coverage), then tries the system inferred from the CNJ number.
 *
 * @param cnj - CNJ process number
 * @param credentials - Map of credentials keyed by court system
 * @returns The first successful search result, or null
 */
export async function searchAcrossSystems(
  cnj: string,
  credentials: Partial<Record<CourtSystem, import('./court-adapter').CourtCredentials>>,
): Promise<{ result: import('@/types/legal').CourtSearchResult; system: CourtSystem } | null> {
  const systemsToTry: CourtSystem[] = [];

  // Always try DataJud first (broadest coverage, read-only)
  if (credentials.datajud) {
    systemsToTry.push('datajud');
  }

  // Infer the likely system from the CNJ number
  const inferred = inferSystemFromTribunal(cnj);
  if (inferred !== 'datajud' && credentials[inferred]) {
    systemsToTry.push(inferred);
  }

  // Try all systems with available credentials
  for (const system of systemsToTry) {
    try {
      const adapter = createCourtAdapter(system);
      const cred = credentials[system];
      if (!cred) continue;

      await adapter.authenticate(cred);
      const result = await adapter.searchProcess(cnj);

      if (result) {
        return { result, system };
      }
    } catch {
      // Continue to next system on error
      continue;
    }
  }

  return null;
}
