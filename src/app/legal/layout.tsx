'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLegalStore } from '@/stores/legal-store';
import { useLegalFinancialStore } from '@/stores/legal-financial-store';
import { useLegalMarketingStore } from '@/stores/legal-marketing-store';
import { useLegalStrategyStore } from '@/stores/legal-strategy-store';
import { useDeadlineAlerts } from '@/hooks/useDeadlineAlerts';
import { useHydration } from '@/hooks/useHydration';
import { createBrowserClient } from '@/lib/supabase';
import { DeadlineAlerts } from '@/components/legal/DeadlineAlerts';
import { DeadlineToast } from '@/components/legal/DeadlineToast';
import { NotificationToast } from '@/components/legal/NotificationToast';
import { MobileBottomNav } from '@/components/legal/MobileBottomNav';
import { PWAInstallPrompt } from '@/components/legal/PWAInstallPrompt';
import { OfflineIndicator } from '@/components/legal/OfflineIndicator';
import { CommandPalette } from '@/components/legal/CommandPalette';
import OnboardingWizard from '@/components/legal/OnboardingWizard';
import { useOnboarding } from '@/hooks/useOnboarding';
import { getNavForRole, FOOTER_NAV } from '@/lib/navigation-config';
import { useUserRole } from '@/lib/roles';
import { ThemeToggle } from '@/components/ThemeToggle';
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
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  Mic,
  BookOpen,
  User,
  Store,
  FileSearch,
  MessageCircle,
  Wand2,
  MessageSquare,
  Menu,
  X,
  LogOut,
  ShieldCheck,
  Settings,
  ChevronDown,
  ChevronUp,
  Search,
} from 'lucide-react';

