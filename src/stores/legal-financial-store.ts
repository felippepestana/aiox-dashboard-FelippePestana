// =============================================================================
// Legal Financial Store - Advocacia Privada Brasileira
// Zustand store for honorarios, transactions, invoices, and tax obligations
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  Honorario,
  LegalTransaction,
  LegalInvoice,
  TaxObligation,
  CashFlowEntry,
  LegalTransactionCategory,
  HonorarioStatus,
  InvoiceStatus,
} from '@/types/legal';

// ─── State Interface ────────────────────────────────────────────────────────

interface LegalFinancialState {
  honorarios: Honorario[];
  transactions: LegalTransaction[];
  invoices: LegalInvoice[];
  taxObligations: TaxObligation[];

  // ── Honorario Actions ────────────────────────────────────────────────────
  addHonorario: (honorario: Omit<Honorario, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateHonorario: (id: string, updates: Partial<Omit<Honorario, 'id' | 'createdAt'>>) => void;
  removeHonorario: (id: string) => void;
  recordInstallmentPayment: (id: string) => void;

  // ── Transaction Actions ──────────────────────────────────────────────────
  addTransaction: (transaction: Omit<LegalTransaction, 'id' | 'createdAt'>) => string;
  removeTransaction: (id: string) => void;

  // ── Invoice Actions ──────────────────────────────────────────────────────
  addInvoice: (invoice: Omit<LegalInvoice, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateInvoice: (id: string, updates: Partial<Omit<LegalInvoice, 'id' | 'createdAt'>>) => void;
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;

  // ── Tax Actions ──────────────────────────────────────────────────────────
  addTaxObligation: (tax: Omit<TaxObligation, 'id'>) => string;
  updateTaxObligation: (id: string, updates: Partial<Omit<TaxObligation, 'id'>>) => void;
  payTaxObligation: (id: string) => void;

  // ── Selectors ────────────────────────────────────────────────────────────
  getHonorariosByClient: (clientId: string) => Honorario[];
  getActiveHonorarios: () => Honorario[];
  getDefaultedHonorarios: () => Honorario[];
  getTransactionsByCategory: (category: LegalTransactionCategory) => LegalTransaction[];
  getTransactionsByDateRange: (from: string, to: string) => LegalTransaction[];
  getInvoicesByClient: (clientId: string) => LegalInvoice[];
  getOverdueInvoices: () => LegalInvoice[];
  getPendingTaxObligations: () => TaxObligation[];

  // ── Computed ──────────────────────────────────────────────────────────────
  getTotalRevenue: (period?: string) => number;
  getTotalExpenses: (period?: string) => number;
  getProfit: (period?: string) => number;
  getOutstandingHonorarios: () => number;
  getCashFlow: (days?: number) => CashFlowEntry[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useLegalFinancialStore = create<LegalFinancialState>()(
  persist(
    (set, get) => ({
      honorarios: [],
      transactions: [],
      invoices: [],
      taxObligations: [],

      // ── Honorario Actions ─────────────────────────────────────────────────

      addHonorario: (honorario) => {
        const id = generateId('hon');
        const now = nowISO();
        set((state) => ({
          honorarios: [...state.honorarios, { ...honorario, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateHonorario: (id, updates) => {
        set((state) => ({
          honorarios: state.honorarios.map((h) =>
            h.id === id ? { ...h, ...updates, updatedAt: nowISO() } : h
          ),
        }));
      },

      removeHonorario: (id) => {
        set((state) => ({
          honorarios: state.honorarios.filter((h) => h.id !== id),
        }));
      },

      recordInstallmentPayment: (id) => {
        set((state) => ({
          honorarios: state.honorarios.map((h) => {
            if (h.id !== id) return h;
            const paidInstallments = h.paidInstallments + 1;
            const status: HonorarioStatus =
              paidInstallments >= h.installments ? 'completed' : h.status;
            return { ...h, paidInstallments, status, updatedAt: nowISO() };
          }),
        }));
      },

      // ── Transaction Actions ───────────────────────────────────────────────

      addTransaction: (transaction) => {
        const id = generateId('txn');
        set((state) => ({
          transactions: [...state.transactions, { ...transaction, id, createdAt: nowISO() }],
        }));
        return id;
      },

      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      // ── Invoice Actions ───────────────────────────────────────────────────

      addInvoice: (invoice) => {
        const id = generateId('inv');
        const now = nowISO();
        set((state) => ({
          invoices: [...state.invoices, { ...invoice, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt: nowISO() } : i
          ),
        }));
      },

      updateInvoiceStatus: (id, status) => {
        set((state) => ({
          invoices: state.invoices.map((i) =>
            i.id === id
              ? {
                  ...i,
                  status,
                  ...(status === 'paid' ? { paidAt: nowISO() } : {}),
                  updatedAt: nowISO(),
                }
              : i
          ),
        }));
      },

      // ── Tax Actions ───────────────────────────────────────────────────────

      addTaxObligation: (tax) => {
        const id = generateId('tax');
        set((state) => ({
          taxObligations: [...state.taxObligations, { ...tax, id }],
        }));
        return id;
      },

      updateTaxObligation: (id, updates) => {
        set((state) => ({
          taxObligations: state.taxObligations.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      payTaxObligation: (id) => {
        set((state) => ({
          taxObligations: state.taxObligations.map((t) =>
            t.id === id ? { ...t, status: 'paid' as const, paidAt: nowISO() } : t
          ),
        }));
      },

      // ── Selectors ─────────────────────────────────────────────────────────

      getHonorariosByClient: (clientId) =>
        get().honorarios.filter((h) => h.clientId === clientId),

      getActiveHonorarios: () =>
        get().honorarios.filter((h) => h.status === 'active'),

      getDefaultedHonorarios: () =>
        get().honorarios.filter((h) => h.status === 'defaulted'),

      getTransactionsByCategory: (category) =>
        get().transactions.filter((t) => t.category === category),

      getTransactionsByDateRange: (from, to) =>
        get().transactions.filter(
          (t) => t.date >= from && t.date <= to
        ),

      getInvoicesByClient: (clientId) =>
        get().invoices.filter((i) => i.clientId === clientId),

      getOverdueInvoices: () => {
        const now = nowISO();
        return get().invoices.filter(
          (i) => i.status === 'sent' && i.dueDate < now
        );
      },

      getPendingTaxObligations: () =>
        get().taxObligations.filter((t) => t.status === 'pending'),

      // ── Computed ──────────────────────────────────────────────────────────

      getTotalRevenue: (period) => {
        const txns = period
          ? get().transactions.filter((t) => t.date.startsWith(period))
          : get().transactions;
        return txns
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
      },

      getTotalExpenses: (period) => {
        const txns = period
          ? get().transactions.filter((t) => t.date.startsWith(period))
          : get().transactions;
        return txns
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
      },

      getProfit: (period) => {
        return get().getTotalRevenue(period) - get().getTotalExpenses(period);
      },

      getOutstandingHonorarios: () => {
        return get()
          .honorarios.filter((h) => h.status === 'active')
          .reduce((sum, h) => {
            const remainingInstallments = h.installments - h.paidInstallments;
            const installmentValue = h.amount / h.installments;
            return sum + remainingInstallments * installmentValue;
          }, 0);
      },

      getCashFlow: (days = 30) => {
        const entries: CashFlowEntry[] = [];
        const now = new Date();
        let balance = 0;

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          const dayTxns = get().transactions.filter((t) => t.date.startsWith(dateStr));
          const inflows = dayTxns
            .filter((t) => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
          const outflows = dayTxns
            .filter((t) => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
          balance += inflows - outflows;
          entries.push({ date: dateStr, balance, inflows, outflows });
        }

        return entries;
      },
    }),
    {
      name: 'aios-legal-financial-store',
      partialize: (state) => ({
        honorarios: state.honorarios,
        transactions: state.transactions,
        invoices: state.invoices,
        taxObligations: state.taxObligations,
      }),
    }
  )
);
