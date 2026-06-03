// =============================================================================
// Reporting Engine - APEX Legal
// Generates structured report data from Zustand stores (no side effects)
// =============================================================================

import type {
  LegalProcess,
  LegalClient,
  Deadline,
  Petition,
  LegalTransaction,
  Honorario,
} from '@/types/legal';

// ─── Shared Helpers ───────────────────────────────────────────────────────────

export function fmtBRL(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents);
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]}/${String(year).slice(2)}`;
}

const AREA_LABELS: Record<string, string> = {
  civil: 'Cível',
  trabalhista: 'Trabalhista',
  tributario: 'Tributário',
  penal: 'Penal',
  administrativo: 'Administrativo',
  consumidor: 'Consumidor',
  familia: 'Família',
  empresarial: 'Empresarial',
  previdenciario: 'Previdenciário',
  ambiental: 'Ambiental',
  digital: 'Digital',
};

export { AREA_LABELS };

// ─── Report Types ─────────────────────────────────────────────────────────────

export interface MonthlyFinancialReport {
  period: string; // e.g. "2026-01"
  year: number;
  month: number;
  income: number;
  expenses: number;
  profit: number;
  profitMargin: number; // 0-100
  revenueByArea: { area: string; label: string; value: number }[];
  topClients: { clientId: string; name: string; revenue: number; processCount: number }[];
  taxSummary: { type: string; amount: number }[];
  transactionCount: { income: number; expense: number };
}

export interface CaseloadReport {
  totalProcesses: number;
  activeProcesses: number;
  closedThisMonth: number;
  newThisMonth: number;
  byArea: { area: string; label: string; count: number; color: string }[];
  byStatus: { status: string; label: string; count: number; color: string }[];
  byUrgency: { urgency: string; label: string; count: number; color: string }[];
  deadlineComplianceByMonth: { month: string; total: number; met: number; missed: number; rate: number }[];
  averageDurationDays: number;
}

export interface ClientReport {
  totalClients: number;
  newThisMonth: number;
  activeClients: number; // clients with at least one active process
  revenuePerClient: { clientId: string; name: string; revenue: number; processCount: number; honorarioCount: number }[];
  retentionRate: number; // % clients with >1 process
  averageRevenuePerClient: number;
  topAreaPerClient: { area: string; label: string; clientCount: number }[];
}

export interface ProductivityReport {
  petitionsCreated: number;
  petitionsFiled: number;
  deadlinesMet: number;
  deadlinesMissed: number;
  deadlineComplianceRate: number; // 0-100
  averageResponseTimeDays: number;
  petitionsByType: { type: string; count: number }[];
  petitionsByStatus: { status: string; label: string; count: number }[];
}

export interface QuarterlyReport {
  year: number;
  quarter: number; // 1-4
  months: string[]; // e.g. ["2026-01","2026-02","2026-03"]
  financial: {
    totalIncome: number;
    totalExpenses: number;
    totalProfit: number;
    byMonth: { month: string; income: number; expenses: number; profit: number }[];
  };
  caseload: Pick<CaseloadReport, 'totalProcesses' | 'activeProcesses' | 'newThisMonth' | 'closedThisMonth' | 'byArea'>;
  productivity: Pick<ProductivityReport, 'petitionsCreated' | 'deadlinesMet' | 'deadlinesMissed' | 'deadlineComplianceRate'>;
  clients: Pick<ClientReport, 'totalClients' | 'newThisMonth' | 'topAreaPerClient'>;
  healthScore: number; // 0-100 composite
}

// ─── Report Inputs (raw store data) ──────────────────────────────────────────

export interface ReportStoreData {
  processes: LegalProcess[];
  clients: LegalClient[];
  deadlines: Deadline[];
  petitions: Petition[];
  transactions: LegalTransaction[];
  honorarios: Honorario[];
}

// ─── Monthly Financial Report ─────────────────────────────────────────────────

export function generateMonthlyFinancialReport(
  year: number,
  month: number,
  data: ReportStoreData
): MonthlyFinancialReport {
  const period = `${year}-${String(month).padStart(2, '0')}`;
  const txns = data.transactions.filter((t) => t.date.startsWith(period));

  const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const profit = income - expenses;
  const profitMargin = income > 0 ? (profit / income) * 100 : 0;

  // Revenue by area (via honorarios linked to processes in this period)
  const areaRevMap = new Map<string, number>();
  for (const h of data.honorarios) {
    if (h.contractDate.startsWith(period) && h.processId) {
      const proc = data.processes.find((p) => p.id === h.processId);
      if (proc) areaRevMap.set(proc.area, (areaRevMap.get(proc.area) || 0) + h.amount);
    }
  }
  // Fallback: use income transactions if no honorario data
  if (areaRevMap.size === 0) {
    txns.filter((t) => t.type === 'income' && t.clientId).forEach((t) => {
      const proc = t.processId ? data.processes.find((p) => p.id === t.processId) : undefined;
      const area = proc?.area || 'outro';
      areaRevMap.set(area, (areaRevMap.get(area) || 0) + t.amount);
    });
  }
  const revenueByArea = [...areaRevMap.entries()]
    .map(([area, value]) => ({ area, label: AREA_LABELS[area] || area, value }))
    .sort((a, b) => b.value - a.value);

  // Top clients by honorario amount in period
  const clientRevMap = new Map<string, { name: string; revenue: number; processCount: number }>();
  for (const h of data.honorarios) {
    if (h.contractDate.startsWith(period)) {
      const client = data.clients.find((c) => c.id === h.clientId);
      if (client) {
        const existing = clientRevMap.get(h.clientId) || {
          name: client.name,
          revenue: 0,
          processCount: data.processes.filter((p) => p.clientId === h.clientId).length,
        };
        existing.revenue += h.amount;
        clientRevMap.set(h.clientId, existing);
      }
    }
  }
  const topClients = [...clientRevMap.entries()]
    .map(([clientId, v]) => ({ clientId, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Tax summary from expense transactions
  const taxCategories = ['imposto_irpj', 'imposto_csll', 'imposto_iss', 'imposto_pis_cofins'];
  const taxSummary = taxCategories
    .map((cat) => ({
      type: cat.replace('imposto_', '').toUpperCase(),
      amount: txns
        .filter((t) => t.type === 'expense' && t.category === cat)
        .reduce((s, t) => s + t.amount, 0),
    }))
    .filter((t) => t.amount > 0);

  return {
    period,
    year,
    month,
    income,
    expenses,
    profit,
    profitMargin,
    revenueByArea,
    topClients,
    taxSummary,
    transactionCount: {
      income: txns.filter((t) => t.type === 'income').length,
      expense: txns.filter((t) => t.type === 'expense').length,
    },
  };
}

// ─── Caseload Report ──────────────────────────────────────────────────────────

const AREA_COLORS: Record<string, string> = {
  civil: '#3b82f6',
  trabalhista: '#f59e0b',
  tributario: '#10b981',
  penal: '#ef4444',
  administrativo: '#6b7280',
  consumidor: '#06b6d4',
  familia: '#ec4899',
  empresarial: '#8b5cf6',
  previdenciario: '#6366f1',
  ambiental: '#84cc16',
  digital: '#22d3ee',
};

export { AREA_COLORS };

const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativo', color: '#3b82f6' },
  suspended: { label: 'Suspenso', color: '#f59e0b' },
  won: { label: 'Ganho', color: '#10b981' },
  lost: { label: 'Perdido', color: '#ef4444' },
  settled: { label: 'Acordo', color: '#8b5cf6' },
  archived: { label: 'Arquivado', color: '#6b7280' },
  closed: { label: 'Encerrado', color: '#4b5563' },
};

const URGENCY_META: Record<string, { label: string; color: string }> = {
  critical: { label: 'Crítico', color: '#ef4444' },
  high: { label: 'Alto', color: '#f59e0b' },
  medium: { label: 'Médio', color: '#3b82f6' },
  low: { label: 'Baixo', color: '#10b981' },
};

export function generateCaseloadReport(data: ReportStoreData): CaseloadReport {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const newThisMonth = data.processes.filter((p) => p.createdAt.startsWith(currentMonthPrefix)).length;
  const closedThisMonth = data.processes.filter(
    (p) =>
      (p.status === 'closed' || p.status === 'won' || p.status === 'lost' || p.status === 'settled') &&
      p.updatedAt.startsWith(currentMonthPrefix)
  ).length;

  // By area
  const areaCountMap = new Map<string, number>();
  for (const p of data.processes) {
    areaCountMap.set(p.area, (areaCountMap.get(p.area) || 0) + 1);
  }
  const byArea = [...areaCountMap.entries()]
    .map(([area, count]) => ({
      area,
      label: AREA_LABELS[area] || area,
      count,
      color: AREA_COLORS[area] || '#6b7280',
    }))
    .sort((a, b) => b.count - a.count);

  // By status
  const statusCountMap = new Map<string, number>();
  for (const p of data.processes) {
    statusCountMap.set(p.status, (statusCountMap.get(p.status) || 0) + 1);
  }
  const byStatus = [...statusCountMap.entries()]
    .map(([status, count]) => ({
      status,
      label: STATUS_META[status]?.label || status,
      count,
      color: STATUS_META[status]?.color || '#6b7280',
    }))
    .sort((a, b) => b.count - a.count);

  // By urgency
  const urgencyCountMap = new Map<string, number>();
  for (const p of data.processes) {
    urgencyCountMap.set(p.urgency, (urgencyCountMap.get(p.urgency) || 0) + 1);
  }
  const byUrgency = ['critical', 'high', 'medium', 'low']
    .filter((u) => urgencyCountMap.has(u))
    .map((urgency) => ({
      urgency,
      label: URGENCY_META[urgency]?.label || urgency,
      count: urgencyCountMap.get(urgency) || 0,
      color: URGENCY_META[urgency]?.color || '#6b7280',
    }));

  // Deadline compliance by month (last 6 months)
  const deadlineComplianceByMonth: CaseloadReport['deadlineComplianceByMonth'] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthDeadlines = data.deadlines.filter((dl) => dl.dueDate.startsWith(prefix));
    const met = monthDeadlines.filter((dl) => dl.status === 'completed').length;
    const missed = monthDeadlines.filter((dl) => dl.status === 'missed').length;
    const total = monthDeadlines.length;
    deadlineComplianceByMonth.push({
      month: MONTH_NAMES[d.getMonth()],
      total,
      met,
      missed,
      rate: total > 0 ? (met / total) * 100 : 0,
    });
  }

  // Average duration: days from createdAt to updatedAt for closed/won/lost/settled
  const closedProcesses = data.processes.filter((p) =>
    ['closed', 'won', 'lost', 'settled', 'archived'].includes(p.status)
  );
  const avgDuration =
    closedProcesses.length > 0
      ? closedProcesses.reduce((sum, p) => {
          const start = new Date(p.createdAt).getTime();
          const end = new Date(p.updatedAt).getTime();
          return sum + Math.max(0, (end - start) / (1000 * 60 * 60 * 24));
        }, 0) / closedProcesses.length
      : 0;

  return {
    totalProcesses: data.processes.length,
    activeProcesses: data.processes.filter((p) => p.status === 'active').length,
    closedThisMonth,
    newThisMonth,
    byArea,
    byStatus,
    byUrgency,
    deadlineComplianceByMonth,
    averageDurationDays: Math.round(avgDuration),
  };
}

// ─── Client Report ────────────────────────────────────────────────────────────

export function generateClientReport(data: ReportStoreData): ClientReport {
  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const newThisMonth = data.clients.filter((c) => c.createdAt.startsWith(currentMonthPrefix)).length;
  const activeClients = data.clients.filter((c) =>
    data.processes.some((p) => p.clientId === c.id && p.status === 'active')
  ).length;

  // Revenue per client
  const clientRevMap = new Map<string, { name: string; revenue: number; processCount: number; honorarioCount: number }>();
  for (const h of data.honorarios) {
    const client = data.clients.find((c) => c.id === h.clientId);
    if (client) {
      const existing = clientRevMap.get(h.clientId) || {
        name: client.name,
        revenue: 0,
        processCount: data.processes.filter((p) => p.clientId === h.clientId).length,
        honorarioCount: 0,
      };
      existing.revenue += h.amount;
      existing.honorarioCount += 1;
      clientRevMap.set(h.clientId, existing);
    }
  }
  // Add clients with processes but no honorarios
  for (const client of data.clients) {
    if (!clientRevMap.has(client.id)) {
      const processCount = data.processes.filter((p) => p.clientId === client.id).length;
      if (processCount > 0) {
        clientRevMap.set(client.id, { name: client.name, revenue: 0, processCount, honorarioCount: 0 });
      }
    }
  }
  const revenuePerClient = [...clientRevMap.entries()]
    .map(([clientId, v]) => ({ clientId, ...v }))
    .sort((a, b) => b.revenue - a.revenue);

  // Retention: clients with >1 distinct process
  const retentionClients = data.clients.filter(
    (c) => data.processes.filter((p) => p.clientId === c.id).length > 1
  ).length;
  const retentionRate =
    data.clients.length > 0 ? (retentionClients / data.clients.length) * 100 : 0;

  const totalRevenue = revenuePerClient.reduce((s, c) => s + c.revenue, 0);
  const averageRevenuePerClient =
    revenuePerClient.length > 0 ? totalRevenue / revenuePerClient.length : 0;

  // Top area per client
  const areaClientMap = new Map<string, Set<string>>();
  for (const p of data.processes) {
    if (!areaClientMap.has(p.area)) areaClientMap.set(p.area, new Set());
    areaClientMap.get(p.area)!.add(p.clientId);
  }
  const topAreaPerClient = [...areaClientMap.entries()]
    .map(([area, clients]) => ({
      area,
      label: AREA_LABELS[area] || area,
      clientCount: clients.size,
    }))
    .sort((a, b) => b.clientCount - a.clientCount);

  return {
    totalClients: data.clients.length,
    newThisMonth,
    activeClients,
    revenuePerClient,
    retentionRate,
    averageRevenuePerClient,
    topAreaPerClient,
  };
}

// ─── Productivity Report ──────────────────────────────────────────────────────

const PETITION_STATUS_LABELS: Record<string, string> = {
  draft: 'Rascunho',
  review: 'Em Revisão',
  approved: 'Aprovada',
  filed: 'Protocolada',
  rejected: 'Rejeitada',
};

export function generateProductivityReport(data: ReportStoreData): ProductivityReport {
  const petitionsCreated = data.petitions.length;
  const petitionsFiled = data.petitions.filter((p) => p.status === 'filed').length;

  const deadlinesMet = data.deadlines.filter((d) => d.status === 'completed').length;
  const deadlinesMissed = data.deadlines.filter((d) => d.status === 'missed').length;
  const totalDeadlines = deadlinesMet + deadlinesMissed;
  const deadlineComplianceRate = totalDeadlines > 0 ? (deadlinesMet / totalDeadlines) * 100 : 0;

  // Average response time: days from process creation to first petition
  const responseTimes: number[] = [];
  for (const p of data.processes) {
    const firstPetition = data.petitions
      .filter((pt) => pt.processId === p.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
    if (firstPetition) {
      const diff =
        (new Date(firstPetition.createdAt).getTime() - new Date(p.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      if (diff >= 0) responseTimes.push(diff);
    }
  }
  const averageResponseTimeDays =
    responseTimes.length > 0
      ? responseTimes.reduce((s, v) => s + v, 0) / responseTimes.length
      : 0;

  // Petitions by type
  const typeMap = new Map<string, number>();
  for (const p of data.petitions) {
    typeMap.set(p.type, (typeMap.get(p.type) || 0) + 1);
  }
  const petitionsByType = [...typeMap.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);

  // Petitions by status
  const statusMap = new Map<string, number>();
  for (const p of data.petitions) {
    statusMap.set(p.status, (statusMap.get(p.status) || 0) + 1);
  }
  const petitionsByStatus = [...statusMap.entries()]
    .map(([status, count]) => ({
      status,
      label: PETITION_STATUS_LABELS[status] || status,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    petitionsCreated,
    petitionsFiled,
    deadlinesMet,
    deadlinesMissed,
    deadlineComplianceRate,
    averageResponseTimeDays: Math.round(averageResponseTimeDays * 10) / 10,
    petitionsByType,
    petitionsByStatus,
  };
}

// ─── Quarterly Report ─────────────────────────────────────────────────────────

export function generateQuarterlyReport(
  year: number,
  quarter: number, // 1–4
  data: ReportStoreData
): QuarterlyReport {
  const firstMonth = (quarter - 1) * 3 + 1;
  const months = [firstMonth, firstMonth + 1, firstMonth + 2].map(
    (m) => `${year}-${String(m).padStart(2, '0')}`
  );

  // Financial by month
  const byMonth = months.map((period) => {
    const txns = data.transactions.filter((t) => t.date.startsWith(period));
    const income = txns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = txns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { month: period, income, expenses, profit: income - expenses };
  });
  const totalIncome = byMonth.reduce((s, m) => s + m.income, 0);
  const totalExpenses = byMonth.reduce((s, m) => s + m.expenses, 0);
  const totalProfit = totalIncome - totalExpenses;

  // Caseload (current snapshot)
  const caseloadFull = generateCaseloadReport(data);
  const clientFull = generateClientReport(data);
  const productivityFull = generateProductivityReport(data);

  // Health score: weighted average of key metrics
  // - profit margin 0-100: weight 0.3
  // - deadline compliance: weight 0.3
  // - win rate: weight 0.2
  // - client retention: weight 0.2
  const profitMargin = totalIncome > 0 ? ((totalProfit / totalIncome) * 100) : 50;
  const normalizedProfitMargin = Math.max(0, Math.min(100, profitMargin + 50)); // center at 50%
  const deadlineCompliance = productivityFull.deadlineComplianceRate;
  const wonCount = data.processes.filter((p) => p.status === 'won').length;
  const lostCount = data.processes.filter((p) => p.status === 'lost').length;
  const winRate = wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 70;
  const retentionRate = clientFull.retentionRate;

  const healthScore = Math.round(
    normalizedProfitMargin * 0.3 +
    deadlineCompliance * 0.3 +
    winRate * 0.2 +
    retentionRate * 0.2
  );

  return {
    year,
    quarter,
    months,
    financial: { totalIncome, totalExpenses, totalProfit, byMonth },
    caseload: {
      totalProcesses: caseloadFull.totalProcesses,
      activeProcesses: caseloadFull.activeProcesses,
      newThisMonth: caseloadFull.newThisMonth,
      closedThisMonth: caseloadFull.closedThisMonth,
      byArea: caseloadFull.byArea,
    },
    productivity: {
      petitionsCreated: productivityFull.petitionsCreated,
      deadlinesMet: productivityFull.deadlinesMet,
      deadlinesMissed: productivityFull.deadlinesMissed,
      deadlineComplianceRate: productivityFull.deadlineComplianceRate,
    },
    clients: {
      totalClients: clientFull.totalClients,
      newThisMonth: clientFull.newThisMonth,
      topAreaPerClient: clientFull.topAreaPerClient.slice(0, 5),
    },
    healthScore: Math.max(0, Math.min(100, healthScore)),
  };
}
