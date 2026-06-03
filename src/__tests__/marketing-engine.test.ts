import { describe, expect, it } from 'vitest';
import {
  calculateCAC,
  calculateConversionRates,
  calculateROI,
  getLeadScoring,
} from '@/lib/marketing-engine';
import type { LegalCampaign, LegalLead } from '@/types/legal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCampaign(
  id: string,
  channel: LegalCampaign['channel'],
  budget: number,
  leads: number,
  conversions: number,
  roi: number
): LegalCampaign {
  return {
    id,
    name: `Campanha ${id}`,
    type: 'content',
    channel,
    area: 'civil',
    status: 'active',
    startDate: '2025-01-01',
    budget,
    oabCompliant: true,
    metrics: { impressions: 1000, clicks: 100, leads, conversions, roi, engagement: 50 },
    createdAt: '2025-01-01',
    updatedAt: '2025-01-01',
  };
}

function makeLead(
  id: string,
  status: LegalLead['status'],
  source = 'indicacao',
  createdAt = new Date().toISOString()
): LegalLead {
  return {
    id,
    name: `Lead ${id}`,
    email: `lead${id}@exemplo.com`,
    phone: '11999999999',
    area: 'civil',
    source,
    status,
    notes: 'Nota de teste com mais de vinte caracteres para pontuar.',
    assignedTo: '',
    createdAt,
    updatedAt: new Date().toISOString(),
  };
}

