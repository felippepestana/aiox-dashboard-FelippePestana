import { createServerClient } from './supabase';

// Matches the Starter card on the landing page: "IA básica (10 consultas/mês)"
const FREE_MONTHLY_AI_LIMIT = 10;

export interface AIQuotaResult {
  allowed: boolean;
  /** Remaining free-tier calls this month (undefined for unlimited plans). */
  remaining?: number;
}

/**
 * Server-side AI quota check. Professional/Enterprise subscribers with an
 * active (or trialing) subscription get unlimited calls; everyone else is
 * capped at the Starter monthly allowance, counted from ai_usage. Without
 * this, a free user could bypass the UI and POST directly to the AI routes
 * for unlimited paid Anthropic requests.
 */
export async function checkAIQuota(userId: string): Promise<AIQuotaResult> {
  const supabase = createServerClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan, subscription_status')
    .eq('id', userId)
    .single();

  const plan = profile?.subscription_plan ?? 'starter';
  const status = profile?.subscription_status ?? 'free';
  if (
    ['professional', 'enterprise'].includes(plan) &&
    ['active', 'trialing'].includes(status)
  ) {
    return { allowed: true };
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString());

  const used = count ?? 0;
  return {
    allowed: used < FREE_MONTHLY_AI_LIMIT,
    remaining: Math.max(0, FREE_MONTHLY_AI_LIMIT - used),
  };
}

/** Standard error payload for an exhausted free-tier AI quota. */
export const AI_QUOTA_EXCEEDED_MESSAGE =
  'Limite mensal de consultas de IA do plano gratuito atingido. Faça upgrade para o plano Professional para uso ilimitado.';
