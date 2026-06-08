'use client';

import { useState, useEffect } from 'react';

export type SubscriptionPlan = 'starter' | 'professional' | 'enterprise';
export type SubscriptionStatus = 'free' | 'trialing' | 'active' | 'past_due' | 'canceled';

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

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

export function hasFeature(plan: SubscriptionPlan, feature: PlanFeature): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[FEATURE_MIN_PLAN[feature]];
}

export function isActivePlan(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing';
}

export function useSubscription(): SubscriptionInfo & { loading: boolean } {
  const [data, setData] = useState<SubscriptionInfo>({
    plan: 'starter',
    status: 'free',
    currentPeriodEnd: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/payments/subscription')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json && !json.error) {
          setData({
            plan: json.plan || 'starter',
            status: json.status || 'free',
            currentPeriodEnd: json.currentPeriodEnd || null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { ...data, loading };
}
