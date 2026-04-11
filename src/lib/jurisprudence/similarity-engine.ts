// =============================================================================
// PEDRO-style Case Similarity Engine
// Compares case text against precedent database using text similarity scoring.
// Inspired by CNJ/UnB PEDRO platform (Plataforma de Extracao e Descoberta de Precedentes).
// Minimum 70% similarity threshold for qualified precedent matching.
// =============================================================================
//
// PEDRO (Plataforma de Extracao e Descoberta de Precedentes) is a CNJ/UnB
// project that uses NLP to find similar judicial decisions. This module
// implements a similar approach using:
//
// 1. TF-IDF (Term Frequency - Inverse Document Frequency) vectorization
// 2. Cosine similarity between document vectors
// 3. Legal stopword filtering
// 4. N-gram extraction for phrase matching
//
// The 70% similarity threshold is used to identify "qualified precedents"
// that are sufficiently similar to be legally relevant.
// =============================================================================

// ─── Types ──────────────────────────────────────────────────────────────────

/** A document to compare against the precedent database */
export interface SimilarityInput {
  /** Unique identifier for the case */
  id: string;
  /** Full text of the case (petition, decision, or ementa) */
  text: string;
  /** Optional legal area to narrow the search */
  area?: string;
  /** Optional court filter */
  court?: string;
}

/** A similar case found in the precedent database */
export interface SimilarCase {
  /** Identifier of the matched precedent */
  id: string;
  /** CNJ number or case number of the matched precedent */
  caseNumber: string;
  /** Court that issued the precedent */
  court: string;
  /** Ementa text of the matched precedent */
  ementa: string;
  /** Similarity score between 0.0 and 1.0 */
  similarity: number;
  /** Key phrases that contributed most to the similarity score */
  matchingPhrases: string[];
  /** Date of the precedent decision */
  decisionDate: string;
  /** Relator (reporting judge) */
  relator: string;
  /** Legal themes identified in the precedent */
  themes: string[];
}

/** Configuration for the similarity engine */
export interface SimilarityConfig {
  /** Minimum similarity threshold (default: 0.70) */
  minSimilarity: number;
  /** Maximum results to return */
  maxResults: number;
  /** N-gram size for phrase extraction (default: 3) */
  ngramSize: number;
  /** Whether to use legal stopword filtering */
  useLegalStopwords: boolean;
}

/** Result of a similarity analysis */
export interface SimilarityResult {
  /** The input case text (truncated) */
  queryText: string;
  /** Total number of matches above threshold */
  totalMatches: number;
  /** Similar cases ranked by decreasing similarity */
  matches: SimilarCase[];
  /** Processing time in milliseconds */
  processingTimeMs: number;
  /** Similarity threshold used */
  threshold: number;
  /** Key terms extracted from the input */
  extractedTerms: string[];
}

// ─── Legal Stopwords ────────────────────────────────────────────────────────

/**
 * Legal-domain stopwords for Brazilian Portuguese.
 * These are common words in legal texts that carry low discriminative value.
 */
const LEGAL_STOPWORDS = new Set([
  // General Portuguese stopwords
  'a', 'o', 'e', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas',
  'um', 'uma', 'uns', 'umas', 'ao', 'aos', 'para', 'por', 'com', 'sem', 'sob',
  'que', 'se', 'como', 'mais', 'ou', 'ja', 'foi', 'ser', 'tem', 'sua', 'seu',
  'sao', 'entre', 'sobre', 'este', 'esta', 'esse', 'essa', 'aquele', 'aquela',
  'isto', 'isso', 'aquilo', 'nao', 'sim', 'muito', 'pouco', 'todo', 'toda',
  'quando', 'qual', 'quais', 'onde', 'como', 'porque', 'pois', 'assim',
  // Legal-specific low-value words
  'processo', 'autos', 'fl', 'fls', 'pag', 'pagina', 'vide', 'conforme',
  'outrossim', 'destarte', 'ademais', 'portanto', 'todavia', 'contudo',
  'entretanto', 'nesse', 'nessa', 'neste', 'nesta', 'pelo', 'pela', 'pelos',
  'pelas', 'sendo', 'sido', 'tendo', 'tido', 'deve', 'podem', 'pode',
  'artigo', 'art', 'paragrafo', 'inciso', 'alinea', 'caput',
]);

// ─── Mock Precedent Database ────────────────────────────────────────────────

interface PrecedentEntry {
  id: string;
  caseNumber: string;
  court: string;
  ementa: string;
  decisionDate: string;
  relator: string;
  themes: string[];
  area: string;
}

