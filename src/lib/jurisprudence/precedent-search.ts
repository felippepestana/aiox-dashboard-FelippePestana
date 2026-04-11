/**
 * Precedent Search Engine
 * Full-text search across cached precedent database with support for
 * STF, STJ, and state courts.
 */

export interface PrecedentResult {
  id: string;
  tribunal: string;
  orgao: string;
  relator: string;
  numero: string;
  date: string;
  ementa: string;
  tema?: string;
  relevanceScore: number;
  isVinculante: boolean;
  source: 'stf' | 'stj' | 'tj' | 'trt' | 'trf';
  url?: string;
}

export interface PrecedentSearchParams {
  keywords: string;
  tribunal?: string;
  dateFrom?: string;
  dateTo?: string;
  tema?: string;
  area?: string;
  relator?: string;
  limit?: number;
  offset?: number;
}

export interface PrecedentSearchResult {
  results: PrecedentResult[];
  total: number;
  query: PrecedentSearchParams;
  searchTime: number;
}

/**
 * Search for precedents across Brazilian courts.
 * In production, this would query DataJud, CODEX, or a local cache.
 * Currently returns mock data for development.
 */
export async function searchPrecedents(
  params: PrecedentSearchParams
): Promise<PrecedentSearchResult> {
  const startTime = Date.now();
  const { keywords, tribunal, limit = 20, offset = 0 } = params;

  // Mock precedent database for development
  const allPrecedents = getMockPrecedents();

  // Filter by keywords
  const keywordsLower = keywords.toLowerCase();
  let filtered = allPrecedents.filter(
    (p) =>
      p.ementa.toLowerCase().includes(keywordsLower) ||
      p.tema?.toLowerCase().includes(keywordsLower) ||
      p.numero.toLowerCase().includes(keywordsLower)
  );

  // Filter by tribunal
  if (tribunal) {
    filtered = filtered.filter((p) => p.tribunal.toLowerCase().includes(tribunal.toLowerCase()));
  }

  // Filter by date range
  if (params.dateFrom) {
    filtered = filtered.filter((p) => p.date >= params.dateFrom!);
  }
  if (params.dateTo) {
    filtered = filtered.filter((p) => p.date <= params.dateTo!);
  }

  // Score relevance
  const scored = filtered.map((p) => ({
    ...p,
    relevanceScore: calculateRelevance(p, keywordsLower),
  }));

  // Sort by relevance
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Paginate
  const paginated = scored.slice(offset, offset + limit);

  return {
    results: paginated,
    total: scored.length,
    query: params,
    searchTime: Date.now() - startTime,
  };
}

function calculateRelevance(precedent: PrecedentResult, keywords: string): number {
  let score = 0;
  const terms = keywords.split(/\s+/);

  for (const term of terms) {
    if (precedent.ementa.toLowerCase().includes(term)) score += 10;
    if (precedent.tema?.toLowerCase().includes(term)) score += 15;
    if (precedent.numero.toLowerCase().includes(term)) score += 20;
  }

  // Boost vinculante precedents
  if (precedent.isVinculante) score *= 1.5;

  // Boost recent precedents
  const year = parseInt(precedent.date.substring(0, 4));
  if (year >= 2024) score *= 1.3;
  else if (year >= 2022) score *= 1.1;

  // Boost superior courts
  if (precedent.source === 'stf') score *= 1.4;
  else if (precedent.source === 'stj') score *= 1.2;

  return Math.round(score);
}

function getMockPrecedents(): PrecedentResult[] {
  return [
    {
      id: 'stf-tema-988',
      tribunal: 'STJ',
      orgao: 'Corte Especial',
      relator: 'Min. Nancy Andrighi',
      numero: 'REsp 1.696.396/MT',
      date: '2018-12-05',
      ementa: 'RECURSO ESPECIAL REPRESENTATIVO DE CONTROVÉRSIA. DIREITO PROCESSUAL CIVIL. NATUREZA JURÍDICA DO ROL DO ART. 1.015 DO CPC/2015. IMPUGNAÇÃO IMEDIATA DE DECISÕES INTERLOCUTÓRIAS NÃO PREVISTAS NOS INCISOS DO REFERIDO DISPOSITIVO LEGAL. TAXATIVIDADE MITIGADA. REQUISITO OBJETIVO: URGÊNCIA.',
      tema: 'Tema 988 - Taxatividade mitigada do rol do art. 1.015 do CPC',
      relevanceScore: 0,
      isVinculante: true,
      source: 'stj',
    },
    {
      id: 'stj-sumula-72',
      tribunal: 'STJ',
      orgao: '2ª Seção',
      relator: 'Min. Ruy Rosado de Aguiar',
      numero: 'Súmula 72',
      date: '1993-04-14',
      ementa: 'A comprovação da mora é imprescindível à busca e apreensão do bem alienado fiduciariamente.',
      tema: 'Busca e apreensão - Alienação fiduciária - Mora',
      relevanceScore: 0,
      isVinculante: false,
      source: 'stj',
    },
    {
      id: 'stf-sv-14',
      tribunal: 'STF',
      orgao: 'Plenário',
      relator: 'Min. Cezar Peluso',
      numero: 'Súmula Vinculante 14',
      date: '2009-02-09',
      ementa: 'É direito do defensor, no interesse do representado, ter acesso amplo aos elementos de prova que, já documentados em procedimento investigatório realizado por órgão com competência de polícia judiciária, digam respeito ao exercício do direito de defesa.',
      tema: 'Acesso aos autos - Direito de defesa',
      relevanceScore: 0,
      isVinculante: true,
      source: 'stf',
    },
    {
      id: 'stj-resp-art489',
      tribunal: 'STJ',
      orgao: '3ª Turma',
      relator: 'Min. Marco Aurélio Bellizze',
      numero: 'REsp 1.927.341/SP',
      date: '2023-06-20',
      ementa: 'RECURSO ESPECIAL. PROCESSUAL CIVIL. FUNDAMENTAÇÃO DA DECISÃO JUDICIAL. ART. 489, §1º, DO CPC/2015. NULIDADE DA DECISÃO QUE NÃO ENFRENTA TODOS OS ARGUMENTOS DEDUZIDOS NO PROCESSO CAPAZES DE INFIRMAR A CONCLUSÃO ADOTADA.',
      tema: 'Fundamentação das decisões - Art. 489 CPC',
      relevanceScore: 0,
      isVinculante: false,
      source: 'stj',
    },
    {
      id: 'stf-tutela-urgencia',
      tribunal: 'STF',
      orgao: '1ª Turma',
      relator: 'Min. Luís Roberto Barroso',
      numero: 'ARE 1.327.429/SP',
      date: '2024-03-15',
      ementa: 'AGRAVO EM RECURSO EXTRAORDINÁRIO. DIREITO PROCESSUAL CIVIL. TUTELA DE URGÊNCIA. REQUISITOS DO ART. 300 DO CPC. PROBABILIDADE DO DIREITO E PERIGO DE DANO. ANÁLISE DO CASO CONCRETO.',
      tema: 'Tutela de urgência - Requisitos',
      relevanceScore: 0,
      isVinculante: false,
      source: 'stf',
    },
  ];
}
