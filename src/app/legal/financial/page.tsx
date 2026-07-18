'use client';

import { PlanGate } from '@/components/legal/PlanGate';
import { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  Plus,
  X,
  Save,
  Activity,
} from 'lucide-react';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import type { LegalTransactionType, LegalTransactionCategory } from '@/types/legal';
import { CashFlowForecast } from '@/components/legal/CashFlowForecast';
import {
  PageHeader,
  StatCardGrid,
  DataTable,
  EmptyState,
} from '@/components/legal/shared';
import type { ColumnDef } from '@/components/legal/shared';

const CATEGORIES: { value: LegalTransactionCategory; label: string; type: LegalTransactionType }[] = [
  { value: 'honorario_contratual', label: 'Honorário Contratual', type: 'income' },
  { value: 'honorario_sucumbencial', label: 'Honorário Sucumbencial', type: 'income' },
  { value: 'honorario_exitum', label: 'Honorário Ad Exitum', type: 'income' },
  { value: 'custas_judiciais', label: 'Custas Judiciais', type: 'expense' },
  { value: 'emolumentos', label: 'Emolumentos', type: 'expense' },
  { value: 'pericia', label: 'Perícia', type: 'expense' },
  { value: 'salario', label: 'Salário', type: 'expense' },
  { value: 'aluguel', label: 'Aluguel', type: 'expense' },
  { value: 'tecnologia', label: 'Tecnologia', type: 'expense' },
  { value: 'marketing_legal', label: 'Marketing', type: 'expense' },
  { value: 'outro', label: 'Outro', type: 'income' },
];

type ActiveTab = 'overview' | 'forecast';

type TransactionRow = {
  id: string;
  date: string;
  type: LegalTransactionType;
  category: string;
  description: string;
  amount: number;
};

