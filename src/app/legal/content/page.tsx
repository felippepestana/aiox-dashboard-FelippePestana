'use client';

import { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useLegalMarketingStore } from '@/stores/legal-marketing-store';
import type { LegalCampaignChannel } from '@/types/legal';

const CHANNEL_LABELS: Record<LegalCampaignChannel, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  blog: 'Blog',
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  google_ads: 'Google Ads',
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  idea: { label: 'Ideia', color: 'bg-[#1a2332] text-[#6b7a8d]' },
  draft: { label: 'Rascunho', color: 'bg-blue-500/10 text-blue-400' },
  review: { label: 'Revisao', color: 'bg-yellow-500/10 text-yellow-400' },
  approved: { label: 'Aprovado', color: 'bg-green-500/10 text-green-400' },
  published: { label: 'Publicado', color: 'bg-purple-500/10 text-purple-400' },
};

interface ContentEntry {
  id: string;
  title: string;
  area: string;
  channel: LegalCampaignChannel;
  status: string;
  oabCompliant: boolean;
  scheduledDate: string;
}

const MOCK_CONTENT: ContentEntry[] = [
  { id: 'c1', title: '5 Direitos do Consumidor que Voce Nao Conhece', area: 'consumidor', channel: 'instagram', status: 'published', oabCompliant: true, scheduledDate: '2026-04-01' },
  { id: 'c2', title: 'Como a LGPD Impacta Sua Empresa', area: 'digital', channel: 'linkedin', status: 'published', oabCompliant: true, scheduledDate: '2026-04-03' },
  { id: 'c3', title: 'Reforma Tributaria: O Que Muda Para PMEs', area: 'tributario', channel: 'blog', status: 'approved', oabCompliant: true, scheduledDate: '2026-04-05' },
  { id: 'c4', title: 'Webinar: Direito Trabalhista na Era Digital', area: 'trabalhista', channel: 'youtube', status: 'review', oabCompliant: true, scheduledDate: '2026-04-08' },
  { id: 'c5', title: 'Newsletter: Novidades Juridicas de Abril', area: 'empresarial', channel: 'email', status: 'draft', oabCompliant: true, scheduledDate: '2026-04-10' },
  { id: 'c6', title: 'Guia Completo de Divorcio Consensual', area: 'familia', channel: 'blog', status: 'review', oabCompliant: false, scheduledDate: '2026-04-12' },
  { id: 'c7', title: 'Live: Planejamento Sucessorio', area: 'familia', channel: 'instagram', status: 'idea', oabCompliant: true, scheduledDate: '2026-04-15' },
  { id: 'c8', title: 'Dicas de Compliance para Startups', area: 'empresarial', channel: 'linkedin', status: 'approved', oabCompliant: true, scheduledDate: '2026-04-17' },
  { id: 'c9', title: 'Video: Seus Direitos em Caso de Demissao', area: 'trabalhista', channel: 'youtube', status: 'draft', oabCompliant: false, scheduledDate: '2026-04-20' },
  { id: 'c10', title: 'Carrossel: Tipos de Contrato Empresarial', area: 'empresarial', channel: 'instagram', status: 'idea', oabCompliant: true, scheduledDate: '2026-04-22' },
  { id: 'c11', title: 'Artigo: Responsabilidade Civil Digital', area: 'digital', channel: 'blog', status: 'draft', oabCompliant: true, scheduledDate: '2026-04-25' },
  { id: 'c12', title: 'Infografico: Prazos Processuais Importantes', area: 'civil', channel: 'whatsapp', status: 'approved', oabCompliant: true, scheduledDate: '2026-04-28' },
];

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export default function ContentPage() {
  const { contentItems } = useLegalMarketingStore();
  const [channelFilter, setChannelFilter] = useState<LegalCampaignChannel | 'all'>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 3, 1)); // April 2026

  const storeHasData = contentItems.length > 0;
  const displayContent: ContentEntry[] = storeHasData
    ? contentItems.map((c) => ({
        id: c.id,
        title: c.title,
        area: c.area,
        channel: c.channel,
        status: c.status,
        oabCompliant: c.oabCompliant,
        scheduledDate: c.scheduledDate ?? c.createdAt,
      }))
    : MOCK_CONTENT;

  const filtered = useMemo(() => {
    if (channelFilter === 'all') return displayContent;
    return displayContent.filter((c) => c.channel === channelFilter);
  }, [displayContent, channelFilter]);

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
    return filtered.filter((c) => c.scheduledDate === dateStr);
  }

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
  }

  const statusCounts = {
    idea: filtered.filter((c) => c.status === 'idea').length,
    draft: filtered.filter((c) => c.status === 'draft').length,
    review: filtered.filter((c) => c.status === 'review').length,
    approved: filtered.filter((c) => c.status === 'approved').length,
    published: filtered.filter((c) => c.status === 'published').length,
  };

  const oabOk = filtered.filter((c) => c.oabCompliant).length;
  const oabFail = filtered.filter((c) => !c.oabCompliant).length;

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <FileText className="h-7 w-7 text-amber-400" />
            Gestao de Conteudo Juridico
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">
            Calendario editorial e publicacoes conforme OAB
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-[#6b7a8d]" />
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value as LegalCampaignChannel | 'all')}
            className="rounded-lg bg-[#0d1320] border border-[#1a2332] px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50"
          >
            <option value="all">Todos os Canais</option>
            {(Object.keys(CHANNEL_LABELS) as LegalCampaignChannel[]).map((ch) => (
              <option key={ch} value={ch}>
                {CHANNEL_LABELS[ch]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {Object.entries(statusCounts).map(([key, count]) => (
          <div key={key} className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4">
            <p className="text-xs text-[#6b7a8d] uppercase tracking-wider">{STATUS_META[key].label}</p>
            <p className="text-2xl font-bold text-white mt-1">{count}</p>
          </div>
        ))}
        <div className="rounded-xl border border-green-500/20 bg-[#0d1320] p-4">
          <p className="text-xs text-green-400 uppercase tracking-wider">OAB OK</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{oabOk}</p>
        </div>
        <div className="rounded-xl border border-red-500/20 bg-[#0d1320] p-4">
          <p className="text-xs text-red-400 uppercase tracking-wider">OAB Pendente</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{oabFail}</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-400" />
            Calendario Editorial
          </h2>
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="rounded-lg bg-[#1a2332] p-1.5 text-[#6b7a8d] hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-white capitalize min-w-[150px] text-center">{monthLabel}</span>
            <button onClick={nextMonth} className="rounded-lg bg-[#1a2332] p-1.5 text-[#6b7a8d] hover:text-white transition-colors">
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
            const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

            return (
              <div
                key={idx}
                className={`min-h-[80px] border border-[#1a2332] p-1.5 ${
                  day ? 'bg-[#0a0f1a]' : 'bg-[#0d1320]/30'
                } ${isToday ? 'border-amber-500/30' : ''}`}
              >
                {day && (
                  <>
                    <span className={`text-[10px] font-medium ${isToday ? 'text-amber-400' : 'text-[#6b7a8d]'}`}>
                      {day}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className={`rounded px-1 py-0.5 text-[9px] truncate ${STATUS_META[item.status]?.color ?? 'bg-[#1a2332] text-[#6b7a8d]'}`}
                          title={item.title}
                        >
                          {item.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Items List */}
      <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Itens de Conteudo</h2>
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-3 hover:border-[#2a3342] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d] capitalize">
                    {item.area}
                  </span>
                  <span className="rounded-full bg-[#1a2332] px-2 py-0.5 text-[10px] text-[#6b7a8d]">
                    {CHANNEL_LABELS[item.channel]}
                  </span>
                </div>
              </div>

              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STATUS_META[item.status]?.color ?? ''}`}>
                {STATUS_META[item.status]?.label ?? item.status}
              </span>

              {item.oabCompliant ? (
                <span className="flex items-center gap-1 text-[10px] text-green-400">
                  <CheckCircle className="h-3 w-3" /> OAB
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] text-red-400">
                  <AlertTriangle className="h-3 w-3" /> OAB
                </span>
              )}

              <span className="text-[10px] text-[#6b7a8d] whitespace-nowrap">
                {item.scheduledDate}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
