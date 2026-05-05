'use client';

import { useState } from 'react';
import {
  MessageCircle,
  Bot,
  CalendarCheck,
  Bell,
  Headphones,
  Phone,
  Lock,
  Send,
  User,
  ChevronRight,
} from 'lucide-react';

// ─── Mock Conversation ──────────────────────────────────────────────────────

const MOCK_MESSAGES = [
  {
    id: 1,
    sender: 'client',
    text: 'Olá, gostaria de agendar uma consulta sobre direito trabalhista.',
    time: '10:32',
  },
  {
    id: 2,
    sender: 'bot',
    text: 'Olá! Bem-vindo ao escritório AIOX Legal. Posso ajudar com o agendamento. Qual horário seria melhor para você?\n\n1. Manhã (9h - 12h)\n2. Tarde (14h - 18h)\n3. Noite (18h - 20h)',
    time: '10:32',
  },
  {
    id: 3,
    sender: 'client',
    text: 'Prefiro à tarde, por favor.',
    time: '10:33',
  },
  {
    id: 4,
    sender: 'bot',
    text: 'Temos os seguintes horários disponíveis para esta semana:\n\n- Terça 14:00\n- Quarta 15:30\n- Quinta 14:00\n- Sexta 16:00\n\nQual prefere?',
    time: '10:33',
  },
  {
    id: 5,
    sender: 'client',
    text: 'Quarta às 15:30 está ótimo.',
    time: '10:34',
  },
  {
    id: 6,
    sender: 'bot',
    text: 'Perfeito! Sua consulta foi agendada para Quarta-feira às 15:30 com Dr. Carlos Mendes, especialista em Direito do Trabalho.\n\nVocê receberá uma confirmação por e-mail. Precisa de mais alguma coisa?',
    time: '10:34',
  },
];

// ─── Features ───────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Bot,
    title: 'Chatbot Jurídico',
    description: 'Atendimento automatizado 24/7 com IA para triagem e orientação inicial de clientes.',
  },
  {
    icon: CalendarCheck,
    title: 'Agendamento Inteligente',
    description: 'Agenda consultas automaticamente conforme disponibilidade dos advogados.',
  },
  {
    icon: Bell,
    title: 'Notificações de Prazo',
    description: 'Alertas automáticos para clientes sobre prazos, audiências e movimentações.',
  },
  {
    icon: Headphones,
    title: 'Atendimento Inicial',
    description: 'Coleta de informações do cliente antes da consulta para otimizar o atendimento.',
  },
];

// ─── Page Component ─────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const [apiNumber] = useState('+55 11 9999-8888');
  const [welcomeMsg] = useState(
    'Olá! Bem-vindo ao escritório AIOX Legal. Como posso ajudá-lo hoje?'
  );

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-700 shadow-lg shadow-green-500/20">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Integração WhatsApp Business</h1>
            <p className="text-sm text-[#6b7a8d]">Automatize o atendimento jurídico via WhatsApp</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl space-y-6">
        {/* Status Card */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
            <Lock className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-amber-400">Integração em Configuração</h2>
            <p className="text-xs text-[#8899aa] mt-0.5">
              A integração com WhatsApp Business API está sendo preparada. Configure os parâmetros abaixo para ativação.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            Em breve
          </span>
        </div>

        {/* Features Grid */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Funcionalidades</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-5 flex gap-4"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 flex-shrink-0">
                    <Icon className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{feat.title}</h3>
                    <p className="text-xs text-[#6b7a8d] mt-1">{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Form (disabled) */}
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-6">
            <h2 className="text-sm font-semibold text-white mb-4">Configuração</h2>
            <div className="space-y-4 opacity-60 pointer-events-none">
              {/* API Number */}
              <div>
                <label className="block text-xs text-[#6b7a8d] uppercase tracking-wider mb-1.5">
                  Número WhatsApp Business API
                </label>
                <div className="flex items-center gap-2 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-2.5">
                  <Phone className="h-4 w-4 text-[#6b7a8d]" />
                  <input
                    type="text"
                    value={apiNumber}
                    readOnly
                    className="flex-1 bg-transparent text-sm text-white outline-none"
                  />
                </div>
              </div>

              {/* Welcome Message */}
              <div>
                <label className="block text-xs text-[#6b7a8d] uppercase tracking-wider mb-1.5">
                  Mensagem de Boas-vindas
                </label>
                <textarea
                  value={welcomeMsg}
                  readOnly
                  rows={3}
                  className="w-full rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-2.5 text-sm text-white outline-none resize-none"
                />
              </div>

              {/* Auto-reply Templates */}
              <div>
                <label className="block text-xs text-[#6b7a8d] uppercase tracking-wider mb-1.5">
                  Templates de Resposta Automática
                </label>
                <div className="space-y-2">
                  {['Agendamento de consulta', 'Informações sobre processos', 'Horário de funcionamento'].map(
                    (template) => (
                      <div
                        key={template}
                        className="flex items-center justify-between rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-2.5"
                      >
                        <span className="text-sm text-[#8899aa]">{template}</span>
                        <ChevronRight className="h-4 w-4 text-[#6b7a8d]" />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Activate Button (disabled) */}
            <div className="mt-6 relative">
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-500/20 py-3 text-sm font-semibold text-green-400 cursor-not-allowed"
              >
                <MessageCircle className="h-4 w-4" />
                Ativar Integração
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
                  Em breve
                </span>
              </button>
            </div>
          </div>

          {/* Mock Conversation Preview */}
          <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] overflow-hidden flex flex-col">
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-[#1a2332] px-4 py-3 bg-[#0a0f1a]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20">
                <MessageCircle className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">AIOX Legal Bot</p>
                <p className="text-[10px] text-green-400">Online</p>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 space-y-3 max-h-[420px] overflow-y-auto">
              {MOCK_MESSAGES.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                      msg.sender === 'client'
                        ? 'bg-green-600/20 border border-green-500/20 text-white'
                        : 'bg-[#1a2332] border border-[#2a3342] text-[#c8d6e5]'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {msg.sender === 'bot' ? (
                        <Bot className="h-3 w-3 text-green-400" />
                      ) : (
                        <User className="h-3 w-3 text-[#6b7a8d]" />
                      )}
                      <span className="text-[10px] text-[#6b7a8d]">{msg.time}</span>
                    </div>
                    <p className="text-xs leading-relaxed whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input (disabled) */}
            <div className="border-t border-[#1a2332] p-3">
              <div className="flex items-center gap-2 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-4 py-2.5 opacity-50">
                <input
                  type="text"
                  placeholder="Preview apenas..."
                  disabled
                  className="flex-1 bg-transparent text-sm text-white outline-none"
                />
                <Send className="h-4 w-4 text-[#6b7a8d]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
