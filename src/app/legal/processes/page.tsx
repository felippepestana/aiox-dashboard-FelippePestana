'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Plus,
  Filter,
  ChevronRight,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import type { LegalArea, ProcessStatus, UrgencyLevel } from '@/types/legal';

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

export default function ProcessesPage() {
  const { processes, deadlines, getClientById } = useLegalStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterArea, setFilterArea] = useState<LegalArea | ''>('');
  const [filterStatus, setFilterStatus] = useState<ProcessStatus | ''>('');
  const [filterUrgency, setFilterUrgency] = useState<UrgencyLevel | ''>('');

  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      if (filterArea && p.area !== filterArea) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterUrgency && p.urgency !== filterUrgency) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
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
  }, [processes, filterArea, filterStatus, filterUrgency, searchQuery, getClientById]);

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

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Briefcase className="h-7 w-7 text-amber-400" />
            Processos
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            {processes.length} processos cadastrados
          </p>
        </div>
        <Link
          href="/legal/processes/new"
          className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Processo
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
        <Filter className="h-4 w-4 text-[#6b7a8d]" />

        <select
          value={filterArea}
          onChange={(e) => setFilterArea(e.target.value as LegalArea | '')}
          className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
        >
          {AREAS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as ProcessStatus | '')}
          className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value as UrgencyLevel | '')}
          className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
        >
          {URGENCIES.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6b7a8d]" />
          <input
            type="text"
            placeholder="Buscar por CNJ, titulo ou cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] pl-10 pr-4 py-2 text-sm text-white placeholder-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Process List */}
      {filteredProcesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] py-16">
          <Briefcase className="h-12 w-12 text-[#6b7a8d] mb-3" />
          <p className="text-[#6b7a8d] text-sm">Nenhum processo encontrado</p>
          <Link
            href="/legal/processes/new"
            className="mt-4 flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm"
          >
            <Plus className="h-4 w-4" />
            Cadastrar primeiro processo
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1a2332]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    CNJ
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    Titulo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    Urgencia
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    Proximo Prazo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2332]">
                {filteredProcesses.map((proc) => {
                  const client = getClientById(proc.clientId);
                  const nextDeadline = getNextDeadline(proc.id);
                  return (
                    <tr
                      key={proc.id}
                      className="hover:bg-[#0a0f1a] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-amber-400">
                          {proc.cnj}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-white">{proc.title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            areaBadge[proc.area]
                          }`}
                        >
                          {proc.area}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            statusBadge[proc.status]
                          }`}
                        >
                          {statusLabel[proc.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            urgencyBadge[proc.urgency]
                          }`}
                        >
                          {urgencyLabel[proc.urgency]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {nextDeadline ? (
                          <span className="text-sm text-[#6b7a8d] flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(nextDeadline)}
                          </span>
                        ) : (
                          <span className="text-sm text-[#4a5568]">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[#6b7a8d]">
                          {client?.name || '--'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/legal/processes/${proc.id}`}
                          className="text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
