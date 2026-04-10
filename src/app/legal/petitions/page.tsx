'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Filter,
  Calendar,
  Briefcase,
  CheckCircle2,
  Edit3,
  Eye,
  Send,
  XCircle,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
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

const STATUS_FILTERS: { value: PetitionStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'draft', label: 'Rascunho' },
  { value: 'review', label: 'Revisao' },
  { value: 'approved', label: 'Aprovada' },
  { value: 'filed', label: 'Protocolada' },
];

export default function PetitionsPage() {
  const { petitions, getProcessById } = useLegalStore();

  const [filterStatus, setFilterStatus] = useState<PetitionStatus | ''>('');

  const filteredPetitions = useMemo(() => {
    if (!filterStatus) return petitions;
    return petitions.filter((p) => p.status === filterStatus);
  }, [petitions, filterStatus]);

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="h-7 w-7 text-amber-400" />
            Pecas Processuais
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            {petitions.length} pecas cadastradas
          </p>
        </div>
        <Link
          href="/legal/petitions/new"
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Peca
        </Link>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-2 rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
        <Filter className="h-4 w-4 text-[#6b7a8d] mr-1" />
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.value}
            onClick={() => setFilterStatus(sf.value as PetitionStatus | '')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              filterStatus === sf.value
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-[#6b7a8d] border border-[#1a2332] hover:text-white'
            }`}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {/* Petition Cards */}
      {filteredPetitions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] py-16">
          <FileText className="h-12 w-12 text-[#6b7a8d] mb-3" />
          <p className="text-[#6b7a8d] text-sm">Nenhuma peca encontrada</p>
          <Link
            href="/legal/petitions/new"
            className="mt-4 flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm"
          >
            <Plus className="h-4 w-4" />
            Criar nova peca
          </Link>
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
