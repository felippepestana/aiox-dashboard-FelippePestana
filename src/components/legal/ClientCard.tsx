'use client';

import React from 'react';
import Link from 'next/link';
import type { LegalClient } from '@/types/legal';

export interface ClientCardProps {
  client: LegalClient;
  processCount?: number;
}

function maskCpfCnpj(value: string, type: 'pf' | 'pj'): string {
  const digits = value.replace(/\D/g, '');
  if (type === 'pf' && digits.length >= 11) {
    return `***${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
  }
  if (type === 'pj' && digits.length >= 14) {
    return `**.***.${digits.slice(4, 7)}/${digits.slice(7, 11)}-**`;
  }
  return value;
}

export function ClientCard({ client, processCount }: ClientCardProps) {
  return (
    <Link
      href={`/legal/clients/${client.id}`}
      className="block rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 hover:border-amber-500/30 transition-all duration-200 group"
    >
      {/* Name and type */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-amber-400 transition-colors flex-1">
          {client.name}
        </h3>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
            client.type === 'pf'
              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
          }`}
        >
          {client.type === 'pf' ? 'PF' : 'PJ'}
        </span>
      </div>

      {/* CPF/CNPJ */}
      <p className="text-xs text-gray-400 mt-2 font-mono">
        {client.type === 'pf' ? 'CPF' : 'CNPJ'}: {maskCpfCnpj(client.cpfCnpj, client.type)}
      </p>

      {/* Phone */}
      {client.phone && (
        <p className="text-xs text-gray-400 mt-1">
          <span className="text-gray-500">Tel:</span> {client.phone}
        </p>
      )}

      {/* Process count */}
      {processCount !== undefined && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-gray-500">Processos</span>
          <span className="text-sm font-semibold text-amber-400">{processCount}</span>
        </div>
      )}
    </Link>
  );
}
