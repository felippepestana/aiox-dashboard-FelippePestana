'use client';

import { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  X,
  Save,
  Package,
  Car,
  Monitor,
  Sofa,
  MoreHorizontal,
  TrendingDown,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  DollarSign,
  Search,
  Filter,
} from 'lucide-react';
import { PageHeader } from '@/components/legal/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetCategory =
  | 'equipment'
  | 'furniture'
  | 'vehicle'
  | 'real_estate'
  | 'technology'
  | 'other';

type AssetStatus = 'active' | 'maintenance' | 'disposed' | 'sold';

interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  acquisitionDate: string;
  acquisitionValue: number; // in cents (BRL)
  currentValue: number;     // in cents (BRL), depreciated
  status: AssetStatus;
  location: string;
  responsiblePerson: string;
  notes: string;
  createdAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Useful life in years per category (for linear depreciation)
const USEFUL_LIFE: Record<AssetCategory, number> = {
  equipment:   5,
  furniture:   10,
  vehicle:     5,
  real_estate: 25,
  technology:  3,
  other:       5,
};

const CATEGORY_CONFIG: Record<
  AssetCategory,
  { label: string; icon: typeof Package; className: string }
> = {
  equipment:   { label: 'Equipamento',    icon: Package,   className: 'bg-blue-500/10 text-blue-400' },
  furniture:   { label: 'Mobiliário',     icon: Sofa,      className: 'bg-amber-500/10 text-amber-400' },
  vehicle:     { label: 'Veículo',        icon: Car,       className: 'bg-purple-500/10 text-purple-400' },
  real_estate: { label: 'Imóvel',         icon: Building2, className: 'bg-green-500/10 text-green-400' },
  technology:  { label: 'Tecnologia',     icon: Monitor,   className: 'bg-cyan-500/10 text-cyan-400' },
  other:       { label: 'Outros',         icon: MoreHorizontal, className: 'bg-gray-500/10 text-gray-400' },
};

const STATUS_CONFIG: Record<
  AssetStatus,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  active:      { label: 'Ativo',        className: 'bg-green-500/10 text-green-400',  icon: CheckCircle2 },
  maintenance: { label: 'Manutenção',   className: 'bg-amber-500/10 text-amber-400',  icon: Wrench },
  disposed:    { label: 'Descartado',   className: 'bg-gray-500/10 text-gray-400',    icon: XCircle },
  sold:        { label: 'Vendido',      className: 'bg-red-500/10 text-red-400',      icon: AlertTriangle },
};

const CATEGORIES: { value: AssetCategory; label: string }[] = [
  { value: 'equipment',   label: 'Equipamento' },
  { value: 'furniture',   label: 'Mobiliário' },
  { value: 'vehicle',     label: 'Veículo' },
  { value: 'real_estate', label: 'Imóvel' },
  { value: 'technology',  label: 'Tecnologia' },
  { value: 'other',       label: 'Outros' },
];

