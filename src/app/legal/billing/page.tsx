'use client';

import { useState } from 'react';
import { CreditCard, Plus, Search, Filter, Download } from 'lucide-react';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import { useLegalStore } from '@/stores/legal-store';

export default function BillingPage() {
  const { invoices, updateInvoiceStatus } = useLegalFinancialStore();
  const { clients } = useLegalStore();
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = statusFilter === 'all'
    ? invoices
    : invoices.filter((i) => i.status === statusFilter);

  const getClientName = (id: string) => clients.find((c) => c.id === id)?.name || 'N/A';

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-500/10 text-gray-400',
    sent: 'bg-blue-500/10 text-blue-400',
    paid: 'bg-green-500/10 text-green-400',
    overdue: 'bg-red-500/10 text-red-400',
    cancelled: 'bg-gray-500/10 text-gray-500',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Rascunho',
    sent: 'Enviada',
    paid: 'Paga',
    overdue: 'Vencida',
    cancelled: 'Cancelada',
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Faturamento</h1>
          <p className="text-sm text-[#6b7a8d] mt-1">Gestão de faturas e cobranças</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors">
          <Plus className="h-4 w-4" />
          Nova Fatura
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Faturas', value: invoices.length },
          { label: 'Pendentes', value: invoices.filter((i) => i.status === 'sent').length },
          { label: 'Pagas', value: invoices.filter((i) => i.status === 'paid').length },
          { label: 'Vencidas', value: invoices.filter((i) => i.status === 'overdue').length },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
            <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">{stat.label}</p>
            <p className="text-xl font-bold text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'draft', 'sent', 'paid', 'overdue', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-[#6b7a8d] hover:text-white border border-transparent'
            }`}
          >
            {s === 'all' ? 'Todas' : statusLabels[s] || s}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
          <CreditCard className="h-12 w-12 text-[#2a3342] mx-auto mb-4" />
          <p className="text-[#6b7a8d]">Nenhuma fatura encontrada</p>
          <p className="text-xs text-[#4a5568] mt-1">Crie sua primeira fatura para começar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => (
            <div key={invoice.id} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white">{getClientName(invoice.clientId)}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[invoice.status]}`}>
                      {statusLabels[invoice.status]}
                    </span>
                  </div>
                  <p className="text-xs text-[#6b7a8d] mt-1">
                    {invoice.items.length} itens | Venc.: {invoice.dueDate.split('T')[0]}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-amber-400">{formatCurrency(invoice.total)}</p>
                  {invoice.status === 'sent' && (
                    <button
                      onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                      className="text-xs text-green-400 hover:text-green-300 mt-1"
                    >
                      Marcar como Paga
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
