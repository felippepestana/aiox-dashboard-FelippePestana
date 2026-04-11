/**
 * Judge/Desembargador Voting Pattern Analyzer
 * Tracks voting history, analyzes patterns by theme/area,
 * provides sentiment scoring and outcome prediction.
 */

export interface JudgeProfile {
  id: string;
  name: string;
  tribunal: string;
  vara?: string;
  areas: string[];
  totalCases: number;
  favorableRate: number; // 0-100 (percentage favorable to plaintiff)
  sentimentScore: number; // 0-10
  lastAnalyzed: string;
}

export interface VotingPattern {
  area: string;
  totalVotes: number;
  favorable: number;
  unfavorable: number;
  partial: number;
  favorableRate: number;
}

export interface JudgeAnalysis {
  profile: JudgeProfile;
  votingPatterns: VotingPattern[];
  recentDecisions: RecentDecision[];
  keyTopics: string[];
  prediction: OutcomePrediction;
}

export interface RecentDecision {
  id: string;
  processNumber: string;
  date: string;
  area: string;
  outcome: 'favorable' | 'unfavorable' | 'partial';
  summary: string;
}

export interface OutcomePrediction {
  area: string;
  favorableProbability: number; // 0-100
  confidence: number; // 0-100
  basedOnCases: number;
  recommendation: string;
}

/**
 * Analyze a judge's voting patterns and predict likely outcome for a given area.
 */
export async function analyzeJudge(
  judgeName: string,
  area?: string
): Promise<JudgeAnalysis> {
  // Mock implementation for development
  const profile = getMockProfile(judgeName);
  const patterns = getMockPatterns();
  const decisions = getMockDecisions();
  const prediction = predictOutcome(patterns, area || 'civil');

  return {
    profile,
    votingPatterns: patterns,
    recentDecisions: decisions,
    keyTopics: ['Contratos', 'Responsabilidade Civil', 'Direito do Consumidor', 'Busca e Apreensão'],
    prediction,
  };
}

/**
 * Get a list of judges for a given tribunal and area.
 */
export async function searchJudges(params: {
  tribunal?: string;
  area?: string;
  name?: string;
}): Promise<JudgeProfile[]> {
  return getMockJudgeList().filter((j) => {
    if (params.tribunal && !j.tribunal.toLowerCase().includes(params.tribunal.toLowerCase())) return false;
    if (params.area && !j.areas.includes(params.area)) return false;
    if (params.name && !j.name.toLowerCase().includes(params.name.toLowerCase())) return false;
    return true;
  });
}

function predictOutcome(patterns: VotingPattern[], area: string): OutcomePrediction {
  const pattern = patterns.find((p) => p.area === area);

  if (!pattern || pattern.totalVotes < 5) {
    return {
      area,
      favorableProbability: 50,
      confidence: 20,
      basedOnCases: pattern?.totalVotes || 0,
      recommendation: 'Dados insuficientes para predição confiável. Recomenda-se análise manual.',
    };
  }

  const probability = pattern.favorableRate;
  const confidence = Math.min(90, 30 + pattern.totalVotes * 2);

  let recommendation: string;
  if (probability >= 70) {
    recommendation = `Magistrado tende a decidir favoravelmente em ${area} (${probability}% favorável). Recomenda-se argumentação focada na jurisprudência consolidada.`;
  } else if (probability >= 40) {
    recommendation = `Magistrado apresenta posicionamento equilibrado em ${area}. Recomenda-se fundamentação robusta com precedentes vinculantes.`;
  } else {
    recommendation = `Magistrado tende a decidir desfavoravelmente em ${area} (${100 - probability}% desfavorável). Recomenda-se estratégia de distinção do caso ou busca de tribunal recursal.`;
  }

  return { area, favorableProbability: probability, confidence, basedOnCases: pattern.totalVotes, recommendation };
}

function getMockProfile(name: string): JudgeProfile {
  return {
    id: 'judge-1',
    name: name || 'Dr. João Silva',
    tribunal: 'TJSP',
    vara: '1ª Vara Cível',
    areas: ['civil', 'consumidor', 'empresarial'],
    totalCases: 1250,
    favorableRate: 58,
    sentimentScore: 6.5,
    lastAnalyzed: '2026-04-10',
  };
}

function getMockPatterns(): VotingPattern[] {
  return [
    { area: 'civil', totalVotes: 450, favorable: 261, unfavorable: 144, partial: 45, favorableRate: 58 },
    { area: 'consumidor', totalVotes: 380, favorable: 266, unfavorable: 76, partial: 38, favorableRate: 70 },
    { area: 'empresarial', totalVotes: 200, favorable: 80, unfavorable: 100, partial: 20, favorableRate: 40 },
    { area: 'familia', totalVotes: 120, favorable: 72, unfavorable: 36, partial: 12, favorableRate: 60 },
    { area: 'trabalhista', totalVotes: 100, favorable: 65, unfavorable: 25, partial: 10, favorableRate: 65 },
  ];
}

function getMockDecisions(): RecentDecision[] {
  return [
    { id: 'd1', processNumber: '1234567-89.2025.8.26.0100', date: '2026-04-08', area: 'civil', outcome: 'favorable', summary: 'Procedente ação de indenização por danos morais. Condenou réu ao pagamento de R$ 10.000,00.' },
    { id: 'd2', processNumber: '9876543-21.2025.8.26.0100', date: '2026-04-05', area: 'consumidor', outcome: 'favorable', summary: 'Declarou abusividade de cláusula contratual. Revisão de contrato deferida.' },
    { id: 'd3', processNumber: '5432109-87.2025.8.26.0100', date: '2026-04-02', area: 'empresarial', outcome: 'unfavorable', summary: 'Improcedente ação de dissolução parcial de sociedade.' },
  ];
}

function getMockJudgeList(): JudgeProfile[] {
  return [
    { id: 'j1', name: 'Dr. João Silva', tribunal: 'TJSP', vara: '1ª Vara Cível', areas: ['civil', 'consumidor'], totalCases: 1250, favorableRate: 58, sentimentScore: 6.5, lastAnalyzed: '2026-04-10' },
    { id: 'j2', name: 'Dra. Maria Santos', tribunal: 'TJSP', vara: '3ª Vara Cível', areas: ['civil', 'familia'], totalCases: 980, favorableRate: 65, sentimentScore: 7.2, lastAnalyzed: '2026-04-09' },
    { id: 'j3', name: 'Dr. Carlos Oliveira', tribunal: 'TJRJ', vara: '5ª Vara Empresarial', areas: ['empresarial', 'civil'], totalCases: 750, favorableRate: 45, sentimentScore: 5.0, lastAnalyzed: '2026-04-08' },
    { id: 'j4', name: 'Dra. Ana Pereira', tribunal: 'TRT2', vara: '10ª Vara do Trabalho', areas: ['trabalhista'], totalCases: 2100, favorableRate: 72, sentimentScore: 7.8, lastAnalyzed: '2026-04-10' },
  ];
}
