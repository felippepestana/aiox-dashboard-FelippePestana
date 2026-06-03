import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  searchPrecedents,
  analyzeSimilarity,
  profileMagistrate,
  generateIntelligenceReport,
  type Favorability,
  type PrecedentFilters,
  type PrecedentResult,
  type PrecedentSearchResponse,
  type SimilarityFilters,
  type SimilarCaseResult,
  type SimilarityAnalysisResponse,
  type MagistrateTendency,
  type NotableDecision,
  type MagistrateProfile,
  type IntelligenceReportOptions,
  type IntelligenceReport,
} from '@/lib/legal-intelligence';

// ─── fetch mock ───────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.restoreAllMocks();
});

function mockFetch(payload: unknown, ok = true) {
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: vi.fn().mockResolvedValue(payload),
  } as unknown as Response);
}

// ─── Type structure ───────────────────────────────────────────────────────────

describe('legal-intelligence — types', () => {
  describe('Favorability', () => {
    it('accepts the three valid string values', () => {
      const values: Favorability[] = ['favorable', 'unfavorable', 'neutral'];
      expect(new Set(values).size).toBe(3);
    });
  });

  describe('PrecedentFilters interface', () => {
    it('all fields are optional', () => {
      const f: PrecedentFilters = {};
      expect(f).toBeDefined();
    });

    it('accepts all known filter fields', () => {
      const f: PrecedentFilters = {
        tribunal: 'TJSP',
        area: 'civil',
        dateRange: { start: '2024-01-01', end: '2024-12-31' },
        favorability: 'favorable',
      };
      expect(f.tribunal).toBe('TJSP');
      expect(f.favorability).toBe('favorable');
    });
  });

  describe('PrecedentResult interface', () => {
    it('has all required fields', () => {
      const r: PrecedentResult = {
        caseNumber: '0001234-56.2024.8.26.0100',
        summary: 'Ação de indenização',
        relevanceScore: 90,
        favorability: 'favorable',
        tribunal: 'TJSP',
        date: '2024-03-15',
        relator: 'Des. João Silva',
        themes: ['responsabilidade civil', 'dano moral'],
        area: 'civil',
      };
      expect(r.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(r.relevanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('PrecedentSearchResponse interface', () => {
    it('has results, totalFound, queryUsed, processingMs fields', () => {
      const resp: PrecedentSearchResponse = {
        results: [],
        totalFound: 0,
        queryUsed: 'test query',
        processingMs: 123,
      };
      expect(resp).toHaveProperty('results');
      expect(resp).toHaveProperty('totalFound');
      expect(resp).toHaveProperty('queryUsed');
      expect(resp).toHaveProperty('processingMs');
    });
  });

  describe('SimilarityFilters interface', () => {
    it('all fields are optional', () => {
      const f: SimilarityFilters = {};
      expect(f).toBeDefined();
    });

    it('accepts targetCases, area, tribunal', () => {
      const f: SimilarityFilters = {
        targetCases: ['0001234-56.2024.8.26.0100'],
        area: 'trabalhista',
        tribunal: 'TRT2',
      };
      expect(f.targetCases).toHaveLength(1);
    });
  });

  describe('SimilarCaseResult interface', () => {
    it('has all required fields', () => {
      const r: SimilarCaseResult = {
        caseNumber: '1234',
        tribunal: 'TST',
        similarityScore: 75,
        matchingFactors: ['demissão sem justa causa'],
        keyDifferences: ['valor do pedido diferente'],
        outcome: 'procedente',
        date: '2023-05-01',
        summary: 'Reclamação trabalhista',
      };
      expect(r.similarityScore).toBeLessThanOrEqual(100);
    });
  });

  describe('SimilarityAnalysisResponse interface', () => {
    it('has description, results, overallSimilarityInsight, recommendation, processingMs', () => {
      const resp: SimilarityAnalysisResponse = {
        description: 'desc',
        results: [],
        overallSimilarityInsight: 'insight',
        recommendation: 'recommended action',
        processingMs: 50,
      };
      expect(resp).toHaveProperty('recommendation');
    });
  });

  describe('MagistrateTendency interface', () => {
    it('has area, favorableRate, totalDecisions, commonPatterns', () => {
      const t: MagistrateTendency = {
        area: 'previdenciário',
        favorableRate: 65,
        totalDecisions: 200,
        commonPatterns: ['segurados idosos', 'benefício por incapacidade'],
      };
      expect(t.favorableRate).toBeLessThanOrEqual(100);
    });
  });

  describe('NotableDecision interface', () => {
    it('has all required fields', () => {
      const d: NotableDecision = {
        caseNumber: '9876',
        date: '2022-11-01',
        area: 'civil',
        summary: 'Important ruling',
        outcome: 'parcialmente procedente',
      };
      expect(d).toHaveProperty('caseNumber');
      expect(d).toHaveProperty('date');
    });
  });

  describe('MagistrateProfile interface', () => {
    it('has all required fields', () => {
      const profile: MagistrateProfile = {
        name: 'Des. Maria Santos',
        tribunal: 'TJSP',
        position: 'Desembargadora',
        averageDecisionTimeDays: 45,
        totalDecisions: 500,
        overallFavorabilityRate: 60,
        tendencies: [],
        notableDecisions: [],
        strategicRecommendations: ['focar em documentação'],
        sentimentScore: 70,
        keyTopics: ['dano moral', 'contratos'],
      };
      expect(profile.overallFavorabilityRate).toBeLessThanOrEqual(100);
      expect(profile.vara).toBeUndefined();
    });

    it('vara is optional', () => {
      const profile: MagistrateProfile = {
        name: 'Juiz Teste',
        tribunal: 'TJSP',
        vara: '5ª Vara Cível',
        position: 'Juiz de Direito',
        averageDecisionTimeDays: 30,
        totalDecisions: 100,
        overallFavorabilityRate: 55,
        tendencies: [],
        notableDecisions: [],
        strategicRecommendations: [],
        sentimentScore: 60,
        keyTopics: [],
      };
      expect(profile.vara).toBe('5ª Vara Cível');
    });
  });

  describe('IntelligenceReportOptions interface', () => {
    it('all fields are optional booleans', () => {
      const opts: IntelligenceReportOptions = {};
      expect(opts).toBeDefined();

      const full: IntelligenceReportOptions = {
        includesSimilarity: true,
        includesMagistrateProfile: false,
        includesPrecedents: true,
      };
      expect(full.includesSimilarity).toBe(true);
    });
  });

  describe('IntelligenceReport interface', () => {
    it('has all required fields', () => {
      const report: IntelligenceReport = {
        processId: 'proc-1',
        generatedAt: new Date().toISOString(),
        precedents: [],
        similarCases: [],
        overallRiskScore: 40,
        recommendations: ['prepare documentation'],
        summary: 'Low risk',
      };
      expect(report).toHaveProperty('processId');
      expect(report).toHaveProperty('precedents');
      expect(report).toHaveProperty('similarCases');
      expect(report.overallRiskScore).toBeLessThanOrEqual(100);
    });

    it('magistrateProfile is optional', () => {
      const report: IntelligenceReport = {
        processId: 'proc-2',
        generatedAt: new Date().toISOString(),
        precedents: [],
        similarCases: [],
        overallRiskScore: 50,
        recommendations: [],
        summary: '',
      };
      expect(report.magistrateProfile).toBeUndefined();
    });
  });
});

// ─── Function exports ─────────────────────────────────────────────────────────

describe('legal-intelligence — function exports', () => {
  it('searchPrecedents is exported as a function', () => {
    expect(typeof searchPrecedents).toBe('function');
  });

  it('analyzeSimilarity is exported as a function', () => {
    expect(typeof analyzeSimilarity).toBe('function');
  });

  it('profileMagistrate is exported as a function', () => {
    expect(typeof profileMagistrate).toBe('function');
  });

  it('generateIntelligenceReport is exported as a function', () => {
    expect(typeof generateIntelligenceReport).toBe('function');
  });
});

// ─── searchPrecedents ─────────────────────────────────────────────────────────

describe('legal-intelligence — searchPrecedents', () => {
  it('returns a Promise', () => {
    mockFetch({ results: [], totalFound: 0, queryUsed: 'test', processingMs: 1 });
    const result = searchPrecedents('dano moral');
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  it('accepts query string only', async () => {
    const mockResponse: PrecedentSearchResponse = {
      results: [],
      totalFound: 0,
      queryUsed: 'dano moral',
      processingMs: 42,
    };
    mockFetch(mockResponse);
    const resp = await searchPrecedents('dano moral');
    expect(resp.queryUsed).toBe('dano moral');
  });

  it('accepts optional filters', async () => {
    const mockResponse: PrecedentSearchResponse = {
      results: [],
      totalFound: 0,
      queryUsed: 'query',
      processingMs: 10,
    };
    mockFetch(mockResponse);
    const resp = await searchPrecedents('query', {
      tribunal: 'TJSP',
      area: 'civil',
      favorability: 'favorable',
    });
    expect(resp).toHaveProperty('results');
  });

  it('sends POST request to /api/legal/intelligence', async () => {
    mockFetch({ results: [], totalFound: 0, queryUsed: 'q', processingMs: 1 });
    await searchPrecedents('q');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/legal/intelligence',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('throws when API response is not ok', async () => {
    mockFetch({ error: 'Internal error', message: 'Server failure' }, false);
    await expect(searchPrecedents('error query')).rejects.toThrow();
  });
});

// ─── analyzeSimilarity ────────────────────────────────────────────────────────

describe('legal-intelligence — analyzeSimilarity', () => {
  it('returns a Promise', () => {
    mockFetch({ description: '', results: [], overallSimilarityInsight: '', recommendation: '', processingMs: 1 });
    const result = analyzeSimilarity('process description');
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  it('accepts description and optional filters', async () => {
    const mockResponse: SimilarityAnalysisResponse = {
      description: 'process description',
      results: [],
      overallSimilarityInsight: 'insight',
      recommendation: 'recommendation',
      processingMs: 20,
    };
    mockFetch(mockResponse);
    const resp = await analyzeSimilarity('process description', { area: 'trabalhista' });
    expect(resp.recommendation).toBe('recommendation');
  });

  it('sends action=similarity in the request body', async () => {
    mockFetch({ description: '', results: [], overallSimilarityInsight: '', recommendation: '', processingMs: 1 });
    await analyzeSimilarity('desc');
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.action).toBe('similarity');
  });
});

// ─── profileMagistrate ────────────────────────────────────────────────────────

describe('legal-intelligence — profileMagistrate', () => {
  it('returns a Promise', () => {
    mockFetch({
      name: 'Judge', tribunal: 'TJSP', position: 'Judge',
      averageDecisionTimeDays: 30, totalDecisions: 100,
      overallFavorabilityRate: 60, tendencies: [], notableDecisions: [],
      strategicRecommendations: [], sentimentScore: 50, keyTopics: [],
    });
    const result = profileMagistrate('Judge Name');
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  it('accepts judgeName only', async () => {
    const profile: MagistrateProfile = {
      name: 'Des. Test', tribunal: 'TJSP', position: 'Des.',
      averageDecisionTimeDays: 20, totalDecisions: 50,
      overallFavorabilityRate: 70, tendencies: [], notableDecisions: [],
      strategicRecommendations: [], sentimentScore: 65, keyTopics: [],
    };
    mockFetch(profile);
    const resp = await profileMagistrate('Des. Test');
    expect(resp.name).toBe('Des. Test');
  });

  it('accepts optional tribunal parameter', async () => {
    mockFetch({
      name: 'J', tribunal: 'TJSP', position: 'J',
      averageDecisionTimeDays: 10, totalDecisions: 10,
      overallFavorabilityRate: 50, tendencies: [], notableDecisions: [],
      strategicRecommendations: [], sentimentScore: 50, keyTopics: [],
    });
    await profileMagistrate('J', 'TJSP');
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.tribunal).toBe('TJSP');
  });

  it('sends action=profile-magistrate in the request body', async () => {
    mockFetch({
      name: 'J', tribunal: 'TJSP', position: 'J',
      averageDecisionTimeDays: 10, totalDecisions: 10,
      overallFavorabilityRate: 50, tendencies: [], notableDecisions: [],
      strategicRecommendations: [], sentimentScore: 50, keyTopics: [],
    });
    await profileMagistrate('J');
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.action).toBe('profile-magistrate');
  });
});

// ─── generateIntelligenceReport ───────────────────────────────────────────────

describe('legal-intelligence — generateIntelligenceReport', () => {
  it('returns a Promise', () => {
    mockFetch({
      processId: 'p1', generatedAt: new Date().toISOString(),
      precedents: [], similarCases: [],
      overallRiskScore: 30, recommendations: [], summary: '',
    });
    const result = generateIntelligenceReport('proc-1');
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  it('accepts processId and optional options', async () => {
    const report: IntelligenceReport = {
      processId: 'proc-1',
      generatedAt: new Date().toISOString(),
      precedents: [],
      similarCases: [],
      overallRiskScore: 25,
      recommendations: ['action 1'],
      summary: 'summary',
    };
    mockFetch(report);
    const resp = await generateIntelligenceReport('proc-1', {
      includesPrecedents: true,
      includesSimilarity: true,
      includesMagistrateProfile: false,
    });
    expect(resp.processId).toBe('proc-1');
  });

  it('sends action=report in the request body', async () => {
    mockFetch({
      processId: 'p', generatedAt: '', precedents: [], similarCases: [],
      overallRiskScore: 0, recommendations: [], summary: '',
    });
    await generateIntelligenceReport('p');
    const call = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse(call[1].body);
    expect(body.action).toBe('report');
    expect(body.processId).toBe('p');
  });

  it('throws when API returns error status', async () => {
    mockFetch({ message: 'error' }, false);
    await expect(generateIntelligenceReport('proc-fail')).rejects.toThrow();
  });
});
