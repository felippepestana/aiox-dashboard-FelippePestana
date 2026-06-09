// =============================================================================
// Audit Log — LGPD-compliant event logging
// Records all sensitive operations in the audit_logs Supabase table
// =============================================================================

import * as Sentry from '@sentry/nextjs';
import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'export'
  | 'login'
  | 'logout'
  | 'share';

export type AuditResourceType =
  | 'process'
  | 'client'
  | 'petition'
  | 'deadline'
  | 'financial'
  | 'credential';

export interface AuditEvent {
  id?: string;
  userId: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
}

export interface AuditLogFilters {
  userId?: string;
  resourceType?: AuditResourceType;
  action?: AuditAction;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AuditLogPage {
  entries: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ─── Write ────────────────────────────────────────────────────────────────────

/**
 * Persist an audit event to the audit_logs table.
 * Failures are swallowed so they never block the main request.
 */
export async function logAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      user_id: event.userId,
      action: event.action,
      resource_type: event.resourceType,
      resource_id: event.resourceId ?? null,
      details: event.details ?? null,
      ip_address: event.ipAddress ?? null,
      user_agent: event.userAgent ?? null,
    });

    if (error) {
      Sentry.captureMessage(`[audit-log] insert error: ${error.message}`, 'error');
      console.error('[audit-log] insert error:', error.message);
    }
  } catch (err) {
    Sentry.captureException(err);
    console.error('[audit-log] unexpected error:', err);
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Query audit log with optional filters and pagination.
 */
export async function getAuditLog(filters: AuditLogFilters = {}): Promise<AuditLogPage> {
  const {
    userId,
    resourceType,
    action,
    dateFrom,
    dateTo,
    search,
    page = 1,
    pageSize = 50,
  } = filters;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (userId) query = query.eq('user_id', userId);
  if (resourceType) query = query.eq('resource_type', resourceType);
  if (action) query = query.eq('action', action);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo);
  if (search) query = query.ilike('details::text', `%${search}%`);

  const { data, error, count } = await query;

  if (error) {
    Sentry.captureMessage(`[audit-log] query error: ${error.message}`, 'error');
    console.error('[audit-log] query error:', error.message);
    return { entries: [], total: 0, page, pageSize, totalPages: 0 };
  }

  const entries = (data ?? []).map(rowToEvent);
  const total = count ?? 0;

  return {
    entries,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Fetch the most recent audit entries, optionally scoped to one user.
 */
export async function getRecentActivity(
  userId?: string,
  limit = 20,
): Promise<AuditEvent[]> {
  let query = supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query;

  if (error) {
    Sentry.captureMessage(`[audit-log] recent activity error: ${error.message}`, 'error');
    console.error('[audit-log] recent activity error:', error.message);
    return [];
  }

  return (data ?? []).map(rowToEvent);
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function rowToEvent(row: Record<string, unknown>): AuditEvent {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    action: row.action as AuditAction,
    resourceType: row.resource_type as AuditResourceType,
    resourceId: (row.resource_id as string) ?? undefined,
    details: (row.details as Record<string, unknown>) ?? undefined,
    ipAddress: (row.ip_address as string) ?? undefined,
    userAgent: (row.user_agent as string) ?? undefined,
    timestamp: row.created_at as string,
  };
}
