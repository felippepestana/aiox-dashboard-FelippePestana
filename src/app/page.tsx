'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Brain,
  DollarSign,
  Clock,
  Target,
  MessageCircle,
  Check,
  Quote,
  ArrowRight,
  Star,
  Menu,
  X,
} from 'lucide-react';

/* ─────────────────────────────────────── helpers ─────────────────────────── */

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─────────────────────────────────────── logo mark ──────────────────────── */

function ApexLogo({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-label="APEX Logo">
      <defs>
        <linearGradient id="apex-gold" x1="20" y1="4" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0D060" />
          <stop offset="50%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8941F" />
        </linearGradient>
      </defs>
      <path d="M20 4L36 34H4L20 4Z" fill="url(#apex-gold)" />
      <rect x="12" y="23" width="16" height="2.5" rx="1.25" fill="#060d1a" />
    </svg>
  );
}

/* ─────────────────────────────────────── nav ─────────────────────────────── */

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Funcionalidades', href: '#features' },
    { label: 'IA Jurídica', href: '#ai' },
    { label: 'Planos', href: '#pricing' },
    { label: 'Depoimentos', href: '#testimonials' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-[#060d1a]/95 backdrop-blur-md border-b border-[rgba(192,192,192,0.08)]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <ApexLogo size={36} />
          <div>
            <span className="text-lg font-bold tracking-wide text-white">
              APEX <span className="text-[#C0C0C0]">LEGAL</span>
            </span>
            <p className="text-[8px] text-[#4A5568] tracking-widest uppercase hidden sm:block">
              Alta Performance
            </p>
          </div>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-[#A0AEC0] hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[#A0AEC0] hover:text-white transition-colors px-4 py-2"
          >
            Entrar
          </Link>
          <Link
            href="/login"
            className="text-sm font-semibold bg-[#D4AF37] text-[#060d1a] px-5 py-2 rounded-lg hover:bg-[#e0c040] transition-colors"
          >
            Começar Grátis
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-[#A0AEC0] hover:text-white"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0a1628] border-t border-[rgba(192,192,192,0.08)] px-6 py-4 space-y-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-[#A0AEC0] hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            className="block text-center text-sm font-semibold bg-[#D4AF37] text-[#060d1a] px-5 py-2 rounded-lg mt-2"
            onClick={() => setMobileOpen(false)}
          >
            Começar Grátis
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ─────────────────────────────────────── hero ────────────────────────────── */

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[#060d1a]" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(192,192,192,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(192,192,192,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#0a2050]/60 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-[#0d1f3c]/80 rounded-full blur-[80px] pointer-events-none" />

      {/* Floating gold particles — pure CSS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[
          { top: '15%', left: '8%', delay: '0s', dur: '6s' },
          { top: '25%', left: '88%', delay: '1.5s', dur: '7s' },
          { top: '55%', left: '5%', delay: '3s', dur: '8s' },
          { top: '70%', left: '92%', delay: '0.8s', dur: '5.5s' },
          { top: '80%', left: '20%', delay: '2s', dur: '9s' },
          { top: '40%', left: '78%', delay: '4s', dur: '6.5s' },
          { top: '10%', left: '55%', delay: '1s', dur: '7.5s' },
          { top: '90%', left: '60%', delay: '2.5s', dur: '8.5s' },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#D4AF37]"
            style={{
              top: p.top,
              left: p.left,
              opacity: 0.4,
              animation: `float ${p.dur} ${p.delay} infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.4; }
          50% { transform: translateY(-18px) scale(1.4); opacity: 0.7; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease-out both; }
        .fade-up-1 { animation-delay: 0.1s; }
        .fade-up-2 { animation-delay: 0.25s; }
        .fade-up-3 { animation-delay: 0.4s; }
        .fade-up-4 { animation-delay: 0.55s; }
        .fade-up-5 { animation-delay: 0.7s; }
      `}</style>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Badge */}
        <div className="fade-up fade-up-1 inline-flex items-center gap-2 border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.07)] rounded-full px-4 py-1.5 text-xs text-[#D4AF37] tracking-wide mb-8">
          <Star className="h-3 w-3 fill-[#D4AF37]" />
          Plataforma Jurídica N°1 do Brasil
        </div>

        {/* Logo mark */}
        <div className="fade-up fade-up-2 flex justify-center mb-6">
          <ApexLogo size={72} />
        </div>

        {/* Headline */}
        <h1 className="fade-up fade-up-2 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-none mb-4">
          <span className="text-white">APEX </span>
          <span className="text-[#C0C0C0]">Legal</span>
          <br />
          <span className="text-white">Performance</span>
        </h1>

        {/* Tagline */}
        <p className="fade-up fade-up-3 text-lg sm:text-xl text-[#A0AEC0] max-w-2xl mx-auto mt-6 mb-10 leading-relaxed">
          Transforme seu escritório com inteligência artificial e gestão processual de alta performance.
          A plataforma completa para advocacia moderna.
        </p>

        {/* CTAs */}
        <div className="fade-up fade-up-4 flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link
            href="/login"
            className="group flex items-center gap-2 bg-[#D4AF37] text-[#060d1a] font-bold px-8 py-4 rounded-xl text-base hover:bg-[#e0c040] transition-all duration-200 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] w-full sm:w-auto justify-center"
          >
            Começar Gratuitamente
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/legal"
            className="flex items-center gap-2 border border-[rgba(212,175,55,0.4)] text-[#D4AF37] font-semibold px-8 py-4 rounded-xl text-base hover:bg-[rgba(212,175,55,0.08)] hover:border-[rgba(212,175,55,0.6)] transition-all duration-200 w-full sm:w-auto justify-center"
          >
            Ver Demonstração
          </Link>
        </div>

        {/* Social proof mini */}
        <div className="fade-up fade-up-5 flex items-center justify-center gap-4 text-sm text-[#4A5568]">
          <span className="flex items-center gap-1">
            <Check className="h-3.5 w-3.5 text-[#D4AF37]" /> Sem cartão de crédito
          </span>
          <span className="w-px h-4 bg-[rgba(255,255,255,0.1)]" />
          <span className="flex items-center gap-1">
            <Check className="h-3.5 w-3.5 text-[#D4AF37]" /> Configuração em minutos
          </span>
          <span className="w-px h-4 bg-[rgba(255,255,255,0.1)]" />
          <span className="flex items-center gap-1">
            <Check className="h-3.5 w-3.5 text-[#D4AF37]" /> Suporte em português
          </span>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#060d1a] to-transparent pointer-events-none" />
    </section>
  );
}

/* ─────────────────────────────────────── stats bar ──────────────────────── */

function StatsBar() {
  const { ref, inView } = useInView();
  const stats = [
    { value: '50+', label: 'Funcionalidades' },
    { value: '144M+', label: 'Processos Consultáveis' },
    { value: 'IA', label: 'Jurídica Integrada' },
    { value: '100%', label: 'Brasileiro' },
  ];

  return (
    <div
      ref={ref}
      className="bg-[#0a1628] border-y border-[rgba(192,192,192,0.10)] py-8"
    >
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
          {stats.map((s, i) => (
            <div
              key={i}
              className={`flex flex-col items-center text-center py-4 px-6 transition-all duration-700 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${i < 3 ? 'border-b md:border-b-0 md:border-r border-[rgba(192,192,192,0.10)]' : ''} ${
                i === 1 ? 'border-r md:border-r border-[rgba(192,192,192,0.10)]' : ''
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <span className="text-3xl font-extrabold text-[#D4AF37] tracking-tight">{s.value}</span>
              <span className="text-xs text-[#A0AEC0] mt-1 tracking-wide uppercase">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────── features ────────────────────────── */

const FEATURES = [
  {
    icon: Briefcase,
    title: 'Gestão Processual',
    description:
      'Cadastre, acompanhe e gerencie processos com integração ao DataJud e tribunais brasileiros.',
  },
  {
    icon: Brain,
    title: 'IA Jurídica',
    description:
      'Chat jurídico, análise de documentos, geração de peças e jurimetria com inteligência artificial.',
  },
  {
    icon: DollarSign,
    title: 'Controle Financeiro',
    description:
      'Honorários, faturamento, tributos e fluxo de caixa em um único painel integrado.',
  },
  {
    icon: Clock,
    title: 'Prazos & Publicações',
    description:
      'Nunca mais perca um prazo. Alertas automáticos e monitoramento do DJE em tempo real.',
  },
  {
    icon: Target,
    title: 'Análise Estratégica',
    description:
      'SWOT, KPIs, BI e Legal Canvas para decisões estratégicas baseadas em dados reais.',
  },
  {
    icon: MessageCircle,
    title: 'Comunicação',
    description:
      'WhatsApp, email e SMS integrados com templates jurídicos e automações inteligentes.',
  },
];

function FeaturesGrid() {
  const { ref, inView } = useInView();

  return (
    <section id="features" className="py-24 bg-[#060d1a]">
      <div className="max-w-7xl mx-auto px-6">
        {/* Heading */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#D4AF37] tracking-widest uppercase mb-3">
            Funcionalidades
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Tudo que seu escritório precisa
          </h2>
          <p className="text-[#A0AEC0] mt-4 max-w-xl mx-auto">
            Uma plataforma completa para gestão jurídica, financeira e estratégica do seu escritório.
          </p>
        </div>

        {/* Grid */}
        <div ref={ref} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className={`group bg-[#0d1f3c] border border-[rgba(192,192,192,0.10)] rounded-xl p-6 hover:border-[rgba(212,175,55,0.3)] hover:bg-[#101f3a] transition-all duration-300 ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${i * 80}ms`, transitionProperty: 'opacity, transform, background-color, border-color' }}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.2)] mb-4 group-hover:bg-[rgba(212,175,55,0.18)] transition-colors">
                  <Icon className="h-5 w-5 text-[#D4AF37]" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-[#A0AEC0] leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────── AI showcase ─────────────────────── */

const AI_FEATURES = [
  'Chat jurídico com respostas contextualizadas',
  'Análise de PDFs e contratos em segundos',
  'Geração de petições com fundamentação legal',
  'Jurimetria e perfil de magistrados',
  'Precedentes e análise de tendências',
];

function AIShowcase() {
  const { ref, inView } = useInView();

  return (
    <section id="ai" className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#060d1a] via-[#0a1628] to-[#0d1f3c]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(212,175,55,0.05),transparent_60%)]" />

      <div ref={ref} className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <div
            className={`transition-all duration-700 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
          >
            <p className="text-xs font-semibold text-[#D4AF37] tracking-widest uppercase mb-3">
              Inteligência Artificial
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-snug">
              Inteligência Artificial <br />
              <span className="text-[#D4AF37]">Jurídica</span>
            </h2>
            <p className="text-[#A0AEC0] mb-8 leading-relaxed">
              Nossa IA foi treinada com milhões de documentos jurídicos brasileiros.
              Automatize tarefas repetitivas e foque no que realmente importa: a estratégia.
            </p>
            <ul className="space-y-4">
              {AI_FEATURES.map((feat, i) => (
                <li
                  key={i}
                  className={`flex items-start gap-3 transition-all duration-500 ${
                    inView ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: `${200 + i * 100}ms` }}
                >
                  <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(212,175,55,0.15)] border border-[rgba(212,175,55,0.3)] flex-shrink-0">
                    <Check className="h-3 w-3 text-[#D4AF37]" />
                  </span>
                  <span className="text-sm text-[#C0C0C0]">{feat}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-[#D4AF37] hover:text-[#e0c040] transition-colors"
            >
              Experimentar IA Jurídica <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Right — mock UI frame */}
          <div
            className={`transition-all duration-700 delay-200 ${inView ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
          >
            <div className="relative rounded-2xl border border-[rgba(192,192,192,0.12)] bg-[#080f1e] overflow-hidden shadow-2xl shadow-black/50">
              {/* Window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(255,255,255,0.05)] bg-[#0a1628]">
                <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-2 text-xs text-[#4A5568]">APEX IA Jurídica</span>
              </div>

              {/* Mock chat messages */}
              <div className="p-5 space-y-4">
                {/* User message */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] bg-[#D4AF37]/15 border border-[rgba(212,175,55,0.2)] rounded-xl rounded-tr-sm px-4 py-3">
                    <p className="text-xs text-[#C0C0C0]">
                      Preciso de uma petição de contestação para ação de cobrança indevida.
                    </p>
                  </div>
                </div>

                {/* AI message */}
                <div className="flex items-start gap-3">
                  <div className="h-7 w-7 rounded-lg bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.2)] flex items-center justify-center flex-shrink-0">
                    <Brain className="h-3.5 w-3.5 text-[#D4AF37]" />
                  </div>
                  <div className="max-w-[75%] bg-[#0d1f3c] border border-[rgba(192,192,192,0.08)] rounded-xl rounded-tl-sm px-4 py-3">
                    <p className="text-xs text-[#A0AEC0] leading-relaxed">
                      Claro! Vou gerar a contestação com base na jurisprudência do STJ e TJ local.
                      Identificando os melhores argumentos para o caso…
                    </p>
                  </div>
                </div>

                {/* Typing indicator / progress */}
                <div className="ml-10 space-y-2">
                  <div className="h-2 bg-[#0d1f3c] rounded-full overflow-hidden w-4/5">
                    <div className="h-full w-3/4 bg-gradient-to-r from-[#D4AF37]/40 to-[#D4AF37]/80 rounded-full" />
                  </div>
                  <div className="h-2 bg-[#0d1f3c] rounded-full overflow-hidden w-3/5">
                    <div className="h-full w-1/2 bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/60 rounded-full" />
                  </div>
                  <div className="h-2 bg-[#0d1f3c] rounded-full overflow-hidden w-2/5">
                    <div className="h-full w-4/5 bg-gradient-to-r from-[#D4AF37]/20 to-[#D4AF37]/50 rounded-full" />
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {['Petição Gerada', 'Fundamentos Legais', 'Jurisprudência STJ'].map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-2.5 py-1 rounded-full bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] text-[#D4AF37]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Input mock */}
              <div className="px-5 pb-5">
                <div className="flex items-center gap-2 border border-[rgba(192,192,192,0.1)] rounded-xl bg-[#0a1628] px-4 py-2.5">
                  <span className="text-xs text-[#4A5568] flex-1">Digite sua consulta jurídica…</span>
                  <div className="h-6 w-6 rounded-lg bg-[#D4AF37] flex items-center justify-center">
                    <ArrowRight className="h-3 w-3 text-[#060d1a]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-3 -right-3 bg-[#0d1f3c] border border-[rgba(212,175,55,0.3)] rounded-xl px-4 py-2.5 shadow-xl">
              <p className="text-xs font-semibold text-[#D4AF37]">⚡ Resposta em &lt;3s</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────── pricing ─────────────────────────── */

const PLANS = [
  {
    name: 'Starter',
    price: 'Gratuito',
    sub: 'Para advogados autônomos',
    features: ['5 processos ativos', 'IA básica (10 consultas/mês)', '1 usuário', 'Suporte por email'],
    cta: 'Começar Grátis',
    href: '/login',
    popular: false,
  },
  {
    name: 'Professional',
    price: 'R$ 197',
    priceSub: '/mês',
    sub: 'Para escritórios em crescimento',
    features: [
      'Processos ilimitados',
      'IA avançada (ilimitado)',
      'Até 5 usuários',
      'Integrações DataJud & DJE',
      'Financeiro completo',
      'Suporte prioritário',
    ],
    cta: 'Assinar Agora',
    href: '/login',
    checkoutPlan: 'professional',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    sub: 'Para grandes escritórios',
    features: [
      'Tudo do Professional',
      'Usuários ilimitados',
      'White-label disponível',
      'Acesso à API',
      'Suporte dedicado 24/7',
      'Onboarding personalizado',
    ],
    cta: 'Falar com Vendas',
    href: '/login',
    checkoutPlan: 'enterprise',
    popular: false,
  },
];

function PricingCTA({ plan }: { plan: (typeof PLANS)[number] }) {
  const [loading, setLoading] = useState(false);

  const baseClass = plan.popular
    ? 'bg-[#D4AF37] text-[#060d1a] hover:bg-[#e0c040] hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]'
    : 'border border-[rgba(192,192,192,0.2)] text-[#C0C0C0] hover:border-[rgba(212,175,55,0.4)] hover:text-[#D4AF37]';

  if (!plan.checkoutPlan) {
    return (
      <Link
        href={plan.href}
        className={`block text-center font-semibold py-3 px-6 rounded-xl text-sm transition-all duration-200 ${baseClass}`}
      >
        {plan.cta}
      </Link>
    );
  }

  async function handleCheckout() {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.checkoutPlan }),
      });
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (data.initPoint) {
        window.location.href = data.initPoint;
      }
    } catch {
      window.location.href = '/login';
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className={`w-full text-center font-semibold py-3 px-6 rounded-xl text-sm transition-all duration-200 disabled:opacity-50 ${baseClass}`}
    >
      {loading ? 'Redirecionando…' : plan.cta}
    </button>
  );
}

function Pricing() {
  const { ref, inView } = useInView();

  return (
    <section id="pricing" className="py-24 bg-[#060d1a]">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#D4AF37] tracking-widest uppercase mb-3">
            Planos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Planos para todo tamanho de escritório
          </h2>
          <p className="text-[#A0AEC0] mt-4 max-w-xl mx-auto">
            Comece gratuitamente e evolua conforme seu escritório cresce.
          </p>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-7 transition-all duration-700 ${
                plan.popular
                  ? 'bg-[#0d1f3c] border-2 border-[#D4AF37] shadow-[0_0_40px_rgba(212,175,55,0.12)]'
                  : 'bg-[#0d1f3c] border border-[rgba(192,192,192,0.10)]'
              } ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="bg-[#D4AF37] text-[#060d1a] text-[10px] font-extrabold tracking-widest uppercase px-4 py-1 rounded-full shadow-lg">
                    MAIS POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                <p className="text-xs text-[#A0AEC0] mb-4">{plan.sub}</p>
                <div className="flex items-end gap-1">
                  <span className={`text-3xl font-extrabold ${plan.popular ? 'text-[#D4AF37]' : 'text-white'}`}>
                    {plan.price}
                  </span>
                  {plan.priceSub && (
                    <span className="text-sm text-[#A0AEC0] mb-1">{plan.priceSub}</span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm text-[#A0AEC0]">
                    <Check className="h-4 w-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>

              <PricingCTA plan={plan} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────── testimonials ────────────────────── */

const TESTIMONIALS = [
  {
    quote:
      'O APEX transformou nossa gestão de prazos. Reduzimos em 80% os prazos perdidos e hoje temos total controle sobre todos os processos do escritório.',
    name: 'Dr. Carlos Mendes',
    firm: 'Mendes & Associados',
    city: 'São Paulo, SP',
    stars: 5,
  },
  {
    quote:
      'A IA jurídica é impressionante. Geração de peças que antes levava horas, agora leva minutos. A fundamentação legal é precisa e alinhada com a jurisprudência atual.',
    name: 'Dra. Ana Beatriz',
    firm: 'Jurídico Corporativo',
    city: 'Rio de Janeiro, RJ',
    stars: 5,
  },
  {
    quote:
      'O melhor custo-benefício do mercado. Interface moderna, funcionalidades completas e suporte exemplar. Recomendo a todos os colegas advogados.',
    name: 'Dr. Roberto Ferreira',
    firm: 'Ferreira Advocacia',
    city: 'Belo Horizonte, MG',
    stars: 5,
  },
];

function Testimonials() {
  const { ref, inView } = useInView();

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#0a1628]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,175,55,0.04),transparent_60%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-[#D4AF37] tracking-widest uppercase mb-3">
            Depoimentos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Confiado por escritórios em todo o Brasil
          </h2>
        </div>

        <div ref={ref} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className={`bg-[#0d1f3c] border border-[rgba(192,192,192,0.10)] rounded-xl p-6 transition-all duration-700 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
                ))}
              </div>

              {/* Quote icon */}
              <Quote className="h-6 w-6 text-[rgba(212,175,55,0.3)] mb-3" />

              {/* Text */}
              <p className="text-sm text-[#A0AEC0] italic leading-relaxed mb-5">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-[rgba(192,192,192,0.06)]">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border border-[rgba(212,175,55,0.2)] flex items-center justify-center text-xs font-bold text-[#D4AF37]">
                  {t.name.split(' ').slice(-1)[0][0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-[#4A5568]">
                    {t.firm} · {t.city}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────── CTA section ─────────────────────── */

function CTASection() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[#060d1a]" />
      {/* Gold glow behind the button area */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[#D4AF37]/6 rounded-full blur-[80px] pointer-events-none" />

      <div
        ref={ref}
        className={`relative z-10 max-w-2xl mx-auto px-6 text-center transition-all duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Pronto para transformar seu escritório?
        </h2>
        <p className="text-[#A0AEC0] mb-10 text-lg">
          Comece gratuitamente. Sem cartão de crédito.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-[#D4AF37] text-[#060d1a] font-bold px-10 py-4 rounded-xl text-base hover:bg-[#e0c040] transition-all duration-200 hover:shadow-[0_0_50px_rgba(212,175,55,0.45)]"
        >
          Criar Conta Gratuita
          <ArrowRight className="h-5 w-5" />
        </Link>
        <p className="text-xs text-[#4A5568] mt-4">
          Junte-se a centenas de escritórios que já usam o APEX
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────── footer ─────────────────────────── */

function Footer() {
  const cols = [
    {
      title: 'Produto',
      links: [
        { label: 'Gestão Processual', href: '#features' },
        { label: 'IA Jurídica', href: '#ai' },
        { label: 'Controle Financeiro', href: '#features' },
        { label: 'Prazos & Publicações', href: '#features' },
      ],
    },
    {
      title: 'Recursos',
      links: [
        { label: 'Blog Jurídico', href: '#' },
        { label: 'Documentação', href: '#' },
        { label: 'Central de Ajuda', href: '#' },
        { label: 'Webinars', href: '#' },
      ],
    },
    {
      title: 'Empresa',
      links: [
        { label: 'Sobre Nós', href: '#' },
        { label: 'Contato', href: '#' },
        { label: 'Carreiras', href: '#' },
        { label: 'Parceiros', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Termos de Uso', href: '#' },
        { label: 'Privacidade', href: '#' },
        { label: 'LGPD', href: '#' },
        { label: 'Cookies', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-[#050c17] border-t border-[rgba(192,192,192,0.06)]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Top row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand col */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <ApexLogo size={32} />
              <span className="font-bold text-white text-sm">
                APEX <span className="text-[#C0C0C0]">LEGAL</span>
              </span>
            </div>
            <p className="text-xs text-[#4A5568] leading-relaxed">
              Solução Jurídica Tecnológica de Alta Performance para escritórios brasileiros.
            </p>
          </div>

          {/* Link cols */}
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold text-[#C0C0C0] uppercase tracking-widest mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-xs text-[#4A5568] hover:text-[#A0AEC0] transition-colors"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[rgba(192,192,192,0.06)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#4A5568]">
            © 2026 APEX Legal Performance. Todos os direitos reservados.
          </p>

          {/* Social icons — SVG inline */}
          <div className="flex items-center gap-4">
            {/* LinkedIn */}
            <a href="#" aria-label="LinkedIn" className="text-[#4A5568] hover:text-[#A0AEC0] transition-colors">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" aria-label="Instagram" className="text-[#4A5568] hover:text-[#A0AEC0] transition-colors">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            {/* Twitter / X */}
            <a href="#" aria-label="Twitter" className="text-[#4A5568] hover:text-[#A0AEC0] transition-colors">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────── page ────────────────────────────── */

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "APEX Legal Performance",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://apex.legal",
  description:
    "Plataforma jurídica com inteligência artificial para gestão de processos, prazos, honorários e estratégia para escritórios de advocacia brasileiros.",
  inLanguage: "pt-BR",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "BRL",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060d1a] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <FeaturesGrid />
        <AIShowcase />
        <Pricing />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
