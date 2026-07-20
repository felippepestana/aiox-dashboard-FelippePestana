import { createServerClient } from './supabase';
import {
  hasFeature,
  isActivePlan,
  type PlanFeature,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from './plans-core';

/**
 * Server-side entitlement check: whether the user's subscription grants a
 * plan feature (and is active/trialing). Client-side PlanGate only hides UI —
 * paid modules must also enforce this on their API routes, or a Starter user
 * can call the endpoints directly.
 */
export async function hasActiveFeature(
  userId: string,
  feature: PlanFeature,
): Promise<boolean> {
  const supabase = createServerClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('subscription_plan, subscription_status')
    .eq('id', userId)
    .single();

  // A DB failure must not read as "free plan" — paid users would get a
  // misleading 402. Let the route surface a 500 instead.
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

  const plan = (profile?.subscription_plan ?? 'starter') as SubscriptionPlan;
  const status = (profile?.subscription_status ?? 'free') as SubscriptionStatus;

  return hasFeature(plan, feature) && isActivePlan(status);
}

/** Standard error payload for a feature outside the user's plan. */
export const PLAN_FEATURE_REQUIRED_MESSAGE =
  'Este recurso está disponível a partir do plano Professional. Faça upgrade para utilizá-lo.';
