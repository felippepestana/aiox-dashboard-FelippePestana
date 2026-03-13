'use client';

import { useState } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  BarChart3, PieChart, CreditCard, FileText, Calculator, Target,
  Calendar, ChevronRight, Sparkles, Download, Filter,
} from 'lucide-react';
import Link from 'next/link';

const MOCK_KPI = [
  { label: 'Receita do Mês', value: 'R$ 47.850,00', change: '+12,3%', trend: 'up', icon: TrendingUp, color: 'green' },
  { label: 'Despesas', value: 'R$ 18.420,00', change: '+3,1%', trend: 'up', icon: TrendingDown, color: 'red' },
  { label: 'Lucro Líquido', value: 'R$ 29.430,00', change: '+18,7%', trend: 'up', icon: DollarSign, color: 'teal' },
  { label: 'A Receber', value: 'R$ 12.600,00', change: '-8,2%', trend: 'down', icon: CreditCard, color: 'amber' },
];

const MOCK_REVENUE = [
  { month: 'Out', value: 38500 },
  { month: 'Nov', value: 42100 },
  { month: 'Dez', value: 35800 },
  { month: 'Jan', value: 41200 },
  { month: 'Fev', value: 44600 },
  { month: 'Mar', value: 47850 },
];

const MOCK_EXPENSES_BREAKDOWN = [
  { category: 'Materiais e Insumos', value: 5800, pct: 31.5, color: 'bg-teal-400' },
  { category: 'Aluguel e Condomínio', value: 4500, pct: 24.4, color: 'bg-blue-400' },
  { category: 'Folha de Pagamento', value: 3800, pct: 20.6, color: 'bg-purple-400' },
  { category: 'Laboratório (Próteses)', value: 2200, pct: 11.9, color: 'bg-amber-400' },
  { category: 'Marketing', value: 1200, pct: 6.5, color: 'bg-pink-400' },
  { category: 'Outros', value: 920, pct: 5.0, color: 'bg-gray-400' },
];

const MOCK_RECENT_TRANSACTIONS = [
  { desc: 'Pagamento - Maria Silva (Restauração)', amount: 350, type: 'income', date: '13/03' },
  { desc: 'Pagamento - João Oliveira (Implante - Parcela 1/6)', amount: 1500, type: 'income', date: '12/03' },
  { desc: 'Compra - Dental Rondônia (Resinas)', amount: -890, type: 'expense', date: '12/03' },
  { desc: 'Pagamento - Ana Costa (Clareamento)', amount: 1500, type: 'income', date: '11/03' },
  { desc: 'Laboratório Premium (Facetas)', amount: -2400, type: 'expense', date: '10/03' },
  { desc: 'Pagamento - Carlos Lima (Avaliação)', amount: 200, type: 'income', date: '10/03' },
];

const maxRevenue = Math.max(...MOCK_REVENUE.map((r) => r.value));

