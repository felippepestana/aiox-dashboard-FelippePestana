/**
 * Interview to Strategy Generator
 * Analyzes complete interview transcripts, identifies key facts/claims/evidence,
 * suggests legal strategy, and generates initial petition draft outlines.
 */

import type { TranscriptEntry, LegalArea, InterviewSuggestion } from '@/types/legal';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface KeyFact {
  id: string;
  description: string;
  source: 'client' | 'lawyer' | 'inferred';
  category: 'fact' | 'claim' | 'evidence' | 'date' | 'value' | 'party';
  importance: 'critical' | 'high' | 'medium' | 'low';
  transcriptEntryId?: string;
}

export interface LegalClaim {
  id: string;
  description: string;
  legalBasis: string;
  strength: 'strong' | 'moderate' | 'weak';
  supportingFacts: string[];
  risks: string[];
}

export interface EvidenceItem {
  id: string;
  description: string;
  type: 'document' | 'testimony' | 'expert' | 'digital' | 'other';
  status: 'available' | 'to_obtain' | 'missing';
  importance: 'essential' | 'supporting' | 'optional';
}

export interface StrategyRecommendation {
  id: string;
  action: string;
  description: string;
  priority: 'immediate' | 'short_term' | 'medium_term';
  type: 'procedural' | 'negotiation' | 'litigation' | 'documentation';
}

export interface PetitionOutline {
  title: string;
  type: string;
  sections: PetitionSection[];
  suggestedPrecedents: string[];
  estimatedPages: number;
}

export interface PetitionSection {
  title: string;
  content: string;
  order: number;
}

export interface StrategyDraft {
  id: string;
  area: LegalArea;
  summary: string;
  keyFacts: KeyFact[];
  claims: LegalClaim[];
  evidence: EvidenceItem[];
  recommendations: StrategyRecommendation[];
  petitionOutline: PetitionOutline;
  riskAssessment: string;
  estimatedDuration: string;
  estimatedValue: string;
  nextSteps: string[];
  generatedAt: string;
}

// ─── Fact Extraction ────────────────────────────────────────────────────────

const DATE_PATTERN = /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})\b/g;
const VALUE_PATTERN = /R\$\s?[\d.,]+|(?:\d{1,3}(?:\.\d{3})*(?:,\d{2})?)\s?(?:reais|mil|milhão|milhões)/gi;
const CPF_PATTERN = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
const CNPJ_PATTERN = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;

function extractFacts(transcript: TranscriptEntry[]): KeyFact[] {
  const facts: KeyFact[] = [];
  let factCounter = 0;

  for (const entry of transcript) {
    if (entry.speaker === 'system') continue;

    // Extract dates
    const dates = entry.text.match(DATE_PATTERN);
    if (dates) {
      for (const date of dates) {
        factCounter++;
        facts.push({
          id: `fact-${factCounter}`,
          description: `Data mencionada: ${date}`,
          source: entry.speaker === 'client' ? 'client' : 'lawyer',
          category: 'date',
          importance: 'high',
          transcriptEntryId: entry.id,
        });
      }
    }

    // Extract monetary values
    const values = entry.text.match(VALUE_PATTERN);
    if (values) {
      for (const value of values) {
        factCounter++;
        facts.push({
          id: `fact-${factCounter}`,
          description: `Valor mencionado: ${value.trim()}`,
          source: entry.speaker === 'client' ? 'client' : 'lawyer',
          category: 'value',
          importance: 'high',
          transcriptEntryId: entry.id,
        });
      }
    }

    // Extract CPF/CNPJ
    const cpfs = entry.text.match(CPF_PATTERN);
    const cnpjs = entry.text.match(CNPJ_PATTERN);
    if (cpfs || cnpjs) {
      factCounter++;
      facts.push({
        id: `fact-${factCounter}`,
        description: `Documento identificado: ${(cpfs || cnpjs)?.[0]}`,
        source: entry.speaker === 'client' ? 'client' : 'lawyer',
        category: 'party',
        importance: 'medium',
        transcriptEntryId: entry.id,
      });
    }

    // Extract factual statements from client (longer sentences)
    if (entry.speaker === 'client' && entry.text.length > 50) {
      factCounter++;
      facts.push({
        id: `fact-${factCounter}`,
        description: entry.text.length > 150
          ? entry.text.substring(0, 150) + '...'
          : entry.text,
        source: 'client',
        category: 'fact',
        importance: entry.confidence > 0.8 ? 'high' : 'medium',
        transcriptEntryId: entry.id,
      });
    }
  }

  return facts;
}

