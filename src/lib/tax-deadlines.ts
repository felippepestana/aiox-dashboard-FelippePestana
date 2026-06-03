// =============================================================================
// Brazilian Tax Deadlines Generator for Law Firms
// Generates TaxObligation-compatible entries and Deadline entries
// Handles weekend/holiday adjustment per Brazilian rules
// =============================================================================

import { NATIONAL_HOLIDAYS } from './deadline-calculator';
import type { TaxObligation, Deadline, DeadlineType } from '@/types/legal';
import {
  calculateTaxes,
  calculateQuarterlyIRPJ,
  type TaxRegime,
} from './tax-calculator';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isHoliday(date: Date): boolean {
  return NATIONAL_HOLIDAYS.includes(toDateString(date));
}

function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}

function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

/**
 * Avanca a data para o proximo dia util se cair em fim de semana ou feriado.
 * Usado para calcular prazos de pagamento de impostos.
 */
function nextBusinessDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  while (!isBusinessDay(result)) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

/**
 * Retrocede para o ultimo dia util do mes (para prazos como IRPJ trimestral).
 */
function lastBusinessDayOfMonth(year: number, month: number): Date {
  // month: 1-12
  const lastDay = new Date(year, month, 0); // ultimo dia do mes
  lastDay.setHours(0, 0, 0, 0);
  while (!isBusinessDay(lastDay)) {
    lastDay.setDate(lastDay.getDate() - 1);
  }
  return lastDay;
}

/**
 * Cria uma data ajustada para o proximo dia util se necessario.
 */
