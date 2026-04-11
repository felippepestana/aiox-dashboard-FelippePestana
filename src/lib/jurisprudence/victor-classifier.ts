// =============================================================================
// VICTOR-inspired Case Classifier
// Inspired by STF's VICTOR AI system for classifying extraordinary appeals
// by repercussao geral themes and admissibility criteria.
// =============================================================================
//
// VICTOR is the STF's pioneering AI system (developed with UnB) that:
// 1. Identifies document types in extraordinary appeals (RE)
// 2. Classifies cases by repercussao geral themes
// 3. Evaluates admissibility criteria
// 4. Suggests theme linking for new cases
//
// This module implements a similar classification pipeline:
// - Document type identification (peticao, acordao, sentenca, etc.)
// - Theme classification against 1,200+ repercussao geral themes
// - Admissibility assessment for RE/REsp
// - Theme linking based on text similarity
//
// Reference: https://portal.stf.jus.br/textos/verTexto.asp?servico=informativoSTF&pagina=VICTOR
// =============================================================================

// ─── Types ──────────────────────────────────────────────────────────────────

/** Input for case classification */
export interface ClassificationInput {
  /** The text to classify (petition, decision, or any legal text) */
  text: string;
  /** Optional: the type of document being classified */
  documentType?: DocumentType;
  /** Optional: the legal area for narrowing classification */
  area?: string;
  /** Optional: the court of origin */
  court?: string;
}

/** Recognized document types in the Brazilian judicial system */
export type DocumentType =
  | 'peticao_inicial'
  | 'contestacao'
  | 'sentenca'
  | 'acordao'
  | 'recurso_especial'
  | 'recurso_extraordinario'
  | 'agravo'
  | 'embargo'
  | 'parecer'
  | 'despacho'
  | 'decisao_interlocutoria'
  | 'voto'
  | 'ementa'
  | 'certidao'
  | 'procuracao'
  | 'unknown';

/** Classification result for a case */
export interface ClassificationResult {
  /** Identified document type with confidence */
  documentType: ClassificationPrediction;
  /** Top repercussao geral theme matches */
  repercussaoGeralThemes: ThemeClassification[];
  /** Admissibility assessment for RE/REsp */
  admissibility: AdmissibilityAssessment;
  /** Suggested theme links based on text content */
  suggestedThemeLinks: ThemeLink[];
  /** Key legal concepts extracted from the text */
  extractedConcepts: string[];
  /** Processing metadata */
  processingTimeMs: number;
}

export interface ClassificationPrediction {
  label: string;
  confidence: number;
}

/** A repercussao geral theme classification */
export interface ThemeClassification {
  themeNumber: number;
  title: string;
  confidence: number;
  matchingExcerpts: string[];
  status: 'pending' | 'recognized' | 'decided' | 'thesis_fixed';
}

/** Admissibility assessment for extraordinary/special appeals */
export interface AdmissibilityAssessment {
  /** Overall admissibility score (0.0 - 1.0) */
  overallScore: number;
  /** Individual criteria assessments */
  criteria: AdmissibilityCriterion[];
  /** Recommendation: likely admissible, unlikely, or needs_review */
  recommendation: 'likely_admissible' | 'unlikely_admissible' | 'needs_review';
  /** Reasoning for the recommendation */
  reasoning: string;
}

export interface AdmissibilityCriterion {
  name: string;
  description: string;
  met: boolean;
  confidence: number;
  notes?: string;
}

/** A suggested theme link between the case and a precedent theme */
export interface ThemeLink {
  themeNumber: number;
  themeTitle: string;
  relevance: number;
  linkType: 'direct' | 'indirect' | 'analogous';
  explanation: string;
}

// ─── Theme Database ─────────────────────────────────────────────────────────

interface ThemeEntry {
  number: number;
  title: string;
  description: string;
  keywords: string[];
  area: string;
  status: 'pending' | 'recognized' | 'decided' | 'thesis_fixed';
}

/**
 * Subset of repercussao geral themes for classification.
 * In production, this would be loaded from the full STF theme database (1,200+ themes).
 */
