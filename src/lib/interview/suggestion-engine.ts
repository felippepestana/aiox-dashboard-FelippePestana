/**
 * Suggestion Engine
 * AI-powered question suggestion engine that analyzes interview transcripts
 * in real-time, suggests follow-up questions, precedent-related queries,
 * and warns about missing key information.
 */

import type { TranscriptEntry, InterviewSuggestion, LegalArea } from '@/types/legal';

// ─── Types ──────────────────────────────────────────────────────────────────

export type SuggestionType = 'question' | 'precedent' | 'strategy' | 'warning';

export interface Suggestion {
  id: string;
  type: SuggestionType;
  content: string;
  relevance: number;
  category: string;
  timestamp: string;
}

export interface SuggestionEngine {
  analyze: (transcript: TranscriptEntry[], area: LegalArea) => Suggestion[];
  getAreaQuestions: (area: LegalArea) => string[];
  getMissingInfo: (transcript: TranscriptEntry[], area: LegalArea) => Suggestion[];
}

// ─── Area-specific Question Banks ───────────────────────────────────────────

const AREA_QUESTIONS: Record<LegalArea, string[]> = {
  civil: [
    'Quando ocorreu o fato gerador do dano?',
    'Há provas documentais do prejuízo sofrido?',
    'Foi realizada notificação extrajudicial?',
    'Qual o valor estimado do dano material?',
    'Houve tentativa de resolução amigável?',
    'Existem testemunhas dos fatos?',
    'O contrato possui cláusula de foro eleito?',
    'Há cláusula de arbitragem no contrato?',
  ],
  trabalhista: [
    'Qual a data de admissão e demissão?',
    'A rescisão foi por justa causa?',
    'O FGTS foi depositado corretamente?',
    'Havia controle de ponto na empresa?',
    'O trabalhador realizava horas extras?',
    'Recebia adicional de insalubridade ou periculosidade?',
    'Foi cumprido o aviso prévio?',
    'Houve assédio moral ou sexual?',
    'O empregado usufruiu férias regulares?',
    'Tem comprovantes de pagamento de salário?',
  ],
  tributario: [
    'Qual o tributo em discussão?',
    'Há auto de infração lavrado?',
    'O contribuinte está inscrito em dívida ativa?',
    'Qual o regime tributário da empresa?',
    'Houve autuação fiscal? Quando?',
    'Existem compensações tributárias pendentes?',
    'O prazo decadencial já transcorreu?',
    'Há certidão de regularidade fiscal?',
  ],
  penal: [
    'Quando ocorreram os fatos?',
    'Houve flagrante? O cliente foi preso?',
    'Já foi ouvido em delegacia?',
    'Há inquérito policial instaurado?',
    'Existem testemunhas de acusação?',
    'O cliente tem antecedentes criminais?',
    'Foi oferecido acordo de não persecução penal?',
    'Há medidas cautelares em vigor?',
    'O cliente responde a outros processos?',
  ],
  administrativo: [
    'Qual o órgão administrativo envolvido?',
    'Houve processo administrativo prévio?',
    'O ato administrativo foi publicado?',
    'Qual o prazo para recurso administrativo?',
    'Há vício de motivação no ato?',
    'O devido processo legal foi observado?',
  ],
  consumidor: [
    'Qual o produto ou serviço envolvido?',
    'Quando a compra/contratação foi realizada?',
    'Há nota fiscal ou comprovante?',
    'O fornecedor foi procurado para solução?',
    'Foi registrada reclamação no Procon?',
    'O produto está na garantia?',
    'Houve propaganda enganosa?',
    'O contrato possui cláusulas abusivas?',
  ],
  familia: [
    'Há filhos menores do casal?',
    'O regime de bens é qual?',
    'Existe acordo sobre guarda dos filhos?',
    'Há bens a serem partilhados?',
    'O cônjuge/companheiro contribui com alimentos?',
    'Há medida protetiva em vigor?',
    'Quanto tempo durou a união/casamento?',
    'Há necessidade de alimentos provisórios?',
  ],
  empresarial: [
    'Qual o tipo societário da empresa?',
    'Existe contrato social atualizado?',
    'Há conflito entre sócios?',
    'A empresa está em recuperação judicial?',
    'Existem dívidas trabalhistas ou tributárias?',
    'Há marca registrada?',
    'Foram cumpridas obrigações estatutárias?',
  ],
  previdenciario: [
    'Qual o benefício previdenciário pretendido?',
    'O segurado manteve qualidade de segurado?',
    'Há períodos de contribuição a comprovar?',
    'O requerimento administrativo foi indeferido?',
    'O segurado possui CNIS atualizado?',
    'Há atividade especial a ser reconhecida?',
    'O segurado está incapacitado para o trabalho?',
    'Há laudo médico atualizado?',
  ],
  ambiental: [
    'Qual o tipo de dano ambiental?',
    'Houve autuação pelo IBAMA ou órgão estadual?',
    'O empreendimento possui licença ambiental?',
    'Há TAC (Termo de Ajustamento de Conduta)?',
    'A área é de preservação permanente?',
    'Qual a extensão do dano?',
  ],
  digital: [
    'Qual plataforma digital está envolvida?',
    'Houve vazamento de dados pessoais?',
    'Há evidências digitais preservadas?',
    'O fato envolve LGPD?',
    'Houve remoção de conteúdo solicitada?',
    'O contrato digital possui termos de uso?',
    'Há registro de telas (screenshots)?',
  ],
};

