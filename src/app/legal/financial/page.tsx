'use client';

import { useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
} from 'lucide-react';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import { useLegalStore } from '@/stores/legal-store';

export default function FinancialPage() {
  const {
    transactions,
    getTotalRevenue,
    getTotalExpenses,
    getProfit,
    getOutstandingHonorarios,
  } = useLegalFinancialStore();

  const { getClientById, getProcessById } = useLegalStore();

  const totalRevenue = getTotalRevenue();
  const totalExpenses = getTotalExpenses();
  const profit = getProfit();
  const outstandingHonorarios = getOutstandingHonorarios();

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }, [transactions]);

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

  const stats = [
    {
      label: 'Receita Total',
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      iconBg: 'bg-green-500/10',
      iconColor: 'text-green-400',
    },
    {
      label: 'Despesas',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      iconBg: 'bg-red-500/10',
      iconColor: 'text-red-400',
    },
    {
      label: 'Lucro',
      value: formatCurrency(profit),
      icon: Wallet,
      iconBg: profit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
      iconColor: profit >= 0 ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'Honorarios Pendentes',
      value: formatCurrency(outstandingHonorarios),
      icon: Receipt,
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <DollarSign className="h-7 w-7 text-amber-400" />
          Dashboard Financeiro
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Visao geral das financas do escritorio
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-amber-400" />
          Ultimas Transacoes
        </h2>

        {recentTransactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#6b7a8d]">
            <DollarSign className="h-8 w-8 mb-2" />
            <p className="text-sm">Nenhuma transacao registrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a2332]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    Descricao
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2332]">
                {recentTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-[#0a0f1a] transition-colors">
                    <td className="px-4 py-3 text-sm text-[#6b7a8d]">
                      {formatDate(txn.date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          txn.type === 'income'
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {txn.type === 'income' ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {txn.type === 'income' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                        {categoryLabels[txn.category] || txn.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white max-w-[200px] truncate">
                      {txn.description}
                    </td>
                    <td
                      className={`px-4 py-3 text-sm text-right font-medium ${
                        txn.type === 'income' ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {txn.type === 'income' ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </td>
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
