import { describe, expect, it } from 'vitest';
import {
  generateMonthlyFinancialReport,
  generateCaseloadReport,
  generateQuarterlyReport,
  type ReportStoreData,
} from '@/lib/reporting-engine';
import type {
  LegalProcess,
  LegalClient,
  Deadline,
  Petition,
  LegalTransaction,
  Honorario,
} from '@/types/legal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyData(): ReportStoreData {
  return {
    processes: [],
    clients: [],
    deadlines: [],
    petitions: [],
    transactions: [],
    honorarios: [],
  };
}

function makeProcess(
  id: string,
  area: LegalProcess['area'],
  status: LegalProcess['status'],
  urgency: LegalProcess['urgency'] = 'medium',
  createdAt = '2026-06-01T00:00:00Z',
  updatedAt = '2026-06-01T00:00:00Z'
): LegalProcess {
  return {
    id,
    cnj: `000${id}-00.2026.8.26.0100`,
    title: `Processo ${id}`,
    area,
    court: 'TJSP',
    judge: 'Dr. Juiz',
    vara: '1ª Vara Cível',
    comarca: 'São Paulo',
    state: 'SP',
    clientId: 'c1',
    opposingParty: 'Parte Contrária',
    opposingLawyer: 'Dr. Adversário',
    status,
    urgency,
    courtSystem: 'esaj',
    object: 'Cobrança',
    causeValue: 10000,
    feeType: 'fixed',
    feeAmount: 5000,
    tags: [],
    createdAt,
    updatedAt,
  };
}

