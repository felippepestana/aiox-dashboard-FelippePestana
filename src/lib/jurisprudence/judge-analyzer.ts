// =============================================================================
// Judge/Desembargador Voting Pattern Analyzer
// Tracks voting history, analyzes patterns by theme/area,
// provides sentiment scoring and outcome prediction.
// =============================================================================
//
// This module provides analytics on judge (juiz/desembargador/ministro)
// voting patterns and decision tendencies, enabling:
//
// - Historical voting pattern tracking
// - Theme-specific voting tendency analysis
// - Sentiment scoring (favorable/unfavorable toward specific positions)
// - Outcome probability estimation based on historical data
// - Inter-judge agreement analysis
//
// Use cases:
// - Strategic case assignment analysis
// - Appeal likelihood assessment
// - Settlement vs. litigation decision support
// - Client expectation management
// =============================================================================

// ─── Types ──────────────────────────────────────────────────────────────────

/** A judge profile with voting history summary */
export interface JudgeProfile {
  id: string;
  name: string;
  court: string;
  position: JudgePosition;
  /** Legal areas where the judge is most active */
  primaryAreas: string[];
  /** Summary statistics */
  stats: JudgeStats;
  /** Most recent activity date */
  lastActivityDate: string;
}

export type JudgePosition =
  | 'juiz'
  | 'juiz_substituto'
  | 'desembargador'
  | 'ministro'
  | 'juiz_federal'
  | 'juiz_trabalho';

export interface JudgeStats {
  totalDecisions: number;
  favorableToAuthor: number;
  favorableToDefendant: number;
  partiallyFavorable: number;
  settlementsEncouraged: number;
  averageDecisionTimeDays: number;
  reversalRateOnAppeal: number;
}

/** Voting pattern analysis for a specific theme */
export interface ThemeVotingPattern {
  theme: string;
  judgeId: string;
  judgeName: string;
  /** Number of decisions on this theme */
  totalDecisions: number;
  /** Proportion favorable to the plaintiff/author */
  favorableRate: number;
  /** Average damage/value awarded when favorable */
  averageAwardedValue?: number;
  /** Most common reasoning patterns */
  commonReasonings: string[];
  /** Voting tendency: strong/moderate/neutral/against */
  tendency: VotingTendency;
  /** Confidence level of the tendency assessment */
  confidence: number;
}

export type VotingTendency =
  | 'strongly_favorable'
  | 'moderately_favorable'
  | 'neutral'
  | 'moderately_unfavorable'
  | 'strongly_unfavorable';

/** Sentiment analysis of a judge's decisions on a topic */
export interface JudgeSentiment {
  judgeId: string;
  judgeName: string;
  topic: string;
  /** Sentiment score from -1.0 (strongly against) to 1.0 (strongly favorable) */
  sentimentScore: number;
  /** Number of decisions analyzed */
  sampleSize: number;
  /** Key phrases indicating the sentiment */
  indicativePhrases: string[];
  /** Trend over time: improving, stable, declining */
  trend: 'improving' | 'stable' | 'declining';
}

/** Prediction for a case outcome based on judge history */
export interface OutcomePrediction {
  judgeId: string;
  judgeName: string;
  /** Predicted outcome */
  predictedOutcome: PredictedOutcome;
  /** Probability of the predicted outcome (0.0 - 1.0) */
  probability: number;
  /** Probability distribution across all outcomes */
  outcomeDistribution: {
    outcome: PredictedOutcome;
    probability: number;
  }[];
  /** Factors that influenced the prediction */
  factors: PredictionFactor[];
  /** Confidence level of the prediction */
  confidence: 'high' | 'medium' | 'low';
  /** Disclaimer about the prediction */
  disclaimer: string;
}

export type PredictedOutcome =
  | 'procedente'
  | 'improcedente'
  | 'parcialmente_procedente'
  | 'extinto_sem_merito'
  | 'acordo';

export interface PredictionFactor {
  name: string;
  weight: number;
  direction: 'positive' | 'negative' | 'neutral';
  description: string;
}

/** Parameters for analyzing judge voting patterns */
export interface AnalysisParams {
  /** Judge identifier or name */
  judgeId?: string;
  judgeName?: string;
  /** Legal theme to analyze */
  theme?: string;
  /** Legal area filter */
  area?: string;
  /** Court filter */
  court?: string;
  /** Date range for the analysis */
  dateRange?: {
    start: string;
    end: string;
  };
}

