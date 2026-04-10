'use client';

import React from 'react';
import type { ProcessStatus } from '@/types/legal';

const STATUS_CONFIG: Record<ProcessStatus, { label: string; color: string }> = {
  active: { label: 'Ativo', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  won: { label: 'Ganho', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  lost: { label: 'Perdido', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  settled: { label: 'Acordo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  suspended: { label: 'Suspenso', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  archived: { label: 'Arquivado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  closed: { label: 'Encerrado', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
};

export interface ProcessStatusBadgeProps {
  status: ProcessStatus;
}

export function ProcessStatusBadge({ status }: ProcessStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.color}`}
    >
      {config.label}
    </span>
  );
}
