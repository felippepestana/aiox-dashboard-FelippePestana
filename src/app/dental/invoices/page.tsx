'use client';

import { useState } from 'react';
import {
  FileText, Plus, Search, DollarSign, CheckCircle2, Clock,
  AlertCircle, Printer, Eye, X, Download, Send,
} from 'lucide-react';

interface Invoice {
  id: string;
  number: string;
  patientName: string;
  items: { procedure: string; qty: number; unitPrice: number }[];
  subtotal: number;
  discount: number;
  total: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  issuedAt: string;
  dueDate: string;
  paidAt: string | null;
  paymentMethod: string | null;
}

const MOCK_INVOICES: Invoice[] = [
  { id: '1', number: 'SB-2026-001', patientName: 'Maria Silva', items: [{ procedure: 'Restauração Classe II', qty: 1, unitPrice: 350 }, { procedure: 'Limpeza e Profilaxia', qty: 1, unitPrice: 200 }], subtotal: 550, discount: 0, total: 550, status: 'paid', issuedAt: '2026-03-10', dueDate: '2026-03-10', paidAt: '2026-03-10', paymentMethod: 'Cartão de Crédito' },
  { id: '2', number: 'SB-2026-002', patientName: 'João Oliveira', items: [{ procedure: 'Implante Unitário', qty: 1, unitPrice: 4500 }, { procedure: 'Enxerto Ósseo', qty: 1, unitPrice: 2000 }], subtotal: 6500, discount: 500, total: 6000, status: 'pending', issuedAt: '2026-03-08', dueDate: '2026-03-20', paidAt: null, paymentMethod: null },
  { id: '3', number: 'SB-2026-003', patientName: 'Ana Costa', items: [{ procedure: 'Faceta de Porcelana', qty: 4, unitPrice: 2800 }], subtotal: 11200, discount: 1200, total: 10000, status: 'pending', issuedAt: '2026-03-05', dueDate: '2026-03-25', paidAt: null, paymentMethod: null },
  { id: '4', number: 'SB-2026-004', patientName: 'Carlos Lima', items: [{ procedure: 'Extração 3o Molar', qty: 2, unitPrice: 600 }], subtotal: 1200, discount: 0, total: 1200, status: 'overdue', issuedAt: '2026-02-20', dueDate: '2026-03-05', paidAt: null, paymentMethod: null },
  { id: '5', number: 'SB-2026-005', patientName: 'Fernanda Alves', items: [{ procedure: 'Clareamento Dental', qty: 1, unitPrice: 1500 }], subtotal: 1500, discount: 150, total: 1350, status: 'paid', issuedAt: '2026-03-01', dueDate: '2026-03-01', paidAt: '2026-03-01', paymentMethod: 'PIX' },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendente', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  paid: { label: 'Pago', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  overdue: { label: 'Vencido', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  cancelled: { label: 'Cancelado', color: 'text-[#4a5568]', bg: 'bg-[#1e293b]/50 border-[#2d3748]' },
};

export default function InvoicesPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filtered = MOCK_INVOICES.filter((inv) => {
    const matchSearch = inv.patientName.toLowerCase().includes(search.toLowerCase()) || inv.number.includes(search);
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totals = {
    pending: MOCK_INVOICES.filter(i => i.status === 'pending').reduce((s, i) => s + i.total, 0),
    paid: MOCK_INVOICES.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0),
    overdue: MOCK_INVOICES.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0),
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700">
              <FileText className="h-5 w-5 text-white" />
            </div>
            Faturamento
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">Gerenciamento de faturas e cobranças</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all">
          <Plus className="h-4 w-4" /> Nova Fatura
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/20 p-5">
          <Clock className="h-5 w-5 text-amber-400 mb-2" />
          <p className="text-xl font-bold text-white">{totals.pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="text-xs text-[#6b7a8d]">Pendentes</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-green-500/15 to-green-500/5 border border-green-500/20 p-5">
          <CheckCircle2 className="h-5 w-5 text-green-400 mb-2" />
          <p className="text-xl font-bold text-white">{totals.paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="text-xs text-[#6b7a8d]">Recebidos este mês</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-red-500/15 to-red-500/5 border border-red-500/20 p-5">
          <AlertCircle className="h-5 w-5 text-red-400 mb-2" />
          <p className="text-xl font-bold text-white">{totals.overdue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="text-xs text-[#6b7a8d]">Vencidos</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
          <input type="text" placeholder="Buscar fatura..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl bg-[#111827] border border-[#1e293b] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all" />
        </div>
        <div className="flex rounded-xl bg-[#111827] border border-[#1e293b] overflow-hidden">
          {['all', 'pending', 'paid', 'overdue'].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2.5 text-xs font-medium transition-all ${filterStatus === s ? 'bg-teal-500/20 text-teal-400' : 'text-[#6b7a8d] hover:text-white'}`}>
              {s === 'all' ? 'Todas' : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {filtered.map((inv) => {
          const conf = STATUS_CONFIG[inv.status];
          return (
            <div key={inv.id} onClick={() => setSelectedInvoice(inv)}
              className="rounded-2xl bg-[#111827] border border-[#1e293b] p-5 hover:border-teal-500/10 transition-all cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                    <FileText className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-white">{inv.number}</p>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${conf.bg} ${conf.color}`}>
                        {conf.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#6b7a8d] mt-0.5">{inv.patientName} - {inv.items.length} item(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">
                    {inv.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                  <p className="text-[10px] text-[#4a5568]">
                    Venc: {new Date(inv.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-[#111827] border border-[#1e293b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Fatura {selectedInvoice.number}</h2>
              <button onClick={() => setSelectedInvoice(null)} className="text-[#4a5568] hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {/* Print Header */}
            <div className="rounded-xl bg-gradient-to-r from-teal-500/10 to-[#D4A76A]/10 border border-teal-500/20 p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">SBARZI ODONTOLOGIA E SAÚDE</p>
                  <p className="text-[10px] text-[#6b7a8d]">Rua João Goulart, 2914 - São João Bosco</p>
                  <p className="text-[10px] text-[#6b7a8d]">Porto Velho - RO | (69) 99324-8325</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#8899aa]">Fatura: {selectedInvoice.number}</p>
                  <p className="text-xs text-[#8899aa]">Emissão: {new Date(selectedInvoice.issuedAt).toLocaleDateString('pt-BR')}</p>
                  <p className="text-xs text-[#8899aa]">Vencimento: {new Date(selectedInvoice.dueDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#6b7a8d] mb-1">Paciente</p>
            <p className="text-sm font-medium text-white mb-4">{selectedInvoice.patientName}</p>

            {/* Items */}
            <div className="rounded-xl bg-[#0d1320] border border-[#1a2332] overflow-hidden mb-4">
              <div className="grid grid-cols-4 gap-4 px-4 py-2 text-[10px] font-semibold text-[#4a5568] uppercase tracking-wider border-b border-[#1a2332]">
                <span className="col-span-2">Procedimento</span>
                <span className="text-right">Qtd</span>
                <span className="text-right">Valor</span>
              </div>
              {selectedInvoice.items.map((item, i) => (
                <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-[#0d1320] last:border-0">
                  <span className="col-span-2 text-xs text-white">{item.procedure}</span>
                  <span className="text-xs text-[#8899aa] text-right">{item.qty}</span>
                  <span className="text-xs text-white text-right font-medium">
                    {(item.qty * item.unitPrice).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right mb-6">
              <div className="flex justify-end gap-8">
                <span className="text-xs text-[#6b7a8d]">Subtotal:</span>
                <span className="text-xs text-white w-24">{selectedInvoice.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-end gap-8">
                  <span className="text-xs text-green-400">Desconto:</span>
                  <span className="text-xs text-green-400 w-24">-{selectedInvoice.discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
              )}
              <div className="flex justify-end gap-8 pt-2 border-t border-[#1a2332]">
                <span className="text-sm font-semibold text-white">Total:</span>
                <span className="text-lg font-bold text-teal-400 w-24">{selectedInvoice.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1e293b] px-4 py-2.5 text-xs text-[#8899aa] hover:text-white transition-all">
                <Printer className="h-3.5 w-3.5" /> Imprimir
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#1e293b] px-4 py-2.5 text-xs text-[#8899aa] hover:text-white transition-all">
                <Send className="h-3.5 w-3.5" /> Enviar por WhatsApp
              </button>
              {selectedInvoice.status === 'pending' && (
                <button className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-700 px-4 py-2.5 text-xs font-medium text-white transition-all">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Registrar Pagamento
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
