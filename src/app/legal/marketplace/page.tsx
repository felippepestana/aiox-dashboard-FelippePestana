'use client';

import { useState, useMemo } from 'react';
import {
  Store,
  Search,
  CheckCircle2,
  Settings,
  Clock,
  MessageSquare,
  Mail,
  Calendar,
  Briefcase,
  Bell,
  Zap,
  Webhook,
  Building2,
  Scale,
  Globe,
  Plus,
  ChevronDown,
  ExternalLink,
  Send,
} from 'lucide-react';
import { PageHeader } from '@/components/legal/shared';

// ─── Types ──────────────────────────────────────────────────────────────────

type IntegrationStatus = 'installed' | 'configure' | 'coming_soon';
type IntegrationCategory = 'Tribunais' | 'Comunicacao' | 'Produtividade' | 'Automacao';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  details?: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const INTEGRATIONS: Integration[] = [
  // Tribunais
  {
    id: 'datajud',
    name: 'DataJud API',
    description: 'Acesso direto ao banco de dados de processos judiciais do CNJ. Busca de processos, acompanhamento de movimentacoes e exportacao de dados.',
    category: 'Tribunais',
    status: 'installed',
    icon: Scale,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/10',
    details: 'Conectado — 1.247 consultas este mes',
  },
  {
    id: 'pje',
    name: 'PJE Integration',
    description: 'Integracao com o Processo Judicial Eletronico (PJE). Protocolo de peticoes, acompanhamento de audiencias e consulta de intimacoes.',
    category: 'Tribunais',
    status: 'installed',
    icon: Building2,
    iconColor: 'text-blue-400',
    iconBg: 'bg-blue-500/10',
    details: 'Conectado — TJ-SP, TRT-2',
  },
  {
    id: 'esaj',
    name: 'ESAJ Integration',
    description: 'Consulta e acompanhamento de processos no sistema ESAJ do TJSP. Monitoramento automatico de publicacoes no DJE.',
    category: 'Tribunais',
    status: 'installed',
    icon: Globe,
    iconColor: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
    details: 'Conectado — TJSP',
  },
  // Comunicacao
  {
    id: 'whatsapp',
    name: 'WhatsApp Business',
    description: 'Comunicacao com clientes via WhatsApp Business API. Envio de lembretes de prazo, atualizacoes processuais e documentos.',
    category: 'Comunicacao',
    status: 'installed',
    icon: MessageSquare,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/10',
    details: 'Configurado — +55 11 9xxxx-xxxx',
  },
  {
    id: 'resend',
    name: 'Resend Email',
    description: 'Envio de e-mails transacionais e boletins para clientes. Notificacoes de prazo, relatorios e newsletters do escritorio.',
    category: 'Comunicacao',
    status: 'configure',
    icon: Mail,
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
  },
  {
    id: 'slack',
    name: 'Slack Notifications',
    description: 'Notificacoes em tempo real no Slack. Alertas de prazos criticos, novas movimentacoes e aprovacoes pendentes.',
    category: 'Comunicacao',
    status: 'coming_soon',
    icon: Bell,
    iconColor: 'text-[#4a5568]',
    iconBg: 'bg-[#1a2332]',
  },
  // Produtividade
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    description: 'Sincronizacao de prazos, audiencias e reunioes com o Google Calendar. Lembretes automaticos e gestao de agenda dos advogados.',
    category: 'Produtividade',
    status: 'coming_soon',
    icon: Calendar,
    iconColor: 'text-[#4a5568]',
    iconBg: 'bg-[#1a2332]',
  },
  {
    id: 'ms365',
    name: 'Microsoft 365',
    description: 'Integracao com Word, Outlook e Teams. Edicao colaborativa de peticoes, agendamento pelo Outlook e videoconferencias.',
    category: 'Produtividade',
    status: 'coming_soon',
    icon: Briefcase,
    iconColor: 'text-[#4a5568]',
    iconBg: 'bg-[#1a2332]',
  },
  // Automacao
  {
    id: 'zapier',
    name: 'Zapier / Make',
    description: 'Conecte o APEX Legal a mais de 5.000 aplicativos via Zapier ou Make (Integromat). Automatize fluxos sem programacao.',
    category: 'Automacao',
    status: 'coming_soon',
    icon: Zap,
    iconColor: 'text-[#4a5568]',
    iconBg: 'bg-[#1a2332]',
  },
  {
    id: 'webhooks',
    name: 'Custom Webhooks',
    description: 'Envie eventos do APEX Legal para qualquer sistema via webhooks HTTP. Ideal para integracoes customizadas e sistemas internos.',
    category: 'Automacao',
    status: 'coming_soon',
    icon: Webhook,
    iconColor: 'text-[#4a5568]',
    iconBg: 'bg-[#1a2332]',
  },
];

