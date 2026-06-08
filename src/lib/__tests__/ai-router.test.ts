import { describe, expect, it, vi } from 'vitest';
import {
  classifyComplexity,
  getModelForTask,
  getSystemPrompt,
  type TaskType,
} from '@/lib/ai-router';

// ai-router imports ai-usage which imports supabase — mock both to avoid
// the "supabaseUrl is required" error that occurs at module-load time.
vi.mock('@/lib/supabase', () => ({
  supabase: {},
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
  })),
  createBrowserClient: vi.fn(),
}));

vi.mock('@/lib/ai-usage', () => ({
  trackAIUsage: vi.fn().mockResolvedValue(undefined),
}));

// ─── classifyComplexity ───────────────────────────────────────────────────────

describe('classifyComplexity', () => {
  describe('base complexity from task type', () => {
    it('chat_response → simple', () => {
      expect(classifyComplexity('chat_response', 0)).toBe('simple');
    });

    it('deadline_calculation → simple', () => {
      expect(classifyComplexity('deadline_calculation', 0)).toBe('simple');
    });

    it('summary → simple', () => {
      expect(classifyComplexity('summary', 0)).toBe('simple');
    });

    it('precedent_search → medium', () => {
      expect(classifyComplexity('precedent_search', 0)).toBe('medium');
    });

    it('clause_review → medium', () => {
      expect(classifyComplexity('clause_review', 0)).toBe('medium');
    });

    it('document_analysis → medium', () => {
      expect(classifyComplexity('document_analysis', 0)).toBe('medium');
    });

    it('petition_generation → complex', () => {
      expect(classifyComplexity('petition_generation', 0)).toBe('complex');
    });

    it('strategy_analysis → complex', () => {
      expect(classifyComplexity('strategy_analysis', 0)).toBe('complex');
    });
  });

  describe('upgrading simple → medium at >10k chars', () => {
    it('simple task at exactly 10000 chars stays simple', () => {
      expect(classifyComplexity('chat_response', 10000)).toBe('simple');
    });

    it('simple task at 10001 chars upgrades to medium', () => {
      expect(classifyComplexity('chat_response', 10001)).toBe('medium');
    });

    it('simple task at 50000 chars upgrades to medium (not complex)', () => {
      // simple base never gets upgraded straight to complex
      expect(classifyComplexity('chat_response', 50000)).toBe('medium');
    });
  });

  describe('upgrading medium → complex at >30k chars', () => {
    it('medium task at exactly 30000 chars stays medium', () => {
      expect(classifyComplexity('document_analysis', 30000)).toBe('medium');
    });

    it('medium task at 30001 chars upgrades to complex', () => {
      expect(classifyComplexity('document_analysis', 30001)).toBe('complex');
    });

    it('precedent_search at 50000 chars upgrades to complex', () => {
      expect(classifyComplexity('precedent_search', 50000)).toBe('complex');
    });
  });

  describe('complex tasks are never downgraded', () => {
    it('petition_generation stays complex regardless of input length', () => {
      expect(classifyComplexity('petition_generation', 0)).toBe('complex');
      expect(classifyComplexity('petition_generation', 100000)).toBe('complex');
    });

    it('strategy_analysis stays complex regardless of input length', () => {
      expect(classifyComplexity('strategy_analysis', 0)).toBe('complex');
    });
  });
});

// ─── getModelForTask ──────────────────────────────────────────────────────────