// ─── Key Information Checklist per Area ─────────────────────────────────────

const REQUIRED_INFO: Record<LegalArea, { keyword: string; label: string }[]> = {
  civil: [
    { keyword: 'data|quando|dia|mês|ano', label: 'Data dos fatos' },
    { keyword: 'prova|documento|comprov', label: 'Provas documentais' },
    { keyword: 'valor|quantia|prejuízo|dano', label: 'Valor do dano/prejuízo' },
    { keyword: 'contrato|acordo|ajuste', label: 'Relação contratual' },
    { keyword: 'testemunha|presenci', label: 'Testemunhas' },
  ],
  trabalhista: [
    { keyword: 'admiss|contrat', label: 'Data de admissão' },
    { keyword: 'demiss|rescis|dispen', label: 'Data/tipo de demissão' },
    { keyword: 'salário|remuneração|paga', label: 'Valor do salário' },
    { keyword: 'hora extra|jornada|ponto', label: 'Jornada de trabalho' },
    { keyword: 'FGTS|fundo de garantia', label: 'Situação FGTS' },
    { keyword: 'CTPS|carteira|registro', label: 'Registro em carteira' },
  ],
  tributario: [
    { keyword: 'tribut|imposto|taxa|contribu', label: 'Tributo em discussão' },
    { keyword: 'auto de infração|autuação', label: 'Auto de infração' },
    { keyword: 'valor|montante|crédito', label: 'Valor em discussão' },
    { keyword: 'regime|simples|lucro', label: 'Regime tributário' },
  ],
  penal: [
    { keyword: 'fato|ocor|acontec', label: 'Descrição dos fatos' },
    { keyword: 'data|quando|dia', label: 'Data dos fatos' },
    { keyword: 'flagrante|pres|detenção', label: 'Situação prisional' },
    { keyword: 'testemunha|presenci', label: 'Testemunhas' },
    { keyword: 'antecedente|reincid', label: 'Antecedentes' },
  ],
  administrativo: [
    { keyword: 'órgão|entidade|admin', label: 'Órgão envolvido' },
    { keyword: 'ato|decisão|portaria', label: 'Ato administrativo' },
    { keyword: 'prazo|recurso|impugn', label: 'Prazos recursais' },
  ],
  consumidor: [
    { keyword: 'produto|serviço|compra', label: 'Produto/serviço' },
    { keyword: 'nota|comprovante|recibo', label: 'Comprovante de compra' },
    { keyword: 'defeito|vício|problem', label: 'Descrição do defeito' },
    { keyword: 'garantia|troca|devolução', label: 'Garantia' },
  ],
  familia: [
    { keyword: 'filho|criança|menor', label: 'Filhos menores' },
    { keyword: 'regime|bem|patrimôn', label: 'Regime de bens' },
    { keyword: 'guarda|visita|conviv', label: 'Guarda/visitação' },
    { keyword: 'alimento|pensão', label: 'Alimentos' },
  ],
  empresarial: [
    { keyword: 'sociedade|empresa|sócio', label: 'Tipo societário' },
    { keyword: 'contrato social|estatuto', label: 'Contrato social' },
    { keyword: 'capital|faturamento', label: 'Capital social' },
  ],
  previdenciario: [
    { keyword: 'benefício|aposentadoria|auxílio', label: 'Benefício pretendido' },
    { keyword: 'contribuição|INSS|carnê', label: 'Contribuições' },
    { keyword: 'incapacidade|laudo|médico', label: 'Condição de saúde' },
    { keyword: 'CNIS|tempo|serviço', label: 'Tempo de serviço' },
  ],
  ambiental: [
    { keyword: 'dano|poluição|desmat', label: 'Tipo de dano ambiental' },
    { keyword: 'licença|autorização', label: 'Licença ambiental' },
    { keyword: 'área|extensão|local', label: 'Localização/extensão' },
  ],
  digital: [
    { keyword: 'plataforma|site|app', label: 'Plataforma envolvida' },
    { keyword: 'dado|informação|priva', label: 'Dados afetados' },
    { keyword: 'print|screenshot|evidência', label: 'Evidências digitais' },
  ],
};

