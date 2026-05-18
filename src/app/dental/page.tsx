'use client';

import { useState } from 'react';
import {
  Mic,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Stethoscope,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Bell,
  Search,
  ChevronRight,
  Star,
  Sparkles,
  ClipboardList,
  Heart,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

const MOCK_STATS = [
  { label: 'Pacientes Hoje', value: '12', change: '+3', trend: 'up', icon: Users, color: 'teal' },
  { label: 'Receita do Mês', value: 'R$ 47.850', change: '+12%', trend: 'up', icon: DollarSign, color: 'green' },
  { label: 'Agendamentos', value: '28', change: '+5', trend: 'up', icon: Calendar, color: 'blue' },
  { label: 'Exames Pendentes', value: '4', change: '-2', trend: 'down', icon: FileText, color: 'amber' },
];

const MOCK_APPOINTMENTS = [
  { time: '08:30', patient: 'Maria Silva', procedure: 'Limpeza e Profilaxia', status: 'confirmed' },
  { time: '09:30', patient: 'João Santos', procedure: 'Restauração Classe II', status: 'confirmed' },
  { time: '10:30', patient: 'Ana Oliveira', procedure: 'Avaliação Ortodôntica', status: 'waiting' },
  { time: '11:30', patient: 'Carlos Lima', procedure: 'Implante Unitário', status: 'confirmed' },
  { time: '14:00', patient: 'Fernanda Costa', procedure: 'Clareamento Dental', status: 'confirmed' },
  { time: '15:00', patient: 'Roberto Alves', procedure: 'Extração 3o Molar', status: 'pending' },
];

const MOCK_RECENT_ACTIVITY = [
  { text: 'Plano de tratamento aprovado - Maria Silva', time: '5 min', type: 'success' },
  { text: 'Novo agendamento - Roberto Alves', time: '15 min', type: 'info' },
  { text: 'Resultado de exame disponível - João Santos', time: '30 min', type: 'warning' },
  { text: 'Pagamento recebido - R$ 1.200,00', time: '1h', type: 'success' },
  { text: 'Campanha Instagram atingiu 5.000 views', time: '2h', type: 'info' },
];

const QUICK_ACTIONS = [
  { label: 'Comando de Voz', icon: Mic, href: '/dental/voice', color: 'from-[#C4956A] to-[#A0784C]', desc: 'Ditar procedimentos' },
  { label: 'Novo Paciente', icon: Users, href: '/dental/patients', color: 'from-[#D4848B] to-[#B06B75]', desc: 'Cadastrar paciente' },
  { label: 'Agendar', icon: Calendar, href: '/dental/calendar', color: 'from-[#C4956A] to-[#B08050]', desc: 'Nova consulta' },
  { label: 'Solicitar Exame', icon: FileText, href: '/dental/exams', color: 'from-[#D4A76A] to-[#C4956A]', desc: 'Requisição de exame' },
  { label: 'Tratamento', icon: ClipboardList, href: '/dental/treatments', color: 'from-[#D4848B] to-[#C47580]', desc: 'Plano de tratamento' },
  { label: 'Financeiro', icon: DollarSign, href: '/dental/financial', color: 'from-[#A0784C] to-[#8B6914]', desc: 'Ver finanças' },
];

export default function DentalDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1D1D1F]">
            Bom dia, Dra. Vanessa
            <Sparkles className="inline-block ml-2 h-5 w-5 text-[#D4A76A]" />
          </h1>
          <p className="text-sm text-[#86868B] mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#AEAEB2]" />
            <input
              type="text"
              placeholder="Buscar paciente, procedimento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-72 rounded-xl bg-white border border-[#E5E5EA] pl-10 pr-4 py-2.5 text-sm text-[#1D1D1F] placeholder-[#AEAEB2] focus:border-[#C4956A]/50 focus:outline-none focus:ring-1 focus:ring-[#C4956A]/20 transition-all"
            />
          </div>
          <button className="relative p-2.5 rounded-xl bg-white border border-[#E5E5EA] text-[#86868B] hover:text-[#1D1D1F] hover:border-[#D1D1D6] transition-all">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center text-white">3</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {MOCK_STATS.map((stat) => {
          const Icon = stat.icon;
          const colorMap: Record<string, string> = {
            teal: 'from-[#C4956A]/20 to-[#C4956A]/5 border-[#C4956A]/20',
            green: 'from-green-500/20 to-green-500/5 border-green-500/20',
            blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
            amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
          };
          const iconColorMap: Record<string, string> = {
            teal: 'text-[#C4956A]',
            green: 'text-green-400',
            blue: 'text-blue-400',
            amber: 'text-amber-400',
          };
          return (
            <div
              key={stat.label}
              className={`rounded-2xl bg-gradient-to-br ${colorMap[stat.color]} border p-5 transition-all hover:scale-[1.02] hover:shadow-lg`}
            >
              <div className="flex items-center justify-between mb-3">
                <Icon className={`h-5 w-5 ${iconColorMap[stat.color]}`} />
                <span className={`flex items-center gap-1 text-xs font-medium ${
                  stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-[#1D1D1F]">{stat.value}</p>
              <p className="text-xs text-[#86868B] mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-[#6E6E73] uppercase tracking-wider mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="group flex flex-col items-center gap-2 rounded-2xl bg-white border border-[#E5E5EA] p-4 hover:border-[#C4956A]/30 hover:bg-white/80 transition-all hover:scale-[1.03]"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${action.color} shadow-lg transition-transform group-hover:scale-110`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-medium text-[#1D1D1F] text-center">{action.label}</span>
                <span className="text-[10px] text-[#AEAEB2] text-center">{action.desc}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="col-span-2 rounded-2xl bg-white border border-[#E5E5EA] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#1D1D1F] flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#C4956A]" />
              Agenda de Hoje
            </h2>
            <Link href="/dental/calendar" className="text-xs text-[#C4956A] hover:text-[#D4A76A] flex items-center gap-1 transition-colors">
              Ver completa <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {MOCK_APPOINTMENTS.map((apt, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-3 hover:border-[#C4956A]/20 transition-all cursor-pointer group"
              >
                <div className="text-center min-w-[60px]">
                  <p className="text-sm font-bold text-[#1D1D1F]">{apt.time}</p>
                </div>
                <div className="h-8 w-px bg-[#E5E5EA]" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1D1D1F] group-hover:text-[#D4A76A] transition-colors">{apt.patient}</p>
                  <p className="text-xs text-[#86868B]">{apt.procedure}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                  apt.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  apt.status === 'waiting' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {apt.status === 'confirmed' ? 'Confirmado' : apt.status === 'waiting' ? 'Aguardando' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Voice Assistant */}
          <Link
            href="/dental/voice"
            className="block rounded-2xl bg-gradient-to-br from-[#C4956A]/8 to-[#D4A76A]/5 border border-[#C4956A]/15 p-6 hover:border-[#C4956A]/30 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#C4956A] to-[#A0784C] shadow-lg shadow-[#C4956A]/30 group-hover:scale-110 transition-transform">
                <Mic className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1D1D1F]">Assistente de Voz IA</h3>
                <p className="text-xs text-[#C4956A]/70">Pronto para comandos</p>
              </div>
            </div>
            <p className="text-xs text-[#86868B] leading-relaxed">
              Dite procedimentos, solicite exames e gere apresentações de tratamento por comando de voz.
            </p>
          </Link>

          {/* Recent Activity */}
          <div className="rounded-2xl bg-white border border-[#E5E5EA] p-5">
            <h2 className="text-sm font-semibold text-[#1D1D1F] flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-[#D4A76A]" />
              Atividade Recente
            </h2>
            <div className="space-y-3">
              {MOCK_RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                    item.type === 'success' ? 'bg-green-400' :
                    item.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#48484A] leading-relaxed">{item.text}</p>
                    <p className="text-[10px] text-[#AEAEB2] mt-0.5">{item.time} atrás</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clinic Quality Badge */}
          <div className="rounded-2xl bg-gradient-to-br from-[#D4A76A]/10 to-[#D4A76A]/5 border border-[#D4A76A]/20 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="h-4 w-4 text-[#D4A76A]" />
              <h3 className="text-xs font-semibold text-[#D4A76A] uppercase tracking-wider">Selo de Qualidade</h3>
            </div>
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className="h-4 w-4 text-[#D4A76A] fill-[#D4A76A]" />
              ))}
            </div>
            <p className="text-[11px] text-[#86868B] leading-relaxed">
              Sbarzi Odontologia e Saúde - Excelência em atendimento odontológico em Porto Velho, RO.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
