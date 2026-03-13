'use client';

import { useState } from 'react';
import {
  TrendingUp, Plus, Search, Play, Pause, CheckCircle2, FileText,
  Eye, MousePointer, DollarSign, Users, Instagram, Facebook,
  Globe, MessageCircle, X, ChevronRight, Sparkles,
} from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  type: string;
  channels: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  startDate: string;
  endDate: string;
}

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: '1', name: 'Campanha Implantes 2026', type: 'Conversão', channels: ['instagram', 'facebook', 'google'], status: 'active', budget: 3000, spent: 1800, impressions: 28500, clicks: 1420, conversions: 42, roi: 520, startDate: '2026-03-01', endDate: '2026-03-31' },
  { id: '2', name: 'Clareamento Dental - Verão', type: 'Awareness', channels: ['instagram'], status: 'active', budget: 1500, spent: 1200, impressions: 45000, clicks: 2100, conversions: 28, roi: 380, startDate: '2026-02-15', endDate: '2026-03-15' },
  { id: '3', name: 'Checkup Preventivo', type: 'Engajamento', channels: ['facebook', 'whatsapp'], status: 'completed', budget: 800, spent: 800, impressions: 15000, clicks: 890, conversions: 15, roi: 290, startDate: '2026-02-01', endDate: '2026-02-28' },
  { id: '4', name: 'Ortodontia - Dia dos Namorados', type: 'Conversão', channels: ['instagram', 'facebook'], status: 'draft', budget: 2500, spent: 0, impressions: 0, clicks: 0, conversions: 0, roi: 0, startDate: '2026-06-01', endDate: '2026-06-30' },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-[#6b7a8d]', bg: 'bg-[#1e293b]/50 border-[#2d3748]' },
  active: { label: 'Ativa', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  paused: { label: 'Pausada', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  completed: { label: 'Concluída', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
};

const CHANNEL_ICONS: Record<string, typeof Instagram> = {
  instagram: Instagram,
  facebook: Facebook,
  google: Globe,
  whatsapp: MessageCircle,
};

const CHANNEL_COLORS: Record<string, string> = {
  instagram: 'text-pink-400',
  facebook: 'text-blue-400',
  google: 'text-green-400',
  whatsapp: 'text-emerald-400',
};

export default function CampaignsPage() {
  const [search, setSearch] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);

  const filtered = MOCK_CAMPAIGNS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-pink-700">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            Campanhas
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">Gerenciamento de campanhas de marketing</p>
        </div>
        <button onClick={() => { setShowWizard(true); setWizardStep(0); }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all">
          <Plus className="h-4 w-4" /> Nova Campanha
        </button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#4a5568]" />
        <input type="text" placeholder="Buscar campanha..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl bg-[#111827] border border-[#1e293b] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all" />
      </div>

      <div className="space-y-4">
        {filtered.map((campaign) => {
          const conf = STATUS_MAP[campaign.status];
          const budgetPct = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
          return (
            <div key={campaign.id} className="rounded-2xl bg-[#111827] border border-[#1e293b] p-6 hover:border-teal-500/10 transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-white">{campaign.name}</h3>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${conf.bg} ${conf.color}`}>{conf.label}</span>
                    <span className="text-[10px] text-[#4a5568] bg-[#1e293b] rounded-full px-2 py-0.5">{campaign.type}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    {campaign.channels.map((ch) => {
                      const Icon = CHANNEL_ICONS[ch] || Globe;
                      return <Icon key={ch} className={`h-4 w-4 ${CHANNEL_COLORS[ch] || 'text-[#6b7a8d]'}`} />;
                    })}
                    <span className="text-[10px] text-[#4a5568]">
                      {new Date(campaign.startDate).toLocaleDateString('pt-BR')} - {new Date(campaign.endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {campaign.status === 'active' && (
                    <button className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-amber-400 hover:bg-amber-500/20 transition-all">
                      <Pause className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button className="rounded-lg bg-[#1e293b] border border-[#2d3748] p-2 text-[#8899aa] hover:text-white transition-all">
                    <FileText className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-5 gap-4 mb-4">
                {[
                  { label: 'Impressões', value: campaign.impressions.toLocaleString('pt-BR'), icon: Eye },
                  { label: 'Cliques', value: campaign.clicks.toLocaleString('pt-BR'), icon: MousePointer },
                  { label: 'Conversões', value: campaign.conversions.toString(), icon: Users },
                  { label: 'Gasto', value: `R$ ${campaign.spent.toLocaleString('pt-BR')}`, icon: DollarSign },
                  { label: 'ROI', value: `${campaign.roi}%`, icon: TrendingUp },
                ].map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label} className="rounded-xl bg-[#0d1320] border border-[#1a2332] p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className="h-3 w-3 text-[#4a5568]" />
                        <span className="text-[10px] text-[#4a5568]">{metric.label}</span>
                      </div>
                      <p className="text-sm font-bold text-white">{metric.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Budget Bar */}
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#6b7a8d]">Orçamento utilizado</span>
                  <span className="text-[#8899aa]">
                    R$ {campaign.spent.toLocaleString('pt-BR')} / R$ {campaign.budget.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-[#1a2332]">
                  <div className={`h-full rounded-full transition-all ${budgetPct > 80 ? 'bg-red-400' : 'bg-teal-400'}`}
                    style={{ width: `${Math.min(100, budgetPct)}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Campaign Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-[#111827] border border-[#1e293b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Nova Campanha</h2>
              <button onClick={() => setShowWizard(false)} className="text-[#4a5568] hover:text-white"><X className="h-5 w-5" /></button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-6">
              {['Tipo', 'Público', 'Conteúdo', 'Orçamento'].map((step, i) => (
                <div key={step} className="flex items-center gap-2 flex-1">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                    i <= wizardStep ? 'bg-teal-500 text-white' : 'bg-[#1e293b] text-[#4a5568]'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs ${i <= wizardStep ? 'text-white' : 'text-[#4a5568]'}`}>{step}</span>
                  {i < 3 && <div className={`flex-1 h-px ${i < wizardStep ? 'bg-teal-500' : 'bg-[#1e293b]'}`} />}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <div className="min-h-[200px]">
              {wizardStep === 0 && (
                <div className="space-y-4">
                  <p className="text-sm text-[#8899aa] mb-4">Selecione o tipo da campanha:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {['Conversão', 'Awareness', 'Engajamento'].map((type) => (
                      <button key={type} className="rounded-xl bg-[#0d1320] border border-[#1a2332] p-4 hover:border-teal-500/30 transition-all text-center">
                        <p className="text-sm font-medium text-white">{type}</p>
                      </button>
                    ))}
                  </div>
                  <div className="mt-4">
                    <label className="text-xs font-medium text-[#8899aa] mb-1 block">Nome da Campanha</label>
                    <input type="text" placeholder="Ex: Promoção Clareamento Março" className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all" />
                  </div>
                </div>
              )}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-[#8899aa] mb-4">Defina o público-alvo:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#8899aa] mb-1 block">Faixa Etária</label>
                      <select className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none transition-all">
                        <option>25-34 anos</option><option>35-44 anos</option><option>45-54 anos</option><option>18-65 anos</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#8899aa] mb-1 block">Localização</label>
                      <input type="text" defaultValue="Porto Velho - RO" className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8899aa] mb-2 block">Canais</label>
                    <div className="flex gap-3">
                      {Object.entries(CHANNEL_ICONS).map(([ch, Icon]) => (
                        <button key={ch} className="flex items-center gap-2 rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 hover:border-teal-500/30 transition-all">
                          <Icon className={`h-4 w-4 ${CHANNEL_COLORS[ch]}`} />
                          <span className="text-xs text-white capitalize">{ch}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-[#8899aa] mb-4">Configure o conteúdo:</p>
                  <div>
                    <label className="text-xs font-medium text-[#8899aa] mb-1 block">Texto Principal</label>
                    <textarea rows={3} placeholder="Texto do anúncio..." className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all resize-none" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#8899aa] mb-1 block">Call to Action</label>
                    <select className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none transition-all">
                      <option>Agendar Consulta</option><option>Saiba Mais</option><option>Enviar Mensagem</option><option>Ligar Agora</option>
                    </select>
                  </div>
                </div>
              )}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-[#8899aa] mb-4">Defina o orçamento e período:</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-[#8899aa] mb-1 block">Orçamento Total (R$)</label>
                      <input type="number" placeholder="2000" className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#8899aa] mb-1 block">Orçamento Diário (R$)</label>
                      <input type="number" placeholder="66" className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#8899aa] mb-1 block">Data Início</label>
                      <input type="date" className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[#8899aa] mb-1 block">Data Fim</label>
                      <input type="date" className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none transition-all" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              {wizardStep > 0 && (
                <button onClick={() => setWizardStep(wizardStep - 1)} className="rounded-xl bg-[#1e293b] px-4 py-2.5 text-sm text-[#8899aa] hover:text-white transition-all">
                  Anterior
                </button>
              )}
              <div className="flex-1" />
              {wizardStep < 3 ? (
                <button onClick={() => setWizardStep(wizardStep + 1)} className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 px-6 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all">
                  Próximo <ChevronRight className="inline h-4 w-4" />
                </button>
              ) : (
                <button onClick={() => setShowWizard(false)} className="rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 px-6 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all">
                  Criar Campanha
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
