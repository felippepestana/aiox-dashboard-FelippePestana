// =============================================================================
// Marketing Analytics Engine - Advocacia Privada Brasileira
// CAC, LTV, Conversion Rates, ROI, Lead Scoring
// =============================================================================

import type {
  LegalCampaign,
  LegalLead,
  LegalClient,
  LegalTransaction,
  LeadStatus,
} from '@/types/legal';

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface CACResult {
  overall: number;               // R$ per acquired client (all campaigns)
  byCampaign: Record<string, number>; // campaign id → CAC
  byChannel: Record<string, number>;  // channel → CAC
}

export interface LTVResult {
  average: number;               // average LTV across all clients
  total: number;                 // sum of LTV for all clients
  byClient: Record<string, number>; // client id → LTV
}

export interface FunnelStep {
  status: LeadStatus;
  label: string;
  count: number;
  conversionFromPrevious: number; // % converted from previous stage
  conversionFromTop: number;      // % converted from total leads
}

export interface ConversionRatesResult {
  totalLeads: number;
  funnel: FunnelStep[];
  overallConversionRate: number; // prospect → retained %
  averageDaysToConvert: number;
}

export interface ROIResult {
  overall: number;               // % weighted avg ROI
  byCampaign: Array<{
    id: string;
    name: string;
    channel: string;
    budget: number;
    spend: number;
    leads: number;
    conversions: number;
    roi: number;
    cpl: number; // cost-per-lead
  }>;
  bestCampaign: string | null;
  worstCampaign: string | null;
}

export interface MarketingReport {
  generatedAt: string;
  cac: CACResult;
  ltv: LTVResult;
  conversionRates: ConversionRatesResult;
  roi: ROIResult;
  totalSpend: number;
  totalLeadsGenerated: number;
  totalConversions: number;
  estimatedRevenue: number;
  topChannels: Array<{ channel: string; leads: number; pct: number }>;
  ltvCacRatio: number; // LTV/CAC — healthy > 3
}

export interface LeadScore {
  leadId: string;
  score: number;          // 0–100
  grade: 'A' | 'B' | 'C' | 'D';
  breakdown: {
    sourceScore: number;    // 0–25
    statusScore: number;    // 0–25
    recencyScore: number;   // 0–25
    engagementScore: number; // 0–25
  };
  recommendation: string;
}

// ─── Source quality weights ────────────────────────────────────────────────

const SOURCE_WEIGHTS: Record<string, number> = {
  indicacao: 25,
  referral: 25,
  linkedin: 20,
  google_ads: 18,
  webinar: 18,
  email: 15,
  instagram: 12,
  youtube: 12,
  blog: 10,
  whatsapp: 10,
};

function sourceScore(source: string): number {
  const key = source.toLowerCase().replace(/\s/g, '_');
  for (const [k, v] of Object.entries(SOURCE_WEIGHTS)) {
    if (key.includes(k)) return v;
  }
  return 8;
}

const STATUS_SCORES: Record<LeadStatus, number> = {
  prospect: 5,
  qualified: 10,
  contacted: 15,
  proposal: 20,
  retained: 25,
  lost: 0,
};

// ─── CAC ──────────────────────────────────────────────────────────────────────

/**
 * Customer Acquisition Cost per campaign and channel.
 * CAC = total spend / total clients acquired (conversions)
 */
export function calculateCAC(campaigns: LegalCampaign[]): CACResult {
  let totalSpend = 0;
  let totalConversions = 0;
  const byCampaign: Record<string, number> = {};
  const channelSpend: Record<string, number> = {};
  const channelConversions: Record<string, number> = {};

  for (const c of campaigns) {
    // Use budget as proxy for spend when actual spend isn't tracked separately
    const spend = c.budget;
    const conversions = c.metrics.conversions;
    totalSpend += spend;
    totalConversions += conversions;

    byCampaign[c.id] = conversions > 0 ? spend / conversions : spend;

    channelSpend[c.channel] = (channelSpend[c.channel] ?? 0) + spend;
    channelConversions[c.channel] = (channelConversions[c.channel] ?? 0) + conversions;
  }

  const byChannel: Record<string, number> = {};
  for (const ch of Object.keys(channelSpend)) {
    byChannel[ch] =
      channelConversions[ch] > 0
        ? channelSpend[ch] / channelConversions[ch]
        : channelSpend[ch];
  }

  return {
    overall: totalConversions > 0 ? totalSpend / totalConversions : totalSpend,
    byCampaign,
    byChannel,
  };
}

