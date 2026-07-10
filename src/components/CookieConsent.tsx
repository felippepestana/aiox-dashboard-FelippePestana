'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem('apex_cookie_consent');
      if (!consent) setShow(true);
    } catch {
      // localStorage may be unavailable (private browsing, SSR) — silently skip
    }
  }, []);

  function saveConsent(accepted: boolean) {
    try {
      localStorage.setItem(
        'apex_cookie_consent',
        JSON.stringify({
          accepted,
          timestamp: Date.now(),
        }),
      );
    } catch {
      // Storage unavailable — banner will reappear next visit, which is acceptable
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Aviso de cookies"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#1a2332] bg-[#0d1320]/95 backdrop-blur-sm p-4"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-[#A0AEC0] text-center sm:text-left">
          Utilizamos cookies para garantir o funcionamento e melhorar sua experiência na plataforma.
          Ao continuar navegando, você concorda com nossa{' '}
          <Link href="/privacy" className="text-[#D4AF37] hover:underline focus-visible:outline-none focus-visible:underline">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => saveConsent(false)}
            className="rounded-lg border border-[#1a2332] px-6 py-2 text-sm font-medium text-[#A0AEC0] hover:bg-[#1a2332] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A0AEC0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1320] transition-colors"
          >
            Recusar
          </button>
          <button
            onClick={() => saveConsent(true)}
            className="rounded-lg bg-[#D4AF37] px-6 py-2 text-sm font-medium text-[#060d1a] hover:bg-[#e0c040] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1320] transition-colors"
          >
            Aceitar
          </button>
        </div>
      </div>
    </div>
  );
}
