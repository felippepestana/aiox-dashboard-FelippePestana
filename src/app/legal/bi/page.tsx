'use client';

import { useState, useMemo } from 'react';
import { LineChart as LineChartIcon, TrendingUp, Briefcase, Users, Clock, DollarSign, CheckCircle, BarChart2 } from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import {
  generateMonthlyFinancialReport,
  generateCaseloadReport,
  generateClientReport,
  fmtBRL,
  AREA_COLORS,
  monthLabel,
} from '@/lib/reporting-engine';
import {
  MetricCard,
  BarChart,
  PieChart,
  LineChart,
  ComplianceBar,
  formatBRLShort,
} from '@/components/legal/ReportCharts';
import { ReportExport } from '@/components/legal/ReportExport';

type Period = 'month' | 'quarter' | 'year';

const PERIOD_LABELS: Record<Period, string> = {
  month: 'Mensal',
  quarter: 'Trimestral',
  year: 'Anual',
};

export default function BIPage() {
  const [period, setPeriod] = useState<Period>('month');
  const { processes, clients, deadlines } = useLegalStore();
  const { transactions, honorarios, getTotalRevenue, getTotalExpenses } = useLegalFinancialStore();

  const storeData = useMemo(
    () => ({ processes, clients, deadlines, petitions: [], transactions, honorarios }),
    [processes, clients, deadlines, transactions, honorarios]
  );

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const monthlyReport = useMemo(
    () => generateMonthlyFinancialReport(currentYear, currentMonth, storeData),
    [currentYear, currentMonth, storeData]
  );
  const caseloadReport = useMemo(() => generateCaseloadReport(storeData), [storeData]);
  const clientReport = useMemo(() => generateClientReport(storeData), [storeData]);

  // Build last 12 months of revenue + expenses for line chart
  const last12 = useMemo(() => {
    const labels: string[] = [];
    const revenue: number[] = [];
    const expenses: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      labels.push(monthLabel(yr, mo));
      const prefix = `${yr}-${String(mo).padStart(2, '0')}`;
      revenue.push(
        transactions
          .filter((t) => t.type === 'income' && t.date.startsWith(prefix))
          .reduce((s, t) => s + t.amount, 0)
      );
      expenses.push(
        transactions
          .filter((t) => t.type === 'expense' && t.date.startsWith(prefix))
          .reduce((s, t) => s + t.amount, 0)
      );
    }
    return { labels, revenue, expenses };
  }, [transactions, currentYear, currentMonth]);

  // Totals
  const totalRevenue = getTotalRevenue();
  const totalExpenses = getTotalExpenses();
  const profit = totalRevenue - totalExpenses;

  const wonCount = processes.filter((p) => p.status === 'won').length;
  const lostCount = processes.filter((p) => p.status === 'lost').length;
  const winRate = wonCount + lostCount > 0 ? ((wonCount / (wonCount + lostCount)) * 100).toFixed(1) : null;

  const pendingDeadlines = deadlines.filter((d) => d.status === 'pending').length;
  const missedDeadlines = deadlines.filter((d) => d.status === 'missed').length;
  const completedDeadlines = deadlines.filter((d) => d.status === 'completed').length;
  const totalResolved = completedDeadlines + missedDeadlines;
  const complianceRate = totalResolved > 0 ? ((completedDeadlines / totalResolved) * 100).toFixed(1) : null;

  // Revenue by area chart data
  const revenueByAreaData = monthlyReport.revenueByArea.slice(0, 8).map((r) => ({
    label: r.label,
    value: r.value,
    color: AREA_COLORS[r.area] || '#6b7280',
  }));

  // Top 5 clients by revenue
  const topClientsData = clientReport.revenuePerClient.slice(0, 5).map((c) => ({
    label: c.name.split(' ')[0], // First name for brevity
    value: c.revenue,
    color: '#f59e0b',
  }));

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20">
              <LineChartIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Business Intelligence</h1>
              <p className="text-sm text-[#6b7a8d]">Métricas e análises estratégicas do escritório</p>
            </div>
          </div>
        </div>
        <ReportExport />
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2 mb-6">
        {(['month', 'quarter', 'year'] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              period === p
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-[#6b7a8d] hover:text-white hover:bg-[#1a2332] border border-transparent'
            }`}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Receita Total"
          value={formatBRLShort(totalRevenue)}
          subValue={fmtBRL(totalRevenue)}
          trend={profit >= 0 ? 'up' : 'down'}
          trendLabel={`${profit >= 0 ? '+' : ''}${formatBRLShort(profit)}`}
          icon={<DollarSign className="h-5 w-5 text-amber-400" />}
          accentColor="#f59e0b"
        />
        <MetricCard
          label="Processos Ativos"
          value={String(caseloadReport.activeProcesses)}
          subValue={`${caseloadReport.newThisMonth} novos este mês`}
          trend={caseloadReport.newThisMonth > 0 ? 'up' : 'flat'}
          icon={<Briefcase className="h-5 w-5 text-blue-400" />}
          accentColor="#3b82f6"
        />
        <MetricCard
          label="Total Clientes"
          value={String(clientReport.totalClients)}
          subValue={`${clientReport.newThisMonth} novos este mês`}
          trend={clientReport.newThisMonth > 0 ? 'up' : 'flat'}
          icon={<Users className="h-5 w-5 text-purple-400" />}
          accentColor="#8b5cf6"
        />
        <MetricCard
          label="Prazos Pendentes"
          value={String(pendingDeadlines)}
          subValue={missedDeadlines > 0 ? `${missedDeadlines} perdidos` : 'Nenhum perdido'}
          trend={missedDeadlines > 0 ? 'down' : 'flat'}
          trendPositive={false}
          icon={<Clock className="h-5 w-5 text-red-400" />}
          accentColor="#ef4444"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Taxa de Êxito"
          value={winRate ? `${winRate}%` : '—'}
          subValue={wonCount > 0 ? `${wonCount} ganhos / ${lostCount} perdidos` : 'Sem dados ainda'}
          trend={winRate ? (parseFloat(winRate) >= 60 ? 'up' : 'down') : 'flat'}
          icon={<TrendingUp className="h-5 w-5 text-green-400" />}
          accentColor="#22c55e"
        />
        <MetricCard
          label="Conformidade de Prazos"
          value={complianceRate ? `${complianceRate}%` : '—'}
          subValue={`${completedDeadlines} cumpridos`}
          trend={complianceRate ? (parseFloat(complianceRate) >= 80 ? 'up' : 'down') : 'flat'}
          progressPct={complianceRate ? parseFloat(complianceRate) : undefined}
          icon={<CheckCircle className="h-5 w-5 text-teal-400" />}
          accentColor="#14b8a6"
        />
        <MetricCard
          label="Resultado (Lucro)"
          value={formatBRLShort(profit)}
          subValue={profit >= 0 ? 'Positivo' : 'Negativo'}
          trend={profit >= 0 ? 'up' : 'down'}
          icon={<BarChart2 className="h-5 w-5 text-amber-400" />}
          accentColor="#f59e0b"
        />
        <MetricCard
          label="Clientes Ativos"
          value={String(clientReport.activeClients)}
          subValue={`${((clientReport.activeClients / Math.max(1, clientReport.totalClients)) * 100).toFixed(0)}% da carteira`}
          icon={<Users className="h-5 w-5 text-indigo-400" />}
          accentColor="#6366f1"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Line Chart: Revenue vs Expenses last 12 months */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Receita vs Despesas — Últimos 12 Meses</h3>
          <LineChart
            labels={last12.labels}
            series={[
              { key: 'revenue', label: 'Receita', color: '#22c55e', values: last12.revenue },
              { key: 'expenses', label: 'Despesas', color: '#ef4444', values: last12.expenses },
            ]}
            height={200}
            currency
          />
        </div>

        {/* Pie Chart: Case Distribution by Status */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Distribuição de Processos por Status</h3>
          {caseloadReport.totalProcesses === 0 ? (
            <p className="text-xs text-[#4a5568] pt-4">Cadastre processos para visualizar a distribuição</p>
          ) : (
            <PieChart
              data={caseloadReport.byStatus.map((s) => ({
                label: s.label,
                value: s.count,
                color: s.color,
              }))}
              size={150}
              centerValue={String(caseloadReport.totalProcesses)}
              centerLabel="processos"
            />
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Pie Chart: Case Distribution by Area */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Processos por Área Jurídica</h3>
          {caseloadReport.byArea.length === 0 ? (
            <p className="text-xs text-[#4a5568]">Nenhum processo cadastrado</p>
          ) : (
            <PieChart
              data={caseloadReport.byArea.slice(0, 8).map((a) => ({
                label: a.label,
                value: a.count,
                color: a.color,
              }))}
              size={150}
              centerValue={String(caseloadReport.totalProcesses)}
              centerLabel="total"
            />
          )}
        </div>

        {/* Bar Chart: Deadline Compliance by Month */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Conformidade de Prazos por Mês</h3>
          <ComplianceBar
            data={caseloadReport.deadlineComplianceByMonth}
            height={160}
          />
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-xs text-[#6b7a8d]">≥80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              <span className="text-xs text-[#6b7a8d]">60-80%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-xs text-[#6b7a8d]">&lt;60%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Horizontal Bar: Top 5 Clients by Revenue */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Top 5 Clientes por Honorário</h3>
          {topClientsData.length === 0 ? (
            <p className="text-xs text-[#4a5568]">Cadastre honorários para ver o ranking de clientes</p>
          ) : (
            <BarChart
              data={topClientsData}
              orientation="horizontal"
              currency
            />
          )}
        </div>

        {/* Horizontal Bar: Revenue by Practice Area */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h3 className="text-sm font-semibold text-white mb-4">Honorários por Área de Atuação</h3>
          {revenueByAreaData.length === 0 ? (
            <p className="text-xs text-[#4a5568]">Vincule honorários a processos para ver dados por área</p>
          ) : (
            <BarChart
              data={revenueByAreaData}
              orientation="horizontal"
              currency
            />
          )}
        </div>
      </div>

      {/* Urgency Distribution */}
      {caseloadReport.byUrgency.length > 0 && (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4">Processos por Urgência</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {caseloadReport.byUrgency.map((u) => (
              <div
                key={u.urgency}
                className="rounded-lg p-4 border border-[#1a2332] text-center"
                style={{ borderLeftColor: u.color, borderLeftWidth: 3 }}
              >
                <p className="text-2xl font-bold" style={{ color: u.color }}>
                  {u.count}
                </p>
                <p className="text-xs text-[#6b7a8d] mt-1">{u.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
