'use client';

// =============================================================================
// LegalMessageComposer — Multi-channel message composer for client communication
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  Mail,
  MessageCircle,
  Smartphone,
  User,
  Send,
  Loader2,
  Bold,
  Italic,
  Link,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
}

export interface ComposerMessage {
  channel: 'email' | 'whatsapp' | 'sms';
  to: string;
  subject?: string;
  body: string;
}

export interface LegalMessageComposerProps {
  channels?: ('email' | 'whatsapp' | 'sms')[];
  templates?: MessageTemplate[];
  onSend: (message: ComposerMessage) => void;
  onCancel?: () => void;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANNEL_META = {
  email: {
    icon: <Mail size={15} />,
    label: 'E-mail',
    maxChars: null,
    warnAt: null,
    dangerAt: null,
  },
  whatsapp: {
    icon: <MessageCircle size={15} />,
    label: 'WhatsApp',
    maxChars: 4096,
    warnAt: 3500,
    dangerAt: 4000,
  },
  sms: {
    icon: <Smartphone size={15} />,
    label: 'SMS',
    maxChars: 160,
    warnAt: null,
    dangerAt: null,
  },
} as const;

// ─── Sub-components ───────────────────────────────────────────────────────────

function ApexInput({
  icon,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ReactNode }) {
  return (
    <div className="relative flex items-center">
      {icon && (
        <span className="absolute left-3 text-[#4A5568] pointer-events-none flex items-center">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={cn(
          'w-full h-10 rounded-md text-sm text-white',
          'bg-[#0a1628] border border-[rgba(192,192,192,0.12)]',
          'placeholder:text-[#4A5568]',
          'outline-none focus:border-[rgba(192,192,192,0.35)]',
          'transition-colors duration-150',
          icon ? 'pl-9 pr-3' : 'px-3',
          className
        )}
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LegalMessageComposer({
  channels = ['email', 'whatsapp', 'sms'],
  templates = [],
  onSend,
  onCancel,
  className,
}: LegalMessageComposerProps) {
  const [activeChannel, setActiveChannel] = useState<'email' | 'whatsapp' | 'sms'>(
    channels[0] ?? 'email'
  );
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);

  const meta = CHANNEL_META[activeChannel];
  const charCount = body.length;
  const smsSegments = activeChannel === 'sms' ? Math.ceil(charCount / 160) || 1 : null;

  // Char count color
  const charColor = (() => {
    if (activeChannel === 'whatsapp') {
      if (charCount >= 4000) return 'text-red-400';
      if (charCount >= 3500) return 'text-yellow-400';
    }
    if (activeChannel === 'sms' && charCount > 160) return 'text-red-400';
    return 'text-[#4A5568]';
  })();

  // Close template dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setTemplateOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Toolbar actions
  const wrapSelection = (before: string, after: string = before) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.slice(start, end);
    const next =
      body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(next);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertLink = () => {
    const url = window.prompt('URL do link:');
    if (!url) return;
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = body.slice(start, end) || 'link';
    const insertion = `[${selected}](${url})`;
    setBody(body.slice(0, start) + insertion + body.slice(end));
  };

  const applyTemplate = (tmpl: MessageTemplate) => {
    setTemplateOpen(false);
    if (body.trim()) {
      const ok = window.confirm('Substituir conteúdo atual?');
      if (!ok) return;
    }
    setBody(tmpl.content);
  };

  const canSend = to.trim().length > 0 && body.trim().length > 0 && !isSending;

  const handleSend = async () => {
    if (!canSend) return;
    setIsSending(true);
    try {
      await onSend({
        channel: activeChannel,
        to: to.trim(),
        subject: activeChannel === 'email' ? subject.trim() : undefined,
        body: body.trim(),
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div
      className={cn(
        'bg-[#0d1f3c] rounded-xl border border-[rgba(192,192,192,0.10)] p-5',
        'flex flex-col gap-4',
        className
      )}
    >
      {/* Channel tabs */}
      <div className="border-b border-[rgba(192,192,192,0.10)]">
        <div className="flex items-end gap-5">
          {channels.map((ch) => {
            const m = CHANNEL_META[ch];
            const isActive = ch === activeChannel;
            return (
              <button
                key={ch}
                type="button"
                onClick={() => setActiveChannel(ch)}
                className={cn(
                  'flex items-center gap-1.5 text-sm pb-2.5 transition-colors duration-150 cursor-pointer',
                  'border-b-2 -mb-px',
                  isActive
                    ? 'border-[#D4AF37] text-white'
                    : 'border-transparent text-[#718096] hover:text-[#A0AEC0]'
                )}
              >
                {m.icon}
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-3">
        {/* Para */}
        <div>
          <label className="block text-xs text-[#718096] mb-1.5">Para</label>
          <ApexInput
            icon={<User size={14} />}
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder={
              activeChannel === 'email'
                ? 'email@cliente.com'
                : activeChannel === 'whatsapp'
                ? '+55 11 99999-9999'
                : '(11) 99999-9999'
            }
          />
        </div>

        {/* Subject (email only) */}
        {activeChannel === 'email' && (
          <div>
            <label className="block text-xs text-[#718096] mb-1.5">Assunto</label>
            <ApexInput
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Assunto do e-mail..."
            />
          </div>
        )}

        {/* Body */}
        <div>
          <label className="block text-xs text-[#718096] mb-1.5">Mensagem</label>

          {/* Toolbar */}
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 mb-0',
              'bg-[#0a1628] border border-[rgba(192,192,192,0.12)] border-b-0',
              'rounded-t-md'
            )}
          >
            {/* Bold */}
            <button
              type="button"
              onClick={() => wrapSelection('**')}
              title="Negrito"
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded text-[#A0AEC0]',
                'bg-transparent hover:bg-[rgba(192,192,192,0.06)]',
                'transition-colors duration-100 cursor-pointer text-sm font-bold'
              )}
            >
              B
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => wrapSelection('_')}
              title="Itálico"
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded text-[#A0AEC0]',
                'bg-transparent hover:bg-[rgba(192,192,192,0.06)]',
                'transition-colors duration-100 cursor-pointer text-sm italic'
              )}
            >
              I
            </button>

            {/* Link */}
            <button
              type="button"
              onClick={insertLink}
              title="Inserir link"
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded text-[#A0AEC0]',
                'bg-transparent hover:bg-[rgba(192,192,192,0.06)]',
                'transition-colors duration-100 cursor-pointer'
              )}
            >
              <Link size={13} />
            </button>

            {/* Separator */}
            {templates.length > 0 && (
              <div className="w-px h-4 bg-[rgba(192,192,192,0.12)] mx-1" />
            )}

            {/* Template dropdown */}
            {templates.length > 0 && (
              <div ref={templateRef} className="relative">
                <button
                  type="button"
                  onClick={() => setTemplateOpen((v) => !v)}
                  title="Templates"
                  className={cn(
                    'flex items-center gap-1 h-7 px-2 rounded text-[#A0AEC0] text-xs',
                    'bg-transparent hover:bg-[rgba(192,192,192,0.06)]',
                    'transition-colors duration-100 cursor-pointer'
                  )}
                >
                  <FileText size={12} />
                  Templates
                  <ChevronDown size={11} />
                </button>

                {templateOpen && (
                  <div
                    className={cn(
                      'absolute left-0 top-full mt-1 z-50 min-w-[200px]',
                      'bg-[#0d1f3c] border border-[rgba(192,192,192,0.15)]',
                      'rounded-lg shadow-lg overflow-hidden'
                    )}
                  >
                    {templates.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => applyTemplate(tmpl)}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm text-[#A0AEC0]',
                          'hover:bg-[#121f36] hover:text-white',
                          'transition-colors duration-100 cursor-pointer'
                        )}
                      >
                        {tmpl.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva sua mensagem aqui..."
              maxLength={meta.maxChars ?? undefined}
              className={cn(
                'w-full min-h-[200px] px-3 py-2.5 text-sm text-white resize-y',
                'bg-[#0a1628] border border-[rgba(192,192,192,0.12)]',
                'rounded-b-md rounded-t-none',
                'placeholder:text-[#4A5568]',
                'outline-none focus:border-[rgba(192,192,192,0.35)]',
                'transition-colors duration-150',
                'pb-6' // room for char count
              )}
            />

            {/* Character count */}
            <div className="absolute bottom-2 right-3 flex items-center gap-2 pointer-events-none">
              {activeChannel === 'sms' && charCount > 0 && (
                <span className={cn('text-[10px]', charColor)}>
                  {smsSegments} segmento{smsSegments !== 1 ? 's' : ''}
                </span>
              )}
              <span className={cn('text-[10px]', charColor)}>
                {charCount}
                {meta.maxChars ? `/${meta.maxChars}` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 pt-1">
        {/* Cancel */}
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm',
              'border border-[rgba(192,192,192,0.20)] text-[#A0AEC0]',
              'hover:bg-[rgba(192,192,192,0.06)] transition-colors duration-150 cursor-pointer'
            )}
          >
            Cancelar
          </button>
        ) : (
          <div />
        )}

        {/* Send */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium',
            'transition-colors duration-150',
            canSend
              ? 'bg-[#D4AF37] text-[#060d1a] hover:bg-[#c9a632] cursor-pointer'
              : 'bg-[rgba(212,175,55,0.20)] text-[rgba(212,175,55,0.45)] cursor-not-allowed'
          )}
        >
          {isSending ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Send size={15} />
          )}
          Enviar
        </button>
      </div>
    </div>
  );
}
