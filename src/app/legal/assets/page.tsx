'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { AssetSearch, AssetReport } from '@/components/legal';
import type { AssetResult } from '@/components/legal';

export default function AssetsPage() {
  const [results, setResults] = useState<AssetResult[]>([]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
            <Search className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Busca de Ativos</h1>
            <p className="text-sm text-[#6b7a8d]">
              Pesquisa patrimonial integrada com SISBAJUD, DETRAN, CRI e exchanges
            </p>
          </div>
        </div>
      </div>

      {/* Search Component */}
      <div className="space-y-8">
        <AssetSearch onResults={setResults} />

        {/* Report Component */}
        <AssetReport results={results} />
      </div>
    </div>
  );
}