const MOCK_PRECEDENT_DB: PrecedentEntry[] = [
  {
    id: 'prec-001',
    caseNumber: 'REsp 1.234.567/SP',
    court: 'STJ',
    ementa: 'CIVIL. CONSUMIDOR. DANO MORAL. INSCRICAO INDEVIDA EM CADASTRO DE INADIMPLENTES. RESPONSABILIDADE OBJETIVA. 1. A inscricao indevida do nome do consumidor em cadastros de protecao ao credito configura dano moral in re ipsa. 2. Responsabilidade objetiva do fornecedor de servicos. 3. Quantum indenizatorio fixado em R$ 10.000,00.',
    decisionDate: '2024-06-15',
    relator: 'Min. Nancy Andrighi',
    themes: ['dano moral', 'consumidor', 'cadastro inadimplentes', 'responsabilidade objetiva'],
    area: 'civil',
  },
  {
    id: 'prec-002',
    caseNumber: 'REsp 9.876.543/RJ',
    court: 'STJ',
    ementa: 'PROCESSUAL CIVIL. RECURSO ESPECIAL. CONTRATO BANCARIO. REVISAO DE CLAUSULAS. JUROS REMUNERATORIOS. LIMITACAO. CAPITALIZACAO MENSAL. POSSIBILIDADE. 1. Os juros remuneratorios cobrados pelas instituicoes financeiras nao sofrem limitacao pelo Decreto 22.626/33. 2. E permitida a capitalizacao mensal de juros quando expressamente pactuada.',
    decisionDate: '2024-05-20',
    relator: 'Min. Marco Buzzi',
    themes: ['contrato bancario', 'juros', 'capitalizacao', 'instituicao financeira'],
    area: 'civil',
  },
  {
    id: 'prec-003',
    caseNumber: 'RE 654.321/MG',
    court: 'STF',
    ementa: 'CONSTITUCIONAL. TRABALHISTA. TERCEIRIZACAO. ATIVIDADE-FIM. CONSTITUCIONALIDADE. REPERCUSSAO GERAL. Tema 725. 1. E licita a terceirizacao de toda e qualquer atividade, meio ou fim, nao se configurando relacao de emprego entre a contratante e o empregado da contratada. 2. Na terceirizacao, a empresa contratante e subsidiariamente responsavel pelas obrigacoes trabalhistas.',
    decisionDate: '2024-04-10',
    relator: 'Min. Gilmar Mendes',
    themes: ['terceirizacao', 'atividade-fim', 'relacao de emprego', 'responsabilidade subsidiaria'],
    area: 'trabalhista',
  },
  {
    id: 'prec-004',
    caseNumber: 'Apelacao 1001234-56.2024.8.26.0100',
    court: 'TJSP',
    ementa: 'CONSUMIDOR. TELECOMUNICACOES. COBRANCA INDEVIDA. DANO MORAL. Servico de telefonia. Cobranca de valores indevidos apos cancelamento do plano. Inscricao em cadastro de inadimplentes. Dano moral configurado. Indenizacao fixada em R$ 8.000,00. Sentenca reformada parcialmente.',
    decisionDate: '2024-07-22',
    relator: 'Des. Paulo Eduardo Razuk',
    themes: ['telecomunicacoes', 'cobranca indevida', 'dano moral', 'consumidor'],
    area: 'consumidor',
  },
  {
    id: 'prec-005',
    caseNumber: 'REsp 5.555.555/RS',
    court: 'STJ',
    ementa: 'TRIBUTARIO. IRPJ. CSLL. BASE DE CALCULO. EXCLUSAO DO ICMS. CREDITOS PRESUMIDOS. 1. Os creditos presumidos de ICMS concedidos pelos Estados nao integram a base de calculo do IRPJ e da CSLL. 2. Classificacao como subvencao para investimento. 3. Aplicacao do art. 30 da Lei 12.973/2014.',
    decisionDate: '2024-03-18',
    relator: 'Min. Herman Benjamin',
    themes: ['tributario', 'IRPJ', 'CSLL', 'ICMS', 'creditos presumidos'],
    area: 'tributario',
  },
  {
    id: 'prec-006',
    caseNumber: 'HC 123.456/SP',
    court: 'STJ',
    ementa: 'PENAL. HABEAS CORPUS. TRAFICO DE DROGAS. REGIME INICIAL. PENA INFERIOR A 8 ANOS. REGIME FECHADO. FUNDAMENTACAO IDONEA. 1. A fixacao de regime inicial mais gravoso exige fundamentacao idonea. 2. Pena inferior a 8 anos admite regime semiaberto. 3. Ordem concedida para fixar regime semiaberto.',
    decisionDate: '2024-08-05',
    relator: 'Min. Rogerio Schietti Cruz',
    themes: ['trafico drogas', 'regime prisional', 'habeas corpus', 'fundamentacao'],
    area: 'penal',
  },
];

// ─── Similarity Engine Implementation ───────────────────────────────────────

