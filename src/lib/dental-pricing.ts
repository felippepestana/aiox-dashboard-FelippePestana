// =============================================================================
// Dental Pricing Management - Sbarzi Odontologia e Saúde
// Price table based on VRCO (Valores Referenciais para Convênios Odontológicos)
// =============================================================================

import type { TreatmentProcedure } from '@/types/dental';
import { DENTAL_PROCEDURES } from '@/lib/dental-procedures';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PriceTableEntry {
  procedureId: string;
  code: string;
  name: string;
  /** Default price in BRL centavos */
  defaultPrice: number;
  /** Custom price in BRL centavos (overrides default) */
  customPrice: number | null;
  /** Minimum acceptable price in BRL centavos */
  minPrice: number;
  /** Maximum price in BRL centavos */
  maxPrice: number;
}

export type PriceTable = Record<string, PriceTableEntry>;

export interface DiscountOptions {
  /** Fixed discount in BRL centavos */
  fixedAmount?: number;
  /** Percentage discount (0–100) */
  percentage?: number;
  /** Reason / justification for the discount */
  reason?: string;
}

// ─── Default Price Table (VRCO-based) ───────────────────────────────────────

/**
 * Build the default price table from the procedures database.
 * Min price = 60% of default, max price = 150% of default.
 */
function buildDefaultPriceTable(): PriceTable {
  const table: PriceTable = {};

  for (const proc of DENTAL_PROCEDURES) {
    table[proc.id] = {
      procedureId: proc.id,
      code: proc.code,
      name: proc.name,
      defaultPrice: proc.price,
      customPrice: null,
      minPrice: Math.round(proc.price * 0.6),
      maxPrice: Math.round(proc.price * 1.5),
    };
  }

  return table;
}

export const DEFAULT_PRICE_TABLE: PriceTable = buildDefaultPriceTable();

// ─── Price Functions ────────────────────────────────────────────────────────

/**
 * Get the effective price for a procedure, considering custom overrides.
 * Returns price in BRL centavos.
 */
export function getProcedurePrice(
  procedureId: string,
  priceTable: PriceTable = DEFAULT_PRICE_TABLE
): number {
  const entry = priceTable[procedureId];
  if (!entry) {
    // Fall back to the procedures database
    const proc = DENTAL_PROCEDURES.find((p) => p.id === procedureId);
    return proc?.price ?? 0;
  }
  return entry.customPrice ?? entry.defaultPrice;
}

/**
 * Update the custom price for a procedure in a price table.
 * Returns a new price table (immutable update).
 */
export function updateProcedurePrice(
  priceTable: PriceTable,
  procedureId: string,
  newPrice: number
): PriceTable {
  const entry = priceTable[procedureId];
  if (!entry) {
    throw new Error(`Procedure "${procedureId}" not found in price table.`);
  }

  if (newPrice < entry.minPrice) {
    throw new Error(
      `Price ${formatBRL(newPrice)} is below the minimum of ${formatBRL(entry.minPrice)} for "${entry.name}".`
    );
  }
  if (newPrice > entry.maxPrice) {
    throw new Error(
      `Price ${formatBRL(newPrice)} exceeds the maximum of ${formatBRL(entry.maxPrice)} for "${entry.name}".`
    );
  }

  return {
    ...priceTable,
    [procedureId]: {
      ...entry,
      customPrice: newPrice,
    },
  };
}

/**
 * Reset a procedure's price to the default (remove custom override).
 */
export function resetProcedurePrice(
  priceTable: PriceTable,
  procedureId: string
): PriceTable {
  const entry = priceTable[procedureId];
  if (!entry) return priceTable;

  return {
    ...priceTable,
    [procedureId]: {
      ...entry,
      customPrice: null,
    },
  };
}

/**
 * Calculate the total cost of a treatment plan's procedures.
 * Returns total in BRL centavos.
 */
