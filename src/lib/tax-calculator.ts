// =============================================================================
// Brazilian Tax Calculator for Law Firms - Advocacia Privada
// Supports Simples Nacional (Anexo IV), Lucro Presumido, Lucro Real
// =============================================================================

export type TaxRegime = 'simples' | 'presumido' | 'real';

// ─── Simples Nacional - Anexo IV (Advocacia) ─────────────────────────────────

export interface SimplesNacionalFaixa {
  label: string;
  minRevenue: number;
  maxRevenue: number;
  aliquota: number;       // percentage (e.g., 4.5 means 4.5%)
  deducao: number;        // deduction amount in BRL
}

/**
 * Tabela do Simples Nacional - Anexo IV (Serviços de Advocacia)
 * Fonte: LC 123/2006 com alteracoes da LC 155/2016
 * Vigencia: a partir de 01/01/2018
 */
export const SIMPLES_NACIONAL_FAIXAS: SimplesNacionalFaixa[] = [
  { label: 'Faixa 1', minRevenue: 0,          maxRevenue: 180000,   aliquota: 4.5,  deducao: 0 },
  { label: 'Faixa 2', minRevenue: 180000.01,  maxRevenue: 360000,   aliquota: 9.0,  deducao: 8100 },
  { label: 'Faixa 3', minRevenue: 360000.01,  maxRevenue: 720000,   aliquota: 10.2, deducao: 12420 },
  { label: 'Faixa 4', minRevenue: 720000.01,  maxRevenue: 1800000,  aliquota: 14.0, deducao: 39780 },
  { label: 'Faixa 5', minRevenue: 1800000.01, maxRevenue: 3600000,  aliquota: 22.0, deducao: 183780 },
  { label: 'Faixa 6', minRevenue: 3600000.01, maxRevenue: 4800000,  aliquota: 33.0, deducao: 828000 },
];

// ─── Tax Breakdown Types ──────────────────────────────────────────────────────

export interface TaxBreakdown {
  irpj: number;
  csll: number;
  pis: number;
  cofins: number;
  iss: number;
  total: number;
  details: Record<string, string>;
}

export interface RegimeComparison {
  simples: { total: number; breakdown: TaxBreakdown; regime: TaxRegime };
  presumido: { total: number; breakdown: TaxBreakdown; regime: TaxRegime };
  real: { total: number; breakdown: TaxBreakdown; regime: TaxRegime };
  recommended: TaxRegime;
}

export interface MonthlyObligation {
  month: number;         // 1-12
  year: number;
  regime: TaxRegime;
  revenue: number;
  taxes: TaxBreakdown;
}

export interface QuarterlyIRPJ {
  quarter: number;       // 1-4
  year: number;
  quarterlyRevenue: number;
  baseCalculo: number;
  irpjBase: number;
  irpjAdicional: number;
  irpjTotal: number;
  csll: number;
  details: Record<string, string>;
}

// ─── ISS Rate by City ─────────────────────────────────────────────────────────

const ISS_RATES: Record<string, number> = {
  'São Paulo': 5,
  'Rio de Janeiro': 5,
  'Curitiba': 5,
  'Porto Alegre': 5,
  'Belo Horizonte': 5,
  'Brasília': 5,
  'Salvador': 5,
  'Fortaleza': 5,
  'Manaus': 2,
  'default': 5,
};

function getIssRate(city?: string): number {
  if (!city) return ISS_RATES['default'];
  return ISS_RATES[city] ?? ISS_RATES['default'];
}

// ─── Simples Nacional Calculation ────────────────────────────────────────────

/**
 * Calcula aliquota efetiva do Simples Nacional (Anexo IV - Advocacia)
 * Aliquota efetiva = (RBT12 * Aliquota - PD) / RBT12
 * onde RBT12 = receita bruta acumulada dos ultimos 12 meses
 */
