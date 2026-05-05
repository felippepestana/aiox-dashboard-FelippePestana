'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trophy,
  UserPlus,
  Clock,
  Timer,
  Users,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BIMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: 'up' | 'down';
  icon: React.ElementType;
}

export interface RevenueByArea {
  area: string;
  value: number;
  color: string;
}

export interface CaseDistribution {
  label: string;
  count: number;
  color: string;
}

export interface MonthlyRevenue {
  month: string;
  value: number;
}

export interface TopClient {
  name: string;
  revenue: number;
  cases: number;
}

export interface BIDashboardProps {
  period: 'month' | 'quarter' | 'year';
  onPeriodChange: (p: 'month' | 'quarter' | 'year') => void;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const METRICS: BIMetric[] = [
  { id: 'revenue', label: 'Receita Total', value: 'R$ 287.450', change: 12.5, trend: 'up', icon: DollarSign },
  { id: 'winrate', label: 'Taxa de Êxito', value: '78,3%', change: 3.2, trend: 'up', icon: Trophy },
  { id: 'acquisition', label: 'Novos Clientes', value: '23', change: 8.7, trend: 'up', icon: UserPlus },
  { id: 'duration', label: 'Duração Média', value: '4,2 meses', change: -5.1, trend: 'down', icon: Clock },
  { id: 'billable', label: 'Horas Faturáveis', value: '1.284h', change: 6.3, trend: 'up', icon: Timer },
  { id: 'utilization', label: 'Utilização Equipe', value: '82%', change: 2.1, trend: 'up', icon: Users },
];

const REVENUE_BY_AREA: RevenueByArea[] = [
  { area: 'Trabalhista', value: 85000, color: '#f59e0b' },
  { area: 'Cível', value: 72000, color: '#3b82f6' },
  { area: 'Tributário', value: 55000, color: '#10b981' },
  { area: 'Empresarial', value: 45000, color: '#8b5cf6' },
  { area: 'Criminal', value: 30450, color: '#ef4444' },
];

const CASE_DISTRIBUTION: CaseDistribution[] = [
  { label: 'Em andamento', count: 45, color: '#3b82f6' },
  { label: 'Aguardando', count: 22, color: '#f59e0b' },
  { label: 'Encerrados', count: 38, color: '#10b981' },
  { label: 'Suspensos', count: 8, color: '#6b7280' },
];

const MONTHLY_REVENUE: MonthlyRevenue[] = [
  { month: 'Jan', value: 42000 },
  { month: 'Fev', value: 38500 },
  { month: 'Mar', value: 51200 },
  { month: 'Abr', value: 46800 },
  { month: 'Mai', value: 55300 },
  { month: 'Jun', value: 53650 },
];

const TOP_CLIENTS: TopClient[] = [
  { name: 'Tech Solutions Ltda', revenue: 45200, cases: 8 },
  { name: 'Construtora ABC S.A.', revenue: 38700, cases: 5 },
  { name: 'Indústria Nacional Ltda', revenue: 32100, cases: 12 },
  { name: 'Grupo Varejo Brasil', revenue: 28400, cases: 6 },
  { name: 'Logística Express Ltda', revenue: 22800, cases: 4 },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function BIDashboard({ period, onPeriodChange }: BIDashboardProps) {
  const maxRevenue = Math.max(...REVENUE_BY_AREA.map((r) => r.value));
  const maxMonthly = Math.max(...MONTHLY_REVENUE.map((m) => m.value));
  const totalCases = CASE_DISTRIBUTION.reduce((s, d) => s + d.count, 0);

  // Build conic-gradient
  let gradientParts: string[] = [];
  let cumulative = 0;
  CASE_DISTRIBUTION.forEach((d) => {
    const pct = (d.count / totalCases) * 100;
    gradientParts.push(`${d.color} ${cumulative}% ${cumulative + pct}%`);
    cumulative += pct;
  });
  const conicGradient = `conic-gradient(${gradientParts.join(', ')})`;

  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center gap-2">
        {(['month', 'quarter', 'year'] as const).map((p) => (
          <button
            key={p}
            onClick={() => onPeriodChange(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === p
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-[#6b7a8d] hover:text-white hover:bg-[#1a2332] border border-transparent'
            }`}
          >
            {p === 'month' ? 'Mensal' : p === 'quarter' ? 'Trimestral' : 'Anual'}
          </button>
        ))}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {METRICS.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.id} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Icon className="h-5 w-5 text-amber-400" />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${
                  m.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {m.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {m.change > 0 ? '+' : ''}{m.change}%
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-3">{m.value}</p>
              <p className="text-xs text-[#6b7a8d] mt-1">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Revenue by Area */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Receita por Área de Atuação</h3>
          <div className="space-y-3">
            {REVENUE_BY_AREA.map((item) => (
              <div key={item.area} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8899aa]">{item.area}</span>
                  <span className="text-white font-medium">
                    R$ {item.value.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-3 rounded-full bg-[#1a2332]">
                  <div
                    className="h-3 rounded-full transition-all duration-700"
                    style={{
                      width: `${(item.value / maxRevenue) * 100}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie Chart: Case Distribution */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Distribuição de Processos</h3>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <div
                className="h-36 w-36 rounded-full"
                style={{ background: conicGradient }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-[#0d1320] flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{totalCases}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {CASE_DISTRIBUTION.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-xs text-[#8899aa] flex-1">{d.label}</span>
                  <span className="text-xs font-medium text-white">{d.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Revenue Timeline */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Evolução Mensal de Receita</h3>
        <div className="flex items-end gap-3 h-40">
          {MONTHLY_REVENUE.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[10px] text-[#6b7a8d]">
                R$ {(m.value / 1000).toFixed(0)}k
              </span>
              <div className="w-full flex justify-center">
                <div
                  className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-700"
                  style={{ height: `${(m.value / maxMonthly) * 120}px` }}
                />
              </div>
              <span className="text-xs text-[#6b7a8d]">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Clients Table */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Top 5 Clientes por Receita</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a2332]">
                <th className="text-left py-2 px-3 text-[10px] text-[#6b7a8d] uppercase tracking-wider font-semibold">#</th>
                <th className="text-left py-2 px-3 text-[10px] text-[#6b7a8d] uppercase tracking-wider font-semibold">Cliente</th>
                <th className="text-right py-2 px-3 text-[10px] text-[#6b7a8d] uppercase tracking-wider font-semibold">Receita</th>
                <th className="text-right py-2 px-3 text-[10px] text-[#6b7a8d] uppercase tracking-wider font-semibold">Processos</th>
              </tr>
            </thead>
            <tbody>
              {TOP_CLIENTS.map((client, idx) => (
                <tr key={client.name} className="border-b border-[#1a2332]/50 hover:bg-[#1a2332]/30 transition-colors">
                  <td className="py-3 px-3 text-[#6b7a8d]">{idx + 1}</td>
                  <td className="py-3 px-3 text-white font-medium">{client.name}</td>
                  <td className="py-3 px-3 text-right text-amber-400 font-medium">
                    R$ {client.revenue.toLocaleString('pt-BR')}
                  </td>
                  <td className="py-3 px-3 text-right text-[#8899aa]">{client.cases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
