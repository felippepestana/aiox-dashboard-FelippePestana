'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Clock, FileText, MessageSquare, RefreshCw, Edit3, Check, ChevronDown, Plus, Save, X, Wand2, Globe } from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import type { ProcessStatus, DeadlineType } from '@/types/legal';
import { ExportPDFButton } from '@/components/legal/ExportPDFButton';
import { PageHeader } from '@/components/legal/shared';
import { CaseTimeline } from '@/components/legal/CaseTimeline';
import type { TimelineMovement } from '@/components/legal/CaseTimeline';

const areaLabels: Record<string, string> = {
  civil: 'Cível', trabalhista: 'Trabalhista', tributario: 'Tributário', penal: 'Penal',
  administrativo: 'Administrativo', consumidor: 'Consumidor', familia: 'Família',
  empresarial: 'Empresarial', previdenciario: 'Previdenciário', ambiental: 'Ambiental', digital: 'Digital',
};

const statusLabels: Record<string, string> = {
  active: 'Ativo', archived: 'Arquivado', suspended: 'Suspenso', closed: 'Encerrado',
  won: 'Ganho', lost: 'Perdido', settled: 'Acordo',
};

const statusColors: Record<string, string> = {
  active: 'bg-green-500/10 text-green-400', won: 'bg-emerald-500/10 text-emerald-400',
  lost: 'bg-red-500/10 text-red-400', settled: 'bg-blue-500/10 text-blue-400',
  suspended: 'bg-yellow-500/10 text-yellow-400', archived: 'bg-gray-500/10 text-gray-400',
  closed: 'bg-gray-500/10 text-gray-400',
};

const ALL_STATUSES: ProcessStatus[] = ['active', 'suspended', 'won', 'lost', 'settled', 'archived', 'closed'];

