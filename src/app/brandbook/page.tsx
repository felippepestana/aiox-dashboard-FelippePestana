"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  Award,
  Cpu,
  ShieldCheck,
  Gauge,
  Scale,
  Sparkles,
  Quote,
  Building2,
  Users,
  Handshake,
  Briefcase,
  Camera,
  Mail,
  MonitorSmartphone,
  Check,
  X,
  ArrowDown,
} from "lucide-react";

/* ════════════════════════════════════════════════════════════════════════
   FP MONOGRAM — interlocking F + P sharing a vertical stroke.
   Metallic gradient: silver at top → chrome → gold shimmer at the base.
   ════════════════════════════════════════════════════════════════════════ */
function FPMonogram({
  size = 160,
  variant = "metallic",
  className,
}: {
  size?: number;
  variant?: "metallic" | "navy" | "gold" | "silver" | "mono-light" | "mono-dark";
  className?: string;
}) {
  const id = `fp-${variant}`;
  const fills: Record<string, string> = {
    metallic: `url(#${id})`,
    navy: "#0a1628",
    gold: "#D4AF37",
    silver: "#C0C0C0",
    "mono-light": "#FAFAFA",
    "mono-dark": "#060d1a",
  };
  const fill = fills[variant];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Monograma FP — FP Legal Performance"
    >
      <defs>
        <linearGradient id={id} x1="60" y1="20" x2="140" y2="185" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E8E8ED" />
          <stop offset="28%" stopColor="#C0C0C0" />
          <stop offset="50%" stopColor="#A0AEC0" />
          <stop offset="68%" stopColor="#C9A84C" />
          <stop offset="86%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#B8941F" />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Shared vertical stroke */}
      <rect x="54" y="22" width="20" height="156" rx="3" fill={fill} />
      {/* F top arm */}
      <rect x="54" y="22" width="74" height="20" rx="3" fill={fill} />
      {/* F middle arm */}
      <rect x="54" y="90" width="56" height="20" rx="3" fill={fill} />
      {/* P bowl — offset right, interlocking off the shared stem */}
      <path
        d="M74 50 H120 a34 34 0 0 1 0 68 H94 v-20 h26 a14 14 0 0 0 0 -28 H74 Z"
        fill={fill}
      />
      {/* subtle sheen on metallic only */}
      {variant === "metallic" && (
        <>
          <rect x="54" y="22" width="20" height="156" rx="3" fill={`url(#${id}-sheen)`} />
          <path
            d="M74 50 H120 a34 34 0 0 1 0 68 H94 v-20 h26 a14 14 0 0 0 0 -28 H74 Z"
            fill={`url(#${id}-sheen)`}
          />
        </>
      )}
    </svg>
  );
}

