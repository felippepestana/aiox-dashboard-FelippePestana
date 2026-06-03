import { describe, expect, it } from 'vitest';
import {
  generateQuarterlyDARF,
  generateMonthlyPisCofins,
  generateMonthlyISS,
  generateSimplesDAS,
  generateTaxDeadlines,
} from '@/lib/tax-deadlines';

describe('tax-deadlines', () => {
  // ─── Ajuste de dia útil ───────────────────────────────────────────────────

  describe('ajuste de fim de semana e feriado', () => {
    it('DAS vence no dia 20 (ou próximo dia útil) do mês seguinte', () => {
      const obligations = generateSimplesDAS(2025, 1000);
      // Deve haver 12 meses × 4 tipos = 48 entradas no DAS
      expect(obligations).toHaveLength(48);
      for (const obl of obligations) {
        const due = new Date(obl.dueDate);
        // Dia 20 ou posterior (ajuste fim de semana/feriado)
        expect(due.getDate()).toBeGreaterThanOrEqual(20);
      }
    });

    it('PIS/COFINS vence no dia 25 (ou próximo dia útil)', () => {
      const obligations = generateMonthlyPisCofins(2025, 1000, 2000);
      expect(obligations).toHaveLength(12);
      for (const obl of obligations) {
        const due = new Date(obl.dueDate);
        expect(due.getDate()).toBeGreaterThanOrEqual(25);
      }
    });
  });

  // ─── DARF Trimestral ──────────────────────────────────────────────────────

  describe('generateQuarterlyDARF', () => {
    it('gera exatamente 8 obrigações (4 trimestres × IRPJ + CSLL)', () => {
      const result = generateQuarterlyDARF(2025, 'presumido', 100000, 5000, 2000);
      expect(result).toHaveLength(8);
    });

    it('trimestres corretos: 1T, 2T, 3T, 4T', () => {
      const result = generateQuarterlyDARF(2025, 'presumido', 100000, 5000, 2000);
      const periods = result.map((r) => r.period);
      expect(periods.filter((p) => p.includes('1T/'))).toHaveLength(2); // IRPJ + CSLL
      expect(periods.filter((p) => p.includes('2T/'))).toHaveLength(2);
      expect(periods.filter((p) => p.includes('3T/'))).toHaveLength(2);
      expect(periods.filter((p) => p.includes('4T/'))).toHaveLength(2);
    });

    it('4T vence em janeiro do ano seguinte', () => {
      const result = generateQuarterlyDARF(2025, 'presumido', 100000, 5000, 2000);
      const q4 = result.filter((r) => r.period.includes('4T/'));
      for (const obl of q4) {
        const due = new Date(obl.dueDate);
        expect(due.getFullYear()).toBe(2026);
        expect(due.getMonth()).toBe(0); // janeiro
      }
    });

    it('tipos são irpj e csll', () => {
      const result = generateQuarterlyDARF(2025, 'presumido', 100000, 5000, 2000);
      const types = result.map((r) => r.type);
      expect(types).toContain('irpj');
      expect(types).toContain('csll');
    });

    it('amount reflete os valores passados', () => {
      const result = generateQuarterlyDARF(2025, 'presumido', 0, 9999, 4444);
      const irpj = result.filter((r) => r.type === 'irpj');
      const csll = result.filter((r) => r.type === 'csll');
      irpj.forEach((r) => expect(r.amount).toBe(9999));
      csll.forEach((r) => expect(r.amount).toBe(4444));
    });
  });

  // ─── PIS/COFINS mensal ────────────────────────────────────────────────────

  describe('generateMonthlyPisCofins', () => {
    it('gera 12 obrigações mensais', () => {
      const result = generateMonthlyPisCofins(2025, 650, 3000);
      expect(result).toHaveLength(12);
    });

    it('tipo é pis_cofins', () => {
      const result = generateMonthlyPisCofins(2025, 500, 2000);
      result.forEach((r) => expect(r.type).toBe('pis_cofins'));
    });

    it('amount = PIS + COFINS', () => {
      const result = generateMonthlyPisCofins(2025, 650, 3000);
      result.forEach((r) => expect(r.amount).toBe(3650));
    });

    it('dezembro vence em janeiro do ano seguinte', () => {
      const result = generateMonthlyPisCofins(2025, 500, 2000);
      const dez = result[11]; // último mês
      const due = new Date(dez.dueDate);
      expect(due.getFullYear()).toBe(2026);
    });
  });

  // ─── ISS mensal ───────────────────────────────────────────────────────────

  describe('generateMonthlyISS', () => {
    it('gera 12 obrigações mensais', () => {
      const result = generateMonthlyISS(2025, 5000);
      expect(result).toHaveLength(12);
    });

    it('tipo é iss', () => {
      const result = generateMonthlyISS(2025, 5000);
      result.forEach((r) => expect(r.type).toBe('iss'));
    });

    it('vence no dia 10 (ou próximo dia útil) do mês seguinte', () => {
      const result = generateMonthlyISS(2025, 5000, 10);
      for (const obl of result) {
        const due = new Date(obl.dueDate);
        expect(due.getDate()).toBeGreaterThanOrEqual(10);
      }
    });
  });

  // ─── DAS Simples Nacional ─────────────────────────────────────────────────

  describe('generateSimplesDAS', () => {
    it('gera 12 meses × 4 tipos = 48 obrigações', () => {
      const result = generateSimplesDAS(2025, 2000);
      expect(result).toHaveLength(48);
    });

    it('distribui o valor em 4 partes iguais', () => {
      const result = generateSimplesDAS(2025, 4000);
      result.forEach((r) => expect(r.amount).toBe(1000));
    });

    it('period inclui prefixo "DAS"', () => {
      const result = generateSimplesDAS(2025, 1000);
      result.forEach((r) => expect(r.period).toMatch(/^DAS /));
    });
  });

  // ─── generateTaxDeadlines ────────────────────────────────────────────────

  describe('generateTaxDeadlines', () => {
    it('Simples Nacional gera 12 deadlines de DAS + DIRF', () => {
      const deadlines = generateTaxDeadlines({ year: 2025, regime: 'simples' });
      const das = deadlines.filter((d) => d.title.startsWith('DAS'));
      const dirf = deadlines.filter((d) => d.title.includes('DIRF'));
      expect(das).toHaveLength(12);
      expect(dirf).toHaveLength(1);
    });

    it('Lucro Presumido gera PIS/COFINS + ISS + IRPJ/CSLL + obrigações acessórias', () => {
      const deadlines = generateTaxDeadlines({ year: 2025, regime: 'presumido' });
      const pisCofins = deadlines.filter((d) => d.title.startsWith('PIS/COFINS'));
      const iss = deadlines.filter((d) => d.title.startsWith('ISS'));
      const irpjcsll = deadlines.filter((d) => d.title.startsWith('IRPJ/CSLL'));
      const ecd = deadlines.filter((d) => d.title.includes('ECD'));
      const ecf = deadlines.filter((d) => d.title.includes('ECF'));

      expect(pisCofins).toHaveLength(12);
      expect(iss).toHaveLength(12);
      expect(irpjcsll).toHaveLength(4);
      expect(ecd).toHaveLength(1);
      expect(ecf).toHaveLength(1);
    });

    it('Lucro Real gera obrigações similares ao Presumido', () => {
      const deadlines = generateTaxDeadlines({ year: 2025, regime: 'real' });
      const pisCofins = deadlines.filter((d) => d.title.startsWith('PIS/COFINS'));
      expect(pisCofins).toHaveLength(12);
    });

    it('IRPJ/CSLL tem tipo fatal', () => {
      const deadlines = generateTaxDeadlines({ year: 2025, regime: 'presumido' });
      const irpjcsll = deadlines.filter((d) => d.title.startsWith('IRPJ/CSLL'));
      irpjcsll.forEach((d) => expect(d.type).toBe('fatal'));
    });

    it('deadlines ordenados por data', () => {
      const deadlines = generateTaxDeadlines({ year: 2025, regime: 'presumido' });
      for (let i = 1; i < deadlines.length; i++) {
        expect(deadlines[i].dueDate >= deadlines[i - 1].dueDate).toBe(true);
      }
    });

    it('Simples não inclui ECD nem ECF', () => {
      const deadlines = generateTaxDeadlines({ year: 2025, regime: 'simples' });
      const ecd = deadlines.find((d) => d.title.includes('ECD'));
      const ecf = deadlines.find((d) => d.title.includes('ECF'));
      expect(ecd).toBeUndefined();
      expect(ecf).toBeUndefined();
    });
  });
});
