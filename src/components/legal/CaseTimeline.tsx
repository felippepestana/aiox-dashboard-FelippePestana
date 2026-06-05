'use client';

import { motion } from 'framer-motion';
import { Gavel, FileText, ScrollText, Calendar, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export interface Movement {
  date: string;
  type: 'decisao' | 'despacho' | 'peticao' | 'audiencia' | 'publicacao';
  title: string;
  description: string;
  tribunal: string;
  author?: string;
}

export interface CaseTimelineProps {
  movements: Movement[];
  onMovementClick?: (movement: Movement) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TYPE_CONFIG: Record<Movement['type'], { color: string; bgColor: string; icon: React.ElementType; label: string }> = {
  decisao: { color: '#D4AF37', bgColor: 'rgba(212,175,55,0.12)', icon: Gavel, label: 'Decisao' },
  despacho: { color: '#60A5FA', bgColor: 'rgba(96,165,250,0.12)', icon: FileText, label: 'Despacho' },
  peticao: { color: '#C0C0C0', bgColor: 'rgba(192,192,192,0.12)', icon: ScrollText, label: 'Peticao' },
  audiencia: { color: '#FBBF24', bgColor: 'rgba(251,191,36,0.12)', icon: Calendar, label: 'Audiencia' },
  publicacao: { color: '#4ADE80', bgColor: 'rgba(74,222,128,0.12)', icon: Megaphone, label: 'Publicacao' },
};

// =============================================================================
// COMPONENT
// =============================================================================

export function CaseTimeline({ movements, onMovementClick }: CaseTimelineProps) {
  const sortedMovements = [...movements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).toUpperCase();
  };

  return (
    <div className="relative pl-6 md:pl-8">
      {/* Vertical dashed line */}
      <div className="absolute left-[11px] md:left-[15px] top-2 bottom-2 w-px border-l border-dashed border-[rgba(192,192,192,0.20)]" />

      <div className="space-y-4">
        {sortedMovements.map((movement, index) => {
          const config = TYPE_CONFIG[movement.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={`${movement.date}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.3,
                delay: index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative"
            >
              {/* Timeline node */}
              <div
                className="absolute -left-6 md:-left-8 top-4 w-2 h-2 rounded-full z-10"
                style={{ backgroundColor: config.color }}
              />

              {/* Card */}
              <div
                onClick={() => onMovementClick?.(movement)}
                className={cn(
                  'bg-[#0d1f3c] border border-[rgba(192,192,192,0.10)] rounded-lg p-4',
                  'transition-all duration-150',
                  'hover:bg-[#121f36] hover:border-[rgba(192,192,192,0.20)]',
                  onMovementClick && 'cursor-pointer'
                )}
              >
                {/* Badge + Date row */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
                    style={{
                      backgroundColor: config.bgColor,
                      color: config.color,
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                  <span className="text-[10px] text-[#718096] uppercase tracking-wider">
                    {formatDate(movement.date)}
                  </span>
                </div>

                {/* Title */}
                <h4 className="text-sm font-medium text-white mb-1 leading-snug">
                  {movement.title}
                </h4>

                {/* Description */}
                <p className="text-xs text-[#A0AEC0] mb-2 leading-relaxed">
                  {movement.description}
                </p>

                {/* Footer: Tribunal + Author */}
                <div className="flex items-center justify-between text-[10px] text-[#4A5568]">
                  <span>{movement.tribunal}</span>
                  {movement.author && <span>por {movement.author}</span>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
