'use client';

import { useState, useMemo } from 'react';
import {
  Receipt,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  User,
  Briefcase,
  Calendar,
} from 'lucide-react';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import { useLegalStore } from '@/stores/legal-store';
import type { HonorarioStatus, HonorarioType } from '@/types/legal';

type TabValue = 'active' | 'completed' | 'defaulted';

const honorarioTypeConfig: Record<HonorarioType, { className: string; label: string }> = {
  contractual: { className: 'bg-blue-500/10 text-blue-400', label: 'Contratual' },
  sucumbencial: { className: 'bg-emerald-500/10 text-emerald-400', label: 'Sucumbencial' },
  ad_exitum: { className: 'bg-purple-500/10 text-purple-400', label: 'Ad Exitum' },
  pro_bono: { className: 'bg-gray-500/10 text-gray-400', label: 'Pro Bono' },
};

const honorarioStatusConfig: Record<
  HonorarioStatus,
  { className: string; label: string; icon: typeof Receipt }
> = {
  active: { className: 'bg-green-500/10 text-green-400', label: 'Ativo', icon: CheckCircle2 },
  completed: { className: 'bg-blue-500/10 text-blue-400', label: 'Quitado', icon: CheckCircle2 },
  defaulted: { className: 'bg-red-500/10 text-red-400', label: 'Inadimplente', icon: AlertTriangle },
  cancelled: { className: 'bg-gray-500/10 text-gray-400', label: 'Cancelado', icon: XCircle },
};

export default function HonorariosPage() {
  const { honorarios, recordInstallmentPayment } = useLegalFinancialStore();
  const { getClientById, getProcessById } = useLegalStore();

  const [activeTab, setActiveTab] = useState<TabValue>('active');

  const filteredHonorarios = useMemo(() => {
    return honorarios.filter((h) => h.status === activeTab);
  }, [honorarios, activeTab]);

  const tabs: { value: TabValue; label: string; count: number }[] = [
    {
      value: 'active',
      label: 'Ativos',
      count: honorarios.filter((h) => h.status === 'active').length,
    },
    {
      value: 'completed',
      label: 'Quitados',
      count: honorarios.filter((h) => h.status === 'completed').length,
    },
    {
      value: 'defaulted',
      label: 'Inadimplentes',
      count: honorarios.filter((h) => h.status === 'defaulted').length,
    },
  ];

  function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
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
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Receipt className="h-7 w-7 text-amber-400" />
          Honorarios
        </h1>
        <p className="text-sm text-[#6b7a8d] mt-1">
          {honorarios.length} contratos de honorarios
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 rounded-xl border border-[#1a2332] bg-[#0d1320] p-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-[#6b7a8d] border border-transparent hover:text-white'
            }`}
          >
            {tab.label}
            <span
              className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs ${
                activeTab === tab.value
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-[#1a2332] text-[#6b7a8d]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Honorario List */}
      {filteredHonorarios.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] py-16">
          <Receipt className="h-12 w-12 text-[#6b7a8d] mb-3" />
          <p className="text-[#6b7a8d] text-sm">
            Nenhum honorario {activeTab === 'active' ? 'ativo' : activeTab === 'completed' ? 'quitado' : 'inadimplente'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHonorarios.map((honorario) => {
            const client = getClientById(honorario.clientId);
            const process = honorario.processId
              ? getProcessById(honorario.processId)
              : undefined;
            const statusConf = honorarioStatusConfig[honorario.status];
            const typeConf = honorarioTypeConfig[honorario.type];
            const progressPct =
              honorario.installments > 0
                ? (honorario.paidInstallments / honorario.installments) * 100
                : 0;
            const installmentValue =
              honorario.installments > 0
                ? honorario.amount / honorario.installments
                : honorario.amount;

            return (
              <div
                key={honorario.id}
                className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-amber-500/30 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                      <DollarSign className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">
                          {client?.name || 'Cliente desconhecido'}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${typeConf.className}`}
                        >
                          {typeConf.label}
                        </span>
                      </div>
                      {process && (
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#6b7a8d]">
                          <Briefcase className="h-3 w-3" />
                          <span className="font-mono">{process.cnj}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConf.className}`}
                  >
                    {statusConf.label}
                  </span>
                </div>

                {/* Amount + Installments */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">
                      Valor Total
                    </p>
                    <p className="text-lg font-bold text-white mt-0.5">
                      {formatCurrency(honorario.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">
                      Parcela
                    </p>
                    <p className="text-lg font-bold text-white mt-0.5">
                      {formatCurrency(installmentValue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">
                      Vencimento
                    </p>
                    <p className="text-sm font-medium text-white mt-1">
                      Dia {honorario.dueDay}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#6b7a8d]">
                      Parcelas: {honorario.paidInstallments} / {honorario.installments}
                    </span>
                    <span className="text-xs text-[#6b7a8d]">
                      {progressPct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[#1a2332]">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        honorario.status === 'defaulted'
                          ? 'bg-red-500'
                          : honorario.status === 'completed'
                          ? 'bg-green-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(progressPct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                {honorario.status === 'active' && (
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#1a2332]">
                    <div className="flex items-center gap-1.5 text-xs text-[#6b7a8d]">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Contrato: {formatDate(honorario.contractDate)}</span>
                    </div>
                    <button
                      onClick={() => recordInstallmentPayment(honorario.id)}
                      className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                    >
                      Registrar Pagamento
                    </button>
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
