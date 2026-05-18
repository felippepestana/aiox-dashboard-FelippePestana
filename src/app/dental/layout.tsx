'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Mic,
  Stethoscope,
  Calendar,
  FileText,
  DollarSign,
  Megaphone,
  Users,
  BarChart3,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Target,
  PanelLeftClose,
  PanelLeftOpen,
  Activity,
  Image as ImageIcon,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Menu,
  X,
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'Clínico',
    items: [
      { id: 'clinical', label: 'Painel Clínico', icon: Stethoscope, href: '/dental' },
      { id: 'voice', label: 'Comando de Voz', icon: Mic, href: '/dental/voice' },
      { id: 'patients', label: 'Pacientes', icon: Users, href: '/dental/patients' },
      { id: 'treatments', label: 'Tratamentos', icon: ClipboardList, href: '/dental/treatments' },
      { id: 'exams', label: 'Exames', icon: ImageIcon, href: '/dental/exams' },
      { id: 'calendar', label: 'Agenda', icon: Calendar, href: '/dental/calendar' },
    ],
  },
  {
    title: 'Financeiro',
    items: [
      { id: 'financial', label: 'Dashboard Financeiro', icon: DollarSign, href: '/dental/financial' },
      { id: 'invoices', label: 'Faturamento', icon: FileText, href: '/dental/invoices' },
      { id: 'expenses', label: 'Despesas', icon: BarChart3, href: '/dental/expenses' },
      { id: 'strategic', label: 'Planejamento', icon: Target, href: '/dental/strategic' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { id: 'marketing', label: 'Dashboard Marketing', icon: Megaphone, href: '/dental/marketing' },
      { id: 'campaigns', label: 'Campanhas', icon: TrendingUp, href: '/dental/campaigns' },
      { id: 'content', label: 'Conteúdo', icon: Sparkles, href: '/dental/content' },
      { id: 'automation', label: 'Automação', icon: Activity, href: '/dental/automation' },
    ],
  },
];

export default function DentalLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = useCallback((href: string) => {
    if (href === '/dental') return pathname === '/dental';
    return pathname.startsWith(href);
  }, [pathname]);

  if (!mounted) {
    return (
      <div className="flex h-screen bg-[#F5F5F7] text-[#1D1D1F]">
        <div className="flex-1" />
      </div>
    );
  }

  const sidebarContent = (mobile: boolean) => (
    <>
      {/* Brand Header */}
      <div className="flex h-16 items-center border-b border-[#E8E8ED] px-4 shrink-0">
        {collapsed && !mobile ? (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#C4956A] to-[#A0784C]">
            <span className="text-sm font-bold text-white">S</span>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#C4956A] to-[#A0784C] shadow-lg shadow-[#C4956A]/20">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-[#1D1D1F] tracking-wide">SBARZI</h1>
                <p className="text-[10px] text-[#D4A76A] tracking-widest">ODONTOLOGIA & SAÚDE</p>
              </div>
            </div>
            {mobile && (
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F0F0F2] transition-colors">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-[#D1D1D6]">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            {(mobile || !collapsed) && (
              <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#AEAEB2]">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => mobile && setMobileOpen(false)}
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                        active
                          ? 'bg-[#C4956A]/10 text-[#C4956A] border border-[#C4956A]/20'
                          : 'text-[#6E6E73] hover:bg-[#F0F0F2] hover:text-[#1D1D1F] border border-transparent'
                      } ${!mobile && collapsed ? 'justify-center px-2' : ''}`}
                      title={!mobile && collapsed ? item.label : undefined}
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-[#C4956A]' : ''}`} />
                      {(mobile || !collapsed) && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Clinic Info Footer */}
      {(mobile || !collapsed) && (
        <div className="border-t border-[#E8E8ED] p-4 space-y-2 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-[#86868B]">
            <MapPin className="h-3 w-3" />
            <span>Porto Velho - RO</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#86868B]">
            <Phone className="h-3 w-3" />
            <span>(69) 99324-8325</span>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <a href="https://instagram.com/sbarzi_odontologia" target="_blank" rel="noopener noreferrer"
              className="text-[#86868B] hover:text-pink-500 transition-colors">
              <Instagram className="h-4 w-4" />
            </a>
            <a href="https://facebook.com/SbarziOdonto" target="_blank" rel="noopener noreferrer"
              className="text-[#86868B] hover:text-blue-500 transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="flex h-screen bg-[#F5F5F7] text-[#1D1D1F] overflow-hidden">
      {/* Mobile Top Bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex lg:hidden h-14 items-center justify-between border-b border-[#E8E8ED] bg-white/80 backdrop-blur-lg px-4">
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F0F0F2] transition-colors">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-[#C4956A] to-[#A0784C]">
            <Stethoscope className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-[#1D1D1F]">SBARZI</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        </div>
      )}

      {/* Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent(true)}
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-[#E8E8ED] bg-[#FAFAFA] transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {sidebarContent(false)}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-10 items-center justify-center border-t border-[#E8E8ED] text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F0F0F2] transition-colors shrink-0"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