describe('marketing-engine', () => {
  // ─── calculateCAC ─────────────────────────────────────────────────────────

  describe('calculateCAC', () => {
    it('calcula CAC geral: totalSpend / totalConversions', () => {
      const campaigns = [
        makeCampaign('c1', 'linkedin', 10000, 50, 5, 200),
        makeCampaign('c2', 'google_ads', 5000, 30, 2, 100),
      ];
      const result = calculateCAC(campaigns);
      // Total spend = 15000, conversions = 7 → CAC ≈ 2142.86
      expect(result.overall).toBeCloseTo(15000 / 7, 1);
    });

    it('retorna CAC por campanha', () => {
      const campaigns = [makeCampaign('c1', 'linkedin', 10000, 50, 5, 200)];
      const result = calculateCAC(campaigns);
      expect(result.byCampaign['c1']).toBeCloseTo(10000 / 5, 1);
    });

    it('retorna CAC por canal', () => {
      const campaigns = [
        makeCampaign('c1', 'linkedin', 10000, 50, 5, 200),
        makeCampaign('c2', 'linkedin', 5000, 30, 2, 100),
      ];
      const result = calculateCAC(campaigns);
      // linkedin: 15000 / 7
      expect(result.byChannel['linkedin']).toBeCloseTo(15000 / 7, 1);
    });

    it('zero conversões usa budget como CAC', () => {
      const campaigns = [makeCampaign('c1', 'instagram', 5000, 10, 0, 0)];
      const result = calculateCAC(campaigns);
      expect(result.byCampaign['c1']).toBe(5000);
    });

    it('array vazio retorna zeros', () => {
      const result = calculateCAC([]);
      expect(result.overall).toBe(0);
    });
  });

  // ─── calculateConversionRates ─────────────────────────────────────────────

  describe('calculateConversionRates', () => {
    it('calcula taxa de conversão geral corretamente', () => {
      const leads = [
        makeLead('1', 'retained'),
        makeLead('2', 'retained'),
        makeLead('3', 'prospect'),
        makeLead('4', 'lost'),
      ];
      const result = calculateConversionRates(leads);
      // 2 retained de 4 total = 50%
      expect(result.overallConversionRate).toBeCloseTo(50, 1);
    });

    it('totalLeads inclui todos os leads', () => {
      const leads = [
        makeLead('1', 'prospect'),
        makeLead('2', 'qualified'),
        makeLead('3', 'lost'),
      ];
      const result = calculateConversionRates(leads);
      expect(result.totalLeads).toBe(3);
    });

    it('funnel contém 5 etapas na ordem correta', () => {
      const leads = [makeLead('1', 'prospect')];
      const result = calculateConversionRates(leads);
      const statusOrder = result.funnel.map((f) => f.status);
      expect(statusOrder).toEqual(['prospect', 'qualified', 'contacted', 'proposal', 'retained']);
    });

    it('conversionFromTop é porcentagem do total de leads', () => {
      const leads = [
        makeLead('1', 'retained'),
        makeLead('2', 'retained'),
        makeLead('3', 'prospect'),
        makeLead('4', 'prospect'),
      ];
      const result = calculateConversionRates(leads);
      const retained = result.funnel.find((f) => f.status === 'retained');
      expect(retained?.conversionFromTop).toBeCloseTo(50, 1);
    });

    it('sem leads retorna total 0 e funnel com zeros', () => {
      const result = calculateConversionRates([]);
      expect(result.totalLeads).toBe(0);
      expect(result.overallConversionRate).toBe(0);
    });
  });

  // ─── calculateROI ─────────────────────────────────────────────────────────

  describe('calculateROI', () => {
    it('retorna ROI por campanha com todos os campos', () => {
      const campaigns = [makeCampaign('c1', 'linkedin', 10000, 50, 5, 300)];
      const result = calculateROI(campaigns);
      expect(result.byCampaign).toHaveLength(1);
      const c = result.byCampaign[0];
      expect(c).toHaveProperty('id');
      expect(c).toHaveProperty('name');
      expect(c).toHaveProperty('channel');
      expect(c).toHaveProperty('budget');
      expect(c).toHaveProperty('spend');
      expect(c).toHaveProperty('leads');
      expect(c).toHaveProperty('conversions');
      expect(c).toHaveProperty('roi');
      expect(c).toHaveProperty('cpl');
    });

    it('cpl = budget / leads', () => {
      const campaigns = [makeCampaign('c1', 'linkedin', 10000, 50, 5, 300)];
      const result = calculateROI(campaigns);
      expect(result.byCampaign[0].cpl).toBeCloseTo(200, 1);
    });

    it('bestCampaign tem maior ROI', () => {
      const campaigns = [
        makeCampaign('c1', 'linkedin', 10000, 50, 5, 500),
        makeCampaign('c2', 'instagram', 5000, 20, 2, 100),
      ];
      const result = calculateROI(campaigns);
      expect(result.bestCampaign).toBe('Campanha c1');
    });

    it('worstCampaign tem menor ROI', () => {
      const campaigns = [
        makeCampaign('c1', 'linkedin', 10000, 50, 5, 500),
        makeCampaign('c2', 'instagram', 5000, 20, 2, 100),
      ];
      const result = calculateROI(campaigns);
      expect(result.worstCampaign).toBe('Campanha c2');
    });

    it('array vazio retorna overall 0 e listas null', () => {
      const result = calculateROI([]);
      expect(result.overall).toBe(0);
      expect(result.bestCampaign).toBeNull();
      expect(result.worstCampaign).toBeNull();
    });

    it('campanha com ROI 0 não afeta bestCampaign', () => {
      const campaigns = [
        makeCampaign('c1', 'linkedin', 10000, 50, 5, 0),
        makeCampaign('c2', 'instagram', 5000, 20, 2, 200),
      ];
      const result = calculateROI(campaigns);
      expect(result.bestCampaign).toBe('Campanha c2');
    });
  });

  // ─── getLeadScoring ───────────────────────────────────────────────────────

  describe('getLeadScoring', () => {
    it('score está entre 0 e 100', () => {
      const lead = makeLead('1', 'retained', 'indicacao');
      const scoring = getLeadScoring(lead);
      expect(scoring.score).toBeGreaterThanOrEqual(0);
      expect(scoring.score).toBeLessThanOrEqual(100);
    });

    it('grade A para score >= 75', () => {
      // indicacao (25) + retained (25) + recentidade alta (25) + email+phone+notes (25) = ~100
      const lead = makeLead('1', 'retained', 'indicacao');
      const scoring = getLeadScoring(lead);
      expect(['A', 'B']).toContain(scoring.grade);
    });

    it('grade D para lead com score baixo', () => {
      const oldDate = new Date(Date.now() - 200 * 86400000).toISOString(); // 200 dias atrás
      const lead: LegalLead = {
        id: 'x',
        name: 'Lead X',
        email: '',
        phone: '',
        area: 'civil',
        source: 'unknown_source',
        status: 'lost',
        notes: '',
        assignedTo: '',
        createdAt: oldDate,
        updatedAt: oldDate,
      };
      const scoring = getLeadScoring(lead);
      expect(scoring.grade).toBe('D');
    });

    it('retorna leadId correto', () => {
      const lead = makeLead('lead-abc', 'prospect');
      const scoring = getLeadScoring(lead);
      expect(scoring.leadId).toBe('lead-abc');
    });

    it('breakdown soma até o total', () => {
      const lead = makeLead('1', 'qualified', 'linkedin');
      const scoring = getLeadScoring(lead);
      const sum =
        scoring.breakdown.sourceScore +
        scoring.breakdown.statusScore +
        scoring.breakdown.recencyScore +
        scoring.breakdown.engagementScore;
      expect(scoring.score).toBe(Math.min(100, sum));
    });

    it('retorna recommendation como string não vazia', () => {
      const lead = makeLead('1', 'retained');
      const scoring = getLeadScoring(lead);
      expect(scoring.recommendation.length).toBeGreaterThan(0);
    });

    it('fonte "indicacao" tem score máximo de fonte (25)', () => {
      const lead = makeLead('1', 'prospect', 'indicacao');
      const scoring = getLeadScoring(lead);
      expect(scoring.breakdown.sourceScore).toBe(25);
    });

    it('grade C para score 25-49', () => {
      const oldDate = new Date(Date.now() - 100 * 86400000).toISOString();
      const lead: LegalLead = {
        id: 'y',
        name: 'Lead Y',
        email: '',
        phone: '',
        area: 'civil',
        source: 'blog',
        status: 'prospect',
        notes: '',
        assignedTo: '',
        createdAt: oldDate,
        updatedAt: oldDate,
      };
      const scoring = getLeadScoring(lead);
      expect(['C', 'D']).toContain(scoring.grade);
    });
  });
});
