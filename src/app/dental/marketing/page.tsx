'use client';

import { useState } from 'react';
import {
  Megaphone, TrendingUp, Eye, MousePointer, UserPlus, DollarSign,
  Instagram, Facebook, Globe, MessageCircle, ArrowUpRight, ArrowDownRight,
  Calendar, Sparkles, ChevronRight, BarChart3, Heart, Share2,
} from 'lucide-react';
import Link from 'next/link';

const MOCK_METRICS = [
  { label: 'Impressões', value: '45.2K', change: '+18%', trend: 'up', icon: Eye, color: 'blue' },
  { label: 'Cliques', value: '2.8K', change: '+12%', trend: 'up', icon: MousePointer, color: 'teal' },
  { label: 'Novos Seguidores', value: '186', change: '+24%', trend: 'up', icon: UserPlus, color: 'green' },
  { label: 'ROI', value: '340%', change: '+8%', trend: 'up', icon: DollarSign, color: 'amber' },
];

const CHANNEL_STATS = [
  { name: 'Instagram', icon: Instagram, followers: '4.118', engagement: '5.2%', posts: 12, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  { name: 'Facebook', icon: Facebook, followers: '3.145', engagement: '3.1%', posts: 8, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { name: 'Google Ads', icon: Globe, followers: '-', engagement: '2.8%', posts: 5, color: 'text-green-400', bg: 'bg-green-500/10' },
  { name: 'WhatsApp', icon: MessageCircle, followers: '890', engagement: '45%', posts: 20, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
];

const TOP_CONTENT = [
  { title: 'Antes e Depois - Facetas de Porcelana', platform: 'Instagram', reach: '12.5K', engagement: '8.2%', type: 'Reels' },
  { title: 'Dica: Como Escovar os Dentes Corretamente', platform: 'Instagram', reach: '8.3K', engagement: '6.1%', type: 'Carrossel' },
  { title: 'Depoimento - Paciente Maria Silva', platform: 'Facebook', reach: '5.1K', engagement: '4.8%', type: 'Vídeo' },
  { title: 'Promoção Clareamento Dental', platform: 'Instagram', reach: '15.2K', engagement: '3.5%', type: 'Story' },
  { title: 'Implantes Dentários: Tudo que Precisa Saber', platform: 'Facebook', reach: '4.7K', engagement: '5.5%', type: 'Artigo' },
];

const WEEKLY_REACH = [
  { day: 'Seg', value: 3200 },
  { day: 'Ter', value: 4100 },
  { day: 'Qua', value: 3800 },
  { day: 'Qui', value: 5200 },
  { day: 'Sex', value: 6100 },
  { day: 'Sáb', value: 7800 },
  { day: 'Dom', value: 4500 },
];

const maxReach = Math.max(...WEEKLY_REACH.map((d) => d.value));

export default function MarketingPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-700">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
            Dashboard de Marketing
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">Performance de marketing digital</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-[#111827] border border-[#1e293b] overflow-hidden">
            {(['week', 'month', 'quarter'] as const).map((p) => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-xs font-medium transition-all ${period === p ? 'bg-teal-500/20 text-teal-400' : 'text-[#6b7a8d] hover:text-white'}`}>
                {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Trimestre'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {MOCK_METRICS.map((m) => {
          const Icon = m.icon;
          const colorMap: Record<string, { card: string; icon: string }> = {
            blue: { card: 'from-blue-500/20 to-blue-500/5 border-blue-500/20', icon: 'text-blue-400' },
            teal: { card: 'from-teal-500/20 to-teal-500/5 border-teal-500/20', icon: 'text-teal-400' },
            green: { card: 'from-green-500/20 to-green-500/5 border-green-500/20', icon: 'text-green-400' },
            amber: { card: 'from-amber-500/20 to-amber-500/5 border-amber-500/20', icon: 'text-amber-400' },
          };
          const c = colorMap[m.color];
          return (
            <div key={m.label} className={`rounded-2xl bg-gradient-to-br ${c.card} border p-5 hover:scale-[1.02] transition-all`}>
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-5 w-5 ${c.icon}`} />
                <span className="flex items-center gap-1 text-xs font-medium text-green-400">
                  <ArrowUpRight className="h-3 w-3" />{m.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-white">{m.value}</p>
              <p className="text-xs text-[#6b7a8d] mt-1">{m.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Channel Performance */}
        <div className="col-span-2 rounded-2xl bg-[#111827] border border-[#1e293b] p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <Share2 className="h-4 w-4 text-pink-400" />
            Performance por Canal
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {CHANNEL_STATS.map((ch) => {
              const Icon = ch.icon;
              return (
                <div key={ch.name} className="rounded-xl bg-[#0d1320] border border-[#1a2332] p-4 hover:border-[#2d3748] transition-all">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${ch.bg} mb-3`}>
                    <Icon className={`h-5 w-5 ${ch.color}`} />
                  </div>
                  <p className="text-sm font-semibold text-white">{ch.name}</p>
                  <div className="mt-3 space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[#4a5568]">Seguidores</span>
                      <span className="text-white">{ch.followers}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[#4a5568]">Engajamento</span>
                      <span className="text-teal-400">{ch.engagement}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-[#4a5568]">Posts/Mês</span>
                      <span className="text-white">{ch.posts}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reach Chart */}
        <div className="rounded-2xl bg-[#111827] border border-[#1e293b] p-6">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-blue-400" />
            Alcance Semanal
          </h3>
          <div className="flex items-end justify-between gap-2 h-36">
            {WEEKLY_REACH.map((d) => {
              const h = (d.value / maxReach) * 100;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[9px] text-[#4a5568] font-mono">{(d.value / 1000).toFixed(1)}k</span>
                  <div className="w-full rounded-t-lg bg-gradient-to-t from-pink-600 to-pink-400 hover:from-pink-500 hover:to-pink-300 transition-all"
                    style={{ height: `${h}%`, minHeight: '4px' }} />
                  <span className="text-[9px] text-[#4a5568]">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Top Content */}
        <div className="col-span-2 rounded-2xl bg-[#111827] border border-[#1e293b] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-400" />
              Conteúdo de Melhor Performance
            </h3>
          </div>
          <div className="space-y-2">
            {TOP_CONTENT.map((content, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl bg-[#0d1320] border border-[#1a2332] p-3 hover:border-[#2d3748] transition-all">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pink-500/10 text-xs font-bold text-pink-400">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{content.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-[#4a5568]">{content.platform}</span>
                    <span className="text-[10px] text-[#4a5568]">{content.type}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-white">{content.reach}</p>
                  <p className="text-[10px] text-teal-400">{content.engagement} engaj.</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#111827] border border-[#1e293b] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Ações de Marketing</h3>
            <div className="space-y-2">
              {[
                { label: 'Nova Campanha', href: '/dental/campaigns', color: 'text-pink-400' },
                { label: 'Calendário de Conteúdo', href: '/dental/content', color: 'text-blue-400' },
                { label: 'Automações', href: '/dental/automation', color: 'text-purple-400' },
              ].map((action) => (
                <Link key={action.label} href={action.href}
                  className="flex items-center gap-3 rounded-xl bg-[#0d1320] border border-[#1a2332] p-3 hover:border-teal-500/20 transition-all">
                  <Megaphone className={`h-4 w-4 ${action.color}`} />
                  <span className="text-xs text-[#8899aa]">{action.label}</span>
                  <ChevronRight className="h-3 w-3 text-[#4a5568] ml-auto" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-[#D4A76A]/10 to-[#D4A76A]/5 border border-[#D4A76A]/20 p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-[#D4A76A]" />
              Sugestões IA
            </h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-xs text-[#c0c8d4] leading-relaxed">
                  Publique mais Reels de antes/depois. Esse formato tem 3x mais alcance que posts estáticos no seu perfil.
                </p>
              </div>
              <div className="rounded-xl bg-black/20 p-3">
                <p className="text-xs text-[#c0c8d4] leading-relaxed">
                  Sábado às 10h é o melhor horário de publicação para o seu público. Engajamento 42% maior.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
