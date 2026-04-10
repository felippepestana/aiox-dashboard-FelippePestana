'use client';

import React from 'react';
import type { Deadline } from '@/types/legal';

export interface DeadlineListProps {
  deadlines: Deadline[];
  showProcess?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  fatal: 'Fatal',
  judicial: 'Judicial',
  internal: 'Interno',
  hearing: 'Audiencia',
  mediation: 'Mediacao',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  completed: 'Concluido',
  missed: 'Perdido',
  extended: 'Prorrogado',
};

function getUrgencyColor(dueDate: string, status: string): string {
  if (status === 'completed') return 'border-green-500/30';
  if (status === 'missed') return 'border-red-500/30';

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'border-red-500/50';
  if (diffDays < 3) return 'border-yellow-500/50';
  return 'border-green-500/30';
}

function getUrgencyDot(dueDate: string, status: string): string {
  if (status === 'completed') return 'bg-green-500';
  if (status === 'missed') return 'bg-red-500';

  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'bg-red-500';
  if (diffDays < 3) return 'bg-yellow-500';
  return 'bg-green-500';
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

function formatCnj(cnj: string): string {
  const digits = cnj.replace(/\D/g, '').padEnd(20, '0');
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16, 20)}`;
}

export function DeadlineList({ deadlines, showProcess = false }: DeadlineListProps) {
  if (deadlines.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Nenhum prazo encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {deadlines.map((deadline) => (
        <div
          key={deadline.id}
          className={`rounded-lg border bg-white/5 p-3 transition-colors hover:bg-white/10 ${getUrgencyColor(deadline.dueDate, deadline.status)}`}
        >
          <div className="flex items-start gap-3">
            {/* Urgency dot */}
            <span
              className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${getUrgencyDot(deadline.dueDate, deadline.status)}`}
            />

            <div className="flex-1 min-w-0">
              {/* Title and type badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-medium text-white truncate">
                  {deadline.title}
                </h4>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                  {TYPE_LABELS[deadline.type] ?? deadline.type}
                </span>
              </div>

              {/* Process CNJ */}
              {showProcess && deadline.processId && (
                <p className="text-[11px] font-mono text-gray-500 mt-1">
                  Processo: {formatCnj(deadline.processId)}
                </p>
              )}

              {/* Bottom row: date + status */}
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[11px] text-gray-400">
                  {formatDate(deadline.dueDate)}
                </span>
                <span className="text-[10px] text-gray-500 font-medium uppercase">
                  {STATUS_LABELS[deadline.status] ?? deadline.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