export function calculateSimplesNacional(
  annualRevenue: number,
  city?: string
): TaxBreakdown {
  if (annualRevenue > 4800000) {
    // Excedeu o limite do Simples Nacional
    return { irpj: 0, csll: 0, pis: 0, cofins: 0, iss: 0, total: 0, details: { error: 'Receita excede limite do Simples Nacional (R$ 4.800.000)' } };
  }

  const faixa = SIMPLES_NACIONAL_FAIXAS.find(
    (f) => annualRevenue >= f.minRevenue && annualRevenue <= f.maxRevenue
  ) ?? SIMPLES_NACIONAL_FAIXAS[SIMPLES_NACIONAL_FAIXAS.length - 1];

  const aliquotaEfetiva = (annualRevenue * (faixa.aliquota / 100) - faixa.deducao) / annualRevenue;
  const totalDAS = annualRevenue * aliquotaEfetiva;

  // Rateio aproximado do DAS para Anexo IV (Advocacia)
  // Distribuicao baseada na tabela de proporcao do Anexo IV do Simples
  const issRate = getIssRate(city);
  // No Simples Nacional, o ISS ja esta incluso no DAS (aliquota ~5% do total)
  const totalDASMensal = totalDAS / 12;
  const revenueMensal = annualRevenue / 12;

  // Proporcao aproximada por tributo no Anexo IV
  // CPP: 43.4%, CSLL: 3.5%, COFINS: 7.82%, PIS: 1.7%, ISS: 32.5%, IR: 11.08%
  const irpj = totalDASMensal * 0.1108;
  const csll = totalDASMensal * 0.035;
  const pis = totalDASMensal * 0.017;
  const cofins = totalDASMensal * 0.0782;
  const iss = totalDASMensal * 0.325;

  return {
    irpj: round2(irpj),
    csll: round2(csll),
    pis: round2(pis),
    cofins: round2(cofins),
    iss: round2(iss),
    total: round2(totalDASMensal),
    details: {
      regime: 'Simples Nacional - Anexo IV',
      faixa: faixa.label,
      aliquotaNominal: `${faixa.aliquota}%`,
      aliquotaEfetiva: `${(aliquotaEfetiva * 100).toFixed(2)}%`,
      baseCalculo: formatBRL(revenueMensal),
      dasMensal: formatBRL(totalDASMensal),
      dasAnual: formatBRL(totalDAS),
    },
  };
}

// ─── Lucro Presumido Calculation ──────────────────────────────────────────────

/**
 * Calcula impostos no regime Lucro Presumido para sociedades de advocacia.
 *
 * Base de calculo: 32% da receita bruta (servicos - RIR/1999, art. 223 III)
 * IRPJ: 15% sobre base presumida + 10% adicional sobre excedente de R$60k/trimestre
 * CSLL: 9% sobre 32% da receita bruta
 * PIS: 0,65% sobre receita bruta (cumulativo)
 * COFINS: 3% sobre receita bruta (cumulativo)
 * ISS: 2% a 5% sobre receita de servicos (municipal)
 */
export function calculateLucroPresumido(
  monthlyRevenue: number,
  city?: string
): TaxBreakdown {
  const quarterlyRevenue = monthlyRevenue * 3;

  // Base de calculo IRPJ e CSLL (32% - servicos)
  const baseCalculo = quarterlyRevenue * 0.32;

  // IRPJ trimestral
  const irpjBase = baseCalculo * 0.15;
  const excedente = Math.max(0, baseCalculo - 60000); // R$60k/trimestre
  const irpjAdicional = excedente * 0.10;
  const irpjTrimestral = irpjBase + irpjAdicional;
  const irpjMensal = irpjTrimestral / 3;

  // CSLL trimestral (base: 32% da RB)
  const csllTrimestral = baseCalculo * 0.09;
  const csllMensal = csllTrimestral / 3;

  // PIS e COFINS (mensal, cumulativo)
  const pis = monthlyRevenue * 0.0065;
  const cofins = monthlyRevenue * 0.03;

  // ISS (mensal)
  const issRate = getIssRate(city) / 100;
  const iss = monthlyRevenue * issRate;

  const total = irpjMensal + csllMensal + pis + cofins + iss;

  return {
    irpj: round2(irpjMensal),
    csll: round2(csllMensal),
    pis: round2(pis),
    cofins: round2(cofins),
    iss: round2(iss),
    total: round2(total),
    details: {
      regime: 'Lucro Presumido',
      receitaBruta: formatBRL(monthlyRevenue),
      basePresumida: `32% = ${formatBRL(baseCalculo / 3)}`,
      irpjBase: `15% s/ base trimestral = ${formatBRL(irpjBase)}`,
      irpjAdicional: excedente > 0 ? `10% s/ excedente de ${formatBRL(excedente)} = ${formatBRL(irpjAdicional)}` : 'N/A',
      pisCumulativo: `0,65% s/ RB = ${formatBRL(pis)}`,
      cofinsCumulativo: `3% s/ RB = ${formatBRL(cofins)}`,
      issAliquota: `${(issRate * 100).toFixed(0)}% s/ servicos`,
    },
  };
}

