'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useLegalMarketingStore } from '@/stores/legal-marketing-store';
import type { LegalArea } from '@/types/legal';

const MOCK_CAMPAIGNS = [
  {
    name: 'Direito Digital - LGPD para PMEs',
    channel: 'linkedin' as const,
    area: 'digital' as const,
    status: 'active' as const,
    budget: 5000,
    oabCompliant: true,
    impressions: 45200,
    clicks: 1230,
    leads: 38,
    conversions: 7,
    roi: 340,
    engagement: 4.2,
  },
  {
    name: 'Consultoria Tributaria - Reforma',
    channel: 'google_ads' as const,
    area: 'tributario' as const,
    status: 'active' as const,
    budget: 8000,
    oabCompliant: true,
    impressions: 62000,
    clicks: 2100,
    leads: 54,
    conversions: 12,
    roi: 520,
    engagement: 3.8,
  },
  {
    name: 'Direito Trabalhista - Webinars',
    channel: 'youtube' as const,
    area: 'trabalhista' as const,
    status: 'completed' as const,
    budget: 3000,
    oabCompliant: true,
    impressions: 18700,
    clicks: 890,
    leads: 22,
    conversions: 5,
    roi: 280,
    engagement: 5.1,
  },
  {
    name: 'Familia e Sucessoes - Instagram',
    channel: 'instagram' as const,
    area: 'familia' as const,
    status: 'active' as const,
    budget: 2500,
    oabCompliant: false,
    impressions: 32000,
    clicks: 1500,
    leads: 18,
    conversions: 3,
    roi: 180,
    engagement: 6.3,
  },
  {
    name: 'Newsletter Juridica Mensal',
    channel: 'email' as const,
    area: 'empresarial' as const,
    status: 'active' as const,
    budget: 500,
    oabCompliant: true,
    impressions: 4200,
    clicks: 680,
    leads: 15,
    conversions: 4,
    roi: 890,
    engagement: 16.2,
  },
];

const LEAD_PIPELINE_SUMMARY: { status: string; label: string; count: number; color: string }[] = [
  { status: 'prospect', label: 'Prospectos', count: 42, color: 'bg-blue-500' },
  { status: 'qualified', label: 'Qualificados', count: 28, color: 'bg-cyan-500' },
  { status: 'contacted', label: 'Contatados', count: 18, color: 'bg-yellow-500' },
  { status: 'proposal', label: 'Proposta', count: 12, color: 'bg-amber-500' },
  { status: 'retained', label: 'Retidos', count: 31, color: 'bg-green-500' },
  { status: 'lost', label: 'Perdidos', count: 9, color: 'bg-red-500' },
];

const CHANNEL_ICONS: Record<string, string> = {
  linkedin: 'LinkedIn',
  google_ads: 'Google Ads',
  youtube: 'YouTube',
  instagram: 'Instagram',
  email: 'E-mail',
  blog: 'Blog',
  whatsapp: 'WhatsApp',
};

