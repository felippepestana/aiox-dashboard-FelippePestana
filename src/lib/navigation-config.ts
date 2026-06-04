// =============================================================================
// Navigation Config — APEX Legal Performance
// Externalized navigation structure with role-based filtering
// =============================================================================

import type { Role } from './roles';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BadgeKey = 'processes' | 'deadlines' | 'movements';

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: string; // lucide icon name
  badge?: BadgeKey;
  roles: Role[];
};

export type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

// ─── Main Navigation Sections ────────────────────────────────────────────────

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'processual',
    label: 'GESTÃO PROCESSUAL',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/legal',
        icon: 'Scale',
        roles: ['admin', 'advogado', 'estagiario', 'financeiro', 'marketing'],
      },
      {
        id: 'processes',
        label: 'Processos',
        href: '/legal/processes',
        icon: 'Briefcase',
        badge: 'processes',
        roles: ['admin', 'advogado', 'estagiario', 'financeiro', 'marketing'],
      },
      {
        id: 'clients',
        label: 'Clientes',
        href: '/legal/clients',
        icon: 'Users',
        roles: ['admin', 'advogado', 'estagiario', 'financeiro'],
      },
      {
        id: 'deadlines',
        label: 'Prazos',
        href: '/legal/deadlines',
        icon: 'Clock',
        badge: 'deadlines',
        roles: ['admin', 'advogado', 'estagiario', 'financeiro', 'marketing'],
      },
      {
        id: 'petitions',
        label: 'Petições',
        href: '/legal/petitions',
        icon: 'FileText',
        roles: ['admin', 'advogado', 'estagiario'],
      },
      {
        id: 'publications',
        label: 'Publicações',
        href: '/legal/publications',
        icon: 'Bell',
        badge: 'movements',
        roles: ['admin', 'advogado', 'estagiario', 'financeiro', 'marketing'],
      },
    ],
  },
  {
    id: 'financeiro',
    label: 'FINANCEIRO',
    items: [
      {
        id: 'financial',
        label: 'Visão Geral',
        href: '/legal/financial',
        icon: 'DollarSign',
        roles: ['admin', 'financeiro', 'advogado'],
      },
      {
        id: 'honorarios',
        label: 'Honorários',
        href: '/legal/honorarios',
        icon: 'Receipt',
        roles: ['admin', 'financeiro'],
      },
      {
        id: 'billing',
        label: 'Faturamento',
        href: '/legal/billing',
        icon: 'CreditCard',
        roles: ['admin', 'financeiro'],
      },
      {
        id: 'taxes',
        label: 'Tributos',
        href: '/legal/taxes',
        icon: 'Building2',
        roles: ['admin', 'financeiro'],
      },
    ],
  },
  {
    id: 'inteligencia',
    label: 'INTELIGÊNCIA & IA',
    items: [
      {
        id: 'chat',
        label: 'Chat Jurídico',
        href: '/legal/chat',
        icon: 'MessageSquare',
        roles: ['admin', 'advogado', 'estagiario', 'financeiro', 'marketing'],
      },
      {
        id: 'analyze',
        label: 'Análise de Documentos',
        href: '/legal/analyze',
        icon: 'FileSearch',
        roles: ['admin', 'advogado', 'estagiario'],
      },
      {
        id: 'generator',
        label: 'Gerador de Peças',
        href: '/legal/generator',
        icon: 'Wand2',
        roles: ['admin', 'advogado'],
      },
      {
        id: 'precedents',
        label: 'Precedentes & Jurimetria',
        href: '/legal/precedents',
        icon: 'BookOpen',
        roles: ['admin', 'advogado'],
      },
      {
        id: 'judges',
        label: 'Perfil de Magistrados',
        href: '/legal/judges',
        icon: 'User',
        roles: ['admin', 'advogado'],
      },
    ],
  },
  {
    id: 'estrategia',
    label: 'ESTRATÉGIA & CRESCIMENTO',
    items: [
      {
        id: 'strategy',
        label: 'Painel Estratégico',
        href: '/legal/strategy',
        icon: 'Target',
        roles: ['admin', 'advogado'],
      },
      {
        id: 'canvas',
        label: 'Legal Canvas',
        href: '/legal/canvas',
        icon: 'LayoutDashboard',
        roles: ['admin'],
      },
      {
        id: 'bi',
        label: 'KPIs & BI',
        href: '/legal/bi',
        icon: 'BarChart3',
        roles: ['admin', 'advogado'],
      },
      {
        id: 'marketing',
        label: 'Marketing & Leads',
        href: '/legal/marketing',
        icon: 'Megaphone',
        roles: ['admin', 'marketing'],
      },
      {
        id: 'content',
        label: 'Conteúdo',
        href: '/legal/content',
        icon: 'Sparkles',
        roles: ['admin', 'marketing'],
      },
    ],
  },
  {
    id: 'comunicacao',
    label: 'COMUNICAÇÃO',
    items: [
      {
        id: 'whatsapp',
        label: 'WhatsApp',
        href: '/legal/whatsapp',
        icon: 'MessageCircle',
        roles: ['admin', 'advogado', 'estagiario', 'financeiro', 'marketing'],
      },
      {
        id: 'interview',
        label: 'Entrevistas',
        href: '/legal/interview',
        icon: 'Mic',
        roles: ['admin', 'advogado'],
      },
    ],
  },
];

