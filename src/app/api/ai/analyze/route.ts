import { NextRequest, NextResponse } from 'next/server';
import { callAI, type TaskType } from '@/lib/ai-router';
import { getAuthUser, unauthorized } from '@/lib/api-utils';
import { withRateLimit } from '@/lib/api-rate-limit';
import { checkAIQuota, AI_QUOTA_EXCEEDED_MESSAGE } from '@/lib/ai-quota';

/**
 * POST /api/ai/analyze — analyzes a legal document with AI from a given party's
 * perspective and returns a structured analysis (entities, clauses, strategy),
 * or continues a follow-up chat when chatHistory is provided.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const rateLimitResponse = withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;


  try {
    const body = await request.json();
    const { content, fileName, polo, chatHistory } = body as {
      content: string;
      fileName: string;
      polo: 'autor' | 'reu' | 'terceiro';
      chatHistory?: { role: string; content: string }[];
    };

    if (chatHistory !== undefined) {
      const validHistory =
        Array.isArray(chatHistory) &&
        chatHistory.length > 0 &&
        chatHistory.every(
          (message) =>
            message &&
            ['user', 'assistant'].includes(message.role) &&
            typeof message.content === 'string',
        ) &&
        // Assistant-only histories become [] after the router drops leading
        // assistant turns — Anthropic rejects that, after quota was spent
        chatHistory.some((message) => message?.role === 'user');
      if (!validHistory) {
        return NextResponse.json({ error: 'Invalid chatHistory' }, { status: 400 });
      }
    } else if (
      // Type checks matter: a truthy non-string content passes a bare
      // falsiness check, burns a quota unit, then crashes at content.slice()
      typeof content !== 'string' || !content ||
      typeof fileName !== 'string' || !fileName ||
      !['autor', 'reu', 'terceiro'].includes(polo)
    ) {
      return NextResponse.json(
        { error: 'content, fileName, and polo are required' },
        { status: 400 }
      );
    }

    // Quota is reserved only after input validation — the atomic counter
    // consumes a unit, and malformed 400 requests must not burn it.
    const quota = await checkAIQuota(user.id);
    if (!quota.allowed) {
      return NextResponse.json({ error: AI_QUOTA_EXCEEDED_MESSAGE }, { status: 402 });
    }

    if (chatHistory) {
      const result = await callAI(
        chatHistory.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        'document_analysis',
        { userId: user.id }
      );

      return NextResponse.json({
        content: result.content,
        model: result.model,
        tokensUsed: result.tokensUsed,
        estimatedCost: result.estimatedCost,
        durationMs: result.durationMs,
      });
    }

    const poloLabel =
      polo === 'autor' ? 'polo ativo (Autor)' :
      polo === 'reu' ? 'polo passivo (Réu)' :
      'terceiro interessado';

    const taskType: TaskType = content.length > 10000 ? 'strategy_analysis' : 'document_analysis';

    const result = await callAI(
      [
        {
          role: 'user',
          content: `Analise este documento jurídico ("${fileName}") sob a perspectiva do ${poloLabel}.

Retorne OBRIGATORIAMENTE no formato JSON abaixo. Não inclua nenhum texto fora do JSON:

{
  "summary": "Resumo de 2-4 frases do documento analisado",
  "docType": "Tipo (Petição Inicial, Contestação, Contrato, Sentença, Acórdão, etc)",
  "legalArea": "Área do direito (Cível, Trabalhista, Tributário, etc)",
  "complexity": 7,
  "entities": [
    {"type": "party", "label": "Autor", "value": "Nome completo"},
    {"type": "party", "label": "Réu", "value": "Nome completo"},
    {"type": "lawyer", "label": "Advogado", "value": "Nome - OAB/UF"},
    {"type": "judge", "label": "Magistrado", "value": "Nome - Vara"},
    {"type": "date", "label": "Data", "value": "DD/MM/AAAA"},
    {"type": "value", "label": "Valor da Causa", "value": "R$ X.XXX,XX"},
    {"type": "law", "label": "Legislação", "value": "Artigos citados"}
  ],
  "clauses": [
    {"id": "c1", "title": "Nome da cláusula", "summary": "Resumo e implicações", "risk": "low|medium|high"}
  ],
  "strategy": {
    "recommendation": "Recomendação estratégica principal para o ${poloLabel}",
    "strengths": ["Ponto forte 1", "Ponto forte 2"],
    "weaknesses": ["Ponto fraco 1", "Ponto fraco 2"],
    "nextSteps": ["1. Primeiro passo", "2. Segundo passo"],
    "riskLevel": "low|medium|high",
    "estimatedSuccessRate": 65
  }
}

Documento (conteúdo extraído):
${content.slice(0, 50000)}`,
        },
      ],
      taskType,
      { maxTokens: 4096, temperature: 0.2, userId: user.id }
    );

    let analysis;
    try {
      const jsonMatch = result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in AI response');
      }
    } catch {
      analysis = {
        summary: result.content.slice(0, 500),
        docType: 'Documento Jurídico',
        legalArea: 'Cível',
        complexity: 5,
        entities: [],
        clauses: [],
        strategy: {
          recommendation: result.content,
          strengths: [],
          weaknesses: [],
          nextSteps: [],
          riskLevel: 'medium',
          estimatedSuccessRate: 50,
        },
      };
    }

    return NextResponse.json({
      analysis,
      model: result.model,
      complexity: result.complexity,
      tokensUsed: result.tokensUsed,
      estimatedCost: result.estimatedCost,
      durationMs: result.durationMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { error: 'AI not configured', message: 'Anthropic API key missing' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Analysis failed', message },
      { status: 500 }
    );
  }
}