function makeTransaction(
  id: string,
  type: 'income' | 'expense',
  amount: number,
  date: string
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

function makeClient(id: string, createdAt = '2026-06-01T00:00:00Z'): LegalClient {
  return {
    id,
    type: 'pf',
    name: `Cliente ${id}`,
    cpfCnpj: '000.000.000-00',
    email: 'cliente@exemplo.com',
    phone: '11999999999',
    whatsapp: '11999999999',
    address: {
      street: 'Rua Teste',
      number: '1',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01000-000',
    },
    processIds: [],
    contractIds: [],
    notes: '',
    createdAt,
    updatedAt: createdAt,
  };
}

function makeHonorario(
  id: string,
  clientId: string,
  amount: number,
  contractDate: string,
  processId?: string
): Honorario {
  return {
    id,
    clientId,
    processId,
    type: 'contractual',
    amount,
    installments: 1,
    paidInstallments: 0,
    contractDate,
    dueDay: 5,
    status: 'active',
    notes: '',
    createdAt: contractDate,
    updatedAt: contractDate,
  };
}

function makePetition(
  id: string,
  processId: string,
  status: Petition['status'],
  createdAt = '2026-06-01T00:00:00Z'
): Petition {
  return {
    id,
    processId,
    type: 'inicial',
    title: `Petição ${id}`,
    status,
    content: '',
    documentIds: [],
    createdAt,
    updatedAt: createdAt,
  };
}

function makeDeadline(
  id: string,
  status: Deadline['status'],
  dueDate: string
): Deadline {
  return {
    id,
    processId: 'p1',
    title: `Prazo ${id}`,
    type: 'fatal',
    dueDate,
    reminderDays: [7],
    status,
    assignedTo: '',
    notes: '',
    createdAt: '2026-01-01T00:00:00Z',
  };
}

describe('reporting-engine', () => {
  // ─── generateMonthlyFinancialReport ───────────────────────────────────────

  describe('generateMonthlyFinancialReport', () => {
    it('retorna estrutura com todos os campos obrigatórios', () => {
      const report = generateMonthlyFinancialReport(2026, 1, emptyData());
      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('year');
      expect(report).toHaveProperty('month');
      expect(report).toHaveProperty('income');
      expect(report).toHaveProperty('expenses');
      expect(report).toHaveProperty('profit');
      expect(report).toHaveProperty('profitMargin');
      expect(report).toHaveProperty('revenueByArea');
      expect(report).toHaveProperty('topClients');
      expect(report).toHaveProperty('taxSummary');
      expect(report).toHaveProperty('transactionCount');
    });

    it('period formatado como YYYY-MM', () => {
      const report = generateMonthlyFinancialReport(2026, 6, emptyData());
      expect(report.period).toBe('2026-06');
    });

    it('com dados vazios, income e expenses são zero', () => {
      const report = generateMonthlyFinancialReport(2026, 1, emptyData());
      expect(report.income).toBe(0);
      expect(report.expenses).toBe(0);
      expect(report.profit).toBe(0);
    });

    it('calcula income e expenses a partir de transações', () => {
      const data = emptyData();
      data.transactions = [
        makeTransaction('t1', 'income', 50000, '2026-01-10'),
        makeTransaction('t2', 'income', 30000, '2026-01-15'),
        makeTransaction('t3', 'expense', 20000, '2026-01-20'),
      ];
      const report = generateMonthlyFinancialReport(2026, 1, data);
      expect(report.income).toBe(80000);
      expect(report.expenses).toBe(20000);
      expect(report.profit).toBe(60000);
    });

    it('profitMargin = (profit/income) * 100', () => {
      const data = emptyData();
      data.transactions = [
        makeTransaction('t1', 'income', 100000, '2026-01-10'),
        makeTransaction('t2', 'expense', 30000, '2026-01-20'),
      ];
      const report = generateMonthlyFinancialReport(2026, 1, data);
      expect(report.profitMargin).toBeCloseTo(70, 1);
    });

    it('transações de outros meses não são incluídas', () => {
      const data = emptyData();
      data.transactions = [
        makeTransaction('t1', 'income', 50000, '2026-02-10'), // fevereiro
        makeTransaction('t2', 'expense', 20000, '2026-03-20'), // março
      ];
      const report = generateMonthlyFinancialReport(2026, 1, data); // janeiro
      expect(report.income).toBe(0);
      expect(report.expenses).toBe(0);
    });

    it('transactionCount reflete contagem correta', () => {
      const data = emptyData();
      data.transactions = [
        makeTransaction('t1', 'income', 10000, '2026-06-01'),
        makeTransaction('t2', 'income', 20000, '2026-06-02'),
        makeTransaction('t3', 'expense', 5000, '2026-06-03'),
      ];
      const report = generateMonthlyFinancialReport(2026, 6, data);
      expect(report.transactionCount.income).toBe(2);
      expect(report.transactionCount.expense).toBe(1);
    });
  });

  // ─── generateCaseloadReport ───────────────────────────────────────────────

  describe('generateCaseloadReport', () => {
    it('com dados vazios retorna zeros', () => {
      const report = generateCaseloadReport(emptyData());
      expect(report.totalProcesses).toBe(0);
      expect(report.activeProcesses).toBe(0);
    });

    it('contagem total de processos', () => {
      const data = emptyData();
      data.processes = [
        makeProcess('1', 'civil', 'active'),
        makeProcess('2', 'trabalhista', 'active'),
        makeProcess('3', 'tributario', 'closed'),
      ];
      const report = generateCaseloadReport(data);
      expect(report.totalProcesses).toBe(3);
    });

    it('activeProcesses conta apenas processos com status "active"', () => {
      const data = emptyData();
      data.processes = [
        makeProcess('1', 'civil', 'active'),
        makeProcess('2', 'trabalhista', 'active'),
        makeProcess('3', 'penal', 'won'),
      ];
      const report = generateCaseloadReport(data);
      expect(report.activeProcesses).toBe(2);
    });

    it('byArea agrupa processos por área', () => {
      const data = emptyData();
      data.processes = [
        makeProcess('1', 'civil', 'active'),
        makeProcess('2', 'civil', 'active'),
        makeProcess('3', 'trabalhista', 'active'),
      ];
      const report = generateCaseloadReport(data);
      const civil = report.byArea.find((a) => a.area === 'civil');
      expect(civil?.count).toBe(2);
    });

    it('byStatus agrupa processos por status', () => {
      const data = emptyData();
      data.processes = [
        makeProcess('1', 'civil', 'active'),
        makeProcess('2', 'civil', 'active'),
        makeProcess('3', 'trabalhista', 'won'),
      ];
      const report = generateCaseloadReport(data);
      const active = report.byStatus.find((s) => s.status === 'active');
      expect(active?.count).toBe(2);
    });

    it('byUrgency agrupa processos por urgência', () => {
      const data = emptyData();
      data.processes = [
        makeProcess('1', 'civil', 'active', 'critical'),
        makeProcess('2', 'civil', 'active', 'high'),
        makeProcess('3', 'civil', 'active', 'critical'),
      ];
      const report = generateCaseloadReport(data);
      const critical = report.byUrgency.find((u) => u.urgency === 'critical');
      expect(critical?.count).toBe(2);
    });

    it('deadlineComplianceByMonth tem 6 entradas (últimos 6 meses)', () => {
      const report = generateCaseloadReport(emptyData());
      expect(report.deadlineComplianceByMonth).toHaveLength(6);
    });
  });

  // ─── generateQuarterlyReport ──────────────────────────────────────────────

  describe('generateQuarterlyReport', () => {
    it('healthScore está entre 0 e 100', () => {
      const report = generateQuarterlyReport(2026, 1, emptyData());
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
      expect(report.healthScore).toBeLessThanOrEqual(100);
    });

    it('months contém os 3 meses corretos para cada trimestre', () => {
      const q1 = generateQuarterlyReport(2026, 1, emptyData());
      expect(q1.months).toEqual(['2026-01', '2026-02', '2026-03']);

      const q2 = generateQuarterlyReport(2026, 2, emptyData());
      expect(q2.months).toEqual(['2026-04', '2026-05', '2026-06']);

      const q3 = generateQuarterlyReport(2026, 3, emptyData());
      expect(q3.months).toEqual(['2026-07', '2026-08', '2026-09']);

      const q4 = generateQuarterlyReport(2026, 4, emptyData());
      expect(q4.months).toEqual(['2026-10', '2026-11', '2026-12']);
    });

    it('financial.byMonth tem 3 entradas', () => {
      const report = generateQuarterlyReport(2026, 1, emptyData());
      expect(report.financial.byMonth).toHaveLength(3);
    });

    it('financial.totalIncome = soma dos meses', () => {
      const data = emptyData();
      data.transactions = [
        makeTransaction('t1', 'income', 10000, '2026-01-10'),
        makeTransaction('t2', 'income', 20000, '2026-02-10'),
        makeTransaction('t3', 'income', 30000, '2026-03-10'),
      ];
      const report = generateQuarterlyReport(2026, 1, data);
      expect(report.financial.totalIncome).toBe(60000);
    });

    it('retorna year e quarter corretos', () => {
      const report = generateQuarterlyReport(2025, 3, emptyData());
      expect(report.year).toBe(2025);
      expect(report.quarter).toBe(3);
    });

    it('estrutura caseload está presente', () => {
      const report = generateQuarterlyReport(2026, 1, emptyData());
      expect(report.caseload).toHaveProperty('totalProcesses');
      expect(report.caseload).toHaveProperty('activeProcesses');
    });

    it('estrutura productivity está presente', () => {
      const report = generateQuarterlyReport(2026, 1, emptyData());
      expect(report.productivity).toHaveProperty('petitionsCreated');
      expect(report.productivity).toHaveProperty('deadlinesMet');
      expect(report.productivity).toHaveProperty('deadlinesMissed');
      expect(report.productivity).toHaveProperty('deadlineComplianceRate');
    });

    it('healthScore com dados de deadlines cumpridos é mais alto', () => {
      const data = emptyData();
      data.deadlines = [
        makeDeadline('d1', 'completed', '2026-01-10'),
        makeDeadline('d2', 'completed', '2026-01-20'),
        makeDeadline('d3', 'completed', '2026-02-10'),
      ];
      const report = generateQuarterlyReport(2026, 1, data);
      expect(report.healthScore).toBeGreaterThan(0);
    });
  });
});
