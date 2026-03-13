'use client';

import { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Receipt,
  FileText,
  Calendar,
  BarChart3,
  PieChart,
  Plus,
  Download,
  FilePlus,
  ChevronDown,
  Wallet,
  ArrowRight,
} from 'lucide-react';

type Period = 'today' | 'week' | 'month' | 'quarter' | 'year';

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const kpiData: Record<
  Period,
  { revenue: number; revenueTrend: number; expenses: number; expensesTrend: number; profit: number; profitTrend: number; receivable: number; receivableTrend: number }
> = {
  today: { revenue: 4850, revenueTrend: 12.5, expenses: 1230, expensesTrend: -3.2, profit: 3620, profitTrend: 18.1, receivable: 2400, receivableTrend: -5.0 },
  week: { revenue: 28400, revenueTrend: 8.3, expenses: 9200, expensesTrend: 2.1, profit: 19200, profitTrend: 11.4, receivable: 7800, receivableTrend: -2.3 },
  month: { revenue: 124500, revenueTrend: 15.2, expenses: 42300, expensesTrend: 4.7, profit: 82200, profitTrend: 22.6, receivable: 31200, receivableTrend: -8.1 },
  quarter: { revenue: 368000, revenueTrend: 18.9, expenses: 128500, expensesTrend: 6.3, profit: 239500, profitTrend: 26.4, receivable: 54600, receivableTrend: -12.5 },
  year: { revenue: 1456000, revenueTrend: 21.3, expenses: 512000, expensesTrend: 8.9, profit: 944000, profitTrend: 28.7, receivable: 87300, receivableTrend: -15.2 },
};

const revenueChartData = [
  { label: 'Jan', value: 98000 },
  { label: 'Fev', value: 105000 },
  { label: 'Mar', value: 112000 },
  { label: 'Abr', value: 95000 },
  { label: 'Mai', value: 118000 },
  { label: 'Jun', value: 124500 },
  { label: 'Jul', value: 108000 },
  { label: 'Ago', value: 132000 },
  { label: 'Set', value: 127000 },
  { label: 'Out', value: 141000 },
  { label: 'Nov', value: 138000 },
  { label: 'Dez', value: 152000 },
];

const expenseCategories = [
  { name: 'Folha de Pagamento', value: 18500, color: '#0D9488', pct: 43.7 },
  { name: 'Material Odontologico', value: 8200, color: '#D4A76A', pct: 19.4 },
  { name: 'Aluguel', value: 5500, color: '#6366F1', pct: 13.0 },
  { name: 'Laboratorio', value: 4100, color: '#F59E0B', pct: 9.7 },
  { name: 'Marketing', value: 2800, color: '#EC4899', pct: 6.6 },
  { name: 'Utilidades', value: 1900, color: '#8B5CF6', pct: 4.5 },
  { name: 'Outros', value: 1300, color: '#94A3B8', pct: 3.1 },
];

const cashFlowTimeline = [
  { date: '01/06', inflow: 8200, outflow: 3100 },
  { date: '05/06', inflow: 12400, outflow: 5600 },
  { date: '10/06', inflow: 9800, outflow: 18500 },
  { date: '15/06', inflow: 15600, outflow: 4200 },
  { date: '20/06', inflow: 11300, outflow: 6800 },
  { date: '25/06', inflow: 18900, outflow: 3400 },
  { date: '30/06', inflow: 14200, outflow: 5200 },
];

const periodLabels: Record<Period, string> = {
  today: 'Hoje',
  week: 'Semana',
  month: 'Mes',
  quarter: 'Trimestre',
  year: 'Ano',
};

