'use client';

// =============================================================================
// useDeadlineAlerts - Computes categorized deadline alert lists from the store
// =============================================================================

import { useMemo } from 'react';
import { useLegalStore } from '@/stores/legal-store';
import type { Deadline, LegalProcess } from '@/types/legal';

export interface DeadlineWithProcess extends Deadline {
  process?: LegalProcess;
  daysOverdue?: number;   // positive = days past due
  daysUntil?: number;     // non-negative = days until due (0 = today)
}

export interface DeadlineAlertCounts {
  overdue: number;
  today: number;
  upcoming3: number;
  upcoming7: number;
  total: number; // overdue + today (badge count)
}

export interface UseDeadlineAlertsReturn {
  overdue: DeadlineWithProcess[];
  today: DeadlineWithProcess[];
  upcoming3: DeadlineWithProcess[];  // 1-3 days
  upcoming7: DeadlineWithProcess[];  // 4-7 days
  counts: DeadlineAlertCounts;
  allAlerts: DeadlineWithProcess[];  // sorted: overdue, today, 1-3, 4-7
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function useDeadlineAlerts(): UseDeadlineAlertsReturn {
  const deadlines = useLegalStore((s) => s.deadlines);
  const processes = useLegalStore((s) => s.processes);

  return useMemo(() => {
    const now = startOfDay(new Date());

    const processMap = new Map<string, LegalProcess>();
    for (const p of processes) {
      processMap.set(p.id, p);
    }

    const pending = deadlines.filter((d) => d.status === 'pending');

    const overdue: DeadlineWithProcess[] = [];
    const today: DeadlineWithProcess[] = [];
    const upcoming3: DeadlineWithProcess[] = [];
    const upcoming7: DeadlineWithProcess[] = [];

    for (const d of pending) {
      const due = startOfDay(new Date(d.dueDate));
      const diffMs = due.getTime() - now.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      const enriched: DeadlineWithProcess = {
        ...d,
        process: processMap.get(d.processId),
      };

      if (diffDays < 0) {
        enriched.daysOverdue = Math.abs(diffDays);
        overdue.push(enriched);
      } else if (diffDays === 0) {
        enriched.daysUntil = 0;
        today.push(enriched);
      } else if (diffDays <= 3) {
        enriched.daysUntil = diffDays;
        upcoming3.push(enriched);
      } else if (diffDays <= 7) {
        enriched.daysUntil = diffDays;
        upcoming7.push(enriched);
      }
    }

    // Sort each bucket by due date ascending (most overdue first for overdue)
    overdue.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    today.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    upcoming3.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    upcoming7.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const allAlerts = [...overdue, ...today, ...upcoming3, ...upcoming7];

    const counts: DeadlineAlertCounts = {
      overdue: overdue.length,
      today: today.length,
      upcoming3: upcoming3.length,
      upcoming7: upcoming7.length,
      total: overdue.length + today.length,
    };

    return { overdue, today, upcoming3, upcoming7, counts, allAlerts };
  }, [deadlines, processes]);
}
