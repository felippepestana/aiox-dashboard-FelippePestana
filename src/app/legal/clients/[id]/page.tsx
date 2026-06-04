'use client';

import { use, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Building2,
  Briefcase,
  DollarSign,
  FileText,
  Clock,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Plus,
  ShieldCheck,
  Edit3,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Receipt,
  Send,
  StickyNote,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import { PageHeader } from '@/components/legal/shared';
import { LGPDPanel } from '@/components/legal/LGPDPanel';
import type { ProcessStatus, HonorarioType, HonorarioStatus, InvoiceStatus } from '@/types/legal';

// ─── Config maps ─────────────────────────────────────────────────────────────

const processStatusConfig: Record<ProcessStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  active: { label: 'Ativo', className: 'bg-green-500/10 text-green-400 border-green-500/20', icon: CheckCircle2 },
  archived: { label: 'Arquivado', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: XCircle },
  suspended: { label: 'Suspenso', className: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: AlertTriangle },
  closed: { label: 'Encerrado', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: XCircle },
  won: { label: 'Ganho', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
  lost: { label: 'Perdido', className: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
  settled: { label: 'Acordo', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', icon: CheckCircle2 },
};

const honorarioTypeConfig: Record<HonorarioType, { label: string; className: string }> = {
  contractual: { label: 'Contratual', className: 'bg-blue-500/10 text-blue-400' },
  sucumbencial: { label: 'Sucumbencial', className: 'bg-emerald-500/10 text-emerald-400' },
  ad_exitum: { label: 'Ad Exitum', className: 'bg-purple-500/10 text-purple-400' },
  pro_bono: { label: 'Pro Bono', className: 'bg-gray-500/10 text-gray-400' },
};

const honorarioStatusConfig: Record<HonorarioStatus, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-green-500/10 text-green-400' },
  completed: { label: 'Quitado', className: 'bg-blue-500/10 text-blue-400' },
  defaulted: { label: 'Inadimplente', className: 'bg-red-500/10 text-red-400' },
  cancelled: { label: 'Cancelado', className: 'bg-gray-500/10 text-gray-400' },
};

const invoiceStatusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'bg-gray-500/10 text-gray-400' },
  sent: { label: 'Enviada', className: 'bg-amber-500/10 text-amber-400' },
  paid: { label: 'Paga', className: 'bg-emerald-500/10 text-emerald-400' },
  overdue: { label: 'Vencida', className: 'bg-red-500/10 text-red-400' },
  cancelled: { label: 'Cancelada', className: 'bg-gray-500/10 text-gray-400' },
};

// ─── Tab types ────────────────────────────────────────────────────────────────

type TabId = 'processos' | 'financeiro' | 'documentos' | 'historico' | 'lgpd';

