'use client';

import { useState, useMemo } from 'react';
import {
  BarChart3,
  Plus,
  X,
  DollarSign,
  Clock,
  Users,
  Settings,
  TrendingUp,
  Briefcase,
  CheckCircle,
  Target,
  Award,
} from 'lucide-react';
import { useLegalStrategyStore } from '@/stores/legal-strategy-store';
import { useLegalStore } from '@/stores/legal-store';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import { KPICard } from '@/components/legal/KPICard';
import { MetricCard } from '@/components/legal/ReportCharts';
import { PageHeader, StatCardGrid } from '@/components/legal/shared';
import type { KPI } from '@/types/legal';

type KPICategory = KPI['category'];

const CATEGORY_TABS: { key: KPICategory; label: string; icon: React.ElementType }[] = [
  { key: 'revenue', label: 'Receita', icon: DollarSign },
  { key: 'productivity', label: 'Produtividade', icon: Clock },
  { key: 'client', label: 'Cliente', icon: Users },
  { key: 'operations', label: 'Operações', icon: Settings },
];

export default function KPIsPage() {
  const { kpis, addKPI, removeKPI, getKPIsByCategory } = useLegalStrategyStore();
  const { processes, clients, deadlines } = useLegalStore();
  const { honorarios, transactions, getTotalRevenue } = useLegalFinancialStore();

  const [activeTab, setActiveTab] = useState<KPICategory>('revenue');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'revenue' as KPICategory,
    value: 0,
    target: 0,
    unit: '',
    period: new Date().toISOString().substring(0, 7),
  });

  const filteredKPIs = getKPIsByCategory(activeTab);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addKPI({
      name: formData.name,
      category: formData.category,
      value: formData.value,
      target: formData.target,
      unit: formData.unit,
      period: formData.period,
    });
    setFormData({ name: '', category: activeTab, value: 0, target: 0, unit: '', period: new Date().toISOString().substring(0, 7) });
    setShowForm(false);
  }

  function seedDemoKPIs() {
    const demos: Omit<KPI, 'id'>[] = [
      { name: 'Faturamento Mensal', category: 'revenue', value: 85000, target: 100000, unit: 'R$', period: '2026-04' },
      { name: 'Ticket Médio', category: 'revenue', value: 4500, target: 5000, unit: 'R$', period: '2026-04' },
      { name: 'Honorários Recebidos', category: 'revenue', value: 72000, target: 90000, unit: 'R$', period: '2026-04' },
      { name: 'Horas Faturadas', category: 'productivity', value: 320, target: 400, unit: 'h', period: '2026-04' },
      { name: 'Peças Produzidas', category: 'productivity', value: 48, target: 50, unit: 'un', period: '2026-04' },
      { name: 'Taxa de Aproveitamento', category: 'productivity', value: 78, target: 85, unit: '%', period: '2026-04' },
      { name: 'NPS Clientes', category: 'client', value: 72, target: 80, unit: 'pts', period: '2026-04' },
      { name: 'Retenção de Clientes', category: 'client', value: 88, target: 90, unit: '%', period: '2026-04' },
      { name: 'Novos Clientes', category: 'client', value: 6, target: 8, unit: 'un', period: '2026-04' },
      { name: 'Prazos no Prazo', category: 'operations', value: 95, target: 100, unit: '%', period: '2026-04' },
      { name: 'Inadimplência', category: 'operations', value: 12, target: 5, unit: '%', period: '2026-04' },
      { name: 'Tempo Médio Resposta', category: 'operations', value: 4, target: 2, unit: 'h', period: '2026-04' },
    ];
    demos.forEach((d) => addKPI(d));
  }

  const totalOnTarget = kpis.filter((k) => k.target > 0 && (k.value / k.target) >= 0.8).length;
  const totalBelowTarget = kpis.filter((k) => k.target > 0 && (k.value / k.target) < 0.6).length;

  // ── Computed live KPIs from store data ──────────────────────────────────────

  const now = new Date();
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const liveKPIs = useMemo(() => {
    const totalRevenue = getTotalRevenue();
    const monthlyRevenue = transactions
      .filter((t) => t.type === 'income' && t.date.startsWith(currentMonthPrefix))
      .reduce((s, t) => s + t.amount, 0);

    const activeProcesses = processes.filter((p) => p.status === 'active').length;

    const wonCount = processes.filter((p) => p.status === 'won').length;
    const lostCount = processes.filter((p) => p.status === 'lost').length;
    const taxaSuccesso = wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

    const metDeadlines = deadlines.filter((d) => d.status === 'completed').length;
    const missedDeadlines = deadlines.filter((d) => d.status === 'missed').length;
    const totalResolved = metDeadlines + missedDeadlines;
    const prazosRate = totalResolved > 0 ? (metDeadlines / totalResolved) * 100 : 0;

    const activeHonorarios = honorarios.filter((h) => h.status === 'active');
    const totalHonorarioClients = new Set(activeHonorarios.map((h) => h.clientId)).size;
    const ticketMedio = totalHonorarioClients > 0
      ? activeHonorarios.reduce((s, h) => s + h.amount, 0) / totalHonorarioClients
      : 0;

    const newClients = clients.filter((c) => c.createdAt.startsWith(currentMonthPrefix)).length;

    // Outstanding honorarios
    const honorariosPendentes = honorarios
      .filter((h) => h.status === 'active')
      .reduce((s, h) => {
        const remaining = h.installments - h.paidInstallments;
        return s + (remaining * (h.amount / h.installments));
      }, 0);

    // Average resolution time (closed processes)
    const closedProcs = processes.filter((p) =>
      ['closed', 'won', 'lost', 'settled'].includes(p.status)
    );
    const avgResolutionDays = closedProcs.length > 0
      ? closedProcs.reduce((s, p) => {
          const diff = (new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return s + Math.max(0, diff);
        }, 0) / closedProcs.length
      : 0;

    return {
      monthlyRevenue,
      totalRevenue,
      activeProcesses,
      taxaSuccesso,
      prazosRate,
      ticketMedio,
      newClients,
      honorariosPendentes,
      avgResolutionDays: Math.round(avgResolutionDays),
    };
  }, [processes, clients, deadlines, honorarios, transactions, getTotalRevenue, currentMonthPrefix]);

  // Overall health score
  const healthScore = useMemo(() => {
    const scoreFactors = [
      Math.min(100, liveKPIs.taxaSuccesso),
      Math.min(100, liveKPIs.prazosRate),
      liveKPIs.totalRevenue > 0 ? 70 : 50, // base score if has revenue
      clients.length > 0 ? Math.min(100, (liveKPIs.activeProcesses / Math.max(1, processes.length)) * 100) : 50,
    ];
    const base = scoreFactors.reduce((s, v) => s + v, 0) / scoreFactors.length;
    // Blend with manual KPIs if available
    if (kpis.length > 0) {
      const kpiScore = (totalOnTarget / Math.max(1, kpis.filter((k) => k.target > 0).length)) * 100;
      return Math.round(base * 0.5 + kpiScore * 0.5);
    }
    return Math.round(base);
  }, [liveKPIs, kpis, totalOnTarget, clients.length, processes.length]);

  const healthColor =
    healthScore >= 80 ? '#22c55e' : healthScore >= 60 ? '#f59e0b' : '#ef4444';

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      <PageHeader
        title="KPIs do Escritório"
        subtitle="Indicadores-chave de desempenho"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'KPIs', href: '/legal/kpis' },
        ]}
        actions={
          <>
            {kpis.length === 0 && (
              <button
                onClick={seedDemoKPIs}
                className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
              >
                Carregar Demo
              </button>
            )}
            <button
              onClick={() => { setShowForm(true); setFormData((f) => ({ ...f, category: activeTab })); }}
              className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              Novo KPI
            </button>
          </>
        }
      />

      {/* Health Score Banner */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl border-2 text-xl font-bold"
              style={{ borderColor: healthColor, color: healthColor }}
            >
              {healthScore}
            </div>
            <div>
              <p className="text-base font-semibold text-white">Score de Saúde do Escritório</p>
              <p className="text-xs text-[#6b7a8d] mt-0.5">
                Índice composto: êxito, prazos, receita, carteira
              </p>
            </div>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="h-2 rounded-full bg-[#1a2332]">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: `${healthScore}%`, backgroundColor: healthColor }}
              />
            </div>
            <div className="flex justify-between text-xs text-[#6b7a8d] mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Live KPI Grid */}
      <div>
        <h2 className="text-sm font-semibold text-[#6b7a8d] uppercase tracking-wider mb-3">
          Métricas em Tempo Real
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Receita Mensal"
            value={
              liveKPIs.monthlyRevenue >= 1000
                ? `R$${(liveKPIs.monthlyRevenue / 1000).toFixed(0)}k`
                : `R$${liveKPIs.monthlyRevenue.toFixed(0)}`
            }
            subValue={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(liveKPIs.monthlyRevenue)}
            icon={<DollarSign className="h-5 w-5 text-amber-400" />}
            accentColor="#f59e0b"
          />
          <MetricCard
            label="Processos Ativos"
            value={String(liveKPIs.activeProcesses)}
            subValue={`de ${processes.length} total`}
            icon={<Briefcase className="h-5 w-5 text-blue-400" />}
            accentColor="#3b82f6"
          />
          <MetricCard
            label="Taxa de Sucesso"
            value={liveKPIs.taxaSuccesso > 0 ? `${liveKPIs.taxaSuccesso.toFixed(1)}%` : '—'}
            subValue="Ganhos / (ganhos + perdidos)"
            trend={liveKPIs.taxaSuccesso >= 60 ? 'up' : liveKPIs.taxaSuccesso > 0 ? 'down' : 'flat'}
            progressPct={liveKPIs.taxaSuccesso}
            icon={<Award className="h-5 w-5 text-green-400" />}
            accentColor="#22c55e"
          />
          <MetricCard
            label="Prazos Cumpridos"
            value={liveKPIs.prazosRate > 0 ? `${liveKPIs.prazosRate.toFixed(1)}%` : '—'}
            subValue="Sobre prazos finalizados"
            trend={liveKPIs.prazosRate >= 80 ? 'up' : liveKPIs.prazosRate > 0 ? 'down' : 'flat'}
            progressPct={liveKPIs.prazosRate}
            icon={<CheckCircle className="h-5 w-5 text-teal-400" />}
            accentColor="#14b8a6"
          />
          <MetricCard
            label="Ticket Médio por Cliente"
            value={
              liveKPIs.ticketMedio >= 1000
                ? `R$${(liveKPIs.ticketMedio / 1000).toFixed(0)}k`
                : `R$${liveKPIs.ticketMedio.toFixed(0)}`
            }
            subValue="Honorários ativos / clientes"
            icon={<Target className="h-5 w-5 text-purple-400" />}
            accentColor="#8b5cf6"
          />
          <MetricCard
            label="Tempo Médio de Resolução"
            value={liveKPIs.avgResolutionDays > 0 ? `${liveKPIs.avgResolutionDays} dias` : '—'}
            subValue="Processos encerrados"
            trend={liveKPIs.avgResolutionDays > 0 && liveKPIs.avgResolutionDays <= 180 ? 'up' : 'flat'}
            icon={<Clock className="h-5 w-5 text-orange-400" />}
            accentColor="#f97316"
          />
          <MetricCard
            label="Novos Clientes no Mês"
            value={String(liveKPIs.newClients)}
            subValue={`Total: ${clients.length} clientes`}
            trend={liveKPIs.newClients > 0 ? 'up' : 'flat'}
            icon={<Users className="h-5 w-5 text-indigo-400" />}
            accentColor="#6366f1"
          />
          <MetricCard
            label="Honorários Pendentes"
            value={
              liveKPIs.honorariosPendentes >= 1000
                ? `R$${(liveKPIs.honorariosPendentes / 1000).toFixed(0)}k`
                : `R$${liveKPIs.honorariosPendentes.toFixed(0)}`
            }
            subValue="A receber (contratos ativos)"
            trend={liveKPIs.honorariosPendentes > 0 ? 'up' : 'flat'}
            trendPositive={false}
            icon={<TrendingUp className="h-5 w-5 text-yellow-400" />}
            accentColor="#eab308"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <StatCardGrid
        cards={[
          {
            label: 'KPIs Manuais',
            value: kpis.length,
            icon: <BarChart3 className="h-5 w-5" />,
            color: '#D4AF37',
          },
          {
            label: 'Na Meta (≥80%)',
            value: totalOnTarget,
            icon: <CheckCircle className="h-5 w-5" />,
            trend: totalOnTarget > 0 ? 'up' : 'flat',
            color: '#22c55e',
          },
          {
            label: 'Crítico (<60%)',
            value: totalBelowTarget,
            icon: <TrendingUp className="h-5 w-5" />,
            trend: totalBelowTarget > 0 ? 'down' : 'flat',
            trendPositive: false,
            color: '#ef4444',
          },
        ]}
        className="sm:grid-cols-3 lg:grid-cols-3"
      />

      {/* Tabs */}
      <div>
        <h2 className="text-sm font-semibold text-[#6b7a8d] uppercase tracking-wider mb-3">
          KPIs por Categoria
        </h2>
        <div className="flex items-center gap-2 border-b border-[#1a2332] pb-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-amber-500/10 text-amber-400 border-b-2 border-amber-400'
                  : 'text-[#6b7a8d] hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* KPI Grid */}
        {filteredKPIs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#6b7a8d]">
            <BarChart3 className="h-8 w-8 mb-2" />
            <p className="text-sm">Nenhum KPI nesta categoria</p>
            <p className="text-xs mt-1">Clique em &quot;Novo KPI&quot; para adicionar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {filteredKPIs.map((kpi) => (
              <div key={kpi.id} className="relative group">
                <KPICard
                  name={kpi.name}
                  value={kpi.value}
                  target={kpi.target}
                  unit={kpi.unit}
                  trend={kpi.target > 0 && kpi.value >= kpi.target ? 'up' : kpi.target > 0 && (kpi.value / kpi.target) < 0.6 ? 'down' : 'flat'}
                />
                <button
                  onClick={() => removeKPI(kpi.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-[#6b7a8d] hover:text-red-400 transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add KPI Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Novo KPI</h3>
              <button onClick={() => setShowForm(false)} className="text-[#6b7a8d] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#6b7a8d] block mb-1">Nome</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-xs text-[#6b7a8d] block mb-1">Categoria</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value as KPICategory }))}
                  className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  {CATEGORY_TABS.map((t) => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6b7a8d] block mb-1">Valor Atual</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.value}
                    onChange={(e) => setFormData((f) => ({ ...f, value: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7a8d] block mb-1">Meta</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.target}
                    onChange={(e) => setFormData((f) => ({ ...f, target: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6b7a8d] block mb-1">Unidade</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="R$, %, h, un..."
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder-[#6b7a8d] focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6b7a8d] block mb-1">Período</label>
                  <input
                    type="month"
                    value={formData.period}
                    onChange={(e) => setFormData((f) => ({ ...f, period: e.target.value }))}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
              >
                Adicionar KPI
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
