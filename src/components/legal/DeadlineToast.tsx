'use client';

// =============================================================================
// DeadlineToast – One-per-session toast for critical deadlines
// Shows once per browser session when there are overdue or today deadlines
// =============================================================================

import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useDeadlineAlerts } from '@/hooks/useDeadlineAlerts';

const SESSION_KEY = 'aiox_deadline_toast_shown';

/** Renders a once-per-session toast alerting about overdue or same-day deadlines, auto-dismissing after 8 seconds. */
export function DeadlineToast() {
  const { counts } = useDeadlineAlerts();
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Only show once per session
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const total = counts.overdue + counts.today;
    if (total === 0) return;

    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(true);

    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => dismiss(), 8000);
    return () => clearTimeout(timer);
     
  }, [counts.overdue, counts.today]);

  function dismiss() {
    setExiting(true);
    setTimeout(() => setVisible(false), 300);
  }

  if (!visible) return null;

  const isOverdue = counts.overdue > 0;
  const isToday = counts.today > 0;

  let message = '';
  if (isOverdue && isToday) {
    message = `Você tem ${counts.overdue} prazo${counts.overdue !== 1 ? 's' : ''} vencido${counts.overdue !== 1 ? 's' : ''} e ${counts.today} vencendo hoje`;
  } else if (isOverdue) {
    message = `Você tem ${counts.overdue} prazo${counts.overdue !== 1 ? 's' : ''} vencido${counts.overdue !== 1 ? 's' : ''}`;
  } else {
    message = `Você tem ${counts.today} prazo${counts.today !== 1 ? 's' : ''} vencendo hoje`;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'fixed bottom-6 right-6 z-[9999] w-80 rounded-xl border shadow-2xl transition-all duration-300',
        isOverdue
          ? 'border-red-500/40 bg-[#150a0a] shadow-red-500/10'
          : 'border-yellow-500/40 bg-[#13120a] shadow-yellow-500/10',
        exiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div
          className={cn(
            'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg',
            isOverdue ? 'bg-red-500/15' : 'bg-yellow-500/15'
          )}
        >
          {isOverdue ? (
            <AlertTriangle className="h-4 w-4 text-red-400" />
          ) : (
            <Clock className="h-4 w-4 text-yellow-400" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold', isOverdue ? 'text-red-300' : 'text-yellow-300')}>
            {isOverdue ? 'Prazos Vencidos' : 'Prazos para Hoje'}
          </p>
          <p className="text-xs text-[#8899aa] mt-0.5 leading-relaxed">{message}</p>
          <Link
            href="/legal/deadlines"
            onClick={dismiss}
            className={cn(
              'mt-2 inline-flex items-center text-[11px] font-medium underline-offset-2 hover:underline',
              isOverdue ? 'text-red-400' : 'text-yellow-400'
            )}
          >
            Ver prazos →
          </Link>
        </div>

        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Fechar notificação"
          className="flex-shrink-0 text-[#4a5568] hover:text-white transition-colors mt-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar auto-dismiss */}
      <div
        className={cn(
          'h-0.5 rounded-b-xl',
          isOverdue ? 'bg-red-500/30' : 'bg-yellow-500/30'
        )}
        style={{
          width: '100%',
          animation: 'aiox-deadline-shrink 8s linear forwards',
        }}
      />
    </div>
  );
}
