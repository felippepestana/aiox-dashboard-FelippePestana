'use client';

import React from 'react';
import type { ProcessMovement } from '@/types/legal';

export interface ProcessTimelineProps {
  movements: ProcessMovement[];
}

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual',
  dje: 'DJe',
  pje: 'PJe',
  datajud: 'DataJud',
};

const SOURCE_COLORS: Record<string, string> = {
  manual: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  dje: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pje: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  datajud: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export function ProcessTimeline({ movements }: ProcessTimelineProps) {
  if (movements.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Nenhuma movimentacao registrada.
      </div>
    );
  }

  const sorted = [...movements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[71px] top-0 bottom-0 w-px bg-white/10" />

      <div className="space-y-0">
        {sorted.map((movement, index) => {
          const isUnread = !movement.isRead;

          return (
            <div
              key={movement.id}
              className={`relative flex gap-4 py-3 px-2 rounded-lg transition-colors ${
                isUnread ? 'bg-amber-500/5' : ''
              }`}
            >
              {/* Date column */}
              <div className="w-16 shrink-0 text-right pt-0.5">
                <p className="text-[11px] text-gray-400 font-medium">
                  {formatDate(movement.date)}
                </p>
                <p className="text-[10px] text-gray-500">
                  {formatTime(movement.date)}
                </p>
              </div>

              {/* Dot on the timeline */}
              <div className="relative shrink-0 flex items-start pt-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full border-2 z-10 ${
                    isUnread
                      ? 'bg-amber-500 border-amber-400'
                      : index === 0
                        ? 'bg-white border-white/50'
                        : 'bg-gray-600 border-gray-500'
                  }`}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pt-0.5">
                <p
                  className={`text-sm leading-relaxed ${
                    isUnread ? 'text-white font-medium' : 'text-gray-300'
                  }`}
                >
                  {movement.description}
                </p>

                <div className="flex items-center gap-2 mt-1.5">
                  {/* Source badge */}
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold border uppercase ${
                      SOURCE_COLORS[movement.source] ?? SOURCE_COLORS.manual
                    }`}
                  >
                    {SOURCE_LABELS[movement.source] ?? movement.source}
                  </span>

                  {/* Type if present */}
                  {movement.type && (
                    <span className="text-[10px] text-gray-500">
                      {movement.type}
                    </span>
                  )}

                  {/* Unread indicator */}
                  {isUnread && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      NOVO
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
