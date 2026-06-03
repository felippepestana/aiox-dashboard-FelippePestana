'use client';

// =============================================================================
// useOptimisticUpdate - Immediate UI update with background server sync
// Automatic rollback on failure with queued operations
// =============================================================================

import { useState, useRef, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Updater<T> = (current: T) => T;

interface QueuedOperation<T> {
  id: string;
  updater: Updater<T>;
  serverFn: () => Promise<unknown>;
  snapshot: T; // state before this operation (for rollback)
}

export interface UseOptimisticUpdateReturn<T> {
  data: T;
  /** Apply an optimistic update and queue a server sync. */
  update: (updater: Updater<T>, serverFn: () => Promise<unknown>) => string;
  /** Manually roll back a specific operation by id. */
  rollback: (operationId: string) => void;
  /** True while any update is being synced to the server. */
  isOptimistic: boolean;
  /** Number of pending sync operations. */
  pendingCount: number;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * @param key    Identifier used in toast messages (e.g. 'prazo', 'cliente')
 * @param initial Initial data value
 */
export function useOptimisticUpdate<T>(
  key: string,
  initial: T
): UseOptimisticUpdateReturn<T> {
  const [data, setData] = useState<T>(initial);
  const [pendingCount, setPendingCount] = useState(0);

  // Queue of pending operations (for ordered rollback)
  const queue = useRef<QueuedOperation<T>[]>([]);
  const currentData = useRef<T>(initial);

  // ─── Update ────────────────────────────────────────────────────────────────

  const update = useCallback(
    (updater: Updater<T>, serverFn: () => Promise<unknown>): string => {
      const opId = `${key}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const snapshot = currentData.current;

      // Optimistically apply the update
      const next = updater(currentData.current);
      currentData.current = next;
      setData(next);
      setPendingCount((c) => c + 1);

      const op: QueuedOperation<T> = {
        id: opId,
        updater,
        serverFn,
        snapshot,
      };
      queue.current.push(op);

      // Background server sync
      serverFn()
        .then(() => {
          // Success: remove from queue
          queue.current = queue.current.filter((o) => o.id !== opId);
          setPendingCount((c) => Math.max(0, c - 1));
        })
        .catch(() => {
          // Failure: rollback this operation and all subsequent ones
          rollbackFromId(opId);

          // Show a simple console warning (callers can also subscribe to errors)
          console.warn(
            `[useOptimisticUpdate] Server sync failed for "${key}" (op ${opId}). Rolled back.`
          );
        });

      return opId;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  // ─── Rollback ─────────────────────────────────────────────────────────────

  const rollbackFromId = useCallback((fromId: string) => {
    const idx = queue.current.findIndex((o) => o.id === fromId);
    if (idx === -1) return;

    // The snapshot before the failing op is the correct rollback point
    const rollbackState = queue.current[idx].snapshot;

    // Remove this and all subsequent operations (they depended on the failed state)
    const removed = queue.current.splice(idx);
    setPendingCount((c) => Math.max(0, c - removed.length));

    currentData.current = rollbackState;
    setData(rollbackState);
  }, []);

  const rollback = useCallback(
    (operationId: string) => {
      rollbackFromId(operationId);
    },
    [rollbackFromId]
  );

  return {
    data,
    update,
    rollback,
    isOptimistic: pendingCount > 0,
    pendingCount,
  };
}
