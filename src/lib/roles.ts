'use client';

// =============================================================================
// Role System — APEX Legal Performance
// Role definitions, configs, and access-control helpers
// =============================================================================

import { useState, useEffect } from 'react';
import { getAllPages } from './navigation-config';

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = 'admin' | 'advogado' | 'estagiario' | 'financeiro' | 'marketing';

export type RoleConfig = {
  role: Role;
  label: string;
  description: string;
  color: string; // tailwind color class or hex
};

// ─── Role Configs ─────────────────────────────────────────────────────────────

export const ROLE_CONFIGS: RoleConfig[] = [
  {
    role: 'admin',
    label: 'Administrador',
    description: 'Acesso completo a todos os módulos e configurações.',
    color: '#D4AF37',
  },
  {
    role: 'advogado',
    label: 'Advogado',
    description: 'Acesso a módulos processuais, IA e estratégia.',
    color: '#C0C0C0',
  },
  {
    role: 'estagiario',
    label: 'Estagiário',
    description: 'Acesso limitado a processos, prazos e petições.',
    color: '#718096',
  },
  {
    role: 'financeiro',
    label: 'Financeiro',
    description: 'Acesso a módulos financeiros e relatórios.',
    color: '#68D391',
  },
  {
    role: 'marketing',
    label: 'Marketing',
    description: 'Acesso a marketing, conteúdo e leads.',
    color: '#F6AD55',
  },
];

// ─── Hook: useUserRole ────────────────────────────────────────────────────────

const STORAGE_KEY = 'apex_user_role';

/**
 * Returns the current user's role.
 * Reads from localStorage if set; defaults to 'admin'.
 * For future auth integration: replace this with a real session reader.
 */
export function useUserRole(): Role {
  const [role, setRole] = useState<Role>('admin');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Role | null;
      if (stored && ROLE_CONFIGS.some((c) => c.role === stored)) {
        setRole(stored);
      }
    } catch {
      // localStorage not available (SSR / private mode)
    }
  }, []);

  return role;
}

/**
 * Persist a role to localStorage (dev/demo helper).
 */
export function setStoredRole(role: Role): void {
  try {
    localStorage.setItem(STORAGE_KEY, role);
  } catch {
    // noop
  }
}

// ─── Access Control Helpers ───────────────────────────────────────────────────

/**
 * Check whether `role` has access to a navigation item/section by its id.
 * Searches all nav sections (main + footer).
 */
export function hasPermission(role: Role, itemId: string): boolean {
  const all = getAllPages();
  const item = all.find((i) => i.id === itemId);
  if (!item) return false;
  return item.roles.includes(role);
}

/**
 * Check whether `role` can access a given href.
 */
export function canAccess(role: Role, href: string): boolean {
  const all = getAllPages();
  const item = all.find((i) => i.href === href);
  if (!item) {
    // Unknown route — allow by default (e.g., sub-routes like /legal/processes/:id)
    return true;
  }
  return item.roles.includes(role);
}