const THEME_DATABASE: ThemeEntry[] = [
  {
    number: 786,
    title: 'Dano moral em relacoes de consumo',
    description: 'Limites constitucionais para fixacao de indenizacao por dano moral decorrente de relacao de consumo',
    keywords: ['dano moral', 'consumidor', 'indenizacao', 'quantum', 'relacao consumo', 'fornecedor'],
    area: 'civil',
    status: 'thesis_fixed',
  },
  {
    number: 725,
    title: 'Terceirizacao de atividade-fim',
    description: 'Constitucionalidade da terceirizacao de atividades-fim empresariais',
    keywords: ['terceirizacao', 'atividade fim', 'emprego', 'trabalhista', 'contratante', 'subsidiaria'],
    area: 'trabalhista',
    status: 'thesis_fixed',
  },
  {
    number: 810,
    title: 'Honorarios advocaticios em acoes contra a Fazenda Publica',
    description: 'Aplicabilidade do art. 85, par. 3o, do CPC/2015 aos honorarios de sucumbencia contra a Fazenda Publica',
    keywords: ['honorarios', 'sucumbencia', 'fazenda publica', 'cpc', 'advocaticios'],
    area: 'processual',
    status: 'decided',
  },
  {
    number: 1246,
    title: 'Responsabilidade civil do Estado por omissao em saude',
    description: 'Responsabilidade civil do Estado por falha na prestacao de servicos de saude publica',
    keywords: ['responsabilidade', 'estado', 'saude', 'omissao', 'medicamentos', 'sus', 'leito'],
    area: 'administrativo',
    status: 'recognized',
  },
  {
    number: 1300,
    title: 'Liberdade de expressao em redes sociais',
    description: 'Limites constitucionais da liberdade de expressao em plataformas digitais',
    keywords: ['liberdade expressao', 'redes sociais', 'internet', 'moderacao', 'plataforma', 'digital'],
    area: 'constitucional',
    status: 'pending',
  },
  {
    number: 362,
    title: 'ICMS na base de calculo do PIS e COFINS',
    description: 'Exclusao do ICMS da base de calculo do PIS e da COFINS',
    keywords: ['icms', 'pis', 'cofins', 'base calculo', 'tributario', 'exclusao'],
    area: 'tributario',
    status: 'thesis_fixed',
  },
  {
    number: 987,
    title: 'Dano moral coletivo em direito ambiental',
    description: 'Cabimento de indenizacao por dano moral coletivo em acoes ambientais',
    keywords: ['dano moral coletivo', 'ambiental', 'meio ambiente', 'reparacao', 'coletivo'],
    area: 'ambiental',
    status: 'decided',
  },
  {
    number: 542,
    title: 'Execucao penal - progressao de regime',
    description: 'Criterios para progressao de regime prisional em crimes hediondos',
    keywords: ['progressao', 'regime', 'prisional', 'execucao penal', 'hediondo', 'crime'],
    area: 'penal',
    status: 'thesis_fixed',
  },
];

