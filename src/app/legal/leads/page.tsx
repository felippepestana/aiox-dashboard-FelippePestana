'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Phone,
  Mail,
  MapPin,
  X,
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
  Star,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useLegalMarketingStore } from '@/stores/legal-marketing-store';
import { PageHeader, StatCardGrid } from '@/components/legal/shared';
import { getLeadScoring } from '@/lib/marketing-engine';
import type { LeadStatus, LegalArea, LegalLead } from '@/types/legal';

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_COLUMNS: {
  status: LeadStatus;
  label: string;
  color: string;
  borderColor: string;
  bgColor: string;
}[] = [
  { status: 'prospect', label: 'Novo Lead', color: 'text-blue-400', borderColor: 'border-t-blue-500', bgColor: 'bg-blue-500' },
  { status: 'contacted', label: 'Primeiro Contato', color: 'text-yellow-400', borderColor: 'border-t-yellow-500', bgColor: 'bg-yellow-500' },
  { status: 'qualified', label: 'Reuniao Agendada', color: 'text-cyan-400', borderColor: 'border-t-cyan-500', bgColor: 'bg-cyan-500' },
  { status: 'proposal', label: 'Proposta Enviada', color: 'text-amber-400', borderColor: 'border-t-amber-500', bgColor: 'bg-amber-500' },
  { status: 'retained', label: 'Convertido', color: 'text-green-400', borderColor: 'border-t-green-500', bgColor: 'bg-green-500' },
  { status: 'lost', label: 'Perdido', color: 'text-red-400', borderColor: 'border-t-red-500', bgColor: 'bg-red-500' },
];

const NEXT_STATUS: Partial<Record<LeadStatus, LeadStatus>> = {
  prospect: 'contacted',
  contacted: 'qualified',
  qualified: 'proposal',
  proposal: 'retained',
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
  { value: 'previdenciario', label: 'Previdenciario' },
  { value: 'administrativo', label: 'Administrativo' },
];

const SOURCES = ['Indicacao', 'LinkedIn', 'Google Ads', 'Instagram', 'Webinar', 'E-mail', 'YouTube', 'WhatsApp', 'Outro'];

// Estimated deal values by area
const AREA_VALUE: Partial<Record<LegalArea, number>> = {
  empresarial: 25000,
  tributario: 18000,
  digital: 15000,
  trabalhista: 8000,
  civil: 6000,
  familia: 5000,
  ambiental: 12000,
  consumidor: 3000,
  penal: 10000,
  previdenciario: 4000,
  administrativo: 8000,
};