export default function DashboardFinancial() {
  const [period, setPeriod] = useState<Period>('month');
  const data = kpiData[period];
  const maxRevenue = Math.max(...revenueChartData.map((d) => d.value));
  const maxCashFlow = Math.max(...cashFlowTimeline.flatMap((d) => [d.inflow, d.outflow]));

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Painel Financeiro</h1>
          <p className="text-sm text-gray-500">Sbarzi Odontologia e Saude</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
            {(Object.keys(periodLabels) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  period === p
                    ? 'bg-[#0D9488] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Receita</span>
            <div className="w-9 h-9 rounded-lg bg-[#0D9488]/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#0D9488]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatBRL(data.revenue)}</p>
          <div className="flex items-center mt-2 text-sm">
            {data.revenueTrend >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={data.revenueTrend >= 0 ? 'text-emerald-500' : 'text-red-500'}>
              {Math.abs(data.revenueTrend)}%
            </span>
            <span className="text-gray-400 ml-1">vs periodo anterior</span>
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Despesas</span>
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatBRL(data.expenses)}</p>
          <div className="flex items-center mt-2 text-sm">
            {data.expensesTrend <= 0 ? (
              <ArrowDownRight className="w-4 h-4 text-emerald-500 mr-1" />
            ) : (
              <ArrowUpRight className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={data.expensesTrend <= 0 ? 'text-emerald-500' : 'text-red-500'}>
              {Math.abs(data.expensesTrend)}%
            </span>
            <span className="text-gray-400 ml-1">vs periodo anterior</span>
          </div>
        </div>

        {/* Profit */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Lucro</span>
            <div className="w-9 h-9 rounded-lg bg-[#D4A76A]/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#D4A76A]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatBRL(data.profit)}</p>
          <div className="flex items-center mt-2 text-sm">
            {data.profitTrend >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={data.profitTrend >= 0 ? 'text-emerald-500' : 'text-red-500'}>
              {Math.abs(data.profitTrend)}%
            </span>
            <span className="text-gray-400 ml-1">vs periodo anterior</span>
          </div>
        </div>

        {/* Accounts Receivable */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Contas a Receber</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatBRL(data.receivable)}</p>
          <div className="flex items-center mt-2 text-sm">
            {data.receivableTrend <= 0 ? (
              <ArrowDownRight className="w-4 h-4 text-emerald-500 mr-1" />
            ) : (
              <ArrowUpRight className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span className={data.receivableTrend <= 0 ? 'text-emerald-500' : 'text-red-500'}>
              {Math.abs(data.receivableTrend)}%
            </span>
            <span className="text-gray-400 ml-1">vs periodo anterior</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Nova Transacao
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          Gerar Relatorio
        </button>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
          <FilePlus className="w-4 h-4" />
          Criar Fatura
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#0D9488]" />
              <h3 className="font-semibold text-gray-800">Receita Mensal</h3>
            </div>
            <span className="text-xs text-gray-400">2025</span>
          </div>
          <div className="flex items-end gap-2 h-48">
            {revenueChartData.map((item) => {
              const heightPct = (item.value / maxRevenue) * 100;
              return (
                <div key={item.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {formatBRL(item.value / 1000)}k
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-full max-w-[32px] rounded-t-md bg-[#0D9488] hover:bg-[#0D9488]/80 transition-colors cursor-pointer"
                      style={{ height: `${heightPct}%`, minHeight: '4px' }}
                      title={formatBRL(item.value)}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-[#D4A76A]" />
            <h3 className="font-semibold text-gray-800">Despesas por Categoria</h3>
          </div>
          {/* CSS Pie Chart representation */}
          <div className="flex justify-center mb-4">
            <div className="relative w-36 h-36">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {(() => {
                  let cumulative = 0;
                  return expenseCategories.map((cat) => {
                    const dashArray = `${cat.pct} ${100 - cat.pct}`;
                    const dashOffset = 100 - cumulative;
                    cumulative += cat.pct;
                    return (
                      <circle
                        key={cat.name}
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="transparent"
                        stroke={cat.color}
                        strokeWidth="3.5"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-bold text-gray-800">{formatBRL(42300)}</span>
                <span className="text-[10px] text-gray-400">Total</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {expenseCategories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-gray-600">{cat.name}</span>
                </div>
                <span className="font-medium text-gray-800">{cat.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cash Flow Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[#0D9488]" />
            <h3 className="font-semibold text-gray-800">Fluxo de Caixa</h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#0D9488]" />
              <span className="text-gray-500">Entradas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-400" />
              <span className="text-gray-500">Saidas</span>
            </div>
          </div>
        </div>
        <div className="flex items-end gap-4 h-40">
          {cashFlowTimeline.map((item) => (
            <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex justify-center gap-1 items-end h-32">
                <div
                  className="flex-1 max-w-[20px] bg-[#0D9488] rounded-t-sm"
                  style={{ height: `${(item.inflow / maxCashFlow) * 100}%`, minHeight: '4px' }}
                  title={`Entrada: ${formatBRL(item.inflow)}`}
                />
                <div
                  className="flex-1 max-w-[20px] bg-red-400 rounded-t-sm"
                  style={{ height: `${(item.outflow / maxCashFlow) * 100}%`, minHeight: '4px' }}
                  title={`Saida: ${formatBRL(item.outflow)}`}
                />
              </div>
              <span className="text-[10px] text-gray-500">{item.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
