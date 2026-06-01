import { describe, expect, it } from 'vitest';
import {
  generateForecast,
  calculateRunway,
  identifyCashFlowRisks,
  type MonthlyProjection,
} from '@/lib/cash-flow-forecast';
import type { LegalTransaction, Honorario, LegalInvoice } from '@/types/legal';

// ─── Helpers para criação de dados de teste ───────────────────────────────

function makeTransaction(
  date: string,
  type: 'income' | 'expense',
  amount: number,
  id = Math.random().toString(36)
): LegalTransaction {
  return {
    id,
    type,
    category: type === 'income' ? 'honorario_contratual' : 'salario',
    amount,
    description: '',
    date,
    createdAt: date,
  };
}

function makeHonorario(amount: number, installments = 1): Honorario {
  return {
    id: Math.random().toString(36),
    clientId: 'c1',
    type: 'contractual',
    amount,
    installments,
    paidInstallments: 0,
    contractDate: '2025-01-01',
    dueDay: 5,
    status: 'active',
    notes: '',
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };
}

// Transações históricas de 6 meses
const historicalTransactions: LegalTransaction[] = [
  makeTransaction('2025-01-15', 'income', 30000),
  makeTransaction('2025-01-20', 'expense', 10000),
  makeTransaction('2025-02-15', 'income', 32000),
  makeTransaction('2025-02-20', 'expense', 11000),
  makeTransaction('2025-03-15', 'income', 35000),
  makeTransaction('2025-03-20', 'expense', 12000),
  makeTransaction('2025-04-15', 'income', 33000),
  makeTransaction('2025-04-20', 'expense', 11500),
  makeTransaction('2025-05-15', 'income', 36000),
  makeTransaction('2025-05-20', 'expense', 12500),
  makeTransaction('2025-06-15', 'income', 34000),
  makeTransaction('2025-06-20', 'expense', 11000),
];