/**
 * PEDRO-style case similarity engine for finding precedents.
 *
 * Uses TF-IDF vectorization and cosine similarity to compare a case
 * text against a precedent database. Results are ranked by decreasing
 * similarity, with a default minimum threshold of 70%.
 *
 * The engine:
 * 1. Tokenizes and normalizes input text
 * 2. Removes legal-domain stopwords
 * 3. Computes TF-IDF vectors
 * 4. Calculates cosine similarity against each precedent
 * 5. Extracts key matching phrases using n-grams
 * 6. Returns results above the similarity threshold
 *
 * @example
 * ```typescript
 * const engine = new SimilarityEngine();
 *
 * const result = await engine.findSimilar({
 *   id: 'case-001',
 *   text: 'Trata-se de acao de indenizacao por dano moral decorrente de inscricao indevida em cadastro de inadimplentes...',
 *   area: 'civil',
 * });
 *
 * for (const match of result.matches) {
 *   console.log(`${match.caseNumber}: ${match.similarity * 100}%`);
 * }
 * ```
 */
export class SimilarityEngine {
  private config: SimilarityConfig;
  private precedentDB: PrecedentEntry[];
  /** IDF scores computed from the precedent database */
  private idfScores: Map<string, number> = new Map();
  /** Pre-computed TF-IDF vectors for each precedent */
  private precedentVectors: Map<string, Map<string, number>> = new Map();
  private initialized: boolean = false;

  constructor(config?: Partial<SimilarityConfig>) {
    this.config = {
      minSimilarity: 0.70,
      maxResults: 20,
      ngramSize: 3,
      useLegalStopwords: true,
      ...config,
    };
    this.precedentDB = MOCK_PRECEDENT_DB;
  }

  // ─── Initialization ───────────────────────────────────────────────────────

  /**
   * Initialize the similarity engine by computing IDF scores and
   * pre-computing TF-IDF vectors for all precedents in the database.
   * This should be called once before performing similarity searches.
   */
  initialize(): void {
    if (this.initialized) return;

    // Compute document frequency for each term
    const docFreq = new Map<string, number>();
    const totalDocs = this.precedentDB.length;

    for (const prec of this.precedentDB) {
      const tokens = new Set(this.tokenize(prec.ementa));
      for (const token of tokens) {
        docFreq.set(token, (docFreq.get(token) || 0) + 1);
      }
    }

    // Compute IDF: log(N / df)
    for (const [term, df] of docFreq) {
      this.idfScores.set(term, Math.log(totalDocs / df));
    }

    // Pre-compute TF-IDF vectors for each precedent
    for (const prec of this.precedentDB) {
      const vector = this.computeTfIdf(prec.ementa);
      this.precedentVectors.set(prec.id, vector);
    }

    this.initialized = true;
  }

  // ─── Similarity Search ────────────────────────────────────────────────────

  /**
   * Find similar cases in the precedent database.
   *
   * Compares the input text against all precedents using TF-IDF cosine
   * similarity. Returns matches above the configured minimum threshold
   * (default 70%), ranked by decreasing similarity.
   *
   * @param input - The case to find similar precedents for
   * @returns Similarity results with matched cases and scores
   */
  async findSimilar(input: SimilarityInput): Promise<SimilarityResult> {
    const startTime = Date.now();

    // Ensure the engine is initialized
    this.initialize();

    // Compute TF-IDF vector for the input
    const inputVector = this.computeTfIdf(input.text);
    const extractedTerms = Array.from(inputVector.keys())
      .sort((a, b) => (inputVector.get(b) || 0) - (inputVector.get(a) || 0))
      .slice(0, 20);

    // Filter precedents by area if specified
    let candidates = this.precedentDB;
    if (input.area) {
      candidates = candidates.filter((p) => p.area === input.area);
    }
    if (input.court) {
      candidates = candidates.filter((p) => p.court === input.court);
    }

    // Compute similarity against each candidate
    const matches: SimilarCase[] = [];

    for (const prec of candidates) {
      const precVector = this.precedentVectors.get(prec.id);
      if (!precVector) continue;

      const similarity = this.cosineSimilarity(inputVector, precVector);

      if (similarity >= this.config.minSimilarity) {
        const matchingPhrases = this.extractMatchingPhrases(
          input.text,
          prec.ementa,
        );

        matches.push({
          id: prec.id,
          caseNumber: prec.caseNumber,
          court: prec.court,
          ementa: prec.ementa,
          similarity,
          matchingPhrases,
          decisionDate: prec.decisionDate,
          relator: prec.relator,
          themes: prec.themes,
        });
      }
    }

    // Sort by decreasing similarity
    matches.sort((a, b) => b.similarity - a.similarity);

    // Limit results
    const limitedMatches = matches.slice(0, this.config.maxResults);

    return {
      queryText: input.text.substring(0, 200) + (input.text.length > 200 ? '...' : ''),
      totalMatches: matches.length,
      matches: limitedMatches,
      processingTimeMs: Date.now() - startTime,
      threshold: this.config.minSimilarity,
      extractedTerms,
    };
  }

