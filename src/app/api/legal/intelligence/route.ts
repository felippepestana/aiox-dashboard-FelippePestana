import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai-router';
import type {
  PrecedentSearchResponse,
  SimilarityAnalysisResponse,
  MagistrateProfile,
  IntelligenceReport,
} from '@/lib/legal-intelligence';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseJSON<T>(text: string, fallback: T): T {
  // Try to extract a JSON block from the AI response
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]) as T;
    } catch {
      // fall through
    }
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

// ─── Action Handlers ─────────────────────────────────────────────────────────

async function handleSearchPrecedents(
  query: string,
  filters?: {
    tribunal?: string;
    area?: string;
    dateRange?: { start: string; end: string };
    favorability?: string;
  },
): Promise<PrecedentSearchResponse> {
  const startTime = Date.now();

  const filterDesc = [
    filters?.tribunal ? `Tribunal: ${filters.tribunal}` : null,
    filters?.area ? `Area do Direito: ${filters.area}` : null,
    filters?.dateRange ? `Periodo: ${filters.dateRange.start} a ${filters.dateRange.end}` : null,
    filters?.favorability ? `Favorabilidade: ${filters.favorability}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const prompt = `Você é um especialista em jurisprudência brasileira. Analise a consulta jurídica abaixo e retorne precedentes relevantes dos tribunais brasileiros (STF, STJ, TST, TRFs, TJs).

CONSULTA: ${query}
${filterDesc ? `FILTROS: ${filterDesc}` : ''}

Retorne EXATAMENTE este JSON (sem texto extra, apenas o JSON):
{
  "results": [
    {
      "caseNumber": "REsp 1.234.567/SP",
      "summary": "Ementa resumida do precedente com os pontos principais da decisão",
      "relevanceScore": 95,
      "favorability": "favorable",
      "tribunal": "STJ",
      "date": "2024-08-20",
      "relator": "Min. Nancy Andrighi",
      "themes": ["tema1", "tema2"],
      "area": "civil"
    }
  ],
  "totalFound": 5,
  "queryUsed": "${query.substring(0, 100)}"
}

Gere 5 a 8 precedentes realistas e relevantes para a consulta. Use casos e ministros/desembargadores reais do direito brasileiro. O campo "favorability" deve ser "favorable", "unfavorable" ou "neutral" baseado no resultado para o autor. O "relevanceScore" é de 0 a 100.`;

  const aiResult = await callAI(
    [{ role: 'user', content: prompt }],
    'precedent_search',
    { maxTokens: 4096, temperature: 0.2 },
  );

  const parsed = parseJSON<PrecedentSearchResponse>(aiResult.content, {
    results: [],
    totalFound: 0,
    queryUsed: query,
    processingMs: 0,
  });

  return {
    ...parsed,
    processingMs: Date.now() - startTime,
  };
}

async function handleSimilarity(
  description: string,
  cases?: string[],
  area?: string,
  tribunal?: string,
): Promise<SimilarityAnalysisResponse> {
  const startTime = Date.now();

  const contextDesc = [
    area ? `Área do direito: ${area}` : null,
    tribunal ? `Tribunal: ${tribunal}` : null,
    cases && cases.length > 0 ? `Casos alvo: ${cases.join(', ')}` : null,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = `Você é um especialista em análise de similaridade de casos jurídicos brasileiros (metodologia PEDRO/CNJ).

DESCRIÇÃO DO PROCESSO:
${description}
${contextDesc ? `\nCONTEXTO:\n${contextDesc}` : ''}

Encontre casos similares na jurisprudência brasileira e retorne EXATAMENTE este JSON:
{
  "description": "Resumo da situação analisada",
  "results": [
    {
      "caseNumber": "REsp 1.234.567/SP",
      "tribunal": "STJ",
      "similarityScore": 87,
      "matchingFactors": ["fator1 de similaridade", "fator2 de similaridade"],
      "keyDifferences": ["diferença relevante 1"],
      "outcome": "Procedente - condenação em R$ 15.000,00",
      "date": "2024-06-15",
      "summary": "Resumo do caso similar"
    }
  ],
  "overallSimilarityInsight": "Análise geral da similaridade dos casos encontrados",
  "recommendation": "Recomendação estratégica baseada nos casos similares"
}

Retorne 4 a 6 casos similares realistas. O "similarityScore" é de 0 a 100. Identifique fatores de similaridade e diferenças relevantes.`;

  const aiResult = await callAI(
    [{ role: 'user', content: prompt }],
    'precedent_search',
    { maxTokens: 4096, temperature: 0.2 },
  );

  const parsed = parseJSON<SimilarityAnalysisResponse>(aiResult.content, {
    description,
    results: [],
    overallSimilarityInsight: 'Análise não disponível',
    recommendation: 'Consulte um especialista',
    processingMs: 0,
  });

  return {
    ...parsed,
    processingMs: Date.now() - startTime,
  };
}

async function handleProfileMagistrate(
  judge: string,
  tribunal?: string,
): Promise<MagistrateProfile> {
  const prompt = `Você é um especialista em análise de perfil de magistrados brasileiros.

MAGISTRADO: ${judge}
${tribunal ? `TRIBUNAL: ${tribunal}` : ''}

Com base no histórico decisório deste magistrado, construa um perfil detalhado e retorne EXATAMENTE este JSON:
{
  "name": "${judge}",
  "tribunal": "${tribunal || 'Tribunal identificado'}",
  "vara": "Vara ou Câmara de atuação",
  "position": "Desembargador/Ministro/Juiz Federal",
  "averageDecisionTimeDays": 180,
  "totalDecisions": 3500,
  "overallFavorabilityRate": 62,
  "sentimentScore": 72,
  "tendencies": [
    {
      "area": "Civil",
      "favorableRate": 65,
      "totalDecisions": 1200,
      "commonPatterns": ["padrão decisório 1", "padrão decisório 2"]
    }
  ],
  "notableDecisions": [
    {
      "caseNumber": "Número do processo",
      "date": "2024-06-15",
      "area": "Civil",
      "summary": "Resumo da decisão notable",
      "outcome": "Procedente"
    }
  ],
  "strategicRecommendations": [
    "Recomendação estratégica 1 para litigar com este magistrado",
    "Recomendação estratégica 2"
  ],
  "keyTopics": ["tema1", "tema2", "tema3"]
}

Use dados realistas baseados no perfil público do magistrado. O "sentimentScore" é de 0 a 100 (100 = muito favorável ao autor). Inclua 3 a 5 tendências por área, 3 decisões notáveis e 4 a 6 recomendações estratégicas.`;

  const aiResult = await callAI(
    [{ role: 'user', content: prompt }],
    'strategy_analysis',
    { maxTokens: 4096, temperature: 0.2 },
  );

  const fallback: MagistrateProfile = {
    name: judge,
    tribunal: tribunal || 'Não identificado',
    position: 'Magistrado',
    averageDecisionTimeDays: 180,
    totalDecisions: 0,
    overallFavorabilityRate: 50,
    sentimentScore: 50,
    tendencies: [],
    notableDecisions: [],
    strategicRecommendations: ['Análise indisponível. Consulte fontes primárias.'],
    keyTopics: [],
  };

  return parseJSON<MagistrateProfile>(aiResult.content, fallback);
}

async function handleReport(processId: string): Promise<IntelligenceReport> {
  const prompt = `Você é um especialista em inteligência jurídica estratégica.

PROCESSO ID: ${processId}

Gere um relatório de inteligência jurídica completo para este processo e retorne EXATAMENTE este JSON:
{
  "processId": "${processId}",
  "generatedAt": "${new Date().toISOString()}",
  "overallRiskScore": 35,
  "summary": "Resumo executivo do relatório de inteligência jurídica",
  "recommendations": [
    "Recomendação estratégica 1",
    "Recomendação estratégica 2",
    "Recomendação estratégica 3"
  ],
  "precedents": [
    {
      "caseNumber": "REsp 1.234.567/SP",
      "summary": "Resumo do precedente",
      "relevanceScore": 87,
      "favorability": "favorable",
      "tribunal": "STJ",
      "date": "2024-08-20",
      "relator": "Min. Nancy Andrighi",
      "themes": ["tema1"],
      "area": "civil"
    }
  ],
  "similarCases": [
    {
      "caseNumber": "Número",
      "tribunal": "TJSP",
      "similarityScore": 82,
      "matchingFactors": ["fator1"],
      "keyDifferences": ["diferença1"],
      "outcome": "Procedente",
      "date": "2024-05-10",
      "summary": "Resumo"
    }
  ]
}

O "overallRiskScore" é de 0 a 100 (0 = baixo risco/alta chance de êxito, 100 = alto risco). Inclua 3 precedentes relevantes, 3 casos similares e 4 recomendações estratégicas.`;

  const aiResult = await callAI(
    [{ role: 'user', content: prompt }],
    'strategy_analysis',
    { maxTokens: 6144, temperature: 0.2 },
  );

  const fallback: IntelligenceReport = {
    processId,
    generatedAt: new Date().toISOString(),
    precedents: [],
    similarCases: [],
    overallRiskScore: 50,
    recommendations: ['Relatório indisponível. Verifique a configuração da IA.'],
    summary: 'Relatório não gerado.',
  };

  return parseJSON<IntelligenceReport>(aiResult.content, fallback);
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body as { action: string };

    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    switch (action) {
      case 'search-precedents': {
        const { query, filters } = body as {
          query: string;
          filters?: {
            tribunal?: string;
            area?: string;
            dateRange?: { start: string; end: string };
            favorability?: string;
          };
        };
        if (!query) {
          return NextResponse.json({ error: 'query is required for search-precedents' }, { status: 400 });
        }
        const result = await handleSearchPrecedents(query, filters);
        return NextResponse.json(result);
      }

      case 'similarity': {
        const { description, cases, area, tribunal } = body as {
          description: string;
          cases?: string[];
          area?: string;
          tribunal?: string;
        };
        if (!description) {
          return NextResponse.json({ error: 'description is required for similarity' }, { status: 400 });
        }
        const result = await handleSimilarity(description, cases, area, tribunal);
        return NextResponse.json(result);
      }

      case 'profile-magistrate': {
        const { judge, tribunal } = body as { judge: string; tribunal?: string };
        if (!judge) {
          return NextResponse.json({ error: 'judge is required for profile-magistrate' }, { status: 400 });
        }
        const result = await handleProfileMagistrate(judge, tribunal);
        return NextResponse.json(result);
      }

      case 'report': {
        const { processId } = body as { processId: string };
        if (!processId) {
          return NextResponse.json({ error: 'processId is required for report' }, { status: 400 });
        }
        const result = await handleReport(processId);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 },
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('OPENROUTER_API_KEY')) {
      return NextResponse.json(
        { error: 'AI not configured', message: 'OpenRouter API key missing from .env' },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: 'Intelligence request failed', message },
      { status: 500 },
    );
  }
}
