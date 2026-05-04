'use client';

import { useState, useMemo } from 'react';
import {
  Calculator,
  Clock,
  TrendingUp,
  Briefcase,
  DollarSign,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { DeadlineCalculator } from '@/components/legal/DeadlineCalculator';
import {
  calculateMonetaryCorrection,
  calculateLaborTermination,
  type CorrectionIndex,
  type TerminationReason,
  type CorrectionResult,
  type LaborCalculationResult,
} from '@/lib/deadline-calculator';

type TabId = 'prazos' | 'correcao' | 'trabalhista';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Clock;
  description: string;
}

const TABS: Tab[] = [
  { id: 'prazos', label: 'Prazos Processuais', icon: Clock, description: 'Calculo de prazos em dias uteis e corridos' },
  { id: 'correcao', label: 'Correcao Monetaria', icon: TrendingUp, description: 'Atualizacao de valores por indices oficiais' },
  { id: 'trabalhista', label: 'Verbas Trabalhistas', icon: Briefcase, description: 'Calculo simplificado de rescisao' },
];

const CORRECTION_INDICES: { value: CorrectionIndex; label: string; description: string }[] = [
  { value: 'IPCA', label: 'IPCA', description: 'Indice de Precos ao Consumidor Amplo' },
  { value: 'INPC', label: 'INPC', description: 'Indice Nacional de Precos ao Consumidor' },
  { value: 'IGP-M', label: 'IGP-M', description: 'Indice Geral de Precos - Mercado' },
  { value: 'Selic', label: 'Selic', description: 'Taxa Selic acumulada' },
  { value: 'TR', label: 'TR', description: 'Taxa Referencial' },
];

const TERMINATION_REASONS: { value: TerminationReason; label: string }[] = [
  { value: 'sem_justa_causa', label: 'Demissao sem justa causa' },
  { value: 'justa_causa', label: 'Demissao por justa causa' },
  { value: 'pedido_demissao', label: 'Pedido de demissao' },
  { value: 'acordo_mutuo', label: 'Acordo mutuo (Art. 484-A CLT)' },
];

export default function CalculatorPage() {
  const [activeTab, setActiveTab] = useState<TabId>('prazos');

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Calculator className="h-7 w-7 text-amber-400" />
          Calculadoras Juridicas
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Ferramentas de calculo para a pratica juridica
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[#1a2332] pb-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                isActive
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-[#6b7a8d] hover:text-white hover:bg-[#0d1320]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        {activeTab === 'prazos' && <PrazosTab />}
        {activeTab === 'correcao' && <CorrecaoTab />}
        {activeTab === 'trabalhista' && <TrabalhistaTab />}
      </div>
    </div>
  );
}

// =============================================================================
// Tab 1: Prazos Processuais
// =============================================================================
function PrazosTab() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Prazos Processuais</h2>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Calcule prazos em dias uteis (CPC) ou corridos (CLT/CPP), considerando feriados nacionais e recesso forense.
        </p>
      </div>
      <DeadlineCalculator />
    </div>
  );
}

