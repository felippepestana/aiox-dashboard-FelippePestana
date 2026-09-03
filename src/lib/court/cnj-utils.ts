// =============================================================================
// CNJ Number Utilities
// Parse, validate, and extract tribunal info from CNJ process numbers
// CNJ format: NNNNNNN-DD.AAAA.J.TR.OOOO
// =============================================================================
//
// CNJ Resolução 65/2008 establishes the unified numbering standard.
//
// Segments:
//   NNNNNNN   7-digit sequential number
//   DD        2-digit verification digits (mod 97 check)
//   AAAA      4-digit year of filing
//   J         1-digit justice segment code
//   TR        2-digit tribunal code within the segment
//   OOOO      4-digit origin (comarca/vara) code
//
// Justice Segments (J):
//   1 = Supremo Tribunal Federal (STF)
//   2 = Conselho Nacional de Justiça (CNJ) / Superior Tribunal de Justiça (STJ)
//   3 = Superior Tribunal Eleitoral (TSE)
//   4 = Superior Tribunal Militar (STM)
//   5 = Justiça do Trabalho (TST / TRTs)
//   6 = Justiça Eleitoral (TREs)
//   7 = Justiça Militar Estadual
//   8 = Justiça Estadual (TJs)
//   9 = Justiça Federal (TRFs)
// =============================================================================

import { getDatajudAlias } from './tribunal-map';

/** Parsed components of a CNJ process number. */
export interface CNJParsed {
  /** Raw CNJ string as provided */
  raw: string;
  /** 7-digit sequential number */
  sequencial: string;
  /** 2-digit verification digits */
  digito: string;
  /** 4-digit year of filing */
  ano: string;
  /** Justice segment code (1 digit) */
  justica: string;
  /** Tribunal code within the segment (2 digits) */
  tribunal: string;
  /** Origin / vara code (4 digits) */
  origem: string;
  /** Human-readable tribunal name (e.g., "TJSP") */
  tribunalName: string;
  /**
   * DataJud index name for this tribunal (e.g., "api_publica_tjsp"), or null
   * when the tribunal has no public DataJud index (STF, CNJ, unknown codes).
   */
  datajudIndex: string | null;
}

/** CNJ regex: NNNNNNN-DD.AAAA.J.TR.OOOO */
const CNJ_PATTERN = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;

/**
 * Verify the CNJ mod-97 check digits (ISO 7064, Resolução CNJ 65/2008).
 *
 * The pair DD must equal 98 - ((NNNNNNN·10¹³ + AAAA·10⁹ + J·10⁸ + TR·10⁶ +
 * OOOO) · 100 mod 97). Assumes the string already matches CNJ_PATTERN.
 */
export function hasValidCNJCheckDigit(cnj: string): boolean {
  const clean = cnj.trim();
  if (!CNJ_PATTERN.test(clean)) return false;

  const digits = clean.replace(/[-./]/g, '');
  const sequencial = digits.substring(0, 7);
  const digito     = digits.substring(7, 9);
  const resto      = digits.substring(9, 20); // AAAA + J + TR + OOOO

  // Incremental mod-97 over the 20-digit base (sequencial + resto + '00'),
  // avoiding BigInt for compatibility with the ES2017 build target.
  let remainder = 0;
  for (const ch of sequencial + resto + '00') {
    remainder = (remainder * 10 + (ch.charCodeAt(0) - 48)) % 97;
  }
  return 98 - remainder === parseInt(digito, 10);
}

/**
 * Returns true when the string is a valid CNJ unified process number:
 * correct format AND valid mod-97 check digits (Resolução CNJ 65/2008).
 *
 * @example
 * isValidCNJ('0001234-71.2024.8.26.0100') // true (valid check digits)
 * isValidCNJ('123456')                     // false
 */
export function isValidCNJ(cnj: string): boolean {
  const clean = cnj.trim();
  return CNJ_PATTERN.test(clean) && hasValidCNJCheckDigit(clean);
}

/**
 * Parse a CNJ number into its individual components.
 * Returns null when the format is invalid.
 *
 * @example
 * const parts = parseCNJ('0001234-71.2024.8.26.0100');
 * // parts.sequencial  => '0001234'
 * // parts.ano         => '2024'
 * // parts.justica     => '8'
 * // parts.tribunal    => '26'
 * // parts.tribunalName => 'TJSP'
 * // parts.datajudIndex => 'api_publica_tjsp'
 */
export function parseCNJ(cnj: string): CNJParsed | null {
  const clean = cnj.trim();
  if (!isValidCNJ(clean)) return null;

  // Strip separators to get a flat digit string (20 chars)
  const digits = clean.replace(/[-./]/g, '');

  const sequencial = digits.substring(0, 7);
  const digito     = digits.substring(7, 9);
  const ano        = digits.substring(9, 13);
  const justica    = digits.substring(13, 14);
  const tribunal   = digits.substring(14, 16);
  const origem     = digits.substring(16, 20);

  const tribunalName  = resolveTribunalName(justica, tribunal);
  const datajudIndex  = resolveDatajudIndex(tribunalName);

  return {
    raw: clean,
    sequencial,
    digito,
    ano,
    justica,
    tribunal,
    origem,
    tribunalName,
    datajudIndex,
  };
}

