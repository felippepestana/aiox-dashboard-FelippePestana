'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  List,
  LayoutGrid,
  Hash,
  Video,
  Mail,
  BookOpen,
  Megaphone,
} from 'lucide-react';
import { useLegalMarketingStore } from '@/stores/legal-marketing-store';
import type { LegalCampaignChannel, LegalArea, LegalContentItem } from '@/types/legal';

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNEL_LABELS: Record<LegalCampaignChannel, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  blog: 'Blog',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  google_ads: 'Google Ads',
};

const CONTENT_TYPES: { value: string; label: string; icon: React.ElementType }[] = [
  { value: 'blog_post', label: 'Artigo de Blog', icon: BookOpen },
  { value: 'social', label: 'Post Redes Sociais', icon: Hash },
  { value: 'newsletter', label: 'Newsletter', icon: Mail },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'webinar', label: 'Webinar', icon: Megaphone },
];

const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  idea: { label: 'Ideia', bg: 'bg-[#1a2332]', text: 'text-[#6b7a8d]', dot: 'bg-[#6b7a8d]' },
  draft: { label: 'Rascunho', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
  review: { label: 'Revisao', bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  approved: { label: 'Aprovado', bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-500' },
  published: { label: 'Publicado', bg: 'bg-purple-500/10', text: 'text-purple-400', dot: 'bg-purple-500' },
};

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const AREAS: { value: LegalArea | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas as Areas' },
  { value: 'civil', label: 'Civil' },
  { value: 'trabalhista', label: 'Trabalhista' },
  { value: 'tributario', label: 'Tributario' },
  { value: 'penal', label: 'Penal' },
  { value: 'empresarial', label: 'Empresarial' },
  { value: 'consumidor', label: 'Consumidor' },
  { value: 'familia', label: 'Familia' },
  { value: 'digital', label: 'Digital' },
  { value: 'ambiental', label: 'Ambiental' },
];

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CONTENT: LegalContentItem[] = [
  { id: 'c1', title: '5 Direitos do Consumidor Essenciais', area: 'consumidor', channel: 'instagram', status: 'published', oabCompliant: true, scheduledDate: '2026-06-01', publishedDate: '2026-06-01', description: 'Carrossel com dicas praticas', content: '', createdAt: '2026-05-20', updatedAt: '2026-06-01' },
  { id: 'c2', title: 'Como a LGPD Impacta Sua Empresa', area: 'digital', channel: 'linkedin', status: 'published', oabCompliant: true, scheduledDate: '2026-06-03', publishedDate: '2026-06-03', description: 'Artigo informativo', content: '', createdAt: '2026-05-25', updatedAt: '2026-06-03' },
  { id: 'c3', title: 'Reforma Tributaria: O Que Muda Para PMEs', area: 'tributario', channel: 'blog', status: 'approved', oabCompliant: true, scheduledDate: '2026-06-06', description: 'Analise completa das mudancas', content: '', createdAt: '2026-05-28', updatedAt: '2026-06-02' },
  { id: 'c4', title: 'Webinar: Direito Trabalhista na Era Digital', area: 'trabalhista', channel: 'youtube', status: 'review', oabCompliant: true, scheduledDate: '2026-06-10', description: 'Live de 1h com perguntas', content: '', createdAt: '2026-05-30', updatedAt: '2026-06-01' },
  { id: 'c5', title: 'Newsletter: Novidades Juridicas de Junho', area: 'empresarial', channel: 'email', status: 'draft', oabCompliant: true, scheduledDate: '2026-06-12', description: 'Compilado mensal', content: '', createdAt: '2026-06-01', updatedAt: '2026-06-01' },
  { id: 'c6', title: 'Guia Completo de Divorcio Consensual', area: 'familia', channel: 'blog', status: 'review', oabCompliant: false, scheduledDate: '2026-06-14', description: 'Guia passo-a-passo', content: '', createdAt: '2026-05-25', updatedAt: '2026-06-01' },
  { id: 'c7', title: 'Live: Planejamento Sucessorio', area: 'familia', channel: 'instagram', status: 'idea', oabCompliant: true, scheduledDate: '2026-06-17', description: 'Live interativa', content: '', createdAt: '2026-06-01', updatedAt: '2026-06-01' },
  { id: 'c8', title: 'Dicas de Compliance para Startups', area: 'empresarial', channel: 'linkedin', status: 'approved', oabCompliant: true, scheduledDate: '2026-06-19', description: 'Post informativo com checklist', content: '', createdAt: '2026-05-28', updatedAt: '2026-06-02' },
  { id: 'c9', title: 'Video: Seus Direitos em Caso de Demissao', area: 'trabalhista', channel: 'youtube', status: 'draft', oabCompliant: false, scheduledDate: '2026-06-21', description: 'Video curto explicativo', content: '', createdAt: '2026-06-01', updatedAt: '2026-06-01' },
  { id: 'c10', title: 'Carrossel: Tipos de Contrato Empresarial', area: 'empresarial', channel: 'instagram', status: 'idea', oabCompliant: true, scheduledDate: '2026-06-24', description: 'Visual com 6 slides', content: '', createdAt: '2026-06-01', updatedAt: '2026-06-01' },
  { id: 'c11', title: 'Artigo: Responsabilidade Civil Digital', area: 'digital', channel: 'blog', status: 'draft', oabCompliant: true, scheduledDate: '2026-06-26', description: 'Abordagem tecnica', content: '', createdAt: '2026-06-01', updatedAt: '2026-06-01' },
  { id: 'c12', title: 'Prazos Processuais Importantes', area: 'civil', channel: 'whatsapp', status: 'approved', oabCompliant: true, scheduledDate: '2026-06-28', description: 'Infografico compartilhavel', content: '', createdAt: '2026-05-28', updatedAt: '2026-06-02' },
];

// ─── Helper ────────────────────────────────────────────────────────────────────

type ContentEntry = LegalContentItem;

const EMPTY_FORM = {
  title: '',
  type: 'blog_post',
  channel: 'blog' as LegalCampaignChannel,
  area: 'civil' as LegalArea,
  scheduledDate: '',
  description: '',
  oabCompliant: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContentPage() {
  const { contentItems, addContentItem, updateContentItem } = useLegalMarketingStore();
  const [channelFilter, setChannelFilter] = useState<LegalCampaignChannel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 5, 1)); // June 2026
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedItem, setSelectedItem] = useState<ContentEntry | null>(null);

  const storeHasData = contentItems.length > 0;
  const displayContent: ContentEntry[] = storeHasData ? contentItems : MOCK_CONTENT;

  const filtered = useMemo(() => {
    return displayContent.filter((c) => {
      if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      return true;
    });
  }, [displayContent, channelFilter, statusFilter]);

  // Calendar helpers
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  function getContentForDay(day: number): ContentEntry[] {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return filtered.filter((c) => (c.scheduledDate ?? '').startsWith(dateStr));
  }

  // Stats
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of Object.keys(STATUS_META)) {
      counts[s] = filtered.filter((c) => c.status === s).length;
    }
    return counts;
  }, [filtered]);

  const publishedThisMonth = filtered.filter((c) => {
    if (c.status !== 'published') return false;
    const d = c.publishedDate ?? c.scheduledDate ?? '';
    return d.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`);
  }).length;

  const oabOk = filtered.filter((c) => c.oabCompliant).length;
  const oabFail = filtered.filter((c) => !c.oabCompliant).length;

  function handleAdd() {
    if (!form.title.trim()) return;
    addContentItem({
      title: form.title,
      description: form.description,
      area: form.area,
      channel: form.channel,
      status: 'idea',
      scheduledDate: form.scheduledDate || undefined,
      content: '',
      oabCompliant: form.oabCompliant,
    });
    setForm(EMPTY_FORM);
    setShowAddModal(false);
  }

  function cycleStatus(id: string, current: string) {
    if (!storeHasData) return;
    const order = ['idea', 'draft', 'review', 'approved', 'published'];
    const idx = order.indexOf(current);
    if (idx < order.length - 1) {
      updateContentItem(id, { status: order[idx + 1] as LegalContentItem['status'] });
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="h-7 w-7 text-amber-400" />
            Calendario de Conteudo
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Calendario editorial e publicacoes conforme OAB
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-[#1a2332] overflow-hidden">
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-[#0d1320] text-[#6b7a8d] hover:text-white'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Calendario
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-amber-500/10 text-amber-400'
                  : 'bg-[#0d1320] text-[#6b7a8d] hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
              Lista
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            Novo Conteudo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value as LegalCampaignChannel | 'all')}
          className="rounded-lg bg-[#0d1320] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
        >
          <option value="all">Todos os Canais</option>
          {(Object.keys(CHANNEL_LABELS) as LegalCampaignChannel[]).map((ch) => (
            <option key={ch} value={ch}>{CHANNEL_LABELS[ch]}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg bg-[#0d1320] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
        >
          <option value="all">Todos os Status</option>
          {Object.entries(STATUS_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {Object.entries(statusCounts).map(([key, count]) => {
          const meta = STATUS_META[key];
          return (
            <div
              key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${
                statusFilter === key
                  ? 'border-amber-500/40 bg-amber-500/5'
                  : 'border-[#1a2332] bg-[#0d1320] hover:border-[#2a3342]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">{meta.label}</p>
              </div>
              <p className="text-2xl font-bold text-white">{count}</p>
            </div>
          );
        })}
        <div className="rounded-xl border border-green-500/20 bg-[#0d1320] p-4">
          <p className="text-[10px] text-green-400 uppercase tracking-wider mb-1">OAB OK</p>
          <p className="text-2xl font-bold text-green-400">{oabOk}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-[#0d1320] p-4">
          <p className="text-[10px] text-red-400 uppercase tracking-wider mb-1">Revisar OAB</p>
          <p className="text-2xl font-bold text-red-400">{oabFail}</p>
        </div>
      </div>

      {/* Performance summary */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 flex items-center gap-6 flex-wrap">
        <div>
          <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Publicados este mes</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">{publishedThisMonth}</p>
        </div>
        <div className="h-10 w-px bg-[#1a2332] hidden sm:block" />
        <div>
          <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Total no Calendario</p>
          <p className="text-2xl font-bold text-white mt-1">{filtered.length}</p>
        </div>
        <div className="h-10 w-px bg-[#1a2332] hidden sm:block" />
        <div>
          <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider">Taxa OAB</p>
          <p className="text-2xl font-bold text-white mt-1">
            {filtered.length > 0 ? Math.round((oabOk / filtered.length) * 100) : 0}%
          </p>
        </div>
        <div className="h-10 w-px bg-[#1a2332] hidden sm:block" />
        {/* Channel breakdown mini-bars */}
        <div className="flex-1 min-w-[200px]">
          <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-2">Por Canal</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CHANNEL_LABELS) as LegalCampaignChannel[]).map((ch) => {
              const count = filtered.filter((c) => c.channel === ch).length;
              if (count === 0) return null;
              return (
                <span key={ch} className="rounded-full bg-[#1a2332] px-2.5 py-1 text-[10px] text-[#6b7a8d]">
                  {CHANNEL_LABELS[ch]}: <span className="text-white font-semibold">{count}</span>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-400" />
              Calendario Editorial
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                className="rounded-lg bg-[#1a2332] p-1.5 text-[#6b7a8d] hover:text-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-white capitalize min-w-[160px] text-center">{monthLabel}</span>
              <button
                onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                className="rounded-lg bg-[#1a2332] p-1.5 text-[#6b7a8d] hover:text-white transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-px">
            {DAYS_OF_WEEK.map((d) => (
              <div key={d} className="text-center py-2">
                <span className="text-[10px] text-[#6b7a8d] uppercase font-medium">{d}</span>
              </div>
            ))}
            {calendarDays.map((day, idx) => {
              const items = day ? getContentForDay(day) : [];
              const today = new Date();
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              return (
                <div
                  key={idx}
                  className={`min-h-[90px] border p-1.5 transition-colors ${
                    day ? 'bg-[#0a0f1a] hover:bg-[#0a0f1a]/80' : 'bg-[#0d1320]/30'
                  } ${isToday ? 'border-amber-500/40' : 'border-[#1a2332]'}`}
                >
                  {day && (
                    <>
                      <span
                        className={`text-[10px] font-medium leading-none ${
                          isToday
                            ? 'flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400'
                            : 'text-[#6b7a8d]'
                        }`}
                      >
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {items.slice(0, 3).map((item) => {
                          const meta = STATUS_META[item.status] ?? STATUS_META.idea;
                          return (
                            <button
                              key={item.id}
                              onClick={() => setSelectedItem(item)}
                              className={`w-full text-left rounded px-1 py-0.5 text-[9px] truncate ${meta.bg} ${meta.text} hover:opacity-80 transition-opacity`}
                              title={item.title}
                            >
                              {item.title}
                            </button>
                          );
                        })}
                        {items.length > 3 && (
                          <p className="text-[9px] text-[#6b7a8d] pl-1">+{items.length - 3} mais</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#1a2332]">
            {Object.entries(STATUS_META).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${v.dot}`} />
                <span className="text-[10px] text-[#6b7a8d]">{v.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <List className="h-5 w-5 text-amber-400" />
            Lista de Conteudo
          </h2>
          <div className="space-y-2">
            {filtered
              .slice()
              .sort((a, b) => (a.scheduledDate ?? '').localeCompare(b.scheduledDate ?? ''))
              .map((item) => {
                const meta = STATUS_META[item.status] ?? STATUS_META.idea;
                const TypeIcon =
                  CONTENT_TYPES.find((t) => item.title.toLowerCase().includes(t.value))?.icon ?? FileText;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="flex items-center gap-4 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-3 hover:border-[#2a3342] transition-colors cursor-pointer"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d] capitalize">
                          {item.area}
                        </span>
                        <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d]">
                          {CHANNEL_LABELS[item.channel]}
                        </span>
                        {item.description && (
                          <span className="text-[10px] text-[#6b7a8d] truncate max-w-[200px] hidden sm:block">
                            {item.description}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.text}`}>
                        {meta.label}
                      </span>

                      {item.oabCompliant ? (
                        <span className="flex items-center gap-1 text-[10px] text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          <span className="hidden sm:inline">OAB</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] text-red-400">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="hidden sm:inline">Revisar</span>
                        </span>
                      )}

                      <span className="text-[10px] text-[#6b7a8d] whitespace-nowrap">
                        {item.scheduledDate?.slice(0, 10) ?? '—'}
                      </span>
                    </div>
                  </div>
                );
              })}

            {filtered.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#1a2332] p-8 text-center">
                <p className="text-sm text-[#6b7a8d]">Nenhum conteudo encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden">
            <div className="flex items-start justify-between p-5 border-b border-[#1a2332]">
              <div className="flex-1 min-w-0 pr-3">
                <h2 className="text-base font-semibold text-white">{selectedItem.title}</h2>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d] capitalize">
                    {selectedItem.area}
                  </span>
                  <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d]">
                    {CHANNEL_LABELS[selectedItem.channel]}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_META[selectedItem.status]?.bg} ${STATUS_META[selectedItem.status]?.text}`}>
                    {STATUS_META[selectedItem.status]?.label}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedItem(null)} className="text-[#6b7a8d] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {selectedItem.description && (
                <div className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] p-3">
                  <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Descricao</p>
                  <p className="text-sm text-white">{selectedItem.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] p-3">
                  <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Data Agendada</p>
                  <p className="text-sm text-white">{selectedItem.scheduledDate?.slice(0, 10) ?? '—'}</p>
                </div>
                <div className="rounded-lg bg-[#0a0f1a] border border-[#1a2332] p-3">
                  <p className="text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Publicado em</p>
                  <p className="text-sm text-white">{selectedItem.publishedDate?.slice(0, 10) ?? '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedItem.oabCompliant ? (
                  <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-2 flex-1">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-400">Em conformidade com a OAB</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 flex-1">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-sm text-red-400">Revisar conformidade OAB</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 pb-5 flex items-center gap-2">
              {storeHasData && selectedItem.status !== 'published' && (
                <button
                  onClick={() => {
                    cycleStatus(selectedItem.id, selectedItem.status);
                    setSelectedItem(null);
                  }}
                  className="flex items-center gap-2 rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20"
                >
                  Avancar Status
                </button>
              )}
              <button
                onClick={() => setSelectedItem(null)}
                className="ml-auto rounded-lg bg-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Content Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-400" />
                Novo Conteudo
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#6b7a8d] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titulo *"
                className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50"
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Tipo de Conteudo</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {CONTENT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Plataforma</label>
                  <select
                    value={form.channel}
                    onChange={(e) => setForm({ ...form, channel: e.target.value as LegalCampaignChannel })}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {(Object.keys(CHANNEL_LABELS) as LegalCampaignChannel[]).map((ch) => (
                      <option key={ch} value={ch}>{CHANNEL_LABELS[ch]}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Area Juridica</label>
                  <select
                    value={form.area}
                    onChange={(e) => setForm({ ...form, area: e.target.value as LegalArea })}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  >
                    {AREAS.filter((a) => a.value !== 'all').map((a) => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#6b7a8d] uppercase tracking-wider mb-1">Data Agendada</label>
                  <input
                    type="date"
                    value={form.scheduledDate}
                    onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                    className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descricao (objetivo, formato, notas...)"
                rows={3}
                className="w-full rounded-lg bg-[#0a0f1a] border border-[#1a2332] px-3 py-2 text-sm text-white placeholder:text-[#6b7a8d] focus:outline-none focus:border-amber-500/50 resize-none"
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.oabCompliant}
                  onChange={(e) => setForm({ ...form, oabCompliant: e.target.checked })}
                  className="rounded border-[#1a2332] bg-[#0a0f1a] text-amber-500"
                />
                <span className="text-sm text-[#6b7a8d]">Conteudo em conformidade com o Codigo de Etica da OAB</span>
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg bg-[#1a2332] px-4 py-2 text-sm text-[#6b7a8d] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAdd}
                disabled={!form.title.trim()}
                className="rounded-lg bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
