/**
 * AI Router — Intelligent LLM routing via OpenRouter
 *
 * Analyzes task complexity and routes to the cheapest capable model:
 * - Simple (quick lookup, format): claude-haiku (~$0.001)
 * - Medium (analysis, drafting): claude-sonnet (~$0.01)
 * - Complex (deep strategy, full petition): claude-opus or gpt-4o (~$0.05)
 */

import { trackAIUsage } from './ai-usage';

export type TaskComplexity = 'simple' | 'medium' | 'complex';

export type TaskType =
  | 'chat_response'
  | 'document_analysis'
  | 'petition_generation'
  | 'strategy_analysis'
  | 'clause_review'
  | 'precedent_search'
  | 'deadline_calculation'
  | 'summary';

interface ModelConfig {
  id: string;
  name: string;
  costPer1kTokens: number;
  maxTokens: number;
  supportsVision: boolean;
}

const MODELS: Record<TaskComplexity, ModelConfig> = {
  simple: {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude Haiku',
    costPer1kTokens: 0.001,
    maxTokens: 8192,
    supportsVision: false,
  },
  medium: {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet',
    costPer1kTokens: 0.003,
    maxTokens: 16384,
    supportsVision: true,
  },
  complex: {
    id: 'anthropic/claude-opus-4',
    name: 'Claude Opus',
    costPer1kTokens: 0.015,
    maxTokens: 32768,
    supportsVision: true,
  },
};

const TASK_COMPLEXITY_MAP: Record<TaskType, TaskComplexity> = {
  chat_response: 'simple',
  deadline_calculation: 'simple',
  summary: 'simple',
  precedent_search: 'medium',
  clause_review: 'medium',
  document_analysis: 'medium',
  petition_generation: 'complex',
  strategy_analysis: 'complex',
};

export function classifyComplexity(taskType: TaskType, inputLength: number): TaskComplexity {
  const baseComplexity = TASK_COMPLEXITY_MAP[taskType];

  if (inputLength > 10000 && baseComplexity === 'simple') return 'medium';
  if (inputLength > 30000 && baseComplexity === 'medium') return 'complex';

  return baseComplexity;
}

export function getModelForTask(taskType: TaskType, inputLength: number = 0): ModelConfig {
  const complexity = classifyComplexity(taskType, inputLength);
  return MODELS[complexity];
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  content: string;
  model: string;
  complexity: TaskComplexity;
  tokensUsed: number;
  estimatedCost: number;
  durationMs: number;
}

const LEGAL_SYSTEM_PROMPT = `Você é um assistente jurídico especializado em direito brasileiro. Responda sempre em português brasileiro, com fundamentação legal precisa (artigos, leis, jurisprudência). Seja objetivo e prático. Quando relevante, cite:
- Dispositivos legais (CPC, CC, CLT, CDC, CF/88)
- Jurisprudência do STF e STJ (súmulas, temas repetitivos)
- Prazos processuais aplicáveis
- Recomendações práticas para o advogado`;

export function getSystemPrompt(taskType: TaskType): string {
  const baseContext = `Você é o APEX, assistente jurídico especializado em direito brasileiro, desenvolvido para escritórios de advocacia.`;

  const prompts: Record<string, string> = {
    chat_response: `${baseContext}
Responda de forma clara e objetiva em português brasileiro.
Sempre fundamente com: artigos de lei (CPC, CC, CLT, CDC, CF/88), jurisprudência (STF, STJ, TST), súmulas e OJs.
Quando relevante, mencione prazos processuais e consequências práticas.
Se não tiver certeza, informe e sugira consultar a legislação específica.`,

    document_analysis: `${baseContext}
Você está analisando um documento jurídico. Extraia e organize:
1. TIPO DO DOCUMENTO e área do direito
2. PARTES ENVOLVIDAS (autor, réu, terceiros, advogados, juiz)
3. FATOS RELEVANTES resumidos
4. QUESTÕES JURÍDICAS identificadas
5. LEGISLAÇÃO APLICÁVEL (artigos específicos)
6. RISCOS E OPORTUNIDADES para cada polo
7. CLÁUSULAS CRÍTICAS (se contrato)
8. RECOMENDAÇÕES ESTRATÉGICAS com prazos
Seja preciso e objetivo. Use formatação com títulos e listas.`,

    petition_generation: `${baseContext}
Você está gerando uma petição jurídica. Siga rigorosamente:
1. Endereçamento correto ao juízo competente
2. Qualificação completa das partes
3. Fundamentação fática detalhada
4. Fundamentação jurídica com citação precisa de artigos, jurisprudência e doutrina
5. Pedidos claros, específicos e quantificados quando aplicável
6. Valor da causa quando necessário
7. Requerimentos finais (citação, produção de provas, etc.)
Use linguagem forense adequada. Cite jurisprudência real (STF, STJ) quando possível.
Formate com seções numeradas e parágrafos bem estruturados.`,

    strategy_analysis: `${baseContext}
Você está realizando uma análise estratégica jurídica. Considere:
1. PONTOS FORTES da posição jurídica
2. PONTOS FRACOS e vulnerabilidades
3. JURISPRUDÊNCIA RELEVANTE (tendência dos tribunais)
4. RISCOS identificados com probabilidade estimada
5. ESTRATÉGIAS RECOMENDADAS em ordem de prioridade
6. PRÓXIMOS PASSOS com cronograma sugerido
7. CUSTO-BENEFÍCIO de cada estratégia
Seja analítico e prático. Forneça recomendações acionáveis.`,

    precedent_search: `${baseContext}
Você está pesquisando precedentes jurídicos. Para cada precedente relevante, forneça:
1. Tribunal e número do processo/recurso
2. Relator
3. Data do julgamento
4. Ementa resumida
5. Tese jurídica firmada
6. Aplicabilidade ao caso em análise
Organize por relevância. Priorize: STF > STJ > TRFs/TJs.`,

    clause_review: `${baseContext}
Você está revisando cláusulas contratuais. Para cada cláusula relevante:
1. IDENTIFICAÇÃO (número e título)
2. CLASSIFICAÇÃO DE RISCO (alto/médio/baixo)
3. ANÁLISE da validade e eficácia
4. CONFORMIDADE com legislação vigente (CDC, CC, CLT)
5. CLÁUSULAS ABUSIVAS identificadas (se houver)
6. SUGESTÃO DE REDAÇÃO alternativa quando necessário
Seja minucioso. Destaque cláusulas que podem ser questionadas judicialmente.`,
  };

  return prompts[taskType] ?? prompts.chat_response;
}