export default function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    getProcessById, getClientById, getDeadlinesByProcess,
    getPetitionsByProcess, getMovementsByProcess, updateProcess,
    hydrateFromApi,
  } = useLegalStore();

  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] =
    useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [showAddDeadline, setShowAddDeadline] = useState(false);
  const [showAddMovement, setShowAddMovement] = useState(false);
  const [dlForm, setDlForm] = useState({ title: '', type: 'judicial' as DeadlineType, dueDate: '' });
  const [mvForm, setMvForm] = useState({ description: '', date: new Date().toISOString().split('T')[0] });

  const { addDeadline, addMovement } = useLegalStore();

  const process = getProcessById(id);
  const client = process ? getClientById(process.clientId) : undefined;
  const deadlines = process ? getDeadlinesByProcess(id) : [];
  const petitions = process ? getPetitionsByProcess(id) : [];
  const movements = process ? getMovementsByProcess(id) : [];

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);

  if (!process) {
    return (
      <div className="p-6">
        <Link href="/legal/processes" className="flex items-center gap-2 text-[#6b7a8d] hover:text-white mb-4">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
          <p className="text-[#6b7a8d]">Processo não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <PageHeader
        title={process.title}
        subtitle={process.cnj}
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Processos', href: '/legal/processes' },
          { label: process.title, href: `/legal/processes/${id}` },
        ]}
        actions={
          <div className="flex items-center gap-2">
          {/* Status dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${statusColors[process.status]}`}
            >
              {statusLabels[process.status]}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showStatusMenu && (
              <div className="absolute right-0 top-full mt-1 z-10 rounded-lg border border-[#1a2332] bg-[#0d1320] p-1 shadow-xl min-w-[140px]">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      updateProcess(id, { status: s });
                      setShowStatusMenu(false);
                    }}
                    className={`w-full flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors ${
                      s === process.status ? 'text-amber-400 bg-amber-500/10' : 'text-[#8899aa] hover:text-white hover:bg-[#1a2332]'
                    }`}
                  >
                    {s === process.status && <Check className="h-3 w-3" />}
                    {statusLabels[s]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-400">
            {areaLabels[process.area] || process.area}
          </span>
          <ExportPDFButton
            type="process"
            data={{
              process,
              clientName: client?.name,
              movements,
              deadlines,
              petitions,
            }}
            label="Exportar PDF"
          />
          {process.cnj && (
            <button
              onClick={async () => {
                // Re-entrancy guard: the disabled prop only lands after the
                // re-render commits, so a fast double-click could POST twice
                if (syncing) return;
                setSyncing(true);
                setSyncFeedback(null);
                try {
                  const res = await fetch('/api/legal/court/datajud/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ processId: process.id, cnj: process.cnj }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok && data.success) {
                    setSyncFeedback({
                      kind: 'success',
                      text: data.synced > 0
                        ? `Sincronizado! ${data.synced} nova(s) movimentação(ões) importada(s).`
                        : 'Processo já está atualizado — nenhuma movimentação nova.',
                    });
                    hydrateFromApi();
                  } else if (res.status === 402) {
                    setSyncFeedback({ kind: 'error', text: 'A integração DataJud requer o plano Professional.' });
                  } else if (res.status === 404) {
                    setSyncFeedback({ kind: 'error', text: 'Processo não encontrado no DataJud.' });
                  } else {
                    setSyncFeedback({ kind: 'error', text: data.error || 'Falha ao sincronizar com o DataJud.' });
                  }
                } catch {
                  setSyncFeedback({ kind: 'error', text: 'Falha de rede ao sincronizar com o DataJud.' });
                }
                setSyncing(false);
              }}
              disabled={syncing}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs text-[#6b7a8d] hover:text-amber-400 border border-[#1a2332] hover:border-amber-500/20 transition-colors"
              title="Sincronizar com DataJud"
            >
              <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </button>
          )}
        </div>
        }
      />

      {syncFeedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${
            syncFeedback.kind === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : 'border-red-500/20 bg-red-500/10 text-red-400'
          }`}
        >
          <span>{syncFeedback.text}</span>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs text-[#6b7a8d] hover:text-white transition-colors"
            aria-label="Fechar aviso de sincronização"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-2">Tribunal</p>
          <p className="text-sm text-white">{process.court || 'N/A'}</p>
          <p className="text-xs text-[#6b7a8d] mt-1">{process.vara} — {process.comarca}/{process.state}</p>
          <p className="text-xs text-[#6b7a8d] mt-1">Juiz: {process.judge || 'N/A'}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-2">Partes</p>
          <p className="text-sm text-white">Cliente: {client?.name || 'N/A'}</p>
          <p className="text-xs text-[#6b7a8d] mt-1">Parte Contrária: {process.opposingParty || 'N/A'}</p>
          <p className="text-xs text-[#6b7a8d] mt-1">Adv. Contrário: {process.opposingLawyer || 'N/A'}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider mb-2">Financeiro</p>
          <p className="text-sm text-white">Valor da Causa: {formatCurrency(process.causeValue)}</p>
          <p className="text-xs text-[#6b7a8d] mt-1">Honorário: {formatCurrency(process.feeAmount)} ({process.feeType})</p>
          <p className="text-xs text-[#6b7a8d] mt-1">Objeto: {process.object || 'N/A'}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setShowAddDeadline(!showAddDeadline)}
          className="flex items-center gap-1.5 rounded-lg border border-[#1a2332] px-3 py-2 text-xs text-[#8899aa] hover:text-amber-400 hover:border-amber-500/20 transition-colors">
          <Plus className="h-3 w-3" /> Adicionar Prazo
        </button>
        <button onClick={() => setShowAddMovement(!showAddMovement)}
          className="flex items-center gap-1.5 rounded-lg border border-[#1a2332] px-3 py-2 text-xs text-[#8899aa] hover:text-amber-400 hover:border-amber-500/20 transition-colors">
          <Plus className="h-3 w-3" /> Registrar Movimentação
        </button>
        <Link href="/legal/generator"
          className="flex items-center gap-1.5 rounded-lg border border-[#1a2332] px-3 py-2 text-xs text-[#8899aa] hover:text-amber-400 hover:border-amber-500/20 transition-colors">
          <Wand2 className="h-3 w-3" /> Gerar Petição
        </Link>
        <Link href="/legal/analyze"
          className="flex items-center gap-1.5 rounded-lg border border-[#1a2332] px-3 py-2 text-xs text-[#8899aa] hover:text-amber-400 hover:border-amber-500/20 transition-colors">
          <FileText className="h-3 w-3" /> Analisar Documento
        </Link>
        {process.cnj && (
          <Link href={`/legal/processes/${id}/court`}
            className="flex items-center gap-1.5 rounded-lg border border-[#1a2332] px-3 py-2 text-xs text-[#8899aa] hover:text-amber-400 hover:border-amber-500/20 transition-colors">
            <Globe className="h-3 w-3" /> Ver Tribunal
          </Link>
        )}
      </div>

      {/* Inline Add Deadline */}
      {showAddDeadline && (
        <div className="rounded-xl border border-amber-500/20 bg-[#0d1320] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Novo Prazo</h3>
            <button onClick={() => setShowAddDeadline(false)} className="text-[#6b7a8d] hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-wrap gap-3">
            <input type="text" placeholder="Título do prazo..." value={dlForm.title}
              onChange={(e) => setDlForm(f => ({ ...f, title: e.target.value }))}
              className="flex-1 min-w-[200px] rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none" />
            <select value={dlForm.type} onChange={(e) => setDlForm(f => ({ ...f, type: e.target.value as DeadlineType }))}
              className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none">
              <option value="fatal">Fatal</option>
              <option value="judicial">Judicial</option>
              <option value="internal">Interno</option>
              <option value="hearing">Audiência</option>
              <option value="mediation">Mediação</option>
            </select>
            <input type="date" value={dlForm.dueDate} onChange={(e) => setDlForm(f => ({ ...f, dueDate: e.target.value }))}
              className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none" />
            <button
              onClick={() => {
                if (!dlForm.title || !dlForm.dueDate) return;
                addDeadline({ processId: id, title: dlForm.title, type: dlForm.type, dueDate: new Date(dlForm.dueDate).toISOString(), reminderDays: [3, 1], status: 'pending', assignedTo: '', notes: '' });
                setDlForm({ title: '', type: 'judicial', dueDate: '' });
                setShowAddDeadline(false);
              }}
              disabled={!dlForm.title || !dlForm.dueDate}
              className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors">
              <Save className="h-3.5 w-3.5" /> Salvar
            </button>
          </div>
        </div>
      )}

      {/* Inline Add Movement */}
      {showAddMovement && (
        <div className="rounded-xl border border-amber-500/20 bg-[#0d1320] p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-white">Registrar Movimentação</h3>
            <button onClick={() => setShowAddMovement(false)} className="text-[#6b7a8d] hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <div className="flex flex-wrap gap-3">
            <input type="text" placeholder="Descrição da movimentação..." value={mvForm.description}
              onChange={(e) => setMvForm(f => ({ ...f, description: e.target.value }))}
              className="flex-1 min-w-[200px] rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none" />
            <input type="date" value={mvForm.date} onChange={(e) => setMvForm(f => ({ ...f, date: e.target.value }))}
              className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none" />
            <button
              onClick={() => {
                if (!mvForm.description) return;
                addMovement({ processId: id, description: mvForm.description, date: mvForm.date, type: '', source: 'manual', isRead: true });
                setMvForm({ description: '', date: new Date().toISOString().split('T')[0] });
                setShowAddMovement(false);
              }}
              disabled={!mvForm.description}
              className="flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors">
              <Save className="h-3.5 w-3.5" /> Salvar
            </button>
          </div>
        </div>
      )}

      {/* Tabs Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Deadlines */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" /> Prazos ({deadlines.length})
            </h2>
            <Link href="/legal/deadlines" className="text-xs text-amber-400 hover:text-amber-300">Ver Todos</Link>
          </div>
          {deadlines.length === 0 ? (
            <p className="text-xs text-[#4a5568]">Nenhum prazo cadastrado</p>
          ) : (
            <div className="space-y-2">
              {deadlines.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center justify-between py-2 border-b border-[#1a2332] last:border-0">
                  <span className="text-sm text-[#c0ccda]">{d.title}</span>
                  <span className={`text-xs ${d.status === 'completed' ? 'text-green-400' : 'text-[#6b7a8d]'}`}>{d.dueDate.split('T')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Petitions */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-400" /> Peças ({petitions.length})
            </h2>
            <Link href="/legal/petitions" className="text-xs text-amber-400 hover:text-amber-300">Ver Todas</Link>
          </div>
          {petitions.length === 0 ? (
            <p className="text-xs text-[#4a5568]">Nenhuma peça cadastrada</p>
          ) : (
            <div className="space-y-2">
              {petitions.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-[#1a2332] last:border-0">
                  <span className="text-sm text-[#c0ccda]">{p.title}</span>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400">{p.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Movimentações */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-amber-400" /> Movimentações
          </h2>
          <hr className="flex-1 border-[#1a2332]" />
        </div>
        {(() => {
          const mockMovements: TimelineMovement[] = [
            { date: '2024-11-15', type: 'peticao' as const, title: 'Petição Inicial Distribuída', description: 'Distribuição automática por dependência à 2ª Vara Cível', tribunal: process.court || 'TJSP', author: 'Dr. João Silva' },
            { date: '2024-11-20', type: 'despacho' as const, title: 'Despacho de Citação', description: 'Cite-se o réu para contestar no prazo legal de 15 dias úteis', tribunal: process.court || 'TJSP' },
            { date: '2024-12-10', type: 'peticao' as const, title: 'Contestação Apresentada', description: 'Réu apresentou contestação com preliminar de incompetência', tribunal: process.court || 'TJSP', author: 'Dr. Maria Oliveira' },
            { date: '2025-01-15', type: 'audiencia' as const, title: 'Audiência de Conciliação', description: 'Audiência de conciliação e mediação designada. Partes presentes, sem acordo.', tribunal: process.court || 'TJSP' },
            { date: '2025-02-20', type: 'decisao' as const, title: 'Decisão Saneadora', description: 'Fixados os pontos controvertidos. Deferida prova testemunhal requerida por ambas as partes.', tribunal: process.court || 'TJSP' },
            { date: '2025-03-10', type: 'publicacao' as const, title: 'Publicação no DJE', description: 'Publicação da decisão saneadora no Diário de Justiça Eletrônico', tribunal: process.court || 'TJSP' },
          ];

          const storeMovements: TimelineMovement[] = movements.map((m) => ({
            date: m.date.split('T')[0],
            type: ((['decisao', 'despacho', 'peticao', 'audiencia', 'publicacao'] as const).includes(m.type as TimelineMovement['type'])
              ? m.type
              : 'despacho') as TimelineMovement['type'],
            title: m.description.slice(0, 60),
            description: m.description,
            tribunal: process.court || 'TJSP',
          }));

          const timelineData = storeMovements.length > 0 ? storeMovements : mockMovements;

          return <CaseTimeline movements={timelineData} />;
        })()}
      </div>
    </div>
  );
}
