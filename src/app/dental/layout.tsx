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
  Settings,
  ChevronLeft,
  ChevronRight,
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
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  const isActive = useCallback((href: string) => {
    if (href === '/dental') return pathname === '/dental';
    return pathname.startsWith(href);
  }, [pathname]);

  if (!mounted) {
    return (
      <div className="flex h-screen bg-[#0a0f1a] text-white">
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0a0f1a] text-white overflow-hidden">
      {/* Dental Sidebar */}
      <aside
        className={`flex flex-col border-r border-[#1a2332] bg-[#0d1320] transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center border-b border-[#1a2332] px-4">
          {collapsed ? (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700">
              <span className="text-sm font-bold text-white">S</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/20">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white tracking-wide">SBARZI</h1>
                <p className="text-[10px] text-[#D4A76A] tracking-widest">ODONTOLOGIA & SAÚDE</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin scrollbar-thumb-[#1a2332]">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-4">
              {!collapsed && (
                <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#4a5568]">
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
                        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                          active
                            ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                            : 'text-[#8899aa] hover:bg-[#1a2332] hover:text-white border border-transparent'
                        } ${collapsed ? 'justify-center px-2' : ''}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-teal-400' : ''}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {active && (
                          <span className="absolute left-0 h-6 w-0.5 rounded-r bg-teal-400" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Clinic Info Footer */}
        {!collapsed && (
          <div className="border-t border-[#1a2332] p-4 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-[#6b7a8d]">
              <MapPin className="h-3 w-3" />
              <span>Porto Velho - RO</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#6b7a8d]">
              <Phone className="h-3 w-3" />
              <span>(69) 99324-8325</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <a href="https://instagram.com/sbarzi_odontologia" target="_blank" rel="noopener noreferrer"
                className="text-[#6b7a8d] hover:text-pink-400 transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://facebook.com/SbarziOdonto" target="_blank" rel="noopener noreferrer"
                className="text-[#6b7a8d] hover:text-blue-400 transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-10 items-center justify-center border-t border-[#1a2332] text-[#6b7a8d] hover:text-white hover:bg-[#1a2332] transition-colors"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
