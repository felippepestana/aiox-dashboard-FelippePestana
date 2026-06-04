import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060d1a] px-6 text-center">
      {/* Background subtle grid */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[length:40px_40px] opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#C0C0C0 1px,transparent 1px),linear-gradient(90deg,#C0C0C0 1px,transparent 1px)',
        }}
      />

      {/* APEX Triangle Mark */}
      <div className="relative mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a2d52] to-[#0d1f3c] border border-[#C0C0C0]/15 shadow-2xl shadow-black/50">
          <svg
            width="42"
            height="42"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="APEX"
          >
            <defs>
              <linearGradient
                id="apex-404"
                x1="12"
                y1="2"
                x2="12"
                y2="22"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#E8E8ED" />
                <stop offset="45%" stopColor="#C0C0C0" />
                <stop offset="75%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#B8941F" />
              </linearGradient>
            </defs>
            <path d="M12 2L22 20H2L12 2Z" fill="url(#apex-404)" />
            <rect x="7" y="13.5" width="10" height="2" rx="1" fill="#060d1a" />
          </svg>
        </div>
        {/* Glow ring */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-[#D4AF37]/10 blur-sm" />
      </div>

      {/* 404 Number */}
      <div className="relative mb-4">
        <p
          className="text-[120px] font-black leading-none tracking-tighter select-none"
          style={{
            background: 'linear-gradient(135deg, #1a2d52 0%, #2a3d62 40%, #1a2d52 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          aria-hidden
        >
          404
        </p>
        <p
          className="absolute inset-0 text-[120px] font-black leading-none tracking-tighter select-none"
          style={{
            background:
              'linear-gradient(135deg, #C0C0C0 0%, #E8E8ED 35%, #D4AF37 65%, #B8941F 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
          }}
        >
          404
        </p>
      </div>

      {/* Message */}
      <h1 className="text-2xl font-bold text-white mb-2">Página não encontrada</h1>
      <p className="text-sm text-[#4A5568] max-w-sm mb-2">
        A página que você procura não existe ou foi movida.
      </p>
      <p className="text-xs text-[#2D3748] mb-8 flex items-center gap-2">
        <Scale className="h-3.5 w-3.5 text-[#2D3748]" />
        APEX Legal Performance
      </p>

      {/* Gold divider */}
      <div className="mb-8 h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      {/* CTA */}
      <Link
        href="/legal"
        className="group flex items-center gap-2 rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-7 py-3 text-sm font-semibold text-[#D4AF37] shadow-lg shadow-[#D4AF37]/5 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/50 hover:shadow-[#D4AF37]/10 transition-all duration-200"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Voltar ao Dashboard
      </Link>

      {/* Secondary links */}
      <div className="mt-6 flex items-center gap-6 text-xs text-[#2D3748]">
        <Link href="/legal/processes" className="hover:text-[#4A5568] transition-colors">
          Processos
        </Link>
        <span className="text-[#1a2d52]">·</span>
        <Link href="/legal/clients" className="hover:text-[#4A5568] transition-colors">
          Clientes
        </Link>
        <span className="text-[#1a2d52]">·</span>
        <Link href="/legal/settings" className="hover:text-[#4A5568] transition-colors">
          Configurações
        </Link>
      </div>
    </div>
  );
}