export async function callAI(
  messages: AIMessage[],
  taskType: TaskType = 'chat_response',
  options?: { maxTokens?: number; temperature?: number; userId?: string }
): Promise<AIResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured. Add it to .env file.');
  }

  const inputLength = messages.reduce((sum, m) => sum + m.content.length, 0);
  const model = getModelForTask(taskType, inputLength);
  const complexity = classifyComplexity(taskType, inputLength);

  const allMessages: AIMessage[] = [
    { role: 'system', content: LEGAL_SYSTEM_PROMPT },
    ...messages,
  ];

  const startTime = Date.now();

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'APEX Legal Performance',
    },
    body: JSON.stringify({
      model: model.id,
      messages: allMessages,
      max_tokens: options?.maxTokens || model.maxTokens,
      temperature: options?.temperature ?? 0.3,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  const durationMs = Date.now() - startTime;

  const content = data.choices?.[0]?.message?.content || '';
  const tokensUsed = (data.usage?.prompt_tokens || 0) + (data.usage?.completion_tokens || 0);
  const estimatedCost = (tokensUsed / 1000) * model.costPer1kTokens;

  // Fire-and-forget usage tracking (non-blocking)
  trackAIUsage({
    user_id: options?.userId || 'anonymous',
    task_type: taskType,
    model: model.name,
    complexity,
    tokens_used: tokensUsed,
    cost_usd: estimatedCost,
    duration_ms: durationMs,
  }).catch(() => {}); // Swallow errors

  return {
    content,
    model: model.name,
    complexity,
    tokensUsed,
    estimatedCost,
    durationMs,
  };
}

export async function callAIStream(
  messages: AIMessage[],
  taskType: TaskType = 'chat_response',
  options?: { maxTokens?: number; temperature?: number }
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

  const complexity = classifyComplexity(taskType, messages.map(m => m.content).join('').length);
  const model = MODELS[complexity];

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://legalperformance.app',
      'X-Title': 'APEX Legal Performance',
    },
    body: JSON.stringify({
      model: model.id,
      messages: [
        { role: 'system', content: getSystemPrompt(taskType) },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      max_tokens: options?.maxTokens || model.maxTokens,
      temperature: options?.temperature ?? 0.3,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`AI API error: ${response.status}`);
  }

  return response.body;
}

export async function analyzePDF(
  base64Content: string,
  fileName: string,
  polo: 'autor' | 'reu' | 'terceiro',
  taskType: TaskType = 'document_analysis'
): Promise<AIResponse> {
  const poloLabel = polo === 'autor' ? 'polo ativo (Autor)' : polo === 'reu' ? 'polo passivo (Réu)' : 'terceiro interessado';

  return callAI([
    {
      role: 'user',
      content: `Analise este documento jurídico ("${fileName}") sob a perspectiva do ${poloLabel}.

Forneça:
1. RESUMO do documento (tipo, partes, objeto, valor)
2. ENTIDADES (partes, advogados, juiz, datas, valores, leis citadas)
3. CLASSIFICAÇÃO (tipo de documento, área do direito, complexidade 1-10)
4. ANÁLISE DE CLÁUSULAS (se contrato: liste cada cláusula com nível de risco)
5. ESTRATÉGIA PROCESSUAL personalizada para o ${poloLabel}:
   - Pontos fortes e fracos
   - Probabilidade estimada de êxito (%)
   - Próximos passos recomendados
6. JURISPRUDÊNCIA relevante (STF/STJ)

Documento (conteúdo extraído):
${base64Content.slice(0, 50000)}`,
    },
  ], taskType, { maxTokens: 4096 });
}

export async function generatePetition(
  area: string,
  type: string,
  facts: string,
  arguments_: string,
  requests: string,
  court: string
): Promise<AIResponse> {
  return callAI([
    {
      role: 'user',
      content: `Elabore uma ${type} na área de ${area} para o ${court}.

FATOS:
${facts}

ARGUMENTOS JURÍDICOS:
${arguments_}

PEDIDOS:
${requests}

A peça deve conter:
- Endereçamento correto
- Qualificação das partes
- Fundamentação legal com artigos específicos
- Jurisprudência do STJ/STF quando aplicável
- Pedidos claros e determinados
- Formatação profissional`,
    },
  ], 'petition_generation', { maxTokens: 8192, temperature: 0.2 });
}