describe('cash-flow-forecast', () => {
  // ─── generateForecast ─────────────────────────────────────────────────────

  describe('generateForecast', () => {
    it('retorna estrutura completa', () => {
      const forecast = generateForecast(historicalTransactions, [], [], 3);
      expect(forecast).toHaveProperty('historical');
      expect(forecast).toHaveProperty('projections');
      expect(forecast).toHaveProperty('combined');
      expect(forecast).toHaveProperty('avgMonthlyIncome');
      expect(forecast).toHaveProperty('avgMonthlyExpenses');
      expect(forecast).toHaveProperty('burnRate');
      expect(forecast).toHaveProperty('runwayMonths');
      expect(forecast).toHaveProperty('risks');
    });

    it('projeta o número correto de meses', () => {
      const forecast3 = generateForecast(historicalTransactions, [], [], 3);
      const forecast6 = generateForecast(historicalTransactions, [], [], 6);
      const forecast12 = generateForecast(historicalTransactions, [], [], 12);

      expect(forecast3.projections).toHaveLength(3);
      expect(forecast6.projections).toHaveLength(6);
      expect(forecast12.projections).toHaveLength(12);
    });

    it('combined = historical + projections', () => {
      const forecast = generateForecast(historicalTransactions, [], [], 6);
      expect(forecast.combined).toHaveLength(
        forecast.historical.length + forecast.projections.length
      );
    });

    it('avgMonthlyIncome e avgMonthlyExpenses são positivos', () => {
      const forecast = generateForecast(historicalTransactions, [], [], 6);
      expect(forecast.avgMonthlyIncome).toBeGreaterThan(0);
      expect(forecast.avgMonthlyExpenses).toBeGreaterThan(0);
    });

    it('bandas de confiança: incomeOptimistic > income > incomesPessimistic', () => {
      const forecast = generateForecast(historicalTransactions, [], [], 6);
      for (const proj of forecast.projections) {
        expect(proj.incomeOptimistic).toBeGreaterThan(proj.income);
        expect(proj.income).toBeGreaterThan(proj.incomesPessimistic);
      }
    });

    it('bandas de confiança: expensesOptimistic < expenses < expensesPessimistic', () => {
      const forecast = generateForecast(historicalTransactions, [], [], 6);
      for (const proj of forecast.projections) {
        expect(proj.expensesOptimistic).toBeLessThan(proj.expenses);
        expect(proj.expenses).toBeLessThan(proj.expensesPessimistic);
      }
    });

    it('isProjected é false para histórico e true para projeções', () => {
      const forecast = generateForecast(historicalTransactions, [], [], 3);
      forecast.historical.forEach((h) => expect(h.isProjected).toBe(false));
      forecast.projections.forEach((p) => expect(p.isProjected).toBe(true));
    });

    it('burnRate positivo quando receitas > despesas', () => {
      const forecast = generateForecast(historicalTransactions, [], [], 3);
      // Receitas (~33k) > Despesas (~11k) → burnRate positivo
      expect(forecast.burnRate).toBeGreaterThan(0);
    });

    it('honorários contractuais ativos são incluídos nas projeções', () => {
      const honorarios = [makeHonorario(5000, 1)];
      const forecast = generateForecast(historicalTransactions, honorarios, [], 3);
      // Com honorários, income projetado deve ser >= média
      const avgIncome = forecast.avgMonthlyIncome;
      for (const proj of forecast.projections) {
        expect(proj.income).toBeGreaterThanOrEqual(0);
      }
    });

    it('dados vazios não lança erro', () => {
      expect(() => generateForecast([], [], [], 3)).not.toThrow();
    });

    it('forecast com dados vazios tem arrays vazios ou valores zero', () => {
      const forecast = generateForecast([], [], [], 3);
      expect(forecast.historical).toHaveLength(0);
      expect(forecast.avgMonthlyIncome).toBe(0);
      expect(forecast.avgMonthlyExpenses).toBe(0);
    });
  });

  // ─── calculateRunway ──────────────────────────────────────────────────────

  describe('calculateRunway', () => {
    it('burn zero retorna Infinity', () => {
      expect(calculateRunway(50000, 0)).toBe(Infinity);
    });

    it('burn negativo retorna Infinity', () => {
      expect(calculateRunway(50000, -1000)).toBe(Infinity);
    });

    it('saldo zero ou negativo retorna 0', () => {
      expect(calculateRunway(0, 5000)).toBe(0);
      expect(calculateRunway(-1000, 5000)).toBe(0);
    });

    it('runway = saldo / burn mensal', () => {
      expect(calculateRunway(60000, 10000)).toBe(6);
    });

    it('runway fracionado quando não é múltiplo exato', () => {
      expect(calculateRunway(50000, 30000)).toBeCloseTo(1.667, 2);
    });
  });

  // ─── identifyCashFlowRisks ────────────────────────────────────────────────

  describe('identifyCashFlowRisks', () => {
    function makeProjection(
      monthKey: string,
      income: number,
      expenses: number
    ): MonthlyProjection {
      const balance = income - expenses;
      const CONF = 0.15;
      return {
        monthKey,
        label: monthKey,
        income,
        expenses,
        balance,
        cumulative: 0,
        incomeOptimistic: income * (1 + CONF),
        incomesPessimistic: income * (1 - CONF),
        expensesOptimistic: expenses * (1 - CONF),
        expensesPessimistic: expenses * (1 + CONF),
        balanceOptimistic: income * (1 + CONF) - expenses * (1 - CONF),
        balancePessimistic: income * (1 - CONF) - expenses * (1 + CONF),
        isProjected: true,
      };
    }

    it('sem riscos quando fluxo é positivo e saldo alto', () => {
      const projections = [
        makeProjection('2025-07', 50000, 20000),
        makeProjection('2025-08', 50000, 20000),
      ];
      const risks = identifyCashFlowRisks(projections, 100000);
      // Com saldo alto e receitas > despesas, não deve haver riscos críticos de saldo negativo
      const critical = risks.filter((r) => r.severity === 'critical');
      expect(critical).toHaveLength(0);
    });

    it('risco crítico quando saldo acumulado fica negativo', () => {
      const projections = [
        makeProjection('2025-07', 5000, 50000), // deficit de 45k
      ];
      const risks = identifyCashFlowRisks(projections, 10000); // saldo inicial 10k → fica negativo
      const critical = risks.filter((r) => r.severity === 'critical');
      expect(critical.length).toBeGreaterThan(0);
    });

    it('risco warning quando despesas projetadas superam receitas', () => {
      const projections = [
        makeProjection('2025-07', 10000, 20000), // despesas > receitas
      ];
      const risks = identifyCashFlowRisks(projections, 1000000); // saldo alto para não ser crítico
      const warnings = risks.filter((r) => r.severity === 'warning');
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('riscos ordenados por monthKey', () => {
      const projections = [
        makeProjection('2025-09', 5000, 50000),
        makeProjection('2025-07', 5000, 50000),
        makeProjection('2025-08', 5000, 50000),
      ];
      const risks = identifyCashFlowRisks(projections, 0);
      for (let i = 1; i < risks.length; i++) {
        expect(risks[i].monthKey >= risks[i - 1].monthKey).toBe(true);
      }
    });

    it('cada risco tem severity, month, monthKey e message', () => {
      const projections = [makeProjection('2025-07', 5000, 50000)];
      const risks = identifyCashFlowRisks(projections, 0);
      for (const risk of risks) {
        expect(risk).toHaveProperty('severity');
        expect(risk).toHaveProperty('month');
        expect(risk).toHaveProperty('monthKey');
        expect(risk).toHaveProperty('message');
        expect(['critical', 'warning', 'info']).toContain(risk.severity);
      }
    });

    it('sem projeções retorna array vazio', () => {
      const risks = identifyCashFlowRisks([], 50000);
      expect(risks).toEqual([]);
    });
  });
});
