'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  Building2,
  Car,
  Home,
  Wallet,
  Bitcoin,
  AlertCircle,
  Loader2,
  FileSearch,
  X,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type AssetType = 'bank_account' | 'vehicle' | 'real_estate' | 'crypto' | 'investment';

export type SearchType = 'name' | 'cpf_cnpj' | 'process_number';

export interface AssetResult {
  id: string;
  type: AssetType;
  description: string;
  institution: string;
  value: number;
  status: 'active' | 'blocked' | 'restricted';
  details: string;
  lastUpdated: string;
}

export interface AssetSearchProps {
  onResults?: (results: AssetResult[]) => void;
}

// ─── Mock Asset Data ────────────────────────────────────────────────────────

function generateMockResults(query: string): AssetResult[] {
  return [
    {
      id: 'asset-001',
      type: 'bank_account',
      description: 'Conta Corrente',
      institution: 'Banco do Brasil S.A.',
      value: 45320.50,
      status: 'active',
      details: 'Ag. 1234-5 / CC 67890-1',
      lastUpdated: '2026-04-10',
    },
    {
      id: 'asset-002',
      type: 'bank_account',
      description: 'Poupança',
      institution: 'Caixa Econômica Federal',
      value: 12750.00,
      status: 'active',
      details: 'Ag. 0987 / Poup. 54321-0',
      lastUpdated: '2026-04-10',
    },
    {
      id: 'asset-003',
      type: 'bank_account',
      description: 'Conta Corrente PJ',
      institution: 'Itaú Unibanco S.A.',
      value: 128900.75,
      status: 'blocked',
      details: 'Ag. 5678 / CC 11223-4 (Bloqueio SISBAJUD)',
      lastUpdated: '2026-04-09',
    },
    {
      id: 'asset-004',
      type: 'vehicle',
      description: 'Toyota Corolla 2023/2024',
      institution: 'DETRAN-SP',
      value: 135000.00,
      status: 'restricted',
      details: 'Placa ABC-1D23 / RENAVAM 00123456789 / Restrição judicial',
      lastUpdated: '2026-04-08',
    },
    {
      id: 'asset-005',
      type: 'vehicle',
      description: 'Honda CG 160 Start 2022',
      institution: 'DETRAN-SP',
      value: 14500.00,
      status: 'active',
      details: 'Placa DEF-5G67 / RENAVAM 00987654321',
      lastUpdated: '2026-04-08',
    },
    {
      id: 'asset-006',
      type: 'real_estate',
      description: 'Apartamento 72m2 - Vila Mariana',
      institution: 'CRI - 15o Ofício de SP',
      value: 680000.00,
      status: 'active',
      details: 'Matrícula 123.456 / R. 15 - Averbação de construção',
      lastUpdated: '2026-03-15',
    },
    {
      id: 'asset-007',
      type: 'real_estate',
      description: 'Terreno 300m2 - Cotia/SP',
      institution: 'CRI - 1o Ofício de Cotia',
      value: 250000.00,
      status: 'active',
      details: 'Matrícula 78.901 / Lote 15, Quadra 8',
      lastUpdated: '2026-02-20',
    },
    {
      id: 'asset-008',
      type: 'investment',
      description: 'CDB Pré-fixado',
      institution: 'XP Investimentos',
      value: 95000.00,
      status: 'active',
      details: 'Vencimento: 15/10/2027 / Taxa: 13,5% a.a.',
      lastUpdated: '2026-04-10',
    },
    {
      id: 'asset-009',
      type: 'crypto',
      description: 'Bitcoin (BTC)',
      institution: 'Mercado Bitcoin',
      value: 32500.00,
      status: 'active',
      details: '0.065 BTC / Carteira vinculada a CPF',
      lastUpdated: '2026-04-10',
    },
  ];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const ASSET_ICONS: Record<AssetType, typeof Building2> = {
  bank_account: Building2,
  vehicle: Car,
  real_estate: Home,
  crypto: Bitcoin,
  investment: Wallet,
};

const ASSET_LABELS: Record<AssetType, string> = {
  bank_account: 'Conta Bancária',
  vehicle: 'Veículo',
  real_estate: 'Imóvel',
  crypto: 'Criptoativo',
  investment: 'Investimento',
};

const ASSET_COLORS: Record<AssetType, string> = {
  bank_account: 'text-blue-400 bg-blue-500/10',
  vehicle: 'text-purple-400 bg-purple-500/10',
  real_estate: 'text-emerald-400 bg-emerald-500/10',
  crypto: 'text-orange-400 bg-orange-500/10',
  investment: 'text-cyan-400 bg-cyan-500/10',
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  blocked: { label: 'Bloqueado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  restricted: { label: 'Restrito', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AssetSearch({ onResults }: AssetSearchProps) {
  const [searchType, setSearchType] = useState<SearchType>('cpf_cnpj');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AssetResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockResults = generateMockResults(query);
    setResults(mockResults);
    setLoading(false);
    onResults?.(mockResults);
  }, [query, onResults]);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setSearched(false);
  }, []);

  const totalValue = results.reduce((sum, r) => sum + r.value, 0);

  const groupedResults = results.reduce<Record<AssetType, AssetResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<AssetType, AssetResult[]>);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileSearch className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Pesquisa Patrimonial</h3>
        </div>
        <p className="text-xs text-[#6b7a8d] mb-4">
          Interface inspirada no SISBAJUD para busca de ativos. Pesquise por nome, CPF/CNPJ ou número de processo.
        </p>

        {/* Search Type Selector */}
        <div className="flex items-center gap-2 mb-4">
          {[
            { key: 'cpf_cnpj' as SearchType, label: 'CPF/CNPJ' },
            { key: 'name' as SearchType, label: 'Nome' },
            { key: 'process_number' as SearchType, label: 'Nº Processo' },
          ].map((st) => (
            <button
              key={st.key}
              onClick={() => setSearchType(st.key)}
              className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors border ${
                searchType === st.key
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  : 'bg-[#0a0f1a] text-[#6b7a8d] border-[#1a2332] hover:text-white hover:bg-[#1a2332]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(
                searchType === 'cpf_cnpj' ? formatCPF(e.target.value) : e.target.value
              )}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                searchType === 'cpf_cnpj'
                  ? '000.000.000-00 ou 00.000.000/0000-00'
                  : searchType === 'name'
                  ? 'Nome completo do devedor'
                  : '0000000-00.0000.0.00.0000'
              }
              className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] pl-10 pr-10 py-3 text-sm text-white placeholder-[#6b7a8d] focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7a8d] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Pesquisar
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 text-amber-400 animate-spin mb-3" />
          <p className="text-sm text-[#6b7a8d]">Consultando bases de dados...</p>
          <p className="text-xs text-[#6b7a8d] mt-1">SISBAJUD, DETRAN, CRI, CVM, Exchanges</p>
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <>
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#6b7a8d]">
              <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhum ativo encontrado para esta consulta</p>
            </div>
          ) : (
            <>
              {/* Summary Bar */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
                  <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Total Encontrado</p>
                  <p className="text-lg font-bold text-white mt-1">{results.length}</p>
                </div>
                <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
                  <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Valor Total</p>
                  <p className="text-lg font-bold text-amber-400 mt-1">{formatCurrency(totalValue)}</p>
                </div>
                {Object.entries(groupedResults).slice(0, 3).map(([type, items]) => {
                  const Icon = ASSET_ICONS[type as AssetType];
                  const color = ASSET_COLORS[type as AssetType];
                  return (
                    <div key={type} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
                      <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider flex items-center gap-1">
                        <Icon className={`h-3 w-3 ${color.split(' ')[0]}`} />
                        {ASSET_LABELS[type as AssetType]}
                      </p>
                      <p className="text-lg font-bold text-white mt-1">{items.length}</p>
                    </div>
                  );
                })}
              </div>

              {/* Results by Category */}
              {Object.entries(groupedResults).map(([type, items]) => {
                const Icon = ASSET_ICONS[type as AssetType];
                const colorClass = ASSET_COLORS[type as AssetType];

                return (
                  <div key={type} className="rounded-xl border border-[#1a2332] bg-[#0d1320]">
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-[#1a2332]">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        {ASSET_LABELS[type as AssetType]}
                      </h4>
                      <span className="text-xs text-[#6b7a8d]">({items.length})</span>
                    </div>
                    <div className="divide-y divide-[#1a2332]">
                      {items.map((asset) => {
                        const statusBadge = STATUS_BADGES[asset.status];
                        return (
                          <div
                            key={asset.id}
                            className="flex items-center justify-between px-5 py-3 hover:bg-[#0a0f1a] transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm text-white font-medium">{asset.description}</p>
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${statusBadge.color}`}
                                >
                                  {statusBadge.label}
                                </span>
                              </div>
                              <p className="text-xs text-[#6b7a8d] mt-0.5">{asset.institution}</p>
                              <p className="text-[10px] text-[#6b7a8d] mt-0.5 font-mono">{asset.details}</p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm font-semibold text-white">{formatCurrency(asset.value)}</p>
                              <p className="text-[10px] text-[#6b7a8d]">Atualizado: {asset.lastUpdated}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}