// ─── Lucro Real Calculation ───────────────────────────────────────────────────

/**
 * Calcula impostos no regime Lucro Real para sociedades de advocacia.
 *
 * IRPJ: 15% sobre lucro real + 10% adicional sobre excedente de R$20k/mes
 * CSLL: 9% sobre lucro real
 * PIS: 1,65% (nao-cumulativo)
 * COFINS: 7,6% (nao-cumulativo)
 * ISS: municipal (2% a 5%)
 *
 * @param monthlyRevenue - Receita bruta mensal
 * @param monthlyExpenses - Despesas dedutiveis mensais (custo real)
 * @param city - Cidade para calculo do ISS
 */
export function calculateLucroReal(
  monthlyRevenue: number,
  monthlyExpenses: number = 0,
  city?: string
): TaxBreakdown {
  const lucroReal = Math.max(0, monthlyRevenue - monthlyExpenses);

  // IRPJ mensal (estimativa - real e trimestral/anual, mas estimativa mensal)
  const irpjBase = lucroReal * 0.15;
  const excedente = Math.max(0, lucroReal - 20000); // R$20k/mes
  const irpjAdicional = excedente * 0.10;
  const irpj = irpjBase + irpjAdicional;

  // CSLL
  const csll = lucroReal * 0.09;

  // PIS e COFINS nao-cumulativos
  const pis = monthlyRevenue * 0.0165;
  const cofins = monthlyRevenue * 0.076;

  // ISS
  const issRate = getIssRate(city) / 100;
  const iss = monthlyRevenue * issRate;

  const total = irpj + csll + pis + cofins + iss;

  return {
    irpj: round2(irpj),
    csll: round2(csll),
    pis: round2(pis),
    cofins: round2(cofins),
    iss: round2(iss),
    total: round2(total),
    details: {
      regime: 'Lucro Real',
      receitaBruta: formatBRL(monthlyRevenue),
      despesasDedutiveis: formatBRL(monthlyExpenses),
      lucroReal: formatBRL(lucroReal),
      irpjBase: `15% s/ lucro = ${formatBRL(irpjBase)}`,
      irpjAdicional: excedente > 0 ? `10% s/ excedente de ${formatBRL(excedente)} = ${formatBRL(irpjAdicional)}` : 'N/A',
      pisNaoCumulativo: `1,65% s/ RB = ${formatBRL(pis)}`,
      cofinsNaoCumulativo: `7,6% s/ RB = ${formatBRL(cofins)}`,
      issAliquota: `${(issRate * 100).toFixed(0)}% s/ servicos`,
    },
  };
}

// ─── Main Public Functions ────────────────────────────────────────────────────

/**
 * Calcula impostos de acordo com o regime tributario selecionado.
 *
 * @param regime - 'simples' | 'presumido' | 'real'
 * @param revenue - Receita bruta (mensal para presumido/real, anual para simples)
 * @param expenses - Despesas dedutiveis (apenas para Lucro Real)
 * @param city - Municipio para calculo do ISS
 */
export function calculateTaxes(
  regime: TaxRegime,
  revenue: number,
  expenses?: number,
  city?: string
): TaxBreakdown {
  switch (regime) {
    case 'simples':
      // Para simples, revenue e anual (RBT12)
      return calculateSimplesNacional(revenue * 12, city);
    case 'presumido':
      return calculateLucroPresumido(revenue, city);
    case 'real':
      return calculateLucroReal(revenue, expenses ?? 0, city);
    default:
      return calculateLucroPresumido(revenue, city);
  }
}

/**
 * Calcula obrigacao tributaria mensal para um dado regime.
 *
 * @param regime - Regime tributario
 * @param monthlyRevenue - Receita mensal
 * @param year - Ano de referencia
 * @param month - Mes de referencia (1-12)
 * @param expenses - Despesas mensais (para Lucro Real)
 * @param city - Municipio
 */
export function calculateMonthlyObligation(
  regime: TaxRegime,
  monthlyRevenue: number,
  year: number = new Date().getFullYear(),
  month: number = new Date().getMonth() + 1,
  expenses?: number,
  city?: string
): MonthlyObligation {
  const taxes = calculateTaxes(regime, monthlyRevenue, expenses, city);

  return {
    month,
    year,
    regime,
    revenue: monthlyRevenue,
    taxes,
  };
}