const CATEGORIES: IntegrationCategory[] = ['Tribunais', 'Comunicacao', 'Produtividade', 'Automacao'];

const statusConfig: Record<IntegrationStatus, { label: string; badge: string; btn: string; btnText: string }> = {
  installed: {
    label: 'Instalado',
    badge: 'bg-green-500/10 text-green-400 border-green-500/20',
    btn: 'border-[#1a2332] text-[#6b7a8d] hover:text-white hover:border-[#2a3342]',
    btnText: 'Configurar',
  },
  configure: {
    label: 'Configurar',
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    btn: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
    btnText: 'Conectar',
  },
  coming_soon: {
    label: 'Em Breve',
    badge: 'bg-[#1a2332] text-[#4a5568] border-[#2a3342]',
    btn: 'border-[#1a2332] text-[#4a5568] cursor-not-allowed opacity-50',
    btnText: 'Indisponivel',
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<IntegrationCategory | 'Todas'>('Todas');
  const [statusFilter, setStatusFilter] = useState<IntegrationStatus | 'Todos'>('Todos');
  const [showRequest, setShowRequest] = useState(false);
  const [requestText, setRequestText] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return INTEGRATIONS.filter((item) => {
      if (categoryFilter !== 'Todas' && item.category !== categoryFilter) return false;
      if (statusFilter !== 'Todos' && item.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !item.name.toLowerCase().includes(q) &&
          !item.description.toLowerCase().includes(q) &&
          !item.category.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [categoryFilter, statusFilter, searchQuery]);

  // Group by category for display
  const grouped = useMemo(() => {
    const groups: Partial<Record<IntegrationCategory, Integration[]>> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category]!.push(item);
    }
    return groups;
  }, [filtered]);

  const installedCount = INTEGRATIONS.filter((i) => i.status === 'installed').length;
  const configureCount = INTEGRATIONS.filter((i) => i.status === 'configure').length;

  function handleRequestSend() {
    if (!requestText.trim()) return;
    setRequestSent(true);
    setRequestText('');
    setTimeout(() => {
      setShowRequest(false);
      setRequestSent(false);
    }, 3000);
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title="Legal Tech Marketplace"
        subtitle="Integracoes e ferramentas para potencializar seu escritorio"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Marketplace', href: '/legal/marketplace' },
        ]}
        actions={
          <button
            onClick={() => setShowRequest(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            Solicitar Integracao
          </button>
        }
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Integracoes', value: INTEGRATIONS.length, color: 'text-white' },
          { label: 'Instaladas', value: installedCount, color: 'text-green-400' },
          { label: 'Para Configurar', value: configureCount, color: 'text-amber-400' },
          { label: 'Em Breve', value: INTEGRATIONS.length - installedCount - configureCount, color: 'text-[#6b7a8d]' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-[#6b7a8d] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Request Integration Modal */}
      {showRequest && (
        <div className="rounded-xl border border-amber-500/20 bg-[#0d1320] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Send className="h-5 w-5 text-amber-400" />
              Solicitar Nova Integracao
            </h2>
            <button
              onClick={() => { setShowRequest(false); setRequestSent(false); }}
              className="text-[#6b7a8d] hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </div>
          {requestSent ? (
            <div className="flex items-center gap-3 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-400">Solicitacao enviada! Nossa equipe entrara em contato em breve.</p>
            </div>
          ) : (
            <>
              <textarea
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                placeholder="Descreva a integracao que voce precisa — sistema, caso de uso, urgencia..."
                rows={4}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50 resize-none"
              />
              <div className="flex justify-end gap-3 mt-3">
                <button
                  onClick={() => setShowRequest(false)}
                  className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleRequestSend}
                  disabled={!requestText.trim()}
                  className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Enviar Solicitacao
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
            <input
              type="text"
              placeholder="Buscar integracoes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#1a2332] bg-[#0d1320] pl-10 pr-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
              showFilters
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border-[#1a2332] bg-[#0d1320] text-[#6b7a8d] hover:text-white'
            }`}
          >
            Filtros
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-[#1a2332] bg-[#0d1320] p-4">
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] uppercase tracking-wider mb-1.5">Categoria</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as IntegrationCategory | 'Todas')}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="Todas">Todas</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] uppercase tracking-wider mb-1.5">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as IntegrationStatus | 'Todos')}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                <option value="Todos">Todos</option>
                <option value="installed">Instalados</option>
                <option value="configure">Para Configurar</option>
                <option value="coming_soon">Em Breve</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 flex-wrap">
        {(['Todas', ...CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat as IntegrationCategory | 'Todas')}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              categoryFilter === cat
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'border border-[#1a2332] text-[#6b7a8d] hover:text-white hover:border-[#2a3342]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Integration Cards grouped by category */}
      {Object.keys(grouped).length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] py-16">
          <Store className="h-12 w-12 text-[#6b7a8d] mb-3" />
          <p className="text-[#6b7a8d] text-sm">Nenhuma integracao encontrada</p>
          <button
            onClick={() => { setSearchQuery(''); setCategoryFilter('Todas'); setStatusFilter('Todos'); }}
            className="mt-3 text-sm text-amber-400 hover:text-amber-300 transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {(CATEGORIES as IntegrationCategory[])
            .filter((cat) => grouped[cat])
            .map((category) => (
              <div key={category}>
                <h2 className="text-sm font-semibold text-[#8899aa] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="h-px flex-1 bg-[#1a2332]" />
                  {category}
                  <span className="text-[#4a5568] font-normal normal-case">
                    ({grouped[category]!.length})
                  </span>
                  <span className="h-px flex-1 bg-[#1a2332]" />
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {grouped[category]!.map((integration) => {
                    const conf = statusConfig[integration.status];
                    const Icon = integration.icon;
                    const isComingSoon = integration.status === 'coming_soon';
                    return (
                      <div
                        key={integration.id}
                        className={`rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 flex flex-col transition-all ${
                          isComingSoon ? 'opacity-60' : 'hover:border-[#2a3342]'
                        }`}
                      >
                        {/* Card Top */}
                        <div className="flex items-start gap-4 mb-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${integration.iconBg} flex-shrink-0`}>
                            <Icon className={`h-6 w-6 ${integration.iconColor}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-sm font-semibold text-white">{integration.name}</h3>
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${conf.badge}`}>
                                {integration.status === 'installed' && <CheckCircle2 className="h-2.5 w-2.5" />}
                                {integration.status === 'coming_soon' && <Clock className="h-2.5 w-2.5" />}
                                {conf.label}
                              </span>
                            </div>
                            <p className="text-[10px] text-[#4a5568] mt-0.5 uppercase tracking-wider">{integration.category}</p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-[#8899aa] flex-1 mb-4 line-clamp-3">
                          {integration.description}
                        </p>

                        {/* Details badge (if installed) */}
                        {integration.details && (
                          <p className="text-[10px] text-green-400 mb-3 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {integration.details}
                          </p>
                        )}

                        {/* Action Button */}
                        <button
                          disabled={isComingSoon}
                          className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${conf.btn}`}
                        >
                          {isComingSoon ? (
                            <>
                              <Clock className="h-3.5 w-3.5" />
                              {conf.btnText}
                            </>
                          ) : (
                            <>
                              <Settings className="h-3.5 w-3.5" />
                              {conf.btnText}
                              <ExternalLink className="h-3 w-3 ml-auto opacity-60" />
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* CTA Footer */}
      <div className="rounded-xl border border-[#1a2332] bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">Nao encontrou o que precisava?</h3>
          <p className="text-sm text-[#6b7a8d] mt-0.5">
            Nossa equipe pode desenvolver integracoes customizadas para o seu escritorio.
          </p>
        </div>
        <button
          onClick={() => setShowRequest(true)}
          className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
        >
          <Send className="h-4 w-4" />
          Solicitar Integracao Customizada
        </button>
      </div>
    </div>
  );
}