/* ── Scroll reveal helper ─────────────────────────────────────────────── */
function Reveal({ children, className = "", style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVis(true);
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={style} className={`bb-reveal ${vis ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}

/* ── Section shell ────────────────────────────────────────────────────── */
function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="relative scroll-mt-24 py-24 px-6 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="bb-mono mb-3 text-xs uppercase tracking-[0.32em] text-[#D4AF37]">{eyebrow}</p>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">{title}</h2>
          {intro && <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#A0AEC0]">{intro}</p>}
          <div className="bb-shimmer-line mt-8 max-w-xs" />
        </Reveal>
        <div className="mt-14">{children}</div>
      </div>
    </section>
  );
}

/* ── Color swatch ─────────────────────────────────────────────────────── */
function Swatch({
  hex,
  name,
  rgb,
  cmyk,
  dark,
}: {
  hex: string;
  name: string;
  rgb: string;
  cmyk: string;
  dark?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(hex);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="bb-card group overflow-hidden text-left"
    >
      <div className="relative h-28" style={{ background: hex }}>
        <span
          className={`bb-mono absolute right-3 top-3 rounded-full px-2 py-1 text-[10px] tracking-wide transition ${
            dark ? "bg-black/30 text-white" : "bg-white/40 text-black"
          }`}
        >
          {copied ? "copiado!" : "copiar"}
        </span>
      </div>
      <div className="p-4">
        <p className="font-medium">{name}</p>
        <p className="bb-mono mt-1 text-xs text-[#A0AEC0]">{hex}</p>
        <p className="bb-mono mt-2 text-[11px] leading-relaxed text-[#A0AEC0]/70">
          RGB {rgb}
          <br />
          CMYK {cmyk}
        </p>
      </div>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════════ */
const NAV = [
  { id: "logo", label: "Logo" },
  { id: "cores", label: "Cores" },
  { id: "tipografia", label: "Tipografia" },
  { id: "elementos", label: "Elementos" },
  { id: "aplicacoes", label: "Aplicações" },
  { id: "fotografia", label: "Fotografia" },
  { id: "banners", label: "Banners" },
  { id: "tom", label: "Tom de Voz" },
];

export default function BrandbookPage() {
  const particles = Array.from({ length: 26 });
  return (
    <main>
      {/* ═══════════════ 1. HERO ═══════════════ */}
      <header id="top" className="bb-hero flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="bb-hero-grad" />
        <div className="bb-hero-lines">
          <span /><span /><span /><span />
        </div>
        <div className="bb-particles">
          {particles.map((_, i) => (
            <i
              key={i}
              style={{
                left: `${(i * 3.84) % 100}%`,
                width: `${4 + (i % 4) * 2}px`,
                height: `${4 + (i % 4) * 2}px`,
                animationDuration: `${9 + (i % 7) * 2}s`,
                animationDelay: `${-(i % 10)}s`,
              }}
            />
          ))}
        </div>

        <Reveal>
          <div className="bb-logo-glow mb-8 inline-block">
            <FPMonogram size={170} />
          </div>
          <p className="bb-mono mb-4 text-xs uppercase tracking-[0.5em] text-[#A0AEC0]">Brand Guidelines</p>
          <h1 className="text-5xl font-bold leading-[0.95] sm:text-7xl">
            <span className="bb-silver-text">FP</span>{" "}
            <span className="bb-gold-text">Legal</span>
            <br />
            <span className="bb-silver-text">Performance</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[#A0AEC0]">
            Soluções Jurídicas com <span className="text-[#E5C667]">Legal Performance</span>
          </p>
          <div className="mt-8 flex items-center justify-center gap-4 text-sm text-[#A0AEC0]">
            <span className="bb-mono rounded-full border border-[#D4AF37]/40 px-4 py-1.5 text-[#E5C667]">
              OAB/RO 5077
            </span>
            <span className="bb-mono">Felippe Pestana</span>
          </div>
        </Reveal>

        <a
          href="#manifesto"
          className="absolute bottom-10 flex flex-col items-center gap-2 text-[#A0AEC0] transition hover:text-[#E5C667]"
        >
          <span className="bb-mono text-[10px] uppercase tracking-[0.3em]">explorar</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </a>
      </header>

      {/* ═══════════════ 2. STICKY NAV ═══════════════ */}
      <nav className="bb-nav">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <a href="#top" className="flex items-center gap-2.5">
            <FPMonogram size={28} />
            <span className="text-sm font-semibold tracking-wide">FP Legal Performance</span>
          </a>
          <div className="hidden gap-7 text-sm md:flex">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`}>
                {n.label}
              </a>
            ))}
          </div>
          <span className="bb-mono hidden text-xs text-[#D4AF37] sm:inline">v1.0</span>
        </div>
      </nav>

      {/* ═══════════════ 3. MANIFESTO ═══════════════ */}
      <section id="manifesto" className="relative scroll-mt-24 overflow-hidden px-6 py-28 sm:px-10 lg:px-16">
        <div className="bb-geo absolute inset-0 -z-10 opacity-40" />
        <div className="mx-auto max-w-5xl text-center">
          <Reveal>
            <Quote className="mx-auto mb-6 h-8 w-8 text-[#D4AF37]" />
            <p className="text-2xl font-light leading-snug sm:text-4xl">
              Unimos a tradição do Direito à precisão da tecnologia para entregar{" "}
              <span className="bb-gold-text font-medium">resultados mensuráveis</span> — uma advocacia de alta
              performance, sofisticada e absolutamente confiável.
            </p>
          </Reveal>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Award, t: "Excelência", d: "Padrão impecável em cada peça, prazo e atendimento." },
              { icon: Cpu, t: "Tecnologia", d: "IA e dados a serviço de decisões jurídicas mais inteligentes." },
              { icon: ShieldCheck, t: "Confiança", d: "Relações construídas sobre ética, sigilo e transparência." },
              { icon: Gauge, t: "Performance", d: "Foco obsessivo em eficiência e em resultado concreto." },
            ].map((v, i) => (
              <Reveal key={v.t} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="bb-card bb-gold-edge h-full p-6 pl-7 text-left">
                  <v.icon className="mb-4 h-7 w-7 text-[#E5C667]" />
                  <h3 className="text-lg font-semibold">{v.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#A0AEC0]">{v.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ 4. LOGO ═══════════════ */}
      <Section
        id="logo"
        eyebrow="O Símbolo"
        title={<>O monograma <span className="bb-gold-text">FP</span></>}
        intro="Um F e um P entrelaçados que compartilham a haste vertical — geometria firme, equilíbrio e movimento ascendente. O gradiente metálico evolui do prata cromado ao brilho dourado."
      >
        {/* Primary */}
        <Reveal>
          <div className="bb-card mb-12 flex flex-col items-center gap-10 p-12 sm:flex-row sm:justify-center">
            <div className="bb-logo-glow">
              <FPMonogram size={220} />
            </div>
            <div className="max-w-sm text-center sm:text-left">
              <p className="bb-mono text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Assinatura principal</p>
              <h3 className="mt-3 text-2xl font-semibold">FP Legal Performance</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#A0AEC0]">
                Versão preferencial, com gradiente metálico navy → prata → ouro. Use sobre fundos escuros sempre
                que possível para máximo contraste e sofisticação.
              </p>
            </div>
          </div>
        </Reveal>

        {/* Variations grid */}
        <Reveal>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">Variações</h4>
          <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { bg: "#0a1628", v: "metallic", l: "Sobre navy" },
              { bg: "#C0C0C0", v: "navy", l: "Sobre prata" },
              { bg: "#D4AF37", v: "navy", l: "Sobre ouro" },
              { bg: "#060d1a", v: "mono-light", l: "Mono claro" },
              { bg: "#E8E8ED", v: "mono-dark", l: "Mono escuro / invertido" },
            ].map((s) => (
              <div key={s.l} className="bb-card overflow-hidden">
                <div className="flex h-32 items-center justify-center" style={{ background: s.bg }}>
                  <FPMonogram size={70} variant={s.v as "metallic"} />
                </div>
                <p className="p-3 text-center text-xs text-[#A0AEC0]">{s.l}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Clear space + min size */}
        <div className="mb-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="bb-card h-full p-8">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">
                Área de respiro
              </h4>
              <div className="relative mx-auto flex aspect-square max-w-xs items-center justify-center rounded-xl border border-dashed border-[#D4AF37]/50 p-10">
                <div className="absolute inset-6 rounded-lg border border-[#A0AEC0]/30" />
                <FPMonogram size={110} />
                <span className="bb-mono absolute left-1/2 top-1.5 -translate-x-1/2 text-[10px] text-[#D4AF37]">
                  ↕ 1x
                </span>
                <span className="bb-mono absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#D4AF37]">
                  1x
                </span>
              </div>
              <p className="mt-4 text-sm text-[#A0AEC0]">
                Mantenha no mínimo <span className="text-[#E5C667]">1×</span> a altura do monograma de espaço livre
                em todos os lados — nenhum outro elemento deve invadir essa zona.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="bb-card flex h-full flex-col justify-center gap-8 p-8">
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">Tamanho mínimo</h4>
              <div className="flex items-end gap-10">
                <div className="text-center">
                  <FPMonogram size={64} />
                  <p className="bb-mono mt-3 text-xs text-[#A0AEC0]">Digital · 24px</p>
                </div>
                <div className="text-center">
                  <FPMonogram size={40} />
                  <p className="bb-mono mt-3 text-xs text-[#A0AEC0]">Favicon · 16px</p>
                </div>
                <div className="text-center">
                  <FPMonogram size={88} />
                  <p className="bb-mono mt-3 text-xs text-[#A0AEC0]">Impresso · 10mm</p>
                </div>
              </div>
              <p className="text-sm text-[#A0AEC0]">
                Abaixo desses limites o entrelaçamento do F e do P perde legibilidade. Prefira a versão monocromática
                em tamanhos muito reduzidos.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Don'ts */}
        <Reveal>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">Usos incorretos</h4>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { l: "Não distorça", t: "scaleX(1.6)" },
              { l: "Não recolora", t: "hue" },
              { l: "Não rotacione", t: "rotate(18deg)" },
              { l: "Não adicione sombra", t: "shadow" },
              { l: "Não altere proporções", t: "scaleY(1.5)" },
              { l: "Não use baixo contraste", t: "low" },
            ].map((d) => (
              <div key={d.l} className="bb-card overflow-hidden">
                <div className="bb-dont relative flex h-28 items-center justify-center bg-[#0d1f3c]">
                  <div
                    style={
                      d.t === "scaleX(1.6)"
                        ? { transform: "scaleX(1.6)" }
                        : d.t === "rotate(18deg)"
                        ? { transform: "rotate(18deg)" }
                        : d.t === "scaleY(1.5)"
                        ? { transform: "scaleY(1.5)" }
                        : d.t === "shadow"
                        ? { filter: "drop-shadow(4px 6px 4px rgba(0,0,0,0.8))" }
                        : d.t === "low"
                        ? { opacity: 0.25 }
                        : { filter: "hue-rotate(140deg) saturate(2)" }
                    }
                  >
                    <FPMonogram
                      size={56}
                      variant={d.t === "hue" || d.t === "low" ? "gold" : "metallic"}
                    />
                  </div>
                </div>
                <p className="flex items-center gap-1.5 p-3 text-center text-xs text-[#A0AEC0]">
                  <X className="h-3.5 w-3.5 shrink-0 text-[#F87171]" />
                  {d.l}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ═══════════════ 5. CORES ═══════════════ */}
      <Section
        id="cores"
        eyebrow="A Paleta"
        title={<>Navy, Prata &amp; <span className="bb-gold-text">Ouro</span></>}
        intro="Um sistema cromático de três famílias. O navy profundo sustenta a marca, o prata traz o acabamento tecnológico e o ouro — protagonista — assina o prestígio e a performance."
      >
        <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">Navy · base</h4>
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Swatch dark hex="#060D1A" name="Navy Deep" rgb="6 13 26" cmyk="77 50 0 90" />
          <Swatch dark hex="#0A1628" name="Navy 900" rgb="10 22 40" cmyk="75 45 0 84" />
          <Swatch dark hex="#0D1F3C" name="Navy 800" rgb="13 31 60" cmyk="78 48 0 76" />
          <Swatch dark hex="#1A2D52" name="Navy 700" rgb="26 45 82" cmyk="68 45 0 68" />
        </div>

        <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">Prata · cromo</h4>
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Swatch hex="#E8E8ED" name="Silver 100" rgb="232 232 237" cmyk="2 2 0 7" />
          <Swatch hex="#D4D4D8" name="Silver 200" rgb="212 212 216" cmyk="2 2 0 15" />
          <Swatch hex="#C0C0C0" name="Silver 300" rgb="192 192 192" cmyk="0 0 0 25" />
          <Swatch hex="#A0AEC0" name="Silver 400" rgb="160 174 192" cmyk="17 9 0 25" />
        </div>

        {/* Gold highlighted block */}
        <Reveal>
          <div className="relative mb-12 overflow-hidden rounded-2xl border border-[#D4AF37]/40 p-8">
            <div className="absolute inset-0 -z-10 bg-[#060d1a]" />
            <div className="absolute inset-0 -z-10 opacity-30 bg-[radial-gradient(60%_120%_at_50%_-10%,rgba(212,175,55,0.5),transparent_60%)]" />
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-[#E5C667]" />
              <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#E5C667]">
                Ouro · acento de prestígio
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Swatch hex="#E5C667" name="Gold Light" rgb="229 198 103" cmyk="0 14 55 10" />
              <Swatch hex="#D4AF37" name="Gold (core)" rgb="212 175 55" cmyk="0 17 74 17" />
              <Swatch hex="#C9A84C" name="Gold Mid" rgb="201 168 76" cmyk="0 16 62 21" />
              <Swatch hex="#B8941F" name="Gold Deep" rgb="184 148 31" cmyk="0 20 83 28" />
            </div>
          </div>
        </Reveal>

        {/* Combinations */}
        <Reveal>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">Combinações</h4>
          <div className="mb-12 grid gap-4 sm:grid-cols-3">
            {[
              { l: "Navy + Ouro", g: "linear-gradient(90deg,#0a1628,#0d1f3c 45%,#D4AF37)" },
              { l: "Navy + Prata", g: "linear-gradient(90deg,#0a1628,#1a2d52 45%,#C0C0C0)" },
              { l: "Prata + Ouro", g: "linear-gradient(90deg,#C0C0C0,#E5C667 55%,#B8941F)" },
            ].map((c) => (
              <div key={c.l} className="bb-card overflow-hidden">
                <div className="h-20" style={{ background: c.g }} />
                <p className="p-3 text-center text-sm">{c.l}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Proportions */}
        <Reveal>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">
            Proporção de uso
          </h4>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <div className="flex h-16 text-xs font-medium">
              <div className="flex items-center justify-center bg-[#0a1628]" style={{ width: "60%" }}>
                60% Navy
              </div>
              <div
                className="flex items-center justify-center bg-[#C0C0C0] text-[#0a1628]"
                style={{ width: "25%" }}
              >
                25% Prata
              </div>
              <div
                className="flex items-center justify-center bg-[#D4AF37] text-[#0a1628]"
                style={{ width: "15%" }}
              >
                15% Ouro
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ═══════════════ 6. TIPOGRAFIA ═══════════════ */}
      <Section
        id="tipografia"
        eyebrow="Tipografia"
        title={<>Geist <span className="bb-gold-text">Sans</span></>}
        intro="Uma grotesca contemporânea, geométrica e altamente legível. Comunica clareza, tecnologia e neutralidade elegante — ideal tanto para títulos quanto para textos longos."
      >
        <Reveal>
          <div className="bb-card mb-8 p-8">
            <p className="bb-mono mb-3 text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Mostruário</p>
            <p className="text-3xl tracking-wide sm:text-4xl">ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
            <p className="mt-2 text-2xl tracking-wide text-[#A0AEC0] sm:text-3xl">abcdefghijklmnopqrstuvwxyz</p>
            <p className="bb-gold-text mt-2 text-3xl font-semibold tracking-wide sm:text-4xl">
              0123456789 · &amp; @ % § ¶
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Type scale */}
          <Reveal>
            <div className="bb-card h-full p-8">
              <h4 className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">Escala</h4>
              <div className="space-y-4">
                {[
                  { l: "H1", s: "48px", c: "text-5xl font-bold" },
                  { l: "H2", s: "36px", c: "text-4xl font-semibold" },
                  { l: "H3", s: "28px", c: "text-3xl font-semibold" },
                  { l: "H4", s: "22px", c: "text-2xl font-medium" },
                  { l: "Body", s: "16px", c: "text-base" },
                  { l: "Caption", s: "12px", c: "text-xs text-[#A0AEC0]" },
                ].map((t) => (
                  <div key={t.l} className="flex items-baseline justify-between gap-4 border-b border-white/5 pb-3">
                    <span className={`${t.c} truncate`}>Legal Performance</span>
                    <span className="bb-mono shrink-0 text-xs text-[#D4AF37]">
                      {t.l} · {t.s}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Weights + usage */}
          <div className="space-y-6">
            <Reveal>
              <div className="bb-card p-8">
                <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">Pesos</h4>
                <div className="space-y-2 text-xl">
                  <p className="font-light">Light — institucional</p>
                  <p className="font-normal">Regular — corpo de texto</p>
                  <p className="font-medium">Medium — destaques</p>
                  <p className="font-semibold">Semibold — subtítulos</p>
                  <p className="font-bold">Bold — títulos</p>
                </div>
              </div>
            </Reveal>
            <Reveal>
              <div className="bb-card p-8">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">
                  Aplicação
                </h4>
                <h3 className="text-2xl font-bold">Defesa estratégica, resultado mensurável.</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#A0AEC0]">
                  Combinamos rigor técnico e inteligência de dados para conduzir cada caso com precisão. Títulos em
                  Semibold/Bold, corpo em Regular, com entrelinha generosa para leitura confortável.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ═══════════════ 7. ELEMENTOS ═══════════════ */}
      <Section
        id="elementos"
        eyebrow="Sistema Visual"
        title={<>Elementos <span className="bb-gold-text">gráficos</span></>}
        intro="Os recursos de apoio que dão ritmo e identidade às peças — linhas de ouro, grids geométricos e um estilo de iconografia prateada com acentos dourados."
      >
        <div className="grid gap-6 lg:grid-cols-3">
          <Reveal>
            <div className="bb-card h-full p-8">
              <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">
                Linha de acento
              </h4>
              <div className="space-y-6">
                <div className="h-[3px] w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C667] to-transparent" />
                <div className="bb-shimmer-line" />
                <div className="h-[3px] w-24 rounded-full bg-gradient-to-r from-[#B8941F] to-[#E5C667]" />
              </div>
              <p className="mt-6 text-sm text-[#A0AEC0]">
                A linha dourada — estática ou com shimmer animado — separa blocos e sublinha títulos-chave.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="bb-card h-full overflow-hidden p-8">
              <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">
                Padrão geométrico
              </h4>
              <div className="bb-geo h-40 rounded-lg border border-[#D4AF37]/20" />
              <p className="mt-6 text-sm text-[#A0AEC0]">
                Grid técnico navy + ouro, usado como textura sutil em fundos e seções de respiro.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="bb-card h-full p-8">
              <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">Iconografia</h4>
              <div className="grid grid-cols-4 gap-4">
                {[Scale, ShieldCheck, Gauge, Briefcase, Award, Cpu, Building2, Handshake].map((Ic, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-lg border border-[#A0AEC0]/20 bg-white/5"
                  >
                    <Ic className="h-5 w-5 text-[#C0C0C0]" strokeWidth={1.6} />
                  </div>
                ))}
              </div>
              <p className="mt-6 text-sm text-[#A0AEC0]">
                Lucide com traço 1.5–1.7px, em prata. Aplique o ouro apenas em ícones de destaque ou estados ativos.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Surface styles */}
        <Reveal>
          <h4 className="mb-5 mt-12 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">
            Superfícies &amp; cartões
          </h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="bb-card p-6">
              <p className="font-medium">Glass card</p>
              <p className="mt-2 text-sm text-[#A0AEC0]">Vidro fosco com borda prata, hover dourado.</p>
            </div>
            <div className="bb-card bb-gold-edge p-6 pl-7">
              <p className="font-medium">Gold edge</p>
              <p className="mt-2 text-sm text-[#A0AEC0]">Barra dourada lateral para itens prioritários.</p>
            </div>
            <div className="overflow-hidden rounded-[18px] border border-[#D4AF37]/40 bg-gradient-to-br from-[#0d1f3c] to-[#060d1a] p-6">
              <p className="font-medium text-[#E5C667]">Premium navy</p>
              <p className="mt-2 text-sm text-[#A0AEC0]">Gradiente navy com moldura de ouro para CTAs.</p>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* ═══════════════ 8. APLICAÇÕES ═══════════════ */}
      <Section
        id="aplicacoes"
        eyebrow="No Mundo Real"
        title={<>Aplicações &amp; <span className="bb-gold-text">mockups</span></>}
        intro="Como a marca ganha vida em papelaria, comunicação digital e no próprio produto."
      >
        {/* Business card (flip) */}
        <Reveal>
          <h4 className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">
            Cartão de visita <span className="text-[#D4AF37]">(passe o mouse para virar)</span>
          </h4>
          <div className="mb-12 flex flex-wrap gap-8">
            <div className="bb-card3d" style={{ width: 340, height: 200 }}>
              <div className="bb-card3d-inner h-full w-full">
                {/* front */}
                <div className="bb-card3d-face overflow-hidden border border-[#D4AF37]/30 bg-gradient-to-br from-[#0d1f3c] to-[#060d1a] p-6">
                  <div className="flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <FPMonogram size={52} />
                      <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold">Felippe Pestana</p>
                      <p className="text-xs text-[#A0AEC0]">Advogado · OAB/RO 5077</p>
                      <p className="bb-mono mt-2 text-[10px] uppercase tracking-[0.25em] text-[#E5C667]">
                        FP Legal Performance
                      </p>
                    </div>
                  </div>
                </div>
                {/* back */}
                <div className="bb-card3d-back bb-card3d-face flex flex-col items-center justify-center gap-3 border border-[#D4AF37]/30 bg-[#060d1a]">
                  <FPMonogram size={64} />
                  <p className="bb-mono text-[10px] uppercase tracking-[0.3em] text-[#A0AEC0]">
                    Soluções Jurídicas
                  </p>
                  <p className="text-xs text-[#A0AEC0]">felippepestana.com.br</p>
                </div>
              </div>
            </div>

            {/* Email signature */}
            <div className="bb-card flex-1 min-w-[300px] p-6">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">
                <Mail className="h-4 w-4 text-[#D4AF37]" /> Assinatura de e-mail
              </p>
              <div className="flex items-center gap-4 rounded-lg bg-white/[0.03] p-4">
                <FPMonogram size={56} />
                <div className="border-l-2 border-[#D4AF37] pl-4">
                  <p className="font-semibold">Felippe Pestana</p>
                  <p className="text-xs text-[#A0AEC0]">Advogado — OAB/RO 5077</p>
                  <p className="text-xs text-[#E5C667]">FP Legal Performance</p>
                  <p className="bb-mono mt-1 text-[11px] text-[#A0AEC0]">
                    felippe@felippepestana.com.br
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Letterhead + social + app */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Letterhead */}
          <Reveal>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">Papel timbrado</p>
            <div className="mx-auto flex aspect-[1/1.414] max-w-xs flex-col rounded-lg bg-[#FAFAFA] p-5 text-[#0a1628] shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#0a1628]/15 pb-3">
                <FPMonogram size={40} variant="navy" />
                <div className="text-right">
                  <p className="text-[11px] font-semibold">FP Legal Performance</p>
                  <p className="bb-mono text-[8px] text-[#0a1628]/60">OAB/RO 5077</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                {[100, 92, 96, 80, 88, 60, 94, 70].map((w, i) => (
                  <div key={i} className="h-1.5 rounded-full bg-[#0a1628]/10" style={{ width: `${w}%` }} />
                ))}
              </div>
              <div className="mt-auto border-t border-[#D4AF37] pt-2">
                <p className="bb-mono text-[7px] text-[#0a1628]/60">
                  felippepestana.com.br · Soluções Jurídicas com Legal Performance
                </p>
              </div>
            </div>
          </Reveal>

          {/* Social templates */}
          <Reveal>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">
              Templates sociais
            </p>
            <div className="flex justify-center gap-4">
              {/* IG post */}
              <div className="bb-banner flex aspect-square w-40 flex-col items-center justify-center gap-2 p-4 text-center">
                <span className="bb-banner-sweep absolute inset-0" />
                <FPMonogram size={46} />
                <p className="bb-gold-text text-xs font-semibold">Direito que performa</p>
                <p className="bb-mono text-[8px] text-[#A0AEC0]">post · 1:1</p>
              </div>
              {/* Story */}
              <div className="bb-banner flex aspect-[9/16] w-24 flex-col items-center justify-between p-3 text-center">
                <FPMonogram size={30} />
                <p className="bb-gold-text text-[10px] font-semibold leading-tight">Legal Performance</p>
                <p className="bb-mono text-[7px] text-[#A0AEC0]">story · 9:16</p>
              </div>
            </div>
          </Reveal>

          {/* App preview */}
          <Reveal>
            <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">
              <MonitorSmartphone className="h-4 w-4 text-[#D4AF37]" /> Produto / Dashboard
            </p>
            <div className="rounded-xl border border-[#A0AEC0]/20 bg-[#0a1628] p-3 shadow-2xl">
              <div className="mb-2 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#F87171]" />
                <span className="h-2 w-2 rounded-full bg-[#FBBF24]" />
                <span className="h-2 w-2 rounded-full bg-[#4ADE80]" />
              </div>
              <div className="flex gap-2">
                <div className="w-1/4 space-y-1.5">
                  <FPMonogram size={22} />
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-2 rounded bg-white/10" />
                  ))}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 rounded bg-gradient-to-r from-[#D4AF37] to-transparent" />
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 rounded bg-white/5" />
                    ))}
                  </div>
                  <div className="h-16 rounded bg-white/5" />
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-[#A0AEC0]">Dashboard FP Legal — navy, prata e acentos de ouro.</p>
          </Reveal>
        </div>

        {/* Photography placeholders inside applications */}
        <Reveal>
          <p className="mb-4 mt-12 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#A0AEC0]">
            <Camera className="h-4 w-4 text-[#D4AF37]" /> Banners com fotografia institucional
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { l: "Hero — banner institucional", r: "16:9" },
              { l: "Equipe — foto de time", r: "16:9" },
            ].map((p) => (
              <div key={p.l} className="bb-photo flex aspect-video items-center justify-center">
                <div className="relative z-10 text-center">
                  <Camera className="mx-auto mb-2 h-7 w-7 text-[#E5C667]" />
                  <p className="text-sm font-medium">{p.l}</p>
                  <p className="bb-mono mt-1 text-[10px] text-[#A0AEC0]">Fotografia institucional · {p.r}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-[#A0AEC0]">
            Reserve estes espaços para fotos reais: profissionais confiantes, ambiente sóbrio, iluminação quente com
            tons navy/dourados.
          </p>
        </Reveal>
      </Section>

      {/* ═══════════════ 9. FOTOGRAFIA ═══════════════ */}
      <Section
        id="fotografia"
        eyebrow="Direção de Imagem"
        title={<>Estilo <span className="bb-gold-text">fotográfico</span></>}
        intro="Imagens profissionais e sofisticadas. Iluminação quente, paleta navy/dourada, profissionais confiantes e ambientes que transmitem solidez e tecnologia. Composições limpas, foco no olhar e nos detalhes."
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { l: "Retrato — advogado", i: Users },
            { l: "Escritório / ambiente", i: Building2 },
            { l: "Reunião / handshake", i: Handshake },
            { l: "Detalhe — documentos", i: Briefcase },
            { l: "Tecnologia / dados", i: Cpu },
            { l: "Atendimento ao cliente", i: Scale },
          ].map((p, idx) => (
            <Reveal key={p.l} style={{ transitionDelay: `${idx * 60}ms` }}>
              <div className="bb-photo flex aspect-[4/5] items-center justify-center">
                <div className="relative z-10 text-center">
                  <p.i className="mx-auto mb-3 h-8 w-8 text-[#E5C667]" strokeWidth={1.4} />
                  <p className="text-sm font-medium">{p.l}</p>
                  <p className="bb-mono mt-1 text-[10px] text-[#A0AEC0]">Fotografia institucional</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { t: "Iluminação", d: "Quente e direcional, com sombras suaves e brilhos dourados." },
              { t: "Paleta", d: "Navy dominante, neutros frios e realces de ouro." },
              { t: "Pessoas", d: "Posturas confiantes, olhar direto, vestuário sóbrio." },
            ].map((c) => (
              <div key={c.t} className="bb-card bb-gold-edge p-6 pl-7">
                <p className="font-semibold text-[#E5C667]">{c.t}</p>
                <p className="mt-2 text-sm text-[#A0AEC0]">{c.d}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Section>

      {/* ═══════════════ 10. BANNERS ANIMADOS ═══════════════ */}
      <Section
        id="banners"
        eyebrow="Movimento"
        title={<>Banners <span className="bb-gold-text">animados</span></>}
        intro="Peças vivas para web e mídia — partículas de ouro, varreduras de brilho e gradientes em movimento com o monograma FP. O equivalente em movimento dos banners de campanha."
      >
        {/* Hero 16:9 */}
        <Reveal>
          <p className="bb-mono mb-3 text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Hero · 16:9</p>
          <div className="bb-banner bb-banner-sweep mb-8 flex aspect-video w-full items-center justify-center overflow-hidden">
            <div className="bb-banner-particles absolute inset-0">
              {Array.from({ length: 12 }).map((_, i) => (
                <i
                  key={i}
                  style={{
                    left: `${(i * 8.3) % 100}%`,
                    top: `${(i * 13) % 90}%`,
                    animationDuration: `${4 + (i % 5)}s`,
                    animationDelay: `${-(i % 6)}s`,
                  }}
                />
              ))}
            </div>
            <div className="relative z-10 text-center">
              <div className="bb-logo-glow mx-auto mb-4 inline-block">
                <FPMonogram size={92} />
              </div>
              <h3 className="text-2xl font-bold sm:text-4xl">
                <span className="bb-silver-text">Soluções Jurídicas com</span>{" "}
                <span className="bb-gold-text">Legal Performance</span>
              </h3>
              <p className="bb-mono mt-3 text-xs uppercase tracking-[0.3em] text-[#A0AEC0]">OAB/RO 5077</p>
            </div>
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Leaderboard */}
          <Reveal>
            <p className="bb-mono mb-3 text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Leaderboard · 728×90</p>
            <div className="bb-banner bb-banner-sweep flex h-24 items-center justify-between overflow-hidden px-6">
              <div className="bb-banner-particles absolute inset-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <i
                    key={i}
                    style={{
                      left: `${(i * 18) % 100}%`,
                      top: `${(i * 22) % 80}%`,
                      animationDuration: `${3 + (i % 4)}s`,
                      animationDelay: `${-(i % 5)}s`,
                    }}
                  />
                ))}
              </div>
              <div className="relative z-10 flex items-center gap-3">
                <FPMonogram size={40} />
                <span className="bb-gold-text font-semibold">FP Legal Performance</span>
              </div>
              <span className="relative z-10 rounded-full border border-[#D4AF37]/50 px-4 py-1.5 text-xs text-[#E5C667]">
                Fale agora →
              </span>
            </div>
          </Reveal>

          {/* Square */}
          <Reveal>
            <p className="bb-mono mb-3 text-xs uppercase tracking-[0.3em] text-[#D4AF37]">Square · 1:1</p>
            <div className="bb-banner bb-banner-sweep mx-auto flex aspect-square max-w-xs flex-col items-center justify-center gap-3 overflow-hidden p-6 text-center">
              <div className="bb-banner-particles absolute inset-0">
                {Array.from({ length: 8 }).map((_, i) => (
                  <i
                    key={i}
                    style={{
                      left: `${(i * 12) % 100}%`,
                      top: `${(i * 17) % 90}%`,
                      animationDuration: `${3.5 + (i % 4)}s`,
                      animationDelay: `${-(i % 5)}s`,
                    }}
                  />
                ))}
              </div>
              <div className="bb-logo-glow relative z-10 inline-block">
                <FPMonogram size={70} />
              </div>
              <p className="bb-gold-text relative z-10 text-lg font-bold">Direito que performa</p>
              <p className="bb-mono relative z-10 text-[10px] uppercase tracking-[0.25em] text-[#A0AEC0]">
                OAB/RO 5077
              </p>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ═══════════════ 11. TOM DE VOZ ═══════════════ */}
      <Section
        id="tom"
        eyebrow="Comunicação"
        title={<>Tom de <span className="bb-gold-text">voz</span></>}
        intro="Falamos como um especialista de confiança: técnico quando preciso, humano sempre. Sem juridiquês desnecessário, com foco em clareza e em resultado."
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {[
            {
              t: "Profissional, mas acessível",
              d: "Autoridade técnica sem arrogância. Traduzimos o complexo.",
              ex: "“Vamos resolver isso juntos — explico cada etapa de forma clara.”",
            },
            {
              t: "Confiante",
              d: "Firmeza baseada em preparo e dados, nunca em promessas vazias.",
              ex: "“Com base na jurisprudência atual, sua posição é sólida.”",
            },
            {
              t: "Claro e direto",
              d: "Frases objetivas, sem rodeios nem jargão desnecessário.",
              ex: "“O prazo final é dia 12. Precisamos dos documentos até dia 8.”",
            },
            {
              t: "Orientado a resultados",
              d: "Tudo aponta para o desfecho e o impacto concreto para o cliente.",
              ex: "“Nosso objetivo: reduzir o risco e acelerar a decisão a seu favor.”",
            },
          ].map((v, i) => (
            <Reveal key={v.t} style={{ transitionDelay: `${i * 70}ms` }}>
              <div className="bb-card bb-gold-edge h-full p-7 pl-8">
                <div className="mb-3 flex items-center gap-2">
                  <Check className="h-5 w-5 text-[#E5C667]" />
                  <h3 className="text-lg font-semibold">{v.t}</h3>
                </div>
                <p className="text-sm text-[#A0AEC0]">{v.d}</p>
                <p className="mt-4 border-l-2 border-[#D4AF37] pl-4 text-sm italic text-[#E8E8ED]">{v.ex}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ═══════════════ 12. FOOTER ═══════════════ */}
      <footer className="relative overflow-hidden border-t border-white/10 px-6 py-16 text-center">
        <div className="bb-geo absolute inset-0 -z-10 opacity-30" />
        <Reveal>
          <FPMonogram size={72} className="mx-auto mb-6" />
          <p className="text-xl font-semibold">FP Legal Performance</p>
          <p className="mt-2 text-[#A0AEC0]">Soluções Jurídicas com Legal Performance</p>
          <div className="bb-shimmer-line mx-auto my-6 max-w-[160px]" />
          <p className="bb-mono text-xs uppercase tracking-[0.3em] text-[#E5C667]">
            Felippe Pestana · OAB/RO 5077
          </p>
          <p className="bb-mono mt-6 text-xs text-[#A0AEC0]/60">
            © {new Date().getFullYear()} FP Legal Performance. Todos os direitos reservados. · Brandbook v1.0
          </p>
        </Reveal>
      </footer>
    </main>
  );
}