// ─── Icon Map ─────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
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
  Sparkles,
  Mic,
  BookOpen,
  User,
  Store,
  FileSearch,
  MessageCircle,
  Wand2,
  MessageSquare,
  ShieldCheck,
  Settings,
  Search,
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICON_MAP[name] ?? Scale;
  return <Icon className={className} />;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [footerOpen, setFooterOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const pathname = usePathname();
  const otherHydrated = useRef(false);

  const { shouldShow, markCompleted } = useOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  const role = useUserRole();
  const navSections = getNavForRole(role);

  // Legal store hydration — returns syncing state for the indicator
  const { syncing: legalSyncing } = useHydration();

  const hydrateFinancialFromApi = useLegalFinancialStore((s) => s.hydrateFromApi);
  const hydrateMarketingFromApi = useLegalMarketingStore((s) => s.hydrateFromApi);
  const hydrateStrategyFromApi = useLegalStrategyStore((s) => s.hydrateFromApi);

  const pendingDeadlines = useLegalStore((s) => s.deadlines.filter((d) => d.status === 'pending').length);
  const unreadMovements = useLegalStore((s) => s.movements.filter((m) => !m.isRead).length);
  const activeProcesses = useLegalStore((s) => s.processes.filter((p) => p.status === 'active').length);

  const { counts: alertCounts } = useDeadlineAlerts();

  useEffect(() => {
    setMounted(true);
    setShowOnboarding(shouldShow);
    if (!otherHydrated.current) {
      otherHydrated.current = true;
      hydrateFinancialFromApi();
      hydrateMarketingFromApi();
      hydrateStrategyFromApi();
    }

    // Fetch the authenticated user's ID for realtime notifications
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [hydrateFinancialFromApi, hydrateMarketingFromApi, hydrateStrategyFromApi, shouldShow]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = useCallback(
    (href: string) => {
      if (href === '/legal') return pathname === '/legal';
      return pathname.startsWith(href);
    },
    [pathname]
  );

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

  const showLabel = !collapsed || mobileOpen;

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-[#1a2d52]/60 px-4">
        {collapsed && !mobileOpen ? (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#C0C0C0] to-[#718096] shadow-lg shadow-[#C0C0C0]/10">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="APEX">
              <defs>
                <linearGradient id="apex-logo-sm" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E8E8ED" />
                  <stop offset="45%" stopColor="#C0C0C0" />
                  <stop offset="75%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#B8941F" />
                </linearGradient>
              </defs>
              <path d="M12 2L22 20H2L12 2Z" fill="url(#apex-logo-sm)" />
              <rect x="7" y="13.5" width="10" height="2" rx="1" fill="#0a1628" />
            </svg>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#C0C0C0] to-[#718096] shadow-lg shadow-[#C0C0C0]/15">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="APEX">
                  <defs>
                    <linearGradient id="apex-logo-md" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#E8E8ED" />
                      <stop offset="45%" stopColor="#C0C0C0" />
                      <stop offset="75%" stopColor="#D4AF37" />
                      <stop offset="100%" stopColor="#B8941F" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2L22 20H2L12 2Z" fill="url(#apex-logo-md)" />
                  <rect x="7" y="13.5" width="10" height="2" rx="1" fill="#0a1628" />
                </svg>
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white tracking-wide">APEX</h1>
                <p className="text-[9px] text-[#A0AEC0] tracking-widest uppercase leading-tight">SOLUÇÃO JURÍDICA TECNOLÓGICA DE ALTA PERFORMANCE</p>
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
        {navSections.map((section) => (
          <div key={section.id} className="mb-4">
            {showLabel && (
              <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#2D3748]">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const badge = getBadgeCount(item.badge);
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                        active
                          ? 'bg-[#C0C0C0]/10 text-[#C0C0C0] border border-[#C0C0C0]/20'
                          : 'text-[#4A5568] hover:bg-[#0d1f3c] hover:text-[#A0AEC0] border border-transparent'
                      } ${!showLabel ? 'justify-center px-2' : ''}`}
                      title={!showLabel ? item.label : undefined}
                    >
                      <NavIcon
                        name={item.icon}
                        className={`h-4 w-4 flex-shrink-0 ${active ? 'text-[#C0C0C0]' : ''}`}
                      />
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
      {showLabel && (
        <div className="px-3 pb-2">
          <DeadlineAlerts previewCount={4} />
        </div>
      )}

      {/* Sidebar Footer */}
      <div className="border-t border-[#1a2d52]/60">
        {/* Gear / Config section */}
        {showLabel ? (
          <>
            <button
              onClick={() => setFooterOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-2.5 text-[#4A5568] hover:text-[#A0AEC0] transition-colors"
              aria-expanded={footerOpen}
              aria-label="Configurações"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-3.5 w-3.5" />
                <span className="text-[11px]">Configurações</span>
                {legalSyncing && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-[#C0C0C0] animate-pulse"
                    title="Sincronizando dados..."
                    aria-label="Sincronizando"
                  />
                )}
              </div>
              {footerOpen ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </button>

            {footerOpen && (
              <ul className="pb-1 px-2 space-y-0.5">
                {FOOTER_NAV.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                          active
                            ? 'bg-[#C0C0C0]/10 text-[#C0C0C0]'
                            : 'text-[#4A5568] hover:bg-[#0d1f3c] hover:text-[#A0AEC0]'
                        }`}
                      >
                        <NavIcon name={item.icon} className="h-3.5 w-3.5 flex-shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="px-4 pb-3 pt-1 space-y-2">
              {/* Cmd+K hint */}
              <button
                onClick={() => {
                  window.dispatchEvent(
                    new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
                  );
                }}
                className="flex w-full items-center gap-2 rounded-md border border-[#1a2d52]/60 bg-[#060d1a]/60 px-2.5 py-1.5 text-[10px] text-[#2D3748] hover:text-[#4A5568] transition-colors"
                aria-label="Abrir busca rápida"
              >
                <Search className="h-3 w-3 flex-shrink-0" />
                <span className="flex-1 text-left">⌘K para busca rápida</span>
              </button>

              <div className="flex items-center justify-between">
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' });
                    window.location.href = '/login';
                  }}
                  className="flex items-center gap-2 text-[11px] text-[#4A5568] hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Sair</span>
                </button>
                <ThemeToggle />
              </div>
            </div>
          </>
        ) : (
          /* Collapsed state: show gear icon + theme toggle */
          <div className="flex flex-col items-center py-2 gap-1">
            <button
              onClick={() => setCollapsed(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#4A5568] hover:text-white hover:bg-[#0d1f3c] transition-colors"
              title="Configurações"
              aria-label="Abrir configurações"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
            <ThemeToggle />
          </div>
        )}

        {/* Collapse Toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex h-10 w-full items-center justify-center border-t border-[#1a2d52]/60 text-[#4A5568] hover:text-white hover:bg-[#0d1f3c] transition-colors"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#060d1a] text-white overflow-hidden">
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-[#1a2d52]/60 bg-[#0a1628] px-4 lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="text-[#4A5568] hover:text-white" aria-label="Abrir menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-[#C0C0C0] to-[#718096]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="APEX">
              <path d="M12 2L22 20H2L12 2Z" fill="#0a1628" />
              <rect x="7" y="13.5" width="10" height="2" rx="1" fill="#0a1628" opacity="0.5" />
            </svg>
          </span>
          <span className="text-sm font-semibold text-white">APEX</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <ThemeToggle />
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

      {/* Supabase realtime notifications */}
      <NotificationToast userId={userId} />

      {/* Mobile bottom navigation */}
      <MobileBottomNav onOpenSidebar={() => setMobileOpen(true)} />

      {/* PWA install prompt */}
      <PWAInstallPrompt />

      {/* Offline indicator */}
      <OfflineIndicator />

      {/* Global Command Palette */}
      <CommandPalette />

      {/* Onboarding Wizard — shown once for first-time users */}
      {showOnboarding && (
        <OnboardingWizard
          onComplete={() => {
            markCompleted();
            setShowOnboarding(false);
          }}
          onSkip={() => {
            markCompleted();
            setShowOnboarding(false);
          }}
        />
      )}
    </div>
  );
}
