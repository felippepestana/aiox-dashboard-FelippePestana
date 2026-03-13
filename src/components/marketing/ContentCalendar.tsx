'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Instagram,
  Facebook,
  MessageCircle,
  Search,
  Clock,
  Calendar,
  Image,
  FileText,
  Copy,
  GripVertical,
  Eye,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface ScheduledPost {
  id: string;
  title: string;
  channel: 'instagram' | 'facebook' | 'google' | 'whatsapp';
  date: number;
  time: string;
  content: string;
  template?: string;
  status: 'scheduled' | 'published' | 'draft';
}

const channelConfig = {
  instagram: { label: 'Instagram', color: 'bg-pink-400', textColor: 'text-pink-500', icon: <Instagram className="w-4 h-4" /> },
  facebook: { label: 'Facebook', color: 'bg-blue-500', textColor: 'text-blue-600', icon: <Facebook className="w-4 h-4" /> },
  google: { label: 'Google', color: 'bg-green-500', textColor: 'text-green-600', icon: <Search className="w-4 h-4" /> },
  whatsapp: { label: 'WhatsApp', color: 'bg-emerald-500', textColor: 'text-emerald-600', icon: <MessageCircle className="w-4 h-4" /> },
};

const templates = [
  { id: 'before_after', label: 'Antes e Depois', description: 'Mostre a transformacao do sorriso do paciente', icon: '✨' },
  { id: 'tips', label: 'Dicas de Saude Bucal', description: 'Compartilhe conhecimento e engaje seguidores', icon: '💡' },
  { id: 'promo', label: 'Promocao', description: 'Ofertas especiais e condicoes de pagamento', icon: '🎯' },
  { id: 'testimonial', label: 'Depoimento', description: 'Pacientes contando sua experiencia', icon: '⭐' },
  { id: 'team', label: 'Equipe', description: 'Apresente a equipe e bastidores da clinica', icon: '👥' },
  { id: 'educational', label: 'Educativo', description: 'Explique procedimentos e tire duvidas', icon: '📚' },
];

