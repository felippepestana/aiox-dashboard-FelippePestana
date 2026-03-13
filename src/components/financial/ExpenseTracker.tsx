'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  ShoppingCart,
  Wrench,
  Home,
  Users,
  Megaphone,
  Zap,
  FlaskConical,
  MoreHorizontal,
  Calendar,
  X,
  Repeat,
  PieChart,
  BarChart3,
  Filter,
  ChevronDown,
  Edit2,
  Trash2,
  AlertCircle,
  Target,
} from 'lucide-react';

type Category = 'supplies' | 'equipment' | 'rent' | 'payroll' | 'marketing' | 'utilities' | 'lab' | 'other';

interface Expense {
  id: string;
  description: string;
  category: Category;
  amount: number;
  date: string;
  isRecurring: boolean;
  recurringFreq?: string;
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const categoryConfig: Record<Category, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  supplies: { label: 'Material', icon: <ShoppingCart className="w-4 h-4" />, color: 'text-[#0D9488]', bg: 'bg-[#0D9488]/10' },
  equipment: { label: 'Equipamentos', icon: <Wrench className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
  rent: { label: 'Aluguel', icon: <Home className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
  payroll: { label: 'Folha de Pagamento', icon: <Users className="w-4 h-4" />, color: 'text-[#D4A76A]', bg: 'bg-[#D4A76A]/10' },
  marketing: { label: 'Marketing', icon: <Megaphone className="w-4 h-4" />, color: 'text-pink-600', bg: 'bg-pink-50' },
  utilities: { label: 'Utilidades', icon: <Zap className="w-4 h-4" />, color: 'text-amber-600', bg: 'bg-amber-50' },
  lab: { label: 'Laboratorio', icon: <FlaskConical className="w-4 h-4" />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  other: { label: 'Outros', icon: <MoreHorizontal className="w-4 h-4" />, color: 'text-gray-500', bg: 'bg-gray-100' },
};

const mockExpenses: Expense[] = [
  { id: '1', description: 'Resina Composta 3M Z350', category: 'supplies', amount: 420, date: '2025-06-15', isRecurring: false },
  { id: '2', description: 'Luvas e Mascaras Descartaveis', category: 'supplies', amount: 680, date: '2025-06-14', isRecurring: true, recurringFreq: 'Mensal' },
  { id: '3', description: 'Manutencao Autoclave', category: 'equipment', amount: 1200, date: '2025-06-13', isRecurring: false },
  { id: '4', description: 'Aluguel Sala Comercial', category: 'rent', amount: 5500, date: '2025-06-01', isRecurring: true, recurringFreq: 'Mensal' },
  { id: '5', description: 'Salarios - Equipe Clinica', category: 'payroll', amount: 14500, date: '2025-06-05', isRecurring: true, recurringFreq: 'Mensal' },
  { id: '6', description: 'Salarios - Administrativo', category: 'payroll', amount: 4000, date: '2025-06-05', isRecurring: true, recurringFreq: 'Mensal' },
  { id: '7', description: 'Campanha Instagram Ads', category: 'marketing', amount: 1500, date: '2025-06-10', isRecurring: true, recurringFreq: 'Mensal' },
  { id: '8', description: 'Producao de Conteudo', category: 'marketing', amount: 1300, date: '2025-06-12', isRecurring: true, recurringFreq: 'Mensal' },
  { id: '9', description: 'Conta de Energia', category: 'utilities', amount: 890, date: '2025-06-08', isRecurring: true, recurringFreq: 'Mensal' },
  { id: '10', description: 'Internet e Telefone', category: 'utilities', amount: 350, date: '2025-06-08', isRecurring: true, recurringFreq: 'Mensal' },
  { id: '11', description: 'Agua', category: 'utilities', amount: 220, date: '2025-06-08', isRecurring: true, recurringFreq: 'Mensal' },
  { id: '12', description: 'Proteses - Lab Dental Pro', category: 'lab', amount: 2800, date: '2025-06-11', isRecurring: false },
  { id: '13', description: 'Coroas em Porcelana', category: 'lab', amount: 1300, date: '2025-06-09', isRecurring: false },
  { id: '14', description: 'Brocas Diamantadas KG Sorensen', category: 'supplies', amount: 380, date: '2025-06-07', isRecurring: false },
  { id: '15', description: 'Sensor Radiografico Digital', category: 'equipment', amount: 8500, date: '2025-06-03', isRecurring: false },
  { id: '16', description: 'Software de Gestao', category: 'other', amount: 450, date: '2025-06-01', isRecurring: true, recurringFreq: 'Mensal' },
];

const budgetData: { category: Category; budget: number; actual: number }[] = [
  { category: 'payroll', budget: 20000, actual: 18500 },
  { category: 'supplies', budget: 3000, actual: 1480 },
  { category: 'rent', budget: 5500, actual: 5500 },
  { category: 'lab', budget: 5000, actual: 4100 },
  { category: 'marketing', budget: 3000, actual: 2800 },
  { category: 'utilities', budget: 1800, actual: 1460 },
  { category: 'equipment', budget: 2000, actual: 9700 },
  { category: 'other', budget: 1000, actual: 450 },
];

const monthlyComparison = [
  { month: 'Jan', amount: 38200 },
  { month: 'Fev', amount: 36800 },
  { month: 'Mar', amount: 41500 },
  { month: 'Abr', amount: 35900 },
  { month: 'Mai', amount: 39400 },
  { month: 'Jun', amount: 42300 },
];

type ViewMode = 'list' | 'add';

export default function ExpenseTracker() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBudget, setShowBudget] = useState(false);

  // Form state
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('supplies');
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newRecurring, setNewRecurring] = useState(false);
  const [newRecurringFreq, setNewRecurringFreq] = useState('Mensal');