// ─── Footer / Settings Nav ────────────────────────────────────────────────────

export const FOOTER_NAV: NavItem[] = [
  {
    id: 'settings',
    label: 'Configurações',
    href: '/legal/settings',
    icon: 'Settings',
    roles: ['admin', 'advogado', 'estagiario', 'financeiro', 'marketing'],
  },
  {
    id: 'audit',
    label: 'Segurança & LGPD',
    href: '/legal/audit',
    icon: 'ShieldCheck',
    roles: ['admin', 'advogado', 'estagiario', 'financeiro', 'marketing'],
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    href: '/legal/marketplace',
    icon: 'Store',
    roles: ['admin', 'advogado', 'estagiario', 'financeiro', 'marketing'],
  },
];

// ─── Role Helpers ─────────────────────────────────────────────────────────────

/**
 * Filter the full NAV_SECTIONS by role, removing items and empty sections.
 */
export function getNavForRole(role: Role): NavSection[] {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  })).filter((section) => section.items.length > 0);
}

/**
 * Return every page item (nav + footer) for use in command palette.
 */
export function getAllPages(): NavItem[] {
  const all: NavItem[] = [];
  for (const section of NAV_SECTIONS) {
    all.push(...section.items);
  }
  all.push(...FOOTER_NAV);
  return all;
}

// ─── Route Labels (for breadcrumbs) ──────────────────────────────────────────

export const ROUTE_LABELS: Record<string, string> = {
  '/legal': 'Dashboard',
  '/legal/processes': 'Processos',
  '/legal/processes/new': 'Novo Processo',
  '/legal/clients': 'Clientes',
  '/legal/clients/new': 'Novo Cliente',
  '/legal/deadlines': 'Prazos',
  '/legal/deadlines/new': 'Novo Prazo',
  '/legal/petitions': 'Petições',
  '/legal/petitions/new': 'Nova Petição',
  '/legal/publications': 'Publicações',
  '/legal/financial': 'Visão Geral Financeira',
  '/legal/honorarios': 'Honorários',
  '/legal/billing': 'Faturamento',
  '/legal/taxes': 'Tributos',
  '/legal/chat': 'Chat Jurídico',
  '/legal/analyze': 'Análise de Documentos',
  '/legal/generator': 'Gerador de Peças',
  '/legal/precedents': 'Precedentes & Jurimetria',
  '/legal/judges': 'Perfil de Magistrados',
  '/legal/strategy': 'Painel Estratégico',
  '/legal/canvas': 'Legal Canvas',
  '/legal/bi': 'KPIs & BI',
  '/legal/marketing': 'Marketing & Leads',
  '/legal/content': 'Conteúdo',
  '/legal/whatsapp': 'WhatsApp',
  '/legal/interview': 'Entrevistas',
  '/legal/settings': 'Configurações',
  '/legal/audit': 'Segurança & LGPD',
  '/legal/marketplace': 'Marketplace',
  // Legacy / additional routes still in use
  '/legal/upload': 'Upload de Documentos',
  '/legal/assets': 'Busca de Ativos',
  '/legal/calculator': 'Calculadora',
  '/legal/flowcharts': 'Fluxogramas',
  '/legal/jurimetria': 'Jurimetria',
  '/legal/kpis': 'KPIs',
  '/legal/leads': 'Pipeline de Leads',
};
