'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Calendar,
  Briefcase,
  CheckCircle2,
  Edit3,
  Eye,
  Send,
  XCircle,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import { PageHeader, FilterBar, EmptyState } from '@/components/legal/shared';
import type { FilterValues } from '@/components/legal/shared';
import { ExportPDFButton } from '@/components/legal/ExportPDFButton';
import type { PetitionStatus, PetitionType } from '@/types/legal';

const petitionStatusConfig: Record<
  PetitionStatus,
  { className: string; label: string; icon: typeof FileText }
> = {
  draft: { className: 'bg-gray-500/10 text-gray-400', label: 'Rascunho', icon: Edit3 },
  review: { className: 'bg-yellow-500/10 text-yellow-400', label: 'Revisao', icon: Eye },
  approved: { className: 'bg-green-500/10 text-green-400', label: 'Aprovada', icon: CheckCircle2 },
  filed: { className: 'bg-blue-500/10 text-blue-400', label: 'Protocolada', icon: Send },
  rejected: { className: 'bg-red-500/10 text-red-400', label: 'Rejeitada', icon: XCircle },
};

const petitionTypeLabel: Record<PetitionType, string> = {
  inicial: 'Inicial',
  contestacao: 'Contestacao',
  recurso: 'Recurso',
  embargo: 'Embargo',
  agravo: 'Agravo',
  tutela: 'Tutela',
  mandado_seguranca: 'Mandado de Seguranca',
  habeas_corpus: 'Habeas Corpus',
  parecer: 'Parecer',
  contrarrazoes: 'Contrarrazoes',
  recurso_especial: 'Recurso Especial',
  recurso_extraordinario: 'Recurso Extraordinario',
  outro: 'Outro',
};

export default function PetitionsPage() {
  const { petitions, processes, getProcessById, updatePetitionStatus } = useLegalStore();

  const [filterValues, setFilterValues] = useState<FilterValues>({});

  const processMap = useMemo(() => {
    const map: Record<string, string> = {};
    processes.forEach((p) => { map[p.id] = p.cnj; });
    return map;
  }, [processes]);

  const filteredPetitions = useMemo(() => {
    const status = filterValues['status'] as PetitionStatus | '' | undefined;
    if (!status) return petitions;
    return petitions.filter((p) => p.status === status);
  }, [petitions, filterValues]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  const filterConfigs = [
    {
      type: 'select' as const,
      key: 'status',
      label: 'Status',
      options: [
        { value: 'draft', label: 'Rascunho' },
        { value: 'review', label: 'Revisão' },
        { value: 'approved', label: 'Aprovada' },
        { value: 'filed', label: 'Protocolada' },
        { value: 'rejected', label: 'Rejeitada' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      <PageHeader
        title="Peças Processuais"
        subtitle={`${petitions.length} peças cadastradas`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Petições', href: '/legal/petitions' },
        ]}
        actions={
          <>
            <ExportPDFButton
              type="petitions"
              data={{ petitions: filteredPetitions, processMap, title: 'Peças Processuais' }}
              label="Exportar PDF"
            />
            <Link
              href="/legal/petitions/new"
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nova Peça
            </Link>
          </>
        }
      />

      {/* Filter Bar */}
      <FilterBar
        filters={filterConfigs}
        values={filterValues}
        onFilterChange={(key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))}
        onClear={() => setFilterValues({})}
      />

      {/* Petition Cards */}
      {filteredPetitions.length === 0 ? (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320]">
          <EmptyState
            icon={<FileText className="h-8 w-8" />}
            title="Nenhuma peça encontrada"
            description={
              petitions.length === 0
                ? 'Crie sua primeira peça processual para começar.'
                : 'Nenhuma peça corresponde ao filtro selecionado.'
            }
            action={{ label: 'Nova Peça', href: '/legal/petitions/new' }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPetitions.map((petition) => {
            const process = getProcessById(petition.processId);
            const statusConf = petitionStatusConfig[petition.status];
            const StatusIcon = statusConf.icon;

            return (
              <div
                key={petition.id}
                className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-amber-500/30 transition-colors"
              >
                {/* Type badge + status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                    {petitionTypeLabel[petition.type]}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.className}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {statusConf.label}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-sm font-medium text-white mb-2 line-clamp-2">
                  {petition.title}
                </h3>

                {/* Process CNJ */}
                {process && (
                  <div className="flex items-center gap-1.5 text-xs text-[#6b7a8d] mb-3">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span className="font-mono">{process.cnj}</span>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center justify-between pt-3 border-t border-[#1a2332]">
                  <div className="flex items-center gap-1.5 text-xs text-[#6b7a8d]">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Criado: {formatDate(petition.createdAt)}</span>
                  </div>
                  {petition.filedAt && (
                    <div className="flex items-center gap-1.5 text-xs text-green-400">
                      <Send className="h-3.5 w-3.5" />
                      <span>{formatDate(petition.filedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Protocol number */}
                {petition.protocolNumber && (
                  <div className="mt-2 text-xs text-[#6b7a8d]">
                    Protocolo: <span className="text-white font-mono">{petition.protocolNumber}</span>
                  </div>
                )}

                {/* Status Actions */}
                {petition.status !== 'filed' && petition.status !== 'rejected' && (
                  <div className="flex gap-2 mt-3 pt-3 border-t border-[#1a2332]">
                    {petition.status === 'draft' && (
                      <button onClick={() => updatePetitionStatus(petition.id, 'review')}
                        className="flex-1 rounded-lg bg-yellow-500/10 px-2 py-1.5 text-xs text-yellow-400 hover:bg-yellow-500/20 transition-colors">
                        Enviar p/ Revisão
                      </button>
                    )}
                    {petition.status === 'review' && (
                      <button onClick={() => updatePetitionStatus(petition.id, 'approved')}
                        className="flex-1 rounded-lg bg-green-500/10 px-2 py-1.5 text-xs text-green-400 hover:bg-green-500/20 transition-colors">
                        Aprovar
                      </button>
                    )}
                    {petition.status === 'approved' && (
                      <button onClick={() => updatePetitionStatus(petition.id, 'filed')}
                        className="flex-1 rounded-lg bg-blue-500/10 px-2 py-1.5 text-xs text-blue-400 hover:bg-blue-500/20 transition-colors">
                        Protocolar
                      </button>
                    )}
                    {petition.status !== 'approved' && (
                      <button onClick={() => updatePetitionStatus(petition.id, 'rejected')}
                        className="rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-400 hover:bg-red-500/20 transition-colors">
                        Rejeitar
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
