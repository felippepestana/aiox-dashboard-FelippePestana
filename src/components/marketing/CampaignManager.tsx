'use client';

import { useState } from 'react';
import {
  Plus,
  Search,
  Play,
  Pause,
  CheckCircle2,
  FileEdit,
  Eye,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Facebook,
  MessageCircle,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Users,
  DollarSign,
  MousePointerClick,
  BarChart3,
  Calendar,
  X,
  Megaphone,
  Sparkles,
  Layers,
  SplitSquareHorizontal,
  TrendingUp,
  Clock,
} from 'lucide-react';

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
type WizardStep = 1 | 2 | 3 | 4;

interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  channels: string[];
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  reach: number;
  clicks: number;
  conversions: number;
  leads: number;
  roi: number;
}

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatNum = (value: number) => {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

const statusConfig: Record<CampaignStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft: { label: 'Rascunho', color: 'text-gray-500', bg: 'bg-gray-100', icon: <FileEdit className="w-3.5 h-3.5" /> },
  active: { label: 'Ativa', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <Play className="w-3.5 h-3.5" /> },
  paused: { label: 'Pausada', color: 'text-amber-600', bg: 'bg-amber-50', icon: <Pause className="w-3.5 h-3.5" /> },
  completed: { label: 'Concluida', color: 'text-blue-600', bg: 'bg-blue-50', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
};

const channelIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  Instagram: { icon: <Instagram className="w-3.5 h-3.5" />, color: 'text-pink-500' },
  Facebook: { icon: <Facebook className="w-3.5 h-3.5" />, color: 'text-blue-600' },
  'Google Ads': { icon: <Target className="w-3.5 h-3.5" />, color: 'text-green-600' },
  WhatsApp: { icon: <MessageCircle className="w-3.5 h-3.5" />, color: 'text-emerald-500' },
};

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Clareamento de Verao',
    status: 'active',
    channels: ['Instagram', 'Facebook'],
    budget: 3000,
    spent: 1850,
    startDate: '2025-06-01',
    endDate: '2025-06-30',
    reach: 28500,
    clicks: 1420,
    conversions: 38,
    leads: 52,
    roi: 380,
  },
  {
    id: '2',
    name: 'Implantes - Pagamento Facilitado',
    status: 'active',
    channels: ['Google Ads', 'Instagram'],
    budget: 5000,
    spent: 3200,
    startDate: '2025-06-01',
    endDate: '2025-07-31',
    reach: 42000,
    clicks: 2100,
    conversions: 15,
    leads: 34,
    roi: 520,
  },
  {
    id: '3',
    name: 'Dia dos Namorados - Sorriso Perfeito',
    status: 'completed',
    channels: ['Instagram', 'Facebook', 'WhatsApp'],
    budget: 2000,
    spent: 1950,
    startDate: '2025-05-25',
    endDate: '2025-06-12',
    reach: 35000,
    clicks: 1800,
    conversions: 42,
    leads: 68,
    roi: 450,
  },
  {
    id: '4',
    name: 'Ortodontia Invisivel',
    status: 'paused',
    channels: ['Instagram', 'Google Ads'],
    budget: 4000,
    spent: 800,
    startDate: '2025-06-10',
    endDate: '2025-07-10',
    reach: 8500,
    clicks: 420,
    conversions: 5,
    leads: 12,
    roi: 150,
  },
  {
    id: '5',
    name: 'Campanha Inverno - Check-up',
    status: 'draft',
    channels: ['Instagram', 'Facebook', 'Google Ads', 'WhatsApp'],
    budget: 3500,
    spent: 0,
    startDate: '2025-07-01',
    endDate: '2025-08-31',
    reach: 0,
    clicks: 0,
    conversions: 0,
    leads: 0,
    roi: 0,
  },
];

const campaignTypes = [
  { id: 'awareness', label: 'Reconhecimento de Marca', description: 'Aumentar visibilidade e alcance', icon: Eye },
  { id: 'engagement', label: 'Engajamento', description: 'Interacoes e curtidas', icon: TrendingUp },
  { id: 'leads', label: 'Geracao de Leads', description: 'Captar novos pacientes', icon: Users },
  { id: 'conversion', label: 'Conversao', description: 'Agendar consultas', icon: Target },
  { id: 'retention', label: 'Retencao', description: 'Fidelizar pacientes atuais', icon: Sparkles },
];

