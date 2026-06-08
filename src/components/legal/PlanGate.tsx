'use client';

import { type ReactNode, useState } from 'react';
import { Lock, ArrowUpCircle, Loader2 } from 'lucide-react';
import { useSubscription, hasFeature, isActivePlan, type PlanFeature } from '@/lib/plans';

interface PlanGateProps {
  feature: PlanFeature;
  children: ReactNode;
  fallbackMessage?: string;
}

export function PlanGate({ feature, children, fallbackMessage }: PlanGateProps) {
  const { plan, status, loading } = useSubscription();

  if (loading) return <>{children}</>;

  const hasAccess = hasFeature(plan, feature) && isActivePlan(status);
  if (hasAccess || plan !== 'starter') return <>{children}</>;

  return <UpgradePrompt message={fallbackMessage} />;
}

function UpgradePrompt({ message }: { message?: string }) {
  const [upgrading, setUpgrading] = useState(false);

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'professional' }),
      });
      const data = await res.json();
      if (data.initPoint) window.location.href = data.initPoint;
    } catch {
      // fall through
    } finally {
      setUpgrading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 mb-4">
        <Lock className="h-6 w-6 text-amber-400" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Recurso do Plano Professional
      </h3>
      <p className="text-sm text-[#6b7a8d] max-w-md mb-6">
        {message || 'Faça upgrade para o plano Professional para desbloquear este recurso e acelerar seu escritório.'}
      </p>
      <button
        onClick={handleUpgrade}
        disabled={upgrading}
        className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
      >
        {upgrading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ArrowUpCircle className="h-4 w-4" />
        )}
        Fazer Upgrade — R$ 197/mês
      </button>
    </div>
  );
}
