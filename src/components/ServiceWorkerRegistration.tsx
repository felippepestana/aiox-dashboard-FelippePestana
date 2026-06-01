'use client';

// =============================================================================
// ServiceWorkerRegistration – Registers /sw.js on mount (client-only)
// =============================================================================

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .catch((err) => {
        console.error('[AIOX] Service worker registration failed:', err);
      });
  }, []);

  return null;
}
