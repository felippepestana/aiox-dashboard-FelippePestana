'use client';

// =============================================================================
// useMediaQuery – SSR-safe reactive media query hook
// =============================================================================

import { useEffect, useState } from 'react';

/**
 * Returns true when the given CSS media query matches.
 * Safe for SSR – returns false until mounted on the client.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    function handleChange(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}

/** True when viewport width is < 768 px (mobile). */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/** True when viewport width is 768–1024 px (tablet). */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1024px)');
}

/** True when viewport width is > 1024 px (desktop). */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1025px)');
}