const STATUSES: { value: AssetStatus; label: string }[] = [
  { value: 'active',      label: 'Ativo' },
  { value: 'maintenance', label: 'Manutenção' },
  { value: 'disposed',    label: 'Descartado' },
  { value: 'sold',        label: 'Vendido' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateId(): string {
  return `asset-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function formatCurrency(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Linear depreciation: depreciates the acquisition value evenly over the
 * useful life of the category. Returns the current book value (floor: 0).
 */
function calculateCurrentValue(
  acquisitionValue: number,
  acquisitionDate: string,
  category: AssetCategory,
): number {
  if (!acquisitionDate) return acquisitionValue;
  const usefulLife = USEFUL_LIFE[category];
  const yearsElapsed =
    (Date.now() - new Date(acquisitionDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  const depreciated = acquisitionValue * (1 - yearsElapsed / usefulLife);
  return Math.max(0, Math.round(depreciated));
}

/**
 * Annual depreciation amount for current year.
 */
function annualDepreciation(acquisitionValue: number, category: AssetCategory): number {
  return Math.round(acquisitionValue / USEFUL_LIFE[category]);
}

// ─── Empty form state ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  category: 'equipment' as AssetCategory,
  acquisitionDate: '',
  acquisitionValue: '',
  status: 'active' as AssetStatus,
  location: '',
  responsiblePerson: '',
  notes: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<AssetCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AssetStatus | 'all'>('all');

  // ── Derived state ──────────────────────────────────────────────────────────

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (filterCategory !== 'all' && a.category !== filterCategory) return false;
      if (filterStatus !== 'all' && a.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !a.name.toLowerCase().includes(q) &&
          !a.location.toLowerCase().includes(q) &&
          !a.responsiblePerson.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [assets, filterCategory, filterStatus, searchQuery]);

  const summaryStats = useMemo(() => {
    const activeAssets = assets.filter((a) => a.status === 'active' || a.status === 'maintenance');
    const totalValue = activeAssets.reduce((sum, a) => sum + a.currentValue, 0);
    const needingMaintenance = assets.filter((a) => a.status === 'maintenance').length;
    const depreciationThisYear = assets
      .filter((a) => a.status === 'active')
      .reduce((sum, a) => sum + annualDepreciation(a.acquisitionValue, a.category), 0);

    return {
      totalAssets: assets.length,
      totalValue,
      needingMaintenance,
      depreciationThisYear,
    };
  }, [assets]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleAdd() {
    if (!form.name.trim() || !form.acquisitionDate || !form.acquisitionValue) return;

    const acquisitionValueCents = Math.round(parseFloat(form.acquisitionValue) * 100);
    const currentValue = calculateCurrentValue(
      acquisitionValueCents,
      form.acquisitionDate,
      form.category,
    );

    const newAsset: Asset = {
      id: generateId(),
      name: form.name.trim(),
      category: form.category,
      acquisitionDate: form.acquisitionDate,
      acquisitionValue: acquisitionValueCents,
      currentValue,
      status: form.status,
      location: form.location.trim(),
      responsiblePerson: form.responsiblePerson.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    setAssets((prev) => [newAsset, ...prev]);
    setForm({ ...EMPTY_FORM });
    setShowForm(false);
  }

  function handleStatusChange(id: string, status: AssetStatus) {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  }

  function handleRemove(id: string) {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 lg:p-8 space-y-6">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <PageHeader
        title="Patrimônio"
        subtitle="Gestão de ativos do escritório — bens, equipamentos e imóveis"
        breadcrumbs={[
          { label: 'Dashboard', href: '/legal' },
          { label: 'Patrimônio', href: '/legal/assets' },
        ]}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Novo Ativo
          </button>
        }
      />

      {/* ── Summary Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: 'Total de Ativos',
            value: summaryStats.totalAssets,
            sub: 'registros',
            icon: Package,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            label: 'Valor Total Atual',
            value: formatCurrency(summaryStats.totalValue),
            sub: 'ativos e em manutenção',
            icon: DollarSign,
            color: 'text-green-400',
            bg: 'bg-green-500/10',
          },
          {
            label: 'Em Manutenção',
            value: summaryStats.needingMaintenance,
            sub: 'ativos',
            icon: Wrench,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
          },
          {
            label: 'Depreciação Anual',
            value: formatCurrency(summaryStats.depreciationThisYear),
            sub: 'estimativa linear',
            icon: TrendingDown,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <p className="text-xs font-medium text-[#6b7a8d] uppercase tracking-wider">
                  {stat.label}
                </p>
              </div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-[#4a5568] mt-1">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      {/* ── Add Asset Form ────────────────────────────────────────────────── */}
      {showForm && (
        <div className="rounded-xl border border-amber-500/20 bg-[#0d1320] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white">Novo Ativo</h2>
            <button
              onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}
              className="rounded-lg p-1.5 text-[#6b7a8d] hover:text-white hover:bg-[#1a2332] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Name */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Nome do Ativo *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ex: Notebook Dell Latitude"
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Categoria *</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as AssetCategory }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Acquisition Date */}
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Data de Aquisição *</label>
              <input
                type="date"
                value={form.acquisitionDate}
                onChange={(e) => setForm((f) => ({ ...f, acquisitionDate: e.target.value }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            {/* Acquisition Value */}
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Valor de Aquisição (R$) *</label>
              <input
                type="number"
                value={form.acquisitionValue}
                onChange={(e) => setForm((f) => ({ ...f, acquisitionValue: e.target.value }))}
                placeholder="5000.00"
                min="0"
                step="0.01"
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AssetStatus }))}
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Localização</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Ex: Sala de reuniões, 2º andar"
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            {/* Responsible */}
            <div>
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Responsável</label>
              <input
                type="text"
                value={form.responsiblePerson}
                onChange={(e) => setForm((f) => ({ ...f, responsiblePerson: e.target.value }))}
                placeholder="Nome do responsável"
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-xs font-medium text-[#6b7a8d] mb-1">Observações</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Número de série, número patrimonial, detalhes adicionais..."
                className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
              />
            </div>
          </div>

          {/* Depreciation preview */}
          {form.acquisitionDate && form.acquisitionValue && (
            <div className="mt-4 rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-4 py-3">
              <p className="text-xs text-[#6b7a8d]">
                Valor atual estimado (depreciação linear,{' '}
                {USEFUL_LIFE[form.category]} anos úteis):{' '}
                <span className="text-amber-400 font-medium">
                  {formatCurrency(
                    calculateCurrentValue(
                      Math.round(parseFloat(form.acquisitionValue || '0') * 100),
                      form.acquisitionDate,
                      form.category,
                    ),
                  )}
                </span>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-[#1a2332]">
            <button
              onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}
              className="rounded-lg border border-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={!form.name.trim() || !form.acquisitionDate || !form.acquisitionValue}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              Salvar Ativo
            </button>
          </div>
        </div>
      )}

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b7a8d]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, local..."
            className="w-full rounded-lg border border-[#1a2332] bg-[#0d1320] pl-9 pr-3 py-2 text-sm text-white placeholder-[#4a5568] focus:border-amber-500/50 focus:outline-none"
          />
        </div>

        {/* Category + Status filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[#6b7a8d]" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as AssetCategory | 'all')}
            className="rounded-lg border border-[#1a2332] bg-[#0d1320] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
          >
            <option value="all">Todas as categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as AssetStatus | 'all')}
            className="rounded-lg border border-[#1a2332] bg-[#0d1320] px-3 py-2 text-sm text-white focus:border-amber-500/50 focus:outline-none"
          >
            <option value="all">Todos os status</option>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Asset List ────────────────────────────────────────────────────── */}
      {filteredAssets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#1a2332] bg-[#0d1320] py-16">
          <Building2 className="h-12 w-12 text-[#2a3342] mb-3" />
          <p className="text-[#6b7a8d] text-sm">
            {assets.length === 0
              ? 'Nenhum ativo cadastrado'
              : 'Nenhum ativo corresponde aos filtros'}
          </p>
          {assets.length === 0 && (
            <p className="text-xs text-[#4a5568] mt-1">
              Clique em "Novo Ativo" para começar a gerenciar o patrimônio
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssets.map((asset) => {
            const catConf = CATEGORY_CONFIG[asset.category];
            const statConf = STATUS_CONFIG[asset.status];
            const CatIcon = catConf.icon;
            const StatIcon = statConf.icon;
            const depreciationPct =
              asset.acquisitionValue > 0
                ? ((asset.acquisitionValue - asset.currentValue) / asset.acquisitionValue) * 100
                : 0;
            const retainedPct = 100 - depreciationPct;

            return (
              <div
                key={asset.id}
                className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 hover:border-amber-500/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: icon + name + badges */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${catConf.className}`}>
                      <CatIcon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{asset.name}</p>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${catConf.className}`}>
                          {catConf.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statConf.className}`}>
                          <StatIcon className="h-3 w-3" />
                          {statConf.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 mt-1 text-xs text-[#6b7a8d]">
                        {asset.location && <span>Local: {asset.location}</span>}
                        {asset.responsiblePerson && <span>Resp.: {asset.responsiblePerson}</span>}
                        <span>Adquirido em {formatDate(asset.acquisitionDate)}</span>
                      </div>
                      {asset.notes && (
                        <p className="text-xs text-[#4a5568] mt-1 truncate">{asset.notes}</p>
                      )}
                    </div>
                  </div>

                  {/* Right: values */}
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">Valor Atual</p>
                    <p className="text-lg font-bold text-amber-400">{formatCurrency(asset.currentValue)}</p>
                    <p className="text-xs text-[#4a5568]">
                      Aquisição: {formatCurrency(asset.acquisitionValue)}
                    </p>
                  </div>
                </div>

                {/* Depreciation bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#6b7a8d]">
                      Valor retido: {retainedPct.toFixed(1)}%
                    </span>
                    <span className="text-xs text-[#6b7a8d]">
                      Depreciado: {depreciationPct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-[#1a2332]">
                    <div
                      className="h-1.5 rounded-full bg-amber-500 transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, retainedPct))}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center justify-between pt-3 border-t border-[#1a2332]">
                  <p className="text-xs text-[#4a5568]">
                    Dep. anual: {formatCurrency(annualDepreciation(asset.acquisitionValue, asset.category))}
                    {' '}· Vida útil: {USEFUL_LIFE[asset.category]} anos
                  </p>
                  <div className="flex items-center gap-2">
                    {asset.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(asset.id, 'maintenance')}
                        className="rounded-lg border border-[#1a2332] px-2.5 py-1 text-xs text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/20 transition-colors"
                      >
                        Enviar p/ Manutenção
                      </button>
                    )}
                    {asset.status === 'maintenance' && (
                      <button
                        onClick={() => handleStatusChange(asset.id, 'active')}
                        className="rounded-lg border border-[#1a2332] px-2.5 py-1 text-xs text-[#6b7a8d] hover:text-green-400 hover:border-green-500/20 transition-colors"
                      >
                        Retornar p/ Ativo
                      </button>
                    )}
                    {(asset.status === 'active' || asset.status === 'maintenance') && (
                      <button
                        onClick={() => handleStatusChange(asset.id, 'sold')}
                        className="rounded-lg border border-[#1a2332] px-2.5 py-1 text-xs text-[#6b7a8d] hover:text-red-400 hover:border-red-500/20 transition-colors"
                      >
                        Marcar como Vendido
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(asset.id)}
                      className="rounded-lg border border-[#1a2332] p-1.5 text-[#6b7a8d] hover:text-red-400 hover:border-red-500/20 transition-colors"
                      title="Remover ativo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
