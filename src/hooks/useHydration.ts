'use client';
import { useEffect, useRef } from 'react';
import { useLegalStore } from '@/stores/legal-store';

export function useHydration() {
  const hydrated = useRef(false);
  const hydrateFromApi = useLegalStore(s => s.hydrateFromApi);
  const syncing = useLegalStore(s => s.syncing);
  const lastSyncAt = useLegalStore(s => s.lastSyncAt);

  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      hydrateFromApi();
    }
  }, [hydrateFromApi]);

  return { syncing, lastSyncAt };
}
