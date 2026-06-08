import { createServerClient } from './supabase';

export interface AIUsageRecord {
  user_id: string;
  task_type: string;
  model: string;
  complexity: string;
  tokens_used: number;
  cost_usd: number;
  duration_ms: number;
}

export async function trackAIUsage(record: AIUsageRecord): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.from('ai_usage').insert(record);
  } catch (error) {
    console.error('Failed to track AI usage:', error);
    // Non-blocking — don't fail the request
  }
}

export async function getAIUsageSummary(userId: string, days: number = 30) {
  const supabase = createServerClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('ai_usage')
    .select('task_type, model, tokens_used, cost_usd, created_at')
    .eq('user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  return {
    records: data || [],
    totalTokens: (data || []).reduce((sum, r) => sum + r.tokens_used, 0),
    totalCost: (data || []).reduce((sum, r) => sum + r.cost_usd, 0),
    byTaskType: groupBy(data || [], 'task_type'),
    byModel: groupBy(data || [], 'model'),
  };
}

function groupBy(arr: { task_type: string; model: string; tokens_used: number; cost_usd: number }[], key: string) {
  return arr.reduce((acc, item) => {
    const group = item[key as keyof typeof item] as string;
    if (!acc[group]) acc[group] = { count: 0, tokens: 0, cost: 0 };
    acc[group].count++;
    acc[group].tokens += item.tokens_used;
    acc[group].cost += item.cost_usd;
    return acc;
  }, {} as Record<string, { count: number; tokens: number; cost: number }>);
}
