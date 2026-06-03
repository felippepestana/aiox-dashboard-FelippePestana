'use client';

// =============================================================================
// OfflineIndicator – Top bar shown when the browser has no network connection
// =============================================================================

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOffline(!navigator.onLine);

    function handleOffline() {
      setIsOffline(true);
    }
    function handleOnline() {
      setIsOffline(false);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  // Avoid SSR mismatch – only render after mount
  if (!mounted || !isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-[#1a0a00] border-b border-orange-500/30 px-4 py-2"
    >
      <WifiOff className="h-3.5 w-3.5 flex-shrink-0 text-orange-400" />
      <p className="text-xs font-medium text-orange-300">
        Você está offline. Alguns recursos podem não estar disponíveis.
      </p>
    </div>
  );
}