/**
 * Calcula IRPJ e CSLL trimestrais para Lucro Presumido ou Lucro Real.
 *
 * @param regime - 'presumido' | 'real'
 * @param quarterlyRevenue - Receita bruta trimestral
 * @param quarterlyExpenses - Despesas trimestrais (apenas Lucro Real)
 * @param quarter - Trimestre (1-4)
 * @param year - Ano
 */
export function calculateQuarterlyIRPJ(
  regime: 'presumido' | 'real',
  quarterlyRevenue: number,
  quarterlyExpenses: number = 0,
  quarter: number = Math.ceil((new Date().getMonth() + 1) / 3),
  year: number = new Date().getFullYear()
): QuarterlyIRPJ {
  let baseCalculo: number;
  let irpjBase: number;
  let irpjAdicional: number;
  let csll: number;

  if (regime === 'presumido') {
    baseCalculo = quarterlyRevenue * 0.32;
    irpjBase = baseCalculo * 0.15;
    const excedente = Math.max(0, baseCalculo - 60000);
    irpjAdicional = excedente * 0.10;
    csll = baseCalculo * 0.09;
  } else {
    // Lucro Real
    baseCalculo = Math.max(0, quarterlyRevenue - quarterlyExpenses);
    irpjBase = baseCalculo * 0.15;
    const excedente = Math.max(0, baseCalculo - 60000); // R$20k/mes * 3
    irpjAdicional = excedente * 0.10;
    csll = baseCalculo * 0.09;
  }

  const irpjTotal = irpjBase + irpjAdicional;

  return {
    quarter,
    year,
    quarterlyRevenue,
    baseCalculo: round2(baseCalculo),
    irpjBase: round2(irpjBase),
    irpjAdicional: round2(irpjAdicional),
    irpjTotal: round2(irpjTotal),
    csll: round2(csll),
    details: {
      regime: regime === 'presumido' ? 'Lucro Presumido' : 'Lucro Real',
      periodo: `${quarter}T${year}`,
      receitaTrimestral: formatBRL(quarterlyRevenue),
      baseCalculo: regime === 'presumido' ? `32% da RB = ${formatBRL(baseCalculo)}` : `Lucro real = ${formatBRL(baseCalculo)}`,
      irpjBase: `15% = ${formatBRL(irpjBase)}`,
      adicional: irpjAdicional > 0 ? `10% s/ excedente = ${formatBRL(irpjAdicional)}` : 'N/A',
      irpjTotal: formatBRL(irpjTotal),
      csll: `9% = ${formatBRL(csll)}`,
    },
  };
}

/**
 * Compara os tres regimes tributarios para uma mesma receita.
 * Util para planejamento tributario.
 *
 * @param monthlyRevenue - Receita mensal
 * @param monthlyExpenses - Despesas mensais (relevante para Lucro Real)
 * @param city - Municipio
 */
export function compareTaxRegimes(
  monthlyRevenue: number,
  monthlyExpenses?: number,
  city?: string
): RegimeComparison {
  const simples = calculateSimplesNacional(monthlyRevenue * 12, city);
  const presumido = calculateLucroPresumido(monthlyRevenue, city);
  const real = calculateLucroReal(monthlyRevenue, monthlyExpenses ?? 0, city);

  // Encontra o regime mais vantajoso (menor total de impostos)
  const totals: { regime: TaxRegime; total: number }[] = [
    { regime: 'simples', total: simples.total },
    { regime: 'presumido', total: presumido.total },
    { regime: 'real', total: real.total },
  ];
  totals.sort((a, b) => a.total - b.total);
  const recommended = totals[0].regime;

  return {
    simples: { total: simples.total, breakdown: simples, regime: 'simples' },
    presumido: { total: presumido.total, breakdown: presumido, regime: 'presumido' },
    real: { total: real.total, breakdown: real, regime: 'real' },
    recommended,
  };
}

// ─── Tax Calendar ─────────────────────────────────────────────────────────────

export interface TaxCalendarEntry {
  month: number;      // 1-12
  dueDate: string;    // YYYY-MM-DD
  tax: string;
  description: string;
  type: 'monthly' | 'quarterly' | 'annual';
  quarter?: number;
}

/**
 * Gera calendario fiscal completo para um ano e regime tributario.
 *
 * @param year - Ano de referencia
 * @param regime - Regime tributario
 */
