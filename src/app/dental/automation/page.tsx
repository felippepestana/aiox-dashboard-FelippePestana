'use client';

import { useState } from 'react';
import {
  Activity, Zap, MessageCircle, Mail, Bell, Calendar, Heart,
  Gift, UserPlus, RefreshCw, CheckCircle2, Clock, Play, Pause,
  Settings, ChevronRight, Sparkles, Users, TrendingUp, Eye,
  ArrowRight,
} from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  steps: { action: string; delay: string }[];
  status: 'active' | 'paused' | 'draft';
  sent: number;
  opened: number;
  converted: number;
  icon: typeof MessageCircle;
  color: string;
}

const MOCK_AUTOMATIONS: Automation[] = [
  {
    id: '1', name: 'Boas-vindas Novo Paciente', description: 'Sequência de boas-vindas para pacientes recém-cadastrados',
    trigger: 'Novo cadastro de paciente',
    steps: [
      { action: 'WhatsApp: Mensagem de boas-vindas', delay: 'Imediato' },
      { action: 'E-mail: Guia de primeira consulta', delay: '1 hora' },
      { action: 'WhatsApp: Dicas de saúde bucal', delay: '3 dias' },
      { action: 'E-mail: Oferta de checkup preventivo', delay: '7 dias' },
    ],
    status: 'active', sent: 245, opened: 198, converted: 42, icon: UserPlus, color: 'teal',
  },
  {
    id: '2', name: 'Lembrete de Consulta', description: 'Lembretes automáticos antes da consulta agendada',
    trigger: 'Consulta agendada',
    steps: [
      { action: 'WhatsApp: Confirmação de agendamento', delay: 'Imediato' },
      { action: 'WhatsApp: Lembrete 24h antes', delay: '24h antes' },
      { action: 'SMS: Lembrete 2h antes', delay: '2h antes' },
    ],
    status: 'active', sent: 890, opened: 845, converted: 780, icon: Calendar, color: 'blue',
  },
  {
    id: '3', name: 'Pós-Consulta', description: 'Follow-up após procedimentos realizados',
    trigger: 'Procedimento concluído',
    steps: [
      { action: 'WhatsApp: Cuidados pós-procedimento', delay: '2 horas' },
      { action: 'WhatsApp: Como está se sentindo?', delay: '24 horas' },
      { action: 'E-mail: Pesquisa de satisfação NPS', delay: '3 dias' },
      { action: 'WhatsApp: Convite para avaliação Google', delay: '7 dias' },
    ],
    status: 'active', sent: 456, opened: 389, converted: 156, icon: Heart, color: 'pink',
  },
  {
    id: '4', name: 'Aniversário do Paciente', description: 'Mensagem personalizada de aniversário com oferta',
    trigger: 'Data de nascimento do paciente',
    steps: [
      { action: 'WhatsApp: Feliz Aniversário + cupom 15% OFF', delay: 'No dia' },
      { action: 'E-mail: Presente especial - promoção exclusiva', delay: 'No dia' },
    ],
    status: 'active', sent: 68, opened: 62, converted: 18, icon: Gift, color: 'purple',
  },
  {
    id: '5', name: 'Reativação de Pacientes', description: 'Campanhas para pacientes inativos há mais de 6 meses',
    trigger: 'Inatividade > 6 meses',
    steps: [
      { action: 'WhatsApp: Sentimos sua falta!', delay: '6 meses sem visita' },
      { action: 'E-mail: Importância do checkup regular', delay: '7 dias depois' },
      { action: 'WhatsApp: Oferta especial de retorno', delay: '14 dias depois' },
      { action: 'Ligação: Contato pessoal', delay: '21 dias depois' },
    ],
    status: 'paused', sent: 125, opened: 78, converted: 22, icon: RefreshCw, color: 'amber',
  },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Ativa', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  paused: { label: 'Pausada', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  draft: { label: 'Rascunho', color: 'text-[#86868B]', bg: 'bg-[#E5E5EA]/50 border-[#D1D1D6]' },
};

export default function AutomationPage() {
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);

  const totalSent = MOCK_AUTOMATIONS.reduce((s, a) => s + a.sent, 0);
  const totalConverted = MOCK_AUTOMATIONS.reduce((s, a) => s + a.converted, 0);
  const activeCount = MOCK_AUTOMATIONS.filter((a) => a.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1D1D1F] flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-700">
              <Zap className="h-5 w-5 text-white" />
            </div>
            Automação de Marketing
          </h1>
          <p className="text-sm text-[#86868B] mt-1">Workflows automáticos para engajamento de pacientes</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {[
          { label: 'Automações Ativas', value: activeCount.toString(), icon: Activity, color: 'green' },
          { label: 'Mensagens Enviadas', value: totalSent.toLocaleString('pt-BR'), icon: MessageCircle, color: 'blue' },
          { label: 'Conversões', value: totalConverted.toString(), icon: TrendingUp, color: 'teal' },
          { label: 'Taxa de Conversão', value: `${totalSent > 0 ? ((totalConverted / totalSent) * 100).toFixed(1) : 0}%`, icon: Eye, color: 'amber' },
        ].map((stat) => {
          const Icon = stat.icon;
          const colorMap: Record<string, string> = {
            green: 'from-green-500/20 to-green-500/5 border-green-500/20',
            blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/20',
            teal: 'from-[#C4956A]/20 to-[#C4956A]/5 border-[#C4956A]/20',
            amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
          };
          const iconColor: Record<string, string> = { green: 'text-green-400', blue: 'text-blue-400', teal: 'text-[#C4956A]', amber: 'text-amber-400' };
          return (
            <div key={stat.label} className={`rounded-2xl bg-gradient-to-br ${colorMap[stat.color]} border p-5`}>
              <Icon className={`h-5 w-5 ${iconColor[stat.color]} mb-2`} />
              <p className="text-xl md:text-2xl font-bold text-[#1D1D1F]">{stat.value}</p>
              <p className="text-xs text-[#86868B]">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Automation List */}
        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {MOCK_AUTOMATIONS.map((auto) => {
            const conf = STATUS_MAP[auto.status];
            const Icon = auto.icon;
            const colorMap: Record<string, string> = {
              teal: 'bg-[#C4956A]/10 text-[#C4956A]',
              blue: 'bg-blue-500/10 text-blue-400',
              pink: 'bg-pink-500/10 text-pink-400',
              purple: 'bg-purple-500/10 text-purple-400',
              amber: 'bg-amber-500/10 text-amber-400',
            };
            return (
              <div
                key={auto.id}
                onClick={() => setSelectedAutomation(auto)}
                className={`rounded-2xl bg-white border p-6 cursor-pointer transition-all hover:scale-[1.01] ${
                  selectedAutomation?.id === auto.id ? 'border-[#C4956A]/40' : 'border-[#E5E5EA] hover:border-[#D1D1D6]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[auto.color]}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-[#1D1D1F]">{auto.name}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${conf.bg} ${conf.color}`}>{conf.label}</span>
                      </div>
                      <p className="text-xs text-[#86868B] mt-0.5">{auto.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {auto.status === 'active' ? (
                      <button className="p-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">
                        <Pause className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">
                        <Play className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow Steps Preview */}
                <div className="flex items-center gap-1 mb-3 flex-wrap">
                  {auto.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className="rounded-lg bg-[#FAFAFA] border border-[#E8E8ED] px-2 py-1 whitespace-nowrap">
                        <p className="text-[9px] text-[#6E6E73]">{step.action.split(':')[0]}</p>
                        <p className="text-[8px] text-[#AEAEB2]">{step.delay}</p>
                      </div>
                      {i < auto.steps.length - 1 && <ArrowRight className="h-3 w-3 text-[#D1D1D6] flex-shrink-0" />}
                    </div>
                  ))}
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-2 text-center">
                    <p className="text-xs font-bold text-[#1D1D1F]">{auto.sent}</p>
                    <p className="text-[9px] text-[#AEAEB2]">Enviadas</p>
                  </div>
                  <div className="rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-2 text-center">
                    <p className="text-xs font-bold text-[#1D1D1F]">{auto.opened}</p>
                    <p className="text-[9px] text-[#AEAEB2]">Abertas</p>
                  </div>
                  <div className="rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-2 text-center">
                    <p className="text-xs font-bold text-[#C4956A]">{auto.converted}</p>
                    <p className="text-[9px] text-[#AEAEB2]">Convertidas</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar - Detail / Templates */}
        <div className="space-y-6">
          {selectedAutomation ? (
            <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6 sticky top-6">
              <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4">Fluxo do Workflow</h3>
              <div className="space-y-0">
                {selectedAutomation.steps.map((step, i) => (
                  <div key={i} className="relative">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          i === 0 ? 'bg-[#C4956A]/20 text-[#C4956A]' : 'bg-[#E5E5EA] text-[#86868B]'
                        } text-[10px] font-bold`}>
                          {i + 1}
                        </div>
                        {i < selectedAutomation.steps.length - 1 && (
                          <div className="w-px h-8 bg-[#E5E5EA]" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="text-xs font-medium text-[#1D1D1F]">{step.action}</p>
                        <p className="text-[10px] text-[#AEAEB2] flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" /> {step.delay}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-3">
                <p className="text-[10px] text-[#AEAEB2] mb-1">Gatilho</p>
                <p className="text-xs text-[#1D1D1F] flex items-center gap-2">
                  <Zap className="h-3 w-3 text-amber-400" />
                  {selectedAutomation.trigger}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-3 text-center">
                  <p className="text-lg font-bold text-[#C4956A]">
                    {selectedAutomation.sent > 0 ? ((selectedAutomation.opened / selectedAutomation.sent) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-[9px] text-[#AEAEB2]">Taxa Abertura</p>
                </div>
                <div className="rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-3 text-center">
                  <p className="text-lg font-bold text-green-400">
                    {selectedAutomation.sent > 0 ? ((selectedAutomation.converted / selectedAutomation.sent) * 100).toFixed(0) : 0}%
                  </p>
                  <p className="text-[9px] text-[#AEAEB2]">Taxa Conversão</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-[#E5E5EA] p-6">
              <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-[#D4A76A]" />
                Templates Prontos
              </h3>
              <div className="space-y-2">
                {[
                  'Boas-vindas + Onboarding',
                  'Lembretes de Consulta',
                  'Follow-up Pós-Procedimento',
                  'Aniversário do Paciente',
                  'Reativação de Inativos',
                  'Pesquisa NPS',
                  'Indicação Premiada',
                ].map((tpl) => (
                  <button key={tpl} className="w-full flex items-center justify-between rounded-xl bg-[#FAFAFA] border border-[#E8E8ED] p-3 hover:border-[#C4956A]/20 transition-all text-left">
                    <span className="text-xs text-[#6E6E73]">{tpl}</span>
                    <ChevronRight className="h-3 w-3 text-[#AEAEB2]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* AI Suggestion */}
          <div className="rounded-2xl bg-gradient-to-br from-[#D4A76A]/10 to-[#D4A76A]/5 border border-[#D4A76A]/20 p-5">
            <h3 className="text-sm font-semibold text-[#1D1D1F] flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-[#D4A76A]" />
              Insight IA
            </h3>
            <p className="text-xs text-[#48484A] leading-relaxed">
              A automação de "Lembrete de Consulta" tem taxa de comparecimento de 87%.
              Adicione um lembrete via SMS 30 minutos antes para aumentar para ~93%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
