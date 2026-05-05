'use client';

import React, { useMemo } from 'react';
import {
  Download,
  Building2,
  Car,
  Home,
  Wallet,
  Bitcoin,
  FileText,
  PieChart,
  TrendingUp,
  AlertTriangle,
  Shield,
} from 'lucide-react';
import type { AssetResult, AssetType } from './AssetSearch';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AssetReportProps {
  results: AssetResult[];
  targetName?: string;
  targetDocument?: string;
  onExport?: (format: 'pdf' | 'csv' | 'json') => void;
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
  bank_account: 'Contas Bancárias',
  vehicle: 'Veículos',
  real_estate: 'Imóveis',
  crypto: 'Criptoativos',
  investment: 'Investimentos',
};

const CATEGORY_COLORS: Record<AssetType, string> = {
  bank_account: 'bg-blue-500',
  vehicle: 'bg-purple-500',
  real_estate: 'bg-emerald-500',
  crypto: 'bg-orange-500',
  investment: 'bg-cyan-500',
};

const CATEGORY_TEXT_COLORS: Record<AssetType, string> = {
  bank_account: 'text-blue-400',
  vehicle: 'text-purple-400',
  real_estate: 'text-emerald-400',
  crypto: 'text-orange-400',
  investment: 'text-cyan-400',
};

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AssetReport({
  results,
  targetName = 'Nome do Pesquisado',
  targetDocument = '000.000.000-00',
  onExport,
}: AssetReportProps) {
  // Compute summaries
  const totalValue = useMemo(
    () => results.reduce((sum, r) => sum + r.value, 0),
    [results]
  );

  const blockedValue = useMemo(
    () => results.filter((r) => r.status === 'blocked').reduce((sum, r) => sum + r.value, 0),
    [results]
  );

  const restrictedValue = useMemo(
    () => results.filter((r) => r.status === 'restricted').reduce((sum, r) => sum + r.value, 0),
    [results]
  );

  const byCategory = useMemo(() => {
    const map: Record<AssetType, { count: number; value: number }> = {
      bank_account: { count: 0, value: 0 },
      vehicle: { count: 0, value: 0 },
      real_estate: { count: 0, value: 0 },
      crypto: { count: 0, value: 0 },
      investment: { count: 0, value: 0 },
    };
    for (const r of results) {
      if (!map[r.type]) map[r.type] = { count: 0, value: 0 };
      map[r.type].count += 1;
      map[r.type].value += r.value;
    }
    return map;
  }, [results]);

  const statusCounts = useMemo(() => {
    return {
      active: results.filter((r) => r.status === 'active').length,
      blocked: results.filter((r) => r.status === 'blocked').length,
      restricted: results.filter((r) => r.status === 'restricted').length,
    };
  }, [results]);

  if (results.length === 0) {
    return (
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-8 text-center">
        <FileText className="h-12 w-12 text-[#6b7a8d] mx-auto mb-3 opacity-50" />
        <p className="text-sm text-[#6b7a8d]">Nenhum resultado para gerar relatório</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Relatório Patrimonial</h3>
              <p className="text-xs text-[#6b7a8d]">
                Gerado em {new Date().toLocaleDateString('pt-BR')} às{' '}
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(['pdf', 'csv', 'json'] as const).map((format) => (
              <button
                key={format}
                onClick={() => onExport?.(format)}
                className="flex items-center gap-1.5 rounded-lg bg-[#1a2332] px-3 py-1.5 text-xs font-medium text-[#8899aa] hover:text-white hover:bg-[#2a3342] transition-colors border border-[#1a2332]"
              >
                <Download className="h-3 w-3" />
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Target Info */}
        <div className="grid grid-cols-2 gap-4 rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-4">
          <div>
            <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Pesquisado</p>
            <p className="text-sm text-white font-medium mt-0.5">{targetName}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">CPF/CNPJ</p>
            <p className="text-sm text-white font-mono mt-0.5">{targetDocument}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Total de Ativos</p>
              <p className="text-2xl font-bold text-white mt-1">{results.length}</p>
            </div>
            <PieChart className="h-5 w-5 text-amber-400" />
          </div>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Valor Total</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{formatCurrency(totalValue)}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-amber-400" />
          </div>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Valor Bloqueado</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{formatCurrency(blockedValue)}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Valor Restrito</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{formatCurrency(restrictedValue)}</p>
            </div>
            <Shield className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h4 className="text-sm font-semibold text-white mb-4">Distribuição por Categoria</h4>
        <div className="space-y-3">
          {(Object.entries(byCategory) as [AssetType, { count: number; value: number }][])
            .filter(([, data]) => data.count > 0)
            .sort(([, a], [, b]) => b.value - a.value)
            .map(([type, data]) => {
              const Icon = ASSET_ICONS[type];
              const percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0;

              return (
                <div key={type} className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${CATEGORY_COLORS[type]}/10`}>
                    <Icon className={`h-4 w-4 ${CATEGORY_TEXT_COLORS[type]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white font-medium">{ASSET_LABELS[type]}</span>
                      <span className="text-xs text-[#6b7a8d]">
                        {data.count} {data.count === 1 ? 'ativo' : 'ativos'} - {formatCurrency(data.value)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#1a2332]">
                      <div
                        className={`h-1.5 rounded-full ${CATEGORY_COLORS[type]}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-[#6b7a8d] w-12 text-right">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Full Asset Table */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a2332]">
          <h4 className="text-sm font-semibold text-white">Detalhamento de Ativos</h4>
          <div className="flex items-center gap-3 text-[10px] text-[#6b7a8d]">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500" /> Ativos ({statusCounts.active})
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Bloqueados ({statusCounts.blocked})
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-yellow-500" /> Restritos ({statusCounts.restricted})
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1a2332] text-left">
                <th className="px-6 py-3 text-[10px] font-semibold text-[#6b7a8d] uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-[#6b7a8d] uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-[#6b7a8d] uppercase tracking-wider">Instituição</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-[#6b7a8d] uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-[#6b7a8d] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-[10px] font-semibold text-[#6b7a8d] uppercase tracking-wider">Atualizado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a2332]">
              {results.map((asset) => {
                const Icon = ASSET_ICONS[asset.type];
                const statusBadge = {
                  active: { label: 'Ativo', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
                  blocked: { label: 'Bloqueado', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
                  restricted: { label: 'Restrito', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
                }[asset.status];

                return (
                  <tr key={asset.id} className="hover:bg-[#0a0f1a] transition-colors">
                    <td className="px-6 py-3">
                      <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${CATEGORY_COLORS[asset.type]}/10`}>
                        <Icon className={`h-3.5 w-3.5 ${CATEGORY_TEXT_COLORS[asset.type]}`} />
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-xs text-white font-medium">{asset.description}</p>
                      <p className="text-[10px] text-[#6b7a8d] font-mono mt-0.5">{asset.details}</p>
                    </td>
                    <td className="px-6 py-3 text-xs text-[#6b7a8d]">{asset.institution}</td>
                    <td className="px-6 py-3 text-xs text-white font-medium">{formatCurrency(asset.value)}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${statusBadge.color}`}
                      >
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-[#6b7a8d]">{formatDate(asset.lastUpdated)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#1a2332] bg-[#0a0f1a]">
          <span className="text-xs text-[#6b7a8d]">{results.length} ativos encontrados</span>
          <span className="text-xs font-semibold text-amber-400">Total: {formatCurrency(totalValue)}</span>
        </div>
      </div>
    </div>
  );
}
