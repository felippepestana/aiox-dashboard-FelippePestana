'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Search,
  Send,
  Phone,
  Mail,
  User,
  Briefcase,
  ChevronRight,
  X,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
  FileText,
  Layers,
  Users,
  CalendarClock,
  LayoutTemplate,
  ExternalLink,
  ChevronLeft,
  Info,
  PenSquare,
} from 'lucide-react';
import { useLegalStore } from '@/stores/legal-store';
import { PageHeader } from '@/components/legal/shared';
import { LegalMessageComposer } from '@/components/legal/LegalMessageComposer';
import type { ComposerMessage } from '@/components/legal/LegalMessageComposer';
import {
  buildWhatsAppLink,
  formatPhoneNumber,
  formatChatTime,
  formatSidebarTime,
  generateMessageId,
  nowISO,
  fillTemplate,
  getTemplateCategoryLabel,
  getTemplateCategoryColor,
  MESSAGE_TEMPLATES,
  type WhatsAppMessage,
  type TemplateVariables,
} from '@/lib/whatsapp-integration';

// ─── Mock seed messages per client ──────────────────────────────────────────

function seedMessages(clientId: string, clientName: string, phone: string): WhatsAppMessage[] {
  const base = Date.now() - 1000 * 60 * 60 * 3; // 3 hours ago
  return [
    {
      id: `seed-${clientId}-1`,
      clientId,
      clientName,
      phone,
      message: `Olá! Gostaria de uma atualização sobre o meu processo.`,
      direction: 'incoming',
      timestamp: new Date(base).toISOString(),
      status: 'read',
    },
    {
      id: `seed-${clientId}-2`,
      clientId,
      clientName,
      phone,
      message: `Olá, ${clientName.split(' ')[0]}! Tudo bem? Vamos verificar as últimas movimentações e entraremos em contato em breve.`,
      direction: 'outgoing',
      timestamp: new Date(base + 1000 * 60 * 2).toISOString(),
      status: 'read',
    },
  ];
}

// ─── Legal message templates for LegalMessageComposer ───────────────────────

const messageTemplates = [
  {
    id: '1',
    name: 'Lembrete de Prazo',
    content:
      'Prezado(a) [CLIENTE], informamos que o prazo para [AÇÃO] no processo [CNJ] vence em [DATA]. Favor providenciar os documentos necessários.',
  },
  {
    id: '2',
    name: 'Agendamento de Reunião',
    content:
      'Prezado(a) [CLIENTE], gostaríamos de agendar uma reunião para discutir o andamento do seu processo. Por favor, informe sua disponibilidade.',
  },
  {
    id: '3',
    name: 'Atualização Processual',
    content:
      'Prezado(a) [CLIENTE], informamos que houve uma nova movimentação no processo [CNJ]: [DESCRIÇÃO]. Estamos acompanhando e tomaremos as providências necessárias.',
  },
  {
    id: '4',
    name: 'Cobrança de Honorários',
    content:
      'Prezado(a) [CLIENTE], informamos que a parcela de honorários referente ao mês de [MÊS] encontra-se pendente. Favor regularizar o pagamento.',
  },
];

// ─── Tick icon by message status ────────────────────────────────────────────