// ─── LTV ──────────────────────────────────────────────────────────────────────

/**
 * Lifetime Value per client derived from their transaction history.
 * LTV = sum of all income transactions linked to the client.
 * If no transactions available, falls back to a fixed average estimate (R$15.000).
 */
export function calculateLTV(
  clients: LegalClient[],
  transactions: LegalTransaction[]
): LTVResult {
  const byClient: Record<string, number> = {};

  for (const client of clients) {
    const income = transactions
      .filter((t) => t.clientId === client.id && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    // Minimum fallback: R$5.000 (a client with zero transactions may still have value)
    byClient[client.id] = Math.max(income, 5000);
  }

  const values = Object.values(byClient);
  const total = values.reduce((s, v) => s + v, 0);
  const average = values.length > 0 ? total / values.length : 15000;

  return { average, total, byClient };
}

// ─── Conversion Rates ─────────────────────────────────────────────────────────

const FUNNEL_ORDER: LeadStatus[] = [
  'prospect',
  'qualified',
  'contacted',
  'proposal',
  'retained',
];

const FUNNEL_LABELS: Record<LeadStatus, string> = {
  prospect: 'Novo Lead',
  qualified: 'Qualificado',
  contacted: 'Primeiro Contato',
  proposal: 'Proposta Enviada',
  retained: 'Convertido',
  lost: 'Perdido',
};

/**
 * Funnel conversion rates across all pipeline stages.
 * Treats leads at any stage as having passed through all previous stages
 * for "conversion from previous" calculations.
 */
export function calculateConversionRates(leads: LegalLead[]): ConversionRatesResult {
  const activeLeads = leads.filter((l) => l.status !== 'lost');
  const total = leads.length;

  // Count leads at each stage (including retained as the end)
  const counts: Record<LeadStatus, number> = {
    prospect: 0,
    qualified: 0,
    contacted: 0,
    proposal: 0,
    retained: 0,
    lost: 0,
  };
  for (const l of leads) {
    counts[l.status]++;
  }

  // For funnel: a lead "in" a stage or beyond counts toward that stage's total
  const cumulativeCounts: Record<string, number> = {};
  let running = total;
  for (const status of FUNNEL_ORDER) {
    cumulativeCounts[status] = running;
    if (status !== 'retained') {
      running -= counts[status];
    }
  }

  const funnel: FunnelStep[] = FUNNEL_ORDER.map((status, idx) => {
    const count = cumulativeCounts[status] ?? 0;
    const prevCount =
      idx === 0
        ? total
        : cumulativeCounts[FUNNEL_ORDER[idx - 1]] ?? total;

    return {
      status,
      label: FUNNEL_LABELS[status],
      count,
      conversionFromPrevious: prevCount > 0 ? (count / prevCount) * 100 : 0,
      conversionFromTop: total > 0 ? (count / total) * 100 : 0,
    };
  });

  // Average days to convert: approximate from createdAt → updatedAt for retained leads
  const retainedLeads = leads.filter((l) => l.status === 'retained');
  let avgDays = 0;
  if (retainedLeads.length > 0) {
    const totalDays = retainedLeads.reduce((sum, l) => {
      const created = new Date(l.createdAt).getTime();
      const updated = new Date(l.updatedAt).getTime();
      return sum + Math.max(0, (updated - created) / 86400000);
    }, 0);
    avgDays = totalDays / retainedLeads.length;
  }

  return {
    totalLeads: total,
    funnel,
    overallConversionRate: total > 0 ? (counts.retained / total) * 100 : 0,
    averageDaysToConvert: Math.round(avgDays) || 21,
  };
}

// ─── ROI ──────────────────────────────────────────────────────────────────────

/**
 * ROI per campaign and weighted overall.
 * Also computes Cost-Per-Lead (CPL).
 */
export function calculateROI(campaigns: LegalCampaign[]): ROIResult {
  const byCampaign = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    channel: c.channel,
    budget: c.budget,
    spend: c.budget, // budget = spend proxy
    leads: c.metrics.leads,
    conversions: c.metrics.conversions,
    roi: c.metrics.roi,
    cpl: c.metrics.leads > 0 ? c.budget / c.metrics.leads : c.budget,
  }));

  const active = byCampaign.filter((c) => c.roi > 0);
  const totalWeight = active.reduce((s, c) => s + c.spend, 0);
  const weightedROI =
    totalWeight > 0
      ? active.reduce((s, c) => s + c.roi * (c.spend / totalWeight), 0)
      : 0;

  const sorted = [...active].sort((a, b) => b.roi - a.roi);
  const bestCampaign = sorted[0]?.name ?? null;
  const worstCampaign = sorted[sorted.length - 1]?.name ?? null;

  return {
    overall: weightedROI,
    byCampaign,
    bestCampaign,
    worstCampaign,
  };
}