// ─── Precedent Trigger Keywords ─────────────────────────────────────────────

const PRECEDENT_TRIGGERS: Record<string, string> = {
  'dano moral': 'Pesquisar: valor de dano moral por categoria (STJ)',
  'tutela de urgência': 'Precedente: requisitos tutela urgência (art. 300 CPC)',
  'inversão do ônus': 'Precedente: inversão ônus da prova (CDC art. 6º, VIII)',
  'justa causa': 'Precedente: requisitos justa causa (CLT art. 482)',
  'rescisão indireta': 'Precedente: hipóteses rescisão indireta (CLT art. 483)',
  'prescrição': 'Verificar: prazo prescricional aplicável ao caso',
  'decadência': 'Verificar: prazo decadencial aplicável',
  'coisa julgada': 'Precedente: limites da coisa julgada (CPC art. 502-508)',
  'incompetência': 'Precedente: competência territorial/material',
  'honorários sucumbenciais': 'Precedente: fixação honorários (CPC art. 85)',
  'litigância de má-fé': 'Precedente: requisitos litigância má-fé (CPC art. 79-81)',
  'nulidade': 'Precedente: nulidades processuais (CPC art. 276-283)',
  'cerceamento de defesa': 'Precedente: cerceamento de defesa (CF art. 5º, LV)',
  'contraditório': 'Precedente: vedação à decisão surpresa (CPC arts. 9º e 10)',
};

// ─── Strategy Hints ─────────────────────────────────────────────────────────

const STRATEGY_TRIGGERS: Record<string, string> = {
  'mandado de busca': 'Estratégia: verificar cabimento de agravo de instrumento',
  'liminar concedida': 'Estratégia: avaliar pedido de suspensão de liminar',
  'sentença desfavorável': 'Estratégia: analisar cabimento de apelação/embargos',
  'acordo': 'Estratégia: avaliar proposta de acordo vs. prosseguimento',
  'audiência': 'Estratégia: preparar cliente para audiência de instrução',
  'perícia': 'Estratégia: formular quesitos para o perito',
  'arresto': 'Estratégia: verificar cabimento de impugnação à constrição',
  'penhora': 'Estratégia: avaliar impenhorabilidade (CPC art. 833)',
};

// ─── Engine Implementation ──────────────────────────────────────────────────

let suggestionCounter = 0;

function createSuggestion(
  type: SuggestionType,
  content: string,
  relevance: number,
  category: string
): Suggestion {
  suggestionCounter += 1;
  return {
    id: `sug-${Date.now()}-${suggestionCounter}`,
    type,
    content,
    relevance: Math.min(Math.max(relevance, 0), 1),
    category,
    timestamp: new Date().toISOString(),
  };
}