/**
 * Return the DataJud Elasticsearch index name for a given tribunal shortname,
 * or null when the tribunal has no public DataJud index (STF, CNJ) or the
 * shortname is unknown — callers must handle null instead of assuming a
 * fallback court.
 *
 * @example
 * getDatajudIndex('TJSP')   // 'api_publica_tjsp'
 * getDatajudIndex('TRE-GO') // 'api_publica_tre-go'
 * getDatajudIndex('STF')    // null (not covered by DataJud)
 */
export function getDatajudIndex(tribunalName: string): string | null {
  return resolveDatajudIndex(tribunalName);
}

/**
 * Infer the tribunal short-name from a CNJ number.
 * Returns null for an invalid CNJ.
 *
 * @example
 * getTribunalFromCNJ('0001234-71.2024.8.26.0100') // 'TJSP'
 * getTribunalFromCNJ('0001234-98.2024.5.02.0000') // 'TRT2'
 */
export function getTribunalFromCNJ(cnj: string): string | null {
  const parsed = parseCNJ(cnj);
  return parsed ? parsed.tribunalName : null;
}

// ─── Segment / Tribunal resolution ──────────────────────────────────────────

function resolveTribunalName(justica: string, tribunal: string): string {
  switch (justica) {
    case '1': return 'STF';
    case '2': return tribunal === '00' ? 'CNJ' : 'STJ';
    case '3': return 'TSE';
    case '4': return 'STM';
    case '5': return resolveTrabalhista(tribunal);
    case '6': return resolveTreCode(tribunal);
    case '7': return resolveJusticaMilitar(tribunal);
    case '8': return resolveTjCode(tribunal);
    case '9': return resolveTrfCode(tribunal);
    default:  return 'DESCONHECIDO';
  }
}

/** Justiça do Trabalho: segment 5 */
function resolveTrabalhista(code: string): string {
  if (code === '00') return 'TST';
  const num = parseInt(code, 10);
  if (num >= 1 && num <= 24) return `TRT${num}`;
  return 'TST';
}

/** Justiça Eleitoral: segment 6 */
function resolveTreCode(code: string): string {
  const stateMap: Record<string, string> = {
    '01': 'TRE-AC', '02': 'TRE-AL', '03': 'TRE-AP', '04': 'TRE-AM',
    '05': 'TRE-BA', '06': 'TRE-CE', '07': 'TRE-DF', '08': 'TRE-ES',
    '09': 'TRE-GO', '10': 'TRE-MA', '11': 'TRE-MT', '12': 'TRE-MS',
    '13': 'TRE-MG', '14': 'TRE-PA', '15': 'TRE-PB', '16': 'TRE-PR',
    '17': 'TRE-PE', '18': 'TRE-PI', '19': 'TRE-RJ', '20': 'TRE-RN',
    '21': 'TRE-RS', '22': 'TRE-RO', '23': 'TRE-RR', '24': 'TRE-SC',
    '25': 'TRE-SE', '26': 'TRE-SP', '27': 'TRE-TO',
  };
  return stateMap[code] || 'TSE';
}

/** Justiça Militar Estadual: segment 7 */
function resolveJusticaMilitar(code: string): string {
  const map: Record<string, string> = {
    '13': 'TJM-MG', '21': 'TJM-RS', '26': 'TJM-SP',
  };
  return map[code] || 'STM';
}

/** Justiça Estadual: segment 8 — tribunal codes map to TJ state abbreviations */
function resolveTjCode(code: string): string {
  const stateMap: Record<string, string> = {
    '01': 'TJAC', '02': 'TJAL', '03': 'TJAP', '04': 'TJAM',
    '05': 'TJBA', '06': 'TJCE', '07': 'TJDF', '08': 'TJES',
    '09': 'TJGO', '10': 'TJMA', '11': 'TJMT', '12': 'TJMS',
    '13': 'TJMG', '14': 'TJPA', '15': 'TJPB', '16': 'TJPR',
    '17': 'TJPE', '18': 'TJPI', '19': 'TJRJ', '20': 'TJRN',
    '21': 'TJRS', '22': 'TJRO', '23': 'TJRR', '24': 'TJSC',
    '25': 'TJSE', '26': 'TJSP', '27': 'TJTO',
  };
  return stateMap[code] || 'TJSP';
}

/** Justiça Federal: segment 9 — TRF regions */
function resolveTrfCode(code: string): string {
  const num = parseInt(code, 10);
  if (num >= 1 && num <= 6) return `TRF${num}`;
  return 'TRF1';
}

// ─── DataJud index resolution ────────────────────────────────────────────────

function resolveDatajudIndex(tribunalName: string): string | null {
  const alias = getDatajudAlias(tribunalName);
  return alias ? `api_publica_${alias}` : null;
}
