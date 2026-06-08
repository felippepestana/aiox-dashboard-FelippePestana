'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="rounded-lg p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
      aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