  const filtered = mockExpenses.filter((e) => {
    const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
    const matchSearch = e.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const totalExpenses = mockExpenses.reduce((s, e) => s + e.amount, 0);
  const recurringTotal = mockExpenses.filter((e) => e.isRecurring).reduce((s, e) => s + e.amount, 0);
  const maxMonth = Math.max(...monthlyComparison.map((m) => m.amount));

  const categoryTotals = Object.keys(categoryConfig).map((cat) => {
    const total = mockExpenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0);
    return { category: cat as Category, total };
  }).sort((a, b) => b.total - a.total);

  const handleSubmit = () => {
    setViewMode('list');
    setNewDesc('');
    setNewCategory('supplies');
    setNewAmount('');
    setNewDate('');
    setNewRecurring(false);
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Controle de Despesas</h1>
          <p className="text-sm text-gray-500">Sbarzi Odontologia e Saude</p>
        </div>
        <button
          onClick={() => setViewMode(viewMode === 'add' ? 'list' : 'add')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors shadow-sm"
        >
          {viewMode === 'add' ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {viewMode === 'add' ? 'Cancelar' : 'Nova Despesa'}
        </button>
      </div>

      {/* Add Expense Form */}
      {viewMode === 'add' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-4">Adicionar Despesa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Descricao</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Ex: Material de escritorio"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Category)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] bg-white"
              >
                {Object.entries(categoryConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Valor (R$)</label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Data</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newRecurring}
                  onChange={(e) => setNewRecurring(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#0D9488] focus:ring-[#0D9488]"
                />
                <span className="text-sm text-gray-600">Recorrente</span>
              </label>
              {newRecurring && (
                <select
                  value={newRecurringFreq}
                  onChange={(e) => setNewRecurringFreq(e.target.value)}
                  className="px-2 py-1 border border-gray-200 rounded-md text-xs bg-white"
                >
                  <option>Semanal</option>
                  <option>Mensal</option>
                  <option>Trimestral</option>
                  <option>Anual</option>
                </select>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Salvar Despesa
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Total do Mes</span>
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatBRL(totalExpenses)}</p>
          <div className="flex items-center mt-2 text-sm">
            <ArrowUpRight className="w-4 h-4 text-red-500 mr-1" />
            <span className="text-red-500">4.7%</span>
            <span className="text-gray-400 ml-1">vs mes anterior</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Recorrentes</span>
            <div className="w-9 h-9 rounded-lg bg-[#0D9488]/10 flex items-center justify-center">
              <Repeat className="w-5 h-5 text-[#0D9488]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">{formatBRL(recurringTotal)}</p>
          <p className="text-xs text-gray-400 mt-2">
            {mockExpenses.filter((e) => e.isRecurring).length} despesas recorrentes
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-500">Media Mensal</span>
            <div className="w-9 h-9 rounded-lg bg-[#D4A76A]/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-[#D4A76A]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {formatBRL(monthlyComparison.reduce((s, m) => s + m.amount, 0) / monthlyComparison.length)}
          </p>
          <p className="text-xs text-gray-400 mt-2">Ultimos 6 meses</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-[#0D9488]" />
            <h3 className="font-semibold text-gray-800">Comparativo Mensal</h3>
          </div>
          <div className="flex items-end gap-3 h-40">
            {monthlyComparison.map((item) => {
              const heightPct = (item.amount / maxMonth) * 100;
              return (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-gray-400 font-medium">
                    {(item.amount / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full flex justify-center">
                    <div
                      className="w-full max-w-[40px] rounded-t-md bg-red-400 hover:bg-red-300 transition-colors cursor-pointer"
                      style={{ height: `${heightPct}%`, minHeight: '4px' }}
                      title={formatBRL(item.amount)}
                    />
                  </div>
                  <span className="text-[10px] text-gray-500">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-[#D4A76A]" />
            <h3 className="font-semibold text-gray-800">Gastos por Categoria</h3>
          </div>
          <div className="space-y-3">
            {categoryTotals.filter((c) => c.total > 0).map((item) => {
              const cfg = categoryConfig[item.category];
              const pct = (item.total / totalExpenses) * 100;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-md ${cfg.bg} flex items-center justify-center ${cfg.color}`}>
                        {cfg.icon}
                      </div>
                      <span className="text-gray-700 font-medium">{cfg.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-gray-800">{formatBRL(item.total)}</span>
                      <span className="text-xs text-gray-400 ml-2">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden ml-9">
                    <div
                      className="h-full rounded-full bg-[#0D9488]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Budget vs Actual */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[#0D9488]" />
            <h3 className="font-semibold text-gray-800">Orcamento vs Realizado</h3>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#0D9488]" />
              <span className="text-gray-500">Realizado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-gray-200" />
              <span className="text-gray-500">Orcado</span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {budgetData.map((item) => {
            const cfg = categoryConfig[item.category];
            const pctUsed = (item.actual / item.budget) * 100;
            const overBudget = item.actual > item.budget;
            return (
              <div key={item.category} className="flex items-center gap-4">
                <div className="w-28 flex items-center gap-2 shrink-0">
                  <div className={`w-6 h-6 rounded-md ${cfg.bg} flex items-center justify-center ${cfg.color}`}>
                    {cfg.icon}
                  </div>
                  <span className="text-xs font-medium text-gray-600 truncate">{cfg.label}</span>
                </div>
                <div className="flex-1">
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all ${overBudget ? 'bg-red-400' : 'bg-[#0D9488]'}`}
                      style={{ width: `${Math.min(pctUsed, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="w-36 text-right shrink-0 flex items-center justify-end gap-2">
                  <span className={`text-xs font-semibold ${overBudget ? 'text-red-600' : 'text-gray-800'}`}>
                    {formatBRL(item.actual)}
                  </span>
                  <span className="text-xs text-gray-400">/ {formatBRL(item.budget)}</span>
                  {overBudget && <AlertCircle className="w-3.5 h-3.5 text-red-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters and Expense List */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar despesas..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
        >
          <option value="all">Todas as categorias</option>
          {Object.entries(categoryConfig).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4">Despesa</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4 hidden sm:table-cell">Categoria</th>
              <th className="text-left text-xs font-semibold text-gray-500 py-3 px-4 hidden md:table-cell">Data</th>
              <th className="text-center text-xs font-semibold text-gray-500 py-3 px-4 hidden lg:table-cell">Recorrente</th>
              <th className="text-right text-xs font-semibold text-gray-500 py-3 px-4">Valor</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((expense) => {
              const cfg = categoryConfig[expense.category];
              return (
                <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-gray-800">{expense.description}</span>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="text-sm text-gray-500">
                      {new Date(expense.date).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center hidden lg:table-cell">
                    {expense.isRecurring ? (
                      <span className="inline-flex items-center gap-1 text-xs text-[#0D9488]">
                        <Repeat className="w-3.5 h-3.5" /> {expense.recurringFreq}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Avulsa</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-sm font-semibold text-gray-800">{formatBRL(expense.amount)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhuma despesa encontrada</p>
          </div>
        )}
      </div>
    </div>
  );
}
