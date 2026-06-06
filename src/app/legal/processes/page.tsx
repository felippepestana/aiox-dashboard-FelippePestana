'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Briefcase,
  Plus,
  ChevronRight,
  Clock,
  LayoutList,
  Columns3,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import type { LegalArea, ProcessStatus, UrgencyLevel } from '@/types/legal';
import { ExportPDFButton } from '@/components/legal/ExportPDFButton';
import { ProcessKanban } from '@/components/legal/ProcessKanban';
import type { KanbanProcess } from '@/components/legal/ProcessKanban';
import {
  PageHeader,
  FilterBar,
  DataTable,
  EmptyState,
} from '@/components/legal/shared';
import type { FilterValues, ColumnDef } from '@/components/legal/shared';

const AREAS: { value: LegalArea | ''; label: string }[] = [
  { value: '', label: 'Todas as Areas' },
  { value: 'civil', label: 'Civil' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'tributario', label: 'Tributario' },
  { value: 'penal', label: 'Penal' },
  { value: 'administrativo', label: 'Administrativo' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'familia', label: 'Familia' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'previdenciario', label: 'Previdenciario' },
  { value: 'ambiental', label: 'Ambiental' },
  { value: 'digital', label: 'Digital' },
];

const STATUSES: { value: ProcessStatus | ''; label: string }[] = [
  { value: '', label: 'Todos os Status' },
  { value: 'active', label: 'Ativo' },
  { value: 'archived', label: 'Arquivado' },
  { value: 'suspended', label: 'Suspenso' },
  { value: 'closed', label: 'Encerrado' },
  { value: 'won', label: 'Ganho' },
  { value: 'lost', label: 'Perdido' },
  { value: 'settled', label: 'Acordo' },
];

const URGENCIES: { value: UrgencyLevel | ''; label: string }[] = [
  { value: '', label: 'Todas as Urgencias' },
  { value: 'critical', label: 'Critico' },
  { value: 'high', label: 'Alto' },
  { value: 'medium', label: 'Medio' },
  { value: 'low', label: 'Baixo' },
];

const statusBadge: Record<ProcessStatus, string> = {
  active: 'bg-green-500/10 text-green-400',
  archived: 'bg-gray-500/10 text-gray-400',
  suspended: 'bg-yellow-500/10 text-yellow-400',
  closed: 'bg-gray-500/10 text-gray-400',
  won: 'bg-emerald-500/10 text-emerald-400',
  lost: 'bg-red-500/10 text-red-400',
  settled: 'bg-blue-500/10 text-blue-400',
};

const statusLabel: Record<ProcessStatus, string> = {
  active: 'Ativo',
  archived: 'Arquivado',
  suspended: 'Suspenso',
  closed: 'Encerrado',
  won: 'Ganho',
  lost: 'Perdido',
  settled: 'Acordo',
};

const urgencyBadge: Record<UrgencyLevel, string> = {
  critical: 'bg-red-500/10 text-red-400',
  high: 'bg-orange-500/10 text-orange-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  low: 'bg-green-500/10 text-green-400',
};

const urgencyLabel: Record<UrgencyLevel, string> = {
  critical: 'Critico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Baixo',
};

const areaBadge: Record<LegalArea, string> = {
  civil: 'bg-blue-500/10 text-blue-400',
  trabalhista: 'bg-purple-500/10 text-purple-400',
  tributario: 'bg-emerald-500/10 text-emerald-400',
  penal: 'bg-red-500/10 text-red-400',
  administrativo: 'bg-gray-500/10 text-gray-400',
  consumidor: 'bg-teal-500/10 text-teal-400',
  familia: 'bg-pink-500/10 text-pink-400',
  empresarial: 'bg-amber-500/10 text-amber-400',
  previdenciario: 'bg-indigo-500/10 text-indigo-400',
  ambiental: 'bg-lime-500/10 text-lime-400',
  digital: 'bg-cyan-500/10 text-cyan-400',
};