/** Document type identification patterns */
const DOCUMENT_TYPE_PATTERNS: Array<{
  type: DocumentType;
  patterns: RegExp[];
  weight: number;
}> = [
  {
    type: 'peticao_inicial',
    patterns: [
      /peticao\s+inicial/i,
      /excelentissimo\s+senhor\s+(?:doutor\s+)?juiz/i,
      /requer\s+(?:a\s+)?(?:citacao|procedencia)/i,
      /dos\s+fatos|do\s+direito|dos\s+pedidos/i,
    ],
    weight: 1.0,
  },
  {
    type: 'contestacao',
    patterns: [
      /contestacao/i,
      /contesta\s+a\s+(?:presente\s+)?acao/i,
      /preliminarmente|no\s+merito|improcedencia/i,
    ],
    weight: 1.0,
  },
  {
    type: 'sentenca',
    patterns: [
      /sentenca/i,
      /vistos\s+(?:e\s+)?(?:examinados|relatados)/i,
      /julgo\s+(?:procedente|improcedente)/i,
      /dispositivo|publique[-]se|registre[-]se|intime[-]se/i,
    ],
    weight: 1.0,
  },
  {
    type: 'acordao',
    patterns: [
      /acordao/i,
      /acordam\s+os\s+(?:ministros|desembargadores)/i,
      /voto\s+(?:do\s+)?relator/i,
      /turma|camara|secao|plenario/i,
    ],
    weight: 0.9,
  },
  {
    type: 'recurso_extraordinario',
    patterns: [
      /recurso\s+extraordinario/i,
      /repercussao\s+geral/i,
      /ofensa\s+(?:a|ao)\s+(?:constituicao|art\.\s*\d+\s*(?:da\s+)?cf)/i,
    ],
    weight: 1.0,
  },
  {
    type: 'recurso_especial',
    patterns: [
      /recurso\s+especial/i,
      /negativa\s+de\s+vigencia/i,
      /divergencia\s+jurisprudencial/i,
      /alinea\s+[abc]/i,
    ],
    weight: 1.0,
  },
  {
    type: 'agravo',
    patterns: [
      /agravo\s+(?:de\s+instrumento|interno|regimental)/i,
      /agrava\s+(?:da\s+)?decisao/i,
    ],
    weight: 1.0,
  },
  {
    type: 'embargo',
    patterns: [
      /embargos\s+(?:de\s+declaracao|infringentes)/i,
      /omissao|contradicao|obscuridade/i,
    ],
    weight: 0.8,
  },
];

// ─── RE/REsp Admissibility Criteria ─────────────────────────────────────────

const RE_ADMISSIBILITY_CRITERIA = [
  {
    name: 'Prequestionamento',
    description: 'A materia constitucional foi efetivamente debatida no acordao recorrido',
    checkPatterns: [/prequestion/i, /debatid[ao]/i, /enfrentad[ao]/i, /materia\s+constitucional/i],
  },
  {
    name: 'Repercussao Geral',
    description: 'A questao constitucional possui relevancia que transcende o interesse das partes',
    checkPatterns: [/repercussao\s+geral/i, /transcend/i, /relevanci/i, /interesse\s+(?:publico|social|geral)/i],
  },
  {
    name: 'Esgotamento de Instancia',
    description: 'Todos os recursos ordinarios foram esgotados antes do RE',
    checkPatterns: [/esgotamento/i, /ultima\s+instancia/i, /acordao\s+(?:do\s+)?tribunal/i],
  },
  {
    name: 'Ofensa Direta a CF',
    description: 'Ha ofensa direta a dispositivo constitucional (nao meramente reflexa)',
    checkPatterns: [/ofensa\s+(?:direta|frontal)/i, /violacao\s+(?:da\s+)?(?:cf|constituicao)/i, /art\.\s*\d+\s*(?:da\s+)?cf/i],
  },
  {
    name: 'Tempestividade',
    description: 'O recurso foi interposto dentro do prazo legal de 15 dias',
    checkPatterns: [/tempestiv/i, /prazo/i, /15\s+dias/i],
  },
];

// ─── VICTOR Classifier Implementation ───────────────────────────────────────

/**
 * VICTOR-inspired case classifier for Brazilian legal documents.
 *
 * Provides three main classification capabilities:
 * 1. Document Type Identification: Determines if a text is a petition,
 *    decision, appeal, etc.
 * 2. Repercussao Geral Theme Classification: Matches cases against
 *    1,200+ STF repercussao geral themes
 * 3. Admissibility Assessment: Evaluates whether an extraordinary appeal
 *    meets the admissibility criteria
 *
 * The classifier uses pattern matching and keyword analysis to simulate
 * the NLP classification that the real VICTOR system performs with
 * deep learning models.
 *
 * @example
 * ```typescript
 * const classifier = new VictorClassifier();
 *
 * const result = await classifier.classify({
 *   text: 'Trata-se de recurso extraordinario com repercussao geral...',
 *   area: 'constitucional',
 * });
 *
 * console.log('Document type:', result.documentType);
 * console.log('Top theme:', result.repercussaoGeralThemes[0]);
 * console.log('Admissibility:', result.admissibility.recommendation);
 * ```
 */
