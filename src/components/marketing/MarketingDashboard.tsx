'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Eye,
  MousePointerClick,
  DollarSign,
  Instagram,
  Facebook,
  Search,
  MessageCircle,
  Heart,
  Share2,
  BarChart3,
  PieChart,
  Plus,
  Calendar,
  Megaphone,
  Target,
  Zap,
  Star,
  ExternalLink,
} from 'lucide-react';

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatNum = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
};

const kpiCards = [
  { label: 'Alcance Total', value: 45800, trend: 18.5, icon: Eye, color: 'text-[#0D9488]', bg: 'bg-[#0D9488]/10' },
  { label: 'Engajamento', value: 3420, trend: 12.3, icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
  { label: 'Cliques no Site', value: 1250, trend: 8.7, icon: MousePointerClick, color: 'text-blue-500', bg: 'bg-blue-50' },
  { label: 'Novos Leads', value: 86, trend: 22.4, icon: Users, color: 'text-[#D4A76A]', bg: 'bg-[#D4A76A]/10' },
  { label: 'Custo por Lead', value: 32.5, trend: -15.2, icon: Target, color: 'text-emerald-500', bg: 'bg-emerald-50', isCurrency: true },
  { label: 'ROI Geral', value: 340, trend: 25.1, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-50', suffix: '%' },
];

const socialStats = [
  {
    platform: 'Instagram',
    icon: Instagram,
    color: 'text-pink-500',
    bg: 'bg-gradient-to-br from-pink-50 to-purple-50',
    borderColor: 'border-pink-200',
    followers: 8450,
    followersTrend: 5.2,
    reach: 28500,
    engagement: 4.8,
    posts: 24,
  },
  {
    platform: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    followers: 5200,
    followersTrend: 2.1,
    reach: 12300,
    engagement: 2.3,
    posts: 18,
  },
  {
    platform: 'Google',
    icon: Search,
    color: 'text-green-600',
    bg: 'bg-green-50',
    borderColor: 'border-green-200',
    followers: 0,
    followersTrend: 0,
    reach: 15600,
    engagement: 3.1,
    posts: 0,
    isAds: true,
    clicks: 1250,
    impressions: 42000,
  },
];

const topContent = [
  { title: 'Antes e Depois - Clareamento', platform: 'Instagram', likes: 342, reach: 5200, type: 'Reels' },
  { title: '5 Dicas para Saude Bucal', platform: 'Instagram', likes: 289, reach: 4800, type: 'Carrossel' },
  { title: 'Depoimento Paciente - Implante', platform: 'Facebook', likes: 156, reach: 3400, type: 'Video' },
  { title: 'Promocao Limpeza + Avaliacao', platform: 'Instagram', likes: 198, reach: 4100, type: 'Post' },
  { title: 'Mitos sobre Aparelho Ortodontico', platform: 'Facebook', likes: 134, reach: 2900, type: 'Artigo' },
];

const roiByChannel = [
  { channel: 'Instagram Organico', invested: 1300, revenue: 8500, roi: 554 },
  { channel: 'Instagram Ads', invested: 2500, revenue: 12000, roi: 380 },
  { channel: 'Facebook Ads', invested: 1800, revenue: 6200, roi: 244 },
  { channel: 'Google Ads', invested: 3200, revenue: 18500, roi: 478 },
  { channel: 'WhatsApp', invested: 500, revenue: 4200, roi: 740 },
];

const demographics = [
  { label: '18-24', pct: 12 },
  { label: '25-34', pct: 28 },
  { label: '35-44', pct: 32 },
  { label: '45-54', pct: 18 },
  { label: '55+', pct: 10 },
];

const genderSplit = { female: 62, male: 38 };

const calendarDays = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const posts: { title: string; channel: string; color: string }[] = [];
  if (day === 2) posts.push({ title: 'Dica de Escovacao', channel: 'IG', color: 'bg-pink-400' });
  if (day === 5) posts.push({ title: 'Caso Clinico', channel: 'IG', color: 'bg-pink-400' }, { title: 'Artigo Blog', channel: 'FB', color: 'bg-blue-400' });
  if (day === 8) posts.push({ title: 'Promocao Mensal', channel: 'IG', color: 'bg-pink-400' });
  if (day === 10) posts.push({ title: 'Video Educativo', channel: 'FB', color: 'bg-blue-400' });
  if (day === 12) posts.push({ title: 'Depoimento', channel: 'IG', color: 'bg-pink-400' });
  if (day === 15) posts.push({ title: 'Antes/Depois', channel: 'IG', color: 'bg-pink-400' }, { title: 'Google Ad', channel: 'G', color: 'bg-green-400' });
  if (day === 18) posts.push({ title: 'Dica Nutricao', channel: 'IG', color: 'bg-pink-400' });
  if (day === 20) posts.push({ title: 'Story Bastidores', channel: 'IG', color: 'bg-pink-400' });
  if (day === 22) posts.push({ title: 'Caso Ortodontia', channel: 'FB', color: 'bg-blue-400' });
  if (day === 25) posts.push({ title: 'Reels Dica', channel: 'IG', color: 'bg-pink-400' }, { title: 'WhatsApp Blast', channel: 'WA', color: 'bg-emerald-400' });
  if (day === 28) posts.push({ title: 'Post Encerramento', channel: 'IG', color: 'bg-pink-400' });
  return { day, posts };
});

