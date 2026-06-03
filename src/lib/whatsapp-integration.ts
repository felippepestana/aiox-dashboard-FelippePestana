// =============================================================================
// WhatsApp Integration Utilities
// APEX Legal Performance — wa.me deep link approach (no Business API required)
// =============================================================================

// ─── Types ───────────────────────────────────────────────────────────────────

export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type TemplateCategory =
  | 'scheduling'
  | 'process_update'
  | 'deadline'
  | 'documents'
  | 'confirmation'
  | 'welcome';

export interface WhatsAppMessage {
  id: string;
  clientId: string;
  clientName: string;
  phone: string;
  message: string;
  direction: MessageDirection;
  timestamp: string;
  status: MessageStatus;
  templateName?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  content: string;
  variables: string[];
  description: string;
}

export interface TemplateVariables {
  client_name?: string;
  process_number?: string;
  deadline_date?: string;
  meeting_date?: string;
  meeting_time?: string;
  lawyer_name?: string;
  document_list?: string;
  office_name?: string;
  legal_area?: string;
  amount?: string;
}

// ─── Phone Utilities ─────────────────────────────────────────────────────────

/**
 * Formats a phone number to international Brazilian format (+55...).
 * Strips non-digits and prepends +55 if not already present.
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Already has country code 55
  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`;
  }

  // 11 digits = DDD + 9-digit mobile or 8-digit landline
  if (digits.length === 11 || digits.length === 10) {
    return `+55${digits}`;
  }

  // Fallback: just prepend +55
  return `+55${digits}`;
}

/**
 * Generates a wa.me deep link for opening WhatsApp chat.
 * If message is provided it will be pre-filled in the chat input.
 */
export function buildWhatsAppLink(phone: string, message?: string): string {
  const formatted = formatPhoneNumber(phone).replace('+', '');
  const base = `https://wa.me/${formatted}`;
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

// ─── Templates ───────────────────────────────────────────────────────────────

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tpl-welcome',
    name: 'Boas-vindas ao novo cliente',
    category: 'welcome',
    description: 'Mensagem de boas-vindas para novos clientes do escritório.',
    variables: ['client_name', 'lawyer_name', 'office_name'],
    content: `Olá, {{client_name}}! 👋

Seja muito bem-vindo(a) ao escritório {{office_name}}!

Sou {{lawyer_name}}, responsável pelo seu caso. Estou à disposição para tirar dúvidas e acompanhar você em cada etapa.

Caso precise de qualquer informação, é só entrar em contato por aqui. Vamos juntos! ⚖️`,
  },
  {
    id: 'tpl-scheduling',
    name: 'Agendamento de reunião',
    category: 'scheduling',
    description: 'Confirmação ou proposta de data para reunião com o cliente.',
    variables: ['client_name', 'meeting_date', 'meeting_time', 'lawyer_name'],
    content: `Olá, {{client_name}}!

Gostaríamos de agendar uma reunião para discutir o seu processo.

📅 Data: {{meeting_date}}
🕐 Horário: {{meeting_time}}
👤 Responsável: {{lawyer_name}}

Você confirma a presença? Caso queira remarcar, é só nos avisar com antecedência.`,
  },
  {
    id: 'tpl-process-update',
    name: 'Atualização processual',
    category: 'process_update',
    description: 'Informa o cliente sobre nova movimentação no processo.',
    variables: ['client_name', 'process_number', 'legal_area'],
    content: `Olá, {{client_name}}!

Informamos que houve uma nova movimentação no seu processo *{{process_number}}* ({{legal_area}}).

Por favor, entre em contato conosco para que possamos detalhar os próximos passos e orientá-lo(a) da melhor forma.

Estamos à disposição! ⚖️`,
  },
  {
    id: 'tpl-deadline',
    name: 'Lembrete de prazo',
    category: 'deadline',
    description: 'Alerta o cliente sobre prazo processual importante.',
    variables: ['client_name', 'process_number', 'deadline_date'],
    content: `⚠️ Atenção, {{client_name}}!

Informamos que o prazo referente ao processo *{{process_number}}* vence em *{{deadline_date}}*.

É importante que tomemos as providências necessárias com antecedência. Por favor, entre em contato o quanto antes para garantirmos o cumprimento do prazo.

Contamos com você! ⚖️`,
  },
  {
    id: 'tpl-documents',
    name: 'Solicitação de documentos',
    category: 'documents',
    description: 'Solicita documentos necessários para o processo.',
    variables: ['client_name', 'process_number', 'document_list'],
    content: `Olá, {{client_name}}!

Para darmos continuidade ao processo *{{process_number}}*, precisamos dos seguintes documentos:

{{document_list}}

Por favor, envie-os assim que possível, de preferência em formato PDF. Caso tenha dúvidas sobre algum documento, estamos à disposição para ajudar.

Obrigado pela colaboração! 📄`,
  },
  {
    id: 'tpl-confirmation',
    name: 'Confirmação de recebimento',
    category: 'confirmation',
    description: 'Confirma o recebimento de documentos ou informações do cliente.',
    variables: ['client_name', 'process_number'],
    content: `Olá, {{client_name}}!

Confirmamos o recebimento dos documentos referentes ao processo *{{process_number}}*.

Nossos advogados irão analisar o material em breve e entraremos em contato com as próximas orientações.

Muito obrigado pela colaboração! ✅`,
  },
];

// ─── Template Utilities ───────────────────────────────────────────────────────

/**
 * Fills in template variables with the provided values.
 * Variables use the {{variable_name}} syntax.
 * Unfilled variables are left as-is for manual editing.
 */
export function fillTemplate(
  template: MessageTemplate,
  variables: TemplateVariables
): string {
  let content = template.content;
  const entries = Object.entries(variables) as [keyof TemplateVariables, string][];
  for (const [key, value] of entries) {
    if (value) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      content = content.replace(regex, value);
    }
  }
  return content;
}

/**
 * Returns the label for a template category.
 */
export function getTemplateCategoryLabel(category: TemplateCategory): string {
  const labels: Record<TemplateCategory, string> = {
    welcome: 'Boas-vindas',
    scheduling: 'Agendamento',
    process_update: 'Atualização',
    deadline: 'Prazo',
    documents: 'Documentos',
    confirmation: 'Confirmação',
  };
  return labels[category];
}

/**
 * Returns color classes for template category badges.
 */
export function getTemplateCategoryColor(category: TemplateCategory): string {
  const colors: Record<TemplateCategory, string> = {
    welcome: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    scheduling: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    process_update: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    deadline: 'bg-red-500/10 text-red-400 border-red-500/20',
    documents: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    confirmation: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  };
  return colors[category];
}

// ─── Mock / Simulated data helpers ───────────────────────────────────────────

/** Generates a random message id */
export function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/** Returns current ISO timestamp */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Formats a timestamp for display in chat bubbles */
export function formatChatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formats a timestamp for sidebar last-message preview */
export function formatSidebarTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}
