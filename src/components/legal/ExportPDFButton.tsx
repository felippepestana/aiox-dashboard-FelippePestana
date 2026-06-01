'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import {
  exportProcessPDF,
  exportProcessListPDF,
  exportDeadlinesPDF,
  exportPetitionPDF,
  exportPetitionListPDF,
  exportFinancialReportPDF,
} from '@/lib/pdf-export';
import type {
  LegalProcess,
  Deadline,
  Petition,
  ProcessMovement,
} from '@/types/legal';
import type { FinancialReportData } from '@/lib/pdf-export';

// ─── Prop Types ───────────────────────────────────────────────────────────────

type ExportProcessProps = {
  type: 'process';
  data: {
    process: LegalProcess;
    clientName?: string;
    movements?: ProcessMovement[];
    deadlines?: Deadline[];
    petitions?: Petition[];
  };
};

type ExportProcessesProps = {
  type: 'processes';
  data: {
    processes: LegalProcess[];
    title?: string;
  };
};

type ExportDeadlinesProps = {
  type: 'deadlines';
  data: {
    deadlines: Deadline[];
    processMap?: Record<string, string>;
    title?: string;
  };
};

type ExportPetitionProps = {
  type: 'petition';
  data: {
    petition: Petition;
    processInfo?: string;
    clientName?: string;
  };
};

type ExportPetitionsProps = {
  type: 'petitions';
  data: {
    petitions: Petition[];
    processMap?: Record<string, string>;
    title?: string;
  };
};

type ExportFinancialProps = {
  type: 'financial';
  data: FinancialReportData;
};

type ExportPDFButtonProps = (
  | ExportProcessProps
  | ExportProcessesProps
  | ExportDeadlinesProps
  | ExportPetitionProps
  | ExportPetitionsProps
  | ExportFinancialProps
) & {
  label?: string;
  /** Extra CSS classes applied to the button */
  className?: string;
  /** Variant: 'icon' shows only icon, 'button' shows icon + label */
  variant?: 'icon' | 'button';
};

// ─── Component ────────────────────────────────────────────────────────────────

export interface ExportPDFButtonComponentProps extends Record<string, unknown> {}

export function ExportPDFButton(props: ExportPDFButtonProps) {
  const { label, className, variant = 'button' } = props;
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (loading) return;
    setLoading(true);
    try {
      switch (props.type) {
        case 'process':
          await exportProcessPDF(props.data.process, {
            clientName: props.data.clientName,
            movements: props.data.movements,
            deadlines: props.data.deadlines,
            petitions: props.data.petitions,
          });
          break;
        case 'processes':
          await exportProcessListPDF(props.data.processes, { title: props.data.title });
          break;
        case 'deadlines':
          await exportDeadlinesPDF(props.data.deadlines, {
            processMap: props.data.processMap,
            title: props.data.title,
          });
          break;
        case 'petition':
          await exportPetitionPDF(props.data.petition, {
            processInfo: props.data.processInfo,
            clientName: props.data.clientName,
          });
          break;
        case 'petitions':
          await exportPetitionListPDF(props.data.petitions, {
            processMap: props.data.processMap,
            title: props.data.title,
          });
          break;
        case 'financial':
          await exportFinancialReportPDF(props.data);
          break;
      }
    } catch (err) {
      console.error('[ExportPDFButton] PDF export failed:', err);
    } finally {
      setLoading(false);
    }
  }

  const resolvedLabel = label ?? 'Exportar PDF';

  if (variant === 'icon') {
    return (
      <button
        onClick={handleExport}
        disabled={loading}
        title={resolvedLabel}
        className={
          className ??
          'flex items-center justify-center rounded-lg border border-[#1a2332] p-2 text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/20 transition-colors disabled:opacity-50'
        }
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={
        className ??
        'flex items-center gap-2 rounded-lg border border-[#1a2332] px-3 py-2 text-sm text-[#6b7a8d] hover:text-amber-400 hover:border-amber-500/20 transition-colors disabled:opacity-50'
      }
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? 'Gerando PDF...' : resolvedLabel}
    </button>
  );
}
