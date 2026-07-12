'use client';

import { useEffect, useCallback, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase';

export type NotificationType = 'process_update' | 'deadline_alert' | 'publication' | 'payment_update';

export interface RealtimeNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

type NotificationListener = (notification: RealtimeNotification) => void;

/** Subscribes to Supabase realtime changes (processes, deadlines, profile) for a user and returns a `subscribe` function to register notification listeners. */
export function useRealtimeNotifications(userId: string | null) {
  const listenersRef = useRef<Set<NotificationListener>>(new Set());

  const subscribe = useCallback((listener: NotificationListener) => {
    listenersRef.current.add(listener);
    return () => { listenersRef.current.delete(listener); };
  }, []);

  useEffect(() => {
    if (!userId) return;

    const supabase = createBrowserClient();

    const channel = supabase
      .channel(`user-notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'processes',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification: RealtimeNotification = {
            id: crypto.randomUUID(),
            type: 'process_update',
            title: 'Processo atualizado',
            message: `O processo ${(payload.new as Record<string, unknown>).cnj || (payload.new as Record<string, unknown>).title || ''} foi atualizado.`,
            timestamp: new Date().toISOString(),
            read: false,
          };
          listenersRef.current.forEach((fn) => fn(notification));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'deadlines',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification: RealtimeNotification = {
            id: crypto.randomUUID(),
            type: 'deadline_alert',
            title: 'Novo prazo',
            message: (payload.new as Record<string, unknown>).description as string || 'Um novo prazo foi adicionado.',
            timestamp: new Date().toISOString(),
            read: false,
          };
          listenersRef.current.forEach((fn) => fn(notification));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const newRecord = payload.new as Record<string, unknown>;
          const oldRecord = payload.old as Record<string, unknown> | undefined;
          if (newRecord.subscription_status !== oldRecord?.subscription_status) {
            const notification: RealtimeNotification = {
              id: crypto.randomUUID(),
              type: 'payment_update',
              title: 'Assinatura atualizada',
              message: `Seu plano foi atualizado para ${newRecord.subscription_plan as string || 'starter'}.`,
              timestamp: new Date().toISOString(),
              read: false,
            };
            listenersRef.current.forEach((fn) => fn(notification));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { subscribe };
}
