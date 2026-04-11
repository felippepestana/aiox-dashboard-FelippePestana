/**
 * VICTOR-inspired Case Classifier
 * Inspired by STF's VICTOR AI system for classifying extraordinary appeals
 * by general repercussion themes and admissibility criteria.
 */

export interface ClassificationResult {
  documentType: DocumentType;
  themes: ThemeMatch[];
  admissibilityScore: number; // 0-100
  recommendation: 'admit' | 'deny' | 'review';
  confidence: number; // 0-100
}

export interface ThemeMatch {
  themeNumber: number;
  title: string;
  matchScore: number; // 0-100
  isBinding: boolean;
}

export type DocumentType =
  | 'recurso_extraordinario'
  | 'agravo_recurso_extraordinario'
  | 'recurso_especial'
  | 'agravo_recurso_especial'
  | 'peticao_inicial'
  | 'contestacao'
  | 'sentenca'
  | 'acordao'
  | 'outro';

/**
 * Classify a legal document by type and match against repercussion themes.
 */
export async function classifyDocument(
  text: string
): Promise<ClassificationResult> {
  const documentType = identifyDocumentType(text);
  const themes = matchThemes(text);
  const admissibilityScore = calculateAdmissibility(text, documentType, themes);

  let recommendation: ClassificationResult['recommendation'];
  if (admissibilityScore >= 70) recommendation = 'admit';
  else if (admissibilityScore >= 40) recommendation = 'review';
  else recommendation = 'deny';

  return {
    documentType,
    themes,
    admissibilityScore,
    recommendation,
    confidence: Math.min(95, admissibilityScore + 10),
  };
}

function identifyDocumentType(text: string): DocumentType {
  const lower = text.toLowerCase();

  if (lower.includes('recurso extraordinário')) return 'recurso_extraordinario';
  if (lower.includes('agravo em recurso extraordinário')) return 'agravo_recurso_extraordinario';
  if (lower.includes('recurso especial')) return 'recurso_especial';
  if (lower.includes('agravo em recurso especial')) return 'agravo_recurso_especial';
  if (lower.includes('petição inicial') || lower.includes('excelentíssimo')) return 'peticao_inicial';
  if (lower.includes('contestação')) return 'contestacao';
  if (lower.includes('sentença') && lower.includes('julgo')) return 'sentenca';
  if (lower.includes('acórdão') && lower.includes('acordam')) return 'acordao';

  return 'outro';
}

function matchThemes(text: string): ThemeMatch[] {
  const lower = text.toLowerCase();
  const themes: ThemeMatch[] = [];

  // Theme keyword matching (simplified from ML model)
  const themeKeywords: { number: number; title: string; keywords: string[]; binding: boolean }[] = [
    {
      number: 988,
      title: 'Taxatividade mitigada do art. 1.015 do CPC',
      keywords: ['agravo de instrumento', 'art. 1.015', 'taxatividade', 'mitigada', 'urgência', 'inutilidade'],
      binding: true,
    },
    {
      number: 1095,
      title: 'Notificação extrajudicial busca e apreensão fiduciária',
      keywords: ['notificação', 'extrajudicial', 'busca e apreensão', 'alienação fiduciária', 'mora', 'dl 911'],
      binding: true,
    },
    {
      number: 810,
      title: 'Honorários sucumbenciais em causas contra a Fazenda Pública',
      keywords: ['honorários', 'sucumbência', 'fazenda pública', 'art. 85', '§3º'],
      binding: true,
    },
    {
      number: 1046,
      title: 'Impenhorabilidade de bem de família do fiador',
      keywords: ['bem de família', 'fiador', 'impenhorabilidade', 'locação'],
      binding: false,
    },
  ];

  for (const theme of themeKeywords) {
    const matchCount = theme.keywords.filter((kw) => lower.includes(kw)).length;
    if (matchCount > 0) {
      const score = Math.round((matchCount / theme.keywords.length) * 100);
      themes.push({
        themeNumber: theme.number,
        title: theme.title,
        matchScore: score,
        isBinding: theme.binding,
      });
    }
  }

  themes.sort((a, b) => b.matchScore - a.matchScore);
  return themes;
}

function calculateAdmissibility(
  text: string,
  docType: DocumentType,
  themes: ThemeMatch[]
): number {
  let score = 0;

  // Check prequestionamento
  if (text.toLowerCase().includes('prequestionamento') || text.toLowerCase().includes('prequestion')) {
    score += 20;
  }

  // Check repercussão geral
  if (text.toLowerCase().includes('repercussão geral')) {
    score += 15;
  }

  // Check constitutional violation
  if (text.toLowerCase().includes('constituição federal') || text.toLowerCase().includes('art. 5º')) {
    score += 15;
  }

  // Matching themes boost
  if (themes.length > 0) {
    score += Math.min(30, themes[0].matchScore * 0.3);
  }

  // Document type relevance
  if (docType === 'recurso_extraordinario' || docType === 'recurso_especial') {
    score += 10;
  }

  // Fundamentation check
  if (text.toLowerCase().includes('art. 102') || text.toLowerCase().includes('art. 105')) {
    score += 10;
  }

  return Math.min(100, score);
}