const initialPosts: ScheduledPost[] = [
  { id: '1', title: 'Dica: Escovacao Correta', channel: 'instagram', date: 2, time: '10:00', content: 'Voce sabia que a escovacao deve durar pelo menos 2 minutos? Confira nossas dicas!', template: 'tips', status: 'published' },
  { id: '2', title: 'Caso Clinico - Facetas', channel: 'instagram', date: 5, time: '14:00', content: 'Veja a incrivel transformacao da nossa paciente com facetas de porcelana.', template: 'before_after', status: 'scheduled' },
  { id: '3', title: 'Artigo: Cuidados com Implante', channel: 'facebook', date: 5, time: '11:00', content: 'Saiba como cuidar do seu implante dentario para garantir durabilidade.', template: 'educational', status: 'scheduled' },
  { id: '4', title: 'Promo: Limpeza + Avaliacao', channel: 'instagram', date: 8, time: '09:00', content: 'Aproveite! Limpeza + avaliacao completa por apenas R$ 199. Vagas limitadas!', template: 'promo', status: 'scheduled' },
  { id: '5', title: 'Depoimento - Sr. Roberto', channel: 'facebook', date: 10, time: '16:00', content: 'Ouça o que o Sr. Roberto tem a dizer sobre seu tratamento de implantes.', template: 'testimonial', status: 'scheduled' },
  { id: '6', title: 'Reels: Mitos sobre Aparelho', channel: 'instagram', date: 12, time: '12:00', content: '5 mitos sobre aparelho ortodontico que voce precisa parar de acreditar!', template: 'educational', status: 'scheduled' },
  { id: '7', title: 'Antes/Depois Clareamento', channel: 'instagram', date: 15, time: '10:00', content: 'Resultado incrivel de clareamento dental. Agende sua avaliacao!', template: 'before_after', status: 'scheduled' },
  { id: '8', title: 'Google Ads - Implantes', channel: 'google', date: 15, time: '08:00', content: 'Implantes dentarios com tecnologia de ponta. Consulte valores.', status: 'scheduled' },
  { id: '9', title: 'Dica: Alimentacao Saudavel', channel: 'instagram', date: 18, time: '11:00', content: 'Alimentos que ajudam na saude dos seus dentes. Confira a lista!', template: 'tips', status: 'draft' },
  { id: '10', title: 'Stories: Bastidores', channel: 'instagram', date: 20, time: '15:00', content: 'Venha conhecer os bastidores da Sbarzi Odontologia!', template: 'team', status: 'scheduled' },
  { id: '11', title: 'Post Ortodontia Invisivel', channel: 'facebook', date: 22, time: '14:00', content: 'Alinhe seu sorriso sem que ninguem perceba. Conheca o alinhador invisivel!', template: 'before_after', status: 'scheduled' },
  { id: '12', title: 'Reels: 3 Dicas Rapidas', channel: 'instagram', date: 25, time: '10:00', content: '3 dicas rapidas para manter seu sorriso saudavel no inverno.', template: 'tips', status: 'scheduled' },
  { id: '13', title: 'Lembrete de Retorno', channel: 'whatsapp', date: 25, time: '09:00', content: 'Ola! Ja faz 6 meses da sua ultima consulta. Que tal agendar um retorno?', status: 'scheduled' },
  { id: '14', title: 'Encerramento do Mes', channel: 'instagram', date: 28, time: '17:00', content: 'Agradecemos todos os sorrisos que transformamos este mes! Ate julho!', template: 'team', status: 'draft' },
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export default function ContentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(5); // June (0-indexed)
  const [currentYear, setCurrentYear] = useState(2025);
  const [posts, setPosts] = useState<ScheduledPost[]>(initialPosts);
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [draggedPost, setDraggedPost] = useState<string | null>(null);

  // Form state
  const [formChannel, setFormChannel] = useState<ScheduledPost['channel']>('instagram');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formTime, setFormTime] = useState('10:00');
  const [formTemplate, setFormTemplate] = useState('');

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const getPostsForDay = (day: number) => posts.filter((p) => p.date === day);

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setShowModal(true);
    setFormTitle('');
    setFormContent('');
    setFormTime('10:00');
    setFormTemplate('');
    setFormChannel('instagram');
  };

  const handleCreatePost = () => {
    if (!formTitle || !selectedDay) return;
    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      title: formTitle,
      channel: formChannel,
      date: selectedDay,
      time: formTime,
      content: formContent,
      template: formTemplate || undefined,
      status: 'scheduled',
    };
    setPosts([...posts, newPost]);
    setShowModal(false);
  };

  const handleSelectTemplate = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    setFormTemplate(templateId);
    if (tmpl && !formTitle) {
      setFormTitle(tmpl.label);
    }
  };

  const handleDragStart = (postId: string) => {
    setDraggedPost(postId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (day: number) => {
    if (draggedPost) {
      setPosts(posts.map((p) => (p.id === draggedPost ? { ...p, date: day } : p)));
      setDraggedPost(null);
    }
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter((p) => p.id !== postId));
  };

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Calendario de Conteudo</h1>
          <p className="text-sm text-gray-500">Sbarzi Odontologia e Saude</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Channel Legend */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            {Object.entries(channelConfig).map(([key, cfg]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                <span className="text-gray-500">{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-800">
          {monthNames[currentMonth]} {currentYear}
        </h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Week Headers */}
        <div className="grid grid-cols-7 border-b border-gray-100">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-3 bg-gray-50/50">
              {d}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7">
          {calendarCells.map((day, idx) => {
            const dayPosts = day ? getPostsForDay(day) : [];
            const isToday = day === 15; // Simulated today
            return (
              <div
                key={idx}
                className={`min-h-[100px] lg:min-h-[120px] border-b border-r border-gray-100 p-1.5 transition-colors ${
                  day ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-50/30'
                } ${isToday ? 'bg-[#0D9488]/5' : ''}`}
                onClick={() => day && handleDayClick(day)}
                onDragOver={handleDragOver}
                onDrop={() => day && handleDrop(day)}
              >
                {day && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-[#0D9488] text-white flex items-center justify-center'
                          : 'text-gray-500'
                      }`}>
                        {day}
                      </span>
                      {dayPosts.length > 0 && (
                        <span className="text-[9px] text-gray-400">{dayPosts.length}</span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      {dayPosts.slice(0, 3).map((post) => {
                        const cfg = channelConfig[post.channel];
                        return (
                          <div
                            key={post.id}
                            draggable
                            onDragStart={(e) => {
                              e.stopPropagation();
                              handleDragStart(post.id);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className={`${cfg.color} text-white text-[9px] px-1.5 py-0.5 rounded truncate cursor-grab active:cursor-grabbing flex items-center gap-1 group relative`}
                            title={`${post.title} - ${post.time}`}
                          >
                            <GripVertical className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 shrink-0" />
                            <span className="truncate">{post.title}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePost(post.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 shrink-0 ml-auto"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        );
                      })}
                      {dayPosts.length > 3 && (
                        <span className="text-[9px] text-gray-400 block text-center">
                          +{dayPosts.length - 3} mais
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-gray-800">{posts.length}</p>
          <p className="text-xs text-gray-500">Posts Agendados</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-pink-500">
            {posts.filter((p) => p.channel === 'instagram').length}
          </p>
          <p className="text-xs text-gray-500">Instagram</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-blue-600">
            {posts.filter((p) => p.channel === 'facebook').length}
          </p>
          <p className="text-xs text-gray-500">Facebook</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
          <p className="text-2xl font-bold text-emerald-500">
            {posts.filter((p) => p.channel === 'whatsapp').length + posts.filter((p) => p.channel === 'google').length}
          </p>
          <p className="text-xs text-gray-500">Google / WhatsApp</p>
        </div>
      </div>

      {/* Create Post Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div>
                <h3 className="font-semibold text-gray-800">Criar Post</h3>
                <p className="text-xs text-gray-500">
                  Dia {selectedDay} de {monthNames[currentMonth]}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Platform */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">Plataforma</label>
                <div className="flex gap-2">
                  {(Object.entries(channelConfig) as [ScheduledPost['channel'], typeof channelConfig.instagram][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setFormChannel(key)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        formChannel === key
                          ? `border-[#0D9488] bg-[#0D9488]/5 ${cfg.textColor}`
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {cfg.icon}
                      <span className="hidden sm:inline">{cfg.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Templates para Conteudo Dental
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {templates.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className={`p-2.5 rounded-lg border text-left transition-colors ${
                        formTemplate === tmpl.id
                          ? 'border-[#0D9488] bg-[#0D9488]/5'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{tmpl.icon}</span>
                      <p className="text-xs font-medium text-gray-700 mt-1">{tmpl.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Titulo</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ex: Dica de Escovacao"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Texto do Post</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Escreva o conteudo do post..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488] resize-none"
                />
              </div>

              {/* Image Placeholder */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Imagem</label>
                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#0D9488] transition-colors cursor-pointer">
                  <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">Clique para adicionar imagem</p>
                  <p className="text-[10px] text-gray-400">PNG, JPG ate 5MB</p>
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Horario de Publicacao</label>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreatePost}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors"
              >
                <Calendar className="w-4 h-4" /> Agendar Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
