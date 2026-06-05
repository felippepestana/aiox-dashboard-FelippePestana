'use client';

import { useState, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

export type ProcessArea = 'civil' | 'trabalhista' | 'criminal' | 'tributario' | 'familia' | 'empresarial';
export type ProcessStatus = 'analise' | 'peticao_inicial' | 'instrucao' | 'sentenca' | 'encerrado';
export type ProcessPriority = 'alta' | 'media' | 'baixa';

export interface KanbanProcess {
  id: string;
  cnj: string;
  title: string;
  client: string;
  area: ProcessArea;
  status: ProcessStatus;
  nextDeadline?: string;
  priority: ProcessPriority;
}

export interface ProcessKanbanProps {
  processes: KanbanProcess[];
  onStatusChange?: (processId: string, newStatus: ProcessStatus) => void;
  onProcessClick?: (process: KanbanProcess) => void;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const COLUMNS: { id: ProcessStatus; label: string }[] = [
  { id: 'analise', label: 'Em Analise' },
  { id: 'peticao_inicial', label: 'Peticao Inicial' },
  { id: 'instrucao', label: 'Instrucao' },
  { id: 'sentenca', label: 'Sentenca' },
  { id: 'encerrado', label: 'Encerrado' },
];

const AREA_COLORS: Record<ProcessArea, string> = {
  civil: '#60A5FA',
  trabalhista: '#FBBF24',
  criminal: '#F87171',
  tributario: '#4ADE80',
  familia: '#A78BFA',
  empresarial: '#D4AF37',
};

const PRIORITY_COLORS: Record<ProcessPriority, string> = {
  alta: '#F87171',
  media: '#FBBF24',
  baixa: '#4ADE80',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getDaysUntilDeadline(dateStr: string): number {
  const deadline = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDeadline(dateStr: string): string {
  const days = getDaysUntilDeadline(dateStr);
  if (days < 0) return `${Math.abs(days)}d atrasado`;
  if (days === 0) return 'Hoje';
  if (days === 1) return 'Amanha';
  return `${days}d`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProcessKanban({ processes, onStatusChange, onProcessClick }: ProcessKanbanProps) {
  const [draggedProcess, setDraggedProcess] = useState<KanbanProcess | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<ProcessStatus | null>(null);

  const getProcessesByStatus = useCallback(
    (status: ProcessStatus) => processes.filter((p) => p.status === status),
    [processes]
  );

  const handleDragStart = (e: React.DragEvent, process: KanbanProcess) => {
    setDraggedProcess(process);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', process.id);
  };

  const handleDragEnd = () => {
    setDraggedProcess(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: ProcessStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(status);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, newStatus: ProcessStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (draggedProcess && draggedProcess.status !== newStatus) {
      onStatusChange?.(draggedProcess.id, newStatus);
    }
    setDraggedProcess(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-refined">
      {COLUMNS.map((column) => {
        const columnProcesses = getProcessesByStatus(column.id);
        const isDragOver = dragOverColumn === column.id;

        return (
          <div
            key={column.id}
            className={cn(
              'flex-shrink-0 w-[280px] bg-[#0a1628] border rounded-xl p-3',
              'transition-all duration-150',
              isDragOver
                ? 'border-[#D4AF37] border-dashed'
                : 'border-[rgba(192,192,192,0.06)]'
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-medium text-white">{column.label}</h3>
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded text-[10px] font-medium bg-[rgba(212,175,55,0.15)] text-[#D4AF37]">
                {columnProcesses.length}
              </span>
            </div>

            {/* Cards */}
            <div className="space-y-2 min-h-[200px]">
              {columnProcesses.map((process) => {
                const deadlineDays = process.nextDeadline
                  ? getDaysUntilDeadline(process.nextDeadline)
                  : null;
                const isUrgent = deadlineDays !== null && deadlineDays < 3;

                return (
                  <div
                    key={process.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, process)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onProcessClick?.(process)}
                    className={cn(
                      'relative bg-[#0d1f3c] border border-[rgba(192,192,192,0.10)] rounded-lg p-3',
                      'transition-all duration-150 cursor-grab active:cursor-grabbing',
                      'hover:bg-[#121f36] hover:border-[rgba(192,192,192,0.20)]',
                      draggedProcess?.id === process.id && 'opacity-50'
                    )}
                  >
                    {/* Priority bar */}
                    <div
                      className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
                      style={{ backgroundColor: PRIORITY_COLORS[process.priority] }}
                    />

                    <div className="pl-2">
                      {/* CNJ */}
                      <p className="font-mono text-[11px] text-[#D4AF37] mb-1">
                        {process.cnj}
                      </p>

                      {/* Title */}
                      <h4 className="text-sm font-medium text-white truncate mb-1">
                        {process.title}
                      </h4>

                      {/* Client */}
                      <p className="text-xs text-[#A0AEC0] mb-2 truncate">
                        {process.client}
                      </p>

                      {/* Footer: Area badge + Deadline */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider"
                          style={{
                            backgroundColor: `${AREA_COLORS[process.area]}15`,
                            color: AREA_COLORS[process.area],
                          }}
                        >
                          {process.area}
                        </span>

                        {process.nextDeadline && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[10px]',
                              isUrgent ? 'text-[#F87171]' : 'text-[#718096]'
                            )}
                          >
                            <Clock className="w-3 h-3" />
                            {formatDeadline(process.nextDeadline)}
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
      })}
    </div>
  );
}