/** Agreement analysis between two judges */
export interface JudgeAgreement {
  judgeA: { id: string; name: string };
  judgeB: { id: string; name: string };
  /** Proportion of cases where both judges voted the same way */
  agreementRate: number;
  /** Total cases where both participated */
  sharedCases: number;
  /** Themes where they most agree */
  topAgreementThemes: string[];
  /** Themes where they most disagree */
  topDisagreementThemes: string[];
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_JUDGE_PROFILES: JudgeProfile[] = [
  {
    id: 'judge-001',
    name: 'Dr. Antonio Carlos Lima',
    court: 'TJSP',
    position: 'juiz',
    primaryAreas: ['civil', 'consumidor'],
    stats: {
      totalDecisions: 1250,
      favorableToAuthor: 520,
      favorableToDefendant: 380,
      partiallyFavorable: 280,
      settlementsEncouraged: 70,
      averageDecisionTimeDays: 180,
      reversalRateOnAppeal: 0.22,
    },
    lastActivityDate: '2024-11-18',
  },
  {
    id: 'judge-002',
    name: 'Dra. Maria Helena Ferreira',
    court: 'TJSP',
    position: 'desembargador',
    primaryAreas: ['civil', 'familia', 'consumidor'],
    stats: {
      totalDecisions: 3400,
      favorableToAuthor: 1500,
      favorableToDefendant: 1100,
      partiallyFavorable: 650,
      settlementsEncouraged: 150,
      averageDecisionTimeDays: 120,
      reversalRateOnAppeal: 0.15,
    },
    lastActivityDate: '2024-11-20',
  },
  {
    id: 'judge-003',
    name: 'Min. Ricardo Lewandowski',
    court: 'STF',
    position: 'ministro',
    primaryAreas: ['constitucional', 'penal', 'administrativo'],
    stats: {
      totalDecisions: 8500,
      favorableToAuthor: 3200,
      favorableToDefendant: 3000,
      partiallyFavorable: 1800,
      settlementsEncouraged: 500,
      averageDecisionTimeDays: 90,
      reversalRateOnAppeal: 0.05,
    },
    lastActivityDate: '2024-11-15',
  },
  {
    id: 'judge-004',
    name: 'Min. Nancy Andrighi',
    court: 'STJ',
    position: 'ministro',
    primaryAreas: ['civil', 'consumidor', 'empresarial'],
    stats: {
      totalDecisions: 12000,
      favorableToAuthor: 5200,
      favorableToDefendant: 4100,
      partiallyFavorable: 2200,
      settlementsEncouraged: 500,
      averageDecisionTimeDays: 75,
      reversalRateOnAppeal: 0.08,
    },
    lastActivityDate: '2024-11-19',
  },
];

const MOCK_THEME_PATTERNS: ThemeVotingPattern[] = [
  {
    theme: 'Dano moral - inscricao indevida em cadastro',
    judgeId: 'judge-001',
    judgeName: 'Dr. Antonio Carlos Lima',
    totalDecisions: 85,
    favorableRate: 0.78,
    averageAwardedValue: 12000,
    commonReasonings: [
      'Dano moral in re ipsa pela inscricao indevida',
      'Responsabilidade objetiva do fornecedor (art. 14, CDC)',
      'Quantum fixado com base na razoabilidade e proporcionalidade',
    ],
    tendency: 'moderately_favorable',
    confidence: 0.85,
  },
  {
    theme: 'Dano moral - inscricao indevida em cadastro',
    judgeId: 'judge-002',
    judgeName: 'Dra. Maria Helena Ferreira',
    totalDecisions: 210,
    favorableRate: 0.82,
    averageAwardedValue: 15000,
    commonReasonings: [
      'Configuracao do dano moral presumido',
      'Dever de cuidado do fornecedor na manutencao de cadastros',
      'Funcao punitivo-pedagogica da indenizacao',
    ],
    tendency: 'strongly_favorable',
    confidence: 0.92,
  },
  {
    theme: 'Revisao contratual - juros bancarios',
    judgeId: 'judge-004',
    judgeName: 'Min. Nancy Andrighi',
    totalDecisions: 450,
    favorableRate: 0.35,
    commonReasonings: [
      'Instituicoes financeiras nao se sujeitam a limitacao do Decreto 22.626/33',
      'Abusividade deve ser analisada caso a caso',
      'Pacta sunt servanda - forca obrigatoria dos contratos',
    ],
    tendency: 'moderately_unfavorable',
    confidence: 0.88,
  },
];

// ─── Judge Analyzer Implementation ──────────────────────────────────────────

/**
 * Judge/Desembargador voting pattern analyzer.
 *
 * Provides analytics on judge decision patterns, enabling strategic
 * case planning based on historical tendencies. Features include:
 *
 * - Judge profile lookup with activity statistics
 * - Theme-specific voting pattern analysis
 * - Sentiment scoring per judge per topic
 * - Outcome prediction based on judge + case characteristics
 * - Inter-judge agreement analysis
 *
 * IMPORTANT: Predictions are statistical estimates based on historical
 * patterns and should NOT be presented as guarantees. Each case has
 * unique characteristics that may lead to different outcomes.
 *
 * @example
 * ```typescript
 * const analyzer = new JudgeAnalyzer();
 *
 * // Get a judge's voting pattern on a theme
 * const patterns = await analyzer.getVotingPatterns({
 *   judgeName: 'Dr. Antonio Carlos Lima',
 *   theme: 'dano moral',
 * });
 *
 * // Predict likely outcome
 * const prediction = await analyzer.predictOutcome(
 *   'judge-001',
 *   'dano moral - inscricao indevida',
 *   'civil',
 * );
 *
 * console.log(`Predicted: ${prediction.predictedOutcome} (${prediction.probability * 100}%)`);
 * ```
 */
export class JudgeAnalyzer {
  private profiles: JudgeProfile[];
  private themePatterns: ThemeVotingPattern[];

