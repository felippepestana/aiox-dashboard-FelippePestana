'use client';

// =============================================================================
// PWAInstallPrompt – Dismissible install banner for APEX Legal PWA
// =============================================================================

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

const STORAGE_KEY = 'aiox_pwa_install_dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Don't show if already dismissed
    if (localStorage.getItem(STORAGE_KEY)) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setInstallEvent(null);
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="banner"
      className="fixed bottom-16 left-0 right-0 z-50 mx-3 mb-1 flex items-center gap-3 rounded-xl border border-[#C0C0C0]/20 bg-[#0a1628] px-4 py-3 shadow-lg shadow-black/50 sm:bottom-4 sm:left-auto sm:right-4 sm:mx-0 sm:w-80"
    >
      {/* Icon */}
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#C0C0C0]/10">
        <Download className="h-4 w-4 text-[#C0C0C0]" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Instalar APEX Legal</p>
        <p className="text-xs text-[#4A5568] mt-0.5">
          Instale no seu dispositivo para acesso rápido
        </p>
      </div>

      {/* Install button */}
      <button
        onClick={handleInstall}
        className="flex-shrink-0 rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-semibold text-[#0a1628] transition-colors hover:bg-[#E8D070] active:bg-[#C9A84C]"
      >
        Instalar
      </button>

      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        aria-label="Fechar"
        className="flex-shrink-0 text-[#4A5568] transition-colors hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
