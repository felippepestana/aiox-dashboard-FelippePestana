'use client';

import React from 'react';
import type { LegalLead, LeadStatus } from '@/types/legal';

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

const STATUS_LABELS: Record<LeadStatus, string> = {
  prospect: 'Prospectos',
  qualified: 'Qualificados',
  contacted: 'Contatados',
  proposal: 'Proposta',
  retained: 'Retidos',
  lost: 'Perdidos',
};

const STATUS_COLORS: Record<LeadStatus, string> = {
  prospect: 'border-blue-500/30 bg-blue-500/5',
  qualified: 'border-purple-500/30 bg-purple-500/5',
  contacted: 'border-amber-500/30 bg-amber-500/5',
  proposal: 'border-cyan-500/30 bg-cyan-500/5',
  retained: 'border-green-500/30 bg-green-500/5',
  lost: 'border-red-500/30 bg-red-500/5',
};

const HEADER_COLORS: Record<LeadStatus, string> = {
  prospect: 'text-blue-400',
  qualified: 'text-purple-400',
  contacted: 'text-amber-400',
  proposal: 'text-cyan-400',
  retained: 'text-green-400',
  lost: 'text-red-400',
};

export interface LeadPipelineProps {
  leads: LegalLead[];
  onMoveLeadForward?: (leadId: string) => void;
  onMoveLeadBackward?: (leadId: string) => void;
}

const STATUSES: LeadStatus[] = ['prospect', 'qualified', 'contacted', 'proposal', 'retained', 'lost'];

export function LeadPipeline({ leads, onMoveLeadForward, onMoveLeadBackward }: LeadPipelineProps) {
  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {STATUSES.map((status) => {
        const columnLeads = leads.filter((l) => l.status === status);
        return (
          <div
            key={status}
            className={`flex-shrink-0 w-64 rounded-xl border ${STATUS_COLORS[status]} p-3`}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-semibold ${HEADER_COLORS[status]}`}>
                {STATUS_LABELS[status]}
              </h3>
              <span className="text-xs text-[#6b7a8d] bg-[#0a0f1a] px-2 py-0.5 rounded-full">
                {columnLeads.length}
              </span>
            </div>

            <div className="space-y-2">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-lg border border-[#1a2332] bg-[#0a0f1a] p-3"
                >
                  <p className="text-sm font-medium text-white truncate">{lead.name}</p>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400">
                      {AREA_LABELS[lead.area] ?? lead.area}
                    </span>
                    <span className="text-[10px] text-[#6b7a8d]">{lead.source}</span>
                  </div>
                  {lead.phone && (
                    <p className="text-[10px] text-[#6b7a8d] mt-1">{lead.phone}</p>
                  )}
                  <p className="text-[10px] text-[#6b7a8d] mt-1">{formatDate(lead.createdAt)}</p>

                  <div className="flex items-center gap-1 mt-2">
                    {onMoveLeadBackward && status !== 'prospect' && (
                      <button
                        onClick={() => onMoveLeadBackward(lead.id)}
                        className="text-[10px] text-[#6b7a8d] hover:text-white px-1.5 py-0.5 rounded border border-[#1a2332] hover:border-[#2a3342] transition-colors"
                      >
                        &#8592;
                      </button>
                    )}
                    {onMoveLeadForward && status !== 'lost' && status !== 'retained' && (
                      <button
                        onClick={() => onMoveLeadForward(lead.id)}
                        className="text-[10px] text-[#6b7a8d] hover:text-white px-1.5 py-0.5 rounded border border-[#1a2332] hover:border-[#2a3342] transition-colors"
                      >
                        &#8594;
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {columnLeads.length === 0 && (
                <p className="text-xs text-[#6b7a8d] italic text-center py-4">Vazio</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
