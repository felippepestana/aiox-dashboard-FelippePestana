'use client';

import { useState, useMemo } from 'react';
import {
  Megaphone,
  Users,
  TrendingUp,
  DollarSign,
  BarChart3,
  CheckCircle,
  AlertTriangle,
  Eye,
  MousePointer,
  Target,
  Plus,
  X,
  Pause,
  Play,
  SquareCheck,
} from 'lucide-react';
import { useLegalMarketingStore } from '@/stores/legal-marketing-store';
import {
  calculateCAC,
  calculateROI,
  calculateConversionRates,
  generateMarketingReport,
} from '@/lib/marketing-engine';
import type { LegalArea, LegalCampaignChannel, LegalCampaignType } from '@/types/legal';

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS = [
  {
    id: 'm1',
    name: 'Direito Digital - LGPD para PMEs',
    channel: 'linkedin' as LegalCampaignChannel,
    type: 'social' as LegalCampaignType,
    area: 'digital' as LegalArea,
    status: 'active' as const,
    budget: 5000,
    startDate: '2026-01-01',
    oabCompliant: true,
    metrics: { impressions: 45200, clicks: 1230, leads: 38, conversions: 7, roi: 340, engagement: 4.2 },
    createdAt: '2026-01-01',
    updatedAt: '2026-05-01',
  },
  {
    id: 'm2',
    name: 'Consultoria Tributaria - Reforma',
    channel: 'google_ads' as LegalCampaignChannel,
    type: 'content' as LegalCampaignType,
    area: 'tributario' as LegalArea,
    status: 'active' as const,
    budget: 8000,
    startDate: '2026-01-15',
    oabCompliant: true,
    metrics: { impressions: 62000, clicks: 2100, leads: 54, conversions: 12, roi: 520, engagement: 3.8 },
    createdAt: '2026-01-15',
    updatedAt: '2026-05-01',
  },
  {
    id: 'm3',
    name: 'Direito Trabalhista - Webinars',
    channel: 'youtube' as LegalCampaignChannel,
    type: 'webinar' as LegalCampaignType,
    area: 'trabalhista' as LegalArea,
    status: 'completed' as const,
    budget: 3000,
    startDate: '2025-11-01',
    oabCompliant: true,
    metrics: { impressions: 18700, clicks: 890, leads: 22, conversions: 5, roi: 280, engagement: 5.1 },
    createdAt: '2025-11-01',
    updatedAt: '2026-03-01',
  },
  {
    id: 'm4',
    name: 'Familia e Sucessoes - Instagram',
    channel: 'instagram' as LegalCampaignChannel,
    type: 'social' as LegalCampaignType,
    area: 'familia' as LegalArea,
    status: 'paused' as const,
    budget: 2500,
    startDate: '2026-02-01',
    oabCompliant: false,
    metrics: { impressions: 32000, clicks: 1500, leads: 18, conversions: 3, roi: 180, engagement: 6.3 },
    createdAt: '2026-02-01',
    updatedAt: '2026-04-15',
  },
  {
    id: 'm5',
    name: 'Newsletter Juridica Mensal',
    channel: 'email' as LegalCampaignChannel,
    type: 'email' as LegalCampaignType,
    area: 'empresarial' as LegalArea,
    status: 'active' as const,
    budget: 500,
    startDate: '2026-01-01',
    oabCompliant: true,
    metrics: { impressions: 4200, clicks: 680, leads: 15, conversions: 4, roi: 890, engagement: 16.2 },
    createdAt: '2026-01-01',
    updatedAt: '2026-05-01',
  },
];

const CHANNEL_LABELS: Record<LegalCampaignChannel, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  blog: 'Blog',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  google_ads: 'Google Ads',
};

const CAMPAIGN_TYPE_LABELS: Record<LegalCampaignType, string> = {
  content: 'Conteudo',
  email: 'E-mail',
  social: 'Redes Sociais',
  webinar: 'Webinar',
  event: 'Evento',
  referral: 'Indicacao',
};

const STATUS_META = {
  active: { label: 'Ativa', color: 'bg-green-500/10 text-green-400', icon: Play },
  paused: { label: 'Pausada', color: 'bg-yellow-500/10 text-yellow-400', icon: Pause },
  completed: { label: 'Concluida', color: 'bg-blue-500/10 text-blue-400', icon: SquareCheck },
  draft: { label: 'Rascunho', color: 'bg-[#1a2332] text-[#6b7a8d]', icon: Eye },
};

