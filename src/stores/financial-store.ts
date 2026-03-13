// =============================================================================
// Financial Store - Sbarzi Odontologia e Saúde
// Zustand store for invoices, transactions, budgets, and cash flow
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  FinancialTransaction,
  TransactionType,
  TransactionCategory,
  Invoice,
  InvoiceItem,
  InvoiceStatus,
  MonthlyBudget,
  CashFlowEntry,
  MonthlyReport,
  AnnualReport,
} from '@/types/dental';

// ─── State Interface ────────────────────────────────────────────────────────

interface FinancialState {
  transactions: FinancialTransaction[];
  invoices: Invoice[];
  budgets: MonthlyBudget[];
  cashFlow: CashFlowEntry[];

  // ── Transaction Actions ─────────────────────────────────────────────────
  addTransaction: (
    transaction: Omit<FinancialTransaction, 'id'>
  ) => string;
  updateTransaction: (
    id: string,
    updates: Partial<Omit<FinancialTransaction, 'id'>>
  ) => void;
  removeTransaction: (id: string) => void;

  // ── Invoice Actions ─────────────────────────────────────────────────────
  createInvoice: (
    invoice: Omit<Invoice, 'id' | 'status' | 'paidAt'>
  ) => string;
  updateInvoice: (
    id: string,
    updates: Partial<Omit<Invoice, 'id'>>
  ) => void;
  markInvoicePaid: (id: string) => void;
  markInvoiceOverdue: (id: string) => void;
  cancelInvoice: (id: string) => void;

  // ── Budget Actions ──────────────────────────────────────────────────────
  setBudget: (budget: MonthlyBudget) => void;
  updateBudgetActuals: (
    month: string,
    actuals: { actualIncome?: number; actualExpenses?: number }
  ) => void;

  // ── Cash Flow Actions ───────────────────────────────────────────────────
  addCashFlowEntry: (entry: CashFlowEntry) => void;
  recalculateCashFlow: () => void;

  // ── Report Generators ───────────────────────────────────────────────────
  getMonthlyReport: (month: string) => MonthlyReport;
  getAnnualReport: (year: number) => AnnualReport;

