'use client';

import { useState } from 'react';
import {
  BarChart3,
  Plus,
  X,
  DollarSign,
  Clock,
  Users,
  Settings,
} from 'lucide-react';
import { useLegalStrategyStore } from '@/stores/legal-strategy-store';
import { KPICard } from '@/components/legal/KPICard';
import type { KPI } from '@/types/legal';

type KPICategory = KPI['category'];

const CATEGORY_TABS: { key: KPICategory; label: string; icon: React.ElementType }[] = [
  { key: 'revenue', label: 'Receita', icon: DollarSign },
  { key: 'productivity', label: 'Produtividade', icon: Clock },
  { key: 'client', label: 'Cliente', icon: Users },
  { key: 'operations', label: 'Operacoes', icon: Settings },
];

export default function KPIsPage() {
  const { kpis, addKPI, removeKPI, getKPIsByCategory } = useLegalStrategyStore();
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
      { name: 'Ticket Medio', category: 'revenue', value: 4500, target: 5000, unit: 'R$', period: '2026-04' },
      { name: 'Honorarios Recebidos', category: 'revenue', value: 72000, target: 90000, unit: 'R$', period: '2026-04' },
      { name: 'Horas Faturadas', category: 'productivity', value: 320, target: 400, unit: 'h', period: '2026-04' },
      { name: 'Pecas Produzidas', category: 'productivity', value: 48, target: 50, unit: 'un', period: '2026-04' },
      { name: 'Taxa de Aproveitamento', category: 'productivity', value: 78, target: 85, unit: '%', period: '2026-04' },
      { name: 'NPS Clientes', category: 'client', value: 72, target: 80, unit: 'pts', period: '2026-04' },
      { name: 'Retencao de Clientes', category: 'client', value: 88, target: 90, unit: '%', period: '2026-04' },
      { name: 'Novos Clientes', category: 'client', value: 6, target: 8, unit: 'un', period: '2026-04' },
      { name: 'Prazos no Prazo', category: 'operations', value: 95, target: 100, unit: '%', period: '2026-04' },
      { name: 'Inadimplencia', category: 'operations', value: 12, target: 5, unit: '%', period: '2026-04' },
      { name: 'Tempo Medio Resposta', category: 'operations', value: 4, target: 2, unit: 'h', period: '2026-04' },
    ];
    demos.forEach((d) => addKPI(d));
  }

  const totalOnTarget = kpis.filter((k) => k.target > 0 && (k.value / k.target) >= 0.8).length;
  const totalBelowTarget = kpis.filter((k) => k.target > 0 && (k.value / k.target) < 0.6).length;

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="h-7 w-7 text-amber-400" />
            KPIs do Escritorio
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Indicadores-chave de desempenho
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 text-center">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Total KPIs</p>
          <p className="text-2xl font-bold text-white mt-1">{kpis.length}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 text-center">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Na Meta (&ge;80%)</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{totalOnTarget}</p>
        </div>
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 text-center">
          <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Critico (&lt;60%)</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{totalBelowTarget}</p>
        </div>
      </div>

      {/* Tabs */}
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
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                  <label className="text-xs text-[#6b7a8d] block mb-1">Periodo</label>
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