export class VictorClassifier {
  private themeDB: ThemeEntry[];

  constructor() {
    this.themeDB = THEME_DATABASE;
  }

  // ─── Main Classification ──────────────────────────────────────────────────

  /**
   * Classify a legal text by document type, themes, and admissibility.
   *
   * @param input - The text and metadata to classify
   * @returns Comprehensive classification result
   */
  async classify(input: ClassificationInput): Promise<ClassificationResult> {
    const startTime = Date.now();

    // 1. Identify document type
    const documentType = this.identifyDocumentType(input.text);

    // 2. Classify by repercussao geral themes
    const repercussaoGeralThemes = this.classifyThemes(input.text, input.area);

    // 3. Assess admissibility (for RE/REsp types)
    const admissibility = this.assessAdmissibility(input.text, documentType.label as DocumentType);

    // 4. Suggest theme links
    const suggestedThemeLinks = this.suggestThemeLinks(input.text, repercussaoGeralThemes);

    // 5. Extract key legal concepts
    const extractedConcepts = this.extractLegalConcepts(input.text);

    return {
      documentType,
      repercussaoGeralThemes,
      admissibility,
      suggestedThemeLinks,
      extractedConcepts,
      processingTimeMs: Date.now() - startTime,
    };
  }

  // ─── Document Type Identification ─────────────────────────────────────────

