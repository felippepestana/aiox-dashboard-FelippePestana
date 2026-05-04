// =============================================================================
// Legal Deadline Calculator - Brazilian Procedural Law
// Supports CPC (business days), CLT/CPP (calendar days), court recess
// =============================================================================

/**
 * National holidays for 2025-2027 (Brazil)
 * Sources: Federal law + commonly recognized national holidays
 */
export const NATIONAL_HOLIDAYS: string[] = [
  // 2025
  '2025-01-01', // Confraternizacao Universal
  '2025-03-03', // Carnaval (segunda)
  '2025-03-04', // Carnaval (terca)
  '2025-04-18', // Sexta-feira Santa
  '2025-04-21', // Tiradentes
  '2025-05-01', // Dia do Trabalho
  '2025-06-19', // Corpus Christi
  '2025-09-07', // Independencia
  '2025-10-12', // Nossa Senhora Aparecida
  '2025-11-02', // Finados
  '2025-11-15', // Proclamacao da Republica
  '2025-11-20', // Consciencia Negra
  '2025-12-25', // Natal

  // 2026
  '2026-01-01', // Confraternizacao Universal
  '2026-02-16', // Carnaval (segunda)
  '2026-02-17', // Carnaval (terca)
  '2026-04-03', // Sexta-feira Santa
  '2026-04-21', // Tiradentes
  '2026-05-01', // Dia do Trabalho
  '2026-06-04', // Corpus Christi
  '2026-09-07', // Independencia
  '2026-10-12', // Nossa Senhora Aparecida
  '2026-11-02', // Finados
  '2026-11-15', // Proclamacao da Republica
  '2026-11-20', // Consciencia Negra
  '2026-12-25', // Natal

  // 2027
  '2027-01-01', // Confraternizacao Universal
  '2027-02-08', // Carnaval (segunda)
  '2027-02-09', // Carnaval (terca)
  '2027-03-26', // Sexta-feira Santa
  '2027-04-21', // Tiradentes
  '2027-05-01', // Dia do Trabalho
  '2027-05-27', // Corpus Christi
  '2027-09-07', // Independencia
  '2027-10-12', // Nossa Senhora Aparecida
  '2027-11-02', // Finados
  '2027-11-15', // Proclamacao da Republica
  '2027-11-20', // Consciencia Negra
  '2027-12-25', // Natal
];

/**
 * Format a Date object to YYYY-MM-DD string
 */
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Check if a given date is a national holiday
 */
export function isHoliday(date: Date): boolean {
  return NATIONAL_HOLIDAYS.includes(toDateString(date));
}

/**
 * Check if a given date falls within the court recess period
 * Court recess: December 20 through January 20 (inclusive)
 * During recess, deadlines are suspended (CPC Art. 220)
 */
export function isCourtRecess(date: Date): boolean {
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  // December 20-31
  if (month === 11 && day >= 20) return true;
  // January 1-20
  if (month === 0 && day <= 20) return true;

  return false;
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
function isWeekend(date: Date): boolean {
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

/**
 * Check if a date is a business day (not weekend, not holiday)
 */
function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

/**
 * Get the next business day from a given date.
 * If the date itself is a business day, it is returned as-is.
 * If considerRecess is true, recess days are also skipped.
 */
export function getNextBusinessDay(date: Date, considerRecess = false): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);

  while (
    !isBusinessDay(result) ||
    (considerRecess && isCourtRecess(result))
  ) {
    result.setDate(result.getDate() + 1);
  }

  return result;
}

/**
 * Calculate a legal deadline.
 *
 * @param startDate  - The date from which counting begins (intimation/publication date).
 *                     Per CPC Art. 231, the deadline starts on the FIRST business day
 *                     after the intimation date.
 * @param days       - Number of days for the deadline.
 * @param type       - 'uteis' for business days (CPC), 'corridos' for calendar days (CLT/CPP).
 * @param recess     - Whether to consider court recess (default: true for 'uteis').
 *
 * @returns The deadline date (Date object).
 */
export function calculateDeadline(
  startDate: Date,
  days: number,
  type: 'uteis' | 'corridos',
  recess = true
): Date {
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  if (type === 'uteis') {
    // CPC: Skip to first business day after start (start of counting)
    current.setDate(current.getDate() + 1);
    current.setHours(0, 0, 0, 0);

    // Find first business day (that's day 1)
    while (
      !isBusinessDay(current) ||
      (recess && isCourtRecess(current))
    ) {
      current.setDate(current.getDate() + 1);
    }

    // Now count the remaining (days - 1) business days
    let counted = 1;
    while (counted < days) {
      current.setDate(current.getDate() + 1);
      if (
        isBusinessDay(current) &&
        !(recess && isCourtRecess(current))
      ) {
        counted++;
      }
    }

    return current;
  }

  // Calendar days (corridos) - CLT / CPP
  // Start counting from the day after the start date
  current.setDate(current.getDate() + days);

  // If the final day falls on a non-business day, push to next business day
  while (!isBusinessDay(current)) {
    current.setDate(current.getDate() + 1);
  }

  return current;
}

// =============================================================================
// Monetary Correction (mock)
// =============================================================================

export type CorrectionIndex = 'IPCA' | 'INPC' | 'IGP-M' | 'Selic' | 'TR';

/**
 * Monthly rate approximations for mock calculations.
 * These are illustrative and should NOT be used for real financial decisions.
 */
const MOCK_MONTHLY_RATES: Record<CorrectionIndex, number> = {
  'IPCA': 0.0045,   // ~0.45% monthly
  'INPC': 0.0042,   // ~0.42% monthly
  'IGP-M': 0.0038,  // ~0.38% monthly
  'Selic': 0.0095,  // ~0.95% monthly (high Selic scenario)
  'TR': 0.0012,     // ~0.12% monthly
};