  constructor() {
    this.profiles = MOCK_JUDGE_PROFILES;
    this.themePatterns = MOCK_THEME_PATTERNS;
  }

  // ─── Judge Profile ────────────────────────────────────────────────────────

  /**
   * Get a judge's profile with voting history summary.
   *
   * @param params - Search parameters (id, name, or court)
   * @returns Matching judge profiles
   */
  async getJudgeProfiles(params: AnalysisParams): Promise<JudgeProfile[]> {
    let results = [...this.profiles];

    if (params.judgeId) {
      results = results.filter((p) => p.id === params.judgeId);
    }
    if (params.judgeName) {
      const nameLower = params.judgeName.toLowerCase();
      results = results.filter((p) => p.name.toLowerCase().includes(nameLower));
    }
    if (params.court) {
      results = results.filter((p) => p.court === params.court);
    }
    if (params.area) {
      results = results.filter((p) => p.primaryAreas.includes(params.area!));
    }

    return results;
  }

  /**
   * Get a single judge's profile by ID.
   */
  async getJudgeProfile(judgeId: string): Promise<JudgeProfile | null> {
    return this.profiles.find((p) => p.id === judgeId) || null;
  }

  // ─── Voting Pattern Analysis ──────────────────────────────────────────────

  /**
   * Analyze a judge's voting patterns on a specific theme.
   *
   * Returns detailed statistics about how a judge has historically
   * decided cases on the given theme, including:
   * - Favorable/unfavorable rate
   * - Average awarded values
   * - Common reasoning patterns
   * - Overall tendency assessment
   *
   * @param params - Analysis parameters
   * @returns Array of voting patterns matching the criteria
   */
  async getVotingPatterns(params: AnalysisParams): Promise<ThemeVotingPattern[]> {
    let results = [...this.themePatterns];

    if (params.judgeId) {
      results = results.filter((p) => p.judgeId === params.judgeId);
    }
    if (params.judgeName) {
      const nameLower = params.judgeName.toLowerCase();
      results = results.filter((p) => p.judgeName.toLowerCase().includes(nameLower));
    }
    if (params.theme) {
      const themeLower = params.theme.toLowerCase();
      results = results.filter((p) => p.theme.toLowerCase().includes(themeLower));
    }

    return results;
  }

  // ─── Sentiment Analysis ───────────────────────────────────────────────────

