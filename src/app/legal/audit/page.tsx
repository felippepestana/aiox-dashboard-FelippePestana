'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Activity, Users, Download, AlertTriangle } from 'lucide-react';
import { AuditLogViewer } from '@/components/legal/AuditLogViewer';
import { PageHeader } from '@/components/legal/shared';

interface SummaryStats {
  totalToday: number;
  uniqueUsers: number;
  exportsToday: number;
  failedActions: number;
}

export default function AuditLogPage() {
  const [stats, setStats] = useState<SummaryStats>({
    totalToday: 0,
    uniqueUsers: 0,
    exportsToday: 0,
    failedActions: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateFrom = today.toISOString();

        const res = await fetch(`/api/legal/audit?dateFrom=${encodeURIComponent(dateFrom)}&pageSize=500`);
        if (!res.ok) return;

        const data = await res.json();
        const entries = data.entries ?? [];

        const uniqueUsers = new Set(entries.map((e: { userId: string }) => e.userId)).size;
        const exportsToday = entries.filter((e: { action: string }) => e.action === 'export').length;

        setStats({
          totalToday: data.total ?? entries.length,
          uniqueUsers,
          exportsToday,
          failedActions: 0, // Populated when failure tracking is wired to the action layer
        });
      } catch {
        // Stats are best-effort
      }
    }

    fetchStats();
  }, []);

  const summaryCards = [
    {
      label: 'Eventos Hoje',
      value: stats.totalToday.toLocaleString('pt-BR'),
      icon: Activity,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Usuários Únicos',
      value: stats.uniqueUsers.toLocaleString('pt-BR'),
      icon: Users,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Exportações Hoje',
      value: stats.exportsToday.toLocaleString('pt-BR'),
      icon: Download,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Ações com Falha',
      value: stats.failedActions.toLocaleString('pt-BR'),
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Page header */}
      <PageHeader
        title="Segurança & LGPD"
        subtitle="Rastreamento completo de ações — conformidade LGPD Art. 37"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Segurança & LGPD', href: '/legal/audit' },
        ]}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] text-[#6b7a8d] uppercase tracking-wider">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Audit log viewer */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-400" />
          Registros de Auditoria
        </h2>
        <AuditLogViewer />
      </div>
    </div>
  );
}
