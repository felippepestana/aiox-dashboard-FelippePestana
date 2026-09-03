// =============================================================================
// Tribunal Map — single source of truth for DataJud tribunal coverage
// =============================================================================
//
// Alias/name tables derived from busca-processos-judiciais
// (https://github.com/joaotextor/busca-processos-judiciais), MIT License,
// Copyright (c) João Textor. Extended with TRE-GO (missing upstream) and
// normalized to this app's tribunal sigla conventions (hyphenated TREs and
// TJMs, TJDF instead of TJDFT).
//
// DataJud endpoint pattern: {base}/api_publica_{alias}/_search
// STF and CNJ have no public DataJud index — they intentionally resolve to
// null here; callers must surface "tribunal sem cobertura" instead of
// silently querying the wrong court.
// =============================================================================

/** Justice-branch segment a tribunal belongs to. */
export type TribunalSegment =
  | 'superior'
  | 'federal'
  | 'estadual'
  | 'trabalho'
  | 'eleitoral'
  | 'militar';

/** One tribunal covered by the DataJud public API. */
export interface TribunalInfo {
  /** App-convention short name (e.g. 'TJSP', 'TRE-GO', 'TJM-RS') */
  sigla: string;
  /** Full display name (e.g. 'Tribunal de Justiça de São Paulo') */
  nome: string;
  /** DataJud index alias — the {alias} in api_publica_{alias} */
  alias: string;
  segment: TribunalSegment;
}

const T = (
  sigla: string,
  nome: string,
  alias: string,
  segment: TribunalSegment,
): [string, TribunalInfo] => [sigla, { sigla, nome, alias, segment }];