function adjustedDueDate(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  return toDateString(nextBusinessDay(date));
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function monthName(month: number): string {
  const names = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  return names[month - 1] ?? String(month);
}

// ─── Tax Obligation Generators ────────────────────────────────────────────────

/**
 * Gera as obrigacoes de DARF de IRPJ e CSLL para um ano no Lucro Presumido ou Lucro Real.
 * Vencimento: ultimo dia util do mes seguinte ao encerramento de cada trimestre.
 * 1T: 30/abr | 2T: 31/jul | 3T: 31/out | 4T: 31/jan (ano seguinte)
 */
export function generateQuarterlyDARF(
  year: number,
  regime: 'presumido' | 'real',
  quarterlyRevenue: number = 0,
  irpjPerQuarter: number = 0,
  csllPerQuarter: number = 0
): Omit<TaxObligation, 'id'>[] {
  const obligations: Omit<TaxObligation, 'id'>[] = [];

  const quarters: { quarter: number; endMonth: number; endYear: number }[] = [
    { quarter: 1, endMonth: 4,  endYear: year },
    { quarter: 2, endMonth: 7,  endYear: year },
    { quarter: 3, endMonth: 10, endYear: year },
    { quarter: 4, endMonth: 1,  endYear: year + 1 },
  ];

  for (const q of quarters) {
    const dueDate = toDateString(lastBusinessDayOfMonth(q.endYear, q.endMonth));
    const periodLabel = `${q.quarter}T/${year}`;

    obligations.push({
      type: 'irpj',
      period: periodLabel,
      amount: irpjPerQuarter,
      dueDate: new Date(dueDate).toISOString(),
      status: 'pending',
    });

    obligations.push({
      type: 'csll',
      period: periodLabel,
      amount: csllPerQuarter,
      dueDate: new Date(dueDate).toISOString(),
      status: 'pending',
    });
  }

  return obligations;
}

/**
 * Gera obrigacoes mensais de PIS e COFINS para um ano.
 * Vencimento: dia 25 do mes seguinte (ou proximo dia util).
 */
export function generateMonthlyPisCofins(
  year: number,
  monthlyPis: number = 0,
  monthlyCofins: number = 0
): Omit<TaxObligation, 'id'>[] {
  const obligations: Omit<TaxObligation, 'id'>[] = [];

  for (let month = 1; month <= 12; month++) {
    const dueMonth = month === 12 ? 1 : month + 1;
    const dueYear = month === 12 ? year + 1 : year;
    const dueDate = adjustedDueDate(dueYear, dueMonth, 25);
    const period = `${monthName(month)}/${year}`;

    obligations.push({
      type: 'pis_cofins',
      period,
      amount: monthlyPis + monthlyCofins,
      dueDate: new Date(dueDate).toISOString(),
      status: 'pending',
    });
  }

  return obligations;
}

/**
 * Gera obrigacoes mensais de ISS para um ano.
 * Vencimento: dia 10 do mes seguinte (ou proximo dia util) - padrao nacional.
 * Cada municipio pode ter data diferente.
 */
export function generateMonthlyISS(
  year: number,
  monthlyISS: number = 0,
  dueDayOfMonth: number = 10
): Omit<TaxObligation, 'id'>[] {
  const obligations: Omit<TaxObligation, 'id'>[] = [];

  for (let month = 1; month <= 12; month++) {
    const dueMonth = month === 12 ? 1 : month + 1;
    const dueYear = month === 12 ? year + 1 : year;
    const dueDate = adjustedDueDate(dueYear, dueMonth, dueDayOfMonth);
    const period = `${monthName(month)}/${year}`;

    obligations.push({
      type: 'iss',
      period,
      amount: monthlyISS,
      dueDate: new Date(dueDate).toISOString(),
      status: 'pending',
    });
  }

  return obligations;
}

/**
 * Gera o DAS mensal do Simples Nacional.
 * Vencimento: dia 20 do mes seguinte (ou proximo dia util).
 */
export function generateSimplesDAS(
  year: number,
  monthlyDAS: number = 0
): Omit<TaxObligation, 'id'>[] {
  const obligations: Omit<TaxObligation, 'id'>[] = [];

  for (let month = 1; month <= 12; month++) {
    const dueMonth = month === 12 ? 1 : month + 1;
    const dueYear = month === 12 ? year + 1 : year;
    const dueDate = adjustedDueDate(dueYear, dueMonth, 20);
    const period = `${monthName(month)}/${year}`;

    // DAS engloba todos os tributos - distribuimos nos 4 tipos para compatibilidade
    const dasQuarter = monthlyDAS / 4;
    obligations.push({
      type: 'irpj',
      period: `DAS ${period}`,
      amount: dasQuarter,
      dueDate: new Date(dueDate).toISOString(),
      status: 'pending',
    });
    obligations.push({
      type: 'csll',
      period: `DAS ${period}`,
      amount: dasQuarter,
      dueDate: new Date(dueDate).toISOString(),
      status: 'pending',
    });
    obligations.push({
      type: 'pis_cofins',
      period: `DAS ${period}`,
      amount: dasQuarter,
      dueDate: new Date(dueDate).toISOString(),
      status: 'pending',
    });
    obligations.push({
      type: 'iss',
      period: `DAS ${period}`,
      amount: dasQuarter,
      dueDate: new Date(dueDate).toISOString(),
      status: 'pending',
    });
  }

  return obligations;
}

// ─── Deadline Generators (compatible with Deadline type from legal store) ─────

export interface TaxDeadlineParams {
  year: number;
  regime: TaxRegime;
  /** Receita mensal estimada (para calcular valores) */
  monthlyRevenue?: number;
  monthlyPis?: number;
  monthlyCofins?: number;
  monthlyISS?: number;
  monthlyDAS?: number;
  irpjPerQuarter?: number;
  csllPerQuarter?: number;
}

/**
 * Gera um array de Deadline (compativel com o legal store) para obrigacoes fiscais.
 * Usa processId vazio pois sao obrigacoes da firma, nao de processos especificos.
 *
 * @param params - Parametros de configuracao
 * @returns Array de Deadline para uso com addDeadline()
 */
export function generateTaxDeadlines(
  params: TaxDeadlineParams
): Omit<Deadline, 'id' | 'createdAt'>[] {
  const {
    year,
    regime,
    monthlyPis = 0,
    monthlyCofins = 0,
    monthlyISS = 0,
    monthlyDAS = 0,
    irpjPerQuarter = 0,
    csllPerQuarter = 0,
  } = params;

  const deadlines: Omit<Deadline, 'id' | 'createdAt'>[] = [];

  if (regime === 'simples') {
    // DAS mensal
    for (let month = 1; month <= 12; month++) {
      const dueMonth = month === 12 ? 1 : month + 1;
      const dueYear = month === 12 ? year + 1 : year;
      const dueDate = adjustedDueDate(dueYear, dueMonth, 20);
      deadlines.push({
        processId: '',
        title: `DAS - Simples Nacional ${monthName(month)}/${year}`,
        type: 'internal' as DeadlineType,
        dueDate: new Date(dueDate).toISOString(),
        reminderDays: [7, 3, 1],
        status: 'pending',
        assignedTo: '',
        notes: `Vencimento DAS Simples Nacional referente a ${monthName(month)}/${year}. Pagar via Portal do Simples Nacional.`,
      });
    }
  } else {
    // PIS/COFINS mensais (dia 25)
    for (let month = 1; month <= 12; month++) {
      const dueMonth = month === 12 ? 1 : month + 1;
      const dueYear = month === 12 ? year + 1 : year;
      const dueDate = adjustedDueDate(dueYear, dueMonth, 25);
      const label = regime === 'presumido' ? 'PIS 0,65% / COFINS 3%' : 'PIS 1,65% / COFINS 7,6%';
      deadlines.push({
        processId: '',
        title: `PIS/COFINS - ${monthName(month)}/${year}`,
        type: 'internal' as DeadlineType,
        dueDate: new Date(dueDate).toISOString(),
        reminderDays: [7, 3, 1],
        status: 'pending',
        assignedTo: '',
        notes: `DARF PIS e COFINS (${label}) referente a ${monthName(month)}/${year}.`,
      });
    }

    // ISS mensal (dia 10)
    for (let month = 1; month <= 12; month++) {
      const dueMonth = month === 12 ? 1 : month + 1;
      const dueYear = month === 12 ? year + 1 : year;
      const dueDate = adjustedDueDate(dueYear, dueMonth, 10);
      deadlines.push({
        processId: '',
        title: `ISS - ${monthName(month)}/${year}`,
        type: 'internal' as DeadlineType,
        dueDate: new Date(dueDate).toISOString(),
        reminderDays: [7, 3, 1],
        status: 'pending',
        assignedTo: '',
        notes: `ISS municipal referente a ${monthName(month)}/${year}. Verificar guia na prefeitura.`,
      });
    }

    // IRPJ/CSLL trimestrais
    const quarters = [
      { quarter: 1, label: '1T', endMonth: 4,  endYear: year,     refPeriod: `Jan-Mar/${year}` },
      { quarter: 2, label: '2T', endMonth: 7,  endYear: year,     refPeriod: `Abr-Jun/${year}` },
      { quarter: 3, label: '3T', endMonth: 10, endYear: year,     refPeriod: `Jul-Set/${year}` },
      { quarter: 4, label: '4T', endMonth: 1,  endYear: year + 1, refPeriod: `Out-Dez/${year}` },
    ];

    for (const q of quarters) {
      const dueDate = toDateString(lastBusinessDayOfMonth(q.endYear, q.endMonth));
      const baseLabel = regime === 'presumido' ? 'Base presumida 32%' : 'Lucro Real';
      deadlines.push({
        processId: '',
        title: `IRPJ/CSLL - ${q.label}/${year}`,
        type: 'fatal' as DeadlineType,
        dueDate: new Date(dueDate).toISOString(),
        reminderDays: [15, 7, 3, 1],
        status: 'pending',
        assignedTo: '',
        notes: `DARF IRPJ + CSLL trimestral (${baseLabel}) referente a ${q.refPeriod}. Apuracao ate o ultimo dia util do mes.`,
      });
    }
  }

  // Obrigacoes acessorias anuais
  const annualObligations: { title: string; dueDay: number; dueMonth: number; notes: string; type: DeadlineType }[] = [
    {
      title: `DIRF ${year} (ano-base ${year - 1})`,
      dueDay: 28,
      dueMonth: 2,
      notes: `Declaracao do Imposto de Renda Retido na Fonte - ano-base ${year - 1}. Transmitir via Receita Federal.`,
      type: 'fatal' as DeadlineType,
    },
  ];

  if (regime !== 'simples') {
    annualObligations.push(
      {
        title: `ECD ${year} (ano-base ${year - 1})`,
        dueDay: 31,
        dueMonth: 5,
        notes: `Escrituracao Contabil Digital - ano-base ${year - 1}. Transmitir pelo SPED Contabil.`,
        type: 'fatal' as DeadlineType,
      },
      {
        title: `ECF ${year} (ano-base ${year - 1})`,
        dueDay: 31,
        dueMonth: 7,
        notes: `Escrituracao Contabil Fiscal - ano-base ${year - 1}. Transmitir pelo SPED Fiscal.`,
        type: 'fatal' as DeadlineType,
      }
    );
  }

  for (const obl of annualObligations) {
    const dueDate = adjustedDueDate(year, obl.dueMonth, obl.dueDay);
    deadlines.push({
      processId: '',
      title: obl.title,
      type: obl.type,
      dueDate: new Date(dueDate).toISOString(),
      reminderDays: [30, 15, 7, 1],
      status: 'pending',
      assignedTo: '',
      notes: obl.notes,
    });
  }

  return deadlines.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

/**
 * Gera TaxObligations (para o store financeiro) para um ano completo.
 *
 * @param year - Ano fiscal
 * @param regime - Regime tributario
 * @param monthlyRevenue - Receita mensal estimada
 * @param monthlyExpenses - Despesas mensais estimadas (Lucro Real)
 */
export function generateYearlyTaxObligations(
  year: number,
  regime: TaxRegime,
  monthlyRevenue: number = 0,
  monthlyExpenses: number = 0
): Omit<TaxObligation, 'id'>[] {
  if (regime === 'simples') {
    const taxes = calculateTaxes('simples', monthlyRevenue, 0);
    return generateSimplesDAS(year, taxes.total);
  }

  const taxes = calculateTaxes(regime, monthlyRevenue, monthlyExpenses);
  const quarterly = calculateQuarterlyIRPJ(regime as 'presumido' | 'real', monthlyRevenue * 3, monthlyExpenses * 3);

  return [
    ...generateQuarterlyDARF(year, regime as 'presumido' | 'real', monthlyRevenue * 3, quarterly.irpjTotal, quarterly.csll),
    ...generateMonthlyPisCofins(year, taxes.pis, taxes.cofins),
    ...generateMonthlyISS(year, taxes.iss),
  ];
}