const categoryLabels: Record<string, string> = {
  honorario_contratual: 'Honorario Contratual',
  honorario_sucumbencial: 'Honorario Sucumbencial',
  honorario_exitum: 'Honorario Ad Exitum',
  custas_judiciais: 'Custas Judiciais',
  emolumentos: 'Emolumentos',
  pericia: 'Pericia',
  salario: 'Salario',
  aluguel: 'Aluguel',
  tecnologia: 'Tecnologia',
  marketing_legal: 'Marketing',
  imposto_irpj: 'IRPJ',
  imposto_csll: 'CSLL',
  imposto_iss: 'ISS',
  imposto_pis_cofins: 'PIS/COFINS',
  provisao: 'Provisao',
  outro: 'Outro',
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

function FinancialPageContent() {
  const {
    transactions,
    honorarios,
    invoices,
    getTotalRevenue,
    getTotalExpenses,
    getProfit,
    getOutstandingHonorarios,
    addTransaction,
  } = useLegalFinancialStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [showForm, setShowForm] = useState(false);
  const [txnForm, setTxnForm] = useState({
    type: 'income' as LegalTransactionType,
    category: 'honorario_contratual' as LegalTransactionCategory,
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const totalRevenue = getTotalRevenue();
  const totalExpenses = getTotalExpenses();
  const profit = getProfit();
  const outstandingHonorarios = getOutstandingHonorarios();

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactions]);

  const tableData: TransactionRow[] = useMemo(() => {
    return recentTransactions.map((txn) => ({
      id: txn.id,
      date: txn.date,
      type: txn.type,
      category: txn.category,
      description: txn.description || '',
      amount: txn.amount,
    }));
  }, [recentTransactions]);

  const statCards = [
    {
      label: 'Receita Total',
      value: formatCurrency(totalRevenue),
      icon: <TrendingUp className="h-5 w-5" />,
      color: '#4ADE80',
    },
    {
      label: 'Despesas',
      value: formatCurrency(totalExpenses),
      icon: <TrendingDown className="h-5 w-5" />,
      color: '#F87171',
    },
    {
      label: 'Lucro',
      value: formatCurrency(profit),
      icon: <Wallet className="h-5 w-5" />,
      color: profit >= 0 ? '#34D399' : '#F87171',
    },
    {
      label: 'Honorarios Pendentes',
      value: formatCurrency(outstandingHonorarios),
      icon: <Receipt className="h-5 w-5" />,
      color: '#D4AF37',
    },
  ];

  const transactionColumns: ColumnDef<TransactionRow>[] = [
    {
      key: 'date',
      label: 'Data',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-[#6b7a8d]">{formatDate(String(value))}</span>
      ),
    },
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      render: (value) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            value === 'income'
              ? 'bg-green-500/10 text-green-400'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {value === 'income' ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {value === 'income' ? 'Receita' : 'Despesa'}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Categoria',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
          {categoryLabels[String(value)] || String(value)}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Descrição',
      render: (value) => (
        <span className="text-sm text-white max-w-[200px] truncate block">{String(value)}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Valor',
      sortable: true,
      cellClassName: 'text-right',
      headerClassName: 'text-right',
      render: (value, row) => (
        <span
          className={`text-sm font-medium ${
            row.type === 'income' ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {row.type === 'income' ? '+' : '-'}
          {formatCurrency(Number(value))}
        </span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      <PageHeader
        title="Dashboard Financeiro"
        subtitle="Visao geral das financas do escritorio"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Financeiro', href: '/legal/financial' },
        ]}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" /> Nova Transação
          </button>
        }
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-lg border border-[#1a2332] bg-[#0d1320] p-1 w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-black'
              : 'text-[#6b7a8d] hover:text-white'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('forecast')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'forecast'
              ? 'bg-amber-500 text-black'
              : 'text-[#6b7a8d] hover:text-white'
          }`}
        >
          <Activity className="h-4 w-4" />
          Projeção de Fluxo de Caixa
        </button>
      </div>

      {/* Transaction Form — only in overview tab */}
      {showForm && activeTab === 'overview' && (
        <div className="rounded-xl border border-amber-500/20 bg-[#0d1320] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Nova Transação</h2>
            <button onClick={() => setShowForm(false)} className="text-[#6b7a8d] hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Tipo *</label>
              <div className="flex gap-2">
                <button onClick={() => setTxnForm(f => ({ ...f, type: 'income' }))}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${txnForm.type === 'income' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-[#6b7a8d] border border-[#1a2332]'}`}>
                  Receita
                </button>
                <button onClick={() => setTxnForm(f => ({ ...f, type: 'expense' }))}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${txnForm.type === 'expense' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-[#6b7a8d] border border-[#1a2332]'}`}>
                  Despesa
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Categoria *</label>
              <select value={txnForm.category} onChange={(e) => setTxnForm(f => ({ ...f, category: e.target.value as LegalTransactionCategory }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
                {CATEGORIES.filter(c => c.type === txnForm.type || c.value === 'outro').map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Valor (R$) *</label>
              <input type="number" value={txnForm.amount} onChange={(e) => setTxnForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="1000" min="0" step="0.01"
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Data *</label>
              <input type="date" value={txnForm.date} onChange={(e) => setTxnForm(f => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Descrição</label>
              <input type="text" value={txnForm.description} onChange={(e) => setTxnForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição..."
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#1a2332]">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors">Cancelar</button>
            <button
              onClick={() => {
                if (!txnForm.amount || !txnForm.date) return;
                addTransaction({
                  type: txnForm.type,
                  category: txnForm.category,
                  amount: parseFloat(txnForm.amount),
                  description: txnForm.description,
                  date: txnForm.date,
                });
                setTxnForm({ type: 'income', category: 'honorario_contratual', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
                setShowForm(false);
              }}
              disabled={!txnForm.amount || !txnForm.date}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" /> Salvar
            </button>
          </div>
        </div>
      )}

      {/* ── Overview Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          <StatCardGrid cards={statCards} />

          {/* Recent Transactions */}
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-amber-400" />
              Ultimas Transacoes
            </h2>

            {recentTransactions.length === 0 ? (
              <EmptyState
                icon={<DollarSign className="h-8 w-8" />}
                title="Nenhuma transação registrada"
                description="Adicione a primeira transação para começar."
                action={{ label: 'Nova Transação', onClick: () => setShowForm(true) }}
              />
            ) : (
              <DataTable<TransactionRow>
                columns={transactionColumns}
                data={tableData}
                paginated
                pageSize={10}
                emptyMessage="Nenhuma transacao registrada."
              />
            )}
          </div>
        </>
      )}

      {/* ── Forecast Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'forecast' && (
        <CashFlowForecast
          transactions={transactions}
          honorarios={honorarios}
          invoices={invoices}
        />
      )}
    </div>
  );
}

/** Entry point gated by subscription plan — the module is Professional+. */
export default function FinancialPage() {
  return (
    <PlanGate feature="financial_module" fallbackMessage="O módulo financeiro está disponível a partir do plano Professional.">
      <FinancialPageContent />
    </PlanGate>
  );
}