export default function MarketingDashboard() {
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Painel de Marketing</h1>
          <p className="text-sm text-gray-500">Sbarzi Odontologia e Saude</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Criar Campanha
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <Calendar className="w-4 h-4" /> Agendar Post
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
            <BarChart3 className="w-4 h-4" /> Ver Analytics
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <p className="text-xl font-bold text-gray-800">
                {kpi.isCurrency ? formatBRL(kpi.value) : `${formatNum(kpi.value)}${kpi.suffix || ''}`}
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5">{kpi.label}</p>
              <div className="flex items-center mt-1.5 text-xs">
                {kpi.trend >= 0 ? (
                  <ArrowUpRight className="w-3 h-3 text-emerald-500 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3 h-3 text-red-500 mr-0.5" />
                )}
                <span className={kpi.trend >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                  {Math.abs(kpi.trend)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Social Media Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {socialStats.map((social) => {
          const Icon = social.icon;
          return (
            <div key={social.platform} className={`rounded-xl border ${social.borderColor} p-5 shadow-sm ${social.bg}`}>
              <div className="flex items-center gap-3 mb-4">
                <Icon className={`w-6 h-6 ${social.color}`} />
                <h3 className="font-semibold text-gray-800">{social.platform}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {!social.isAds && (
                  <div>
                    <p className="text-xs text-gray-500">Seguidores</p>
                    <p className="text-lg font-bold text-gray-800">{formatNum(social.followers)}</p>
                    <span className="text-[10px] text-emerald-500">+{social.followersTrend}%</span>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-500">Alcance</p>
                  <p className="text-lg font-bold text-gray-800">{formatNum(social.reach)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Engajamento</p>
                  <p className="text-lg font-bold text-gray-800">{social.engagement}%</p>
                </div>
                {social.isAds ? (
                  <div>
                    <p className="text-xs text-gray-500">Cliques</p>
                    <p className="text-lg font-bold text-gray-800">{formatNum(social.clicks || 0)}</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-gray-500">Posts (mes)</p>
                    <p className="text-lg font-bold text-gray-800">{social.posts}</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-[#D4A76A]" />
            <h3 className="font-semibold text-gray-800">Conteudo em Destaque</h3>
          </div>
          <div className="space-y-3">
            {topContent.map((content, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 flex items-center justify-center text-sm font-bold text-[#0D9488]">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{content.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">{content.platform}</span>
                      <span className="text-[10px] text-gray-300">|</span>
                      <span className="text-[10px] text-gray-400">{content.type}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Heart className="w-3 h-3" /> {content.likes}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                    <Eye className="w-3 h-3" /> {formatNum(content.reach)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audience Demographics */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#0D9488]" />
            <h3 className="font-semibold text-gray-800">Demografia do Publico</h3>
          </div>

          {/* Gender Split */}
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 mb-2">Genero</p>
            <div className="flex h-4 rounded-full overflow-hidden">
              <div className="bg-pink-400" style={{ width: `${genderSplit.female}%` }} />
              <div className="bg-blue-400" style={{ width: `${genderSplit.male}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-xs">
              <span className="text-pink-500">Feminino {genderSplit.female}%</span>
              <span className="text-blue-500">Masculino {genderSplit.male}%</span>
            </div>
          </div>

          {/* Age Groups */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-3">Faixa Etaria</p>
            <div className="space-y-2.5">
              {demographics.map((demo) => (
                <div key={demo.label} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-12">{demo.label}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0D9488] rounded-full"
                      style={{ width: `${demo.pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-10 text-right">{demo.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ROI by Channel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-[#D4A76A]" />
          <h3 className="font-semibold text-gray-800">ROI por Canal</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2">Canal</th>
                <th className="text-right text-xs font-semibold text-gray-500 py-3 px-2">Investido</th>
                <th className="text-right text-xs font-semibold text-gray-500 py-3 px-2">Receita Gerada</th>
                <th className="text-right text-xs font-semibold text-gray-500 py-3 px-2">ROI</th>
                <th className="text-left text-xs font-semibold text-gray-500 py-3 px-2 w-40">Desempenho</th>
              </tr>
            </thead>
            <tbody>
              {roiByChannel.map((item) => {
                const maxRoi = Math.max(...roiByChannel.map((r) => r.roi));
                return (
                  <tr key={item.channel} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-2 text-sm font-medium text-gray-800">{item.channel}</td>
                    <td className="py-3 px-2 text-sm text-gray-600 text-right">{formatBRL(item.invested)}</td>
                    <td className="py-3 px-2 text-sm text-emerald-600 font-medium text-right">{formatBRL(item.revenue)}</td>
                    <td className="py-3 px-2 text-sm font-bold text-[#0D9488] text-right">{item.roi}%</td>
                    <td className="py-3 px-2">
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#0D9488]"
                          style={{ width: `${(item.roi / maxRoi) * 100}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mini Content Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#0D9488]" />
            <h3 className="font-semibold text-gray-800">Calendario de Conteudo - Junho 2025</h3>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-400" />
              <span className="text-gray-500">Instagram</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-gray-500">Facebook</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-gray-500">Google</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-gray-500">WhatsApp</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
          ))}
          {/* Empty cells for starting day (June 2025 starts on Sunday) */}
          {calendarDays.map((d) => (
            <div key={d.day} className="min-h-[60px] p-1 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors">
              <span className="text-[10px] text-gray-500">{d.day}</span>
              <div className="mt-0.5 space-y-0.5">
                {d.posts.map((post, idx) => (
                  <div
                    key={idx}
                    className={`${post.color} text-white text-[8px] px-1 py-0.5 rounded truncate`}
                    title={post.title}
                  >
                    {post.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