const audienceOptions = [
  { id: 'new', label: 'Novos Pacientes', description: 'Pessoas que nunca visitaram a clinica' },
  { id: 'returning', label: 'Pacientes Retorno', description: 'Pacientes que nao vem ha mais de 6 meses' },
  { id: 'active', label: 'Pacientes Ativos', description: 'Pacientes com consulta nos ultimos 3 meses' },
  { id: 'lookalike', label: 'Publico Semelhante', description: 'Similar aos melhores pacientes' },
  { id: 'local', label: 'Publico Local', description: 'Pessoas em um raio de 10km' },
];

type View = 'list' | 'detail' | 'create';

export default function CampaignManager() {
  const [view, setView] = useState<View>('list');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [campaignBudget, setCampaignBudget] = useState('');
  const [campaignStartDate, setCampaignStartDate] = useState('');
  const [campaignEndDate, setCampaignEndDate] = useState('');
  const [campaignContent, setCampaignContent] = useState('');
  const [enableABTest, setEnableABTest] = useState(false);
  const [abVariant, setAbVariant] = useState('');

  const filteredCampaigns = mockCampaigns.filter((c) => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleOpenDetail = (c: Campaign) => {
    setSelectedCampaign(c);
    setView('detail');
  };

  const handleStartCreate = () => {
    setView('create');
    setWizardStep(1);
    setSelectedType('');
    setSelectedAudiences([]);
    setSelectedChannels([]);
    setCampaignName('');
    setCampaignBudget('');
    setCampaignStartDate('');
    setCampaignEndDate('');
    setCampaignContent('');
    setEnableABTest(false);
    setAbVariant('');
  };

  const toggleAudience = (id: string) => {
    setSelectedAudiences((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const toggleChannel = (ch: string) => {
    setSelectedChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  };

  // Detail View
  if (view === 'detail' && selectedCampaign) {
    const c = selectedCampaign;
    const cfg = statusConfig[c.status];
    const budgetPct = (c.spent / c.budget) * 100;
    return (
      <div className="p-6 bg-gray-50 min-h-screen space-y-6">
        <button
          onClick={() => setView('list')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar para campanhas
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{c.name}</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                  {cfg.icon} {cfg.label}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(c.startDate).toLocaleDateString('pt-BR')} - {new Date(c.endDate).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {c.channels.map((ch) => {
                const chCfg = channelIcons[ch];
                return (
                  <span key={ch} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-gray-200 ${chCfg?.color || 'text-gray-500'}`}>
                    {chCfg?.icon} {ch}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-[#0D9488]" />
                <p className="text-xs text-gray-500">Alcance</p>
              </div>
              <p className="text-xl font-bold text-gray-800">{formatNum(c.reach)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MousePointerClick className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-gray-500">Cliques</p>
              </div>
              <p className="text-xl font-bold text-gray-800">{formatNum(c.clicks)}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-[#D4A76A]" />
                <p className="text-xs text-gray-500">Leads</p>
              </div>
              <p className="text-xl font-bold text-gray-800">{c.leads}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-emerald-500" />
                <p className="text-xs text-gray-500">Conversoes</p>
              </div>
              <p className="text-xl font-bold text-gray-800">{c.conversions}</p>
            </div>
          </div>

          {/* Budget and ROI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Orcamento</h4>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-500">Gasto: {formatBRL(c.spent)}</span>
                <span className="text-gray-500">Total: {formatBRL(c.budget)}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${budgetPct > 90 ? 'bg-red-400' : 'bg-[#0D9488]'}`}
                  style={{ width: `${Math.min(budgetPct, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{budgetPct.toFixed(1)}% utilizado</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Retorno sobre Investimento</h4>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-[#0D9488]">{c.roi}%</span>
                <span className="text-sm text-gray-400">ROI</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                CTR: {c.reach > 0 ? ((c.clicks / c.reach) * 100).toFixed(2) : 0}% |
                CVR: {c.clicks > 0 ? ((c.conversions / c.clicks) * 100).toFixed(2) : 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Performance Over Time (simplified) */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h4 className="text-sm font-semibold text-gray-700 mb-4">Desempenho Semanal</h4>
          <div className="flex items-end gap-4 h-32">
            {[
              { week: 'Sem 1', clicks: 320, leads: 8 },
              { week: 'Sem 2', clicks: 480, leads: 14 },
              { week: 'Sem 3', clicks: 380, leads: 18 },
              { week: 'Sem 4', clicks: 240, leads: 12 },
            ].map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex justify-center gap-1 items-end h-24">
                  <div
                    className="flex-1 max-w-[24px] bg-[#0D9488] rounded-t-sm"
                    style={{ height: `${(w.clicks / 480) * 100}%` }}
                    title={`Cliques: ${w.clicks}`}
                  />
                  <div
                    className="flex-1 max-w-[24px] bg-[#D4A76A] rounded-t-sm"
                    style={{ height: `${(w.leads / 18) * 100}%` }}
                    title={`Leads: ${w.leads}`}
                  />
                </div>
                <span className="text-[10px] text-gray-500">{w.week}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#0D9488]" />
              <span className="text-gray-500">Cliques</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#D4A76A]" />
              <span className="text-gray-500">Leads</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create Wizard
  if (view === 'create') {
    const steps = [
      { num: 1, label: 'Tipo' },
      { num: 2, label: 'Publico' },
      { num: 3, label: 'Conteudo' },
      { num: 4, label: 'Orcamento' },
    ];

    return (
      <div className="p-6 bg-gray-50 min-h-screen space-y-6">
        <button
          onClick={() => setView('list')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Criar Nova Campanha</h2>

          {/* Stepper */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      wizardStep >= step.num
                        ? 'bg-[#0D9488] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.num}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1">{step.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-16 sm:w-24 h-0.5 mx-2 ${wizardStep > step.num ? 'bg-[#0D9488]' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            {/* Step 1: Type */}
            {wizardStep === 1 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Tipo de Campanha</h3>
                <div className="space-y-3">
                  {campaignTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${
                          selectedType === type.id
                            ? 'border-[#0D9488] bg-[#0D9488]/5'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          selectedType === type.id ? 'bg-[#0D9488] text-white' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{type.label}</p>
                          <p className="text-xs text-gray-500">{type.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Audience */}
            {wizardStep === 2 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Publico-Alvo</h3>
                <div className="space-y-3 mb-6">
                  {audienceOptions.map((aud) => (
                    <button
                      key={aud.id}
                      onClick={() => toggleAudience(aud.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-lg border transition-colors text-left ${
                        selectedAudiences.includes(aud.id)
                          ? 'border-[#0D9488] bg-[#0D9488]/5'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedAudiences.includes(aud.id) ? 'border-[#0D9488] bg-[#0D9488]' : 'border-gray-300'
                      }`}>
                        {selectedAudiences.includes(aud.id) && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{aud.label}</p>
                        <p className="text-xs text-gray-500">{aud.description}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <h4 className="text-sm font-semibold text-gray-700 mb-3">Canais</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(channelIcons).map(([ch, cfg]) => (
                    <button
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        selectedChannels.includes(ch)
                          ? 'border-[#0D9488] bg-[#0D9488]/5 text-[#0D9488]'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {cfg.icon} {ch}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Content */}
            {wizardStep === 3 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Conteudo da Campanha</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nome da Campanha</label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      placeholder="Ex: Promocao Clareamento Julho"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Texto Principal</label>
                    <textarea
                      value={campaignContent}
                      onChange={(e) => setCampaignContent(e.target.value)}
                      placeholder="Escreva o texto principal da campanha..."
                      rows={4}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none"
                    />
                  </div>

                  {/* A/B Test */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={enableABTest}
                        onChange={(e) => setEnableABTest(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-[#0D9488] focus:ring-[#0D9488]"
                      />
                      <div className="flex items-center gap-2">
                        <SplitSquareHorizontal className="w-4 h-4 text-[#0D9488]" />
                        <span className="text-sm font-medium text-gray-700">Ativar Teste A/B</span>
                      </div>
                    </label>
                    {enableABTest && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Variante B - Texto Alternativo</label>
                        <textarea
                          value={abVariant}
                          onChange={(e) => setAbVariant(e.target.value)}
                          placeholder="Texto alternativo para teste..."
                          rows={3}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Budget */}
            {wizardStep === 4 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Orcamento e Datas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Orcamento Total (R$)</label>
                    <input
                      type="number"
                      value={campaignBudget}
                      onChange={(e) => setCampaignBudget(e.target.value)}
                      placeholder="3000"
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Orcamento Diario (R$)</label>
                    <input
                      type="text"
                      readOnly
                      value={campaignBudget && campaignStartDate && campaignEndDate
                        ? formatBRL(
                            Number(campaignBudget) /
                            Math.max(1, Math.ceil((new Date(campaignEndDate).getTime() - new Date(campaignStartDate).getTime()) / 86400000))
                          )
                        : 'Preencha datas e orcamento'}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Data de Inicio</label>
                    <input
                      type="date"
                      value={campaignStartDate}
                      onChange={(e) => setCampaignStartDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Data de Termino</label>
                    <input
                      type="date"
                      value={campaignEndDate}
                      onChange={(e) => setCampaignEndDate(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                </div>

                {/* Budget Allocation */}
                {selectedChannels.length > 0 && campaignBudget && (
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Distribuicao por Canal</h4>
                    <div className="space-y-3">
                      {selectedChannels.map((ch) => {
                        const perChannel = Number(campaignBudget) / selectedChannels.length;
                        const chCfg = channelIcons[ch];
                        return (
                          <div key={ch} className="flex items-center gap-3">
                            <div className={`flex items-center gap-1.5 w-32 ${chCfg?.color || 'text-gray-500'}`}>
                              {chCfg?.icon} <span className="text-sm">{ch}</span>
                            </div>
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#0D9488] rounded-full" style={{ width: `${100 / selectedChannels.length}%` }} />
                            </div>
                            <span className="text-sm font-medium text-gray-700 w-24 text-right">
                              {formatBRL(perChannel)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  if (wizardStep === 1) setView('list');
                  else setWizardStep((wizardStep - 1) as WizardStep);
                }}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {wizardStep === 1 ? 'Cancelar' : 'Voltar'}
              </button>
              <button
                onClick={() => {
                  if (wizardStep === 4) {
                    setView('list');
                  } else {
                    setWizardStep((wizardStep + 1) as WizardStep);
                  }
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors"
              >
                {wizardStep === 4 ? 'Criar Campanha' : 'Proximo'}
                {wizardStep < 4 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Gestao de Campanhas</h1>
          <p className="text-sm text-gray-500">Sbarzi Odontologia e Saude</p>
        </div>
        <button
          onClick={handleStartCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nova Campanha
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar campanhas..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
          />
        </div>
        <div className="flex bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              statusFilter === 'all' ? 'bg-[#0D9488] text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Todas
          </button>
          {(Object.keys(statusConfig) as CampaignStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-[#0D9488] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredCampaigns.map((c) => {
          const cfg = statusConfig[c.status];
          const budgetPct = c.budget > 0 ? (c.spent / c.budget) * 100 : 0;
          return (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleOpenDetail(c)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {c.channels.map((ch) => {
                      const chCfg = channelIcons[ch];
                      return (
                        <span key={ch} className={chCfg?.color || 'text-gray-400'}>
                          {chCfg?.icon}
                        </span>
                      );
                    })}
                    <span className="text-[10px] text-gray-400 ml-1">
                      {new Date(c.startDate).toLocaleDateString('pt-BR')} - {new Date(c.endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color} ${cfg.bg}`}>
                  {cfg.icon} {cfg.label}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Alcance</p>
                  <p className="text-sm font-bold text-gray-800">{formatNum(c.reach)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Cliques</p>
                  <p className="text-sm font-bold text-gray-800">{formatNum(c.clicks)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Leads</p>
                  <p className="text-sm font-bold text-gray-800">{c.leads}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">ROI</p>
                  <p className="text-sm font-bold text-[#0D9488]">{c.roi}%</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                  <span>Orcamento: {formatBRL(c.spent)} / {formatBRL(c.budget)}</span>
                  <span>{budgetPct.toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${budgetPct > 90 ? 'bg-red-400' : 'bg-[#0D9488]'}`}
                    style={{ width: `${Math.min(budgetPct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">Nenhuma campanha encontrada</p>
        </div>
      )}
    </div>
  );
}
