import * as Sentry from '@sentry/nextjs';
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

  // Atomic reservation (single conditional upsert in Postgres): concurrent
  // requests cannot all pass a read-then-insert check, so the cap holds
  // under bursts. A unit is consumed even if the model call later fails —
  // acceptable for an anti-abuse limit.
  const { data: allowed, error } = await supabase.rpc('consume_ai_quota', {
    p_user_id: userId,
    p_limit: FREE_MONTHLY_AI_LIMIT,
  });

  if (error === null && typeof allowed === 'boolean') {
    return { allowed };
  }

  // Quota storage failed. Fail CLOSED in production — treating a broken
  // counter as available quota would let free users run unlimited paid
  // Anthropic calls exactly when the safety net is down.
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(
      `[ai-quota] consume_ai_quota unavailable in production: ${error?.message ?? 'unexpected result'}`,
      'error',
    );
    return { allowed: false };
  }

  // Dev/test fallback for environments without the migration: best-effort
  // count over ai_usage (racy under concurrency; never used in production).
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const { count, error: countError } = await supabase
    .from('ai_usage')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart.toISOString());

  if (countError) {
    return { allowed: false };
  }

  const used = count ?? 0;
  return {
    allowed: used < FREE_MONTHLY_AI_LIMIT,
    remaining: Math.max(0, FREE_MONTHLY_AI_LIMIT - used),
  };
}

/** Standard error payload for an exhausted free-tier AI quota. */
export const AI_QUOTA_EXCEEDED_MESSAGE =
  'Limite mensal de consultas de IA do plano gratuito atingido. Faça upgrade para o plano Professional para uso ilimitado.';
