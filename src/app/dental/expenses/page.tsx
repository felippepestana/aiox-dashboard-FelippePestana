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
    teal: { bg: 'bg-teal-500/10', text: 'text-teal-400', icon: 'text-teal-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'text-blue-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', icon: 'text-purple-400' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'text-amber-400' },
    pink: { bg: 'bg-pink-500/10', text: 'text-pink-400', icon: 'text-pink-400' },
    gray: { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: 'text-gray-400' },
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            Controle de Despesas
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">Total do mês: {totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <button onClick={() => setShowNewExpense(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all">
          <Plus className="h-4 w-4" /> Nova Despesa
        </button>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {catTotals.map((cat) => {
          const Icon = cat.icon;
          const c = colorMap[cat.color];
          const pct = totalExpenses > 0 ? ((cat.total / totalExpenses) * 100).toFixed(1) : '0';
          return (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(filterCategory === cat.id ? 'all' : cat.id)}
              className={`rounded-xl border p-3 transition-all text-left ${
                filterCategory === cat.id ? `${c.bg} border-current ${c.text}` : 'bg-[#111827] border-[#1e293b] hover:border-[#2d3748]'
              }`}
            >
              <Icon className={`h-4 w-4 mb-2 ${filterCategory === cat.id ? c.icon : 'text-[#4a5568]'}`} />
              <p className="text-sm font-bold text-white">{cat.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
              <p className="text-[10px] text-[#6b7a8d] truncate">{cat.label}</p>
              <div className="mt-2 h-1 rounded-full bg-[#1a2332]">
                <div className={`h-full rounded-full ${c.bg.replace('/10', '')}`} style={{ width: `${pct}%` }} />
              </div>
              <p className="text-[9px] text-[#4a5568] mt-1">{pct}%</p>
            </button>
          );
        })}
      </div>

      {/* Budget vs Actual */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2">
          <div className="rounded-2xl bg-[#111827] border border-[#1e293b] p-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-red-400" />
              Comparativo Mensal (Orçado vs Realizado)
            </h3>
            <div className="space-y-4">
              {MONTHLY_COMPARISON.map((m) => (
                <div key={m.month} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#8899aa] w-8">{m.month}</span>
                    <span className="text-[#6b7a8d]">
                      {m.current.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      <span className={`ml-2 ${m.current > m.previous ? 'text-red-400' : 'text-green-400'}`}>
                        ({m.current > m.previous ? '+' : ''}{(((m.current - m.previous) / m.previous) * 100).toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="flex gap-1 h-4">
                    <div className="h-full rounded-l bg-[#1e293b] rounded-r" style={{ width: `${(m.previous / 20000) * 100}%` }}>
                      <div className="h-full rounded bg-blue-500/40" style={{ width: '100%' }} />
                    </div>
                    <div className="h-full rounded bg-red-400/40" style={{ width: `${((m.current - m.previous) / 20000) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4">
              <div className="flex items-center gap-2 text-[10px] text-[#6b7a8d]">
                <div className="h-2 w-4 rounded bg-blue-500/40" /> Orçado
              </div>
              <div className="flex items-center gap-2 text-[10px] text-[#6b7a8d]">
                <div className="h-2 w-4 rounded bg-red-400/40" /> Excedente
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-[#111827] border border-[#1e293b] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Despesas Recorrentes</h3>
          <div className="space-y-3">
            {MOCK_EXPENSES.filter(e => e.recurring).map((e) => (
              <div key={e.id} className="flex items-center justify-between rounded-xl bg-[#0d1320] border border-[#1a2332] p-3">
                <div>
                  <p className="text-xs text-white">{e.description}</p>
                  <p className="text-[10px] text-[#4a5568]">Mensal</p>
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
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
        <input type="text" placeholder="Buscar despesa..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-[#111827] border border-[#1e293b] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all" />
      </div>

      {/* Expense List */}
      <div className="space-y-2">
        {filtered.map((expense) => {
          const cat = CATEGORIES.find((c) => c.id === expense.category);
          const Icon = cat?.icon || CreditCard;
          const c = colorMap[cat?.color || 'gray'];
          return (
            <div key={expense.id} className="flex items-center gap-4 rounded-2xl bg-[#111827] border border-[#1e293b] p-4 hover:border-[#2d3748] transition-all">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.bg}`}>
                <Icon className={`h-5 w-5 ${c.icon}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{expense.description}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[10px] text-[#4a5568]">{expense.vendor}</span>
                  <span className="text-[10px] text-[#4a5568]">{new Date(expense.date).toLocaleDateString('pt-BR')}</span>
                  {expense.recurring && <span className="text-[10px] text-blue-400">Recorrente</span>}
                </div>
              </div>
              <p className="text-sm font-semibold text-red-400">
                -{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          );
        })}
      </div>

      {/* New Expense Modal */}
      {showNewExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#111827] border border-[#1e293b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Nova Despesa</h2>
              <button onClick={() => setShowNewExpense(false)} className="text-[#4a5568] hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#8899aa] mb-1 block">Descrição</label>
                <input type="text" placeholder="Descreva a despesa..." className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#8899aa] mb-1 block">Valor (R$)</label>
                  <input type="number" placeholder="0,00" className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8899aa] mb-1 block">Data</label>
                  <input type="date" className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#8899aa] mb-2 block">Categoria</label>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button key={cat.id} className="flex items-center gap-2 rounded-xl bg-[#0d1320] border border-[#1a2332] p-2.5 hover:border-teal-500/30 transition-all text-left">
                        <CatIcon className={`h-3.5 w-3.5 ${colorMap[cat.color].icon}`} />
                        <span className="text-[10px] text-[#8899aa]">{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#8899aa] mb-1 block">Fornecedor</label>
                <input type="text" placeholder="Nome do fornecedor..." className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewExpense(false)} className="flex-1 rounded-xl bg-[#1e293b] px-4 py-2.5 text-sm text-[#8899aa] hover:text-white transition-all">Cancelar</button>
              <button onClick={() => setShowNewExpense(false)} className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
