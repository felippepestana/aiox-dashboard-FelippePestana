'use client';

import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Trophy,
  UserPlus,
  Clock,
  Briefcase,
  Users,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';

export interface BIDashboardProps {
  period: 'month' | 'quarter' | 'year';
  onPeriodChange: (p: 'month' | 'quarter' | 'year') => void;
}

const AREA_COLORS: Record<string, string> = {
  civil: '#3b82f6', trabalhista: '#f59e0b', tributario: '#10b981', penal: '#ef4444',
  consumidor: '#06b6d4', familia: '#ec4899', empresarial: '#8b5cf6', previdenciario: '#6366f1',
  administrativo: '#6b7280', ambiental: '#84cc16', digital: '#22d3ee',
};

const AREA_LABELS: Record<string, string> = {
  civil: 'Cível', trabalhista: 'Trabalhista', tributario: 'Tributário', penal: 'Penal',
  consumidor: 'Consumidor', familia: 'Família', empresarial: 'Empresarial',
  previdenciario: 'Previdenciário', administrativo: 'Administrativo', ambiental: 'Ambiental', digital: 'Digital',
};

function formatCurrency(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function BIDashboard({ period, onPeriodChange }: BIDashboardProps) {
  const { processes, clients, deadlines } = useLegalStore();
  const { getTotalRevenue, getTotalExpenses, honorarios, transactions } = useLegalFinancialStore();

  const totalRevenue = getTotalRevenue();
  const totalExpenses = getTotalExpenses();
  const activeProcesses = processes.filter((p) => p.status === 'active').length;
  const wonProcesses = processes.filter((p) => p.status === 'won').length;
  const lostProcesses = processes.filter((p) => p.status === 'lost').length;
  const winRate = wonProcesses + lostProcesses > 0
    ? ((wonProcesses / (wonProcesses + lostProcesses)) * 100).toFixed(1)
    : '—';
  const pendingDeadlines = deadlines.filter((d) => d.status === 'pending').length;

  const metrics = [
    { id: 'revenue', label: 'Receita Total', value: formatCurrency(totalRevenue), icon: DollarSign },
    { id: 'winrate', label: 'Taxa de Êxito', value: `${winRate}%`, icon: Trophy },
    { id: 'clients', label: 'Total Clientes', value: clients.length.toString(), icon: UserPlus },
    { id: 'deadlines', label: 'Prazos Pendentes', value: pendingDeadlines.toString(), icon: Clock },
    { id: 'processes', label: 'Processos Ativos', value: activeProcesses.toString(), icon: Briefcase },
    { id: 'honorarios', label: 'Honorários Ativos', value: honorarios.filter((h) => h.status === 'active').length.toString(), icon: Users },
  ];

  // Revenue by area: sum honorarios per process area
  const revenueByArea: { area: string; value: number; color: string }[] = [];
  const areaMap = new Map<string, number>();
  for (const h of honorarios) {
    if (h.processId) {
      const proc = processes.find((p) => p.id === h.processId);
      if (proc) {
        areaMap.set(proc.area, (areaMap.get(proc.area) || 0) + h.amount);
      }
    }
  }
  for (const [area, value] of areaMap.entries()) {
    revenueByArea.push({ area: AREA_LABELS[area] || area, value, color: AREA_COLORS[area] || '#6b7280' });
  }
  revenueByArea.sort((a, b) => b.value - a.value);
  const maxRevenue = Math.max(...revenueByArea.map((r) => r.value), 1);

  // Case distribution
  const caseDistribution = [
    { label: 'Ativos', count: processes.filter((p) => p.status === 'active').length, color: '#3b82f6' },
    { label: 'Suspensos', count: processes.filter((p) => p.status === 'suspended').length, color: '#f59e0b' },
    { label: 'Ganhos', count: processes.filter((p) => p.status === 'won').length, color: '#10b981' },
    { label: 'Perdidos', count: processes.filter((p) => p.status === 'lost').length, color: '#ef4444' },
    { label: 'Acordo', count: processes.filter((p) => p.status === 'settled').length, color: '#8b5cf6' },
    { label: 'Arquivados', count: processes.filter((p) => p.status === 'archived' || p.status === 'closed').length, color: '#6b7280' },
  ].filter((d) => d.count > 0);

  const totalCases = caseDistribution.reduce((s, d) => s + d.count, 0);

  const gradientParts: string[] = [];
  let cumulative = 0;
  caseDistribution.forEach((d) => {
    const pct = totalCases > 0 ? (d.count / totalCases) * 100 : 0;
    gradientParts.push(`${d.color} ${cumulative}% ${cumulative + pct}%`);
    cumulative += pct;
  });
  const conicGradient = gradientParts.length > 0
    ? `conic-gradient(${gradientParts.join(', ')})`
    : 'conic-gradient(#1a2332 0% 100%)';

  // Top clients by honorario value
  const clientRevenue = new Map<string, { name: string; revenue: number; cases: number }>();
  for (const h of honorarios) {
    const client = clients.find((c) => c.id === h.clientId);
    if (client) {
      const existing = clientRevenue.get(h.clientId) || { name: client.name, revenue: 0, cases: 0 };
      existing.revenue += h.amount;
      existing.cases = processes.filter((p) => p.clientId === h.clientId).length;
      clientRevenue.set(h.clientId, existing);
    }
  }
  const topClients = [...clientRevenue.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Monthly revenue from transactions
  const monthlyRevenue: { month: string; value: number }[] = [];
  const now = new Date();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const value = transactions
      .filter((t) => t.type === 'income' && t.date.startsWith(prefix))
      .reduce((sum, t) => sum + t.amount, 0);
    monthlyRevenue.push({ month: monthNames[d.getMonth()], value });
  }
  const maxMonthly = Math.max(...monthlyRevenue.map((m) => m.value), 1);

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
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.id} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Icon className="h-5 w-5 text-amber-400" />
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
          <h3 className="text-sm font-semibold text-white mb-4">Honorários por Área</h3>
          {revenueByArea.length === 0 ? (
            <p className="text-xs text-[#4a5568]">Cadastre honorários vinculados a processos para ver dados</p>
          ) : (
            <div className="space-y-3">
              {revenueByArea.map((item) => (
                <div key={item.area} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8899aa]">{item.area}</span>
                    <span className="text-white font-medium">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#1a2332]">
                    <div
                      className="h-3 rounded-full transition-all duration-700"
                      style={{ width: `${(item.value / maxRevenue) * 100}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie Chart: Case Distribution */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Distribuição de Processos</h3>
          <div className="flex items-center gap-6">
            <div className="relative flex-shrink-0">
              <div className="h-36 w-36 rounded-full" style={{ background: conicGradient }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-[#0d1320] flex items-center justify-center">
                  <span className="text-lg font-bold text-white">{totalCases}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2 flex-1">
              {caseDistribution.map((d) => (
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
          {monthlyRevenue.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[10px] text-[#6b7a8d]">
                {m.value > 0 ? `R$ ${(m.value / 1000).toFixed(0)}k` : '—'}
              </span>
              <div className="w-full flex justify-center">
                <div
                  className="w-full max-w-[48px] rounded-t-lg bg-gradient-to-t from-amber-600 to-amber-400 transition-all duration-700"
                  style={{ height: `${m.value > 0 ? Math.max((m.value / maxMonthly) * 120, 4) : 4}px` }}
                />
              </div>
              <span className="text-xs text-[#6b7a8d]">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Clients Table */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h3 className="text-sm font-semibold text-white mb-4">Top Clientes por Honorário</h3>
        {topClients.length === 0 ? (
          <p className="text-xs text-[#4a5568]">Cadastre honorários para ver o ranking de clientes</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a2332]">
                  <th className="text-left py-2 px-3 text-[10px] text-[#6b7a8d] uppercase tracking-wider font-semibold">#</th>
                  <th className="text-left py-2 px-3 text-[10px] text-[#6b7a8d] uppercase tracking-wider font-semibold">Cliente</th>
                  <th className="text-right py-2 px-3 text-[10px] text-[#6b7a8d] uppercase tracking-wider font-semibold">Honorário Total</th>
                  <th className="text-right py-2 px-3 text-[10px] text-[#6b7a8d] uppercase tracking-wider font-semibold">Processos</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map((client, idx) => (
                  <tr key={client.name} className="border-b border-[#1a2332]/50 hover:bg-[#1a2332]/30 transition-colors">
                    <td className="py-3 px-3 text-[#6b7a8d]">{idx + 1}</td>
                    <td className="py-3 px-3 text-white font-medium">{client.name}</td>
                    <td className="py-3 px-3 text-right text-amber-400 font-medium">{formatCurrency(client.revenue)}</td>
                    <td className="py-3 px-3 text-right text-[#8899aa]">{client.cases}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
