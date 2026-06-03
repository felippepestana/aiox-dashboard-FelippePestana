'use client';

import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Activity,
  Clock,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import type { LegalTransaction, Honorario, LegalInvoice } from '@/types/legal';
import { generateForecast } from '@/lib/cash-flow-forecast';
import { CashFlowChart } from './CashFlowChart';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CashFlowForecastProps {
  transactions: LegalTransaction[];
  honorarios: Honorario[];
  invoices: LegalInvoice[];
  currentBalance?: number;
}

type Period = 3 | 6 | 12;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatRunway(months: number): string {
  if (!isFinite(months) || months > 120) return 'Sustentável';
  if (months === 0) return '< 1 mês';
  if (months < 1) return `${Math.round(months * 30)} dias`;
  return `${Math.round(months)} meses`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CashFlowForecast({
  transactions,
  honorarios,
  invoices,
}: CashFlowForecastProps) {
  const [period, setPeriod] = useState<Period>(6);

  const forecast = useMemo(
    () => generateForecast(transactions, honorarios, invoices, period),
    [transactions, honorarios, invoices, period],
  );

  const {
    combined,
    projections,
    avgMonthlyIncome,
    avgMonthlyExpenses,
    burnRate,
    runwayMonths,
    risks,
  } = forecast;

  const totalProjectedIncome = projections.reduce((s, p) => s + p.income, 0);
  const totalProjectedExpenses = projections.reduce((s, p) => s + p.expenses, 0);
  const totalProjectedBalance = totalProjectedIncome - totalProjectedExpenses;

  const criticalRisks = risks.filter((r) => r.severity === 'critical');
  const warningRisks = risks.filter((r) => r.severity === 'warning');

  const PERIODS: { value: Period; label: string }[] = [
    { value: 3, label: '3 meses' },
    { value: 6, label: '6 meses' },
    { value: 12, label: '12 meses' },
  ];

  return (
    <div className="space-y-6">
      {/* Header row with period selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-400" />
            Projeção de Fluxo de Caixa
          </h2>
          <p className="text-xs text-[#6b7a8d] mt-0.5">
            Baseado em dados históricos, honorários recorrentes e faturas pendentes
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-1">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                period === value
                  ? 'bg-amber-500 text-black'
                  : 'text-[#6b7a8d] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          label="Receita Projetada"
          value={formatBRL(totalProjectedIncome)}
          sub={`média ${formatBRL(avgMonthlyIncome)}/mês`}
          iconBg="bg-green-500/10"
          iconColor="text-green-400"
          icon={<TrendingUp className="h-4 w-4" />}
          positive
        />
        <SummaryCard
          label="Despesas Projetadas"
          value={formatBRL(totalProjectedExpenses)}
          sub={`média ${formatBRL(avgMonthlyExpenses)}/mês`}
          iconBg="bg-red-500/10"
          iconColor="text-red-400"
          icon={<TrendingDown className="h-4 w-4" />}
          positive={false}
        />
        <SummaryCard
          label="Resultado Projetado"
          value={formatBRL(totalProjectedBalance)}
          sub={`${period} meses à frente`}
          iconBg={totalProjectedBalance >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'}
          iconColor={totalProjectedBalance >= 0 ? 'text-blue-400' : 'text-red-400'}
          icon={<BarChart3 className="h-4 w-4" />}
          positive={totalProjectedBalance >= 0}
        />
        <SummaryCard
          label="Runway"
          value={formatRunway(runwayMonths)}
          sub={
            burnRate >= 0
              ? `crescimento +${formatBRL(burnRate)}/mês`
              : `queima ${formatBRL(Math.abs(burnRate))}/mês`
          }
          iconBg={runwayMonths > 6 || !isFinite(runwayMonths) ? 'bg-emerald-500/10' : 'bg-amber-500/10'}
          iconColor={runwayMonths > 6 || !isFinite(runwayMonths) ? 'text-emerald-400' : 'text-amber-400'}
          icon={<Clock className="h-4 w-4" />}
          positive={runwayMonths > 6 || !isFinite(runwayMonths)}
        />
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
        <CashFlowChart data={combined} height={300} />
      </div>

      {/* Key metrics row */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricRow
          label="Receita Média Mensal"
          value={formatBRL(avgMonthlyIncome)}
          color="text-green-400"
        />
        <MetricRow
          label="Despesa Média Mensal"
          value={formatBRL(avgMonthlyExpenses)}
          color="text-red-400"
        />
        <MetricRow
          label="Queima / Geração Líquida"
          value={formatBRL(Math.abs(burnRate))}
          suffix={burnRate >= 0 ? ' geração' : ' queima'}
          color={burnRate >= 0 ? 'text-blue-400' : 'text-orange-400'}
        />
      </div>

      {/* Risk alerts */}
      {risks.length > 0 && (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Alertas de Risco
            {criticalRisks.length > 0 && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                <AlertCircle className="h-3 w-3" />
                {criticalRisks.length} crítico{criticalRisks.length > 1 ? 's' : ''}
              </span>
            )}
            {warningRisks.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                <AlertTriangle className="h-3 w-3" />
                {warningRisks.length} aviso{warningRisks.length > 1 ? 's' : ''}
              </span>
            )}
          </h3>
          <div className="space-y-2">
            {risks.map((risk, i) => (
              <RiskAlert key={`${risk.monthKey}-${risk.severity}-${i}`} risk={risk} />
            ))}
          </div>
        </div>
      )}

      {/* No risk */}
      {risks.length === 0 && projections.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <Info className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-sm text-emerald-300">
            Nenhum risco de fluxo de caixa identificado nos próximos {period} meses com base nas projeções atuais.
          </p>
        </div>
      )}

      {/* No data state */}
      {projections.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-[#6b7a8d]">
          <Activity className="h-8 w-8 mb-2" />
          <p className="text-sm">Adicione transações para gerar projeções</p>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  positive: boolean;
}

function SummaryCard({ label, value, sub, icon, iconBg, iconColor }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider truncate">{label}</p>
          <p className="text-lg font-bold text-white mt-1 truncate">{value}</p>
          <p className="text-[10px] text-[#6b7a8d] mt-0.5 truncate">{sub}</p>
        </div>
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg} ${iconColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  color: string;
  suffix?: string;
}

function MetricRow({ label, value, color, suffix }: MetricRowProps) {
  return (
    <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] px-4 py-3 flex items-center justify-between gap-3">
      <span className="text-xs text-[#6b7a8d] truncate">{label}</span>
      <span className={`text-sm font-semibold ${color} shrink-0`}>
        {value}
        {suffix && <span className="text-[10px] font-normal text-[#6b7a8d] ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

function RiskAlert({ risk }: { risk: { severity: string; message: string } }) {
  const isCritical = risk.severity === 'critical';
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 ${
        isCritical
          ? 'border-red-500/20 bg-red-500/5'
          : 'border-amber-500/20 bg-amber-500/5'
      }`}
    >
      {isCritical ? (
        <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
      ) : (
        <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
      )}
      <p className={`text-xs ${isCritical ? 'text-red-300' : 'text-amber-300'}`}>
        {risk.message}
      </p>
    </div>
  );
}
