import { describe, expect, it } from 'vitest';
import {
  calculateSimplesNacional,
  calculateLucroPresumido,
  calculateLucroReal,
  compareTaxRegimes,
  getTaxCalendar,
  SIMPLES_NACIONAL_FAIXAS,
} from '@/lib/tax-calculator';

describe('tax-calculator', () => {
  // ─── Simples Nacional ─────────────────────────────────────────────────────

  describe('calculateSimplesNacional', () => {
    it('Faixa 1: receita até R$180.000 aplica alíquota 4,5%', () => {
      const result = calculateSimplesNacional(120000);
      expect(result.total).toBeGreaterThan(0);
      expect(result.details.faixa).toBe('Faixa 1');
      expect(result.details.aliquotaNominal).toBe('4.5%');
    });

    it('Faixa 2: receita entre R$180.000 e R$360.000', () => {
      const result = calculateSimplesNacional(250000);
      expect(result.details.faixa).toBe('Faixa 2');
      expect(result.details.aliquotaNominal).toBe('9%');
    });

    it('Faixa 3: receita entre R$360.000 e R$720.000', () => {
      const result = calculateSimplesNacional(500000);
      expect(result.details.faixa).toBe('Faixa 3');
      expect(result.details.aliquotaNominal).toBe('10.2%');
    });

    it('Faixa 4: receita entre R$720.000 e R$1.800.000', () => {
      const result = calculateSimplesNacional(1000000);
      expect(result.details.faixa).toBe('Faixa 4');
      expect(result.details.aliquotaNominal).toBe('14%');
    });

    it('Faixa 5: receita entre R$1.800.000 e R$3.600.000', () => {
      const result = calculateSimplesNacional(2000000);
      expect(result.details.faixa).toBe('Faixa 5');
      expect(result.details.aliquotaNominal).toBe('22%');
    });

    it('Faixa 6: receita entre R$3.600.000 e R$4.800.000', () => {
      const result = calculateSimplesNacional(4000000);
      expect(result.details.faixa).toBe('Faixa 6');
      expect(result.details.aliquotaNominal).toBe('33%');
    });

    it('retorna estrutura completa com todos os tributos', () => {
      const result = calculateSimplesNacional(300000);
      expect(result).toHaveProperty('irpj');
      expect(result).toHaveProperty('csll');
      expect(result).toHaveProperty('pis');
      expect(result).toHaveProperty('cofins');
      expect(result).toHaveProperty('iss');
      expect(result).toHaveProperty('total');
    });

    it('Manaus tem ISS 2% (menor que padrão 5%)', () => {
      const manaus = calculateSimplesNacional(300000, 'Manaus');
      const padrao = calculateSimplesNacional(300000, 'São Paulo');
      // O ISS menor resulta em variação interna dos componentes
      expect(manaus.iss).toBeLessThan(padrao.iss);
    });

    it('receita zero retorna total zero', () => {
      const result = calculateSimplesNacional(0);
      expect(result.total).toBe(0);
    });

    it('receita acima de R$4.800.000 retorna erro de exclusão do Simples', () => {
      const result = calculateSimplesNacional(5000000);
      expect(result.total).toBe(0);
      expect(result.details.error).toContain('limite do Simples Nacional');
    });
  });

  // ─── Lucro Presumido ──────────────────────────────────────────────────────

  describe('calculateLucroPresumido', () => {
    it('calcula corretamente para receita mensal padrão', () => {
      const result = calculateLucroPresumido(50000);
      expect(result.total).toBeGreaterThan(0);
      expect(result.details.regime).toBe('Lucro Presumido');
    });

    it('PIS = 0,65% da receita bruta', () => {
      const result = calculateLucroPresumido(100000);
      expect(result.pis).toBeCloseTo(650, 0);
    });

    it('COFINS = 3% da receita bruta', () => {
      const result = calculateLucroPresumido(100000);
      expect(result.cofins).toBeCloseTo(3000, 0);
    });

    it('ISS padrão = 5% da receita bruta', () => {
      const result = calculateLucroPresumido(100000);
      expect(result.iss).toBeCloseTo(5000, 0);
    });

    it('IRPJ adicional 10% sobre base que excede R$60k/trimestre', () => {
      // Receita mensal = R$200k → trimestral = R$600k
      // Base presumida = 32% de R$600k = R$192k
      // Excedente = R$192k - R$60k = R$132k → adicional = R$13.200
      const result = calculateLucroPresumido(200000);
      const adicionalStr = result.details.irpjAdicional;
      expect(adicionalStr).not.toBe('N/A');
    });

    it('sem IRPJ adicional quando base trimestral não excede R$60k', () => {
      // Receita = R$5k/mês → trimestral = R$15k
      // Base = 32% * R$15k = R$4.800 < R$60k → sem adicional
      const result = calculateLucroPresumido(5000);
      expect(result.details.irpjAdicional).toBe('N/A');
    });

    it('ISS de Manaus (2%) menor que São Paulo (5%)', () => {
      const sp = calculateLucroPresumido(100000, 'São Paulo');
      const manaus = calculateLucroPresumido(100000, 'Manaus');
      expect(manaus.iss).toBeLessThan(sp.iss);
    });
  });

  // ─── Lucro Real ───────────────────────────────────────────────────────────

  describe('calculateLucroReal', () => {
    it('calcula com despesas dedutíveis', () => {
      const result = calculateLucroReal(100000, 60000);
      expect(result.details.regime).toBe('Lucro Real');
      // lucro real = 40.000
      expect(result.irpj).toBeGreaterThan(0);
    });

    it('PIS = 1,65% (não-cumulativo)', () => {
      const result = calculateLucroReal(100000, 0);
      expect(result.pis).toBeCloseTo(1650, 0);
    });

    it('COFINS = 7,6% (não-cumulativo)', () => {
      const result = calculateLucroReal(100000, 0);
      expect(result.cofins).toBeCloseTo(7600, 0);
    });

    it('lucro negativo (despesas > receita) resulta em IRPJ/CSLL zero', () => {
      const result = calculateLucroReal(50000, 80000);
      expect(result.irpj).toBe(0);
      expect(result.csll).toBe(0);
    });

    it('IRPJ adicional 10% sobre excedente de R$20k/mês', () => {
      // Receita = R$200k, Despesas = 0 → lucro = R$200k
      // Excedente = R$200k - R$20k = R$180k → adicional = R$18k
      const result = calculateLucroReal(200000, 0);
      expect(result.irpj).toBeGreaterThan(200000 * 0.15);
    });

    it('sem despesas dedutíveis, usa receita bruta como lucro', () => {
      const semDespesas = calculateLucroReal(50000);
      const zeroDespesas = calculateLucroReal(50000, 0);
      expect(semDespesas.total).toBe(zeroDespesas.total);
    });
  });

  // ─── Comparação de regimes ────────────────────────────────────────────────

  describe('compareTaxRegimes', () => {
    it('retorna todos os 3 regimes', () => {
      const result = compareTaxRegimes(50000);
      expect(result).toHaveProperty('simples');
      expect(result).toHaveProperty('presumido');
      expect(result).toHaveProperty('real');
    });

    it('campo "recommended" é um dos 3 regimes válidos', () => {
      const result = compareTaxRegimes(50000);
      expect(['simples', 'presumido', 'real']).toContain(result.recommended);
    });

    it('regime recomendado tem o menor total de impostos', () => {
      const result = compareTaxRegimes(50000, 30000);
      const recommendedTotal = result[result.recommended].total;
      expect(recommendedTotal).toBeLessThanOrEqual(result.simples.total);
      expect(recommendedTotal).toBeLessThanOrEqual(result.presumido.total);
      expect(recommendedTotal).toBeLessThanOrEqual(result.real.total);
    });

    it('alta despesa dedutível favorece Lucro Real', () => {
      // Com 90% de despesas, Lucro Real tem base quase zero
      const result = compareTaxRegimes(100000, 90000);
      expect(result.recommended).toBe('real');
    });
  });

  // ─── Calendário fiscal ────────────────────────────────────────────────────

  describe('getTaxCalendar', () => {
    it('Simples Nacional gera 12 entradas mensais de DAS', () => {
      const entries = getTaxCalendar(2025, 'simples');
      const das = entries.filter((e) => e.tax === 'DAS');
      expect(das).toHaveLength(12);
    });

    it('Simples Nacional inclui DIRF anual', () => {
      const entries = getTaxCalendar(2025, 'simples');
      const dirf = entries.find((e) => e.tax === 'DIRF');
      expect(dirf).toBeDefined();
    });

    it('Lucro Presumido gera 4 entradas trimestrais de IRPJ', () => {
      const entries = getTaxCalendar(2025, 'presumido');
      const irpj = entries.filter((e) => e.tax === 'IRPJ' && e.type === 'quarterly');
      expect(irpj).toHaveLength(4);
    });

    it('Lucro Presumido inclui ECD e ECF anuais', () => {
      const entries = getTaxCalendar(2025, 'presumido');
      expect(entries.find((e) => e.tax === 'ECD')).toBeDefined();
      expect(entries.find((e) => e.tax === 'ECF')).toBeDefined();
    });

    it('Lucro Real gera PIS e COFINS mensais (12 de cada)', () => {
      const entries = getTaxCalendar(2025, 'real');
      const pis = entries.filter((e) => e.tax === 'PIS');
      const cofins = entries.filter((e) => e.tax === 'COFINS');
      expect(pis).toHaveLength(12);
      expect(cofins).toHaveLength(12);
    });

    it('entradas estão ordenadas por data', () => {
      const entries = getTaxCalendar(2025, 'presumido');
      for (let i = 1; i < entries.length; i++) {
        expect(entries[i].dueDate >= entries[i - 1].dueDate).toBe(true);
      }
    });

    it('IRPJ trimestral tem quarters 1 a 4', () => {
      const entries = getTaxCalendar(2025, 'presumido');
      const irpj = entries.filter((e) => e.tax === 'IRPJ' && e.type === 'quarterly');
      const quarters = irpj.map((e) => e.quarter).sort();
      expect(quarters).toEqual([1, 2, 3, 4]);
    });
  });

  // ─── SIMPLES_NACIONAL_FAIXAS ──────────────────────────────────────────────

  describe('SIMPLES_NACIONAL_FAIXAS', () => {
    it('possui exatamente 6 faixas', () => {
      expect(SIMPLES_NACIONAL_FAIXAS).toHaveLength(6);
    });

    it('faixas cobrem de 0 até R$4.800.000', () => {
      const ultima = SIMPLES_NACIONAL_FAIXAS[SIMPLES_NACIONAL_FAIXAS.length - 1];
      expect(SIMPLES_NACIONAL_FAIXAS[0].minRevenue).toBe(0);
      expect(ultima.maxRevenue).toBe(4800000);
    });
  });
});
