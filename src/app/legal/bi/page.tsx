'use client';

import { useState } from 'react';
import { LineChart } from 'lucide-react';
import { BIDashboard } from '@/components/legal/BIDashboard';

export default function BIPage() {
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20">
            <LineChart className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Business Intelligence</h1>
            <p className="text-sm text-[#6b7a8d]">Métricas e análises estratégicas do escritório</p>
          </div>
        </div>
      </div>

      <BIDashboard period={period} onPeriodChange={setPeriod} />
    </div>
  );
}
