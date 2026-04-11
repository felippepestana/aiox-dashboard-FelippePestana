'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Plus,
  Phone,
  MapPin,
  Search,
  X,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { useLegalMarketingStore } from '@/stores/legal-marketing-store';
import type { LeadStatus, LegalArea } from '@/types/legal';

const COLUMNS: { status: LeadStatus; label: string; color: string; borderColor: string }[] = [
  { status: 'prospect', label: 'Prospectos', color: 'text-blue-400', borderColor: 'border-t-blue-500' },
  { status: 'qualified', label: 'Qualificados', color: 'text-cyan-400', borderColor: 'border-t-cyan-500' },
  { status: 'contacted', label: 'Contatados', color: 'text-yellow-400', borderColor: 'border-t-yellow-500' },
  { status: 'proposal', label: 'Proposta', color: 'text-amber-400', borderColor: 'border-t-amber-500' },
  { status: 'retained', label: 'Retidos', color: 'text-green-400', borderColor: 'border-t-green-500' },
  { status: 'lost', label: 'Perdidos', color: 'text-red-400', borderColor: 'border-t-red-500' },
];

interface MockLead {
  id: string;
  name: string;
  area: LegalArea;
  source: string;
  phone: string;
  status: LeadStatus;
  email: string;
  notes: string;
}

const MOCK_LEADS: MockLead[] = [
  { id: 'l1', name: 'TechCorp Ltda', area: 'digital', source: 'LinkedIn', phone: '(11) 98765-4321', status: 'prospect', email: 'contato@techcorp.com.br', notes: 'Interesse em adequacao LGPD' },
  { id: 'l2', name: 'Maria Santos', area: 'trabalhista', source: 'Indicacao', phone: '(21) 99876-5432', status: 'prospect', email: 'maria@email.com', notes: 'Rescisao indireta' },
  { id: 'l3', name: 'Distribuidora ABC', area: 'tributario', source: 'Google Ads', phone: '(11) 91234-5678', status: 'qualified', email: 'financeiro@abc.com.br', notes: 'Planejamento tributario' },
  { id: 'l4', name: 'Joao Pereira', area: 'familia', source: 'Instagram', phone: '(31) 98765-1234', status: 'qualified', email: 'joao.p@email.com', notes: 'Divorcio consensual' },
  { id: 'l5', name: 'StartupXYZ', area: 'empresarial', source: 'Webinar', phone: '(11) 97654-3210', status: 'contacted', email: 'ceo@startupxyz.com', notes: 'Constituicao societaria e investimento' },
  { id: 'l6', name: 'Construtora Mega', area: 'civil', source: 'Indicacao', phone: '(21) 98765-9876', status: 'contacted', email: 'juridico@mega.com.br', notes: 'Contrato de empreitada' },
  { id: 'l7', name: 'Farmacia Saude', area: 'consumidor', source: 'Google Ads', phone: '(11) 91234-9876', status: 'proposal', email: 'gerencia@fsaude.com.br', notes: 'Defesa em acao coletiva' },
  { id: 'l8', name: 'Industria Verde', area: 'ambiental', source: 'E-mail', phone: '(41) 98765-6543', status: 'proposal', email: 'diretoria@verde.com.br', notes: 'Licenciamento ambiental' },
  { id: 'l9', name: 'Banco Digital SA', area: 'digital', source: 'LinkedIn', phone: '(11) 93456-7890', status: 'retained', email: 'compliance@bancodigital.com.br', notes: 'Consultoria permanente LGPD e Marco Civil' },
  { id: 'l10', name: 'Supermercado Bom', area: 'trabalhista', source: 'Indicacao', phone: '(19) 98765-2345', status: 'retained', email: 'rh@smbom.com.br', notes: 'Assessoria trabalhista mensal' },
  { id: 'l11', name: 'Auto Pecas RJ', area: 'tributario', source: 'Google Ads', phone: '(21) 91234-6789', status: 'retained', email: 'fiscal@autopecasrj.com.br', notes: 'Recuperacao de creditos' },
  { id: 'l12', name: 'Pedro Almeida', area: 'penal', source: 'Instagram', phone: '(11) 97654-1111', status: 'lost', email: 'pedro@email.com', notes: 'Desistiu do processo' },
  { id: 'l13', name: 'Clinica Bem Estar', area: 'civil', source: 'E-mail', phone: '(11) 98765-8888', status: 'prospect', email: 'adm@bemestar.com.br', notes: 'Responsabilidade civil medica' },
  { id: 'l14', name: 'Logistica Express', area: 'empresarial', source: 'Webinar', phone: '(11) 91234-4444', status: 'contacted', email: 'diretoria@logexpress.com.br', notes: 'Reestruturacao societaria' },
];

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