const AREAS: { value: LegalArea | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as Areas' },
  { value: 'civil', label: 'Civil' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'tributario', label: 'Tributario' },
  { value: 'penal', label: 'Penal' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'familia', label: 'Familia' },
  { value: 'digital', label: 'Digital' },
  { value: 'ambiental', label: 'Ambiental' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface NewCampaignForm {
  name: string;
  type: LegalCampaignType;
  channel: LegalCampaignChannel;
  area: LegalArea;
  budget: string;
  startDate: string;
  endDate: string;
  targetAudience: string;
  oabCompliant: boolean;
}

const EMPTY_FORM: NewCampaignForm = {
  name: '',
  type: 'social',
  channel: 'linkedin',
  area: 'civil',
  budget: '',
  startDate: '',
  endDate: '',
  targetAudience: '',
  oabCompliant: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const { campaigns, leads, addCampaign, updateCampaign } = useLegalMarketingStore();
  const [areaFilter, setAreaFilter] = useState<LegalArea | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<NewCampaignForm>(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Use store data if available, else fall back to mock
  const storeHasData = campaigns.length > 0;
  const allCampaigns = storeHasData ? campaigns : MOCK_CAMPAIGNS;

  const filteredCampaigns = useMemo(
    () =>
      areaFilter === 'all'
        ? allCampaigns
        : allCampaigns.filter((c) => c.area === areaFilter),
    [allCampaigns, areaFilter]
  );

  // Analytics
  const report = useMemo(
    () => generateMarketingReport(allCampaigns as never, leads),
    [allCampaigns, leads]
  );
  const roiResult = useMemo(() => calculateROI(allCampaigns as never), [allCampaigns]);
  const convRates = useMemo(() => calculateConversionRates(leads), [leads]);
  const cac = useMemo(() => calculateCAC(allCampaigns as never), [allCampaigns]);

  // KPI summary numbers
  const activeCampaigns = allCampaigns.filter((c) => c.status === 'active').length;
  const totalSpend = allCampaigns.reduce((s, c) => s + c.budget, 0);
  const totalLeadsGenerated = allCampaigns.reduce((s, c) => s + c.metrics.leads, 0);
  const overallConvRate = leads.length > 0
    ? convRates.overallConversionRate
    : (allCampaigns.reduce((s, c) => s + c.metrics.conversions, 0) /
        Math.max(totalLeadsGenerated, 1)) * 100;

  function handleCreate() {
    if (!form.name.trim() || !form.budget) return;
    addCampaign({
      name: form.name,
      type: form.type,
      channel: form.channel,
      area: form.area,
      status: 'draft',
      startDate: form.startDate || new Date().toISOString().slice(0, 10),
      endDate: form.endDate || undefined,
      budget: Number(form.budget),
      oabCompliant: form.oabCompliant,
      metrics: { impressions: 0, clicks: 0, leads: 0, conversions: 0, roi: 0, engagement: 0 },
    });
    setForm(EMPTY_FORM);
    setShowCreateModal(false);
  }

  function toggleStatus(id: string, current: string) {
    if (!storeHasData) return;
    const next = current === 'active' ? 'paused' : current === 'paused' ? 'active' : current;
    updateCampaign(id, { status: next as 'active' | 'paused' });
  }

  // Channel comparison data
  const channelData = useMemo(() => {
    const map: Record<string, { leads: number; conversions: number; spend: number }> = {};
    for (const c of allCampaigns) {
      if (!map[c.channel]) map[c.channel] = { leads: 0, conversions: 0, spend: 0 };
      map[c.channel].leads += c.metrics.leads;
      map[c.channel].conversions += c.metrics.conversions;
      map[c.channel].spend += c.budget;
    }
    return Object.entries(map)
      .map(([ch, v]) => ({
        channel: ch as LegalCampaignChannel,
        ...v,
        cpl: v.leads > 0 ? v.spend / v.leads : 0,
      }))
      .sort((a, b) => b.leads - a.leads);
  }, [allCampaigns]);

  const maxLeads = Math.max(...channelData.map((d) => d.leads), 1);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Megaphone className="h-7 w-7 text-amber-400" />
            Marketing Juridico
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Campanhas, leads e performance conforme OAB
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
        >
          <Plus className="h-4 w-4" />
          Nova Campanha
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Campanhas Ativas</p>
          </div>
          <p className="text-2xl font-bold text-white">{activeCampaigns}</p>
          <p className="text-xs text-[#6b7a8d] mt-1">{allCampaigns.length} no total</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Investimento Total</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {totalSpend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-[#6b7a8d] mt-1">
            CAC: {cac.overall.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Leads Gerados</p>
          </div>
          <p className="text-2xl font-bold text-white">{totalLeadsGenerated}</p>
          <p className="text-xs text-[#6b7a8d] mt-1">
            {allCampaigns.reduce((s, c) => s + c.metrics.conversions, 0)} convertidos
          </p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Taxa de Conversao</p>
          </div>
          <p className="text-2xl font-bold text-white">{overallConvRate.toFixed(1)}%</p>
          <p className="text-xs text-[#6b7a8d] mt-1">
            ROI medio: {roiResult.overall.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* OAB Compliance Banner */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-400">Conformidade OAB</p>
          <p className="text-xs text-[#6b7a8d] mt-0.5">
            {filteredCampaigns.filter((c) => c.oabCompliant).length} de{' '}
            {filteredCampaigns.length} campanhas em conformidade com o Codigo de Etica da OAB
          </p>
        </div>
        {filteredCampaigns.some((c) => !c.oabCompliant) && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 border border-red-500/20">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-xs font-medium text-red-400">
              {filteredCampaigns.filter((c) => !c.oabCompliant).length} nao conforme
            </span>
          </div>
        )}
      </div>

      {/* Channel Comparison */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-5">
          <BarChart3 className="h-5 w-5 text-amber-400" />
          Comparativo por Canal
        </h2>
        <div className="space-y-3">
          {channelData.map((ch) => (
            <div key={ch.channel} className="grid grid-cols-12 items-center gap-3">
              <span className="col-span-2 text-xs text-[#6b7a8d] text-right">
                {CHANNEL_LABELS[ch.channel] ?? ch.channel}
              </span>
              <div className="col-span-6 h-5 bg-[#0a0f1a] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500/60 rounded-full transition-all"
                  style={{ width: `${(ch.leads / maxLeads) * 100}%` }}
                />
              </div>
              <span className="col-span-1 text-xs font-semibold text-white text-right">{ch.leads}</span>
              <span className="col-span-1 text-[10px] text-green-400 text-right">{ch.conversions} conv.</span>
              <span className="col-span-2 text-[10px] text-[#6b7a8d] text-right">
                CPL: {ch.cpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </div>
          ))}
        </div>

        {/* Best / Worst */}
        <div className="mt-4 pt-4 border-t border-[#1a2332] grid grid-cols-2 gap-4">
          {roiResult.bestCampaign && (
            <div className="rounded-lg bg-green-500/5 border border-green-500/15 px-3 py-2">
              <p className="text-[10px] text-green-400 uppercase tracking-wider">Melhor ROI</p>
              <p className="text-sm font-medium text-white mt-0.5 truncate">{roiResult.bestCampaign}</p>
            </div>
          )}
          {roiResult.worstCampaign && roiResult.worstCampaign !== roiResult.bestCampaign && (
            <div className="rounded-lg bg-red-500/5 border border-red-500/15 px-3 py-2">
              <p className="text-[10px] text-red-400 uppercase tracking-wider">Menor ROI</p>
              <p className="text-sm font-medium text-white mt-0.5 truncate">{roiResult.worstCampaign}</p>
            </div>
          )}
        </div>
      </div>

      {/* Campaign List */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-400" />
            Campanhas
          </h2>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value as LegalArea | 'all')}
            className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            {AREAS.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          {filteredCampaigns.map((campaign) => {
            const meta = STATUS_META[campaign.status] ?? STATUS_META.draft;
            const isExpanded = expandedId === campaign.id;
            const spend = campaign.budget;
            const cpl = campaign.metrics.leads > 0 ? spend / campaign.metrics.leads : 0;

            return (
              <div
                key={campaign.id}
                className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] hover:border-[#2a3342] transition-colors"
              >
                {/* Main row */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : campaign.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{campaign.name}</h3>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d]">
                          {CHANNEL_LABELS[campaign.channel] ?? campaign.channel}
                        </span>
                        <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d] capitalize">
                          {campaign.area}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      {campaign.oabCompliant ? (
                        <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] text-green-400">
                          <CheckCircle className="h-3 w-3" /> OAB OK
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">
                          <AlertTriangle className="h-3 w-3" /> Revisar
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metrics bar */}
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-3">
                    <Metric icon={Eye} label="Impressoes" value={`${(campaign.metrics.impressions / 1000).toFixed(1)}k`} />
                    <Metric icon={MousePointer} label="Cliques" value={campaign.metrics.clicks.toLocaleString('pt-BR')} />
                    <Metric icon={Users} label="Leads" value={String(campaign.metrics.leads)} />
                    <Metric icon={Target} label="Conversoes" value={String(campaign.metrics.conversions)} />
                    <Metric icon={DollarSign} label="ROI" value={`${campaign.metrics.roi}%`} highlight />
                    <Metric icon={DollarSign} label="Orcamento" value={spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} />
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[#1a2332] pt-3 space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <DetailItem label="Tipo" value={CAMPAIGN_TYPE_LABELS[campaign.type] ?? campaign.type} />
                      <DetailItem label="Inicio" value={campaign.startDate} />
                      <DetailItem label="Fim" value={(campaign as { endDate?: string }).endDate ?? '—'} />
                      <DetailItem label="CPL" value={cpl.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })} />
                      <DetailItem label="Taxa de Clique" value={campaign.metrics.impressions > 0 ? `${((campaign.metrics.clicks / campaign.metrics.impressions) * 100).toFixed(2)}%` : '—'} />
                      <DetailItem label="Engajamento" value={`${campaign.metrics.engagement.toFixed(1)}%`} />
                      <DetailItem
                        label="Conv. de Lead"
                        value={
                          campaign.metrics.leads > 0
                            ? `${((campaign.metrics.conversions / campaign.metrics.leads) * 100).toFixed(1)}%`
                            : '—'
                        }
                      />
                    </div>
                    {storeHasData && (campaign.status === 'active' || campaign.status === 'paused') && (
                      <button
                        onClick={() => toggleStatus(campaign.id, campaign.status)}
                        className="text-xs rounded-lg px-3 py-1.5 border border-[#1a2332] text-[#6b7a8d] hover:text-white hover:border-[#2a3342] transition-colors"
                      >
                        {campaign.status === 'active' ? 'Pausar Campanha' : 'Ativar Campanha'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {filteredCampaigns.length === 0 && (
            <div className="rounded-lg border border-dashed border-[#1a2332] p-8 text-center">
              <p className="text-sm text-[#6b7a8d]">Nenhuma campanha encontrada</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-amber-400" />
                Nova Campanha
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="text-[#6b7a8d] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome da campanha *"
                className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Tipo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value as LegalCampaignType })}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {Object.entries(CAMPAIGN_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Canal</label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value as LegalCampaignChannel })}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {Object.entries(CHANNEL_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Area Juridica</label>
                  <select
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value as LegalArea })}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {AREAS.filter((a) => a.value !== 'all').map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Orcamento (R$) *</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="0,00"
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Data de Inicio</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Data de Fim</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
              <input
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                placeholder="Publico-alvo (ex: PMEs do setor tecnologico)"
                className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
              />
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.oabCompliant}
                  onChange={(e) => setForm({ ...form, oabCompliant: e.target.checked })}
                  className="rounded border-[#1a2332] bg-[#0a0f1a] text-amber-500"
                />
                <span className="text-sm text-[#6b7a8d]">Campanha em conformidade com o Codigo de Etica da OAB</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg bg-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name.trim() || !form.budget}
                className="rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Criar Campanha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Metric({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-[#6b7a8d] flex-shrink-0" />
      <div>
        <p className="text-[10px] text-[#6b7a8d]">{label}</p>
        <p className={`text-sm font-semibold ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</p>
      </div>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white mt-0.5">{value}</p>
    </div>
  );
}