export interface CorrectionResult {
  originalValue: number;
  correctedValue: number;
  correctionPercentage: number;
  months: number;
  index: CorrectionIndex;
  monthlyBreakdown: { month: string; value: number; rate: number }[];
}

/**
 * Calculate mock monetary correction.
 */
export function calculateMonetaryCorrection(
  originalValue: number,
  startDate: Date,
  endDate: Date,
  index: CorrectionIndex
): CorrectionResult {
  const monthlyRate = MOCK_MONTHLY_RATES[index];

  // Calculate months between dates
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const endYear = endDate.getFullYear();
  const endMonth = endDate.getMonth();
  const totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);

  const months = Math.max(totalMonths, 0);
  const breakdown: CorrectionResult['monthlyBreakdown'] = [];

  let currentValue = originalValue;
  const current = new Date(startDate);

  for (let i = 0; i < months; i++) {
    current.setMonth(current.getMonth() + 1);
    // Small variation for realism
    const variation = 1 + (Math.sin(i * 0.7) * 0.3);
    const rate = monthlyRate * variation;
    currentValue = currentValue * (1 + rate);

    breakdown.push({
      month: current.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
      value: Math.round(currentValue * 100) / 100,
      rate: Math.round(rate * 10000) / 100, // percentage with 2 decimals
    });
  }

  const correctedValue = Math.round(currentValue * 100) / 100;
  const correctionPercentage =
    originalValue > 0
      ? Math.round(((correctedValue - originalValue) / originalValue) * 10000) / 100
      : 0;

  return {
    originalValue,
    correctedValue,
    correctionPercentage,
    months,
    index,
    monthlyBreakdown: breakdown,
  };
}

// =============================================================================
// Labor Calculations (Verbas Trabalhistas - simplified)
// =============================================================================

export type TerminationReason =
  | 'sem_justa_causa'
  | 'justa_causa'
  | 'pedido_demissao'
  | 'acordo_mutuo';

export interface LaborCalculationResult {
  saldoSalario: number;
  avisoPrevio: number;
  feriasProporcionais: number;
  tercoFerias: number;
  decimoTerceiroProporcional: number;
  fgtsDeposito: number;
  multaFgts: number;
  total: number;
  breakdown: { label: string; value: number }[];
}

/**
 * Calculate simplified labor termination amounts.
 */
export function calculateLaborTermination(
  salary: number,
  monthsWorked: number,
  reason: TerminationReason
): LaborCalculationResult {
  const dailySalary = salary / 30;

  // Saldo de salario (assume 15 days worked in last month)
  const daysInLastMonth = 15;
  const saldoSalario = Math.round(dailySalary * daysInLastMonth * 100) / 100;

  // Aviso previo (30 days + 3 days per year of service, max 90 days)
  const yearsWorked = Math.floor(monthsWorked / 12);
  const avisoPrevioDays = Math.min(30 + yearsWorked * 3, 90);
  let avisoPrevio = 0;
  if (reason === 'sem_justa_causa') {
    avisoPrevio = Math.round((salary / 30) * avisoPrevioDays * 100) / 100;
  } else if (reason === 'acordo_mutuo') {
    avisoPrevio = Math.round(((salary / 30) * avisoPrevioDays * 0.5) * 100) / 100;
  }

  // Ferias proporcionais (months / 12 * salary)
  const monthsForFerias = monthsWorked % 12 || monthsWorked;
  let feriasProporcionais = 0;
  if (reason !== 'justa_causa') {
    feriasProporcionais = Math.round((salary * monthsForFerias) / 12 * 100) / 100;
  }
  const tercoFerias = Math.round(feriasProporcionais / 3 * 100) / 100;

  // 13o proporcional
  const monthsFor13 = monthsWorked % 12 || monthsWorked;
  let decimoTerceiroProporcional = 0;
  if (reason !== 'justa_causa') {
    decimoTerceiroProporcional = Math.round((salary * monthsFor13) / 12 * 100) / 100;
  }

  // FGTS
  const fgtsDeposito = Math.round(salary * monthsWorked * 0.08 * 100) / 100;
  let multaFgts = 0;
  if (reason === 'sem_justa_causa') {
    multaFgts = Math.round(fgtsDeposito * 0.4 * 100) / 100;
  } else if (reason === 'acordo_mutuo') {
    multaFgts = Math.round(fgtsDeposito * 0.2 * 100) / 100;
  }

  const total = Math.round(
    (saldoSalario + avisoPrevio + feriasProporcionais + tercoFerias +
      decimoTerceiroProporcional + fgtsDeposito + multaFgts) * 100
  ) / 100;

  const breakdown = [
    { label: 'Saldo de Salario (15 dias)', value: saldoSalario },
    { label: `Aviso Previo (${avisoPrevioDays} dias)`, value: avisoPrevio },
    { label: `Ferias Proporcionais (${monthsForFerias}/12)`, value: feriasProporcionais },
    { label: '1/3 Constitucional de Ferias', value: tercoFerias },
    { label: `13o Proporcional (${monthsFor13}/12)`, value: decimoTerceiroProporcional },
    { label: 'FGTS Depositado', value: fgtsDeposito },
    { label: 'Multa FGTS', value: multaFgts },
  ];

  return {
    saldoSalario,
    avisoPrevio,
    feriasProporcionais,
    tercoFerias,
    decimoTerceiroProporcional,
    fgtsDeposito,
    multaFgts,
    total,
    breakdown,
  };
}