function analyzeForPrecedents(transcriptText: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const lower = transcriptText.toLowerCase();

  for (const [trigger, hint] of Object.entries(PRECEDENT_TRIGGERS)) {
    if (lower.includes(trigger)) {
      suggestions.push(
        createSuggestion('precedent', hint, 0.8, 'Precedente')
      );
    }
  }

  return suggestions;
}

function analyzeForStrategy(transcriptText: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const lower = transcriptText.toLowerCase();

  for (const [trigger, hint] of Object.entries(STRATEGY_TRIGGERS)) {
    if (lower.includes(trigger)) {
      suggestions.push(
        createSuggestion('strategy', hint, 0.7, 'Estratégia')
      );
    }
  }

  return suggestions;
}

function checkMissingInfo(
  transcriptText: string,
  area: LegalArea
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const required = REQUIRED_INFO[area] || [];
  const lower = transcriptText.toLowerCase();

  for (const item of required) {
    const patterns = item.keyword.split('|');
    const found = patterns.some((p) => lower.includes(p.toLowerCase()));

    if (!found) {
      suggestions.push(
        createSuggestion(
          'warning',
          `Informação pendente: ${item.label}. Pergunte ao cliente sobre este ponto.`,
          0.9,
          'Informação Faltante'
        )
      );
    }
  }

  return suggestions;
}

function suggestFollowUpQuestions(
  transcript: TranscriptEntry[],
  area: LegalArea
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const areaQuestions = AREA_QUESTIONS[area] || [];
  const transcriptText = transcript.map((e) => e.text).join(' ').toLowerCase();

  // Suggest questions not yet covered
  const uncovered = areaQuestions.filter((q) => {
    const keywords = q
      .toLowerCase()
      .replace(/[?]/g, '')
      .split(' ')
      .filter((w) => w.length > 4);
    const matchCount = keywords.filter((kw) => transcriptText.includes(kw)).length;
    return matchCount < keywords.length * 0.5;
  });

  // Return top 3 most relevant uncovered questions
  uncovered.slice(0, 3).forEach((question, index) => {
    suggestions.push(
      createSuggestion(
        'question',
        question,
        0.9 - index * 0.1,
        'Pergunta Sugerida'
      )
    );
  });

  return suggestions;
}

// ─── Public API ─────────────────────────────────────────────────────────────

export function createSuggestionEngine(): SuggestionEngine {
  return {
    analyze(transcript: TranscriptEntry[], area: LegalArea): Suggestion[] {
      if (transcript.length === 0) {
        return AREA_QUESTIONS[area]?.slice(0, 3).map((q, i) =>
          createSuggestion('question', q, 0.95 - i * 0.05, 'Pergunta Inicial')
        ) || [];
      }

      const fullText = transcript.map((e) => e.text).join(' ');
      const recentText = transcript
        .slice(-5)
        .map((e) => e.text)
        .join(' ');

      const allSuggestions: Suggestion[] = [
        ...suggestFollowUpQuestions(transcript, area),
        ...analyzeForPrecedents(recentText),
        ...analyzeForStrategy(recentText),
        ...checkMissingInfo(fullText, area),
      ];

      // Deduplicate by content similarity
      const seen = new Set<string>();
      const unique = allSuggestions.filter((s) => {
        const key = s.content.substring(0, 40).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Sort by relevance (highest first)
      unique.sort((a, b) => b.relevance - a.relevance);

      return unique.slice(0, 8);
    },

    getAreaQuestions(area: LegalArea): string[] {
      return AREA_QUESTIONS[area] || [];
    },

    getMissingInfo(transcript: TranscriptEntry[], area: LegalArea): Suggestion[] {
      const fullText = transcript.map((e) => e.text).join(' ');
      return checkMissingInfo(fullText, area);
    },
  };
}

// ─── Utility: Convert Suggestion to InterviewSuggestion ─────────────────────

export function toInterviewSuggestion(suggestion: Suggestion): InterviewSuggestion {
  return {
    id: suggestion.id,
    type: suggestion.type,
    content: suggestion.content,
    relevance: suggestion.relevance,
    timestamp: suggestion.timestamp,
    accepted: false,
  };
}