export default function FinancialPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            Dashboard Financeiro
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">Visão geral financeira e contábil</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-[#111827] border border-[#1e293b] overflow-hidden">
            {(['week', 'month', 'quarter', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-xs font-medium transition-all ${
                  period === p ? 'bg-teal-500/20 text-teal-400' : 'text-[#6b7a8d] hover:text-white'
                }`}
              >
                {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : p === 'quarter' ? 'Trimestre' : 'Ano'}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 rounded-xl bg-[#111827] border border-[#1e293b] px-4 py-2.5 text-xs text-[#8899aa] hover:text-white transition-all">
            <Download className="h-3.5 w-3.5" /> Exportar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {MOCK_KPI.map((kpi) => {
          const Icon = kpi.icon;
          const colors: Record<string, { card: string; icon: string }> = {
            green: { card: 'from-green-500/20 to-green-500/5 border-green-500/20', icon: 'text-green-400' },
            red: { card: 'from-red-500/20 to-red-500/5 border-red-500/20', icon: 'text-red-400' },
            teal: { card: 'from-teal-500/20 to-teal-500/5 border-teal-500/20', icon: 'text-teal-400' },
            amber: { card: 'from-amber-500/20 to-amber-500/5 border-amber-500/20', icon: 'text-amber-400' },
          };
          const c = colors[kpi.color];
          return (
            <div key={kpi.label} className={`rounded-2xl bg-gradient-to-br ${c.card} border p-5 hover:scale-[1.02] transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-5 w-5 ${c.icon}`} />
                <span className={`flex items-center gap-1 text-xs font-medium ${kpi.trend === 'up' && kpi.color !== 'red' ? 'text-green-400' : kpi.trend === 'down' && kpi.color === 'amber' ? 'text-green-400' : 'text-red-400'}`}>
                  {kpi.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
              <p className="text-xs text-[#6b7a8d] mt-1">{kpi.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Revenue Chart */}
        <div className="col-span-2 rounded-2xl bg-[#111827] border border-[#1e293b] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-green-400" />
              Receita Mensal
            </h3>
          </div>
          <div className="flex items-end justify-between gap-3 h-48">
            {MOCK_REVENUE.map((r) => {
              const height = (r.value / maxRevenue) * 100;
              return (
                <div key={r.month} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] text-[#6b7a8d] font-mono">
                    {(r.value / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-teal-600 to-teal-400 transition-all hover:from-teal-500 hover:to-teal-300"
                    style={{ height: `${height}%`, minHeight: '8px' }}
                  />
                  <span className="text-[10px] text-[#4a5568]">{r.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="rounded-2xl bg-[#111827] border border-[#1e293b] p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <PieChart className="h-4 w-4 text-purple-400" />
            Despesas por Categoria
          </h3>
          {/* CSS Pie Chart */}
          <div className="flex justify-center mb-4">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                {MOCK_EXPENSES_BREAKDOWN.reduce((acc, item, i) => {
                  const offset = acc.offset;
                  const circumference = 2 * Math.PI * 40;
                  const strokeLen = (item.pct / 100) * circumference;
                  const colorMap: Record<string, string> = {
                    'bg-teal-400': '#2dd4bf',
                    'bg-blue-400': '#60a5fa',
                    'bg-purple-400': '#c084fc',
                    'bg-amber-400': '#fbbf24',
                    'bg-pink-400': '#f472b6',
                    'bg-gray-400': '#9ca3af',
                  };
                  acc.elements.push(
                    <circle
                      key={i}
                      cx="50" cy="50" r="40"
                      fill="none"
                      stroke={colorMap[item.color]}
                      strokeWidth="16"
                      strokeDasharray={`${strokeLen} ${circumference - strokeLen}`}
                      strokeDashoffset={-offset}
                      className="transition-all"
                    />
                  );
                  acc.offset += strokeLen;
                  return acc;
                }, { elements: [] as React.ReactNode[], offset: 0 }).elements}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-lg font-bold text-white">R$ 18,4k</p>
                  <p className="text-[9px] text-[#4a5568]">Total</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {MOCK_EXPENSES_BREAKDOWN.map((item) => (
              <div key={item.category} className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${item.color}`} />
                <span className="text-[10px] text-[#8899aa] flex-1 truncate">{item.category}</span>
                <span className="text-[10px] text-[#6b7a8d] font-mono">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="col-span-2 rounded-2xl bg-[#111827] border border-[#1e293b] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-teal-400" />
              Transações Recentes
            </h3>
            <Link href="/dental/invoices" className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1">
              Ver todas <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {MOCK_RECENT_TRANSACTIONS.map((tx, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl bg-[#0d1320] border border-[#1a2332] p-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'
                }`}>
                  {tx.type === 'income' ? (
                    <ArrowDownRight className="h-4 w-4 text-green-400 rotate-180" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-red-400 rotate-180" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate">{tx.desc}</p>
                  <p className="text-[10px] text-[#4a5568]">{tx.date}</p>
                </div>
                <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'income' ? '+' : '-'}R$ {Math.abs(tx.amount).toLocaleString('pt-BR')}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & AI Insights */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#111827] border border-[#1e293b] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              {[
                { label: 'Faturamento', icon: FileText, href: '/dental/invoices', color: 'text-blue-400' },
                { label: 'Despesas', icon: CreditCard, href: '/dental/expenses', color: 'text-red-400' },
                { label: 'Planejamento', icon: Target, href: '/dental/strategic', color: 'text-purple-400' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl bg-[#0d1320] border border-[#1a2332] p-3 hover:border-teal-500/20 transition-all"
                  >
                    <Icon className={`h-4 w-4 ${action.color}`} />
                    <span className="text-xs text-[#8899aa]">{action.label}</span>
                    <ChevronRight className="h-3 w-3 text-[#4a5568] ml-auto" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#D4A76A]/10 to-[#D4A76A]/5 border border-[#D4A76A]/20 p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-[#D4A76A]" />
              Insights IA
            </h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-xs text-[#c0c8d4] leading-relaxed">
                  Sua receita cresceu 12% este mês. O procedimento mais lucrativo foi <strong>Implantodontia</strong> com margem de 68%.
                </p>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-xs text-[#c0c8d4] leading-relaxed">
                  Sugestão: Considere aumentar o investimento em marketing digital para implantes, que apresenta o melhor ROI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
