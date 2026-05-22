// =============================================================================
// Legal Financial Store - Advocacia Privada Brasileira
// Zustand store with Supabase API sync (optimistic local + background persist)
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/lib/api';

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
  syncing: boolean;
  lastSyncAt: string | null;

  // ── Hydration ───────────────────────────────────────────────────────────
  hydrateFromApi: () => Promise<void>;

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

function fire(fn: () => Promise<unknown>) {
  fn().catch(() => {});
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useLegalFinancialStore = create<LegalFinancialState>()(
  persist(
    (set, get) => ({
      honorarios: [],
      transactions: [],
      invoices: [],
      taxObligations: [],
      syncing: false,
      lastSyncAt: null,

      // ── Hydration from API ────────────────────────────────────────────────

      hydrateFromApi: async () => {
        set({ syncing: true });
        try {
          const [honorarios, transactions] = await Promise.all([
            api.fetchHonorarios(),
            api.fetchTransactions(),
          ]);
          set({
            honorarios: honorarios as Honorario[],
            transactions: transactions as LegalTransaction[],
            syncing: false,
            lastSyncAt: nowISO(),
          });
        } catch {
          set({ syncing: false });
        }
      },

      // ── Honorario Actions ─────────────────────────────────────────────────

      addHonorario: (honorario) => {
        const id = generateId('hon');
        const now = nowISO();
        set((state) => ({
          honorarios: [...state.honorarios, { ...honorario, id, createdAt: now, updatedAt: now }],
        }));

        fire(async () => {
          const saved = await api.createHonorario(honorario as unknown as Record<string, unknown>);
          set((state) => ({
            honorarios: state.honorarios.map((h) =>
              h.id === id ? { ...h, ...(saved as Partial<Honorario>), id: saved.id as string || id } : h
            ),
          }));
        });

        return id;
      },

      updateHonorario: (id, updates) => {
        set((state) => ({
          honorarios: state.honorarios.map((h) =>
            h.id === id ? { ...h, ...updates, updatedAt: nowISO() } : h
          ),
        }));
        fire(() => api.updateHonorario(id, updates as unknown as Record<string, unknown>));
      },

      removeHonorario: (id) => {
        set((state) => ({
          honorarios: state.honorarios.filter((h) => h.id !== id),
        }));
        fire(() => api.deleteHonorario(id));
      },

      recordInstallmentPayment: (id) => {
        const hon = get().honorarios.find((h) => h.id === id);
        if (!hon) return;

        const paidInstallments = hon.paidInstallments + 1;
        const status: HonorarioStatus =
          paidInstallments >= hon.installments ? 'completed' : hon.status;

        set((state) => ({
          honorarios: state.honorarios.map((h) =>
            h.id === id ? { ...h, paidInstallments, status, updatedAt: nowISO() } : h
          ),
        }));
        fire(() => api.updateHonorario(id, { paidInstallments, status }));
      },

      // ── Transaction Actions ───────────────────────────────────────────────

      addTransaction: (transaction) => {
        const id = generateId('txn');
        set((state) => ({
          transactions: [...state.transactions, { ...transaction, id, createdAt: nowISO() }],
        }));

        fire(async () => {
          const saved = await api.createTransaction(transaction as unknown as Record<string, unknown>);
          set((state) => ({
            transactions: state.transactions.map((t) =>
              t.id === id ? { ...t, ...(saved as Partial<LegalTransaction>), id: saved.id as string || id } : t
            ),
          }));
        });

        return id;
      },

      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
        fire(() => api.deleteTransaction(id));
      },

      // ── Invoice Actions ───────────────────────────────────────────────────
      // Invoices stay local for now (no invoices table in Supabase yet)

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
      // Tax obligations stay local for now (no tax table in Supabase yet)

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
        lastSyncAt: state.lastSyncAt,
      }),
    }
  )
);
