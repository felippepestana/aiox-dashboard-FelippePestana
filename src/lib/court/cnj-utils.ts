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
  /** DataJud index name for this tribunal (e.g., "api_publica_tjsp") */
  datajudIndex: string;
}

/** CNJ regex: NNNNNNN-DD.AAAA.J.TR.OOOO */
const CNJ_PATTERN = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;

/**
 * Returns true when the string matches the CNJ unified process number format.
 *
 * @example
 * isValidCNJ('0001234-56.2024.8.26.0100') // true
 * isValidCNJ('123456')                     // false
 */
export function isValidCNJ(cnj: string): boolean {
  return CNJ_PATTERN.test(cnj.trim());
}

/**
 * Parse a CNJ number into its individual components.
 * Returns null when the format is invalid.
 *
 * @example
 * const parts = parseCNJ('0001234-56.2024.8.26.0100');
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
 * Return the DataJud Elasticsearch index name for a given tribunal shortname.
 * Falls back to 'api_publica_tjsp' when the tribunal is unknown.
 *
 * @example
 * getDatajudIndex('TJSP') // 'api_publica_tjsp'
 * getDatajudIndex('STF')  // 'api_publica_stf'
 * getDatajudIndex('TRF3') // 'api_publica_trf3'
 */
export function getDatajudIndex(tribunalName: string): string {
  return resolveDatajudIndex(tribunalName.toUpperCase());
}

/**
 * Infer the tribunal short-name from a CNJ number.
 * Returns null for an invalid CNJ.
 *
 * @example
 * getTribunalFromCNJ('0001234-56.2024.8.26.0100') // 'TJSP'
 * getTribunalFromCNJ('0001234-56.2024.5.02.0000') // 'TRT2'
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
    default:  return 'TJSP'; // safe fallback
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

// ─── DataJud index map ───────────────────────────────────────────────────────

const DATAJUD_INDEX_MAP: Record<string, string> = {
  // Supremo / Superior courts
  STF: 'api_publica_stf',
  STJ: 'api_publica_stj',
  CNJ: 'api_publica_cnj',
  TST: 'api_publica_tst',
  TSE: 'api_publica_tse',
  STM: 'api_publica_stm',

  // Justiça do Trabalho
  TRT1:  'api_publica_trt1',
  TRT2:  'api_publica_trt2',
  TRT3:  'api_publica_trt3',
  TRT4:  'api_publica_trt4',
  TRT5:  'api_publica_trt5',
  TRT6:  'api_publica_trt6',
  TRT7:  'api_publica_trt7',
  TRT8:  'api_publica_trt8',
  TRT9:  'api_publica_trt9',
  TRT10: 'api_publica_trt10',
  TRT11: 'api_publica_trt11',
  TRT12: 'api_publica_trt12',
  TRT13: 'api_publica_trt13',
  TRT14: 'api_publica_trt14',
  TRT15: 'api_publica_trt15',
  TRT16: 'api_publica_trt16',
  TRT17: 'api_publica_trt17',
  TRT18: 'api_publica_trt18',
  TRT19: 'api_publica_trt19',
  TRT20: 'api_publica_trt20',
  TRT21: 'api_publica_trt21',
  TRT22: 'api_publica_trt22',
  TRT23: 'api_publica_trt23',
  TRT24: 'api_publica_trt24',

  // Justiça Federal
  TRF1: 'api_publica_trf1',
  TRF2: 'api_publica_trf2',
  TRF3: 'api_publica_trf3',
  TRF4: 'api_publica_trf4',
  TRF5: 'api_publica_trf5',
  TRF6: 'api_publica_trf6',

  // Justiça Estadual
  TJAC:  'api_publica_tjac',
  TJAL:  'api_publica_tjal',
  TJAM:  'api_publica_tjam',
  TJAP:  'api_publica_tjap',
  TJBA:  'api_publica_tjba',
  TJCE:  'api_publica_tjce',
  TJDF:  'api_publica_tjdft',  // TJDF uses 'tjdft' suffix in DataJud
  TJES:  'api_publica_tjes',
  TJGO:  'api_publica_tjgo',
  TJMA:  'api_publica_tjma',
  TJMG:  'api_publica_tjmg',
  TJMS:  'api_publica_tjms',
  TJMT:  'api_publica_tjmt',
  TJPA:  'api_publica_tjpa',
  TJPB:  'api_publica_tjpb',
  TJPE:  'api_publica_tjpe',
  TJPI:  'api_publica_tjpi',
  TJPR:  'api_publica_tjpr',
  TJRJ:  'api_publica_tjrj',
  TJRN:  'api_publica_tjrn',
  TJRO:  'api_publica_tjro',
  TJRR:  'api_publica_tjrr',
  TJRS:  'api_publica_tjrs',
  TJSC:  'api_publica_tjsc',
  TJSE:  'api_publica_tjse',
  TJSP:  'api_publica_tjsp',
  TJTO:  'api_publica_tjto',
};

function resolveDatajudIndex(tribunalName: string): string {
  return DATAJUD_INDEX_MAP[tribunalName.toUpperCase()] || 'api_publica_tjsp';
}