const MOCK_LEADS: LegalLead[] = [
  { id: 'l1', name: 'TechCorp Ltda', area: 'digital', source: 'LinkedIn', phone: '(11) 98765-4321', status: 'prospect', email: 'contato@techcorp.com.br', notes: 'Interesse em adequacao LGPD para 200 colaboradores', assignedTo: 'Dr. Ana Lima', createdAt: '2026-04-15T10:00:00Z', updatedAt: '2026-05-01T09:00:00Z' },
  { id: 'l2', name: 'Maria Santos', area: 'trabalhista', source: 'Indicacao', phone: '(21) 99876-5432', status: 'prospect', email: 'maria@email.com', notes: 'Rescisao indireta. Salario atrasado por 3 meses.', assignedTo: 'Dr. Carlos Melo', createdAt: '2026-05-10T08:00:00Z', updatedAt: '2026-05-10T08:00:00Z' },
  { id: 'l3', name: 'Distribuidora ABC', area: 'tributario', source: 'Google Ads', phone: '(11) 91234-5678', status: 'contacted', email: 'financeiro@abc.com.br', notes: 'Planejamento tributario para reducao de carga fiscal', assignedTo: 'Dr. Ana Lima', createdAt: '2026-04-01T10:00:00Z', updatedAt: '2026-05-05T11:00:00Z' },
  { id: 'l4', name: 'Joao Pereira', area: 'familia', source: 'Instagram', phone: '(31) 98765-1234', status: 'qualified', email: 'joao.p@email.com', notes: 'Divorcio consensual com 2 filhos menores', assignedTo: 'Dra. Beatriz', createdAt: '2026-03-20T14:00:00Z', updatedAt: '2026-04-28T10:00:00Z' },
  { id: 'l5', name: 'StartupXYZ', area: 'empresarial', source: 'Webinar', phone: '(11) 97654-3210', status: 'qualified', email: 'ceo@startupxyz.com', notes: 'Constituicao societaria e captacao de investimento Serie A', assignedTo: 'Dr. Carlos Melo', createdAt: '2026-03-10T09:00:00Z', updatedAt: '2026-04-25T15:00:00Z' },
  { id: 'l6', name: 'Construtora Mega', area: 'civil', source: 'Indicacao', phone: '(21) 98765-9876', status: 'proposal', email: 'juridico@mega.com.br', notes: 'Contrato de empreitada - obra R$2M em litígio', assignedTo: 'Dr. Ana Lima', createdAt: '2026-02-20T11:00:00Z', updatedAt: '2026-05-08T09:00:00Z' },
  { id: 'l7', name: 'Farmacia Saude', area: 'consumidor', source: 'Google Ads', phone: '(11) 91234-9876', status: 'proposal', email: 'gerencia@fsaude.com.br', notes: 'Defesa em acao coletiva de consumidores', assignedTo: 'Dra. Beatriz', createdAt: '2026-03-01T10:00:00Z', updatedAt: '2026-05-06T14:00:00Z' },
  { id: 'l8', name: 'Banco Digital SA', area: 'digital', source: 'LinkedIn', phone: '(11) 93456-7890', status: 'retained', email: 'compliance@bancodigital.com.br', notes: 'Consultoria permanente LGPD e Marco Civil', assignedTo: 'Dr. Ana Lima', createdAt: '2026-01-10T09:00:00Z', updatedAt: '2026-02-15T16:00:00Z' },
  { id: 'l9', name: 'Supermercado Bom', area: 'trabalhista', source: 'Indicacao', phone: '(19) 98765-2345', status: 'retained', email: 'rh@smbom.com.br', notes: 'Assessoria trabalhista mensal — 150 funcionarios', assignedTo: 'Dr. Carlos Melo', createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-02-10T11:00:00Z' },
  { id: 'l10', name: 'Auto Pecas RJ', area: 'tributario', source: 'Google Ads', phone: '(21) 91234-6789', status: 'retained', email: 'fiscal@autopecasrj.com.br', notes: 'Recuperacao de creditos PIS/COFINS', assignedTo: 'Dr. Ana Lima', createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-03-05T10:00:00Z' },
  { id: 'l11', name: 'Pedro Almeida', area: 'penal', source: 'Instagram', phone: '(11) 97654-1111', status: 'lost', email: 'pedro@email.com', notes: 'Desistiu — optou por defensoria publica', assignedTo: '', createdAt: '2026-04-01T09:00:00Z', updatedAt: '2026-04-20T17:00:00Z' },
  { id: 'l12', name: 'Clinica Bem Estar', area: 'civil', source: 'E-mail', phone: '(11) 98765-8888', status: 'prospect', email: 'adm@bemestar.com.br', notes: 'Responsabilidade civil medica — processo de R$500k', assignedTo: '', createdAt: '2026-05-20T08:00:00Z', updatedAt: '2026-05-20T08:00:00Z' },
  { id: 'l13', name: 'Logistica Express', area: 'empresarial', source: 'Webinar', phone: '(11) 91234-4444', status: 'contacted', email: 'diretoria@logexpress.com.br', notes: 'Reestruturacao societaria — fusao com concorrente', assignedTo: 'Dr. Carlos Melo', createdAt: '2026-04-10T14:00:00Z', updatedAt: '2026-05-02T11:00:00Z' },
  { id: 'l14', name: 'Industria Verde', area: 'ambiental', source: 'E-mail', phone: '(41) 98765-6543', status: 'proposal', email: 'diretoria@verde.com.br', notes: 'Licenciamento ambiental para expansao de fabrica', assignedTo: 'Dr. Ana Lima', createdAt: '2026-03-15T10:00:00Z', updatedAt: '2026-05-07T09:00:00Z' },
];

// ─── Empty form ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  area: 'civil' as LegalArea,
  source: '',
  notes: '',
  estimatedValue: '',
};

// ─── Score badge ────────────────────────────────────────────────────────────────

function ScoreBadge({ score, grade }: { score: number; grade: string }) {
  const color =
    grade === 'A' ? 'bg-green-500/15 text-green-400 border-green-500/25' :
    grade === 'B' ? 'bg-amber-500/15 text-amber-400 border-amber-500/25' :
    grade === 'C' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25' :
    'bg-[#1a2332] text-[#6b7a8d] border-[#1a2332]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${color}`}>
      <Star className="h-2.5 w-2.5" />
      {grade} {score}
    </span>
  );
}

