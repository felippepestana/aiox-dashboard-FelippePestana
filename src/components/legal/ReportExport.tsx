'use client';

// =============================================================================
// ReportExport - Report generation and PDF export component
// Uses the existing pdf-export system and reporting-engine
// =============================================================================

import { useState } from 'react';
import { Download, ChevronDown, FileText, BarChart2, Users, Activity, Calendar, X, Loader2 } from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import {
  generateMonthlyFinancialReport,
  generateCaseloadReport,
  generateClientReport,
  generateProductivityReport,
  generateQuarterlyReport,
  fmtBRL,
} from '@/lib/reporting-engine';
import { exportFinancialReportPDF } from '@/lib/pdf-export';
import type { ReportStoreData } from '@/lib/reporting-engine';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = 'financial' | 'caseload' | 'client' | 'productivity' | 'quarterly';

interface ReportOption {
  type: ReportType;
  label: string;
  description: string;
  icon: React.ElementType;
}

const REPORT_OPTIONS: ReportOption[] = [
  { type: 'financial', label: 'Financeiro', description: 'Receita, despesas, lucro e impostos', icon: BarChart2 },
  { type: 'caseload', label: 'Processos', description: 'Distribuição, prazos e conformidade', icon: FileText },
  { type: 'client', label: 'Clientes', description: 'Carteira, receita e retenção', icon: Users },
  { type: 'productivity', label: 'Produtividade', description: 'Peças, prazos e tempo de resposta', icon: Activity },
  { type: 'quarterly', label: 'Trimestral', description: 'Resumo completo do trimestre', icon: Calendar },
];

// ─── Report Preview Modal ─────────────────────────────────────────────────────

interface ReportPreviewProps {
  type: ReportType;
  year: number;
  month: number;
  quarter: number;
  storeData: ReportStoreData;
  onClose: () => void;
  onExportPDF: () => Promise<void>;
  exporting: boolean;
}