interface HistoryNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
  type: 'note' | 'email' | 'call' | 'meeting';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getClientById, getProcessesByClient, addMovement } = useLegalStore();
  const {
    getHonorariosByClient,
    getInvoicesByClient,
    transactions,
  } = useLegalFinancialStore();

  const client = getClientById(id);
  const processes = client ? getProcessesByClient(id) : [];
  const honorarios = client ? getHonorariosByClient(id) : [];
  const invoices = client ? getInvoicesByClient(id) : [];
  const clientTransactions = client
    ? transactions.filter((t) => t.clientId === id)
    : [];

  const [activeTab, setActiveTab] = useState<TabId>('processos');
  const [historyNotes, setHistoryNotes] = useState<HistoryNote[]>([]);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const totalHonorarios = honorarios.reduce((sum, h) => sum + h.amount, 0);
  const pendingHonorarios = honorarios
    .filter((h) => h.status === 'active')
    .reduce((sum, h) => {
      const remaining = h.installments - h.paidInstallments;
      return sum + (h.amount / h.installments) * remaining;
    }, 0);
  const totalRevenue = clientTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const handleAddNote = useCallback(() => {
    if (!newNote.trim()) return;
    const note: HistoryNote = {
      id: `note-${Date.now()}`,
      content: newNote.trim(),
      author: 'Usuário',
      createdAt: new Date().toISOString(),
      type: 'note',
    };
    setHistoryNotes((prev) => [note, ...prev]);
    setNewNote('');
    setAddingNote(false);
  }, [newNote]);

  const TABS: { id: TabId; label: string; icon: typeof Briefcase; count?: number }[] = [
    { id: 'processos', label: 'Processos', icon: Briefcase, count: processes.length },
    { id: 'financeiro', label: 'Financeiro', icon: DollarSign, count: honorarios.length },
    { id: 'documentos', label: 'Documentos', icon: FileText },
    { id: 'historico', label: 'Histórico', icon: Clock, count: historyNotes.length || undefined },
    { id: 'lgpd', label: 'LGPD', icon: ShieldCheck },
  ];

  if (!client) {
    return (
      <div className="p-6">
        <Link href="/legal/clients" className="flex items-center gap-2 text-[#6b7a8d] hover:text-white mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar para Clientes
        </Link>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-16 text-center">
          <User className="h-12 w-12 text-[#4a5568] mx-auto mb-3" />
          <p className="text-[#6b7a8d]">Cliente não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={client.name}
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Clientes', href: '/legal/clients' },
          { label: client.name, href: `/legal/clients/${id}` },
        ]}
      />

      {/* Client Header Card */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl flex-shrink-0 ${
              client.type === 'pf' ? 'bg-blue-500/10' : 'bg-purple-500/10'
            }`}>
              {client.type === 'pf' ? (
                <User className="h-8 w-8 text-blue-400" />
              ) : (
                <Building2 className="h-8 w-8 text-purple-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white">{client.name}</h1>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  client.type === 'pf'
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                }`}>
                  {client.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                </span>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  processes.some((p) => p.status === 'active')
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                }`}>
                  {processes.some((p) => p.status === 'active') ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <p className="text-sm text-[#6b7a8d] font-mono mt-0.5">{client.cpfCnpj}</p>
              {client.companyName && (
                <p className="text-sm text-[#8899aa] mt-0.5">{client.companyName}</p>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {client.whatsapp && (
              <a
                href={`https://wa.me/${client.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                WhatsApp
              </a>
            )}
            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="flex items-center gap-1.5 rounded-lg bg-[#1a2332] border border-[#2a3444] px-3 py-1.5 text-xs font-medium text-[#8899aa] hover:text-white hover:bg-[#1e2a3d] transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
                Email
              </a>
            )}
            <Link
              href={`/legal/processes/new?clientId=${id}`}
              className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Novo processo
            </Link>
            <Link
              href={`/legal/clients/${id}/edit`}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a2332] border border-[#2a3444] text-[#6b7a8d] hover:text-white hover:bg-[#1e2a3d] transition-colors"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Contact row */}
        <div className="mt-4 pt-4 border-t border-[#1a2332] grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 text-[#4a5568] flex-shrink-0" />
            <span className="text-sm text-[#8899aa] truncate">{client.phone || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-[#4a5568] flex-shrink-0" />
            <span className="text-sm text-[#8899aa] truncate">{client.email || '—'}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-[#4a5568] flex-shrink-0" />
            <span className="text-sm text-[#8899aa] truncate">
              {client.address?.city ? `${client.address.city}/${client.address.state}` : '—'}
            </span>
          </div>
          {client.leadSource && (
            <div className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5 text-[#4a5568] flex-shrink-0" />
              <span className="text-sm text-[#8899aa] truncate">{client.leadSource}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Processos', value: processes.length, color: 'text-white' },
          { label: 'Honorários Contratados', value: formatCurrency(totalHonorarios), color: 'text-white' },
          { label: 'A Receber', value: formatCurrency(pendingHonorarios), color: 'text-amber-400' },
          { label: 'Receita Total', value: formatCurrency(totalRevenue), color: 'text-emerald-400' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
            <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">{stat.label}</p>
            <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex items-center gap-1 border-b border-[#1a2332] mb-4 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-[#6b7a8d] hover:text-white hover:border-[#2a3444]'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    activeTab === tab.id
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-[#1a2332] text-[#6b7a8d]'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Tab: Processos ─────────────────────────────────────────────── */}
        {activeTab === 'processos' && (
          <div className="space-y-3">
            {processes.length === 0 ? (
              <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
                <Briefcase className="h-10 w-10 text-[#4a5568] mx-auto mb-3" />
                <p className="text-sm text-[#6b7a8d] mb-3">Nenhum processo vinculado a este cliente.</p>
                <Link
                  href={`/legal/processes/new?clientId=${id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar processo
                </Link>
              </div>
            ) : (
              processes.map((p) => {
                const cfg = processStatusConfig[p.status] ?? processStatusConfig.active;
                const StatusIcon = cfg.icon;
                return (
                  <Link
                    key={p.id}
                    href={`/legal/processes/${p.id}`}
                    className="flex items-center justify-between rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 hover:bg-[#0f1726] hover:border-amber-500/20 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1a2332] flex-shrink-0">
                        <Briefcase className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{p.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-amber-400 font-mono">{p.cnj}</span>
                          <span className="text-xs text-[#4a5568]">·</span>
                          <span className="text-xs text-[#6b7a8d] capitalize">{p.area}</span>
                          {p.court && (
                            <>
                              <span className="text-xs text-[#4a5568]">·</span>
                              <span className="text-xs text-[#6b7a8d] truncate max-w-[200px]">{p.court}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
                        <StatusIcon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                      <ExternalLink className="h-4 w-4 text-[#4a5568] group-hover:text-amber-400 transition-colors" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* ── Tab: Financeiro ────────────────────────────────────────────── */}
        {activeTab === 'financeiro' && (
          <div className="space-y-4">
            {/* Honorários */}
            <div>
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-amber-400" />
                Contratos de Honorários ({honorarios.length})
              </h3>
              {honorarios.length === 0 ? (
                <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-8 text-center">
                  <p className="text-sm text-[#6b7a8d]">Nenhum contrato de honorários registrado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {honorarios.map((h) => {
                    const typeCfg = honorarioTypeConfig[h.type];
                    const statusCfg = honorarioStatusConfig[h.status];
                    const installmentValue = h.amount / h.installments;
                    const paidAmount = installmentValue * h.paidInstallments;
                    const progress = h.installments > 0 ? (h.paidInstallments / h.installments) * 100 : 0;

                    return (
                      <div key={h.id} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeCfg.className}`}>
                                {typeCfg.label}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusCfg.className}`}>
                                {statusCfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-[#6b7a8d] mt-1">
                              Contrato: {formatDate(h.contractDate)} · Vencimento dia {h.dueDay}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold text-white">{formatCurrency(h.amount)}</p>
                            <p className="text-xs text-[#6b7a8d]">{h.installments}× parcelas</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-[#6b7a8d]">
                            <span>Pago: {formatCurrency(paidAmount)}</span>
                            <span>{h.paidInstallments}/{h.installments} parcelas</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-[#1a2332]">
                            <div
                              className="h-full rounded-full bg-amber-500 transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        {h.notes && <p className="text-xs text-[#4a5568] mt-2">{h.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Faturas */}
            {invoices.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-400" />
                  Faturas ({invoices.length})
                </h3>
                <div className="space-y-2">
                  {invoices.map((inv) => {
                    const cfg = invoiceStatusConfig[inv.status];
                    return (
                      <div key={inv.id} className="flex items-center justify-between rounded-xl border border-[#1a2332] bg-[#0d1320] px-4 py-3">
                        <div>
                          <p className="text-sm text-white">Fatura #{inv.id.slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-[#6b7a8d]">Vencimento: {formatDate(inv.dueDate)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}>
                            {cfg.label}
                          </span>
                          <p className="text-sm font-bold text-white">{formatCurrency(inv.total)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Transactions */}
            {clientTransactions.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-400" />
                  Transações ({clientTransactions.length})
                </h3>
                <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1a2332]">
                        <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#6b7a8d] uppercase tracking-wider">Data</th>
                        <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-[#6b7a8d] uppercase tracking-wider">Descrição</th>
                        <th className="px-4 py-2.5 text-right text-[10px] font-semibold text-[#6b7a8d] uppercase tracking-wider">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientTransactions.slice(0, 20).map((t) => (
                        <tr key={t.id} className="border-b border-[#1a2332] last:border-0 hover:bg-[#0a0f1a] transition-colors">
                          <td className="px-4 py-2.5 text-xs text-[#6b7a8d] whitespace-nowrap">{formatDate(t.date)}</td>
                          <td className="px-4 py-2.5 text-xs text-white">{t.description}</td>
                          <td className={`px-4 py-2.5 text-xs font-medium text-right ${
                            t.type === 'income' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {honorarios.length === 0 && invoices.length === 0 && clientTransactions.length === 0 && (
              <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
                <DollarSign className="h-10 w-10 text-[#4a5568] mx-auto mb-3" />
                <p className="text-sm text-[#6b7a8d]">Nenhum registro financeiro para este cliente.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Documentos ────────────────────────────────────────────── */}
        {activeTab === 'documentos' && (
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
            <FileText className="h-10 w-10 text-[#4a5568] mx-auto mb-3" />
            <p className="text-sm text-[#6b7a8d] mb-3">
              Nenhum documento vinculado a este cliente ainda.
            </p>
            <Link
              href="/legal/upload"
              className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Enviar documentos
            </Link>
          </div>
        )}

        {/* ── Tab: Histórico ─────────────────────────────────────────────── */}
        {activeTab === 'historico' && (
          <div className="space-y-4">
            {/* Add note */}
            <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
              {addingNote ? (
                <div className="space-y-3">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Descreva a interação, anotação ou evento..."
                    rows={3}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#2a3444] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:outline-none focus:border-amber-500/50 resize-none"
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddNote}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/30 transition-colors"
                    >
                      Salvar nota
                    </button>
                    <button
                      onClick={() => { setAddingNote(false); setNewNote(''); }}
                      className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white hover:bg-[#1a2332] transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingNote(true)}
                  className="flex items-center gap-2 text-sm text-[#6b7a8d] hover:text-amber-400 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar nota ou interação
                </button>
              )}
            </div>

            {/* Timeline */}
            {historyNotes.length === 0 ? (
              <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-12 text-center">
                <Clock className="h-10 w-10 text-[#4a5568] mx-auto mb-3" />
                <p className="text-sm text-[#6b7a8d]">
                  Nenhuma nota ou interação registrada para este cliente.
                </p>
                <p className="text-xs text-[#4a5568] mt-1">
                  Cliente cadastrado em {formatDate(client.createdAt)}
                </p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-[#1a2332] rounded-full" />
                {/* Creation event */}
                <div className="relative flex gap-3">
                  <div className="absolute -left-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#1a2332] border border-[#2a3444]">
                    <User className="h-2.5 w-2.5 text-amber-400" />
                  </div>
                  <div className="rounded-lg border border-[#1a2332] bg-[#0d1320] p-3 flex-1">
                    <p className="text-sm text-white">Cliente cadastrado no sistema</p>
                    <p className="text-xs text-[#4a5568] mt-0.5">{formatDate(client.createdAt)}</p>
                  </div>
                </div>
                {historyNotes.map((note) => (
                  <div key={note.id} className="relative flex gap-3">
                    <div className="absolute -left-4 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
                      <StickyNote className="h-2.5 w-2.5 text-amber-400" />
                    </div>
                    <div className="rounded-lg border border-[#1a2332] bg-[#0d1320] p-3 flex-1">
                      <p className="text-sm text-white">{note.content}</p>
                      <p className="text-xs text-[#4a5568] mt-0.5">
                        {note.author} · {formatDate(note.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {client.notes && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <p className="text-xs font-semibold text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <StickyNote className="h-3.5 w-3.5" />
                  Observações do cadastro
                </p>
                <p className="text-sm text-[#c8d0dc]">{client.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: LGPD ──────────────────────────────────────────────────── */}
        {activeTab === 'lgpd' && (
          <LGPDPanel clientId={id} clientName={client.name} />
        )}
      </div>
    </div>
  );
}
