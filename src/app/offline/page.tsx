'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#060d1a] flex items-center justify-center">
      <div className="text-center p-8 max-w-md">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 mx-auto mb-6">
          <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M5.636 5.636a9 9 0 000 12.728M12 12h.01" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Sem conexão</h1>
        <p className="text-[#A0AEC0] mb-6">
          Você está offline. Verifique sua conexão com a internet e tente novamente.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