  // ── Computed / Selectors ────────────────────────────────────────────────
  totalRevenue: () => number;
  totalExpenses: () => number;
  profit: () => number;
  accountsReceivable: () => number;
  getTransactionsByMonth: (month: string) => FinancialTransaction[];
  getTransactionsByCategory: (
    category: TransactionCategory
  ) => FinancialTransaction[];
  getInvoicesByStatus: (status: InvoiceStatus) => Invoice[];
  getInvoicesByPatient: (patientId: string) => Invoice[];
  getRevenueByMonth: (months?: number) => { month: string; revenue: number }[];
  getExpensesByCategory: () => { category: TransactionCategory; total: number }[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Extract "YYYY-MM" from an ISO date string.
 */
function toMonth(dateStr: string): string {
  return dateStr.substring(0, 7);
}

/**
 * Get current month as "YYYY-MM".
 */
function currentMonth(): string {
  return toMonth(nowISO());
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useFinancialStore = create<FinancialState>()(
  persist(
    (set, get) => ({
      // ── Initial State ─────────────────────────────────────────────────────
      transactions: [],
      invoices: [],
      budgets: [],
      cashFlow: [],

      // ── Transaction Actions ───────────────────────────────────────────────

      addTransaction: (transaction) => {
        const id = generateId('txn');
        set((state) => ({
          transactions: [...state.transactions, { ...transaction, id }],
        }));
        return id;
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      removeTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        }));
      },

      // ── Invoice Actions ───────────────────────────────────────────────────

      createInvoice: (invoice) => {
        const id = generateId('inv');
        set((state) => ({
          invoices: [
            ...state.invoices,
            { ...invoice, id, status: 'draft' as InvoiceStatus, paidAt: null },
          ],
        }));
        return id;
      },

      updateInvoice: (id, updates) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id ? { ...inv, ...updates } : inv
          ),
        }));
      },

      markInvoicePaid: (id) => {
        const paidAt = nowISO();
        const state = get();
        const invoice = state.invoices.find((inv) => inv.id === id);

        set((s) => ({
          invoices: s.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, status: 'paid' as InvoiceStatus, paidAt }
              : inv
          ),
        }));

        // Automatically record an income transaction
        if (invoice) {
          get().addTransaction({
            type: 'income',
            category: 'procedure_payment',
            amount: invoice.total,
            description: `Pagamento fatura #${id}`,
            date: paidAt,
            invoiceId: id,
          });
        }
      },

      markInvoiceOverdue: (id) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, status: 'overdue' as InvoiceStatus }
              : inv
          ),
        }));
      },

      cancelInvoice: (id) => {
        set((state) => ({
          invoices: state.invoices.map((inv) =>
            inv.id === id
              ? { ...inv, status: 'cancelled' as InvoiceStatus }
              : inv
          ),
        }));
      },

      // ── Budget Actions ────────────────────────────────────────────────────

      setBudget: (budget) => {
        set((state) => {
          const existing = state.budgets.findIndex(
            (b) => b.month === budget.month
          );
          if (existing >= 0) {
            const updated = [...state.budgets];
            updated[existing] = budget;
            return { budgets: updated };
          }
          return { budgets: [...state.budgets, budget] };
        });
      },

      updateBudgetActuals: (month, actuals) => {
        set((state) => ({
          budgets: state.budgets.map((b) =>
            b.month === month ? { ...b, ...actuals } : b
          ),
        }));
      },

      // ── Cash Flow Actions ─────────────────────────────────────────────────

      addCashFlowEntry: (entry) => {
        set((state) => ({
          cashFlow: [...state.cashFlow, entry].sort((a, b) =>
            a.date.localeCompare(b.date)
          ),
        }));
      },

      recalculateCashFlow: () => {
        const { transactions } = get();
        const entryMap = new Map<string, CashFlowEntry>();

        // Aggregate by date
        for (const txn of transactions) {
          const date = txn.date.substring(0, 10); // YYYY-MM-DD
          const existing = entryMap.get(date) ?? {
            date,
            balance: 0,
            inflows: 0,
            outflows: 0,
          };

          if (txn.type === 'income') {
            existing.inflows += txn.amount;
          } else {
            existing.outflows += txn.amount;
          }
          entryMap.set(date, existing);
        }

        // Sort by date and calculate running balance
        const entries = Array.from(entryMap.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        );

        let runningBalance = 0;
        for (const entry of entries) {
          runningBalance += entry.inflows - entry.outflows;
          entry.balance = runningBalance;
        }

        set({ cashFlow: entries });
      },

      // ── Report Generators ─────────────────────────────────────────────────

      getMonthlyReport: (month) => {
        const { transactions } = get();
        const monthTxns = transactions.filter(
          (t) => toMonth(t.date) === month
        );

        const income = monthTxns
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTxns
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const procedureTxns = monthTxns.filter(
          (t) => t.type === 'income' && t.category === 'procedure_payment'
        );

        // Count procedures by grouping on description patterns
        const procCounts = new Map<string, { count: number; revenue: number }>();
        for (const txn of procedureTxns) {
          const key = txn.description;
          const existing = procCounts.get(key) ?? { count: 0, revenue: 0 };
          existing.count += 1;
          existing.revenue += txn.amount;
          procCounts.set(key, existing);
        }

        const topProcedures = Array.from(procCounts.entries())
          .map(([procedureId, data]) => ({
            procedureId,
            count: data.count,
            revenue: data.revenue,
          }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        return {
          month,
          totalRevenue: income,
          totalExpenses: expenses,
          profit: income - expenses,
          procedureCount: procedureTxns.length,
          newPatients: 0, // Requires cross-store data
          topProcedures,
        };
      },

      getAnnualReport: (year) => {
        const months: MonthlyReport[] = [];
        for (let m = 1; m <= 12; m++) {
          const monthStr = `${year}-${String(m).padStart(2, '0')}`;
          months.push(get().getMonthlyReport(monthStr));
        }

        return {
          year,
          months,
          totalRevenue: months.reduce((s, m) => s + m.totalRevenue, 0),
          totalExpenses: months.reduce((s, m) => s + m.totalExpenses, 0),
          profit: months.reduce((s, m) => s + m.profit, 0),
          totalProcedures: months.reduce((s, m) => s + m.procedureCount, 0),
          totalNewPatients: months.reduce((s, m) => s + m.newPatients, 0),
        };
      },

      // ── Computed / Selectors ──────────────────────────────────────────────

      totalRevenue: () => {
        return get()
          .transactions.filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
      },

      totalExpenses: () => {
        return get()
          .transactions.filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
      },

      profit: () => {
        return get().totalRevenue() - get().totalExpenses();
      },

      accountsReceivable: () => {
        return get()
          .invoices.filter(
            (inv) =>
              inv.status === 'sent' || inv.status === 'overdue'
          )
          .reduce((sum, inv) => sum + inv.total, 0);
      },

      getTransactionsByMonth: (month) => {
        return get().transactions.filter(
          (t) => toMonth(t.date) === month
        );
      },

      getTransactionsByCategory: (category) => {
        return get().transactions.filter((t) => t.category === category);
      },

      getInvoicesByStatus: (status) => {
        return get().invoices.filter((inv) => inv.status === status);
      },

      getInvoicesByPatient: (patientId) => {
        return get().invoices.filter((inv) => inv.patientId === patientId);
      },

      getRevenueByMonth: (months = 12) => {
        const now = new Date();
        const result: { month: string; revenue: number }[] = [];

        for (let i = months - 1; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          const revenue = get()
            .transactions.filter(
              (t) => t.type === 'income' && toMonth(t.date) === monthStr
            )
            .reduce((sum, t) => sum + t.amount, 0);
          result.push({ month: monthStr, revenue });
        }

        return result;
      },

      getExpensesByCategory: () => {
        const expenses = get().transactions.filter(
          (t) => t.type === 'expense'
        );
        const categoryMap = new Map<TransactionCategory, number>();

        for (const txn of expenses) {
          categoryMap.set(
            txn.category,
            (categoryMap.get(txn.category) ?? 0) + txn.amount
          );
        }

        return Array.from(categoryMap.entries())
          .map(([category, total]) => ({ category, total }))
          .sort((a, b) => b.total - a.total);
      },
    }),
    {
      name: 'sbarzi-financial-store',
      partialize: (state) => ({
        transactions: state.transactions,
        invoices: state.invoices,
        budgets: state.budgets,
        cashFlow: state.cashFlow,
      }),
    }
  )
);