export function getTaxCalendar(year: number, regime: TaxRegime): TaxCalendarEntry[] {
  const entries: TaxCalendarEntry[] = [];

  if (regime === 'simples') {
    // DAS mensal: vence dia 20 do mes seguinte
    for (let month = 1; month <= 12; month++) {
      const dueMonth = month === 12 ? 1 : month + 1;
      const dueYear = month === 12 ? year + 1 : year;
      entries.push({
        month,
        dueDate: `${dueYear}-${String(dueMonth).padStart(2, '0')}-20`,
        tax: 'DAS',
        description: `DAS - Simples Nacional ${monthName(month)}/${year}`,
        type: 'monthly',
      });
    }
  } else {
    // PIS/COFINS mensais: vence dia 25 do mes seguinte
    for (let month = 1; month <= 12; month++) {
      const dueMonth = month === 12 ? 1 : month + 1;
      const dueYear = month === 12 ? year + 1 : year;
      const dueDatePad = `${dueYear}-${String(dueMonth).padStart(2, '0')}-25`;
      entries.push({
        month,
        dueDate: dueDatePad,
        tax: 'PIS',
        description: `PIS - ${monthName(month)}/${year}`,
        type: 'monthly',
      });
      entries.push({
        month,
        dueDate: dueDatePad,
        tax: 'COFINS',
        description: `COFINS - ${monthName(month)}/${year}`,
        type: 'monthly',
      });
    }

    // ISS mensal: vence dia 10 do mes seguinte (default)
    for (let month = 1; month <= 12; month++) {
      const dueMonth = month === 12 ? 1 : month + 1;
      const dueYear = month === 12 ? year + 1 : year;
      entries.push({
        month,
        dueDate: `${dueYear}-${String(dueMonth).padStart(2, '0')}-10`,
        tax: 'ISS',
        description: `ISS - ${monthName(month)}/${year}`,
        type: 'monthly',
      });
    }

    // IRPJ e CSLL trimestrais
    // DARF vence no ultimo dia util do mes seguinte ao encerramento do trimestre
    // 1T (jan-mar): vence 30/abr  |  2T (abr-jun): vence 31/jul
    // 3T (jul-set): vence 31/out  |  4T (out-dez): vence 31/jan ano seguinte
    const quarterDates = [
      { quarter: 1, month: 4,  day: 30, year },
      { quarter: 2, month: 7,  day: 31, year },
      { quarter: 3, month: 10, day: 31, year },
      { quarter: 4, month: 1,  day: 31, year: year + 1 },
    ];

    for (const qd of quarterDates) {
      const dueDateStr = `${qd.year}-${String(qd.month).padStart(2, '0')}-${String(qd.day).padStart(2, '0')}`;
      entries.push({
        month: qd.month <= 12 ? qd.month : 1,
        dueDate: dueDateStr,
        tax: 'IRPJ',
        description: `IRPJ - ${qd.quarter}T/${year} (DARF)`,
        type: 'quarterly',
        quarter: qd.quarter,
      });
      entries.push({
        month: qd.month <= 12 ? qd.month : 1,
        dueDate: dueDateStr,
        tax: 'CSLL',
        description: `CSLL - ${qd.quarter}T/${year} (DARF)`,
        type: 'quarterly',
        quarter: qd.quarter,
      });
    }
  }

  // Obrigacoes acessorias anuais (todos os regimes)
  entries.push({
    month: 2,
    dueDate: `${year}-02-28`,
    tax: 'DIRF',
    description: `DIRF ${year - 1} - Declaracao do Imposto de Renda Retido na Fonte`,
    type: 'annual',
  });

  if (regime !== 'simples') {
    entries.push({
      month: 7,
      dueDate: `${year}-07-31`,
      tax: 'ECF',
      description: `ECF ${year - 1} - Escrituracao Contabil Fiscal`,
      type: 'annual',
    });
    entries.push({
      month: 5,
      dueDate: `${year}-05-31`,
      tax: 'ECD',
      description: `ECD ${year - 1} - Escrituracao Contabil Digital`,
      type: 'annual',
    });
    entries.push({
      month: 7,
      dueDate: `${year}-07-15`,
      tax: 'DCTF',
      description: `DCTF Mensal - referencia junho/${year}`,
      type: 'monthly',
    });
  }

  return entries.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

// ─── Utility Helpers ─────────────────────────────────────────────────────────

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function monthName(month: number): string {
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return names[month - 1] ?? String(month);
}

export const REGIME_LABELS: Record<TaxRegime, string> = {
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
};