  // ─── Text Processing ──────────────────────────────────────────────────────

  /**
   * Tokenize text into normalized terms.
   * Applies lowercasing, accent removal, and stopword filtering.
   */
  private tokenize(text: string): string[] {
    // Normalize: lowercase, remove accents (simplified), remove punctuation
    const normalized = text
      .toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const tokens = normalized.split(' ').filter((t) => t.length > 2);

    if (this.config.useLegalStopwords) {
      return tokens.filter((t) => !LEGAL_STOPWORDS.has(t));
    }

    return tokens;
  }

  /**
   * Compute TF-IDF vector for a document.
   */
  private computeTfIdf(text: string): Map<string, number> {
    const tokens = this.tokenize(text);
    const termFreq = new Map<string, number>();

    // Count term frequencies
    for (const token of tokens) {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
    }

    // Compute TF-IDF: tf * idf
    const vector = new Map<string, number>();
    const maxFreq = Math.max(...termFreq.values(), 1);

    for (const [term, freq] of termFreq) {
      const tf = freq / maxFreq; // Normalized term frequency
      const idf = this.idfScores.get(term) || Math.log(this.precedentDB.length);
      vector.set(term, tf * idf);
    }

    return vector;
  }

  /**
   * Compute cosine similarity between two TF-IDF vectors.
   * Returns a value between 0.0 (no similarity) and 1.0 (identical).
   */
  private cosineSimilarity(
    vecA: Map<string, number>,
    vecB: Map<string, number>,
  ): number {
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    // Compute dot product (only for terms in both vectors)
    for (const [term, weightA] of vecA) {
      const weightB = vecB.get(term);
      if (weightB !== undefined) {
        dotProduct += weightA * weightB;
      }
      magnitudeA += weightA * weightA;
    }

    for (const [, weightB] of vecB) {
      magnitudeB += weightB * weightB;
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) return 0;

    return dotProduct / (magnitudeA * magnitudeB);
  }

  // ─── Phrase Extraction ────────────────────────────────────────────────────

  /**
   * Extract matching phrases between two texts using n-gram overlap.
   * Returns the n-grams that appear in both texts, representing
   * the key conceptual overlaps.
   */
  private extractMatchingPhrases(textA: string, textB: string): string[] {
    const ngramsA = this.extractNgrams(textA, this.config.ngramSize);
    const ngramsB = this.extractNgrams(textB, this.config.ngramSize);

    const matching: string[] = [];
    for (const ngram of ngramsA) {
      if (ngramsB.has(ngram) && !matching.includes(ngram)) {
        matching.push(ngram);
      }
    }

    // Sort by length (longer phrases are more meaningful) and limit
    return matching
      .sort((a, b) => b.length - a.length)
      .slice(0, 10);
  }

  /**
   * Extract n-grams from text.
   * An n-gram is a contiguous sequence of n words.
   */
  private extractNgrams(text: string, n: number): Set<string> {
    const tokens = this.tokenize(text);
    const ngrams = new Set<string>();

    for (let i = 0; i <= tokens.length - n; i++) {
      const ngram = tokens.slice(i, i + n).join(' ');
      ngrams.add(ngram);
    }

    // Also include bigrams if n > 2
    if (n > 2) {
      for (let i = 0; i <= tokens.length - 2; i++) {
        const bigram = tokens.slice(i, i + 2).join(' ');
        ngrams.add(bigram);
      }
    }

    return ngrams;
  }

  // ─── Utility Methods ──────────────────────────────────────────────────────

  /**
   * Add a precedent to the in-memory database.
   * Recomputes the TF-IDF vector for the new entry.
   *
   * @param entry - The precedent to add
   */
  addPrecedent(entry: PrecedentEntry): void {
    this.precedentDB.push(entry);
    // Mark as needing re-initialization for IDF recalculation
    this.initialized = false;
  }

  /**
   * Get the current size of the precedent database.
   */
  getDatabaseSize(): number {
    return this.precedentDB.length;
  }

  /**
   * Compute a quick similarity score between two text strings
   * without using the full precedent database.
   *
   * Useful for pairwise comparison of specific texts.
   *
   * @param textA - First text
   * @param textB - Second text
   * @returns Similarity score between 0.0 and 1.0
   */
  computeQuickSimilarity(textA: string, textB: string): number {
    this.initialize();
    const vecA = this.computeTfIdf(textA);
    const vecB = this.computeTfIdf(textB);
    return this.cosineSimilarity(vecA, vecB);
  }
}