function StatusTick({ status }: { status: WhatsAppMessage['status'] }) {
  if (status === 'failed') return <AlertCircle className="h-3 w-3 text-red-400" />;
  if (status === 'sent') return <Check className="h-3 w-3 text-[#6b7a8d]" />;
  if (status === 'delivered') return <CheckCheck className="h-3 w-3 text-[#6b7a8d]" />;
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-blue-400" />;
  return <Clock className="h-3 w-3 text-[#6b7a8d]" />;
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function WhatsAppPage() {
  const { clients, processes } = useLegalStore();

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Record<string, WhatsAppMessage[]>>({});
  const [showInfo, setShowInfo] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'templates'>('chat');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Clients with phone numbers ─────────────────────────────────────────────
  const contactClients = useMemo(
    () => clients.filter((c) => c.phone || c.whatsapp),
    [clients]
  );

  // ── Seed initial messages for each contact ─────────────────────────────────
  useEffect(() => {
    if (contactClients.length === 0) return;
    setMessages((prev) => {
      const next = { ...prev };
      for (const c of contactClients) {
        if (!next[c.id]) {
          next[c.id] = seedMessages(c.id, c.name, c.whatsapp || c.phone);
        }
      }
      return next;
    });
  }, [contactClients]);

  // ── Scroll to bottom when messages change ─────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedClientId]);

  // ── Selected client data ───────────────────────────────────────────────────
  const selectedClient = useMemo(
    () => (selectedClientId ? clients.find((c) => c.id === selectedClientId) : null),
    [clients, selectedClientId]
  );

  const selectedMessages = useMemo(
    () => (selectedClientId ? (messages[selectedClientId] ?? []) : []),
    [messages, selectedClientId]
  );

  const clientProcesses = useMemo(
    () => (selectedClientId ? processes.filter((p) => p.clientId === selectedClientId) : []),
    [processes, selectedClientId]
  );

  // ── Filtered contacts ──────────────────────────────────────────────────────
  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return contactClients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || '').includes(q) ||
        (c.whatsapp || '').includes(q)
    );
  }, [contactClients, searchQuery]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const totalMessages = Object.values(messages).flat();
  const messagesToday = totalMessages.filter(
    (m) => new Date(m.timestamp) >= todayStart
  ).length;

  const pendingResponses = useMemo(() => {
    return Object.entries(messages).filter(([, msgs]) => {
      const last = msgs[msgs.length - 1];
      return last?.direction === 'incoming';
    }).length;
  }, [messages]);

  // ── Unread count per client ────────────────────────────────────────────────
  function getUnreadCount(clientId: string): number {
    const msgs = messages[clientId] ?? [];
    // Simulated: count incoming messages that aren't "read"
    return msgs.filter((m) => m.direction === 'incoming' && m.status !== 'read').length;
  }

  // ── Toast helper ──────────────────────────────────────────────────────────
  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  }

  // ── Send message ──────────────────────────────────────────────────────────
  function handleSend() {
    if (!selectedClient || !messageInput.trim()) return;

    const phone = selectedClient.whatsapp || selectedClient.phone;
    const newMsg: WhatsAppMessage = {
      id: generateMessageId(),
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      phone,
      message: messageInput.trim(),
      direction: 'outgoing',
      timestamp: nowISO(),
      status: 'sent',
    };

    // Store locally
    setMessages((prev) => ({
      ...prev,
      [selectedClient.id]: [...(prev[selectedClient.id] ?? []), newMsg],
    }));

    // Open WhatsApp Web
    const link = buildWhatsAppLink(phone, messageInput.trim());
    window.open(link, '_blank', 'noopener,noreferrer');

    setMessageInput('');
    showToast('Mensagem preparada — WhatsApp Web aberto para envio.');
    inputRef.current?.focus();

    // Simulate status upgrades
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [selectedClient.id]: (prev[selectedClient.id] ?? []).map((m) =>
          m.id === newMsg.id ? { ...m, status: 'delivered' as const } : m
        ),
      }));
    }, 2000);
  }

  // ── Use template ──────────────────────────────────────────────────────────
  function handleUseTemplate(templateId: string) {
    const tpl = MESSAGE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl || !selectedClient) return;

    const vars: TemplateVariables = {
      client_name: selectedClient.name,
      office_name: 'APEX Legal',
      lawyer_name: 'Dr. Carlos Mendes',
      process_number:
        clientProcesses.length > 0 ? clientProcesses[0].cnj : '{{process_number}}',
    };

    const filled = fillTemplate(tpl, vars);
    setMessageInput(filled);
    setActiveTab('chat');
    inputRef.current?.focus();
  }

  // ── Select client ─────────────────────────────────────────────────────────
  function handleSelectClient(clientId: string) {
    setSelectedClientId(clientId);
    setActiveTab('chat');
    // Mark messages as read
    setMessages((prev) => ({
      ...prev,
      [clientId]: (prev[clientId] ?? []).map((m) =>
        m.direction === 'incoming' ? { ...m, status: 'read' as const } : m
      ),
    }));
  }

  // ── Key handler for textarea ───────────────────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Composer send handler ─────────────────────────────────────────────────
  function handleComposerSend(msg: ComposerMessage) {
    console.log('[LegalMessageComposer] Message sent:', msg);
    setShowComposer(false);
    showToast(`Mensagem preparada para ${msg.to} via ${msg.channel}.`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen max-h-screen bg-[#0a0f1a] overflow-hidden">

      {/* ── Toast ────────────────────────────────────────────────────────── */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 shadow-xl shadow-black/30 backdrop-blur-sm">
          <MessageCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
          <span className="text-sm text-green-300">{toastMsg}</span>
        </div>
      )}

      {/* ── Nova Mensagem — LegalMessageComposer Modal ───────────────────── */}
      {showComposer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl mx-4">
            <LegalMessageComposer
              channels={['whatsapp']}
              templates={messageTemplates}
              onSend={handleComposerSend}
              onCancel={() => setShowComposer(false)}
            />
          </div>
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-[#1a2332] px-6 py-4">
        <PageHeader
          title="WhatsApp — Comunicação com Clientes"
          subtitle="Prepare e envie mensagens via WhatsApp Web"
          breadcrumbs={[
            { label: 'Dashboard', href: '/legal' },
            { label: 'WhatsApp', href: '/legal/whatsapp' },
          ]}
          actions={
            <div className="flex items-center gap-3">
              <div className="hidden lg:flex items-center gap-3">
                <SummaryCard
                  icon={<Users className="h-4 w-4 text-blue-400" />}
                  label="Contatos"
                  value={contactClients.length}
                  color="blue"
                />
                <SummaryCard
                  icon={<MessageCircle className="h-4 w-4 text-green-400" />}
                  label="Hoje"
                  value={messagesToday}
                  color="green"
                />
                <SummaryCard
                  icon={<CalendarClock className="h-4 w-4 text-amber-400" />}
                  label="Aguardando"
                  value={pendingResponses}
                  color="amber"
                />
                <SummaryCard
                  icon={<LayoutTemplate className="h-4 w-4 text-purple-400" />}
                  label="Templates"
                  value={MESSAGE_TEMPLATES.length}
                  color="purple"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowComposer(true)}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500 transition-colors flex-shrink-0"
              >
                <PenSquare className="h-4 w-4" />
                <span>Nova Mensagem</span>
              </button>
            </div>
          }
          className="mb-0 pb-0 border-b-0"
        />
      </div>

      {/* ── Main 3-column layout ─────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Contact List ────────────────────────────────────────── */}
        <aside className="w-72 flex-shrink-0 border-r border-[#1a2332] flex flex-col bg-[#0d1320]">
          {/* Search */}
          <div className="p-3 border-b border-[#1a2332]">
            <div className="flex items-center gap-2 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2">
              <Search className="h-4 w-4 text-[#6b7a8d] flex-shrink-0" />
              <input
                type="text"
                placeholder="Buscar contato..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#4a5568] outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}>
                  <X className="h-3.5 w-3.5 text-[#6b7a8d]" />
                </button>
              )}
            </div>
          </div>

          {/* Contact list */}
          <div className="flex-1 overflow-y-auto">
            {filteredContacts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                <Users className="h-10 w-10 text-[#2a3342]" />
                <p className="text-sm text-[#6b7a8d]">
                  {contactClients.length === 0
                    ? 'Nenhum cliente com telefone cadastrado.'
                    : 'Nenhum contato encontrado.'}
                </p>
              </div>
            ) : (
              filteredContacts.map((client) => {
                const clientMsgs = messages[client.id] ?? [];
                const lastMsg = clientMsgs[clientMsgs.length - 1];
                const unread = getUnreadCount(client.id);
                const isSelected = selectedClientId === client.id;
                const phone = client.whatsapp || client.phone;
                // Simulated online status: clients with whatsapp field set
                const isOnline = !!client.whatsapp;

                return (
                  <button
                    key={client.id}
                    onClick={() => handleSelectClient(client.id)}
                    className={`w-full flex items-center gap-3 px-3 py-3 border-b border-[#1a2332] hover:bg-[#121b2a] transition-colors text-left ${
                      isSelected ? 'bg-[#0f1e30] border-l-2 border-l-[#D4AF37]' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#1a3a5c] to-[#0d2040] border border-[#1a2332] text-[#C0C0C0] font-semibold text-sm">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-[#0d1320]" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white truncate">
                          {client.name}
                        </span>
                        {lastMsg && (
                          <span className="text-[10px] text-[#6b7a8d] flex-shrink-0 ml-1">
                            {formatSidebarTime(lastMsg.timestamp)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-[#6b7a8d] truncate">
                          {lastMsg ? (
                            <span>
                              {lastMsg.direction === 'outgoing' && (
                                <StatusTick status={lastMsg.status} />
                              )}
                              {' '}{lastMsg.message}
                            </span>
                          ) : (
                            formatPhoneNumber(phone)
                          )}
                        </p>
                        {unread > 0 && (
                          <span className="ml-1 flex-shrink-0 h-4 w-4 rounded-full bg-green-500 flex items-center justify-center text-[9px] font-bold text-white">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── CENTER: Chat / Templates ──────────────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#0a0f1a]">
          {selectedClient ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-[#1a2332] px-4 py-3 bg-[#0d1320] flex-shrink-0">
                {/* Mobile back */}
                <button
                  className="lg:hidden"
                  onClick={() => setSelectedClientId(null)}
                >
                  <ChevronLeft className="h-5 w-5 text-[#6b7a8d]" />
                </button>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1a3a5c] to-[#0d2040] border border-[#1a2332] text-[#C0C0C0] font-semibold text-sm">
                    {selectedClient.name.charAt(0).toUpperCase()}
                  </div>
                  {selectedClient.whatsapp && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-[#0d1320]" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{selectedClient.name}</p>
                  <p className="text-xs text-[#6b7a8d]">
                    {formatPhoneNumber(selectedClient.whatsapp || selectedClient.phone)}
                    {selectedClient.whatsapp && (
                      <span className="ml-2 text-green-400">● online</span>
                    )}
                  </p>
                </div>

                {/* Tab switcher */}
                <div className="flex items-center rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-0.5 gap-0.5">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'chat'
                        ? 'bg-[#1a2332] text-white'
                        : 'text-[#6b7a8d] hover:text-white'
                    }`}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Chat
                  </button>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'templates'
                        ? 'bg-[#1a2332] text-white'
                        : 'text-[#6b7a8d] hover:text-white'
                    }`}
                  >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    Templates
                  </button>
                </div>

                {/* Open in WA */}
                <a
                  href={buildWhatsAppLink(selectedClient.whatsapp || selectedClient.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-green-500/20 bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/20 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Abrir WA</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                {/* Toggle info panel */}
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className={`rounded-lg border p-1.5 transition-colors ${
                    showInfo
                      ? 'border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]'
                      : 'border-[#1a2332] bg-transparent text-[#6b7a8d] hover:text-white'
                  }`}
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>

              {/* WA notice banner */}
              <div className="flex-shrink-0 flex items-center gap-2 border-b border-amber-500/10 bg-amber-500/5 px-4 py-2">
                <MessageCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-400">
                  Mensagens são preparadas localmente e enviadas via WhatsApp Web — não requer WhatsApp Business API.
                </p>
              </div>

              {activeTab === 'chat' ? (
                <>
                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-[#080d16]">
                    {/* Subtle WA watermark lines */}
                    <div className="pointer-events-none absolute inset-0 opacity-[0.015]"
                      style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 24px, #ffffff 25px)',
                      }}
                    />

                    {selectedMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-10">
                        <MessageCircle className="h-12 w-12 text-[#1a2332]" />
                        <p className="text-sm text-[#4a5568]">
                          Nenhuma mensagem ainda.<br />
                          Use um template ou escreva diretamente abaixo.
                        </p>
                      </div>
                    )}

                    {selectedMessages.map((msg) => {
                      const isOut = msg.direction === 'outgoing';
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`relative max-w-[72%] rounded-2xl px-4 py-2.5 shadow-sm ${
                              isOut
                                ? 'bg-[#0a4a2a] border border-green-700/30 text-white rounded-br-sm'
                                : 'bg-[#1a2332] border border-[#2a3444] text-[#c8d6e5] rounded-bl-sm'
                            }`}
                          >
                            {msg.templateName && (
                              <div className="flex items-center gap-1 mb-1.5">
                                <FileText className="h-3 w-3 text-[#D4AF37]" />
                                <span className="text-[10px] text-[#D4AF37]">{msg.templateName}</span>
                              </div>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-line">{msg.message}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isOut ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px] text-[#4a5568]">{formatChatTime(msg.timestamp)}</span>
                              {isOut && <StatusTick status={msg.status} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message input */}
                  <div className="flex-shrink-0 border-t border-[#1a2332] bg-[#0d1320] p-3">
                    <div className="flex items-end gap-2">
                      <div className="flex-1 rounded-xl border border-[#1a2332] bg-[#0a0f1a] px-4 py-2.5">
                        <textarea
                          ref={inputRef}
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Digite uma mensagem... (Enter para enviar, Shift+Enter para nova linha)"
                          rows={messageInput.split('\n').length > 3 ? 4 : Math.max(1, messageInput.split('\n').length)}
                          className="w-full bg-transparent text-sm text-white placeholder:text-[#4a5568] outline-none resize-none leading-relaxed"
                        />
                      </div>
                      <button
                        onClick={handleSend}
                        disabled={!messageInput.trim()}
                        className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-green-500 transition-colors flex-shrink-0"
                      >
                        <Send className="h-4 w-4" />
                        <span className="hidden sm:inline">Enviar</span>
                      </button>
                    </div>
                    <p className="mt-1.5 text-[10px] text-[#4a5568] text-center">
                      Ao enviar, o WhatsApp Web será aberto automaticamente com a mensagem pré-preenchida.
                    </p>
                  </div>
                </>
              ) : (
                /* Templates tab */
                <div className="flex-1 overflow-y-auto p-4">
                  <p className="text-xs text-[#6b7a8d] mb-4">
                    Clique em um template para preencher o chat automaticamente com os dados de{' '}
                    <strong className="text-white">{selectedClient.name}</strong>.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MESSAGE_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleUseTemplate(tpl.id)}
                        className="text-left rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 hover:border-[#D4AF37]/30 hover:bg-[#0f1e30] transition-all group"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-semibold text-white group-hover:text-[#D4AF37] transition-colors">
                            {tpl.name}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider flex-shrink-0 ${getTemplateCategoryColor(tpl.category)}`}
                          >
                            {getTemplateCategoryLabel(tpl.category)}
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7a8d] mb-3 line-clamp-2">{tpl.description}</p>
                        <div className="flex items-center gap-1 flex-wrap">
                          {tpl.variables.map((v) => (
                            <span
                              key={v}
                              className="px-1.5 py-0.5 rounded bg-[#1a2332] text-[10px] text-[#8899aa] font-mono"
                            >
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-1 text-xs text-[#6b7a8d] group-hover:text-[#D4AF37] transition-colors">
                          <ChevronRight className="h-3.5 w-3.5" />
                          Usar template
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* No client selected */
            <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/10 to-green-700/5 border border-green-500/10">
                <MessageCircle className="h-10 w-10 text-green-500/40" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">Selecione um contato</h2>
                <p className="text-sm text-[#6b7a8d] max-w-sm">
                  Escolha um cliente na lista à esquerda para iniciar ou continuar uma conversa via WhatsApp.
                </p>
              </div>

              {/* Quick stats when no client selected */}
              <div className="grid grid-cols-2 gap-3 mt-4 w-full max-w-sm">
                <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 text-center">
                  <p className="text-2xl font-bold text-white">{contactClients.length}</p>
                  <p className="text-xs text-[#6b7a8d] mt-1">Contatos</p>
                </div>
                <div className="rounded-xl border border-[#1a2332] bg-[#0d1320] p-4 text-center">
                  <p className="text-2xl font-bold text-white">{MESSAGE_TEMPLATES.length}</p>
                  <p className="text-xs text-[#6b7a8d] mt-1">Templates</p>
                </div>
              </div>

              {contactClients.length === 0 && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-400 max-w-sm">
                  Nenhum cliente com telefone cadastrado. Adicione clientes com número de telefone ou WhatsApp na seção{' '}
                  <a href="/legal/clients" className="underline font-semibold">Clientes</a>.
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── RIGHT: Client Info Panel ──────────────────────────────────── */}
        {showInfo && selectedClient && (
          <aside className="w-72 flex-shrink-0 border-l border-[#1a2332] flex flex-col bg-[#0d1320] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1a2332] px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7a8d]">
                Informações do Cliente
              </span>
              <button
                onClick={() => setShowInfo(false)}
                className="rounded p-1 hover:bg-[#1a2332] text-[#6b7a8d] hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Client card */}
            <div className="p-4 border-b border-[#1a2332]">
              <div className="flex flex-col items-center text-center gap-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#1a3a5c] to-[#0d2040] border-2 border-[#1a2332] text-[#C0C0C0] font-bold text-xl">
                  {selectedClient.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedClient.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a2332] text-[#6b7a8d] uppercase tracking-wider">
                    {selectedClient.type === 'pf' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <InfoRow
                  icon={<Phone className="h-3.5 w-3.5 text-green-400" />}
                  label="WhatsApp"
                  value={
                    selectedClient.whatsapp
                      ? formatPhoneNumber(selectedClient.whatsapp)
                      : '—'
                  }
                />
                <InfoRow
                  icon={<Phone className="h-3.5 w-3.5 text-[#6b7a8d]" />}
                  label="Telefone"
                  value={selectedClient.phone ? formatPhoneNumber(selectedClient.phone) : '—'}
                />
                <InfoRow
                  icon={<Mail className="h-3.5 w-3.5 text-blue-400" />}
                  label="E-mail"
                  value={selectedClient.email || '—'}
                />
              </div>
            </div>

            {/* Active processes */}
            <div className="p-4 border-b border-[#1a2332]">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-[#D4AF37]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7a8d]">
                  Processos Ativos
                </span>
                <span className="ml-auto text-xs text-[#D4AF37] font-semibold">
                  {clientProcesses.filter((p) => p.status === 'active').length}
                </span>
              </div>

              {clientProcesses.length === 0 ? (
                <p className="text-xs text-[#4a5568] text-center py-2">Nenhum processo vinculado.</p>
              ) : (
                <div className="space-y-2">
                  {clientProcesses.slice(0, 4).map((proc) => (
                    <div
                      key={proc.id}
                      className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-2.5"
                    >
                      <p className="text-xs font-medium text-white truncate">{proc.title}</p>
                      <p className="text-[10px] text-[#6b7a8d] mt-0.5 font-mono">{proc.cnj}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${getProcessStatusColor(proc.status)}`}>
                          {getProcessStatusLabel(proc.status)}
                        </span>
                        <span className="text-[10px] text-[#6b7a8d]">{getLegalAreaLabel(proc.area)}</span>
                      </div>
                    </div>
                  ))}
                  {clientProcesses.length > 4 && (
                    <p className="text-[10px] text-[#6b7a8d] text-center">
                      +{clientProcesses.length - 4} outros processos
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6b7a8d] mb-3 block">
                Ações Rápidas
              </span>
              <div className="space-y-2">
                <QuickAction
                  icon={<User className="h-3.5 w-3.5" />}
                  label="Ver perfil do cliente"
                  href={`/legal/clients`}
                />
                <QuickAction
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  label="Ver processos"
                  href={`/legal/processes`}
                />
                <a
                  href={buildWhatsAppLink(selectedClient.whatsapp || selectedClient.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-xs text-green-400 hover:bg-green-500/10 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Abrir chat no WhatsApp Web
                  <ExternalLink className="h-3 w-3 ml-auto" />
                </a>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'green' | 'amber' | 'purple';
}) {
  const colorMap = {
    blue: 'border-blue-500/20 bg-blue-500/5',
    green: 'border-green-500/20 bg-green-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
  };
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 ${colorMap[color]}`}>
      {icon}
      <div>
        <p className="text-sm font-bold text-white leading-none">{value}</p>
        <p className="text-[10px] text-[#6b7a8d] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#4a5568] uppercase tracking-wider">{label}</p>
        <p className="text-xs text-[#c8d6e5] truncate">{value}</p>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 rounded-lg border border-[#1a2332] bg-[#0a0f1a] px-3 py-2 text-xs text-[#8899aa] hover:text-white hover:border-[#2a3342] transition-colors"
    >
      {icon}
      {label}
      <ChevronRight className="h-3.5 w-3.5 ml-auto" />
    </a>
  );
}

// ─── Label helpers ───────────────────────────────────────────────────────────

function getProcessStatusLabel(status: string): string {
  const map: Record<string, string> = {
    active: 'Ativo',
    archived: 'Arquivado',
    suspended: 'Suspenso',
    closed: 'Encerrado',
    won: 'Ganho',
    lost: 'Perdido',
    settled: 'Acordado',
  };
  return map[status] ?? status;
}

function getProcessStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: 'border-green-500/20 text-green-400',
    archived: 'border-[#2a3342] text-[#6b7a8d]',
    suspended: 'border-amber-500/20 text-amber-400',
    closed: 'border-[#2a3342] text-[#6b7a8d]',
    won: 'border-blue-500/20 text-blue-400',
    lost: 'border-red-500/20 text-red-400',
    settled: 'border-purple-500/20 text-purple-400',
  };
  return map[status] ?? 'border-[#2a3342] text-[#6b7a8d]';
}

function getLegalAreaLabel(area: string): string {
  const map: Record<string, string> = {
    civil: 'Civil',
    trabalhista: 'Trabalhista',
    tributario: 'Tributário',
    penal: 'Penal',
    administrativo: 'Adm.',
    consumidor: 'Consumidor',
    familia: 'Família',
    empresarial: 'Empresarial',
    previdenciario: 'Previdenciário',
    ambiental: 'Ambiental',
    digital: 'Digital',
  };
  return map[area] ?? area;
}