// ─── Comprehensive Report ──────────────────────────────────────────────────────

export function generateMarketingReport(
  campaigns: LegalCampaign[],
  leads: LegalLead[],
  clients: LegalClient[] = [],
  transactions: LegalTransaction[] = []
): MarketingReport {
  const cac = calculateCAC(campaigns);
  const ltv = calculateLTV(clients, transactions);
  const conversionRates = calculateConversionRates(leads);
  const roi = calculateROI(campaigns);

  const totalSpend = campaigns.reduce((s, c) => s + c.budget, 0);
  const totalLeadsGenerated = campaigns.reduce((s, c) => s + c.metrics.leads, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.metrics.conversions, 0);
  const estimatedRevenue = totalConversions * ltv.average;

  // Top channels by leads
  const channelLeads: Record<string, number> = {};
  for (const c of campaigns) {
    channelLeads[c.channel] = (channelLeads[c.channel] ?? 0) + c.metrics.leads;
  }
  const totalLeadsAllChannels = Object.values(channelLeads).reduce((s, v) => s + v, 0);
  const topChannels = Object.entries(channelLeads)
    .map(([channel, leads]) => ({
      channel,
      leads,
      pct: totalLeadsAllChannels > 0 ? (leads / totalLeadsAllChannels) * 100 : 0,
    }))
    .sort((a, b) => b.leads - a.leads);

  const ltvCacRatio = cac.overall > 0 ? ltv.average / cac.overall : 0;

  return {
    generatedAt: new Date().toISOString(),
    cac,
    ltv,
    conversionRates,
    roi,
    totalSpend,
    totalLeadsGenerated,
    totalConversions,
    estimatedRevenue,
    topChannels,
    ltvCacRatio,
  };
}

// ─── Lead Scoring ──────────────────────────────────────────────────────────────

/**
 * Score a lead 0–100 based on source quality, pipeline stage, recency, and notes engagement.
 */
export function getLeadScoring(lead: LegalLead): LeadScore {
  // Source score (0–25)
  const src = sourceScore(lead.source);

  // Status score (0–25)
  const stat = STATUS_SCORES[lead.status] ?? 0;

  // Recency score (0–25): more recent = higher score, decay over 90 days
  const daysSinceCreation =
    (Date.now() - new Date(lead.createdAt).getTime()) / 86400000;
  const recency = Math.max(0, Math.round(25 * (1 - daysSinceCreation / 90)));

  // Engagement score (0–25): based on notes length, email and phone presence
  let engagement = 0;
  if (lead.email && lead.email.includes('@')) engagement += 8;
  if (lead.phone && lead.phone.length > 8) engagement += 8;
  if (lead.notes && lead.notes.length > 20) engagement += 9;

  const total = Math.min(100, src + stat + recency + engagement);

  const grade: LeadScore['grade'] =
    total >= 75 ? 'A' : total >= 50 ? 'B' : total >= 25 ? 'C' : 'D';

  const recommendation =
    grade === 'A'
      ? 'Prioridade alta — agendar reuniao imediatamente'
      : grade === 'B'
      ? 'Acompanhar — enviar proposta personalizada'
      : grade === 'C'
      ? 'Nutrir — incluir em campanha de e-mail'
      : 'Baixa prioridade — monitorar passivamente';

  return {
    leadId: lead.id,
    score: total,
    grade,
    breakdown: {
      sourceScore: src,
      statusScore: stat,
      recencyScore: recency,
      engagementScore: engagement,
    },
    recommendation,
  };
}
