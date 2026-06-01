'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLegalStore } from '@/stores/legal-store';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import { useLegalMarketingStore } from '@/stores/legal-marketing-store';
import { useLegalStrategyStore } from '@/stores/legal-strategy-store';
import { useDeadlineAlerts } from '@/hooks/useDeadlineAlerts';
import { DeadlineAlerts } from '@/components/legal/DeadlineAlerts';
import { DeadlineToast } from '@/components/legal/DeadlineToast';
import { MobileBottomNav } from '@/components/legal/MobileBottomNav';
import { PWAInstallPrompt } from '@/components/legal/PWAInstallPrompt';
import { OfflineIndicator } from '@/components/legal/OfflineIndicator';
import {
  Scale,
  Briefcase,
  Users,
  Clock,
  FileText,
  Bell,
  DollarSign,
  Receipt,
  CreditCard,
  Building2,
  Target,
  LayoutDashboard,
  BarChart3,
  Megaphone,
  TrendingUp,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  MapPin,
  Mic,
  Search,
  Upload,
  BookOpen,
  User,
  Calculator,
  Store,
  FileSearch,
  LineChart,
  MessageCircle,
  Wand2,
  PieChart,
  GitBranch,
  MessageSquare,
  Menu,
  X,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'Operacional',
    items: [
      { id: 'dashboard', label: 'Painel Jurídico', icon: Scale, href: '/legal' },
      { id: 'processes', label: 'Processos', icon: Briefcase, href: '/legal/processes', badge: 'processes' },
      { id: 'clients', label: 'Clientes', icon: Users, href: '/legal/clients' },
      { id: 'deadlines', label: 'Prazos', icon: Clock, href: '/legal/deadlines', badge: 'deadlines' },
      { id: 'petitions', label: 'Peças', icon: FileText, href: '/legal/petitions' },
      { id: 'publications', label: 'Publicações', icon: Bell, href: '/legal/publications', badge: 'movements' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { id: 'financial', label: 'Dashboard Financeiro', icon: DollarSign, href: '/legal/financial' },
      { id: 'honorarios', label: 'Honorários', icon: Receipt, href: '/legal/honorarios' },
      { id: 'billing', label: 'Faturamento', icon: CreditCard, href: '/legal/billing' },
      { id: 'taxes', label: 'Impostos', icon: Building2, href: '/legal/taxes' },
    ],
  },
  {
    title: 'Estratégia',
    items: [
      { id: 'strategy', label: 'Painel Estratégico', icon: Target, href: '/legal/strategy' },
      { id: 'canvas', label: 'Legal Canvas', icon: LayoutDashboard, href: '/legal/canvas' },
      { id: 'kpis', label: 'KPIs', icon: BarChart3, href: '/legal/kpis' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { id: 'marketing', label: 'Marketing Jurídico', icon: Megaphone, href: '/legal/marketing' },
      { id: 'leads', label: 'Pipeline de Leads', icon: TrendingUp, href: '/legal/leads' },
      { id: 'content-legal', label: 'Conteúdo', icon: Sparkles, href: '/legal/content' },
    ],
  },
  {
    title: 'Assistente IA',
    items: [
      { id: 'interview', label: 'Entrevista', icon: Mic, href: '/legal/interview' },
      { id: 'upload', label: 'Upload Docs', icon: Upload, href: '/legal/upload' },
      { id: 'assets', label: 'Busca de Ativos', icon: Search, href: '/legal/assets' },
    ],
  },
  {
    title: 'Inteligência',
    items: [
      { id: 'precedents', label: 'Precedentes', icon: BookOpen, href: '/legal/precedents' },
      { id: 'judges', label: 'Magistrados', icon: User, href: '/legal/judges' },
    ],
  },
  {
    title: 'Produtividade',
    items: [
      { id: 'generator', label: 'Gerar Petição', icon: Wand2, href: '/legal/generator' },
      { id: 'jurimetria', label: 'Jurimetria', icon: PieChart, href: '/legal/jurimetria' },
      { id: 'flowcharts', label: 'Fluxogramas', icon: GitBranch, href: '/legal/flowcharts' },
      { id: 'chat', label: 'Chat Jurídico', icon: MessageSquare, href: '/legal/chat' },
      { id: 'calculator', label: 'Calculadora', icon: Calculator, href: '/legal/calculator' },
      { id: 'marketplace', label: 'Marketplace', icon: Store, href: '/legal/marketplace' },
    ],
  },
  {
    title: 'Avançado',
    items: [
      { id: 'analyze', label: 'Análise de Docs', icon: FileSearch, href: '/legal/analyze' },
      { id: 'bi', label: 'Business Intel.', icon: LineChart, href: '/legal/bi' },
      { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, href: '/legal/whatsapp' },
    ],
  },
  {
    title: 'Segurança & LGPD',
    items: [
      { id: 'audit', label: 'Log de Auditoria', icon: ShieldCheck, href: '/legal/audit' },
    ],
  },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const hydrated = useRef(false);

  const hydrateFromApi = useLegalStore((s) => s.hydrateFromApi);
  const hydrateFinancialFromApi = useLegalFinancialStore((s) => s.hydrateFromApi);
  const hydrateMarketingFromApi = useLegalMarketingStore((s) => s.hydrateFromApi);
  const hydrateStrategyFromApi = useLegalStrategyStore((s) => s.hydrateFromApi);

  const pendingDeadlines = useLegalStore((s) => s.deadlines.filter((d) => d.status === 'pending').length);
  const unreadMovements = useLegalStore((s) => s.movements.filter((m) => !m.isRead).length);
  const activeProcesses = useLegalStore((s) => s.processes.filter((p) => p.status === 'active').length);

  // Alert counts for bell badge (overdue + today only)
  const { counts: alertCounts } = useDeadlineAlerts();

  useEffect(() => {
    setMounted(true);
    if (!hydrated.current) {
      hydrated.current = true;
      hydrateFromApi();
      hydrateFinancialFromApi();
      hydrateMarketingFromApi();
      hydrateStrategyFromApi();
    }
  }, [hydrateFromApi, hydrateFinancialFromApi, hydrateMarketingFromApi, hydrateStrategyFromApi]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = useCallback((href: string) => {
    if (href === '/legal') return pathname === '/legal';
    return pathname.startsWith(href);
  }, [pathname]);

  function getBadgeCount(badge?: string): number {
    if (badge === 'deadlines') return pendingDeadlines;
    if (badge === 'movements') return unreadMovements;
    if (badge === 'processes') return activeProcesses;
    return 0;
  }

  if (!mounted) {
    return (
      <div className="flex h-screen bg-[#060d1a] text-white">
        <div className="flex-1" />
      </div>
    );
  }

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-[#1a2d52]/60 px-4">
        {collapsed && !mobileOpen ? (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#C0C0C0] to-[#718096] shadow-lg shadow-[#C0C0C0]/10">
            <span className="text-[11px] font-black text-[#0a1628] tracking-tight">FP</span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#C0C0C0] to-[#718096] shadow-lg shadow-[#C0C0C0]/15">
                <span className="text-[13px] font-black text-[#0a1628] tracking-tight">FP</span>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white tracking-wide">FP LEGAL</h1>
                <p className="text-[9px] text-[#A0AEC0] tracking-widest uppercase leading-tight">SOLUÇÕES JURÍDICAS COM LEGAL PERFORMANCE</p>
              </div>
            </div>
            {mobileOpen && (
              <button onClick={() => setMobileOpen(false)} className="lg:hidden text-[#4A5568] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-[#1a2d52]">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            {(!collapsed || mobileOpen) && (
              <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#2D3748]">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const badge = getBadgeCount((item as { badge?: string }).badge);
                const showLabel = !collapsed || mobileOpen;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                        active
                          ? 'bg-[#C0C0C0]/10 text-[#C0C0C0] border border-[#C0C0C0]/20'
                          : 'text-[#4A5568] hover:bg-[#0d1f3c] hover:text-[#A0AEC0] border border-transparent'
                      } ${!showLabel ? 'justify-center px-2' : ''}`}
                      title={!showLabel ? item.label : undefined}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-[#C0C0C0]' : ''}`} />
                      {showLabel && <span className="truncate flex-1">{item.label}</span>}
                      {showLabel && badge > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#C0C0C0]/15 text-[#C0C0C0] text-[10px] font-bold px-1">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                      {!showLabel && badge > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#C0C0C0]" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Deadline Alerts Panel (sidebar, expanded only) */}
      {(!collapsed || mobileOpen) && (
        <div className="px-3 pb-2">
          <DeadlineAlerts previewCount={4} />
        </div>
      )}

      {/* Footer */}
      {(!collapsed || mobileOpen) && (
        <div className="border-t border-[#1a2d52]/60 p-4 space-y-2">
          <div className="text-[9px] text-[#2D3748] text-center tracking-widest uppercase pb-1">
            OAB/RO 5077
          </div>
          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="flex items-center gap-2 text-[11px] text-[#4A5568] hover:text-red-400 transition-colors w-full"
          >
            <LogOut className="h-3 w-3" />
            <span>Sair</span>
          </button>
        </div>
      )}

      {/* Collapse Toggle (desktop only) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex h-10 items-center justify-center border-t border-[#1a2d52]/60 text-[#4A5568] hover:text-white hover:bg-[#0d1f3c] transition-colors"
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
      </button>
    </>
  );

  return (
    <div className="flex h-screen bg-[#060d1a] text-white overflow-hidden">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-[#1a2d52]/60 bg-[#0a1628] px-4 lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="text-[#4A5568] hover:text-white">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[#C0C0C0] to-[#718096] text-[10px] font-black text-[#0a1628]">FP</span>
          <span className="text-sm font-semibold text-white">FP LEGAL</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Alert bell button */}
          <button
            onClick={() => setAlertsOpen((v) => !v)}
            className="relative text-[#4A5568] hover:text-white transition-colors"
            aria-label="Alertas de prazos"
          >
            <Bell className="h-4 w-4" />
            {alertCounts.total > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white leading-none">
                {alertCounts.total > 9 ? '9+' : alertCounts.total}
              </span>
            )}
          </button>
          {unreadMovements > 0 && (
            <Link href="/legal/publications" className="relative">
              <Bell className="h-4 w-4 text-[#4A5568]" />
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#C0C0C0]" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Alerts Flyout */}
      {alertsOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setAlertsOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute top-14 right-0 w-80 max-h-[calc(100vh-56px)] overflow-y-auto bg-[#0a1628] border-l border-b border-[#1a2d52]/60 p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <DeadlineAlerts />
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-72 h-full bg-[#0a1628] border-r border-[#1a2d52]/60 overflow-y-auto">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-[#1a2d52]/60 bg-[#0a1628] transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-14 pb-16 lg:pt-0 lg:pb-0 bg-[#060d1a]">
        {children}
      </main>

      {/* Session toast for critical deadlines */}
      <DeadlineToast />

      {/* Mobile bottom navigation */}
      <MobileBottomNav onOpenSidebar={() => setMobileOpen(true)} />

      {/* PWA install prompt */}
      <PWAInstallPrompt />

      {/* Offline indicator */}
      <OfflineIndicator />
    </div>
  );
}
