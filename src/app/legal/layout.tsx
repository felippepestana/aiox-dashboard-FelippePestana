'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Phone,
  Gavel,
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
} from 'lucide-react';

const NAV_SECTIONS = [
  {
    title: 'Operacional',
    items: [
      { id: 'dashboard', label: 'Painel Jurídico', icon: Scale, href: '/legal' },
      { id: 'processes', label: 'Processos', icon: Briefcase, href: '/legal/processes' },
      { id: 'clients', label: 'Clientes', icon: Users, href: '/legal/clients' },
      { id: 'deadlines', label: 'Prazos', icon: Clock, href: '/legal/deadlines' },
      { id: 'petitions', label: 'Peças', icon: FileText, href: '/legal/petitions' },
      { id: 'publications', label: 'Publicações', icon: Bell, href: '/legal/publications' },
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
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  const isActive = useCallback((href: string) => {
    if (href === '/legal') return pathname === '/legal';
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
      {/* Legal Sidebar */}
      <aside
        className={`flex flex-col border-r border-[#1a2332] bg-[#0d1320] transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center border-b border-[#1a2332] px-4">
          {collapsed ? (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700">
              <Gavel className="h-4 w-4 text-white" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 shadow-lg shadow-amber-500/20">
                <Gavel className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white tracking-wide">AIOX LEGAL</h1>
                <p className="text-[10px] text-amber-400 tracking-widest">ADVOCACIA INTELIGENTE</p>
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
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'text-[#8899aa] hover:bg-[#1a2332] hover:text-white border border-transparent'
                        } ${collapsed ? 'justify-center px-2' : ''}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <Icon className={`h-4 w-4 flex-shrink-0 ${active ? 'text-amber-400' : ''}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Firm Info Footer */}
        {!collapsed && (
          <div className="border-t border-[#1a2332] p-4 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-[#6b7a8d]">
              <Scale className="h-3 w-3" />
              <span>Plataforma Full-Service</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#6b7a8d]">
              <MapPin className="h-3 w-3" />
              <span>Advocacia Privada</span>
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
