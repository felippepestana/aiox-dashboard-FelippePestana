'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optional Sentry capture. The indirect specifier keeps the bundler and
    // type-checker from resolving the package until it's actually installed;
    // until then this falls back to console.error.
    try {
      const sentryModule = '@sentry/nextjs';
      const Sentry = require(sentryModule);
      Sentry.captureException(error);
    } catch {
      console.error('Unhandled error:', error);
    }
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-[#060d1a] flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Algo deu errado</h2>
          <p className="text-[#A0AEC0] mb-6">
            Um erro inesperado ocorreu. Nossa equipe foi notificada.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 rounded-md bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.35)] text-[#D4AF37] hover:bg-[rgba(212,175,55,0.20)] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
