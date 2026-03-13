'use client';

import { useState } from 'react';
import {
  Zap,
  Play,
  Pause,
  Plus,
  ChevronRight,
  ChevronDown,
  Mail,
  MessageCircle,
  Bell,
  Clock,
  Users,
  Heart,
  Calendar,
  Gift,
  RotateCcw,
  CheckCircle2,
  ArrowRight,
  Settings,
  BarChart3,
  Eye,
  Send,
  UserPlus,
  Timer,
  X,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

interface Automation {
  id: string;
  name: string;
  description: string;
  type: 'welcome' | 'reminder' | 'followup' | 'birthday' | 'reactivation';
  isActive: boolean;
  totalSent: number;
  opened: number;
  converted: number;
  steps: AutomationStep[];
}

interface AutomationStep {
  id: string;
  type: 'trigger' | 'wait' | 'message' | 'condition' | 'action';
  label: string;
  description: string;
  config?: string;
}

const typeConfig = {
  welcome: { label: 'Boas-vindas', icon: <UserPlus className="w-4 h-4" />, color: 'text-[#0D9488]', bg: 'bg-[#0D9488]/10' },
  reminder: { label: 'Lembrete', icon: <Bell className="w-4 h-4" />, color: 'text-blue-600', bg: 'bg-blue-50' },
  followup: { label: 'Pos-consulta', icon: <Heart className="w-4 h-4" />, color: 'text-pink-600', bg: 'bg-pink-50' },
  birthday: { label: 'Aniversario', icon: <Gift className="w-4 h-4" />, color: 'text-[#D4A76A]', bg: 'bg-[#D4A76A]/10' },
  reactivation: { label: 'Reativacao', icon: <RotateCcw className="w-4 h-4" />, color: 'text-purple-600', bg: 'bg-purple-50' },
};

const mockAutomations: Automation[] = [
  {
    id: '1',
    name: 'Serie de Boas-vindas',
    description: 'Mensagens automaticas para novos pacientes cadastrados',
    type: 'welcome',
    isActive: true,
    totalSent: 248,
    opened: 198,
    converted: 42,
    steps: [
      { id: 's1', type: 'trigger', label: 'Novo Cadastro', description: 'Quando um novo paciente e cadastrado no sistema' },
      { id: 's2', type: 'message', label: 'Mensagem de Boas-vindas', description: 'Ola {nome}! Bem-vindo(a) a Sbarzi Odontologia. Estamos felizes em te-lo(a) como paciente!' },
      { id: 's3', type: 'wait', label: 'Aguardar 2 dias', description: 'Esperar 2 dias antes do proximo contato' },
      { id: 's4', type: 'message', label: 'Dicas de Cuidados', description: 'Confira nossas dicas de saude bucal e agende sua primeira avaliacao.' },
      { id: 's5', type: 'wait', label: 'Aguardar 5 dias', description: 'Esperar 5 dias' },
      { id: 's6', type: 'condition', label: 'Agendou consulta?', description: 'Verificar se o paciente agendou uma consulta' },
      { id: 's7', type: 'message', label: 'Oferta Especial', description: 'Ainda nao agendou? Temos uma oferta especial para sua primeira consulta!' },
    ],
  },
  {
    id: '2',
    name: 'Lembrete de Consulta',
    description: 'Envio automatico de lembretes antes das consultas agendadas',
    type: 'reminder',
    isActive: true,
    totalSent: 1520,
    opened: 1368,
    converted: 1290,
    steps: [
      { id: 's1', type: 'trigger', label: 'Consulta Agendada', description: 'Quando uma consulta e agendada no sistema' },
      { id: 's2', type: 'wait', label: 'Aguardar (2 dias antes)', description: 'Enviar 2 dias antes da consulta' },
      { id: 's3', type: 'message', label: 'Lembrete WhatsApp', description: 'Ola {nome}! Lembrando que sua consulta e no dia {data} as {hora}. Confirme respondendo SIM.' },
      { id: 's4', type: 'wait', label: 'Aguardar (2 horas antes)', description: 'Enviar 2 horas antes da consulta' },
      { id: 's5', type: 'message', label: 'Lembrete Final', description: 'Sua consulta na Sbarzi Odontologia e em 2 horas! Estamos esperando voce.' },
    ],
  },
  {
    id: '3',
    name: 'Acompanhamento Pos-Consulta',
    description: 'Follow-up automatico apos procedimentos realizados',
    type: 'followup',
    isActive: true,
    totalSent: 432,
    opened: 346,
    converted: 89,
    steps: [
      { id: 's1', type: 'trigger', label: 'Consulta Realizada', description: 'Quando uma consulta e marcada como concluida' },
      { id: 's2', type: 'wait', label: 'Aguardar 1 dia', description: 'Esperar 24 horas' },
      { id: 's3', type: 'message', label: 'Como Voce Esta?', description: 'Ola {nome}! Como voce esta se sentindo apos o procedimento? Alguma duvida?' },
      { id: 's4', type: 'wait', label: 'Aguardar 7 dias', description: 'Esperar 7 dias' },
      { id: 's5', type: 'message', label: 'Avaliacao', description: 'Gostaramos de saber: como foi sua experiencia na Sbarzi? Avalie de 1 a 5.' },
      { id: 's6', type: 'wait', label: 'Aguardar 30 dias', description: 'Esperar 30 dias' },
      { id: 's7', type: 'action', label: 'Agendar Retorno', description: 'Sugerir agendamento de retorno' },
    ],
  },
  {
    id: '4',
    name: 'Parabens de Aniversario',
    description: 'Mensagem especial no aniversario do paciente com oferta',
    type: 'birthday',
    isActive: true,
    totalSent: 156,
    opened: 140,
    converted: 28,
    steps: [
      { id: 's1', type: 'trigger', label: 'Aniversario do Paciente', description: 'No dia do aniversario do paciente' },
      { id: 's2', type: 'message', label: 'Parabens!', description: 'Feliz Aniversario, {nome}! A Sbarzi Odontologia deseja um dia incrivel. Presente: 20% de desconto em qualquer procedimento estetico!' },
      { id: 's3', type: 'wait', label: 'Aguardar 7 dias', description: 'Esperar 7 dias' },
      { id: 's4', type: 'condition', label: 'Usou o cupom?', description: 'Verificar se utilizou o desconto' },
      { id: 's5', type: 'message', label: 'Lembrete do Presente', description: 'Seu presente de aniversario ainda esta valido! Agende ate o fim do mes.' },
    ],
  },
  {
    id: '5',
    name: 'Reativacao de Pacientes',
    description: 'Campanha para pacientes inativos ha mais de 6 meses',
    type: 'reactivation',
    isActive: false,
    totalSent: 89,
    opened: 45,
    converted: 12,
    steps: [
      { id: 's1', type: 'trigger', label: 'Paciente Inativo', description: 'Paciente sem consulta ha mais de 180 dias' },
      { id: 's2', type: 'message', label: 'Sentimos Sua Falta', description: 'Ola {nome}! Sentimos sua falta na Sbarzi. Que tal agendar um check-up?' },
      { id: 's3', type: 'wait', label: 'Aguardar 5 dias', description: 'Esperar 5 dias' },
      { id: 's4', type: 'condition', label: 'Respondeu?', description: 'Verificar se houve resposta' },
      { id: 's5', type: 'message', label: 'Oferta de Retorno', description: 'Temos uma condicao especial para seu retorno: avaliacao + limpeza por R$ 149!' },
      { id: 's6', type: 'wait', label: 'Aguardar 10 dias', description: 'Esperar 10 dias' },
      { id: 's7', type: 'message', label: 'Ultima Tentativa', description: 'Ultimo lembrete: sua saude bucal e importante! Estamos aqui quando precisar.' },
    ],
  },
];

const messageTemplates = [
  { id: '1', name: 'Confirmacao de Consulta', channel: 'WhatsApp', variables: ['{nome}', '{data}', '{hora}', '{dentista}'] },
  { id: '2', name: 'Lembrete de Retorno', channel: 'WhatsApp', variables: ['{nome}', '{ultimo_procedimento}', '{meses}'] },
  { id: '3', name: 'Aniversario', channel: 'WhatsApp', variables: ['{nome}', '{desconto}'] },
  { id: '4', name: 'Pos-Procedimento', channel: 'E-mail', variables: ['{nome}', '{procedimento}', '{cuidados}'] },
  { id: '5', name: 'Promocao Mensal', channel: 'E-mail', variables: ['{nome}', '{procedimento}', '{valor}', '{validade}'] },
];

type ViewMode = 'overview' | 'detail' | 'builder';

export default function AutomationPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [automations, setAutomations] = useState(mockAutomations);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  const toggleActive = (id: string) => {
    setAutomations(automations.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)));
  };

  const handleViewDetail = (auto: Automation) => {
    setSelectedAutomation(auto);
    setViewMode('detail');
  };

  const totalSent = automations.reduce((s, a) => s + a.totalSent, 0);
  const totalOpened = automations.reduce((s, a) => s + a.opened, 0);
  const totalConverted = automations.reduce((s, a) => s + a.converted, 0);
  const activeCount = automations.filter((a) => a.isActive).length;

  const stepTypeConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    trigger: { color: 'text-[#0D9488]', bg: 'bg-[#0D9488]', icon: <Zap className="w-4 h-4 text-white" /> },
    wait: { color: 'text-amber-600', bg: 'bg-amber-400', icon: <Timer className="w-4 h-4 text-white" /> },
    message: { color: 'text-blue-600', bg: 'bg-blue-500', icon: <Send className="w-4 h-4 text-white" /> },
    condition: { color: 'text-purple-600', bg: 'bg-purple-500', icon: <Target className="w-4 h-4 text-white" /> },
    action: { color: 'text-[#D4A76A]', bg: 'bg-[#D4A76A]', icon: <Settings className="w-4 h-4 text-white" /> },
  };

  // Detail View
  if (viewMode === 'detail' && selectedAutomation) {
    const auto = selectedAutomation;
    const tcfg = typeConfig[auto.type];
    const openRate = auto.totalSent > 0 ? ((auto.opened / auto.totalSent) * 100).toFixed(1) : '0';
    const convRate = auto.totalSent > 0 ? ((auto.converted / auto.totalSent) * 100).toFixed(1) : '0';

    return (
      <div className="p-6 bg-gray-50 min-h-screen space-y-6">
        <button
          onClick={() => setViewMode('overview')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800"
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Voltar
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg ${tcfg.bg} flex items-center justify-center ${tcfg.color}`}>
                {tcfg.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-800">{auto.name}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{auto.description}</p>
              </div>
            </div>
            <button
              onClick={() => toggleActive(auto.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                auto.isActive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {auto.isActive ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {auto.isActive ? 'Ativa' : 'Pausada'}
            </button>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Enviadas</p>
              <p className="text-xl font-bold text-gray-800">{auto.totalSent}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Abertas</p>
              <p className="text-xl font-bold text-gray-800">{auto.opened}</p>
              <p className="text-[10px] text-[#0D9488]">{openRate}% taxa</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Convertidas</p>
              <p className="text-xl font-bold text-gray-800">{auto.converted}</p>
              <p className="text-[10px] text-[#D4A76A]">{convRate}% taxa</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500">Etapas</p>
              <p className="text-xl font-bold text-gray-800">{auto.steps.length}</p>
            </div>
          </div>
        </div>

        {/* Visual Workflow */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-6">Fluxo do Workflow</h3>
          <div className="space-y-0">
            {auto.steps.map((step, idx) => {
              const scfg = stepTypeConfig[step.type];
              return (
                <div key={step.id}>
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full ${scfg.bg} flex items-center justify-center shadow-sm`}>
                        {scfg.icon}
                      </div>
                      {idx < auto.steps.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 my-1" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider ${scfg.color}`}>
                          {step.type === 'trigger' ? 'Gatilho' :
                           step.type === 'wait' ? 'Espera' :
                           step.type === 'message' ? 'Mensagem' :
                           step.type === 'condition' ? 'Condicao' : 'Acao'}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800">{step.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Overview
  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Automacao de Marketing</h1>
          <p className="text-sm text-gray-500">Sbarzi Odontologia e Saude</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] text-white rounded-lg text-sm font-medium hover:bg-[#0D9488]/90 transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo Workflow
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Automacoes Ativas</span>
            <Zap className="w-5 h-5 text-[#0D9488]" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{activeCount}/{automations.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Total Enviadas</span>
            <Send className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{totalSent.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Taxa de Abertura</span>
            <Eye className="w-5 h-5 text-[#D4A76A]" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : '0'}%
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">Taxa de Conversao</span>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800">
            {totalSent > 0 ? ((totalConverted / totalSent) * 100).toFixed(1) : '0'}%
          </p>
        </div>
      </div>

      {/* Workflow Templates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Workflows</h2>
        <div className="space-y-4">
          {automations.map((auto) => {
            const tcfg = typeConfig[auto.type];
            const openRate = auto.totalSent > 0 ? ((auto.opened / auto.totalSent) * 100).toFixed(1) : '0';
            const convRate = auto.totalSent > 0 ? ((auto.converted / auto.totalSent) * 100).toFixed(1) : '0';
            return (
              <div key={auto.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Left: Info */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-lg ${tcfg.bg} flex items-center justify-center ${tcfg.color} shrink-0`}>
                      {tcfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-800">{auto.name}</h3>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${tcfg.color} ${tcfg.bg}`}>
                          {tcfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{auto.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span>{auto.steps.length} etapas</span>
                        <span>{auto.totalSent} enviadas</span>
                        <span>Abertura: {openRate}%</span>
                        <span>Conversao: {convRate}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleActive(auto.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        auto.isActive ? 'bg-[#0D9488]' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          auto.isActive ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => handleViewDetail(auto)}
                      className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Mini workflow preview */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {auto.steps.map((step, idx) => {
                      const scfg = stepTypeConfig[step.type];
                      return (
                        <div key={step.id} className="flex items-center shrink-0">
                          <div
                            className={`w-7 h-7 rounded-full ${scfg.bg} flex items-center justify-center`}
                            title={step.label}
                          >
                            {scfg.icon}
                          </div>
                          {idx < auto.steps.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-gray-300 mx-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Message Templates */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Templates de Mensagem</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {messageTemplates.map((tmpl) => (
            <div key={tmpl.id} className="border-b border-gray-50 last:border-0">
              <button
                onClick={() => setExpandedTemplate(expandedTemplate === tmpl.id ? null : tmpl.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0D9488]/10 flex items-center justify-center">
                    {tmpl.channel === 'WhatsApp' ? (
                      <MessageCircle className="w-4 h-4 text-[#0D9488]" />
                    ) : (
                      <Mail className="w-4 h-4 text-[#0D9488]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tmpl.name}</p>
                    <p className="text-xs text-gray-400">{tmpl.channel}</p>
                  </div>
                </div>
                {expandedTemplate === tmpl.id ? (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </button>
              {expandedTemplate === tmpl.id && (
                <div className="px-4 pb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 mb-2">Variaveis de Personalizacao:</p>
                    <div className="flex flex-wrap gap-2">
                      {tmpl.variables.map((v) => (
                        <span key={v} className="text-xs px-2 py-1 rounded-md bg-[#0D9488]/10 text-[#0D9488] font-mono">
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Active Monitoring */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#0D9488]" />
          <h3 className="font-semibold text-gray-800">Monitoramento Ativo</h3>
        </div>
        <div className="space-y-3">
          {automations.filter((a) => a.isActive).map((auto) => {
            const openPct = auto.totalSent > 0 ? (auto.opened / auto.totalSent) * 100 : 0;
            const convPct = auto.totalSent > 0 ? (auto.converted / auto.totalSent) * 100 : 0;
            const tcfg = typeConfig[auto.type];
            return (
              <div key={auto.id} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-lg ${tcfg.bg} flex items-center justify-center ${tcfg.color} shrink-0`}>
                  {tcfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate">{auto.name}</span>
                    <div className="flex items-center gap-3 text-xs shrink-0">
                      <span className="text-gray-500">Abertura: <span className="font-medium text-gray-800">{openPct.toFixed(0)}%</span></span>
                      <span className="text-gray-500">Conversao: <span className="font-medium text-[#0D9488]">{convPct.toFixed(0)}%</span></span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0D9488] rounded-full" style={{ width: `${openPct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