export default function LeadsPage() {
  const { leads, addLead, updateLeadStatus } = useLegalMarketingStore();
  const [areaFilter, setAreaFilter] = useState<LegalArea | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    area: 'civil' as LegalArea,
    source: '',
    notes: '',
  });

  const storeHasLeads = leads.length > 0;
  const displayLeads: MockLead[] = storeHasLeads
    ? leads.map((l) => ({
        id: l.id,
        name: l.name,
        area: l.area,
        source: l.source,
        phone: l.phone,
        status: l.status,
        email: l.email,
        notes: l.notes,
      }))
    : MOCK_LEADS;

  const filteredLeads = useMemo(() => {
    if (areaFilter === 'all') return displayLeads;
    return displayLeads.filter((l) => l.area === areaFilter);
  }, [displayLeads, areaFilter]);

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
    setNewLead({ name: '', email: '', phone: '', area: 'civil', source: '', notes: '' });
    setShowAddModal(false);
  }

  const getLeadsForColumn = (status: LeadStatus) =>
    filteredLeads.filter((l) => l.status === status);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="h-7 w-7 text-amber-400" />
            Pipeline de Leads
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Gestao de prospectos e conversao de clientes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value as LegalArea | 'all')}
            className="rounded-lg bg-[#0d1320] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            {AREAS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            Adicionar Lead
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {COLUMNS.map((col) => {
          const count = getLeadsForColumn(col.status).length;
          return (
            <div key={col.status} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
              <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">{col.label}</p>
              <p className={`text-2xl font-bold mt-1 ${col.color}`}>{count}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
        {COLUMNS.map((col) => {
          const columnLeads = getLeadsForColumn(col.status);

          return (
            <div key={col.status} className="min-w-[240px]">
              <div
                className={`rounded-t-xl border-t-2 ${col.borderColor} border border-[#1a2332] bg-[#0d1320] px-4 py-3`}
              >
                <div className="flex items-center justify-between">
                  <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                  <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d]">
                    {columnLeads.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mt-2">
                {columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-lg border border-[#1a2332] bg-[#0d1320] p-3 hover:border-[#2a3342] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <GripVertical className="h-4 w-4 text-[#1a2332] group-hover:text-[#6b7a8d] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                        <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d] capitalize inline-block mt-1">
                          {lead.area}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 ml-6">
                      <div className="flex items-center gap-1.5 text-[#6b7a8d]">
                        <MapPin className="h-3 w-3" />
                        <span className="text-[10px]">{lead.source}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#6b7a8d]">
                        <Phone className="h-3 w-3" />
                        <span className="text-[10px]">{lead.phone}</span>
                      </div>
                    </div>

                    {storeHasLeads && col.status !== 'retained' && col.status !== 'lost' && (
                      <div className="mt-2 ml-6">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value as LeadStatus)}
                          className="w-full rounded bg-[#0a0f1a] border border-[#1a2332] px-2 py-1 text-[10px] text-[#6b7a8d] focus:outline-none"
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.status} value={c.status}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}

                {columnLeads.length === 0 && (
                  <div className="rounded-lg border border-dashed border-[#1a2332] bg-[#0a0f1a]/50 p-4 text-center">
                    <p className="text-xs text-[#6b7a8d]">Nenhum lead</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Novo Lead</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#6b7a8d] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                placeholder="Nome"
                className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
              />
              <input
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                placeholder="E-mail"
                className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
              />
              <input
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                placeholder="Telefone"
                className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
              />
              <select
                value={newLead.area}
                onChange={(e) => setNewLead({ ...newLead, area: e.target.value as LegalArea })}
                className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
              >
                {AREAS.filter((a) => a.value !== 'all').map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
              <input
                value={newLead.source}
                onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                placeholder="Fonte (ex: LinkedIn, Indicacao)"
                className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
              />
              <textarea
                value={newLead.notes}
                onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                placeholder="Observacoes"
                rows={2}
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
                className="rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