type ProcessRow = {
  id: string;
  cnj: string;
  title: string;
  area: LegalArea;
  status: ProcessStatus;
  urgency: UrgencyLevel;
  nextDeadline: string | null;
  clientName: string;
};

function mapStatusToKanban(status: ProcessStatus): KanbanProcess['status'] {
  switch (status) {
    case 'active': return 'instrucao';
    case 'suspended': return 'instrucao';
    case 'won':
    case 'lost':
    case 'settled':
    case 'closed':
    case 'archived': return 'encerrado';
    default: return 'analise';
  }
}

function mapUrgencyToPriority(urgency: UrgencyLevel): KanbanProcess['priority'] {
  switch (urgency) {
    case 'critical':
    case 'high': return 'alta';
    case 'medium': return 'media';
    case 'low': return 'baixa';
    default: return 'media';
  }
}

export default function ProcessesPage() {
  const { processes, deadlines, getClientById, updateProcess } = useLegalStore();
  const router = useRouter();

  const [activeView, setActiveView] = useState<'list' | 'kanban'>('list');
  const [filterValues, setFilterValues] = useState<FilterValues>({
    search: '',
    area: '',
    status: '',
    urgency: '',
  });

  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      if (filterValues.area && p.area !== filterValues.area) return false;
      if (filterValues.status && p.status !== filterValues.status) return false;
      if (filterValues.urgency && p.urgency !== filterValues.urgency) return false;
      if (filterValues.search) {
        const q = filterValues.search.toLowerCase();
        const client = getClientById(p.clientId);
        const clientName = client?.name?.toLowerCase() || '';
        if (
          !p.cnj.toLowerCase().includes(q) &&
          !p.title.toLowerCase().includes(q) &&
          !clientName.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [processes, filterValues, getClientById]);

  function getNextDeadline(processId: string): string | null {
    const now = new Date();
    const upcoming = deadlines
      .filter((d) => d.processId === processId && d.status === 'pending' && new Date(d.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return upcoming.length > 0 ? upcoming[0].dueDate : null;
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const tableData: ProcessRow[] = useMemo(() => {
    return filteredProcesses.map((p) => {
      const client = getClientById(p.clientId);
      return {
        id: p.id,
        cnj: p.cnj,
        title: p.title,
        area: p.area,
        status: p.status,
        urgency: p.urgency,
        nextDeadline: getNextDeadline(p.id),
        clientName: client?.name || '--',
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProcesses, getClientById]);

  const kanbanProcesses: KanbanProcess[] = useMemo(() => {
    return processes.map((p) => {
      const client = getClientById(p.clientId);
      return {
        id: p.id,
        cnj: p.cnj,
        title: p.title,
        client: client?.name || '--',
        area: p.area,
        status: mapStatusToKanban(p.status),
        nextDeadline: getNextDeadline(p.id) ?? undefined,
        priority: mapUrgencyToPriority(p.urgency),
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processes, getClientById]);

  const columns: ColumnDef<ProcessRow>[] = [
    {
      key: 'cnj',
      label: 'CNJ',
      sortable: true,
      render: (value) => (
        <span className="text-sm font-mono text-amber-400">{String(value)}</span>
      ),
    },
    {
      key: 'title',
      label: 'Título',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-white">{String(value)}</span>
      ),
    },
    {
      key: 'area',
      label: 'Área',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${areaBadge[value as LegalArea]}`}>
          {String(value)}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[value as ProcessStatus]}`}>
          {statusLabel[value as ProcessStatus]}
        </span>
      ),
    },
    {
      key: 'urgency',
      label: 'Urgência',
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${urgencyBadge[value as UrgencyLevel]}`}>
          {urgencyLabel[value as UrgencyLevel]}
        </span>
      ),
    },
    {
      key: 'nextDeadline',
      label: 'Próximo Prazo',
      render: (value) =>
        value ? (
          <span className="text-sm text-[#6b7a8d] flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(String(value))}
          </span>
        ) : (
          <span className="text-sm text-[#4a5568]">--</span>
        ),
    },
    {
      key: 'clientName',
      label: 'Cliente',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-[#6b7a8d]">{String(value)}</span>
      ),
    },
    {
      key: 'id',
      label: '',
      render: (value) => (
        <Link
          href={`/legal/processes/${String(value)}`}
          className="text-amber-400 hover:text-amber-300 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      ),
      cellClassName: 'text-right',
    },
  ];

  const filterConfigs = [
    {
      type: 'search' as const,
      key: 'search',
      placeholder: 'Buscar por CNJ, título ou cliente...',
    },
    {
      type: 'select' as const,
      key: 'area',
      label: 'Todas as Áreas',
      options: AREAS.filter((a) => a.value !== '').map((a) => ({ value: a.value, label: a.label })),
    },
    {
      type: 'select' as const,
      key: 'status',
      label: 'Todos os Status',
      options: STATUSES.filter((s) => s.value !== '').map((s) => ({ value: s.value, label: s.label })),
    },
    {
      type: 'select' as const,
      key: 'urgency',
      label: 'Todas as Urgências',
      options: URGENCIES.filter((u) => u.value !== '').map((u) => ({ value: u.value, label: u.label })),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      <PageHeader
        title="Processos"
        subtitle={`${processes.length} processos cadastrados`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Processos', href: '/legal/processes' },
        ]}
        actions={
          <>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveView('list')}
                title="Visualização em lista"
                className={`p-2 rounded-md transition-colors ${
                  activeView === 'list'
                    ? 'text-[#D4AF37] bg-[rgba(212,175,55,0.12)]'
                    : 'text-[#718096] bg-transparent hover:text-[#A0AEC0]'
                }`}
              >
                <LayoutList className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveView('kanban')}
                title="Visualização Kanban"
                className={`p-2 rounded-md transition-colors ${
                  activeView === 'kanban'
                    ? 'text-[#D4AF37] bg-[rgba(212,175,55,0.12)]'
                    : 'text-[#718096] bg-transparent hover:text-[#A0AEC0]'
                }`}
              >
                <Columns3 className="h-4 w-4" />
              </button>
            </div>
            <ExportPDFButton
              type="processes"
              data={{ processes: filteredProcesses, title: 'Lista de Processos' }}
              label="Exportar PDF"
            />
            <Link
              href="/legal/processes/new"
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Novo Processo
            </Link>
          </>
        }
      />

      {activeView === 'list' && (
        <>
          <FilterBar
            filters={filterConfigs}
            values={filterValues}
            onFilterChange={(key, value) =>
              setFilterValues((prev) => ({ ...prev, [key]: value }))
            }
            onClear={() =>
              setFilterValues({ search: '', area: '', status: '', urgency: '' })
            }
          />

          {filteredProcesses.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="h-8 w-8" />}
              title="Nenhum processo encontrado"
              description="Cadastre o primeiro processo para começar."
              action={{ label: 'Cadastrar Processo', href: '/legal/processes/new' }}
            />
          ) : (
            <DataTable<ProcessRow>
              columns={columns}
              data={tableData}
              paginated
              pageSize={20}
              onRowClick={(row) => router.push(`/legal/processes/${row.id}`)}
              emptyMessage="Nenhum processo encontrado."
            />
          )}
        </>
      )}

      {activeView === 'kanban' && (
        <ProcessKanban
          processes={kanbanProcesses}
          onStatusChange={(processId, newStatus) => {
            const statusMap: Record<KanbanProcess['status'], ProcessStatus> = {
              analise: 'active',
              peticao_inicial: 'active',
              instrucao: 'active',
              sentenca: 'active',
              encerrado: 'closed',
            };
            updateProcess(processId, { status: statusMap[newStatus] });
          }}
        />
      )}
    </div>
  );
}
