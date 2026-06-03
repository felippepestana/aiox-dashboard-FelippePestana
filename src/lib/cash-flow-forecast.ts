// =============================================================================
// Cash Flow Forecasting Engine - Advocacia Privada Brasileira
// Projects future income, expenses, and balance from historical data
// =============================================================================

import type { LegalTransaction, Honorario, LegalInvoice } from '@/types/legal';

// ─── Output Types ────────────────────────────────────────────────────────────

export interface MonthlyActual {
  monthKey: string;   // 'YYYY-MM'
  label: string;      // 'Jan/25'
  income: number;
  expenses: number;
  balance: number;
  cumulative: number;
  isProjected: false;
}

export interface MonthlyProjection {
  monthKey: string;
  label: string;
  income: number;
  expenses: number;
  balance: number;
  cumulative: number;
  incomeOptimistic: number;
  incomesPessimistic: number;
  expensesOptimistic: number;
  expensesPessimistic: number;
  balanceOptimistic: number;
  balancePessimistic: number;
  isProjected: true;
}

export type MonthlyPoint = MonthlyActual | MonthlyProjection;

export interface CashFlowForecast {
  historical: MonthlyActual[];
  projections: MonthlyProjection[];
  combined: MonthlyPoint[];
  avgMonthlyIncome: number;
  avgMonthlyExpenses: number;
  burnRate: number;         // avg monthly net (can be negative)
  runwayMonths: number;     // months until zero balance at current burn
  risks: CashFlowRisk[];
}

export interface CashFlowRisk {
  severity: 'critical' | 'warning' | 'info';
  month: string;            // month label
  monthKey: string;
  message: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMonthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // 'YYYY-MM'
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-');
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return `${months[parseInt(month, 10) - 1]}/${year.slice(2)}`;
}

