'use client';

import { useState, useMemo } from 'react';
import {
  Receipt,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Briefcase,
  Calendar,
  Plus,
  X,
  Save,
} from 'lucide-react';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import { useLegalStore } from '@/stores/legal-store';
import { PageHeader, StatCardGrid, EmptyState } from '@/components/legal/shared';
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

const HONORARIO_TYPES: { value: HonorarioType; label: string }[] = [
  { value: 'contractual', label: 'Contratual' },
  { value: 'sucumbencial', label: 'Sucumbencial' },
  { value: 'ad_exitum', label: 'Ad Exitum' },
  { value: 'pro_bono', label: 'Pro Bono' },
];

export default function HonorariosPage() {
  const { honorarios, recordInstallmentPayment, addHonorario } = useLegalFinancialStore();
  const { clients, processes, getClientById, getProcessById } = useLegalStore();

  const [activeTab, setActiveTab] = useState<TabValue>('active');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    clientId: '',
    processId: '',
    type: 'contractual' as HonorarioType,
    amount: '',
    installments: '1',
    dueDay: '10',
    notes: '',
  });

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

  const totalActive = honorarios
    .filter((h) => h.status === 'active')
    .reduce((s, h) => s + h.amount, 0);
  const totalReceived = honorarios
    .filter((h) => h.status === 'completed')
    .reduce((s, h) => s + h.amount, 0);
  const totalDefaulted = honorarios
    .filter((h) => h.status === 'defaulted')
    .reduce((s, h) => s + h.amount, 0);

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
      <PageHeader
        title="Honorários"
        subtitle={`${honorarios.length} contratos de honorários`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Financeiro', href: '/legal/financial' },
          { label: 'Honorários', href: '/legal/honorarios' },
        ]}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" /> Novo Honorário
          </button>
        }
      />

      {/* Summary Stats */}
      <StatCardGrid
        cards={[
          {
            label: 'Contratos Ativos',
            value: formatCurrency(totalActive),
            icon: <Receipt className="h-5 w-5" />,
            color: '#F59E0B',
          },
          {
            label: 'Total Quitado',
            value: formatCurrency(totalReceived),
            icon: <CheckCircle2 className="h-5 w-5" />,
            color: '#4ADE80',
          },
          {
            label: 'Inadimplência',
            value: formatCurrency(totalDefaulted),
            icon: <AlertTriangle className="h-5 w-5" />,
            color: '#F87171',
          },
          {
            label: 'Total de Contratos',
            value: honorarios.length,
            icon: <DollarSign className="h-5 w-5" />,
            color: '#60A5FA',
          },
        ]}
      />

      {/* New Honorario Form */}
      {showForm && (
        <div className="rounded-xl border border-amber-500/20 bg-[#0d1320] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Novo Honorário</h2>
            <button onClick={() => setShowForm(false)} className="text-[#6b7a8d] hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Cliente *</label>
              <select value={form.clientId} onChange={(e) => setForm(f => ({ ...f, clientId: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
                <option value="">Selecionar cliente...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Processo</label>
              <select value={form.processId} onChange={(e) => setForm(f => ({ ...f, processId: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
                <option value="">Selecionar processo...</option>
                {processes.map((p) => <option key={p.id} value={p.id}>{p.cnj} — {p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Tipo *</label>
              <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value as HonorarioType }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50">
                {HONORARIO_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Valor Total (R$) *</label>
              <input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="10000" min="0" step="100"
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Parcelas</label>
              <input type="number" value={form.installments} onChange={(e) => setForm(f => ({ ...f, installments: e.target.value }))}
                min="1" max="120"
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Dia de Vencimento</label>
              <input type="number" value={form.dueDay} onChange={(e) => setForm(f => ({ ...f, dueDay: e.target.value }))}
                min="1" max="31"
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Observações</label>
              <input type="text" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notas sobre o contrato..."
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-[#1a2332]">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors">Cancelar</button>
            <button
              onClick={() => {
                if (!form.clientId || !form.amount) return;
                addHonorario({
                  clientId: form.clientId,
                  processId: form.processId || undefined,
                  type: form.type,
                  amount: parseFloat(form.amount),
                  installments: parseInt(form.installments) || 1,
                  paidInstallments: 0,
                  contractDate: new Date().toISOString(),
                  dueDay: parseInt(form.dueDay) || 10,
                  status: 'active',
                  notes: form.notes,
                });
                setForm({ clientId: '', processId: '', type: 'contractual', amount: '', installments: '1', dueDay: '10', notes: '' });
                setShowForm(false);
              }}
              disabled={!form.clientId || !form.amount}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" /> Salvar
            </button>
          </div>
        </div>
      )}

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
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320]">
          <EmptyState
            icon={<Receipt className="h-8 w-8" />}
            title={`Nenhum honorário ${activeTab === 'active' ? 'ativo' : activeTab === 'completed' ? 'quitado' : 'inadimplente'}`}
            description="Os contratos de honorários aparecerão aqui quando cadastrados."
            action={{ label: 'Novo Honorário', onClick: () => setShowForm(true) }}
          />
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