export default function MarketingPage() {
  const { campaigns, leads, getLeadConversionRate, getCampaignROI } = useLegalMarketingStore();
  const [areaFilter, setAreaFilter] = useState<LegalArea | 'all'>('all');

  const storeHasData = campaigns.length > 0;
  const displayCampaigns = storeHasData ? campaigns : [];
  const mockCampaigns = storeHasData ? [] : MOCK_CAMPAIGNS;
  const allCampaigns = [...displayCampaigns.map((c) => ({
    name: c.name,
    channel: c.channel,
    area: c.area,
    status: c.status,
    budget: c.budget,
    oabCompliant: c.oabCompliant,
    impressions: c.metrics.impressions,
    clicks: c.metrics.clicks,
    leads: c.metrics.leads,
    conversions: c.metrics.conversions,
    roi: c.metrics.roi,
    engagement: c.metrics.engagement,
  })), ...mockCampaigns];

  const filteredCampaigns =
    areaFilter === 'all'
      ? allCampaigns
      : allCampaigns.filter((c) => c.area === areaFilter);

  const totalLeads = storeHasData ? leads.length : 140;
  const conversionRate = storeHasData ? getLeadConversionRate() : 22.1;
  const activeCampaigns = storeHasData
    ? campaigns.filter((c) => c.status === 'active').length
    : MOCK_CAMPAIGNS.filter((c) => c.status === 'active').length;
  const avgROI = storeHasData ? getCampaignROI() : 442;

  const totalPipeline = LEAD_PIPELINE_SUMMARY.reduce((s, p) => s + p.count, 0);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Megaphone className="h-7 w-7 text-amber-400" />
          Marketing Juridico
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          Campanhas, leads e performance de marketing conforme OAB
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Total Leads</p>
          <p className="text-2xl font-bold text-white mt-1">{totalLeads}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Taxa de Conversao</p>
          <p className="text-2xl font-bold text-white mt-1">{conversionRate.toFixed(1)}%</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Campanhas Ativas</p>
          <p className="text-2xl font-bold text-white mt-1">{activeCampaigns}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">ROI Medio</p>
          <p className="text-2xl font-bold text-white mt-1">{avgROI.toFixed(0)}%</p>
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

      {/* Lead Pipeline Summary */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-amber-400" />
          Pipeline de Leads
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
          {LEAD_PIPELINE_SUMMARY.map((stage) => (
            <div key={stage.status} className="text-center">
              <p className="text-2xl font-bold text-white">{stage.count}</p>
              <p className="text-xs text-[#6b7a8d] mt-1">{stage.label}</p>
            </div>
          ))}
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-[#1a2332]">
          {LEAD_PIPELINE_SUMMARY.map((stage) => (
            <div
              key={stage.status}
              className={`${stage.color} transition-all`}
              style={{ width: `${(stage.count / totalPipeline) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-4 mt-3">
          {LEAD_PIPELINE_SUMMARY.map((stage) => (
            <div key={stage.status} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${stage.color}`} />
              <span className="text-[10px] text-[#6b7a8d]">{stage.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Campaigns */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-amber-400" />
            Campanhas
          </h2>
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value as LegalArea | 'all')}
            className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">Todas as Areas</option>
            <option value="digital">Digital</option>
            <option value="tributario">Tributario</option>
            <option value="trabalhista">Trabalhista</option>
            <option value="familia">Familia</option>
            <option value="empresarial">Empresarial</option>
            <option value="civil">Civil</option>
            <option value="penal">Penal</option>
          </select>
        </div>

        <div className="space-y-3">
          {filteredCampaigns.map((campaign, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-4 hover:border-[#2a3342] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">{campaign.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="rounded-full bg-[#1a2332] px-2.5 py-0.5 text-[10px] text-[#6b7a8d]">
                      {CHANNEL_ICONS[campaign.channel] ?? campaign.channel}
                    </span>
                    <span className="rounded-full bg-[#1a2332] px-2.5 py-0.5 text-[10px] text-[#6b7a8d] capitalize">
                      {campaign.area}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                        campaign.status === 'active'
                          ? 'bg-green-500/10 text-green-400'
                          : campaign.status === 'completed'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-[#1a2332] text-[#6b7a8d]'
                      }`}
                    >
                      {campaign.status === 'active' ? 'Ativa' : campaign.status === 'completed' ? 'Concluida' : campaign.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {campaign.oabCompliant ? (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] text-green-400">
                      <CheckCircle className="h-3 w-3" /> OAB OK
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] text-red-400">
                      <AlertTriangle className="h-3 w-3" /> Revisar OAB
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-[#6b7a8d]" />
                  <div>
                    <p className="text-[10px] text-[#6b7a8d]">Impressoes</p>
                    <p className="text-sm font-semibold text-white">
                      {(campaign.impressions / 1000).toFixed(1)}k
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MousePointer className="h-3.5 w-3.5 text-[#6b7a8d]" />
                  <div>
                    <p className="text-[10px] text-[#6b7a8d]">Cliques</p>
                    <p className="text-sm font-semibold text-white">
                      {campaign.clicks.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-[#6b7a8d]" />
                  <div>
                    <p className="text-[10px] text-[#6b7a8d]">Leads</p>
                    <p className="text-sm font-semibold text-white">{campaign.leads}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-3.5 w-3.5 text-[#6b7a8d]" />
                  <div>
                    <p className="text-[10px] text-[#6b7a8d]">Conversoes</p>
                    <p className="text-sm font-semibold text-white">{campaign.conversions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3.5 w-3.5 text-[#6b7a8d]" />
                  <div>
                    <p className="text-[10px] text-[#6b7a8d]">ROI</p>
                    <p className="text-sm font-semibold text-green-400">{campaign.roi}%</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
