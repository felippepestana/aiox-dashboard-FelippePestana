'use client';

import { useState, useMemo } from 'react';
import {
  Calendar, Plus, ChevronLeft, ChevronRight, Instagram, Facebook,
  Globe, MessageCircle, X, Clock, Image as ImageIcon, Video,
  FileText, Sparkles, Eye,
} from 'lucide-react';

interface Post {
  id: string;
  title: string;
  platform: string;
  type: 'image' | 'video' | 'carousel' | 'story' | 'article';
  status: 'draft' | 'scheduled' | 'published';
  scheduledAt: string;
  content: string;
}

const MOCK_POSTS: Post[] = [
  { id: '1', title: 'Antes e Depois - Clareamento', platform: 'instagram', type: 'carousel', status: 'scheduled', scheduledAt: '2026-03-14T10:00', content: 'Transformação incrível!' },
  { id: '2', title: 'Dica: Escovação Correta', platform: 'instagram', type: 'video', status: 'scheduled', scheduledAt: '2026-03-15T09:00', content: 'Você sabia que...' },
  { id: '3', title: 'Depoimento Paciente', platform: 'facebook', type: 'video', status: 'scheduled', scheduledAt: '2026-03-16T14:00', content: 'Conheça a história...' },
  { id: '4', title: 'Promoção Limpeza', platform: 'instagram', type: 'story', status: 'scheduled', scheduledAt: '2026-03-17T08:00', content: 'Aproveite!' },
  { id: '5', title: 'Implantes: O que saber', platform: 'facebook', type: 'article', status: 'draft', scheduledAt: '2026-03-18T11:00', content: 'Guia completo...' },
  { id: '6', title: 'Caso Clínico Facetas', platform: 'instagram', type: 'carousel', status: 'scheduled', scheduledAt: '2026-03-19T10:00', content: 'Resultado excepcional!' },
  { id: '7', title: 'Promo Dia das Mães', platform: 'whatsapp', type: 'image', status: 'draft', scheduledAt: '2026-03-20T09:00', content: 'Presente especial...' },
  { id: '8', title: 'Dica Pós-Operatório', platform: 'instagram', type: 'video', status: 'published', scheduledAt: '2026-03-13T10:00', content: 'Cuidados importantes...' },
];