/** All 91 tribunals with a public DataJud index, keyed by app sigla. */
export const TRIBUNAL_MAP: Record<string, TribunalInfo> = Object.fromEntries([
  // ── Superior courts ──
  T('TST', 'Tribunal Superior do Trabalho', 'tst', 'superior'),
  T('TSE', 'Tribunal Superior Eleitoral', 'tse', 'superior'),
  T('STJ', 'Superior Tribunal de Justiça', 'stj', 'superior'),
  T('STM', 'Superior Tribunal Militar', 'stm', 'superior'),

  // ── Justiça Federal (TRFs) ──
  T('TRF1', 'Tribunal Regional Federal da 1ª Região', 'trf1', 'federal'),
  T('TRF2', 'Tribunal Regional Federal da 2ª Região', 'trf2', 'federal'),
  T('TRF3', 'Tribunal Regional Federal da 3ª Região', 'trf3', 'federal'),
  T('TRF4', 'Tribunal Regional Federal da 4ª Região', 'trf4', 'federal'),
  T('TRF5', 'Tribunal Regional Federal da 5ª Região', 'trf5', 'federal'),
  T('TRF6', 'Tribunal Regional Federal da 6ª Região', 'trf6', 'federal'),

  // ── Justiça do Trabalho (TRTs) ──
  T('TRT1', 'Tribunal Regional do Trabalho da 1ª Região', 'trt1', 'trabalho'),
  T('TRT2', 'Tribunal Regional do Trabalho da 2ª Região', 'trt2', 'trabalho'),
  T('TRT3', 'Tribunal Regional do Trabalho da 3ª Região', 'trt3', 'trabalho'),
  T('TRT4', 'Tribunal Regional do Trabalho da 4ª Região', 'trt4', 'trabalho'),
  T('TRT5', 'Tribunal Regional do Trabalho da 5ª Região', 'trt5', 'trabalho'),
  T('TRT6', 'Tribunal Regional do Trabalho da 6ª Região', 'trt6', 'trabalho'),
  T('TRT7', 'Tribunal Regional do Trabalho da 7ª Região', 'trt7', 'trabalho'),
  T('TRT8', 'Tribunal Regional do Trabalho da 8ª Região', 'trt8', 'trabalho'),
  T('TRT9', 'Tribunal Regional do Trabalho da 9ª Região', 'trt9', 'trabalho'),
  T('TRT10', 'Tribunal Regional do Trabalho da 10ª Região', 'trt10', 'trabalho'),
  T('TRT11', 'Tribunal Regional do Trabalho da 11ª Região', 'trt11', 'trabalho'),
  T('TRT12', 'Tribunal Regional do Trabalho da 12ª Região', 'trt12', 'trabalho'),
  T('TRT13', 'Tribunal Regional do Trabalho da 13ª Região', 'trt13', 'trabalho'),
  T('TRT14', 'Tribunal Regional do Trabalho da 14ª Região', 'trt14', 'trabalho'),
  T('TRT15', 'Tribunal Regional do Trabalho da 15ª Região', 'trt15', 'trabalho'),
  T('TRT16', 'Tribunal Regional do Trabalho da 16ª Região', 'trt16', 'trabalho'),
  T('TRT17', 'Tribunal Regional do Trabalho da 17ª Região', 'trt17', 'trabalho'),
  T('TRT18', 'Tribunal Regional do Trabalho da 18ª Região', 'trt18', 'trabalho'),
  T('TRT19', 'Tribunal Regional do Trabalho da 19ª Região', 'trt19', 'trabalho'),
  T('TRT20', 'Tribunal Regional do Trabalho da 20ª Região', 'trt20', 'trabalho'),
  T('TRT21', 'Tribunal Regional do Trabalho da 21ª Região', 'trt21', 'trabalho'),
  T('TRT22', 'Tribunal Regional do Trabalho da 22ª Região', 'trt22', 'trabalho'),
  T('TRT23', 'Tribunal Regional do Trabalho da 23ª Região', 'trt23', 'trabalho'),
  T('TRT24', 'Tribunal Regional do Trabalho da 24ª Região', 'trt24', 'trabalho'),

  // ── Justiça Eleitoral (TREs) — note the hyphenated DataJud aliases ──
  T('TRE-AC', 'Tribunal Regional Eleitoral do Acre', 'tre-ac', 'eleitoral'),
  T('TRE-AL', 'Tribunal Regional Eleitoral de Alagoas', 'tre-al', 'eleitoral'),
  T('TRE-AM', 'Tribunal Regional Eleitoral do Amazonas', 'tre-am', 'eleitoral'),
  T('TRE-AP', 'Tribunal Regional Eleitoral do Amapá', 'tre-ap', 'eleitoral'),
  T('TRE-BA', 'Tribunal Regional Eleitoral da Bahia', 'tre-ba', 'eleitoral'),
  T('TRE-CE', 'Tribunal Regional Eleitoral do Ceará', 'tre-ce', 'eleitoral'),
  T('TRE-DF', 'Tribunal Regional Eleitoral do Distrito Federal', 'tre-dft', 'eleitoral'),
  T('TRE-ES', 'Tribunal Regional Eleitoral do Espírito Santo', 'tre-es', 'eleitoral'),
  // TRE-GO is missing upstream in busca-processos-judiciais; added here.
  T('TRE-GO', 'Tribunal Regional Eleitoral de Goiás', 'tre-go', 'eleitoral'),
  T('TRE-MA', 'Tribunal Regional Eleitoral do Maranhão', 'tre-ma', 'eleitoral'),
  T('TRE-MG', 'Tribunal Regional Eleitoral de Minas Gerais', 'tre-mg', 'eleitoral'),
  T('TRE-MS', 'Tribunal Regional Eleitoral do Mato Grosso do Sul', 'tre-ms', 'eleitoral'),
  T('TRE-MT', 'Tribunal Regional Eleitoral do Mato Grosso', 'tre-mt', 'eleitoral'),
  T('TRE-PA', 'Tribunal Regional Eleitoral do Pará', 'tre-pa', 'eleitoral'),
  T('TRE-PB', 'Tribunal Regional Eleitoral da Paraíba', 'tre-pb', 'eleitoral'),
  T('TRE-PE', 'Tribunal Regional Eleitoral de Pernambuco', 'tre-pe', 'eleitoral'),
  T('TRE-PI', 'Tribunal Regional Eleitoral do Piauí', 'tre-pi', 'eleitoral'),
  T('TRE-PR', 'Tribunal Regional Eleitoral do Paraná', 'tre-pr', 'eleitoral'),
  T('TRE-RJ', 'Tribunal Regional Eleitoral do Rio de Janeiro', 'tre-rj', 'eleitoral'),
  T('TRE-RN', 'Tribunal Regional Eleitoral do Rio Grande do Norte', 'tre-rn', 'eleitoral'),
  T('TRE-RO', 'Tribunal Regional Eleitoral de Rondônia', 'tre-ro', 'eleitoral'),
  T('TRE-RR', 'Tribunal Regional Eleitoral de Roraima', 'tre-rr', 'eleitoral'),
  T('TRE-RS', 'Tribunal Regional Eleitoral do Rio Grande do Sul', 'tre-rs', 'eleitoral'),
  T('TRE-SC', 'Tribunal Regional Eleitoral de Santa Catarina', 'tre-sc', 'eleitoral'),
  T('TRE-SE', 'Tribunal Regional Eleitoral de Sergipe', 'tre-se', 'eleitoral'),
  T('TRE-SP', 'Tribunal Regional Eleitoral de São Paulo', 'tre-sp', 'eleitoral'),
  T('TRE-TO', 'Tribunal Regional Eleitoral do Tocantins', 'tre-to', 'eleitoral'),

  // ── Justiça Estadual (TJs) ──
  T('TJAC', 'Tribunal de Justiça do Acre', 'tjac', 'estadual'),
  T('TJAL', 'Tribunal de Justiça de Alagoas', 'tjal', 'estadual'),
  T('TJAM', 'Tribunal de Justiça do Amazonas', 'tjam', 'estadual'),
  T('TJAP', 'Tribunal de Justiça do Amapá', 'tjap', 'estadual'),
  T('TJBA', 'Tribunal de Justiça da Bahia', 'tjba', 'estadual'),
  T('TJCE', 'Tribunal de Justiça do Ceará', 'tjce', 'estadual'),
  // TJDF uses the 'tjdft' index alias in DataJud
  T('TJDF', 'Tribunal de Justiça do Distrito Federal e Territórios', 'tjdft', 'estadual'),
  T('TJES', 'Tribunal de Justiça do Espírito Santo', 'tjes', 'estadual'),
  T('TJGO', 'Tribunal de Justiça de Goiás', 'tjgo', 'estadual'),
  T('TJMA', 'Tribunal de Justiça do Maranhão', 'tjma', 'estadual'),
  T('TJMG', 'Tribunal de Justiça de Minas Gerais', 'tjmg', 'estadual'),
  T('TJMS', 'Tribunal de Justiça do Mato Grosso do Sul', 'tjms', 'estadual'),
  T('TJMT', 'Tribunal de Justiça do Mato Grosso', 'tjmt', 'estadual'),
  T('TJPA', 'Tribunal de Justiça do Pará', 'tjpa', 'estadual'),
  T('TJPB', 'Tribunal de Justiça da Paraíba', 'tjpb', 'estadual'),
  T('TJPE', 'Tribunal de Justiça de Pernambuco', 'tjpe', 'estadual'),
  T('TJPI', 'Tribunal de Justiça do Piauí', 'tjpi', 'estadual'),
  T('TJPR', 'Tribunal de Justiça do Paraná', 'tjpr', 'estadual'),
  T('TJRJ', 'Tribunal de Justiça do Rio de Janeiro', 'tjrj', 'estadual'),
  T('TJRN', 'Tribunal de Justiça do Rio Grande do Norte', 'tjrn', 'estadual'),
  T('TJRO', 'Tribunal de Justiça de Rondônia', 'tjro', 'estadual'),
  T('TJRR', 'Tribunal de Justiça de Roraima', 'tjrr', 'estadual'),
  T('TJRS', 'Tribunal de Justiça do Rio Grande do Sul', 'tjrs', 'estadual'),
  T('TJSC', 'Tribunal de Justiça de Santa Catarina', 'tjsc', 'estadual'),
  T('TJSE', 'Tribunal de Justiça de Sergipe', 'tjse', 'estadual'),
  T('TJSP', 'Tribunal de Justiça de São Paulo', 'tjsp', 'estadual'),
  T('TJTO', 'Tribunal de Justiça do Tocantins', 'tjto', 'estadual'),

  // ── Justiça Militar Estadual ──
  T('TJM-MG', 'Tribunal de Justiça Militar de Minas Gerais', 'tjmmg', 'militar'),
  T('TJM-RS', 'Tribunal de Justiça Militar do Rio Grande do Sul', 'tjmrs', 'militar'),
  T('TJM-SP', 'Tribunal de Justiça Militar de São Paulo', 'tjmsp', 'militar'),
]);

