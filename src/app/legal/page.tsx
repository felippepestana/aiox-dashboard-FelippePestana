'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Scale,
  Briefcase,
  Clock,
  DollarSign,
  FileText,
  Users,
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarClock,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import {
  PageHeader,
  StatCardGrid,
} from '@/components/legal/shared';

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

  const statCards = [
    {
      label: 'Processos Ativos',
      value: activeProcessCount,
      icon: <Briefcase className="h-5 w-5" />,
      color: '#D4AF37',
    },
    {
      label: 'Prazos Pendentes',
      value: pendingDeadlineCount,
      icon: <Clock className="h-5 w-5" />,
      color: '#FBBF24',
    },
    {
      label: 'Honorarios a Receber',
      value: `R$ ${outstandingHonorarios.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <DollarSign className="h-5 w-5" />,
      color: '#34D399',
    },
    {
      label: 'Pecas em Rascunho',
      value: draftPetitions,
      icon: <FileText className="h-5 w-5" />,
      color: '#C0C0C0',
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
    <div className="min-h-screen bg-[#060d1a] p-6 space-y-6">
      <PageHeader
        title="Painel Juridico"
        subtitle="Visao geral da sua pratica juridica · APEX Legal Performance"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-2 rounded-lg bg-[#D4AF37]/10 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-colors border border-[#D4AF37]/20"
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Link>
            ))}
          </div>
        }
      />

      <StatCardGrid cards={statCards} />

      {/* Two Column: Deadlines + Movements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Deadlines */}
        <div className="rounded-xl border border-[#1a2d52]/60 bg-[#0d1f3c] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-[#C0C0C0]" />
              Prazos Proximos (7 dias)
            </h2>
            <Link
              href="/legal/deadlines"
              className="text-xs text-[#A0AEC0] hover:text-white flex items-center gap-1 transition-colors"
            >
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#4A5568]">
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
                    className="flex items-center justify-between rounded-lg border border-[#1a2d52]/60 bg-[#060d1a] px-4 py-3 hover:border-[#C0C0C0]/15 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {deadline.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {process && (
                          <span className="text-xs text-[#4A5568]">{process.cnj}</span>
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
                      <p className="text-xs text-[#4A5568]">
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
        <div className="rounded-xl border border-[#1a2d52]/60 bg-[#0d1f3c] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="h-5 w-5 text-[#C0C0C0]" />
              Movimentacoes Recentes
            </h2>
            <Link
              href="/legal/publications"
              className="text-xs text-[#A0AEC0] hover:text-white flex items-center gap-1 transition-colors"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {unreadMovements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[#4A5568]">
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
                    className="flex items-start gap-3 rounded-lg border border-[#1a2d52]/60 bg-[#060d1a] px-4 py-3 hover:border-[#C0C0C0]/15 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#C0C0C0]/10 mt-0.5 flex-shrink-0">
                      <AlertTriangle className="h-4 w-4 text-[#C0C0C0]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {movement.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {process && (
                          <span className="text-xs text-[#4A5568]">{process.cnj}</span>
                        )}
                        <span className="text-xs text-[#4A5568]">
                          {formatDate(movement.date)}
                        </span>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[#C0C0C0]/10 text-[#A0AEC0]">
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
