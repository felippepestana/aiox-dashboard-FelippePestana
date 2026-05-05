'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Briefcase, Clock, FileText, Plus, MessageSquare } from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';

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

export default function ProcessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const {
    getProcessById, getClientById, getDeadlinesByProcess,
    getPetitionsByProcess, getMovementsByProcess,
  } = useLegalStore();

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
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/legal/processes" className="text-[#6b7a8d] hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{process.title}</h1>
            <p className="text-sm text-amber-400 font-mono mt-1">{process.cnj}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusColors[process.status]}`}>
            {statusLabels[process.status]}
          </span>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-amber-500/10 text-amber-400">
            {areaLabels[process.area] || process.area}
          </span>
        </div>
      </div>

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
                  <span className="text-xs text-[#6b7a8d]">{d.dueDate.split('T')[0]}</span>
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

        {/* Timeline */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-amber-400" /> Movimentações ({movements.length})
            </h2>
          </div>
          {movements.length === 0 ? (
            <p className="text-xs text-[#4a5568]">Nenhuma movimentação registrada</p>
          ) : (
            <div className="space-y-3">
              {movements.slice(0, 10).map((m) => (
                <div key={m.id} className={`flex gap-3 py-2 border-b border-[#1a2332] last:border-0 ${!m.isRead ? 'bg-amber-500/5 -mx-2 px-2 rounded' : ''}`}>
                  <div className="flex-shrink-0 mt-1">
                    <div className={`h-2 w-2 rounded-full ${m.isRead ? 'bg-[#2a3342]' : 'bg-amber-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#c0ccda]">{m.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#4a5568]">{m.date.split('T')[0]}</span>
                      <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] bg-blue-500/10 text-blue-400">{m.source}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