  /**
   * Analyze a judge's sentiment toward a specific legal topic.
   *
   * Sentiment is derived from the judge's decision patterns:
   * - Score > 0: tends to rule favorably for plaintiffs on this topic
   * - Score = 0: neutral/balanced
   * - Score < 0: tends to rule unfavorably for plaintiffs on this topic
   *
   * @param judgeId - The judge's identifier
   * @param topic - The legal topic to analyze
   * @returns Sentiment analysis result
   */
  async analyzeSentiment(
    judgeId: string,
    topic: string,
  ): Promise<JudgeSentiment | null> {
    const patterns = await this.getVotingPatterns({
      judgeId,
      theme: topic,
    });

    if (patterns.length === 0) {
      // If no specific pattern, derive from the judge's overall stats
      const profile = await this.getJudgeProfile(judgeId);
      if (!profile) return null;

      const total = profile.stats.totalDecisions;
      const favorableRate = profile.stats.favorableToAuthor / total;
      const sentimentScore = (favorableRate - 0.5) * 2; // Normalize to [-1, 1]

      return {
        judgeId,
        judgeName: profile.name,
        topic,
        sentimentScore,
        sampleSize: total,
        indicativePhrases: ['Analise baseada em estatisticas gerais do magistrado'],
        trend: 'stable',
      };
    }

    const pattern = patterns[0];
    const sentimentScore = (pattern.favorableRate - 0.5) * 2;

    return {
      judgeId,
      judgeName: pattern.judgeName,
      topic,
      sentimentScore,
      sampleSize: pattern.totalDecisions,
      indicativePhrases: pattern.commonReasonings,
      trend: sentimentScore > 0.3 ? 'improving' : sentimentScore < -0.3 ? 'declining' : 'stable',
    };
  }

  // ─── Outcome Prediction ───────────────────────────────────────────────────

  /**
   * Predict the likely outcome of a case based on the assigned judge's
   * historical decision patterns.
   *
   * DISCLAIMER: This prediction is a statistical estimate based on
   * historical data. It does not account for the unique facts of each
   * case and should not be used as the sole basis for legal strategy.
   * Each case is decided on its own merits.
   *
   * @param judgeId - The assigned judge's identifier
   * @param theme - The primary legal theme of the case
   * @param area - The legal area
   * @returns Outcome prediction with probabilities
   */
  async predictOutcome(
    judgeId: string,
    theme: string,
    area: string,
  ): Promise<OutcomePrediction | null> {
    const profile = await this.getJudgeProfile(judgeId);
    if (!profile) return null;

    const patterns = await this.getVotingPatterns({
      judgeId,
      theme,
    });

    // Base probabilities from the judge's overall stats
    const total = profile.stats.totalDecisions;
    let pProcedente = profile.stats.favorableToAuthor / total;
    let pImprocedente = profile.stats.favorableToDefendant / total;
    let pParcial = profile.stats.partiallyFavorable / total;
    let pAcordo = profile.stats.settlementsEncouraged / total;
    let pExtinto = Math.max(0, 1 - pProcedente - pImprocedente - pParcial - pAcordo);

    // Adjust based on theme-specific patterns
    const factors: PredictionFactor[] = [];

    if (patterns.length > 0) {
      const pattern = patterns[0];

      // Theme-specific favorable rate overrides general stats
      pProcedente = pattern.favorableRate * 0.7 + pProcedente * 0.3;
      pImprocedente = (1 - pattern.favorableRate) * 0.5 + pImprocedente * 0.5;

      factors.push({
        name: 'Historico tematico do magistrado',
        weight: 0.7,
        direction: pattern.favorableRate > 0.5 ? 'positive' : 'negative',
        description: `O magistrado decide favoravelmente ao autor em ${(pattern.favorableRate * 100).toFixed(0)}% dos casos sobre "${pattern.theme}" (${pattern.totalDecisions} decisoes analisadas).`,
      });

      if (pattern.tendency === 'strongly_favorable' || pattern.tendency === 'moderately_favorable') {
        factors.push({
          name: 'Tendencia favoravel identificada',
          weight: 0.3,
          direction: 'positive',
          description: `Tendencia ${pattern.tendency === 'strongly_favorable' ? 'fortemente' : 'moderadamente'} favoravel ao autor nesta tematica.`,
        });
      }
    }

    factors.push({
      name: 'Taxa geral de procedencia',
      weight: patterns.length > 0 ? 0.3 : 0.8,
      direction: profile.stats.favorableToAuthor > profile.stats.favorableToDefendant ? 'positive' : 'negative',
      description: `Taxa geral de procedencia: ${((profile.stats.favorableToAuthor / total) * 100).toFixed(0)}% (${total} decisoes).`,
    });

    factors.push({
      name: 'Taxa de reforma em recurso',
      weight: 0.2,
      direction: profile.stats.reversalRateOnAppeal < 0.2 ? 'neutral' : 'negative',
      description: `Taxa de reforma em grau de recurso: ${(profile.stats.reversalRateOnAppeal * 100).toFixed(0)}%.`,
    });

    // Normalize probabilities
    const sum = pProcedente + pImprocedente + pParcial + pAcordo + pExtinto;
    pProcedente /= sum;
    pImprocedente /= sum;
    pParcial /= sum;
    pAcordo /= sum;
    pExtinto /= sum;

    const distribution: { outcome: PredictedOutcome; probability: number }[] = [
      { outcome: 'procedente', probability: pProcedente },
      { outcome: 'improcedente', probability: pImprocedente },
      { outcome: 'parcialmente_procedente', probability: pParcial },
      { outcome: 'acordo', probability: pAcordo },
      { outcome: 'extinto_sem_merito', probability: pExtinto },
    ].sort((a, b) => b.probability - a.probability);

    const predicted = distribution[0];

    // Determine confidence
    let confidence: OutcomePrediction['confidence'];
    if (predicted.probability >= 0.6 && (patterns.length > 0 && patterns[0].totalDecisions >= 50)) {
      confidence = 'high';
    } else if (predicted.probability >= 0.4) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    return {
      judgeId,
      judgeName: profile.name,
      predictedOutcome: predicted.outcome,
      probability: predicted.probability,
      outcomeDistribution: distribution,
      factors,
      confidence,
      disclaimer: 'AVISO: Esta previsao e uma estimativa estatistica baseada em dados historicos e nao constitui garantia de resultado. Cada caso possui particularidades que podem influenciar o desfecho. Esta analise deve ser utilizada apenas como ferramenta auxiliar de estrategia, nunca como base unica para decisoes.',
    };
  }

