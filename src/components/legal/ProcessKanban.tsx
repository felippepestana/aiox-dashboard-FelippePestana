'use client';

// =============================================================================
// ProcessKanban - Kanban board for visual process management
// APEX Legal Design System — navy + silver + gold theme
// Native HTML5 drag and drop — no external DnD libraries
// =============================================================================

import React, { useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KanbanProcess {
  id: string;
  cnj: string;
  title: string;
  client: string;
  area: string;
  status: 'analise' | 'peticao_inicial' | 'instrucao' | 'sentenca' | 'encerrado';
  nextDeadline?: string;
  priority: 'alta' | 'media' | 'baixa';
}

export interface ProcessKanbanProps {
  processes: KanbanProcess[];
  onStatusChange?: (processId: string, newStatus: KanbanProcess['status']) => void;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLUMNS: { status: KanbanProcess['status']; label: string }[] = [
  { status: 'analise',        label: 'Em Análise'      },
  { status: 'peticao_inicial', label: 'Petição Inicial' },
  { status: 'instrucao',      label: 'Instrução'       },
  { status: 'sentenca',       label: 'Sentença'        },
  { status: 'encerrado',      label: 'Encerrado'       },
];

const PRIORITY_BORDER: Record<KanbanProcess['priority'], string> = {
  alta:  '#F87171',
  media: '#FBBF24',
  baixa: '#4ADE80',
};

const AREA_COLOR: Record<string, string> = {
  'cível':          '#60A5FA',
  'trabalhista':    '#FBBF24',
  'criminal':       '#F87171',
  'tributário':     '#4ADE80',
  'previdenciário': '#A78BFA',
};

function getAreaColor(area: string): string {
  // Normalise to lowercase for lookup
  const key = area.toLowerCase();
  for (const [k, v] of Object.entries(AREA_COLOR)) {
    if (key.includes(k.replace('á', 'a').replace('é', 'e').replace('ó', 'o').replace('ú', 'u').replace('ê', 'e')) ||
        key.includes(k)) {
      return v;
    }
  }
  return '#C0C0C0';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDeadline(dateStr: string): { text: string; urgent: boolean } {
  try {
    const deadline = new Date(dateStr);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const text = deadline.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
    return { text, urgent: diffDays < 3 };
  } catch {
    return { text: dateStr, urgent: false };
  }
}

// ─── KanbanCard ───────────────────────────────────────────────────────────────

interface KanbanCardProps {
  process: KanbanProcess;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
}

function KanbanCard({ process, isDragging, onDragStart, onDragEnd }: KanbanCardProps) {
  const borderColor = PRIORITY_BORDER[process.priority];
  const areaColor   = getAreaColor(process.area);
  const deadline    = process.nextDeadline ? formatDeadline(process.nextDeadline) : null;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, process.id)}
      onDragEnd={onDragEnd}
      className={cn(
        'rounded-lg p-3 cursor-grab active:cursor-grabbing',
        'border border-[rgba(192,192,192,0.10)] bg-[#0d1f3c]',
        'transition-all duration-150',
        isDragging
          ? 'opacity-50 border-dashed border-[rgba(192,192,192,0.30)]'
          : 'hover:bg-[#121f36] hover:border-[rgba(192,192,192,0.20)]'
      )}
      style={{ borderLeftWidth: '3px', borderLeftColor: borderColor }}
    >
      {/* CNJ */}
      <p className="font-mono text-[11px] text-[#D4AF37] mb-1 leading-none">
        {process.cnj}
      </p>

      {/* Title */}
      <p className="text-sm font-medium text-white truncate leading-snug mb-1">
        {process.title}
      </p>

      {/* Client */}
      <p className="text-xs text-[#A0AEC0] truncate mb-2">
        {process.client}
      </p>

      {/* Bottom row: area badge + deadline */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider"
          style={{
            backgroundColor: `${areaColor}1f`,
            borderColor: `${areaColor}59`,
            color: areaColor,
          }}
        >
          {process.area}
        </span>

        {deadline && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-[10px]',
              deadline.urgent ? 'text-[#F87171]' : 'text-[#718096]'
            )}
          >
            <Clock size={10} aria-hidden="true" />
            {deadline.text}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── KanbanColumn ─────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  status: KanbanProcess['status'];
  label: string;
  processes: KanbanProcess[];
  isDragOver: boolean;
  draggingId: string | null;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, id: string) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, status: KanbanProcess['status']) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, status: KanbanProcess['status']) => void;
}

function KanbanColumn({
  status,
  label,
  processes,
  isDragOver,
  draggingId,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: KanbanColumnProps) {
  return (
    <div
      className={cn(
        'flex-shrink-0 w-60 min-w-[240px] flex flex-col',
        'rounded-xl border bg-[#0a1628] p-3',
        'transition-all duration-150',
        isDragOver
          ? 'border-2 border-dashed border-[rgba(212,175,55,0.5)]'
          : 'border border-[rgba(192,192,192,0.06)]'
      )}
      onDragOver={(e) => onDragOver(e, status)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, status)}
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-white">{label}</h3>
        <span
          className="text-[10px] rounded-full px-2 py-0.5"
          style={{
            backgroundColor: 'rgba(212,175,55,0.12)',
            color: '#D4AF37',
          }}
        >
          {processes.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 flex-1">
        {processes.length === 0 ? (
          <p className="text-xs text-[#4A5568] text-center py-4">
            Nenhum processo
          </p>
        ) : (
          processes.map((proc) => (
            <KanbanCard
              key={proc.id}
              process={proc}
              isDragging={draggingId === proc.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── ProcessKanban ────────────────────────────────────────────────────────────

export function ProcessKanban({
  processes,
  onStatusChange,
  className,
}: ProcessKanbanProps) {
  const [draggingId,   setDraggingId]   = useState<string | null>(null);
  const [dragOverCol,  setDragOverCol]  = useState<KanbanProcess['status'] | null>(null);

  // Local copy of processes to allow optimistic updates when no external handler
  const [localProcesses, setLocalProcesses] = useState<KanbanProcess[]>(processes);

  // Keep in sync with prop changes
  React.useEffect(() => {
    setLocalProcesses(processes);
  }, [processes]);

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, id: string) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      setDraggingId(id);
    },
    []
  );

  const handleDragEnd = useCallback((_e: React.DragEvent<HTMLDivElement>) => {
    setDraggingId(null);
    setDragOverCol(null);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>, status: KanbanProcess['status']) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverCol(status);
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      // Only clear if we're leaving to outside the column
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setDragOverCol(null);
      }
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, newStatus: KanbanProcess['status']) => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      if (!id) return;

      setDraggingId(null);
      setDragOverCol(null);

      const proc = localProcesses.find((p) => p.id === id);
      if (!proc || proc.status === newStatus) return;

      // Optimistic local update
      setLocalProcesses((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );

      onStatusChange?.(id, newStatus);
    },
    [localProcesses, onStatusChange]
  );

  return (
    <div
      className={cn(
        'flex gap-3 overflow-x-auto pb-4',
        // Custom scrollbar styling
        'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[rgba(192,192,192,0.15)]',
        className
      )}
    >
      {COLUMNS.map(({ status, label }) => {
        const colProcesses = localProcesses.filter((p) => p.status === status);
        return (
          <KanbanColumn
            key={status}
            status={status}
            label={label}
            processes={colProcesses}
            isDragOver={dragOverCol === status}
            draggingId={draggingId}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        );
      })}
    </div>
  );
}
