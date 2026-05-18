'use client';

import { useState } from 'react';
import {
  CreditCard, Plus, Search, TrendingDown, Filter, Calendar,
  Package, Home, Users, Megaphone, Wrench, Beaker, X,
  BarChart3, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  recurring: boolean;
  vendor: string;
}

const CATEGORIES = [
  { id: 'supplies', label: 'Materiais e Insumos', icon: Package, color: 'teal' },
  { id: 'rent', label: 'Aluguel e Condomínio', icon: Home, color: 'blue' },
  { id: 'payroll', label: 'Folha de Pagamento', icon: Users, color: 'purple' },
  { id: 'lab', label: 'Laboratório', icon: Beaker, color: 'amber' },
  { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'pink' },
  { id: 'maintenance', label: 'Manutenção', icon: Wrench, color: 'gray' },
];

const MOCK_EXPENSES: Expense[] = [
  { id: '1', description: 'Resinas compostas e materiais restauradores', category: 'supplies', amount: 1890, date: '2026-03-12', recurring: false, vendor: 'Dental Rondônia' },
  { id: '2', description: 'Aluguel do consultório - Março/2026', category: 'rent', amount: 4500, date: '2026-03-05', recurring: true, vendor: 'Imobiliária Porto Velho' },
  { id: '3', description: 'Salários e encargos - Março/2026', category: 'payroll', amount: 3800, date: '2026-03-05', recurring: true, vendor: 'Folha de Pagamento' },
  { id: '4', description: 'Facetas de porcelana - 4 unidades', category: 'lab', amount: 2400, date: '2026-03-10', recurring: false, vendor: 'Laboratório Premium' },
  { id: '5', description: 'Campanha Instagram - Março', category: 'marketing', amount: 800, date: '2026-03-01', recurring: true, vendor: 'Agência Digital' },
  { id: '6', description: 'Manutenção do compressor', category: 'maintenance', amount: 450, date: '2026-03-08', recurring: false, vendor: 'TecDental Assistência' },
  { id: '7', description: 'Anestésicos e agulhas descartáveis', category: 'supplies', amount: 680, date: '2026-03-07', recurring: false, vendor: 'Dental Cremer' },
  { id: '8', description: 'Prótese sobre implante - paciente J.Oliveira', category: 'lab', amount: 1800, date: '2026-03-11', recurring: false, vendor: 'Laboratório Premium' },
];

const MONTHLY_COMPARISON = [
  { month: 'Jan', current: 16800, previous: 15200 },
  { month: 'Fev', current: 17500, previous: 16100 },
  { month: 'Mar', current: 18420, previous: 16800 },
];

