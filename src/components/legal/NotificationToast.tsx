'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Bell, FileText, Clock, CreditCard } from 'lucide-react';
import { useRealtimeNotifications, type RealtimeNotification, type NotificationType } from '@/hooks/use-realtime-notifications';

const ICON_MAP: Record<NotificationType, typeof Bell> = {
  process_update: FileText,
  deadline_alert: Clock,
  publication: Bell,
  payment_update: CreditCard,
};

const COLOR_MAP: Record<NotificationType, string> = {
  process_update: 'border-blue-500/30 bg-blue-500/5',
  deadline_alert: 'border-amber-500/30 bg-amber-500/5',
  publication: 'border-green-500/30 bg-green-500/5',
  payment_update: 'border-purple-500/30 bg-purple-500/5',
};

const ICON_COLOR_MAP: Record<NotificationType, string> = {
  process_update: 'text-blue-400',
  deadline_alert: 'text-amber-400',
  publication: 'text-green-400',
  payment_update: 'text-purple-400',
};

export function NotificationToast({ userId }: { userId: string | null }) {
  const [toasts, setToasts] = useState<RealtimeNotification[]>([]);
  const { subscribe } = useRealtimeNotifications(userId);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    return subscribe((notification) => {
      setToasts((prev) => [notification, ...prev].slice(0, 5));
      setTimeout(() => dismiss(notification.id), 8000);
    });
  }, [subscribe, dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const Icon = ICON_MAP[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-lg border p-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right ${COLOR_MAP[toast.type]}`}
          >
            <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${ICON_COLOR_MAP[toast.type]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">{toast.title}</p>
              <p className="text-xs text-[#A0AEC0] mt-0.5 truncate">{toast.message}</p>
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-[#6b7a8d] hover:text-white transition-colors flex-shrink-0"
              aria-label="Fechar notificação"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