function addMonths(key: string, n: number): string {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Simple linear regression: returns slope and intercept over an array of values */
function linearRegression(values: number[]): { slope: number; intercept: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  values.forEach((y, x) => {
    num += (x - xMean) * (y - yMean);
    den += (x - xMean) ** 2;
  });
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;
  return { slope, intercept };
}

// ─── Main Forecast Engine ────────────────────────────────────────────────────

/**
 * Generates a cash flow forecast for the given number of future months.
 *
 * Strategy:
 * 1. Bucket historical transactions by month to get actuals.
 * 2. Compute average monthly income/expense over last 6 months.
 * 3. Apply linear-regression growth trend.
 * 4. Layer in recurring contractual honorarios as fixed monthly income.
 * 5. Layer in pending invoices on their due-date months.
 * 6. Apply ±15% confidence interval bands.
 */
export function generateForecast(
  transactions: LegalTransaction[],
  honorarios: Honorario[],
  invoices: LegalInvoice[],
  months: 3 | 6 | 12 = 6,
): CashFlowForecast {
  // ── 1. Build historical monthly buckets ──────────────────────────────────
  const buckets: Map<string, { income: number; expenses: number }> = new Map();

  for (const txn of transactions) {
    const key = toMonthKey(txn.date);
    if (!buckets.has(key)) buckets.set(key, { income: 0, expenses: 0 });
    const b = buckets.get(key)!;
    if (txn.type === 'income') b.income += txn.amount;
    else b.expenses += txn.amount;
  }

  // Sort keys chronologically
  const sortedKeys = [...buckets.keys()].sort();

  // Build historical array with cumulative balance
  let cumulative = 0;
  const historical: MonthlyActual[] = sortedKeys.map((key) => {
    const { income, expenses } = buckets.get(key)!;
    const balance = income - expenses;
    cumulative += balance;
    return {
      monthKey: key,
      label: monthLabel(key),
      income,
      expenses,
      balance,
      cumulative,
      isProjected: false as const,
    };
  });

  // ── 2. Compute averages over last 6 data months ──────────────────────────
  const lookback = Math.min(6, historical.length);
  const recentHistory = historical.slice(-lookback);

  const avgIncome =
    lookback > 0
      ? recentHistory.reduce((s, m) => s + m.income, 0) / lookback
      : 0;

  const avgExpenses =
    lookback > 0
      ? recentHistory.reduce((s, m) => s + m.expenses, 0) / lookback
      : 0;

  // ── 3. Linear trend on last 6 months ────────────────────────────────────
  const incomeValues = recentHistory.map((m) => m.income);
  const expenseValues = recentHistory.map((m) => m.expenses);

  const incomeTrend = linearRegression(incomeValues);
  const expenseTrend = linearRegression(expenseValues);

  // ── 4. Recurring contractual honorarios ─────────────────────────────────
  const monthlyRecurring = honorarios
    .filter((h) => h.status === 'active' && h.type === 'contractual')
    .reduce((sum, h) => {
      const installmentValue = h.installments > 0 ? h.amount / h.installments : h.amount;
      return sum + installmentValue;
    }, 0);

  // ── 5. Pending invoices by due-date month ────────────────────────────────
  const pendingInvoicesByMonth: Map<string, number> = new Map();
  const pendingInvoices = invoices.filter(
    (i) => i.status === 'sent' || i.status === 'draft',
  );
  for (const inv of pendingInvoices) {
    const key = toMonthKey(inv.dueDate);
    pendingInvoicesByMonth.set(key, (pendingInvoicesByMonth.get(key) ?? 0) + inv.total);
  }

  // ── 6. Project forward ───────────────────────────────────────────────────
  const lastHistoricalKey =
    sortedKeys.length > 0
      ? sortedKeys[sortedKeys.length - 1]
      : toMonthKey(new Date().toISOString());

  const cumulativeBase = cumulative;
  let projectedCumulative = cumulativeBase;

  const CONFIDENCE = 0.15; // ±15%

  const projections: MonthlyProjection[] = [];

  for (let i = 1; i <= months; i++) {
    const key = addMonths(lastHistoricalKey, i);

    // Trend-adjusted base (start from average and apply slope)
    const trendedIncome = Math.max(
      0,
      avgIncome + incomeTrend.slope * (lookback - 1 + i),
    );
    const trendedExpenses = Math.max(
      0,
      avgExpenses + expenseTrend.slope * (lookback - 1 + i),
    );

    // Add recurring contractual revenue (only if not already captured in avg)
    // We blend: use the greater of trended projection or recurring
    const baseIncome = Math.max(trendedIncome, monthlyRecurring);

    // Add expected invoice receipts for this month
    const invoiceIncome = pendingInvoicesByMonth.get(key) ?? 0;
    const totalIncome = baseIncome + invoiceIncome;
    const totalExpenses = trendedExpenses;

    const balance = totalIncome - totalExpenses;
    projectedCumulative += balance;

    const incomeOptimistic = totalIncome * (1 + CONFIDENCE);
    const incomesPessimistic = totalIncome * (1 - CONFIDENCE);
    const expensesOptimistic = totalExpenses * (1 - CONFIDENCE); // lower expenses = optimistic
    const expensesPessimistic = totalExpenses * (1 + CONFIDENCE);

    projections.push({
      monthKey: key,
      label: monthLabel(key),
      income: totalIncome,
      expenses: totalExpenses,
      balance,
      cumulative: projectedCumulative,
      incomeOptimistic,
      incomesPessimistic,
      expensesOptimistic,
      expensesPessimistic,
      balanceOptimistic: incomeOptimistic - expensesOptimistic,
      balancePessimistic: incomesPessimistic - expensesPessimistic,
      isProjected: true as const,
    });
  }

  // ── 7. Burn rate & runway ────────────────────────────────────────────────
  const burnRate = avgIncome - avgExpenses; // positive = growing, negative = burning
  const runway = calculateRunway(cumulativeBase, burnRate < 0 ? Math.abs(burnRate) : 0);

  // ── 8. Risk identification ───────────────────────────────────────────────
  const risks = identifyCashFlowRisks(projections, cumulativeBase);

  return {
    historical,
    projections,
    combined: [...historical, ...projections],
    avgMonthlyIncome: avgIncome,
    avgMonthlyExpenses: avgExpenses,
    burnRate,
    runwayMonths: runway,
    risks,
  };
}

// ─── Runway Calculator ───────────────────────────────────────────────────────

/**
 * Returns how many months the current balance lasts at the given monthly burn.
 * Returns Infinity when burn is zero or positive (no runway concern).
 */
export function calculateRunway(currentBalance: number, monthlyBurn: number): number {
  if (monthlyBurn <= 0) return Infinity;
  if (currentBalance <= 0) return 0;
  return currentBalance / monthlyBurn;
}

// ─── Risk Identifier ─────────────────────────────────────────────────────────

/**
 * Scans projected months for cash flow risk signals.
 */
export function identifyCashFlowRisks(
  projections: MonthlyProjection[],
  currentBalance: number,
): CashFlowRisk[] {
  const risks: CashFlowRisk[] = [];

  let runningBalance = currentBalance;

  for (const proj of projections) {
    runningBalance += proj.balance;

    // Projected negative cumulative balance
    if (runningBalance < 0) {
      risks.push({
        severity: 'critical',
        month: proj.label,
        monthKey: proj.monthKey,
        message: `Saldo acumulado negativo projetado em ${proj.label} (${formatBRL(runningBalance)})`,
      });
    }

    // Pessimistic scenario turns negative
    const pessimisticBalance = runningBalance + (proj.balancePessimistic - proj.balance);
    if (pessimisticBalance < 0 && runningBalance >= 0) {
      risks.push({
        severity: 'warning',
        month: proj.label,
        monthKey: proj.monthKey,
        message: `Cenário pessimista indica saldo negativo em ${proj.label}`,
      });
    }

    // Expenses projected to exceed income
    if (proj.expenses > proj.income) {
      risks.push({
        severity: 'warning',
        month: proj.label,
        monthKey: proj.monthKey,
        message: `Despesas (${formatBRL(proj.expenses)}) superam receitas (${formatBRL(proj.income)}) em ${proj.label}`,
      });
    }
  }

  // Deduplicate by monthKey + severity (keep critical over warning)
  const seen = new Map<string, CashFlowRisk>();
  for (const r of risks) {
    const k = `${r.monthKey}-${r.severity}`;
    if (!seen.has(k)) seen.set(k, r);
  }

  return [...seen.values()].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

// ─── Internal format helper ───────────────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