export default function ExpensesPage() {
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showNewExpense, setShowNewExpense] = useState(false);

  const filtered = MOCK_EXPENSES.filter((e) => {
    const matchSearch = e.description.toLowerCase().includes(search.toLowerCase()) || e.vendor.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === 'all' || e.category === filterCategory;
    return matchSearch && matchCat;
  });

  const totalExpenses = MOCK_EXPENSES.reduce((s, e) => s + e.amount, 0);
  const catTotals = CATEGORIES.map((cat) => ({
    ...cat,
    total: MOCK_EXPENSES.filter((e) => e.category === cat.id).reduce((s, e) => s + e.amount, 0),
  }));

  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    teal: { bg: 'bg-[#C4956A]/10', text: 'text-[#C4956A]', icon: 'text-[#C4956A]' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'text-blue-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'text-purple-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'text-amber-400' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', icon: 'text-pink-400' },
    gray: { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: 'text-gray-400' },
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            Controle de Despesas
          </h1>
          <p className="text-sm text-[#86868B] mt-1">Total do mês: {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <button onClick={() => setShowNewExpense(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C4956A] to-[#A0784C] px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-[#C4956A]/20 transition-all">
          <Plus className="h-4 w-4" /> Nova Despesa
        </button>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-6">
        {catTotals.map((cat) => {
          const Icon = cat.icon;
          const c = colorMap[cat.color];
          const pct = totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(1) : '0';
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(filterCategory === cat.id ? 'all' : cat.id)}
              className={`rounded-xl border p-3 transition-all text-left ${
                filterCategory === cat.id ? `${c.bg} border-current ${c.text}` : 'bg-white border-[#E5E5EA] hover:border-[#D1D1D6]'
              }`}
            >
              <Icon className={`h-4 w-4 mb-2 ${filterCategory === cat.id ? c.icon : 'text-[#AEAEB2]'}`} />
              <p className="text-sm font-bold text-[#1D1D1F]">{cat.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              <p className="text-[10px] text-[#86868B] truncate">{cat.label}</p>
              <div className="mt-2 h-1 rounded-full bg-[#E8E8ED]">
                <div className={`h-full rounded-full ${c.bg.replace('/10', '')}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[9px] text-[#AEAEB2] mt-1">{pct}%</p>
            </button>
          );
        })}
      </div>

      {/* Budget vs Actual */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
        <div className="col-span-1 lg:col-span-2">
          <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6">
            <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-red-400" />
              Comparativo Mensal (Orçado vs Realizado)
            </h3>
            <div className="space-y-4">
              {MONTHLY_COMPARISON.map((m) => (
                <div key={m.month} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6E6E73] w-8">{m.month}</span>
                    <span className="text-[#86868B]">
                      {m.current.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      <span className={`ml-2 ${m.current > m.previous ? 'text-red-400' : 'text-green-400'}`}>
                        ({m.current > m.previous ? '+' : ''}{(((m.current - m.previous) / m.previous) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-1 h-4">
                    <div className="h-full rounded-l bg-[#E5E5EA] rounded-r" style={{ width: `${(m.previous / 20000) * 100}%` }}>
                      <div className="h-full rounded bg-blue-500/40" style={{ width: '100%' }} />
                    </div>
                    <div className="h-full rounded bg-red-400/40" style={{ width: `${((m.current - m.previous) / 20000) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 text-[10px] text-[#86868B]">
                <div className="h-2 w-4 rounded bg-blue-500/40" /> Orçado
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#86868B]">
                <div className="h-2 w-4 rounded bg-red-400/40" /> Excedente
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6">
          <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4">Despesas Recorrentes</h3>
          <div className="space-y-3">
            {MOCK_EXPENSES.filter(e => e.recurring).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-3">
                <div>
                  <p className="text-xs text-[#1D1D1F]">{e.description}</p>
                  <p className="text-[10px] text-[#AEAEB2]">Mensal</p>
                </div>
                <p className="text-xs font-medium text-red-400">
                  {e.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-full md:max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AEAEB2]" />
        <input type="text" placeholder="Buscar despesa..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-white border border-[#E5E5EA] pl-10 pr-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#AEAEB2] focus:border-[#C4956A]/50 focus:outline-none transition-all" />
      </div>

      {/* Expense List */}
      <div className="space-y-2">
        {filtered.map((expense) => {
          const cat = CATEGORIES.find((c) => c.id === expense.category);
          const Icon = cat?.icon || CreditCard;
          const c = colorMap[cat?.color || 'gray'];
          return (
            <div key={expense.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl bg-white border border-[#E5E5EA] p-4 hover:border-[#D1D1D6] transition-all">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0 ${c.bg}`}>
                  <Icon className={`h-5 w-5 ${c.icon}`} />
                </div>
                <div className="flex-1 min-w-0 sm:hidden">
                  <p className="text-sm text-[#1D1D1F] truncate">{expense.description}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-[10px] text-[#AEAEB2]">{expense.vendor}</span>
                    <span className="text-[10px] text-[#AEAEB2]">{new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                    {expense.recurring && <span className="text-[10px] text-blue-400">Recorrente</span>}
                  </div>
                </div>
                <p className="text-sm font-semibold text-red-400 sm:hidden ml-auto">
                  -{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <div className="flex-1 min-w-0 hidden sm:block">
                <p className="text-sm text-[#1D1D1F] truncate">{expense.description}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-[#AEAEB2]">{expense.vendor}</span>
                  <span className="text-[10px] text-[#AEAEB2]">{new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                  {expense.recurring && <span className="text-[10px] text-blue-400">Recorrente</span>}
                </div>
              </div>
              <p className="text-sm font-semibold text-red-400 hidden sm:block">
                -{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          );
        })}
      </div>

      {/* New Expense Modal */}
      {showNewExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="w-[95vw] max-w-lg rounded-2xl bg-white border border-[#E5E5EA] p-4 md:p-6 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
              <h2 className="text-lg font-bold text-[#1D1D1F]">Nova Despesa</h2>
              <button onClick={() => setShowNewExpense(false)} className="text-[#AEAEB2] hover:text-[#1D1D1F]"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#6E6E73] mb-1 block">Descrição</label>
                <input type="text" placeholder="Descreva a despesa..." className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#AEAEB2] focus:border-[#C4956A]/50 focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="text-xs font-medium text-[#6E6E73] mb-1 block">Valor (R$)</label>
                  <input type="number" placeholder="0,00" className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] focus:border-[#C4956A]/50 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6E6E73] mb-1 block">Data</label>
                  <input type="date" className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] focus:border-[#C4956A]/50 focus:outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6E6E73] mb-2 block">Categoria</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button key={cat.id} className="flex items-center gap-2 rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-2.5 hover:border-[#C4956A]/30 transition-all text-left">
                        <CatIcon className={`h-3.5 w-3.5 ${colorMap[cat.color].icon}`} />
                        <span className="text-[10px] text-[#6E6E73]">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6E6E73] mb-1 block">Fornecedor</label>
                <input type="text" placeholder="Nome do fornecedor..." className="w-full rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] px-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#AEAEB2] focus:border-[#C4956A]/50 focus:outline-none transition-all" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewExpense(false)} className="flex-1 rounded-xl bg-[#E5E5EA] px-4 py-2.5 text-sm text-[#6E6E73] hover:text-[#1D1D1F] transition-all">Cancelar</button>
              <button onClick={() => setShowNewExpense(false)} className="flex-1 rounded-xl bg-gradient-to-r from-[#C4956A] to-[#A0784C] px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-[#C4956A]/20 transition-all">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
