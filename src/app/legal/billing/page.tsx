'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  FileText,
  Loader2,
  ArrowUpCircle,
} from 'lucide-react';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import { useLegalStore } from '@/stores/legal-store';
import { ExportPDFButton } from '@/components/legal';
import { PageHeader, StatCardGrid, EmptyState } from '@/components/legal/shared';
import type { InvoiceStatus, LegalInvoiceItem } from '@/types/legal';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string; icon: typeof CreditCard }
> = {
  draft:     { label: 'Rascunho',  className: 'bg-gray-500/10 text-gray-400',   icon: FileText },
  sent:      { label: 'Enviada',   className: 'bg-blue-500/10 text-blue-400',   icon: Clock },
  paid:      { label: 'Paga',      className: 'bg-green-500/10 text-green-400', icon: CheckCircle2 },
  overdue:   { label: 'Vencida',   className: 'bg-red-500/10 text-red-400',     icon: AlertTriangle },
  cancelled: { label: 'Cancelada', className: 'bg-gray-500/10 text-gray-500',   icon: X },
};

const PAYMENT_METHODS = [
  { value: 'pix',          label: 'PIX' },
  { value: 'boleto',       label: 'Boleto Bancário' },
  { value: 'transferencia', label: 'Transferência (TED/DOC)' },
  { value: 'cartao',       label: 'Cartão de Crédito' },
  { value: 'dinheiro',     label: 'Dinheiro' },
  { value: 'cheque',       label: 'Cheque' },
];

