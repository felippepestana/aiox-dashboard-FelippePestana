// =============================================================================
// Legal Intelligence Engine
// AI-powered precedent search, case similarity, and magistrate profiling
// Uses OpenRouter AI via the callAI router
// =============================================================================

// ─── Types ──────────────────────────────────────────────────────────────────

export type Favorability = 'favorable' | 'unfavorable' | 'neutral';

export interface PrecedentFilters {
  tribunal?: string;
  area?: string;
  dateRange?: { start: string; end: string };
  favorability?: Favorability;
}

export interface PrecedentResult {
  caseNumber: string;
  summary: string;
  relevanceScore: number; // 0–100
  favorability: Favorability;
  tribunal: string;
  date: string;
  relator: string;
  themes: string[];
  area: string;
}

export interface PrecedentSearchResponse {
  results: PrecedentResult[];
  totalFound: number;
  queryUsed: string;
  processingMs: number;
}

// ─── Similarity ──────────────────────────────────────────────────────────────

export interface SimilarityFilters {
  targetCases?: string[];
  area?: string;
  tribunal?: string;
}

export interface SimilarCaseResult {
  caseNumber: string;
  tribunal: string;
  similarityScore: number; // 0–100
  matchingFactors: string[];
  keyDifferences: string[];
  outcome: string;
  date: string;
  summary: string;
}

export interface SimilarityAnalysisResponse {
  description: string;
  results: SimilarCaseResult[];
  overallSimilarityInsight: string;
  recommendation: string;
  processingMs: number;
}

// ─── Magistrate Profile ───────────────────────────────────────────────────────

export interface MagistrateTendency {
  area: string;
  favorableRate: number; // 0–100
  totalDecisions: number;
  commonPatterns: string[];
}

export interface NotableDecision {
  caseNumber: string;
  date: string;
  area: string;
  summary: string;
  outcome: string;
}

export interface MagistrateProfile {
  name: string;
  tribunal: string;
  vara?: string;
  position: string;
  averageDecisionTimeDays: number;
  totalDecisions: number;
  overallFavorabilityRate: number; // 0–100
  tendencies: MagistrateTendency[];
  notableDecisions: NotableDecision[];
  strategicRecommendations: string[];
  sentimentScore: number; // 0–100
  keyTopics: string[];
}

// ─── Intelligence Report ─────────────────────────────────────────────────────

export interface IntelligenceReportOptions {
  includesSimilarity?: boolean;
  includesMagistrateProfile?: boolean;
  includesPrecedents?: boolean;
}

export interface IntelligenceReport {
  processId: string;
  generatedAt: string;
  precedents: PrecedentResult[];
  similarCases: SimilarCaseResult[];
  magistrateProfile?: MagistrateProfile;
  overallRiskScore: number; // 0–100
  recommendations: string[];
  summary: string;
}

// ─── Intelligence Engine ──────────────────────────────────────────────────────

/**
 * Calls the /api/legal/intelligence endpoint.
 * All AI processing happens server-side through OpenRouter.
 */
async function callIntelligenceAPI<T>(body: Record<string, unknown>): Promise<T> {
  const response = await fetch('/api/legal/intelligence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.message || `Intelligence API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Search for relevant legal precedents using AI-powered analysis.
 *
 * @param query - Free text query describing the legal situation
 * @param filters - Optional filters for tribunal, area, date, favorability
 * @returns Ranked precedent results with relevance scores
 */
export async function searchPrecedents(
  query: string,
  filters?: PrecedentFilters,
): Promise<PrecedentSearchResponse> {
  return callIntelligenceAPI<PrecedentSearchResponse>({
    action: 'search-precedents',
    query,
    filters,
  });
}

/**
 * Find cases similar to the provided process description.
 *
 * @param processDescription - Detailed description of the legal case
 * @param filters - Optional filters for target cases, area, tribunal
 * @returns Similarity results with matching factors and differences
 */
export async function analyzeSimilarity(
  processDescription: string,
  filters?: SimilarityFilters,
): Promise<SimilarityAnalysisResponse> {
  return callIntelligenceAPI<SimilarityAnalysisResponse>({
    action: 'similarity',
    description: processDescription,
    cases: filters?.targetCases,
    area: filters?.area,
    tribunal: filters?.tribunal,
  });
}

/**
 * Build a comprehensive AI-powered profile for a magistrate.
 *
 * @param judgeName - Name of the judge/desembargador/ministro
 * @param tribunal - Optional tribunal to narrow the search
 * @returns Detailed magistrate profile with tendencies and recommendations
 */
export async function profileMagistrate(
  judgeName: string,
  tribunal?: string,
): Promise<MagistrateProfile> {
  return callIntelligenceAPI<MagistrateProfile>({
    action: 'profile-magistrate',
    judge: judgeName,
    tribunal,
  });
}

/**
 * Generate a comprehensive intelligence report for a process.
 * Combines precedent search, similarity analysis, and magistrate profiling.
 *
 * @param processId - The process identifier
 * @param options - What sections to include in the report
 * @returns Full intelligence report with recommendations
 */
export async function generateIntelligenceReport(
  processId: string,
  options?: IntelligenceReportOptions,
): Promise<IntelligenceReport> {
  return callIntelligenceAPI<IntelligenceReport>({
    action: 'report',
    processId,
    options,
  });
}