  // ─── Inter-Judge Agreement ────────────────────────────────────────────────

  /**
   * Analyze the agreement rate between two judges.
   *
   * Useful for understanding how different judges in the same court
   * or panel tend to align on decisions. High agreement rates suggest
   * predictable panel outcomes.
   *
   * @param judgeIdA - First judge's identifier
   * @param judgeIdB - Second judge's identifier
   * @returns Agreement analysis
   */
  async analyzeAgreement(
    judgeIdA: string,
    judgeIdB: string,
  ): Promise<JudgeAgreement | null> {
    const profileA = await this.getJudgeProfile(judgeIdA);
    const profileB = await this.getJudgeProfile(judgeIdB);

    if (!profileA || !profileB) return null;

    // Mock agreement calculation based on similar favorable rates
    const rateA = profileA.stats.favorableToAuthor / profileA.stats.totalDecisions;
    const rateB = profileB.stats.favorableToAuthor / profileB.stats.totalDecisions;
    const agreementRate = 1 - Math.abs(rateA - rateB);

    return {
      judgeA: { id: profileA.id, name: profileA.name },
      judgeB: { id: profileB.id, name: profileB.name },
      agreementRate,
      sharedCases: Math.min(profileA.stats.totalDecisions, profileB.stats.totalDecisions) / 10,
      topAgreementThemes: ['Dano moral', 'Responsabilidade civil'],
      topDisagreementThemes: ['Quantum indenizatorio', 'Honorarios sucumbenciais'],
    };
  }

  // ─── Comparative Analysis ─────────────────────────────────────────────────

  /**
   * Compare multiple judges' tendencies on a specific theme.
   *
   * Returns a sorted list of judges ranked by their favorable rate
   * on the given theme, useful for understanding how different
   * judges in the same jurisdiction handle similar cases.
   *
   * @param theme - The legal theme to compare
   * @param court - Optional court filter
   * @returns Array of voting patterns sorted by favorable rate
   */
  async compareJudges(
    theme: string,
    court?: string,
  ): Promise<ThemeVotingPattern[]> {
    let patterns = await this.getVotingPatterns({ theme });

    if (court) {
      const courtProfiles = this.profiles.filter((p) => p.court === court);
      const courtJudgeIds = new Set(courtProfiles.map((p) => p.id));
      patterns = patterns.filter((p) => courtJudgeIds.has(p.judgeId));
    }

    return patterns.sort((a, b) => b.favorableRate - a.favorableRate);
  }
}