const STATUS_TABS: { value: InvoiceStatus | 'all'; label: string }[] = [
  { value: 'all',       label: 'Todas' },
  { value: 'draft',     label: 'Rascunho' },
  { value: 'sent',      label: 'Enviadas' },
  { value: 'paid',      label: 'Pagas' },
  { value: 'overdue',   label: 'Vencidas' },
  { value: 'cancelled', label: 'Canceladas' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** AIOX-YYYY-NNNN */
function generateInvoiceNumber(index: number): string {
  const year = new Date().getFullYear();
  const seq = String(index).padStart(4, '0');
  return `AIOX-${year}-${seq}`;
}

/** Average days from creation to paid status, for paid invoices */
function avgDaysToPay(
  invoices: { createdAt: string; paidAt?: string; status: InvoiceStatus }[],
): number {
  const paid = invoices.filter((i) => i.status === 'paid' && i.paidAt);
  if (paid.length === 0) return 0;
  const total = paid.reduce((sum, i) => {
    const created = new Date(i.createdAt).getTime();
    const paidAt = new Date(i.paidAt!).getTime();
    return sum + (paidAt - created) / (1000 * 60 * 60 * 24);
  }, 0);
  return Math.round(total / paid.length);
}

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_ITEM: LegalInvoiceItem = {
  description: '',
  quantity: 1,
  unitPrice: 0,
  total: 0,
};

function emptyForm() {
  return {
    clientId: '',
    processId: '',
    dueDate: '',
    paymentMethod: 'pix',
    discount: '',
    notes: '',
    items: [{ ...EMPTY_ITEM }],
  };
}

// ─── Subscription Panel ───────────────────────────────────────────────────────

interface SubscriptionData {
  plan: string;
  status: string;
  currentPeriodEnd: string | null;
}

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter (Gratuito)',
  professional: 'Professional — R$ 197/mês',
  enterprise: 'Enterprise',
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  active:    { label: 'Ativa',       className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  trialing:  { label: 'Período de teste', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  past_due:  { label: 'Pagamento pendente', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  canceled:  { label: 'Cancelada',   className: 'bg-red-500/10 text-red-400 border-red-500/20' },
  free:      { label: 'Plano Gratuito', className: 'bg-[#1a2332] text-[#6b7a8d] border-[#1a2332]' },
};

function SubscriptionPanel() {
  const [data, setData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/payments/subscription')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch(() => setError('Não foi possível carregar os dados da assinatura.'))
      .finally(() => setLoading(false));
  }, []);

  async function handleUpgrade() {
    setUpgrading(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'professional' }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Erro ao criar checkout.');
        return;
      }
      window.location.href = json.initPoint;
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setUpgrading(false);
    }
  }

  const statusBadge = data ? (STATUS_BADGE[data.status] ?? STATUS_BADGE.free) : null;
  const isStarter = !data || data.plan === 'starter' || data.status === 'free';

  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-white mb-0.5">Sua Assinatura</h2>
          <p className="text-xs text-[#6b7a8d]">Gerencie seu plano APEX Legal</p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-[#6b7a8d] text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        ) : error ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : data ? (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Plan name */}
            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                {PLAN_LABELS[data.plan] ?? data.plan}
              </p>
              {(() => {
                const date = data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : null;
                if (!date || isNaN(date.getTime())) return null;
                return (
                  <p className="text-xs text-[#6b7a8d]">
                    Próx. cobrança:{' '}
                    {date.toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                );
              })()}
            </div>

            {/* Status badge */}
            {statusBadge && (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge.className}`}
              >
                {statusBadge.label}
              </span>
            )}

            {/* Upgrade button — only for starter/free */}
            {isStarter && (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
              >
                {upgrading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4" />
                )}
                Fazer Upgrade
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const { invoices, addInvoice, updateInvoiceStatus } = useLegalFinancialStore();
  const { clients, processes } = useLegalStore();

  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  // ── Derived state ──────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return invoices;
    return invoices.filter((i) => i.status === statusFilter);
  }, [invoices, statusFilter]);

  const summaryStats = useMemo(() => {
    const totalInvoiced = invoices.reduce((s, i) => s + i.total, 0);
    const totalReceived = invoices
      .filter((i) => i.status === 'paid')
      .reduce((s, i) => s + i.total, 0);
    const totalOverdue = invoices
      .filter((i) => i.status === 'overdue')
      .reduce((s, i) => s + i.total, 0);
    const avgDays = avgDaysToPay(invoices);
    return { totalInvoiced, totalReceived, totalOverdue, avgDays };
  }, [invoices]);

  // ── Item helpers ───────────────────────────────────────────────────────────

  function updateItem(idx: number, field: keyof LegalInvoiceItem, rawValue: string | number) {
    setForm((f) => {
      const items = f.items.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: rawValue };
        updated.total = Math.round(updated.quantity * updated.unitPrice);
        return updated;
      });
      return { ...f, items };
    });
  }

  function addItem() {
    setForm((f) => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }));
  }

  function removeItem(idx: number) {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  }

  const formSubtotal = form.items.reduce((s, it) => s + it.total, 0);
  const formDiscount = Math.round(parseFloat(form.discount || '0') * 100);
  const formTotal = Math.max(0, formSubtotal - formDiscount);

  // ── Submit ─────────────────────────────────────────────────────────────────

  function handleSave() {
    if (!form.clientId || !form.dueDate || form.items.every((it) => !it.description)) return;
    setSaving(true);

    // Encode payment method into notes
    const pmLabel = PAYMENT_METHODS.find((m) => m.value === form.paymentMethod)?.label ?? form.paymentMethod;
    const notesWithPm = [
      `Forma de pagamento: ${pmLabel}`,
      form.notes.trim(),
    ].filter(Boolean).join('\n');

    addInvoice({
      clientId: form.clientId,
      processId: form.processId || undefined,
      items: form.items.filter((it) => it.description.trim()),
      subtotal: formSubtotal,
      discount: formDiscount,
      total: formTotal,
      status: 'draft',
      dueDate: form.dueDate,
      notes: notesWithPm,
    });

    setForm(emptyForm());
    setShowForm(false);
    setSaving(false);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  function getClientName(id: string): string {
    return clients.find((c) => c.id === id)?.name || 'Cliente desconhecido';
  }

  function getProcessLabel(id?: string): string {
    if (!id) return '';
    const p = processes.find((x) => x.id === id);
    return p ? `${p.cnj} — ${p.title}` : '';
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  // ── Invoice number ─────────────────────────────────────────────────────────
  // Derive index from position in all-time invoice list for display
  function getInvoiceNumber(id: string): string {
    const idx = invoices.findIndex((i) => i.id === id);
    return generateInvoiceNumber(idx + 1);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 lg:p-8 space-y-6">

      <SubscriptionPanel />

      <PageHeader
        title="Faturamento"
        subtitle="Gestão de faturas, cobranças e recebimentos"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Financeiro', href: '/legal/financial' },
          { label: 'Faturamento', href: '/legal/billing' },
        ]}
        actions={
          <>
            {invoices.length > 0 && (
              <ExportPDFButton
                type="financial"
                data={{
                  period: String(new Date().getFullYear()),
                  transactions: [],
                  totalIncome: summaryStats.totalReceived,
                  totalExpense: 0,
                  balance: summaryStats.totalReceived,
                } as import('@/lib/pdf-export').FinancialReportData}
                label="Exportar PDF"
                variant="button"
              />
            )}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova Fatura
            </button>
          </>
        }
      />

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <StatCardGrid
        cards={[
          {
            label: 'Total Faturado',
            value: formatCurrency(summaryStats.totalInvoiced),
            icon: <FileText className="h-5 w-5" />,
            color: '#F59E0B',
          },
          {
            label: 'Total Recebido',
            value: formatCurrency(summaryStats.totalReceived),
            icon: <CheckCircle2 className="h-5 w-5" />,
            color: '#4ADE80',
          },
          {
            label: 'Total Vencido',
            value: formatCurrency(summaryStats.totalOverdue),
            icon: <AlertTriangle className="h-5 w-5" />,
            color: '#F87171',
          },
          {
            label: 'Prazo Médio de Pagto.',
            value: summaryStats.avgDays > 0 ? `${summaryStats.avgDays} dias` : '—',
            icon: <Clock className="h-5 w-5" />,
            color: '#60A5FA',
          },
        ]}
      />

      {/* ── New Invoice Form ───────────────────────────────────────────────── */}
      {showForm && (
        <div className="rounded-xl border border-amber-500/20 bg-[#0d1320] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Nova Fatura</h2>
              <p className="text-xs text-[#6b7a8d] mt-0.5">
                Nº {generateInvoiceNumber(invoices.length + 1)}
              </p>
            </div>
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm()); }}
              className="rounded-lg p-1.5 text-[#6b7a8d] hover:text-white hover:bg-[#1a2332] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Client / Process / Due Date / Payment */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Cliente *</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
              >
                <option value="">Selecionar cliente...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Processo (opcional)</label>
              <select
                value={form.processId}
                onChange={(e) => setForm((f) => ({ ...f, processId: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
              >
                <option value="">Nenhum</option>
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>{p.cnj} — {p.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Data de Vencimento *</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Forma de Pagamento</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Items */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">Itens da Fatura</label>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Plus className="h-3 w-3" /> Adicionar item
              </button>
            </div>

            <div className="rounded-lg border border-[#1a2332] overflow-hidden">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 bg-[#0a0f1a] px-4 py-2 text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                <div className="col-span-5">Descrição</div>
                <div className="col-span-2 text-right">Qtd.</div>
                <div className="col-span-2 text-right">Vlr. Unit. (R$)</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1" />
              </div>

              {form.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center border-t border-[#1a2332] px-4 py-2"
                >
                  <div className="col-span-5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      placeholder="Descrição do serviço ou item"
                      className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-2 py-1.5 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="1"
                      className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-2 py-1.5 text-sm text-white text-right focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      value={(item.unitPrice / 100).toFixed(2)}
                      onChange={(e) =>
                        updateItem(idx, 'unitPrice', Math.round(parseFloat(e.target.value || '0') * 100))
                      }
                      min="0"
                      step="0.01"
                      className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-2 py-1.5 text-sm text-white text-right focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 text-right text-sm font-medium text-amber-400">
                    {formatCurrency(item.total)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    {form.items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-[#6b7a8d] hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals + Notes */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Observações</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Instruções de pagamento, dados bancários, observações..."
                rows={3}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none resize-none"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#6b7a8d]">Subtotal</span>
                <span className="text-white">{formatCurrency(formSubtotal)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#6b7a8d] shrink-0">Desconto (R$)</span>
                <input
                  type="number"
                  value={form.discount}
                  onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-28 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-2 py-1 text-sm text-white text-right focus:border-amber-500/50 focus:outline-none ml-auto"
                />
              </div>
              <div className="flex items-center justify-between border-t border-[#1a2332] pt-2">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-lg font-bold text-amber-400">{formatCurrency(formTotal)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-[#1a2332]">
            <button
              onClick={() => { setShowForm(false); setForm(emptyForm()); }}
              className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.clientId || !form.dueDate}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar como Rascunho
            </button>
          </div>
        </div>
      )}

      {/* ── Status Filter Tabs ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#1a2332] bg-[#0d1320] p-2">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === 'all'
              ? invoices.length
              : invoices.filter((i) => i.status === tab.value).length;
          return (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-[#6b7a8d] border border-transparent hover:text-white'
              }`}
            >
              {tab.label}
              <span
                className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs ${
                  statusFilter === tab.value
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-[#1a2332] text-[#6b7a8d]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Invoice List ───────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320]">
          <EmptyState
            icon={<CreditCard className="h-8 w-8" />}
            title="Nenhuma fatura encontrada"
            description={
              invoices.length === 0
                ? 'Crie sua primeira fatura para começar'
                : 'Nenhuma fatura corresponde ao filtro selecionado'
            }
            action={invoices.length === 0 ? { label: 'Nova Fatura', onClick: () => setShowForm(true) } : undefined}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((invoice) => {
            const statConf = STATUS_CONFIG[invoice.status];
            const StatIcon = statConf.icon;
            const isExpanded = expandedId === invoice.id;
            const invoiceNum = getInvoiceNumber(invoice.id);

            return (
              <div
                key={invoice.id}
                className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden hover:border-amber-500/20 transition-colors"
              >
                {/* ── Row ─────────────────────────────────────────────────── */}
                <div className="flex items-center gap-4 p-4">
                  {/* Invoice icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
                    <DollarSign className="h-5 w-5 text-amber-400" />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-[#6b7a8d]">{invoiceNum}</span>
                      <span className="text-sm font-semibold text-white">
                        {getClientName(invoice.clientId)}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statConf.className}`}>
                        <StatIcon className="h-3 w-3" />
                        {statConf.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 mt-0.5 text-xs text-[#6b7a8d]">
                      <span>{invoice.items.length} item{invoice.items.length !== 1 ? 's' : ''}</span>
                      <span>Venc.: {formatDate(invoice.dueDate)}</span>
                      {invoice.paidAt && <span>Pago em: {formatDate(invoice.paidAt)}</span>}
                    </div>
                  </div>

                  {/* Total + actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold text-amber-400">{formatCurrency(invoice.total)}</p>
                      {invoice.discount > 0 && (
                        <p className="text-xs text-[#6b7a8d]">
                          Desc.: {formatCurrency(invoice.discount)}
                        </p>
                      )}
                    </div>

                    {/* Quick-action status buttons */}
                    <div className="flex flex-col gap-1">
                      {invoice.status === 'draft' && (
                        <button
                          onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                          className="rounded px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20 transition-colors whitespace-nowrap"
                        >
                          Marcar Enviada
                        </button>
                      )}
                      {invoice.status === 'sent' && (
                        <>
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                            className="rounded px-2 py-1 text-xs text-green-400 hover:bg-green-500/10 border border-transparent hover:border-green-500/20 transition-colors whitespace-nowrap"
                          >
                            Marcar Paga
                          </button>
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'overdue')}
                            className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors whitespace-nowrap"
                          >
                            Marcar Vencida
                          </button>
                        </>
                      )}
                      {(invoice.status === 'draft' || invoice.status === 'sent') && (
                        <button
                          onClick={() => updateInvoiceStatus(invoice.id, 'cancelled')}
                          className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-gray-500/10 border border-transparent hover:border-gray-500/20 transition-colors whitespace-nowrap"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpand(invoice.id)}
                      className="rounded-lg border border-[#1a2332] p-1.5 text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/20 transition-colors"
                      title="Ver detalhes"
                    >
                      {isExpanded
                        ? <ChevronUp className="h-4 w-4" />
                        : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* ── Expanded Detail ──────────────────────────────────────── */}
                {isExpanded && (
                  <div className="border-t border-[#1a2332] bg-[#0a0f1a] px-6 py-4 space-y-4">
                    {/* Process link */}
                    {invoice.processId && (
                      <p className="text-xs text-[#6b7a8d]">
                        Processo: <span className="text-white font-mono">{getProcessLabel(invoice.processId)}</span>
                      </p>
                    )}

                    {/* Items table */}
                    <div className="rounded-lg border border-[#1a2332] overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#0d1320] text-xs text-[#6b7a8d] uppercase tracking-wider">
                            <th className="px-4 py-2 text-left">Descrição</th>
                            <th className="px-4 py-2 text-right">Qtd.</th>
                            <th className="px-4 py-2 text-right">Vlr. Unit.</th>
                            <th className="px-4 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items.map((item, idx) => (
                            <tr key={idx} className="border-t border-[#1a2332]">
                              <td className="px-4 py-2 text-white">{item.description}</td>
                              <td className="px-4 py-2 text-right text-[#6b7a8d]">{item.quantity}</td>
                              <td className="px-4 py-2 text-right text-[#6b7a8d]">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-4 py-2 text-right font-medium text-amber-400">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                      <div className="w-64 space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#6b7a8d]">Subtotal</span>
                          <span className="text-white">{formatCurrency(invoice.subtotal)}</span>
                        </div>
                        {invoice.discount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[#6b7a8d]">Desconto</span>
                            <span className="text-red-400">- {formatCurrency(invoice.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-[#1a2332] pt-1.5 font-semibold">
                          <span className="text-white">Total</span>
                          <span className="text-amber-400">{formatCurrency(invoice.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                      <div className="rounded-lg bg-[#0d1320] border border-[#1a2332] px-4 py-3">
                        <p className="text-xs text-[#6b7a8d] whitespace-pre-line">{invoice.notes}</p>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[#4a5568]">
                      <span>Criada: {formatDate(invoice.createdAt)}</span>
                      <span>Vencimento: {formatDate(invoice.dueDate)}</span>
                      {invoice.paidAt && <span>Pago em: {formatDate(invoice.paidAt)}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