// ─── Days in stage ────────────────────────────────────────────────────────────

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const { leads, addLead, updateLeadStatus } = useLegalMarketingStore();
  const [areaFilter, setAreaFilter] = useState<LegalArea | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [minScore, setMinScore] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LegalLead | null>(null);
  const [newLead, setNewLead] = useState(EMPTY_FORM);
  const [showFilters, setShowFilters] = useState(false);

  const storeHasLeads = leads.length > 0;
  const displayLeads: LegalLead[] = storeHasLeads ? leads : MOCK_LEADS;

  // Score all leads
  const scoredLeads = useMemo(
    () =>
      displayLeads.map((l) => ({
        ...l,
        scoring: getLeadScoring(l),
      })),
    [displayLeads]
  );

  const filteredLeads = useMemo(() => {
    return scoredLeads.filter((l) => {
      if (areaFilter !== 'all' && l.area !== areaFilter) return false;
      if (sourceFilter !== 'all' && !l.source.toLowerCase().includes(sourceFilter.toLowerCase())) return false;
      if (l.scoring.score < minScore) return false;
      return true;
    });
  }, [scoredLeads, areaFilter, sourceFilter, minScore]);

  const getColumnLeads = (status: LeadStatus) => filteredLeads.filter((l) => l.status === status);

  // Pipeline metrics
  const totalLeads = filteredLeads.length;
  const converted = filteredLeads.filter((l) => l.status === 'retained').length;
  const convRate = totalLeads > 0 ? (converted / totalLeads) * 100 : 0;
  const pipelineValue = filteredLeads
    .filter((l) => l.status !== 'lost')
    .reduce((sum, l) => sum + (AREA_VALUE[l.area] ?? 5000), 0);

  const retainedLeads = scoredLeads.filter((l) => l.status === 'retained');
  const avgDays = retainedLeads.length > 0
    ? Math.round(retainedLeads.reduce((s, l) => s + daysAgo(l.createdAt), 0) / retainedLeads.length)
    : 21;

  function handleAddLead() {
    if (!newLead.name.trim()) return;
    addLead({
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      area: newLead.area,
      source: newLead.source,
      status: 'prospect',
      notes: newLead.notes,
      assignedTo: '',
    });
    setNewLead(EMPTY_FORM);
    setShowAddModal(false);
  }

  function advanceLead(id: string, current: LeadStatus) {
    const next = NEXT_STATUS[current];
    if (!next) return;
    if (storeHasLeads) {
      updateLeadStatus(id, next);
    }
  }

  function markLost(id: string) {
    if (storeHasLeads) updateLeadStatus(id, 'lost');
  }

  // Sources for filter (unique)
  const allSources = useMemo(() => {
    const set = new Set(displayLeads.map((l) => l.source));
    return Array.from(set).sort();
  }, [displayLeads]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      <PageHeader
        title="Pipeline de Leads"
        subtitle="Gestao de prospectos e conversao de clientes"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Marketing', href: '/legal/marketing' },
          { label: 'Leads', href: '/legal/leads' },
        ]}
        actions={
          <>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg bg-[#0d1320] border border-[#1a2332] px-3 py-2 text-sm text-[#6b7a8d] hover:text-white hover:border-[#2a3342] transition-colors"
            >
              Filtros
              <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              Novo Lead
            </button>
          </>
        }
      />

      {/* Filters panel */}
      {showFilters && (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Area Juridica</label>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value as LegalArea | 'all')}
              className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              {AREAS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Fonte</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
            >
              <option value="all">Todas as Fontes</option>
              {allSources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">
              Score minimo: {minScore}
            </label>
            <input
              type="range"
              min={0}
              max={80}
              step={10}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* Pipeline metrics */}
      <StatCardGrid
        cards={[
          {
            label: 'Total Leads',
            value: totalLeads,
            icon: <Users className="h-5 w-5" />,
            color: '#D4AF37',
          },
          {
            label: 'Taxa Conversao',
            value: `${convRate.toFixed(1)}%`,
            icon: <TrendingUp className="h-5 w-5" />,
            trend: convRate >= 20 ? 'up' : convRate > 0 ? 'flat' : 'flat',
            color: '#22c55e',
          },
          {
            label: 'Tempo Medio',
            value: `${avgDays}d`,
            icon: <Clock className="h-5 w-5" />,
            color: '#f59e0b',
          },
          {
            label: 'Valor Pipeline',
            value: pipelineValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }),
            icon: <DollarSign className="h-5 w-5" />,
            trend: pipelineValue > 0 ? 'up' : 'flat',
            color: '#8b5cf6',
          },
        ]}
      />

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-2">
          {PIPELINE_COLUMNS.map((col) => {
            const columnLeads = getColumnLeads(col.status);
            const colValue = columnLeads.reduce((s, l) => s + (AREA_VALUE[l.area] ?? 5000), 0);

            return (
              <div key={col.status} className="w-[260px] flex-shrink-0">
                {/* Column header */}
                <div className={`rounded-t-xl border-t-2 ${col.borderColor} border border-[#1a2332] bg-[#0d1320] px-4 py-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                    <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d]">
                      {columnLeads.length}
                    </span>
                  </div>
                  {col.status !== 'lost' && (
                    <p className="text-[10px] text-[#6b7a8d] mt-1">
                      {colValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                    </p>
                  )}
                </div>

                {/* Cards */}
                <div className="space-y-2 mt-2">
                  {columnLeads.map((lead) => {
                    const days = daysAgo(lead.updatedAt);
                    const isStale = days > 7 && col.status !== 'retained' && col.status !== 'lost';
                    const canAdvance = !!NEXT_STATUS[lead.status];

                    return (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className={`rounded-lg border bg-[#0d1320] p-3 cursor-pointer transition-colors ${
                          isStale ? 'border-red-500/20 hover:border-red-500/40' : 'border-[#1a2332] hover:border-[#2a3342]'
                        }`}
                      >
                        {/* Name & score */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium text-white leading-tight flex-1 min-w-0 truncate">
                            {lead.name}
                          </p>
                          <ScoreBadge score={lead.scoring.score} grade={lead.scoring.grade} />
                        </div>

                        {/* Area & source */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d] capitalize">
                            {lead.area}
                          </span>
                          <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d]">
                            {lead.source}
                          </span>
                        </div>

                        {/* Value & days */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-amber-400 font-medium">
                            {(AREA_VALUE[lead.area] ?? 5000).toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                              maximumFractionDigits: 0,
                            })}
                          </span>
                          <span className={`flex items-center gap-1 text-[10px] ${isStale ? 'text-red-400' : 'text-[#6b7a8d]'}`}>
                            <Clock className="h-3 w-3" />
                            {days}d
                          </span>
                        </div>

                        {/* Action buttons */}
                        {(canAdvance || col.status === 'proposal') && (
                          <div className="mt-2 pt-2 border-t border-[#1a2332] flex items-center gap-1.5">
                            {canAdvance && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  advanceLead(lead.id, lead.status);
                                }}
                                className="flex-1 flex items-center justify-center gap-1 rounded bg-amber-500/10 px-2 py-1 text-[10px] text-amber-400 hover:bg-amber-500/20 transition-colors"
                              >
                                Avancar <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                            {col.status !== 'retained' && col.status !== 'lost' && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markLost(lead.id);
                                }}
                                className="flex items-center justify-center rounded bg-red-500/10 px-2 py-1 text-[10px] text-red-400 hover:bg-red-500/20 transition-colors"
                                title="Marcar como perdido"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {columnLeads.length === 0 && (
                    <div className="rounded-lg border border-dashed border-[#1a2332] bg-[#0a0f1a]/50 p-5 text-center">
                      <p className="text-xs text-[#6b7a8d]">Nenhum lead</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-[#1a2332]">
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedLead.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d] capitalize">
                    {selectedLead.area}
                  </span>
                  <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d]">
                    {selectedLead.source}
                  </span>
                  {(() => {
                    const s = getLeadScoring(selectedLead);
                    return <ScoreBadge score={s.score} grade={s.grade} />;
                  })()}
                </div>
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-[#6b7a8d] hover:text-white mt-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`mailto:${selectedLead.email}`}
                  className="flex items-center gap-2 rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 hover:border-[#2a3342] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Mail className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-white truncate">{selectedLead.email || '—'}</span>
                </a>
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex items-center gap-2 rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 hover:border-[#2a3342] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-4 w-4 text-amber-400 flex-shrink-0" />
                  <span className="text-xs text-white">{selectedLead.phone || '—'}</span>
                </a>
              </div>

              {/* Score breakdown */}
              {(() => {
                const s = getLeadScoring(selectedLead);
                return (
                  <div className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] p-3">
                    <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-2">Score Breakdown</p>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: 'Fonte', value: s.breakdown.sourceScore, max: 25 },
                        { label: 'Estagio', value: s.breakdown.statusScore, max: 25 },
                        { label: 'Recencia', value: s.breakdown.recencyScore, max: 25 },
                        { label: 'Engaj.', value: s.breakdown.engagementScore, max: 25 },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <p className="text-[10px] text-[#6b7a8d] mb-1">{item.label}</p>
                          <p className="text-sm font-bold text-white">{item.value}</p>
                          <div className="h-1 bg-[#1a2332] rounded-full mt-1 overflow-hidden">
                            <div
                              className="h-full bg-amber-500/60 rounded-full"
                              style={{ width: `${(item.value / item.max) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-400 mt-2">{s.recommendation}</p>
                  </div>
                );
              })()}

              {/* Notes */}
              <div className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] p-3">
                <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Notas
                </p>
                <p className="text-sm text-white">{selectedLead.notes || 'Sem notas.'}</p>
              </div>

              {/* Meta */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] p-2">
                  <p className="text-[10px] text-[#6b7a8d]">Responsavel</p>
                  <p className="text-xs text-white mt-0.5">{selectedLead.assignedTo || '—'}</p>
                </div>
                <div className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] p-2">
                  <p className="text-[10px] text-[#6b7a8d]">Criado</p>
                  <p className="text-xs text-white mt-0.5">{daysAgo(selectedLead.createdAt)}d atras</p>
                </div>
                <div className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] p-2">
                  <p className="text-[10px] text-[#6b7a8d]">Valor Est.</p>
                  <p className="text-xs text-amber-400 font-semibold mt-0.5">
                    {(AREA_VALUE[selectedLead.area] ?? 5000).toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-5 pb-5 flex gap-2 flex-wrap">
              {NEXT_STATUS[selectedLead.status] && (
                <button
                  onClick={() => {
                    advanceLead(selectedLead.id, selectedLead.status);
                    setSelectedLead(null);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                >
                  Avancar para {PIPELINE_COLUMNS.find((c) => c.status === NEXT_STATUS[selectedLead.status])?.label}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
              {selectedLead.status !== 'retained' && selectedLead.status !== 'lost' && (
                <button
                  onClick={() => {
                    markLost(selectedLead.id);
                    setSelectedLead(null);
                  }}
                  className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                >
                  Marcar como Perdido
                </button>
              )}
              <button
                onClick={() => setSelectedLead(null)}
                className="ml-auto rounded-lg bg-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-400" />
                Novo Lead
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#6b7a8d] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                placeholder="Nome *"
                className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="E-mail"
                  type="email"
                  className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
                />
                <input
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="Telefone"
                  className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Area</label>
                  <select
                    value={newLead.area}
                    onChange={(e) => setNewLead({ ...newLead, area: e.target.value as LegalArea })}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {AREAS.filter((a) => a.value !== 'all').map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Fonte</label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="">Selecionar fonte</option>
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <textarea
                value={newLead.notes}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                placeholder="Observacoes (descricao do caso, interesse...)"
                rows={3}
                className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg bg-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddLead}
                disabled={!newLead.name.trim()}
                className="rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
