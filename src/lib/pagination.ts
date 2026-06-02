// =============================================================================
// Pagination Utility - APEX Legal Dashboard
// Supabase-backed offset and cursor pagination with typed results
// =============================================================================

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ───────────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20;

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page: number;           // 1-based
  pageSize: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

/** Cursor-based pagination for real-time data (e.g. movements, publications). */
export interface CursorPaginationParams {
  cursor?: string;      // ISO date or opaque id from last item
  cursorField?: string; // column used as cursor (default: 'created_at')
  limit: number;
  sortOrder?: SortOrder;
}

export interface CursorPaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Compute offset from 1-based page number.
 */
export function pageToOffset(page: number, pageSize: number): number {
  return (Math.max(1, page) - 1) * pageSize;
}

/**
 * Compute total pages from a total row count.
 */
export function totalPages(total: number, pageSize: number): number {
  if (pageSize <= 0) return 0;
  return Math.ceil(total / pageSize);
}

/**
 * Build a normalised PaginatedResult from raw rows and total count.
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const pages = totalPages(total, params.pageSize);
  return {
    data,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: pages,
    hasMore: params.page < pages,
  };
}

// ─── Query Builder ────────────────────────────────────────────────────────────

type FilterValue = string | number | boolean | null;

export interface QueryFilter {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'ilike' | 'in';
  value: FilterValue | FilterValue[];
}

/**
 * Build a paginated Supabase query for the given table.
 *
 * Returns both the data query and a count query so callers can run them in
 * parallel with Promise.all for maximum efficiency.
 *
 * @example
 * const { dataQuery, countQuery } = buildSupabaseQuery(supabase, 'deadlines', params, filters);
 * const [{ data }, { count }] = await Promise.all([dataQuery, countQuery]);
 */
export function buildSupabaseQuery(
  client: SupabaseClient,
  table: string,
  params: PaginationParams,
  filters?: QueryFilter[]
) {
  const { page, pageSize, sortBy, sortOrder = 'asc' } = params;
  const offset = pageToOffset(page, pageSize);
  const limit = pageSize;

  // --- Data query ---
  let dataQuery = client.from(table).select('*', { count: 'planned' });

  // Apply filters
  if (filters?.length) {
    for (const f of filters) {
      switch (f.operator) {
        case 'eq':
          dataQuery = dataQuery.eq(f.column, f.value as FilterValue);
          break;
        case 'neq':
          dataQuery = dataQuery.neq(f.column, f.value as FilterValue);
          break;
        case 'gt':
          dataQuery = dataQuery.gt(f.column, f.value as FilterValue);
          break;
        case 'gte':
          dataQuery = dataQuery.gte(f.column, f.value as FilterValue);
          break;
        case 'lt':
          dataQuery = dataQuery.lt(f.column, f.value as FilterValue);
          break;
        case 'lte':
          dataQuery = dataQuery.lte(f.column, f.value as FilterValue);
          break;
        case 'ilike':
          dataQuery = dataQuery.ilike(f.column, f.value as string);
          break;
        case 'in':
          dataQuery = dataQuery.in(f.column, f.value as FilterValue[]);
          break;
      }
    }
  }

  // Order + range
  if (sortBy) {
    dataQuery = dataQuery.order(sortBy, { ascending: sortOrder === 'asc' });
  }

  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // --- Separate count query (no range, returns count only) ---
  let countQuery = client
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (filters?.length) {
    for (const f of filters) {
      switch (f.operator) {
        case 'eq':
          countQuery = countQuery.eq(f.column, f.value as FilterValue);
          break;
        case 'neq':
          countQuery = countQuery.neq(f.column, f.value as FilterValue);
          break;
        case 'gt':
          countQuery = countQuery.gt(f.column, f.value as FilterValue);
          break;
        case 'gte':
          countQuery = countQuery.gte(f.column, f.value as FilterValue);
          break;
        case 'lt':
          countQuery = countQuery.lt(f.column, f.value as FilterValue);
          break;
        case 'lte':
          countQuery = countQuery.lte(f.column, f.value as FilterValue);
          break;
        case 'ilike':
          countQuery = countQuery.ilike(f.column, f.value as string);
          break;
        case 'in':
          countQuery = countQuery.in(f.column, f.value as FilterValue[]);
          break;
      }
    }
  }

  return { dataQuery, countQuery };
}

// ─── Cursor Pagination ────────────────────────────────────────────────────────

/**
 * Build a cursor-based query suitable for real-time data streams.
 * Cursor is typically the ISO timestamp or UUID of the last seen item.
 */
export function buildCursorQuery(
  client: SupabaseClient,
  table: string,
  params: CursorPaginationParams,
  filters?: QueryFilter[]
) {
  const { cursor, cursorField = 'created_at', limit, sortOrder = 'desc' } = params;

  let query = client.from(table).select('*');

  if (filters?.length) {
    for (const f of filters) {
      if (f.operator === 'eq') {
        query = query.eq(f.column, f.value as FilterValue);
      } else if (f.operator === 'ilike') {
        query = query.ilike(f.column, f.value as string);
      }
    }
  }

  if (cursor) {
    query =
      sortOrder === 'desc'
        ? query.lt(cursorField, cursor)
        : query.gt(cursorField, cursor);
  }

  query = query
    .order(cursorField, { ascending: sortOrder === 'asc' })
    .limit(limit + 1); // fetch one extra to detect hasMore

  return query;
}

/**
 * Process results from a cursor query into a CursorPaginatedResult.
 */
export function buildCursorResult<T extends Record<string, unknown>>(
  rows: T[],
  limit: number,
  cursorField: string = 'created_at'
): CursorPaginatedResult<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const last = data[data.length - 1];
  const nextCursor = hasMore && last ? String(last[cursorField] ?? '') : null;
  return { data, nextCursor, hasMore };
}

// ─── URL Parameter Helpers ───────────────────────────────────────────────────

/**
 * Extract PaginationParams from Next.js URLSearchParams with safe defaults.
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults?: Partial<PaginationParams>
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(
      1,
      parseInt(searchParams.get('pageSize') ?? String(defaults?.pageSize ?? DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE
    )
  );
  const sortBy = searchParams.get('sortBy') ?? defaults?.sortBy;
  const rawOrder = searchParams.get('sortOrder');
  const sortOrder: SortOrder =
    rawOrder === 'desc' ? 'desc' : rawOrder === 'asc' ? 'asc' : (defaults?.sortOrder ?? 'asc');

  return { page, pageSize, sortBy: sortBy ?? undefined, sortOrder };
}
