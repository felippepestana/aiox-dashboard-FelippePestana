'use client';

import React from 'react';
import Link from 'next/link';
import type { LegalProcess, Deadline } from '@/types/legal';
import { ProcessStatusBadge } from './ProcessStatusBadge';

export interface ProcessCardProps {
  process: LegalProcess;
  clientName?: string;
  nextDeadline?: Deadline;
}

const AREA_LABELS: Record<string, string> = {
  civil: 'Civel',
  trabalhista: 'Trabalhista',
  tributario: 'Tributario',
  penal: 'Penal',
  administrativo: 'Administrativo',
  consumidor: 'Consumidor',
  familia: 'Familia',
  empresarial: 'Empresarial',
  previdenciario: 'Previdenciario',
  ambiental: 'Ambiental',
  digital: 'Digital',
};

const URGENCY_COLORS: Record<string, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
};

function formatCnj(cnj: string): string {
  const digits = cnj.replace(/\D/g, '').padEnd(20, '0');
  return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.slice(13, 14)}.${digits.slice(14, 16)}.${digits.slice(16, 20)}`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function ProcessCard({ process, clientName, nextDeadline }: ProcessCardProps) {
  return (
    <Link
      href={`/legal/processes/${process.id}`}
      className="block rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-200 group"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-mono text-gray-400 mb-1">
            {formatCnj(process.cnj)}
          </p>
          <h3 className="text-sm font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
            {process.title}
          </h3>
        </div>
        {/* Urgency indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`w-2 h-2 rounded-full ${URGENCY_COLORS[process.urgency] ?? 'bg-gray-500'}`}
            title={`Urgencia: ${process.urgency}`}
          />
        </div>
      </div>

      {/* Badges row */}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
          {AREA_LABELS[process.area] ?? process.area}
        </span>
        <ProcessStatusBadge status={process.status} />
      </div>

      {/* Client name */}
      {clientName && (
        <p className="text-xs text-gray-400 mt-3 truncate">
          <span className="text-gray-500">Cliente:</span> {clientName}
        </p>
      )}

      {/* Next deadline */}
      {nextDeadline && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-[11px] text-gray-500">Proximo prazo</p>
          <p className="text-xs text-amber-400 font-medium mt-0.5">
            {formatDate(nextDeadline.dueDate)} - {nextDeadline.title}
          </p>
        </div>
      )}
    </Link>
  );
}
