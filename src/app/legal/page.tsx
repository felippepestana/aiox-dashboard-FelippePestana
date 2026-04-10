'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Scale,
  Briefcase,
  Clock,
  DollarSign,
  FileText,
  Plus,
  Users,
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarClock,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';

export default function LegalDashboardPage() {
  const {
    processes,
    deadlines,
    petitions,
    movements,
    getActiveProcessCount,
    getPendingDeadlineCount,
    getUpcomingDeadlines,
    getUnreadMovements,
    getProcessById,
  } = useLegalStore();

  const { getOutstandingHonorarios } = useLegalFinancialStore();

  const activeProcessCount = getActiveProcessCount();
  const pendingDeadlineCount = getPendingDeadlineCount();
  const outstandingHonorarios = getOutstandingHonorarios();
  const draftPetitions = useMemo(
    () => petitions.filter((p) => p.status === 'draft').length,
    [petitions]
  );

  const upcomingDeadlines = getUpcomingDeadlines(7).slice(0, 5);
  const unreadMovements = getUnreadMovements().slice(0, 5);

  const stats = [
    {
      label: 'Processos Ativos',
      value: activeProcessCount.toString(),
      icon: Briefcase,
    },
    {
      label: 'Prazos Pendentes',
      value: pendingDeadlineCount.toString(),
      icon: Clock,
    },
    {
      label: 'Honorarios a Receber',
      value: `R$ ${outstandingHonorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
    },
    {
      label: 'Pecas em Rascunho',
      value: draftPetitions.toString(),
      icon: FileText,
    },
  ];

  const quickActions = [
    { label: 'Novo Processo', icon: Briefcase, href: '/legal/processes/new' },
    { label: 'Nova Peca', icon: FileText, href: '/legal/petitions/new' },
    { label: 'Novo Cliente', icon: Users, href: '/legal/clients' },
  ];

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  function getDaysUntil(dateStr: string): number {
    const now = new Date();
    const due = new Date(dateStr);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function getDeadlineColor(dateStr: string): string {
    const days = getDaysUntil(dateStr);
    if (days < 0) return 'text-red-400';
    if (days <= 3) return 'text-yellow-400';
    return 'text-green-400';
  }

  const deadlineTypeBadge: Record<string, string> = {
    fatal: 'bg-red-500/10 text-red-400',
    judicial: 'bg-blue-500/10 text-blue-400',
    internal: 'bg-gray-500/10 text-gray-400',
    hearing: 'bg-purple-500/10 text-purple-400',
    mediation: 'bg-emerald-500/10 text-emerald-400',
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Scale className="h-7 w-7 text-amber-400" />
            Painel Juridico
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Visao geral da sua pratica juridica
          </p>
        </div>
        <div className="flex items-center gap-2">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <stat.icon className="h-5 w-5 text-amber-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column: Deadlines + Movements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-amber-400" />
              Prazos Proximos (7 dias)
            </h2>
            <Link
              href="/legal/deadlines"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#6b7a8d]">
              <Clock className="h-8 w-8 mb-2" />
              <p className="text-sm">Nenhum prazo nos proximos 7 dias</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.map((deadline) => {
                const process = getProcessById(deadline.processId);
                const days = getDaysUntil(deadline.dueDate);
                return (
                  <div
                    key={deadline.id}
                    className="flex items-center justify-between rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {deadline.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {process && (
                          <span className="text-xs text-[#6b7a8d]">{process.cnj}</span>
                        )}
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            deadlineTypeBadge[deadline.type] || 'bg-gray-500/10 text-gray-400'
                          }`}
                        >
                          {deadline.type}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className={`text-sm font-medium ${getDeadlineColor(deadline.dueDate)}`}>
                        {formatDate(deadline.dueDate)}
                      </p>
                      <p className="text-xs text-[#6b7a8d]">
                        {days === 0
                          ? 'Hoje'
                          : days === 1
                          ? 'Amanha'
                          : `${days} dias`}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Movements */}
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-400" />
              Movimentacoes Recentes
            </h2>
            <Link
              href="/legal/publications"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {unreadMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#6b7a8d]">
              <Bell className="h-8 w-8 mb-2" />
              <p className="text-sm">Nenhuma movimentacao nao lida</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unreadMovements.map((movement) => {
                const process = getProcessById(movement.processId);
                return (
                  <div
                    key={movement.id}
                    className="flex items-start gap-3 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-3"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 mt-0.5 flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {movement.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {process && (
                          <span className="text-xs text-[#6b7a8d]">{process.cnj}</span>
                        )}
                        <span className="text-xs text-[#6b7a8d]">
                          {formatDate(movement.date)}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400">
                          {movement.source}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