function ReportPreviewModal({
  type,
  year,
  month,
  quarter,
  storeData,
  onClose,
  onExportPDF,
  exporting,
}: ReportPreviewProps) {
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const renderContent = () => {
    switch (type) {
      case 'financial': {
        const report = generateMonthlyFinancialReport(year, month, storeData);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3 text-center">
                <p className="text-xs text-[#6b7a8d]">Receita</p>
                <p className="text-lg font-bold text-green-400 mt-1">{fmtBRL(report.income)}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3 text-center">
                <p className="text-xs text-[#6b7a8d]">Despesas</p>
                <p className="text-lg font-bold text-red-400 mt-1">{fmtBRL(report.expenses)}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3 text-center">
                <p className="text-xs text-[#6b7a8d]">Lucro</p>
                <p className={`text-lg font-bold mt-1 ${report.profit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {fmtBRL(report.profit)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-2">Receita por Área</p>
              {report.revenueByArea.length === 0 ? (
                <p className="text-xs text-[#4a5568]">Sem dados de honorários neste período</p>
              ) : (
                <div className="space-y-1.5">
                  {report.revenueByArea.slice(0, 5).map((r) => (
                    <div key={r.area} className="flex justify-between text-sm">
                      <span className="text-[#8899aa]">{r.label}</span>
                      <span className="text-white font-medium">{fmtBRL(r.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {report.taxSummary.length > 0 && (
              <div>
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-2">Resumo de Impostos</p>
                <div className="space-y-1.5">
                  {report.taxSummary.map((t) => (
                    <div key={t.type} className="flex justify-between text-sm">
                      <span className="text-[#8899aa]">{t.type}</span>
                      <span className="text-red-400 font-medium">{fmtBRL(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'caseload': {
        const report = generateCaseloadReport(storeData);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Total de Processos</p>
                <p className="text-xl font-bold text-white mt-1">{report.totalProcesses}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Ativos</p>
                <p className="text-xl font-bold text-blue-400 mt-1">{report.activeProcesses}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Duração Média</p>
                <p className="text-xl font-bold text-white mt-1">{report.averageDurationDays}d</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Novos este Mês</p>
                <p className="text-xl font-bold text-green-400 mt-1">{report.newThisMonth}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-2">Por Área</p>
              <div className="space-y-1.5">
                {report.byArea.slice(0, 6).map((a) => (
                  <div key={a.area} className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
                    <span className="text-sm text-[#8899aa] flex-1">{a.label}</span>
                    <span className="text-sm font-medium text-white">{a.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'client': {
        const report = generateClientReport(storeData);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Total Clientes</p>
                <p className="text-xl font-bold text-white mt-1">{report.totalClients}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Clientes Ativos</p>
                <p className="text-xl font-bold text-green-400 mt-1">{report.activeClients}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Taxa de Retenção</p>
                <p className="text-xl font-bold text-blue-400 mt-1">{report.retentionRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Receita Média</p>
                <p className="text-xl font-bold text-amber-400 mt-1">
                  {report.averageRevenuePerClient >= 1000
                    ? `R$${(report.averageRevenuePerClient / 1000).toFixed(0)}k`
                    : fmtBRL(report.averageRevenuePerClient)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-2">Top Clientes</p>
              <div className="space-y-1.5">
                {report.revenuePerClient.slice(0, 5).map((c, i) => (
                  <div key={c.clientId} className="flex items-center gap-2">
                    <span className="text-xs text-[#6b7a8d] w-4">{i + 1}</span>
                    <span className="text-sm text-[#8899aa] flex-1 truncate">{c.name}</span>
                    <span className="text-sm font-medium text-amber-400">{fmtBRL(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      case 'productivity': {
        const report = generateProductivityReport(storeData);
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Peças Criadas</p>
                <p className="text-xl font-bold text-white mt-1">{report.petitionsCreated}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Protocoladas</p>
                <p className="text-xl font-bold text-green-400 mt-1">{report.petitionsFiled}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Prazos Cumpridos</p>
                <p className="text-xl font-bold text-green-400 mt-1">{report.deadlinesMet}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Prazos Perdidos</p>
                <p className="text-xl font-bold text-red-400 mt-1">{report.deadlinesMissed}</p>
              </div>
            </div>
            <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3 flex items-center justify-between">
              <span className="text-sm text-[#8899aa]">Conformidade de Prazos</span>
              <span
                className="text-lg font-bold"
                style={{
                  color: report.deadlineComplianceRate >= 80
                    ? '#22c55e'
                    : report.deadlineComplianceRate >= 60
                    ? '#f59e0b'
                    : '#ef4444',
                }}
              >
                {report.deadlineComplianceRate.toFixed(1)}%
              </span>
            </div>
            <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3 flex items-center justify-between">
              <span className="text-sm text-[#8899aa]">Tempo Médio de Resposta</span>
              <span className="text-lg font-bold text-white">{report.averageResponseTimeDays}d</span>
            </div>
          </div>
        );
      }

      case 'quarterly': {
        const report = generateQuarterlyReport(year, quarter, storeData);
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
              <span className="text-sm font-medium text-white">Score de Saúde</span>
              <span
                className="text-xl font-bold"
                style={{
                  color: report.healthScore >= 80 ? '#22c55e' : report.healthScore >= 60 ? '#f59e0b' : '#ef4444',
                }}
              >
                {report.healthScore}/100
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-2 text-center">
                <p className="text-xs text-[#6b7a8d]">Receita</p>
                <p className="text-sm font-bold text-green-400 mt-0.5">
                  {report.financial.totalIncome >= 1000
                    ? `R$${(report.financial.totalIncome / 1000).toFixed(0)}k`
                    : fmtBRL(report.financial.totalIncome)}
                </p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-2 text-center">
                <p className="text-xs text-[#6b7a8d]">Despesas</p>
                <p className="text-sm font-bold text-red-400 mt-0.5">
                  {report.financial.totalExpenses >= 1000
                    ? `R$${(report.financial.totalExpenses / 1000).toFixed(0)}k`
                    : fmtBRL(report.financial.totalExpenses)}
                </p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-2 text-center">
                <p className="text-xs text-[#6b7a8d]">Lucro</p>
                <p className={`text-sm font-bold mt-0.5 ${report.financial.totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                  {report.financial.totalProfit >= 1000 || report.financial.totalProfit <= -1000
                    ? `${report.financial.totalProfit >= 0 ? '' : '-'}R$${(Math.abs(report.financial.totalProfit) / 1000).toFixed(0)}k`
                    : fmtBRL(report.financial.totalProfit)}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-2">Por Mês</p>
              <div className="space-y-1.5">
                {report.financial.byMonth.map((m) => (
                  <div key={m.month} className="flex items-center gap-2 text-sm">
                    <span className="text-[#6b7a8d] w-16 flex-shrink-0">{m.month}</span>
                    <span className="text-green-400 flex-1">{fmtBRL(m.income)}</span>
                    <span className={m.profit >= 0 ? 'text-blue-400' : 'text-red-400'}>
                      {m.profit >= 0 ? '+' : ''}{fmtBRL(m.profit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Processos</p>
                <p className="text-xl font-bold text-white mt-1">{report.caseload.totalProcesses}</p>
              </div>
              <div className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3">
                <p className="text-xs text-[#6b7a8d]">Conformidade</p>
                <p className="text-xl font-bold text-white mt-1">
                  {report.productivity.deadlineComplianceRate.toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const reportOption = REPORT_OPTIONS.find((o) => o.type === type)!;
  const Icon = reportOption.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1a2332]">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
              <Icon className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Relatório {reportOption.label}
              </h3>
              <p className="text-xs text-[#6b7a8d]">
                {type === 'quarterly'
                  ? `${year} — Q${quarter}`
                  : type === 'caseload' || type === 'client' || type === 'productivity'
                  ? 'Snapshot atual'
                  : `${monthNames[month - 1]} ${year}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#6b7a8d] hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{renderContent()}</div>

        {/* Footer */}
        <div className="p-5 border-t border-[#1a2332] flex items-center justify-between gap-3">
          <p className="text-xs text-[#6b7a8d]">
            {type === 'financial'
              ? 'Exporta via jsPDF com tabelas de transações'
              : 'Exportação completa em PDF disponível para relatório financeiro'}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-[#6b7a8d] hover:text-white border border-[#1a2332] hover:border-[#374151] transition-colors"
            >
              Fechar
            </button>
            {type === 'financial' && (
              <button
                onClick={onExportPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-60"
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ReportExport() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [exporting, setExporting] = useState(false);

  const { processes, clients, deadlines, petitions } = useLegalStore();
  const { transactions, honorarios } = useLegalFinancialStore();

  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [quarter] = useState(Math.ceil((now.getMonth() + 1) / 3));

  const storeData = {
    processes,
    clients,
    deadlines,
    petitions,
    transactions,
    honorarios,
  };

  async function handleExportPDF() {
    if (!selectedType || selectedType !== 'financial') return;
    setExporting(true);
    try {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      const periodTxns = transactions.filter((t) => t.date.startsWith(prefix));
      const income = periodTxns.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = periodTxns.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      await exportFinancialReportPDF({
        transactions: periodTxns,
        totalIncome: income * 100, // pdf-export expects cents
        totalExpense: expense * 100,
        balance: (income - expense) * 100,
        period: prefix,
      });
    } catch (err) {
      console.error('[ReportExport] PDF export failed:', err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
      >
        <Download className="h-4 w-4" />
        Gerar Relatório
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 z-40 rounded-xl border border-[#1a2332] bg-[#0d1320] shadow-xl w-72 p-2">
            <p className="text-xs text-[#6b7a8d] uppercase tracking-wider px-3 pt-1 pb-2">
              Tipo de Relatório
            </p>
            {REPORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.type}
                  onClick={() => {
                    setSelectedType(option.type);
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-left hover:bg-[#1a2332] transition-colors group"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors">
                    <Icon className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{option.label}</p>
                    <p className="text-xs text-[#6b7a8d] truncate">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {selectedType && (
        <ReportPreviewModal
          type={selectedType}
          year={year}
          month={month}
          quarter={quarter}
          storeData={storeData}
          onClose={() => setSelectedType(null)}
          onExportPDF={handleExportPDF}
          exporting={exporting}
        />
      )}
    </div>
  );
}