// =============================================================================
// Tab 2: Correcao Monetaria
// =============================================================================
function CorrecaoTab() {
  const [originalValue, setOriginalValue] = useState(10000);
  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');
  const [index, setIndex] = useState<CorrectionIndex>('IPCA');
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  function handleCalculate() {
    if (!startDateStr || !endDateStr || originalValue <= 0) return;

    const startDate = new Date(startDateStr + 'T12:00:00');
    const endDate = new Date(endDateStr + 'T12:00:00');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
    if (endDate <= startDate) return;

    const correction = calculateMonetaryCorrection(originalValue, startDate, endDate, index);
    setResult(correction);
  }

  function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Correcao Monetaria</h2>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Calcule a atualizacao monetaria de valores utilizando indices oficiais.
        </p>
        <div className="flex items-center gap-2 mt-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
          <Info className="h-4 w-4 text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-yellow-400">
            Valores ilustrativos para referencia. Consulte tabelas oficiais do tribunal para calculos vinculantes.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#8899aa] mb-1.5">Valor Original (R$)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={originalValue}
            onChange={(e) => setOriginalValue(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#8899aa] mb-1.5">Data Inicial</label>
          <input
            type="date"
            value={startDateStr}
            onChange={(e) => setStartDateStr(e.target.value)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#8899aa] mb-1.5">Data Final</label>
          <input
            type="date"
            value={endDateStr}
            onChange={(e) => setEndDateStr(e.target.value)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#8899aa] mb-1.5">Indice</label>
          <select
            value={index}
            onChange={(e) => setIndex(e.target.value as CorrectionIndex)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          >
            {CORRECTION_INDICES.map((idx) => (
              <option key={idx.value} value={idx.value}>
                {idx.label} - {idx.description}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <button
            onClick={handleCalculate}
            disabled={!startDateStr || !endDateStr || originalValue <= 0}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
          >
            <Calculator className="h-4 w-4" />
            Calcular
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-400" />
            Resultado da Correcao
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rounded-lg border border-[#1a2332] bg-[#0d1320] p-4">
              <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-1">Valor Original</p>
              <p className="text-lg font-bold text-white">{formatCurrency(result.originalValue)}</p>
            </div>
            <div className="rounded-lg border border-[#1a2332] bg-[#0d1320] p-4">
              <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-1">Periodo</p>
              <p className="text-lg font-bold text-white">{result.months} meses</p>
              <p className="text-xs text-[#6b7a8d] mt-0.5">Indice: {result.index}</p>
            </div>
            <div className="rounded-lg border border-[#1a2332] bg-[#0d1320] p-4">
              <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-1">Correcao</p>
              <p className="text-lg font-bold text-emerald-400">+{result.correctionPercentage}%</p>
              <p className="text-xs text-[#6b7a8d] mt-0.5">
                +{formatCurrency(result.correctedValue - result.originalValue)}
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="text-xs text-amber-400 uppercase tracking-wider mb-1">Valor Corrigido</p>
              <p className="text-xl font-bold text-amber-400">{formatCurrency(result.correctedValue)}</p>
            </div>
          </div>

          {/* Monthly Breakdown Toggle */}
          {result.monthlyBreakdown.length > 0 && (
            <div>
              <button
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex items-center gap-2 text-sm text-[#8899aa] hover:text-white transition-colors"
              >
                {showBreakdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showBreakdown ? 'Ocultar' : 'Mostrar'} detalhamento mensal ({result.monthlyBreakdown.length} meses)
              </button>

              {showBreakdown && (
                <div className="mt-3 rounded-lg border border-[#1a2332] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#0a0f1a]">
                        <th className="text-left px-4 py-2 text-xs text-[#6b7a8d] font-medium uppercase">Mes</th>
                        <th className="text-right px-4 py-2 text-xs text-[#6b7a8d] font-medium uppercase">Taxa</th>
                        <th className="text-right px-4 py-2 text-xs text-[#6b7a8d] font-medium uppercase">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.monthlyBreakdown.map((row, idx) => (
                        <tr
                          key={idx}
                          className="border-t border-[#1a2332] hover:bg-[#0a0f1a]/50"
                        >
                          <td className="px-4 py-2 text-white">{row.month}</td>
                          <td className="px-4 py-2 text-right text-emerald-400">{row.rate}%</td>
                          <td className="px-4 py-2 text-right text-white font-medium">{formatCurrency(row.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Tab 3: Verbas Trabalhistas
// =============================================================================
function TrabalhistaTab() {
  const [salary, setSalary] = useState(3000);
  const [monthsWorked, setMonthsWorked] = useState(24);
  const [reason, setReason] = useState<TerminationReason>('sem_justa_causa');
  const [result, setResult] = useState<LaborCalculationResult | null>(null);

  function handleCalculate() {
    if (salary <= 0 || monthsWorked <= 0) return;
    const calc = calculateLaborTermination(salary, monthsWorked, reason);
    setResult(calc);
  }

  function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Verbas Trabalhistas</h2>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Calculo simplificado de verbas rescisorias. Valores para referencia inicial.
        </p>
        <div className="flex items-center gap-2 mt-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-2">
          <Info className="h-4 w-4 text-yellow-400 flex-shrink-0" />
          <p className="text-xs text-yellow-400">
            Calculo simplificado. Para valores exatos, consulte a convencao coletiva aplicavel e realize calculo detalhado.
          </p>
        </div>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-[#8899aa] mb-1.5">Salario Mensal (R$)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={salary}
            onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#8899aa] mb-1.5">Meses Trabalhados</label>
          <input
            type="number"
            min={1}
            max={480}
            value={monthsWorked}
            onChange={(e) => setMonthsWorked(parseInt(e.target.value) || 1)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#8899aa] mb-1.5">Motivo da Rescisao</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value as TerminationReason)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
          >
            {TERMINATION_REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <button
            onClick={handleCalculate}
            disabled={salary <= 0 || monthsWorked <= 0}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
          >
            <Calculator className="h-4 w-4" />
            Calcular
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-amber-400" />
            Verbas Rescisorias
          </h3>

          <div className="space-y-2">
            {result.breakdown.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg border border-[#1a2332] bg-[#0d1320] px-4 py-3"
              >
                <span className="text-sm text-[#8899aa]">{item.label}</span>
                <span className={`text-sm font-medium ${item.value > 0 ? 'text-white' : 'text-[#4a5568]'}`}>
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-4">
            <span className="text-base font-semibold text-amber-400">TOTAL</span>
            <span className="text-xl font-bold text-amber-400">{formatCurrency(result.total)}</span>
          </div>

          {/* Info note for specific reason */}
          {reason === 'justa_causa' && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <Info className="h-4 w-4 text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-400">
                Na demissao por justa causa, o trabalhador perde direito a aviso previo, ferias proporcionais, 13o proporcional e multa do FGTS.
              </p>
            </div>
          )}

          {reason === 'acordo_mutuo' && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3">
              <Info className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <p className="text-xs text-blue-400">
                No acordo mutuo (CLT Art. 484-A), o aviso previo e pago pela metade e a multa do FGTS e de 20% (ao inves de 40%).
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
