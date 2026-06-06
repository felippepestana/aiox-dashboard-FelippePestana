'use client';

// =============================================================================
// CaseTimeline - Vertical timeline for court case movements
// APEX Legal Design System — navy + silver + gold theme
// =============================================================================

import React from 'react';
import { Gavel, FileText, ScrollText, Calendar, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimelineMovement {
  date: string;
  type: 'decisao' | 'despacho' | 'peticao' | 'audiencia' | 'publicacao';
  title: string;
  description: string;
  tribunal: string;
  author?: string;
}

export interface CaseTimelineProps {
  movements: TimelineMovement[];
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  TimelineMovement['type'],
  { label: string; color: string; Icon: React.ElementType }
> = {
  decisao:   { label: 'Decisão',    color: '#D4AF37', Icon: Gavel      },
  despacho:  { label: 'Despacho',   color: '#60A5FA', Icon: FileText   },
  peticao:   { label: 'Petição',    color: '#C0C0C0', Icon: ScrollText },
  audiencia: { label: 'Audiência',  color: '#FBBF24', Icon: Calendar   },
  publicacao:{ label: 'Publicação', color: '#4ADE80', Icon: Bell       },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Single Timeline Item ─────────────────────────────────────────────────────

interface TimelineItemProps {
  movement: TimelineMovement;
  isLast: boolean;
}

function TimelineItem({ movement, isLast }: TimelineItemProps) {
  const { label, color, Icon } = TYPE_CONFIG[movement.type];

  return (
    <div className="relative flex gap-4 group">
      {/* Left: dotted line + node */}
      <div className="relative flex flex-col items-center flex-shrink-0 w-5 sm:w-6">
        {/* Dotted vertical line (hides on last item) */}
        {!isLast && (
          <div
            className="absolute top-5 left-1/2 -translate-x-1/2 w-px h-full"
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, rgba(192,192,192,0.15) 0px, rgba(192,192,192,0.15) 4px, transparent 4px, transparent 8px)`,
            }}
            aria-hidden="true"
          />
        )}

        {/* Node circle */}
        <div
          className="relative z-10 mt-3.5 w-2 h-2 rounded-full flex-shrink-0 ring-2 ring-[#071020]"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      </div>

      {/* Right: card */}
      <div
        className={cn(
          'flex-1 mb-4 rounded-lg p-4',
          'bg-[#0d1f3c] border border-[rgba(192,192,192,0.10)]',
          'transition-all duration-200',
          'hover:bg-[#121f36] hover:border-[rgba(192,192,192,0.20)]'
        )}
      >
        {/* Top row: badge + date */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {/* Type badge */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border"
            style={{
              backgroundColor: `${color}1f`,
              borderColor: `${color}59`,
              color,
            }}
          >
            <Icon size={10} aria-hidden="true" />
            {label}
          </span>

          {/* Date */}
          <span className="text-xs text-[#718096] uppercase tracking-wider">
            {formatDate(movement.date)}
          </span>
        </div>

        {/* Title */}
        <p className="text-sm font-medium text-white leading-snug mb-1">
          {movement.title}
        </p>

        {/* Description */}
        <p className="text-xs text-[#A0AEC0] line-clamp-3 leading-relaxed mb-2">
          {movement.description}
        </p>

        {/* Footer: tribunal + author */}
        <div className="flex flex-wrap items-center gap-3 mt-2 pt-2 border-t border-[rgba(192,192,192,0.06)]">
          <span className="text-[10px] text-[#4A5568]">{movement.tribunal}</span>
          {movement.author && (
            <span className="text-[10px] text-[#4A5568] italic">
              {movement.author}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CaseTimeline ─────────────────────────────────────────────────────────────

export function CaseTimeline({ movements, className }: CaseTimelineProps) {
  if (!movements || movements.length === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center py-12 text-sm text-[#4A5568]',
          className
        )}
      >
        Nenhuma movimentação registrada
      </div>
    );
  }

  return (
    <div className={cn('relative pl-1 sm:pl-2', className)}>
      {movements.map((movement, idx) => (
        <TimelineItem
          key={`${movement.date}-${idx}`}
          movement={movement}
          isLast={idx === movements.length - 1}
        />
      ))}
    </div>
  );
}