describe('getModelForTask', () => {
  it('returns ModelConfig for simple task (chat_response)', () => {
    const model = getModelForTask('chat_response', 0);
    expect(model.id).toBe('claude-haiku-4-5');
    expect(model.name).toBe('Claude Haiku');
    expect(model.costPer1kTokens).toBe(0.001);
    expect(model.maxTokens).toBe(8192);
    expect(model.supportsVision).toBe(false);
  });

  it('returns ModelConfig for medium task (document_analysis)', () => {
    const model = getModelForTask('document_analysis', 0);
    expect(model.id).toBe('claude-sonnet-4-6');
    expect(model.name).toBe('Claude Sonnet');
    expect(model.costPer1kTokens).toBe(0.003);
    expect(model.maxTokens).toBe(16384);
    expect(model.supportsVision).toBe(true);
  });

  it('returns ModelConfig for complex task (petition_generation)', () => {
    const model = getModelForTask('petition_generation', 0);
    expect(model.id).toBe('claude-opus-4-6');
    expect(model.name).toBe('Claude Opus');
    expect(model.costPer1kTokens).toBe(0.005);
    expect(model.maxTokens).toBe(32768);
    expect(model.supportsVision).toBe(true);
  });

  it('upgrades simple task to medium model when input length > 10000', () => {
    const model = getModelForTask('summary', 15000);
    expect(model.id).toBe('claude-sonnet-4-6');
  });

  it('upgrades medium task to complex model when input length > 30000', () => {
    const model = getModelForTask('clause_review', 35000);
    expect(model.id).toBe('claude-opus-4-6');
  });

  it('defaults inputLength to 0 when not provided', () => {
    const model = getModelForTask('chat_response');
    expect(model.id).toBe('claude-haiku-4-5');
  });
});

// ─── getSystemPrompt ──────────────────────────────────────────────────────────

describe('getSystemPrompt', () => {
  const taskTypes: TaskType[] = [
    'chat_response',
    'document_analysis',
    'petition_generation',
    'strategy_analysis',
    'precedent_search',
    'clause_review',
  ];

  it('returns a non-empty string for every known task type', () => {
    for (const type of taskTypes) {
      const prompt = getSystemPrompt(type);
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    }
  });

  it('each known task type produces a different prompt', () => {
    const prompts = taskTypes.map(t => getSystemPrompt(t));
    const unique = new Set(prompts);
    expect(unique.size).toBe(taskTypes.length);
  });

  it('all prompts include the APEX base context', () => {
    for (const type of taskTypes) {
      const prompt = getSystemPrompt(type);
      expect(prompt).toContain('APEX');
    }
  });

  it('chat_response prompt mentions jurisprudência', () => {
    const prompt = getSystemPrompt('chat_response');
    expect(prompt.toLowerCase()).toContain('jurisprud');
  });

  it('document_analysis prompt mentions analysis structure', () => {
    const prompt = getSystemPrompt('document_analysis');
    expect(prompt).toContain('PARTES ENVOLVIDAS');
  });

  it('petition_generation prompt mentions endereçamento', () => {
    const prompt = getSystemPrompt('petition_generation');
    expect(prompt.toLowerCase()).toContain('endere');
  });

  it('strategy_analysis prompt mentions PONTOS FORTES', () => {
    const prompt = getSystemPrompt('strategy_analysis');
    expect(prompt).toContain('PONTOS FORTES');
  });

  it('precedent_search prompt mentions tribunal structure', () => {
    const prompt = getSystemPrompt('precedent_search');
    expect(prompt).toContain('Tribunal');
  });

  it('clause_review prompt mentions RISCO', () => {
    const prompt = getSystemPrompt('clause_review');
    expect(prompt.toUpperCase()).toContain('RISCO');
  });

  it('falls back to chat_response prompt for unknown task type', () => {
    const fallback = getSystemPrompt('unknown_task' as TaskType);
    const chatPrompt = getSystemPrompt('chat_response');
    expect(fallback).toBe(chatPrompt);
  });

  it('summary and deadline_calculation fall back to chat_response prompt', () => {
    const chatPrompt = getSystemPrompt('chat_response');
    // These types are not in the prompts map, so they fall back
    expect(getSystemPrompt('summary')).toBe(chatPrompt);
    expect(getSystemPrompt('deadline_calculation')).toBe(chatPrompt);
  });
});