// ─── Claim Analysis ─────────────────────────────────────────────────────────

const AREA_CLAIMS: Record<LegalArea, { description: string; basis: string }[]> = {
  civil: [
    { description: 'Indenização por danos morais', basis: 'CC art. 186 c/c art. 927' },
    { description: 'Indenização por danos materiais', basis: 'CC art. 402-405' },
    { description: 'Resolução contratual', basis: 'CC art. 474-475' },
    { description: 'Obrigação de fazer/não fazer', basis: 'CPC art. 497' },
    { description: 'Lucros cessantes', basis: 'CC art. 402' },
  ],
  trabalhista: [
    { description: 'Verbas rescisórias', basis: 'CLT art. 477' },
    { description: 'Horas extras', basis: 'CLT art. 59, CF art. 7º, XVI' },
    { description: 'FGTS + multa 40%', basis: 'Lei 8.036/90 art. 18' },
    { description: 'Adicional de insalubridade', basis: 'CLT art. 189-192' },
    { description: 'Dano moral trabalhista', basis: 'CLT art. 223-A a 223-G' },
  ],
  tributario: [
    { description: 'Repetição de indébito tributário', basis: 'CTN art. 165' },
    { description: 'Anulação de auto de infração', basis: 'CTN art. 142-150' },
    { description: 'Compensação tributária', basis: 'Lei 9.430/96 art. 74' },
  ],
  penal: [
    { description: 'Absolvição por atipicidade', basis: 'CPP art. 386, III' },
    { description: 'Absolvição por insuficiência de provas', basis: 'CPP art. 386, VII' },
    { description: 'Liberdade provisória', basis: 'CPP art. 321' },
  ],
  administrativo: [
    { description: 'Anulação de ato administrativo', basis: 'Lei 9.784/99' },
    { description: 'Mandado de segurança', basis: 'Lei 12.016/2009' },
  ],
  consumidor: [
    { description: 'Reparação por vício do produto', basis: 'CDC art. 18-20' },
    { description: 'Indenização por fato do produto', basis: 'CDC art. 12-14' },
    { description: 'Repetição em dobro', basis: 'CDC art. 42, parágrafo único' },
  ],
  familia: [
    { description: 'Fixação de alimentos', basis: 'CC art. 1.694-1.710' },
    { description: 'Guarda compartilhada', basis: 'CC art. 1.583-1.584' },
    { description: 'Partilha de bens', basis: 'CC art. 1.658-1.688' },
  ],
  empresarial: [
    { description: 'Dissolução parcial de sociedade', basis: 'CC art. 1.029-1.035' },
    { description: 'Apuração de haveres', basis: 'CPC art. 599-609' },
  ],
  previdenciario: [
    { description: 'Concessão de benefício por incapacidade', basis: 'Lei 8.213/91 art. 42-47' },
    { description: 'Aposentadoria especial', basis: 'Lei 8.213/91 art. 57-58' },
    { description: 'Revisão de benefício', basis: 'Lei 8.213/91 art. 103-A' },
  ],
  ambiental: [
    { description: 'Reparação de dano ambiental', basis: 'Lei 6.938/81 art. 14, §1º' },
    { description: 'Anulação de licença ambiental', basis: 'Res. CONAMA 237/97' },
  ],
  digital: [
    { description: 'Indenização por vazamento de dados', basis: 'LGPD art. 42' },
    { description: 'Remoção de conteúdo', basis: 'Marco Civil art. 19-21' },
  ],
};