export function calculateTreatmentTotal(
  procedures: TreatmentProcedure[],
  priceTable: PriceTable = DEFAULT_PRICE_TABLE
): number {
  return procedures.reduce((total, proc) => {
    // Use the procedure-level price if set, otherwise look up the table
    const price = proc.price > 0 ? proc.price : getProcedurePrice(proc.procedureId, priceTable);
    return total + price;
  }, 0);
}

/**
 * Apply a discount to a subtotal.
 * Returns the discounted total in BRL centavos.
 *
 * If both fixedAmount and percentage are provided, the percentage is applied
 * first and then the fixed amount is subtracted.
 */
export function applyDiscount(
  subtotal: number,
  options: DiscountOptions
): number {
  let discounted = subtotal;

  if (options.percentage !== undefined && options.percentage > 0) {
    const pct = Math.min(options.percentage, 100);
    discounted = Math.round(discounted * (1 - pct / 100));
  }

  if (options.fixedAmount !== undefined && options.fixedAmount > 0) {
    discounted = Math.max(0, discounted - options.fixedAmount);
  }

  return discounted;
}

/**
 * Calculate the discount amount given subtotal and discount options.
 * Returns the discount value in BRL centavos.
 */
export function calculateDiscountAmount(
  subtotal: number,
  options: DiscountOptions
): number {
  return subtotal - applyDiscount(subtotal, options);
}

// ─── Formatting ─────────────────────────────────────────────────────────────

/**
 * Format a value in centavos as a BRL currency string.
 * Example: 15000 → "R$ 150,00"
 */
export function formatBRL(centavos: number): string {
  const reais = centavos / 100;
  return reais.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Parse a BRL formatted string to centavos.
 * Example: "R$ 150,00" → 15000
 */
export function parseBRL(value: string): number {
  const cleaned = value
    .replace(/R\$\s?/, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return Math.round(parseFloat(cleaned) * 100);
}

// ─── Installment Helpers ────────────────────────────────────────────────────

export interface InstallmentOption {
  installments: number;
  /** Value per installment in BRL centavos */
  valuePerInstallment: number;
  /** Total in BRL centavos */
  total: number;
  /** Whether interest is charged */
  hasInterest: boolean;
  /** Monthly interest rate (0-1 decimal) */
  interestRate: number;
}

/**
 * Calculate installment options for a given total.
 * First N installments are interest-free, the rest carry a monthly rate.
 */
export function calculateInstallments(
  totalCentavos: number,
  maxInstallments: number = 12,
  interestFreeInstallments: number = 3,
  monthlyInterestRate: number = 0.0199 // 1.99% per month
): InstallmentOption[] {
  const options: InstallmentOption[] = [];

  for (let i = 1; i <= maxInstallments; i++) {
    if (i <= interestFreeInstallments) {
      options.push({
        installments: i,
        valuePerInstallment: Math.ceil(totalCentavos / i),
        total: totalCentavos,
        hasInterest: false,
        interestRate: 0,
      });
    } else {
      // Price Factor = [r(1+r)^n] / [(1+r)^n - 1]  (French amortisation)
      const r = monthlyInterestRate;
      const n = i;
      const factor = (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      const installmentValue = Math.ceil(totalCentavos * factor);
      options.push({
        installments: i,
        valuePerInstallment: installmentValue,
        total: installmentValue * i,
        hasInterest: true,
        interestRate: monthlyInterestRate,
      });
    }
  }

  return options;
}

// ─── Price Comparison Helpers ───────────────────────────────────────────────

/**
 * Compare current prices against the default VRCO reference.
 */
export function comparePriceToDefault(
  procedureId: string,
  priceTable: PriceTable
): { current: number; default_: number; diffPercent: number } | null {
  const entry = priceTable[procedureId];
  if (!entry) return null;

  const current = entry.customPrice ?? entry.defaultPrice;
  const diff = current - entry.defaultPrice;
  const diffPercent =
    entry.defaultPrice > 0 ? (diff / entry.defaultPrice) * 100 : 0;

  return {
    current,
    default_: entry.defaultPrice,
    diffPercent: Math.round(diffPercent * 100) / 100,
  };
}