const PLATFORM_ICONS: Record<string, { icon: typeof Instagram; color: string; bg: string }> = {
  instagram: { icon: Instagram, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  facebook: { icon: Facebook, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  google: { icon: Globe, color: 'text-green-400', bg: 'bg-green-500/10' },
  whatsapp: { icon: MessageCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
};

const TYPE_ICONS: Record<string, typeof ImageIcon> = {
  image: ImageIcon,
  video: Video,
  carousel: ImageIcon,
  story: Eye,
  article: FileText,
};

const TEMPLATES = [
  { name: 'Antes e Depois', desc: 'Resultado de tratamento', category: 'Clínico' },
  { name: 'Dica de Saúde Bucal', desc: 'Conteúdo educativo', category: 'Educativo' },
  { name: 'Depoimento de Paciente', desc: 'Prova social', category: 'Social Proof' },
  { name: 'Promoção/Desconto', desc: 'Oferta especial', category: 'Promocional' },
  { name: 'Bastidores da Clínica', desc: 'Humanização', category: 'Institucional' },
  { name: 'Caso Clínico', desc: 'Procedimento técnico', category: 'Clínico' },
];

function getDaysInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  const startDay = first.getDay();
  for (let i = 0; i < startDay; i++) {
    const d = new Date(year, month, -(startDay - i - 1));
    days.push(d);
  }
  for (let i = 1; i <= last.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    days.push(new Date(year, month + 1, i));
  }
  return days;
}

export default function ContentPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewPost, setShowNewPost] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const days = useMemo(() => getDaysInMonth(year, month), [year, month]);
  const today = new Date().toDateString();

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + dir);
    setCurrentDate(d);
  };

  const getPostsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return MOCK_POSTS.filter((p) => p.scheduledAt.startsWith(dateStr));
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            Calendário de Conteúdo
          </h1>
          <p className="text-sm text-[#6b7a8d] mt-1">Planejamento e agendamento de publicações</p>
        </div>
        <button onClick={() => setShowNewPost(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all">
          <Plus className="h-4 w-4" /> Nova Publicação
        </button>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="col-span-3">
          <div className="rounded-2xl bg-[#111827] border border-[#1e293b] overflow-hidden">
            {/* Month Navigation */}
            <div className="flex items-center justify-between p-4 border-b border-[#1a2332]">
              <button onClick={() => navigate(-1)} className="p-2 rounded-xl text-[#6b7a8d] hover:text-white hover:bg-[#1e293b] transition-all">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 className="text-sm font-semibold text-white">
                {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h2>
              <button onClick={() => navigate(1)} className="p-2 rounded-xl text-[#6b7a8d] hover:text-white hover:bg-[#1e293b] transition-all">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-[#1a2332]">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => (
                <div key={d} className="p-2 text-center text-[10px] font-semibold text-[#4a5568] uppercase">{d}</div>
              ))}
            </div>

            {/* Day Grid */}
            <div className="grid grid-cols-7">
              {days.map((day, i) => {
                const isCurrentMonth = day.getMonth() === month;
                const isToday = day.toDateString() === today;
                const posts = getPostsForDate(day);
                return (
                  <div
                    key={i}
                    className={`min-h-[90px] border-b border-r border-[#0d1320] p-1.5 ${
                      !isCurrentMonth ? 'opacity-30' : ''
                    } ${isToday ? 'bg-teal-500/5' : 'hover:bg-[#0d1320]/50'} transition-colors cursor-pointer`}
                  >
                    <span className={`text-[10px] font-medium ${isToday ? 'text-teal-400' : 'text-[#6b7a8d]'}`}>
                      {day.getDate()}
                    </span>
                    <div className="space-y-0.5 mt-1">
                      {posts.slice(0, 3).map((post) => {
                        const platform = PLATFORM_ICONS[post.platform];
                        const Icon = platform?.icon || Globe;
                        return (
                          <div key={post.id}
                            className={`flex items-center gap-1 rounded px-1 py-0.5 text-[9px] truncate ${platform?.bg || 'bg-[#1e293b]'}`}>
                            <Icon className={`h-2.5 w-2.5 flex-shrink-0 ${platform?.color || 'text-[#6b7a8d]'}`} />
                            <span className="text-white truncate">{post.title}</span>
                          </div>
                        );
                      })}
                      {posts.length > 3 && (
                        <span className="text-[9px] text-[#4a5568]">+{posts.length - 3} mais</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Templates */}
          <div className="rounded-2xl bg-[#111827] border border-[#1e293b] p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Sparkles className="h-4 w-4 text-[#D4A76A]" />
              Templates de Conteúdo
            </h3>
            <div className="space-y-2">
              {TEMPLATES.map((tpl) => (
                <button key={tpl.name}
                  className="w-full flex items-center gap-3 rounded-xl bg-[#0d1320] border border-[#1a2332] p-3 hover:border-teal-500/20 transition-all text-left">
                  <div>
                    <p className="text-xs font-medium text-white">{tpl.name}</p>
                    <p className="text-[10px] text-[#4a5568]">{tpl.desc}</p>
                  </div>
                  <span className="text-[9px] text-[#4a5568] bg-[#1e293b] rounded-full px-2 py-0.5 ml-auto whitespace-nowrap">{tpl.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming Posts */}
          <div className="rounded-2xl bg-[#111827] border border-[#1e293b] p-5">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-blue-400" />
              Próximas Publicações
            </h3>
            <div className="space-y-2">
              {MOCK_POSTS.filter((p) => p.status === 'scheduled').slice(0, 5).map((post) => {
                const platform = PLATFORM_ICONS[post.platform];
                const Icon = platform?.icon || Globe;
                const TypeIcon = TYPE_ICONS[post.type] || FileText;
                return (
                  <div key={post.id} className="flex items-center gap-2 rounded-xl bg-[#0d1320] border border-[#1a2332] p-2.5">
                    <Icon className={`h-3.5 w-3.5 ${platform?.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-white truncate">{post.title}</p>
                      <p className="text-[9px] text-[#4a5568]">
                        {new Date(post.scheduledAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <TypeIcon className="h-3 w-3 text-[#4a5568]" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* New Post Modal */}
      {showNewPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-[#111827] border border-[#1e293b] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Nova Publicação</h2>
              <button onClick={() => setShowNewPost(false)} className="text-[#4a5568] hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-[#8899aa] mb-2 block">Plataforma</label>
                <div className="flex gap-3">
                  {Object.entries(PLATFORM_ICONS).map(([key, { icon: Icon, color, bg }]) => (
                    <button key={key} className={`flex items-center gap-2 rounded-xl border border-[#1a2332] px-4 py-2.5 ${bg} hover:border-teal-500/30 transition-all`}>
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="text-xs text-white capitalize">{key}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#8899aa] mb-1 block">Título</label>
                <input type="text" placeholder="Título da publicação..." className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8899aa] mb-1 block">Conteúdo</label>
                <textarea rows={4} placeholder="Texto da publicação..." className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white placeholder-[#4a5568] focus:border-teal-500/50 focus:outline-none transition-all resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[#8899aa] mb-1 block">Data</label>
                  <input type="date" className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#8899aa] mb-1 block">Horário</label>
                  <input type="time" className="w-full rounded-xl bg-[#0d1320] border border-[#1a2332] px-4 py-2.5 text-sm text-white focus:border-teal-500/50 focus:outline-none transition-all" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewPost(false)} className="flex-1 rounded-xl bg-[#1e293b] px-4 py-2.5 text-sm text-[#8899aa] hover:text-white transition-all">Salvar Rascunho</button>
              <button onClick={() => setShowNewPost(false)} className="flex-1 rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:shadow-lg hover:shadow-teal-500/20 transition-all">Agendar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