function analyzeClaims(
  facts: KeyFact[],
  transcript: TranscriptEntry[],
  area: LegalArea
): LegalClaim[] {
  const areaClaims = AREA_CLAIMS[area] || [];
  const transcriptText = transcript.map((e) => e.text).join(' ').toLowerCase();
  const claims: LegalClaim[] = [];
  let claimCounter = 0;

  for (const claim of areaClaims) {
    // Determine strength based on supporting evidence in transcript
    const claimKeywords = claim.description.toLowerCase().split(' ').filter((w) => w.length > 4);
    const matchCount = claimKeywords.filter((kw) => transcriptText.includes(kw)).length;
    const ratio = claimKeywords.length > 0 ? matchCount / claimKeywords.length : 0;

    if (ratio > 0.2) {
      claimCounter++;
      const strength: 'strong' | 'moderate' | 'weak' =
        ratio > 0.6 ? 'strong' : ratio > 0.35 ? 'moderate' : 'weak';

      claims.push({
        id: `claim-${claimCounter}`,
        description: claim.description,
        legalBasis: claim.basis,
        strength,
        supportingFacts: facts
          .filter((f) => f.importance === 'critical' || f.importance === 'high')
          .slice(0, 3)
          .map((f) => f.id),
        risks: strength === 'weak'
          ? ['Evidências insuficientes para sustentar este pedido']
          : [],
      });
    }
  }

  return claims.sort((a, b) => {
    const order = { strong: 0, moderate: 1, weak: 2 };
    return order[a.strength] - order[b.strength];
  });
}

// ─── Evidence Analysis ──────────────────────────────────────────────────────

function analyzeEvidence(transcript: TranscriptEntry[]): EvidenceItem[] {
  const evidence: EvidenceItem[] = [];
  let evidenceCounter = 0;
  const text = transcript.map((e) => e.text).join(' ').toLowerCase();

  const evidencePatterns: {
    pattern: string;
    type: EvidenceItem['type'];
    desc: string;
    importance: EvidenceItem['importance'];
  }[] = [
    { pattern: 'contrato', type: 'document', desc: 'Contrato', importance: 'essential' },
    { pattern: 'nota fiscal', type: 'document', desc: 'Nota fiscal', importance: 'essential' },
    { pattern: 'comprovante', type: 'document', desc: 'Comprovante de pagamento', importance: 'supporting' },
    { pattern: 'testemunha', type: 'testimony', desc: 'Testemunha presencial', importance: 'supporting' },
    { pattern: 'laudo', type: 'expert', desc: 'Laudo pericial/médico', importance: 'essential' },
    { pattern: 'print', type: 'digital', desc: 'Captura de tela', importance: 'supporting' },
    { pattern: 'screenshot', type: 'digital', desc: 'Captura de tela', importance: 'supporting' },
    { pattern: 'email', type: 'digital', desc: 'Troca de emails', importance: 'supporting' },
    { pattern: 'whatsapp', type: 'digital', desc: 'Mensagens de WhatsApp', importance: 'supporting' },
    { pattern: 'foto', type: 'digital', desc: 'Fotografias', importance: 'supporting' },
    { pattern: 'vídeo', type: 'digital', desc: 'Gravação em vídeo', importance: 'supporting' },
    { pattern: 'boletim de ocorrência', type: 'document', desc: 'Boletim de ocorrência', importance: 'essential' },
    { pattern: 'receituário', type: 'document', desc: 'Receituário médico', importance: 'supporting' },
    { pattern: 'exame', type: 'expert', desc: 'Exame médico/laboratorial', importance: 'supporting' },
    { pattern: 'holerite', type: 'document', desc: 'Holerite/contracheque', importance: 'essential' },
    { pattern: 'ctps', type: 'document', desc: 'CTPS', importance: 'essential' },
    { pattern: 'certidão', type: 'document', desc: 'Certidão', importance: 'supporting' },
  ];

  const seen = new Set<string>();
  for (const ep of evidencePatterns) {
    if (text.includes(ep.pattern) && !seen.has(ep.desc)) {
      seen.add(ep.desc);
      evidenceCounter++;
      evidence.push({
        id: `ev-${evidenceCounter}`,
        description: ep.desc,
        type: ep.type,
        status: 'to_obtain',
        importance: ep.importance,
      });
    }
  }

  return evidence;
}

