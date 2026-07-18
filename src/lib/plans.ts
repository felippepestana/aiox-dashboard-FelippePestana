'use client';

import { useState, useEffect } from 'react';
import type { SubscriptionPlan, SubscriptionStatus } from './plans-core';

export type { SubscriptionPlan, SubscriptionStatus, PlanFeature } from './plans-core';
export { hasFeature, isActivePlan } from './plans-core';

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
}

/**
 * React hook that fetches the current user's subscription info from the API.
 * Defaults to the free starter plan while loading or on error.
 */
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
