// Server-safe plan/feature logic (no 'use client') — shared by the
// useSubscription hook and by server-side entitlement checks.

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus =
  | 'free'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'; // checkout started but not yet authorized/paid — no access

const PLAN_RANK: Record<SubscriptionPlan, number> = {
  starter: 0,
  professional: 1,
  enterprise: 2,
};

export type PlanFeature =
  | 'unlimited_processes'
  | 'ai_unlimited'
  | 'multi_user'
  | 'datajud_integration'
  | 'financial_module'
  | 'api_access'
  | 'whitelabel';

const FEATURE_MIN_PLAN: Record<PlanFeature, SubscriptionPlan> = {
  unlimited_processes: 'professional',
  ai_unlimited: 'professional',
  multi_user: 'professional',
  datajud_integration: 'professional',
  financial_module: 'professional',
  api_access: 'enterprise',
  whitelabel: 'enterprise',
};

/**
 * Whether a subscription plan includes a feature (plan rank >= feature's minimum plan).
 */
export function hasFeature(plan: SubscriptionPlan, feature: PlanFeature): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

/** Whether a subscription status counts as active (active or trialing). */
export function isActivePlan(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing';
}
