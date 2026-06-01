'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Calculator,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Calendar,
  BarChart3,
  TrendingDown,
  Info,
} from 'lucide-react';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import { useLegalStore } from '@/stores/legal-store';
import {
  calculateTaxes,
  calculateQuarterlyIRPJ,
  compareTaxRegimes,
  getTaxCalendar,
  REGIME_LABELS,
  type TaxRegime,
  type TaxBreakdown,
} from '@/lib/tax-calculator';
import { generateTaxDeadlines } from '@/lib/tax-deadlines';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatPct(value: number): string {
  return `${value.toFixed(2)}%`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TaxBreakdownRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 rounded-lg ${highlight ? 'bg-amber-500/10' : 'bg-[#0a0f1a]'}`}>
      <span className="text-sm text-[#6b7a8d]">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-amber-400' : 'text-white'}`}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function RegimeCard({
  regime,
  breakdown,
  recommended,
  monthlyRevenue,
}: {
  regime: TaxRegime;
  breakdown: TaxBreakdown;
  recommended: boolean;
  monthlyRevenue: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const effectiveRate = monthlyRevenue > 0 ? (breakdown.total / monthlyRevenue) * 100 : 0;

  return (
    <div className={`rounded-xl border p-5 transition-all ${recommended ? 'border-green-500/30 bg-[#0d1a14]' : 'border-[#1a2332] bg-[#0d1320]'}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-white">{REGIME_LABELS[regime]}</h3>
          {recommended && (
            <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
              <CheckCircle2 className="h-3 w-3" /> Mais vantajoso
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">{formatCurrency(breakdown.total)}</p>
          <p className="text-xs text-[#6b7a8d] mt-0.5">carga efetiva: {formatPct(effectiveRate)}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <TaxBreakdownRow label="IRPJ" value={breakdown.irpj} />
        <TaxBreakdownRow label="CSLL" value={breakdown.csll} />
        <TaxBreakdownRow label="PIS" value={breakdown.pis} />
        <TaxBreakdownRow label="COFINS" value={breakdown.cofins} />
        <TaxBreakdownRow label="ISS" value={breakdown.iss} />
        <TaxBreakdownRow label="Total Mensal" value={breakdown.total} highlight />
      </div>

      {Object.keys(breakdown.details).filter(k => k !== 'error').length > 0 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 flex items-center gap-1 text-xs text-[#6b7a8d] hover:text-white transition-colors"
        >
          {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {expanded ? 'Ocultar detalhes' : 'Ver cálculo detalhado'}
        </button>
      )}

      {expanded && (
        <div className="mt-3 rounded-lg border border-[#1a2332] bg-[#070c15] p-3 space-y-1">
          {Object.entries(breakdown.details)
            .filter(([k]) => k !== 'error')
            .map(([key, val]) => (
              <div key={key} className="flex items-start justify-between gap-4">
                <span className="text-xs text-[#4a5568] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-xs text-[#6b7a8d] text-right">{val}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TaxesPage() {
  const { taxObligations, payTaxObligation, getPendingTaxObligations, addTaxObligation, getTotalRevenue, getTotalExpenses } = useLegalFinancialStore();
  const { addDeadline } = useLegalStore();

  const pending = getPendingTaxObligations();

  // ── Regime & Inputs ────────────────────────────────────────────────────────
  const [regime, setRegime] = useState<TaxRegime>('presumido');
  const [city, setCity] = useState('São Paulo');
  const [useStoreRevenue, setUseStoreRevenue] = useState(true);
  const [customRevenue, setCustomRevenue] = useState('');
  const [customExpenses, setCustomExpenses] = useState('');
  const [activeTab, setActiveTab] = useState<'obligations' | 'compare' | 'calendar' | 'quarterly'>('obligations');
  const [generatingDeadlines, setGeneratingDeadlines] = useState(false);
  const [deadlinesGenerated, setDeadlinesGenerated] = useState(false);

  const currentYear = new Date().getFullYear();

  // Receita de referencia
  const storeRevenue = getTotalRevenue();
  const storeExpenses = getTotalExpenses();
  const monthlyRevenue = useStoreRevenue
    ? storeRevenue / 12
    : parseFloat(customRevenue) || 0;
  const monthlyExpenses = useStoreRevenue
    ? storeExpenses / 12
    : parseFloat(customExpenses) || 0;

  // ── Calculos ───────────────────────────────────────────────────────────────
  const currentTaxes = useMemo(
    () => calculateTaxes(regime, monthlyRevenue, monthlyExpenses, city),
    [regime, monthlyRevenue, monthlyExpenses, city]
  );

  const comparison = useMemo(
    () => compareTaxRegimes(monthlyRevenue, monthlyExpenses, city),
    [monthlyRevenue, monthlyExpenses, city]
  );

  const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
  const quarterlyCalc = useMemo(() => {
    if (regime === 'simples') return null;
    return calculateQuarterlyIRPJ(regime as 'presumido' | 'real', monthlyRevenue * 3, monthlyExpenses * 3, currentQuarter, currentYear);
  }, [regime, monthlyRevenue, monthlyExpenses, currentQuarter, currentYear]);

  const taxCalendar = useMemo(
    () => getTaxCalendar(currentYear, regime),
    [currentYear, regime]
  );

  // ── Gerar Prazos Fiscais ───────────────────────────────────────────────────
  function handleGenerateDeadlines() {
    setGeneratingDeadlines(true);
    try {
      const deadlines = generateTaxDeadlines({
        year: currentYear,
        regime,
        monthlyRevenue,
        monthlyPis: currentTaxes.pis,
        monthlyCofins: currentTaxes.cofins,
        monthlyISS: currentTaxes.iss,
        monthlyDAS: currentTaxes.total,
        irpjPerQuarter: quarterlyCalc?.irpjTotal ?? currentTaxes.irpj * 3,
        csllPerQuarter: quarterlyCalc?.csll ?? currentTaxes.csll * 3,
      });

      for (const deadline of deadlines) {
        addDeadline(deadline);
      }
      setDeadlinesGenerated(true);
    } finally {
      setGeneratingDeadlines(false);
    }
  }

  // ── Labels e Status ────────────────────────────────────────────────────────
  const taxLabels: Record<string, string> = {
    irpj: 'IRPJ',
    csll: 'CSLL',
    iss: 'ISS',
    pis_cofins: 'PIS/COFINS',
  };

  const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
    pending: { color: 'text-yellow-400', icon: Clock, label: 'Pendente' },
    paid: { color: 'text-green-400', icon: CheckCircle2, label: 'Pago' },
    overdue: { color: 'text-red-400', icon: AlertCircle, label: 'Vencido' },
  };

  const tabs = [
    { id: 'obligations' as const, label: 'Obrigações', icon: Building2 },
    { id: 'compare' as const, label: 'Comparar Regimes', icon: BarChart3 },
    { id: 'quarterly' as const, label: 'IRPJ Trimestral', icon: TrendingDown },
    { id: 'calendar' as const, label: 'Calendário Fiscal', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Calculator className="h-7 w-7 text-amber-400" />
            Planejamento Tributário
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Calculadora de impostos para escritório de advocacia
          </p>
        </div>
        <button
          onClick={handleGenerateDeadlines}
          disabled={generatingDeadlines}
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-60 transition-colors"
        >
          {generatingDeadlines ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Calendar className="h-4 w-4" />
          )}
          Gerar Prazos Fiscais {currentYear}
        </button>
      </div>

      {deadlinesGenerated && (
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0" />
          <p className="text-sm text-green-400">
            Prazos fiscais de {currentYear} gerados com sucesso! Acesse a seção <strong>Prazos</strong> para visualizar.
          </p>
        </div>
      )}

      {/* Regime & Revenue Config */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Info className="h-4 w-4 text-amber-400" />
          Configuração do Cálculo
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Regime selector */}
          <div>
            <label className="block text-xs font-medium text-[#6b7a8d] mb-2">Regime Tributário</label>
            <div className="flex flex-col gap-1.5">
              {(['simples', 'presumido', 'real'] as TaxRegime[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegime(r)}
                  className={`w-full rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors border ${
                    regime === r
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'text-[#6b7a8d] border-[#1a2332] hover:border-amber-500/20'
                  }`}
                >
                  {REGIME_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue source */}
          <div>
            <label className="block text-xs font-medium text-[#6b7a8d] mb-2">Base de Receita</label>
            <div className="space-y-2">
              <button
                onClick={() => setUseStoreRevenue(true)}
                className={`w-full rounded-lg px-3 py-2 text-sm text-left border transition-colors ${
                  useStoreRevenue
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'text-[#6b7a8d] border-[#1a2332]'
                }`}
              >
                Usar dados do sistema
                {useStoreRevenue && (
                  <span className="block text-xs text-[#6b7a8d] mt-0.5">
                    {formatCurrency(monthlyRevenue)}/mês
                  </span>
                )}
              </button>
              <button
                onClick={() => setUseStoreRevenue(false)}
                className={`w-full rounded-lg px-3 py-2 text-sm text-left border transition-colors ${
                  !useStoreRevenue
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'text-[#6b7a8d] border-[#1a2332]'
                }`}
              >
                Receita manual
              </button>
            </div>
          </div>

          {/* Custom revenue inputs */}
          <div>
            <label className="block text-xs font-medium text-[#6b7a8d] mb-2">Receita Mensal (R$)</label>
            <input
              type="number"
              disabled={useStoreRevenue}
              value={useStoreRevenue ? monthlyRevenue.toFixed(2) : customRevenue}
              onChange={(e) => setCustomRevenue(e.target.value)}
              placeholder="ex: 50000"
              min="0"
              step="100"
              className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
            />
            {regime === 'real' && (
              <>
                <label className="block text-xs font-medium text-[#6b7a8d] mb-2 mt-3">Despesas Mensais (R$)</label>
                <input
                  type="number"
                  disabled={useStoreRevenue}
                  value={useStoreRevenue ? monthlyExpenses.toFixed(2) : customExpenses}
                  onChange={(e) => setCustomExpenses(e.target.value)}
                  placeholder="ex: 20000"
                  min="0"
                  step="100"
                  className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none disabled:opacity-50"
                />
              </>
            )}
          </div>

          {/* City for ISS */}
          <div>
            <label className="block text-xs font-medium text-[#6b7a8d] mb-2">Município (ISS)</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {['São Paulo', 'Rio de Janeiro', 'Curitiba', 'Porto Alegre', 'Belo Horizonte', 'Brasília', 'Salvador', 'Fortaleza', 'Manaus'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Current calculation summary */}
            <div className="mt-3 rounded-lg bg-[#070c15] p-3 border border-[#1a2332]">
              <p className="text-xs text-[#6b7a8d] mb-1">Impostos mensais estimados</p>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(currentTaxes.total)}</p>
              {monthlyRevenue > 0 && (
                <p className="text-xs text-[#6b7a8d] mt-0.5">
                  {formatPct((currentTaxes.total / monthlyRevenue) * 100)} da receita
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'IRPJ', value: currentTaxes.irpj, color: 'text-red-400', bg: 'bg-red-500/10' },
          { label: 'CSLL', value: currentTaxes.csll, color: 'text-orange-400', bg: 'bg-orange-500/10' },
          { label: 'PIS/COFINS', value: currentTaxes.pis + currentTaxes.cofins, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'ISS', value: currentTaxes.iss, color: 'text-purple-400', bg: 'bg-purple-500/10' },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
            <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">{card.label} / mês</p>
            <p className={`text-xl font-bold mt-1 ${card.color}`}>{formatCurrency(card.value)}</p>
            <div className={`mt-2 h-1 w-full rounded-full ${card.bg}`} />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-[#1a2332] bg-[#0d1320] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'text-[#6b7a8d] hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Obrigacoes */}
      {activeTab === 'obligations' && (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
              <p className="text-sm text-yellow-400">
                Você tem <strong>{pending.length}</strong> obrigação(ões) tributária(s) pendente(s)
              </p>
            </div>
          )}

          {taxObligations.length === 0 ? (
            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
              <Building2 className="h-12 w-12 text-[#2a3342] mx-auto mb-4" />
              <p className="text-[#6b7a8d]">Nenhuma obrigação tributária cadastrada</p>
              <p className="text-xs text-[#4a5568] mt-1">
                Clique em "Gerar Prazos Fiscais" para criar obrigações automaticamente
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {taxObligations
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                .map((tax) => {
                  const config = statusConfig[tax.status] ?? statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <div key={tax.id} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <StatusIcon className={`h-5 w-5 flex-shrink-0 ${config.color}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                                {taxLabels[tax.type] ?? tax.type.toUpperCase()}
                              </span>
                              <span className="text-sm text-white">{tax.period}</span>
                            </div>
                            <p className="text-xs text-[#6b7a8d] mt-1">
                              Vencimento: {tax.dueDate.split('T')[0]}
                              {tax.paidAt && ` | Pago em: ${tax.paidAt.split('T')[0]}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-lg font-bold text-white">{formatCurrency(tax.amount)}</p>
                          {tax.status === 'pending' && (
                            <button
                              onClick={() => payTaxObligation(tax.id)}
                              className="rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors"
                            >
                              Registrar Pagamento
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Comparar Regimes */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 flex items-start gap-3">
            <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#6b7a8d]">
              Comparação baseada em receita mensal de <strong className="text-white">{formatCurrency(monthlyRevenue)}</strong>
              {monthlyExpenses > 0 && ` com despesas de ${formatCurrency(monthlyExpenses)}`}.
              Para Simples Nacional, considera receita anual de {formatCurrency(monthlyRevenue * 12)}.
              <strong className="text-amber-400"> Regime recomendado: {REGIME_LABELS[comparison.recommended]}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <RegimeCard
              regime="simples"
              breakdown={comparison.simples.breakdown}
              recommended={comparison.recommended === 'simples'}
              monthlyRevenue={monthlyRevenue}
            />
            <RegimeCard
              regime="presumido"
              breakdown={comparison.presumido.breakdown}
              recommended={comparison.recommended === 'presumido'}
              monthlyRevenue={monthlyRevenue}
            />
            <RegimeCard
              regime="real"
              breakdown={comparison.real.breakdown}
              recommended={comparison.recommended === 'real'}
              monthlyRevenue={monthlyRevenue}
            />
          </div>

          {/* Savings table */}
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Economia comparativa (vs. regime atual)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1a2332]">
                    <th className="py-2 px-3 text-left text-xs font-medium text-[#6b7a8d]">Regime</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-[#6b7a8d]">Mensal</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-[#6b7a8d]">Anual</th>
                    <th className="py-2 px-3 text-right text-xs font-medium text-[#6b7a8d]">vs. atual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2332]">
                  {(
                    [
                      { r: 'simples' as TaxRegime, total: comparison.simples.total },
                      { r: 'presumido' as TaxRegime, total: comparison.presumido.total },
                      { r: 'real' as TaxRegime, total: comparison.real.total },
                    ] as { r: TaxRegime; total: number }[]
                  ).map(({ r, total }) => {
                    const diff = currentTaxes.total - total;
                    const isCurrent = r === regime;
                    return (
                      <tr key={r} className={`hover:bg-[#0a0f1a] transition-colors ${isCurrent ? 'opacity-60' : ''}`}>
                        <td className="py-2 px-3 text-white">
                          {REGIME_LABELS[r]}
                          {isCurrent && <span className="ml-2 text-xs text-[#6b7a8d]">(atual)</span>}
                        </td>
                        <td className="py-2 px-3 text-right text-white">{formatCurrency(total)}</td>
                        <td className="py-2 px-3 text-right text-[#6b7a8d]">{formatCurrency(total * 12)}</td>
                        <td className={`py-2 px-3 text-right font-medium ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-[#6b7a8d]'}`}>
                          {isCurrent ? '—' : diff > 0 ? `- ${formatCurrency(diff)}/mês` : diff < 0 ? `+ ${formatCurrency(Math.abs(diff))}/mês` : '='}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: IRPJ Trimestral */}
      {activeTab === 'quarterly' && (
        <div className="space-y-4">
          {regime === 'simples' ? (
            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
              <Calculator className="h-12 w-12 text-[#2a3342] mx-auto mb-4" />
              <p className="text-[#6b7a8d]">No Simples Nacional, o IRPJ é recolhido mensalmente via DAS</p>
              <p className="text-xs text-[#4a5568] mt-1">Selecione Lucro Presumido ou Lucro Real para ver a apuração trimestral</p>
            </div>
          ) : quarterlyCalc ? (
            <>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
                <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[#6b7a8d]">
                  Apuração do {currentQuarter}º trimestre de {currentYear} ({REGIME_LABELS[regime]}).
                  Receita trimestral estimada: <strong className="text-white">{formatCurrency(monthlyRevenue * 3)}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">IRPJ - {currentQuarter}T/{currentYear}</h3>
                  <div className="space-y-2">
                    <TaxBreakdownRow label="Receita Trimestral" value={quarterlyCalc.quarterlyRevenue} />
                    <TaxBreakdownRow label="Base de Cálculo" value={quarterlyCalc.baseCalculo} />
                    <TaxBreakdownRow label="IRPJ (15%)" value={quarterlyCalc.irpjBase} />
                    {quarterlyCalc.irpjAdicional > 0 && (
                      <TaxBreakdownRow label="Adicional IRPJ (10%)" value={quarterlyCalc.irpjAdicional} />
                    )}
                    <TaxBreakdownRow label="IRPJ Total" value={quarterlyCalc.irpjTotal} highlight />
                  </div>
                </div>

                <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
                  <h3 className="text-sm font-semibold text-white mb-4">CSLL - {currentQuarter}T/{currentYear}</h3>
                  <div className="space-y-2">
                    <TaxBreakdownRow label="Receita Trimestral" value={quarterlyCalc.quarterlyRevenue} />
                    <TaxBreakdownRow label="Base de Cálculo" value={quarterlyCalc.baseCalculo} />
                    <TaxBreakdownRow label="CSLL (9%)" value={quarterlyCalc.csll} highlight />
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#1a2332]">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#6b7a8d]">DARF Total Trimestral</span>
                      <span className="text-xl font-bold text-amber-400">
                        {formatCurrency(quarterlyCalc.irpjTotal + quarterlyCalc.csll)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhes calculo */}
              <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
                <h3 className="text-sm font-semibold text-white mb-3">Detalhes do Cálculo</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(quarterlyCalc.details).map(([key, val]) => (
                    <div key={key} className="flex items-start justify-between gap-4 py-1.5 px-2 rounded bg-[#0a0f1a]">
                      <span className="text-xs text-[#4a5568] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-xs text-[#6b7a8d] text-right">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Tab: Calendario Fiscal */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 flex items-start gap-3">
            <Calendar className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#6b7a8d]">
              Calendário fiscal {currentYear} para <strong className="text-white">{REGIME_LABELS[regime]}</strong>.
              Prazos ajustados para próximo dia útil quando coincidem com fins de semana ou feriados.
            </p>
          </div>

          <div className="space-y-2">
            {taxCalendar.map((entry, idx) => {
              const dueDate = new Date(entry.dueDate);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isPast = dueDate < today;
              const isNear = !isPast && (dueDate.getTime() - today.getTime()) <= 30 * 24 * 60 * 60 * 1000;

              const typeColors: Record<string, string> = {
                monthly: 'bg-blue-500/10 text-blue-400',
                quarterly: 'bg-amber-500/10 text-amber-400',
                annual: 'bg-purple-500/10 text-purple-400',
              };
              const typeLabels: Record<string, string> = {
                monthly: 'Mensal',
                quarterly: 'Trimestral',
                annual: 'Anual',
              };

              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-4 flex items-center justify-between transition-colors ${
                    isPast ? 'opacity-50 border-[#1a2332] bg-[#0a0f1a]' : isNear ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-[#1a2332] bg-[#0d1320]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isPast ? (
                      <CheckCircle2 className="h-4 w-4 text-[#4a5568]" />
                    ) : isNear ? (
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <Clock className="h-4 w-4 text-[#6b7a8d]" />
                    )}
                    <div>
                      <span className="text-sm text-white">{entry.description}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${typeColors[entry.type] ?? 'bg-gray-500/10 text-gray-400'}`}>
                          {typeLabels[entry.type] ?? entry.type}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-400">
                          {entry.tax}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-medium ${isPast ? 'text-[#4a5568]' : isNear ? 'text-yellow-400' : 'text-white'}`}>
                      {dueDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                    {isNear && (
                      <p className="text-xs text-yellow-400/70 mt-0.5">
                        {Math.ceil((dueDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))} dias
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