/** All covered tribunals, for UI pickers and iteration. */
export const ALL_TRIBUNAIS: TribunalInfo[] = Object.values(TRIBUNAL_MAP);

// Lookup index tolerant to hyphen/case variations ('TREAC' ≡ 'TRE-AC',
// 'TJMRS' ≡ 'TJM-RS') plus the upstream sigla spellings TJDFT/TREDFT.
const NORMALIZED_INDEX: Record<string, TribunalInfo> = (() => {
  const idx: Record<string, TribunalInfo> = {};
  for (const info of ALL_TRIBUNAIS) {
    idx[info.sigla] = info;
    idx[info.sigla.replace(/-/g, '')] = info;
  }
  idx['TJDFT'] = TRIBUNAL_MAP['TJDF'];
  idx['TREDFT'] = TRIBUNAL_MAP['TRE-DF'];
  return idx;
})();

/** Resolve any sigla spelling to its TribunalInfo, or null when uncovered. */
export function getTribunalInfo(sigla: string): TribunalInfo | null {
  return NORMALIZED_INDEX[sigla.trim().toUpperCase()] ?? null;
}

/**
 * DataJud index alias for a tribunal sigla (e.g. 'TJSP' → 'tjsp',
 * 'TRE-DF' → 'tre-dft'). Returns null for tribunals without a public
 * DataJud index (STF, CNJ) or unknown siglas — never falls back.
 */
export function getDatajudAlias(sigla: string): string | null {
  return getTribunalInfo(sigla)?.alias ?? null;
}

/** Full display name for a tribunal sigla, or null when unknown. */
export function getTribunalDisplayName(sigla: string): string | null {
  return getTribunalInfo(sigla)?.nome ?? null;
}