// ─── Petition Outline Generator ─────────────────────────────────────────────

function generatePetitionOutline(
  area: LegalArea,
  claims: LegalClaim[],
  facts: KeyFact[]
): PetitionOutline {
  const mainClaim = claims[0];
  const sections: PetitionSection[] = [
    {
      title: 'I - DA QUALIFICAÇÃO DAS PARTES',
      content: 'Qualificação completa do autor e réu com base nos dados coletados na entrevista.',
      order: 1,
    },
    {
      title: 'II - DOS FATOS',
      content: facts
        .filter((f) => f.category === 'fact')
        .map((f) => f.description)
        .join('\n') || 'Narração dos fatos conforme relato do cliente.',
      order: 2,
    },
    {
      title: 'III - DO DIREITO',
      content: claims
        .map((c) => `${c.description} (${c.legalBasis})`)
        .join('\n') || 'Fundamentação jurídica aplicável.',
      order: 3,
    },
    {
      title: 'IV - DA JURISPRUDÊNCIA',
      content: 'Precedentes jurisprudenciais identificados durante a entrevista.',
      order: 4,
    },
    {
      title: 'V - DA TUTELA DE URGÊNCIA',
      content: 'Avaliar necessidade de tutela provisória (art. 300, CPC).',
      order: 5,
    },
    {
      title: 'VI - DOS PEDIDOS',
      content: claims
        .map((c, i) => `${String.fromCharCode(97 + i)}) ${c.description}`)
        .join('\n') || 'Pedidos principais e subsidiários.',
      order: 6,
    },
    {
      title: 'VII - DO VALOR DA CAUSA',
      content: 'Valor atribuído à causa conforme art. 292, CPC.',
      order: 7,
    },
  ];

  const typeMap: Record<string, string> = {
    civil: 'Petição Inicial Cível',
    trabalhista: 'Reclamação Trabalhista',
    tributario: 'Ação Anulatória/Mandado de Segurança',
    penal: 'Defesa Prévia/Resposta à Acusação',
    administrativo: 'Mandado de Segurança',
    consumidor: 'Petição Inicial Consumerista',
    familia: 'Ação de Família',
    empresarial: 'Ação Societária',
    previdenciario: 'Ação Previdenciária',
    ambiental: 'Ação Civil Pública/Ambiental',
    digital: 'Ação de Proteção de Dados',
  };

  return {
    title: `${typeMap[area] || 'Petição Inicial'} - ${mainClaim?.description || area}`,
    type: typeMap[area] || 'Petição Inicial',
    sections,
    suggestedPrecedents: claims
      .filter((c) => c.strength === 'strong')
      .map((c) => c.legalBasis),
    estimatedPages: Math.max(5, sections.length * 2),
  };
}

// ─── Main Export ────────────────────────────────────────────────────────────

