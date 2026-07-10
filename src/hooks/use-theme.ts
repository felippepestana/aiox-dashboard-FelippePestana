'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'dark' | 'light';
const STORAGE_KEY = 'apex_theme';

function applyTheme(t: Theme) {
  document.documentElement.setAttribute('data-theme', t);
  // Tailwind's `dark:` variant is driven by the .dark class — keep it in sync
  document.documentElement.classList.toggle('dark', t === 'dark');
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    // Validate the stored value — corrupted/legacy entries fall back to dark
    const stored = localStorage.getItem(STORAGE_KEY);
    const initial: Theme = stored === 'light' ? 'light' : 'dark';
    setThemeState(initial);
    applyTheme(initial);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
    applyTheme(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return { theme, setTheme, toggle };
}
