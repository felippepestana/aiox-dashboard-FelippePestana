'use client';

// =============================================================================
// useSearch - Debounced full-text search hook using SearchIndex
// Portuguese accent-insensitive, with highlight support
// =============================================================================

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { SearchIndex, highlightMatches } from '@/lib/search-index';
import type { SearchResult, TextSegment } from '@/lib/search-index';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UseSearchOptions {
  /** Debounce delay in ms (default: 300). */
  debounceMs?: number;
  /** Minimum query length to trigger search (default: 2). */
  minLength?: number;
  /** Maximum results returned (default: 100). */
  maxResults?: number;
}

export interface UseSearchReturn<T> {
  query: string;
  setQuery: (q: string) => void;
  results: T[];
  /** Full scored results with match positions (for highlight rendering). */
  scoredResults: SearchResult<T>[];
  isSearching: boolean;
  /** Helper: highlight matching segments in a string value. */
  highlight: (text: string) => TextSegment[];
  clearSearch: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * @param items        Source data to search through
 * @param searchFields Fields to index (must be string properties of T)
 * @param options      Optional config
 */
export function useSearch<T extends Record<string, unknown>>(
  items: T[],
  searchFields: (keyof T)[],
  options: UseSearchOptions = {}
): UseSearchReturn<T> {
  const { debounceMs = 300, minLength = 2, maxResults = 100 } = options;

  const [query, setQueryState] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Build / update index when items change ───────────────────────────────

  const index = useMemo(() => {
    const idx = new SearchIndex<T>();
    idx.addDocuments(items, searchFields);
    return idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, searchFields.join(',')]);

  // ─── Debounce input ───────────────────────────────────────────────────────

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      if (q.trim().length < minLength) {
        setDebouncedQuery('');
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      debounceTimer.current = setTimeout(() => {
        setDebouncedQuery(q);
        setIsSearching(false);
      }, debounceMs);
    },
    [debounceMs, minLength]
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ─── Run search ───────────────────────────────────────────────────────────

  const scoredResults = useMemo<SearchResult<T>[]>(() => {
    if (debouncedQuery.trim().length < minLength) return [];
    return index.search(debouncedQuery, maxResults);
  }, [index, debouncedQuery, minLength, maxResults]);

  const results = useMemo<T[]>(
    () => scoredResults.map((r) => r.item),
    [scoredResults]
  );

  // ─── Highlight helper ─────────────────────────────────────────────────────

  const highlight = useCallback(
    (text: string): TextSegment[] => highlightMatches(text, query),
    [query]
  );

  const clearSearch = useCallback(() => {
    setQueryState('');
    setDebouncedQuery('');
    setIsSearching(false);
  }, []);

  return {
    query,
    setQuery,
    results: debouncedQuery.trim().length >= minLength ? results : items as T[],
    scoredResults,
    isSearching,
    highlight,
    clearSearch,
  };
}
