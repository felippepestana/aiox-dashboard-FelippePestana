'use client';

// =============================================================================
// usePagination - Generic pagination hook with in-memory page cache
// and next-page prefetch for instant navigation
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PaginatedResult, PaginationParams } from '@/lib/pagination';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PageFetcher<T> = (params: PaginationParams) => Promise<PaginatedResult<T>>;

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  /** Reset to page 1 and clear cache when this changes (e.g. active filters). */
  resetKey?: unknown;
}

export interface UsePaginationReturn<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  isLoading: boolean;
  error: Error | null;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePagination<T>(
  fetcher: PageFetcher<T>,
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const {
    initialPage = 1,
    initialPageSize = DEFAULT_PAGE_SIZE,
    sortBy,
    sortOrder = 'asc',
    resetKey,
  } = options;

  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<PaginatedResult<T>>({
    data: [],
    total: 0,
    page: initialPage,
    pageSize: initialPageSize,
    totalPages: 0,
    hasMore: false,
  });

  // In-memory page cache: key = `${page}-${pageSize}-${sortBy}-${sortOrder}`
  const pageCache = useRef(new Map<string, PaginatedResult<T>>());
  // Track the latest request to ignore stale responses
  const requestId = useRef(0);

  // ─── Cache key ────────────────────────────────────────────────────────────

  const cacheKey = (p: number, ps: number) =>
    `${p}|${ps}|${sortBy ?? ''}|${sortOrder}`;

  // ─── Reset on filter/key change ──────────────────────────────────────────

  const prevResetKey = useRef(resetKey);
  useEffect(() => {
    if (prevResetKey.current !== resetKey) {
      prevResetKey.current = resetKey;
      pageCache.current.clear();
      setPage(1);
    }
  }, [resetKey]);

  // ─── Fetch page ──────────────────────────────────────────────────────────

  const fetchPage = useCallback(
    async (targetPage: number, targetPageSize: number, skipCache = false) => {
      const key = cacheKey(targetPage, targetPageSize);

      if (!skipCache && pageCache.current.has(key)) {
        setResult(pageCache.current.get(key)!);
        return;
      }

      const id = ++requestId.current;
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetcher({
          page: targetPage,
          pageSize: targetPageSize,
          sortBy,
          sortOrder,
        });

        if (id !== requestId.current) return; // stale

        pageCache.current.set(key, res);
        setResult(res);

        // Prefetch next page in background (no loading state)
        const nextP = targetPage + 1;
        if (res.hasMore && !pageCache.current.has(cacheKey(nextP, targetPageSize))) {
          fetcher({ page: nextP, pageSize: targetPageSize, sortBy, sortOrder })
            .then((nextRes) => {
              pageCache.current.set(cacheKey(nextP, targetPageSize), nextRes);
            })
            .catch(() => {
              // silent – prefetch failure is not critical
            });
        }
      } catch (err) {
        if (id === requestId.current) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fetcher, sortBy, sortOrder]
  );

  // ─── Trigger fetch when page/pageSize changes ────────────────────────────

  useEffect(() => {
    fetchPage(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, fetchPage]);

  // ─── Actions ─────────────────────────────────────────────────────────────

  const goToPage = useCallback((p: number) => {
    setPage(Math.max(1, p));
  }, []);

  const nextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const setPageSize = useCallback((size: number) => {
    pageCache.current.clear();
    setPageSizeState(size);
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    pageCache.current.clear();
    fetchPage(page, pageSize, true);
  }, [fetchPage, page, pageSize]);

  return {
    data: result.data,
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
    hasMore: result.hasMore,
    isLoading,
    error,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    refresh,
  };
}