  /**
   * Identify the document type from text content.
   *
   * Uses pattern matching against known document type signatures.
   * Each pattern contributes to a score, and the highest-scoring
   * type is selected.
   *
   * @param text - The document text
   * @returns Predicted document type with confidence
   */
  identifyDocumentType(text: string): ClassificationPrediction {
    const normalizedText = text.toLowerCase();
    const scores = new Map<DocumentType, number>();

    for (const { type, patterns, weight } of DOCUMENT_TYPE_PATTERNS) {
      let matchCount = 0;
      for (const pattern of patterns) {
        if (pattern.test(normalizedText)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const score = (matchCount / patterns.length) * weight;
        scores.set(type, score);
      }
    }

    // Find the highest-scoring type
    let bestType: DocumentType = 'unknown';
    let bestScore = 0;

    for (const [type, score] of scores) {
      if (score > bestScore) {
        bestType = type;
        bestScore = score;
      }
    }

    return {
      label: bestType,
      confidence: Math.min(bestScore, 1.0),
    };
  }

  // ─── Theme Classification ─────────────────────────────────────────────────

  /**
   * Classify text against repercussao geral themes.
   *
   * Computes keyword overlap between the input text and each theme's
   * keyword set. Results are ranked by match score and filtered by
   * the minimum confidence threshold.
   *
   * @param text - The case text to classify
   * @param area - Optional legal area filter
   * @returns Ranked theme classifications
   */
  classifyThemes(text: string, area?: string): ThemeClassification[] {
    const normalizedText = text
      .toLowerCase()
      .replace(/[áàâã]/g, 'a')
      .replace(/[éèê]/g, 'e')
      .replace(/[íìî]/g, 'i')
      .replace(/[óòôõ]/g, 'o')
      .replace(/[úùû]/g, 'u')
      .replace(/[ç]/g, 'c');

    let candidates = this.themeDB;
    if (area) {
      candidates = candidates.filter((t) => t.area === area);
    }

    const results: ThemeClassification[] = [];

    for (const theme of candidates) {
      let matchCount = 0;
      const matchingExcerpts: string[] = [];

      for (const keyword of theme.keywords) {
        const normalizedKeyword = keyword
          .toLowerCase()
          .replace(/[áàâã]/g, 'a')
          .replace(/[éèê]/g, 'e')
          .replace(/[íìî]/g, 'i')
          .replace(/[óòôõ]/g, 'o')
          .replace(/[úùû]/g, 'u')
          .replace(/[ç]/g, 'c');

        if (normalizedText.includes(normalizedKeyword)) {
          matchCount++;

          // Extract surrounding context for the match
          const index = normalizedText.indexOf(normalizedKeyword);
          const start = Math.max(0, index - 50);
          const end = Math.min(normalizedText.length, index + normalizedKeyword.length + 50);
          const excerpt = text.substring(start, end).trim();
          if (excerpt) {
            matchingExcerpts.push(`...${excerpt}...`);
          }
        }
      }

      if (matchCount > 0) {
        const confidence = matchCount / theme.keywords.length;
        results.push({
          themeNumber: theme.number,
          title: theme.title,
          confidence,
          matchingExcerpts: matchingExcerpts.slice(0, 3),
          status: theme.status,
        });
      }
    }

    // Sort by confidence descending
    results.sort((a, b) => b.confidence - a.confidence);

    return results.slice(0, 10);
  }

  // ─── Admissibility Assessment ─────────────────────────────────────────────

  /**
   * Assess the admissibility of an extraordinary appeal (RE) or special appeal (REsp).
   *
   * Evaluates the text against the established admissibility criteria:
   * - Prequestionamento (prior discussion of constitutional matter)
   * - Repercussao geral (general significance)
   * - Esgotamento de instancia (exhaustion of ordinary remedies)
   * - Ofensa direta a CF (direct constitutional violation)
   * - Tempestividade (timeliness)
   *
   * @param text - The appeal text
   * @param docType - The document type (only meaningful for RE/REsp)
   * @returns Admissibility assessment with individual criteria
   */
  assessAdmissibility(text: string, docType: DocumentType): AdmissibilityAssessment {
    const isAppeal = docType === 'recurso_extraordinario' || docType === 'recurso_especial';

    if (!isAppeal) {
      return {
        overallScore: 0,
        criteria: [],
        recommendation: 'needs_review',
        reasoning: 'Admissibility assessment is only applicable to extraordinary (RE) and special (REsp) appeals. Detected document type: ' + docType,
      };
    }

    const normalizedText = text.toLowerCase();
    const criteria: AdmissibilityCriterion[] = [];
    let totalScore = 0;

    for (const criterion of RE_ADMISSIBILITY_CRITERIA) {
      let matchCount = 0;
      for (const pattern of criterion.checkPatterns) {
        if (pattern.test(normalizedText)) {
          matchCount++;
        }
      }

      const confidence = matchCount / criterion.checkPatterns.length;
      const met = confidence >= 0.5;

      criteria.push({
        name: criterion.name,
        description: criterion.description,
        met,
        confidence,
        notes: met
          ? `Criterion appears to be addressed (${matchCount}/${criterion.checkPatterns.length} indicators found)`
          : `Criterion may not be adequately addressed (only ${matchCount}/${criterion.checkPatterns.length} indicators found)`,
      });

      totalScore += confidence;
    }

    const overallScore = totalScore / RE_ADMISSIBILITY_CRITERIA.length;
    const metCount = criteria.filter((c) => c.met).length;

    let recommendation: AdmissibilityAssessment['recommendation'];
    let reasoning: string;

    if (overallScore >= 0.7 && metCount >= 4) {
      recommendation = 'likely_admissible';
      reasoning = `The appeal appears to meet ${metCount} of ${criteria.length} admissibility criteria. The text adequately addresses the key requirements.`;
    } else if (overallScore >= 0.4 || metCount >= 2) {
      recommendation = 'needs_review';
      reasoning = `The appeal meets ${metCount} of ${criteria.length} criteria but some requirements need further analysis. Manual review recommended.`;
    } else {
      recommendation = 'unlikely_admissible';
      reasoning = `The appeal only clearly addresses ${metCount} of ${criteria.length} admissibility criteria. Consider strengthening the argumentation before filing.`;
    }

    return {
      overallScore,
      criteria,
      recommendation,
      reasoning,
    };
  }

  // ─── Theme Linking ────────────────────────────────────────────────────────

  /**
   * Suggest theme links between the case and repercussao geral themes.
   *
   * Based on the theme classifications, suggests how the case relates
   * to each theme (directly, indirectly, or by analogy).
   */
  private suggestThemeLinks(
    text: string,
    themes: ThemeClassification[],
  ): ThemeLink[] {
    return themes.map((theme) => {
      let linkType: ThemeLink['linkType'];
      let explanation: string;

      if (theme.confidence >= 0.7) {
        linkType = 'direct';
        explanation = `The case directly addresses the subject of Theme ${theme.themeNumber} (${theme.title}). The key concepts match strongly with the theme description.`;
      } else if (theme.confidence >= 0.4) {
        linkType = 'indirect';
        explanation = `The case touches on aspects related to Theme ${theme.themeNumber} (${theme.title}), though the connection is not central to the main argument.`;
      } else {
        linkType = 'analogous';
        explanation = `The case shares some conceptual similarity with Theme ${theme.themeNumber} (${theme.title}), potentially applicable by analogy.`;
      }

      return {
        themeNumber: theme.themeNumber,
        themeTitle: theme.title,
        relevance: theme.confidence,
        linkType,
        explanation,
      };
    });
  }

  // ─── Concept Extraction ───────────────────────────────────────────────────

  /**
   * Extract key legal concepts from text.
   *
   * Identifies important legal terms and phrases that characterize
   * the case, useful for indexing and search.
   */
  private extractLegalConcepts(text: string): string[] {
    const conceptPatterns: Array<{ pattern: RegExp; concept: string }> = [
      { pattern: /dano\s+moral/i, concept: 'Dano Moral' },
      { pattern: /dano\s+material/i, concept: 'Dano Material' },
      { pattern: /responsabilidade\s+(?:civil\s+)?objetiva/i, concept: 'Responsabilidade Objetiva' },
      { pattern: /responsabilidade\s+(?:civil\s+)?subjetiva/i, concept: 'Responsabilidade Subjetiva' },
      { pattern: /relacao\s+de\s+consumo/i, concept: 'Relacao de Consumo' },
      { pattern: /boa[-\s]fe\s+objetiva/i, concept: 'Boa-Fe Objetiva' },
      { pattern: /funcao\s+social/i, concept: 'Funcao Social' },
      { pattern: /tutela\s+(?:de\s+)?urgencia/i, concept: 'Tutela de Urgencia' },
      { pattern: /tutela\s+(?:de\s+)?evidencia/i, concept: 'Tutela de Evidencia' },
      { pattern: /repercussao\s+geral/i, concept: 'Repercussao Geral' },
      { pattern: /recurso\s+repetitivo/i, concept: 'Recurso Repetitivo' },
      { pattern: /sumula\s+vinculante/i, concept: 'Sumula Vinculante' },
      { pattern: /prescricao/i, concept: 'Prescricao' },
      { pattern: /decadencia/i, concept: 'Decadencia' },
      { pattern: /litispendencia/i, concept: 'Litispendencia' },
      { pattern: /coisa\s+julgada/i, concept: 'Coisa Julgada' },
      { pattern: /devido\s+processo\s+legal/i, concept: 'Devido Processo Legal' },
      { pattern: /contraditorio/i, concept: 'Contraditorio' },
      { pattern: /ampla\s+defesa/i, concept: 'Ampla Defesa' },
      { pattern: /dignidade\s+(?:da\s+)?pessoa\s+humana/i, concept: 'Dignidade da Pessoa Humana' },
      { pattern: /proporcionalidade/i, concept: 'Proporcionalidade' },
      { pattern: /razoabilidade/i, concept: 'Razoabilidade' },
      { pattern: /isonomia|igualdade/i, concept: 'Isonomia' },
      { pattern: /seguranca\s+juridica/i, concept: 'Seguranca Juridica' },
      { pattern: /terceirizacao/i, concept: 'Terceirizacao' },
      { pattern: /justica\s+gratuita/i, concept: 'Justica Gratuita' },
    ];

    const found: string[] = [];
    for (const { pattern, concept } of conceptPatterns) {
      if (pattern.test(text)) {
        found.push(concept);
      }
    }

    return found;
  }
}