export async function generateStrategy(
  transcript: TranscriptEntry[],
  area: LegalArea,
  suggestions?: InterviewSuggestion[]
): Promise<StrategyDraft> {
  // 1. Extract key facts from transcript
  const keyFacts = extractFacts(transcript);

  // 2. Analyze legal claims
  const claims = analyzeClaims(keyFacts, transcript, area);

  // 3. Catalog evidence
  const evidence = analyzeEvidence(transcript);

  // 4. Generate recommendations
  const recommendations: StrategyRecommendation[] = [];
  let recCounter = 0;

  // Immediate recommendations
  const missingEssential = evidence.filter(
    (e) => e.importance === 'essential' && e.status !== 'available'
  );
  if (missingEssential.length > 0) {
    recCounter++;
    recommendations.push({
      id: `rec-${recCounter}`,
      action: 'Coletar documentos essenciais',
      description: `Solicitar ao cliente: ${missingEssential.map((e) => e.description).join(', ')}`,
      priority: 'immediate',
      type: 'documentation',
    });
  }

  if (claims.some((c) => c.strength === 'strong')) {
    recCounter++;
    recommendations.push({
      id: `rec-${recCounter}`,
      action: 'Ajuizar ação principal',
      description: `Preparar ${claims.filter((c) => c.strength === 'strong').length} pedido(s) forte(s) identificado(s)`,
      priority: 'short_term',
      type: 'litigation',
    });
  }

  // Check if urgency is needed
  const hasUrgentKeywords = transcript.some((e) =>
    /urgent|imediato|prazo|mandado|liminar|busca|apreensão/i.test(e.text)
  );
  if (hasUrgentKeywords) {
    recCounter++;
    recommendations.push({
      id: `rec-${recCounter}`,
      action: 'Avaliar tutela de urgência',
      description: 'Indícios de urgência detectados. Avaliar pedido de tutela provisória (art. 300, CPC).',
      priority: 'immediate',
      type: 'procedural',
    });
  }

  recCounter++;
  recommendations.push({
    id: `rec-${recCounter}`,
    action: 'Pesquisa jurisprudencial complementar',
    description: 'Aprofundar pesquisa de precedentes para fundamentar os pedidos principais.',
    priority: 'short_term',
    type: 'documentation',
  });

  // Consider negotiation
  const mentionsAgreement = transcript.some((e) =>
    /acordo|negociar|proposta|compor|resolver/i.test(e.text)
  );
  if (mentionsAgreement) {
    recCounter++;
    recommendations.push({
      id: `rec-${recCounter}`,
      action: 'Avaliar composição extrajudicial',
      description: 'Cliente mencionou possibilidade de acordo. Considerar notificação extrajudicial antes de ajuizar.',
      priority: 'short_term',
      type: 'negotiation',
    });
  }

  // 5. Generate petition outline
  const petitionOutline = generatePetitionOutline(area, claims, keyFacts);

  // 6. Risk assessment
  const weakClaims = claims.filter((c) => c.strength === 'weak').length;
  const strongClaims = claims.filter((c) => c.strength === 'strong').length;
  let riskAssessment = '';
  if (strongClaims > weakClaims) {
    riskAssessment = 'Risco baixo. Caso com boa fundamentação e evidências identificadas.';
  } else if (strongClaims === weakClaims) {
    riskAssessment = 'Risco moderado. Necessário fortalecer evidências para alguns pedidos.';
  } else {
    riskAssessment = 'Risco alto. Evidências insuficientes para a maioria dos pedidos. Considerar estratégia alternativa.';
  }

  // 7. Build summary
  const clientEntries = transcript.filter((e) => e.speaker === 'client');
  const totalDuration = transcript.length > 0
    ? Math.round(
        (new Date(transcript[transcript.length - 1].timestamp).getTime() -
          new Date(transcript[0].timestamp).getTime()) /
          60000
      )
    : 0;

  const summary = [
    `Entrevista com ${clientEntries.length} manifestações do cliente.`,
    `Duração aproximada: ${totalDuration || '< 1'} minutos.`,
    `Área: ${area}.`,
    `${claims.length} tese(s) jurídica(s) identificada(s) (${strongClaims} forte(s)).`,
    `${evidence.length} item(ns) de prova catalogado(s).`,
    `${recommendations.length} recomendação(ões) estratégica(s).`,
  ].join(' ');

  const nextSteps = [
    'Agendar retorno com documentos faltantes',
    'Pesquisar jurisprudência complementar',
    'Elaborar petição inicial com base no esboço gerado',
    'Revisar estratégia com equipe',
    'Definir honorários e contrato',
  ];

  return {
    id: `strategy-${Date.now()}`,
    area,
    summary,
    keyFacts,
    claims,
    evidence,
    recommendations: recommendations.sort((a, b) => {
      const order = { immediate: 0, short_term: 1, medium_term: 2 };
      return order[a.priority] - order[b.priority];
    }),
    petitionOutline,
    riskAssessment,
    estimatedDuration: claims.length > 3 ? '6-12 meses' : '3-6 meses',
    estimatedValue: 'A definir conforme documentação',
    nextSteps,
    generatedAt: new Date().toISOString(),
  };
}
