/**
 * PEDRO-style Case Similarity Engine
 * Compares case text against precedent database using text similarity scoring.
 * Inspired by CNJ/UnB PEDRO platform (Plataforma de Extração e Descoberta de Precedentes).
 * Minimum 70% similarity threshold for qualified precedent matching.
 */

export interface SimilarityResult {
  precedentId: string;
  precedentNumero: string;
  precedentTribunal: string;
  similarityScore: number; // 0-100
  matchingPhrases: string[];
  recommendation: 'highly_relevant' | 'relevant' | 'marginally_relevant' | 'not_relevant';
}

export interface SimilarityAnalysis {
  caseText: string;
  results: SimilarityResult[];
  totalAnalyzed: number;
  qualifiedCount: number; // >= 70% threshold
  analysisTime: number;
}

const SIMILARITY_THRESHOLD = 70;

/**
 * Analyze similarity between a case text and a set of precedents.
 * Uses TF-IDF-inspired keyword extraction and Jaccard similarity.
 */
export async function analyzeSimilarity(
  caseText: string,
  precedentTexts: { id: string; numero: string; tribunal: string; text: string }[]
): Promise<SimilarityAnalysis> {
  const startTime = Date.now();

  // Extract keywords from case text
  const caseKeywords = extractKeywords(caseText);

  const results: SimilarityResult[] = precedentTexts.map((precedent) => {
    const precedentKeywords = extractKeywords(precedent.text);
    const score = calculateJaccardSimilarity(caseKeywords, precedentKeywords);
    const matchingPhrases = findMatchingPhrases(caseText, precedent.text);

    return {
      precedentId: precedent.id,
      precedentNumero: precedent.numero,
      precedentTribunal: precedent.tribunal,
      similarityScore: Math.round(score * 100),
      matchingPhrases,
      recommendation: getRecommendation(score * 100),
    };
  });

  // Sort by similarity score descending
  results.sort((a, b) => b.similarityScore - a.similarityScore);

  const qualifiedCount = results.filter((r) => r.similarityScore >= SIMILARITY_THRESHOLD).length;

  return {
    caseText: caseText.substring(0, 200) + '...',
    results,
    totalAnalyzed: precedentTexts.length,
    qualifiedCount,
    analysisTime: Date.now() - startTime,
  };
}

function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    'de', 'da', 'do', 'das', 'dos', 'em', 'no', 'na', 'nos', 'nas',
    'um', 'uma', 'uns', 'umas', 'o', 'a', 'os', 'as', 'e', 'ou',
    'que', 'se', 'para', 'por', 'com', 'ao', 'aos', 'à', 'às',
    'pelo', 'pela', 'pelos', 'pelas', 'é', 'são', 'foi', 'ser',
    'ter', 'como', 'mais', 'seu', 'sua', 'seus', 'suas', 'este',
    'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas',
    'não', 'sim', 'já', 'ainda', 'entre', 'sobre', 'após', 'sem',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\sáàâãéèêíìîóòôõúùûç]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  return new Set(words);
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function findMatchingPhrases(textA: string, textB: string): string[] {
  const phrasesA = extractPhrases(textA);
  const phrasesB = new Set(extractPhrases(textB));

  return phrasesA.filter((p) => phrasesB.has(p)).slice(0, 10);
}

function extractPhrases(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const phrases: string[] = [];

  // Extract 3-grams
  for (let i = 0; i < words.length - 2; i++) {
    phrases.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
  }

  return phrases;
}

function getRecommendation(score: number): SimilarityResult['recommendation'] {
  if (score >= 85) return 'highly_relevant';
  if (score >= 70) return 'relevant';
  if (score >= 50) return 'marginally_relevant';
  return 'not_relevant';
}
