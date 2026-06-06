// Data Access Layer — Deadlines
// All Supabase queries for the `deadlines` table go through this module.

import { createServerClient } from '@/lib/supabase';
import {
  parsePaginationParams,
  buildPaginatedResult,
  pageToOffset,
} from '@/lib/pagination';

// ─── Typed shape returned by the DB (mirrors consolidated migration) ──────────

export interface DbDeadline {
  id: string;
  user_id: string;
  process_id: string | null;
  title: string;
  description: string;
  due_date: string;
  type: 'fatal' | 'ordinario' | 'audiencia';
  status: 'pending' | 'completed' | 'overdue';
  completed_at: string | null;
  created_at: string;
}

export interface DeadlineFilters {
  status?: string;
  processId?: string;
  search?: string;
}

export interface CreateDeadlineInput {
  processId?: string;
  title: string;
  type?: string;
  dueDate: string;
  reminderDays?: number[];
  assignedTo?: string;
  notes?: string;
}

export interface UpdateDeadlineInput {
  title?: string;
  type?: string;
  dueDate?: string;
  reminderDays?: number[];
  status?: string;
  assignedTo?: string;
  notes?: string;
}

export async function getDeadlines(
  userId: string,
  filters: DeadlineFilters = {},
  searchParams?: URLSearchParams
) {
  const supabase = createServerClient();
  const wantsPagination =
    searchParams?.has('page') || searchParams?.has('pageSize');

  if (!wantsPagination) {
    let query = supabase
      .from('deadlines')
      .select('*, processes(cnj, title)')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.processId) query = query.eq('process_id', filters.processId);
    if (filters.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,notes.ilike.%${filters.search}%,assigned_to.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return { deadlines: data ?? [] };
  }

  // Paginated path
  const params = parsePaginationParams(searchParams!, {
    sortBy: 'due_date',
    sortOrder: 'asc',
  });
  const { page, pageSize, sortBy = 'due_date', sortOrder = 'asc' } = params;
  const offset = pageToOffset(page, pageSize);

  let dataQuery = supabase
    .from('deadlines')
    .select('*, processes(cnj, title)')
    .eq('user_id', userId)
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range(offset, offset + pageSize - 1);

  let countQuery = supabase
    .from('deadlines')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (filters.status) {
    dataQuery = dataQuery.eq('status', filters.status);
    countQuery = countQuery.eq('status', filters.status);
  }
  if (filters.processId) {
    dataQuery = dataQuery.eq('process_id', filters.processId);
    countQuery = countQuery.eq('process_id', filters.processId);
  }
  if (filters.search) {
    const orClause = `title.ilike.%${filters.search}%,notes.ilike.%${filters.search}%,assigned_to.ilike.%${filters.search}%`;
    dataQuery = dataQuery.or(orClause);
    countQuery = countQuery.or(orClause);
  }

  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);
  if (dataResult.error) throw dataResult.error;
  if (countResult.error) throw countResult.error;

  const total = countResult.count ?? 0;
  return buildPaginatedResult(dataResult.data ?? [], total, params);
}

export async function getDeadlineById(userId: string, id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('deadlines')
    .select('*, processes(cnj, title)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function createDeadline(userId: string, input: CreateDeadlineInput) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('deadlines')
    .insert({
      user_id: userId,
      process_id: input.processId,
      title: input.title,
      type: input.type,
      due_date: input.dueDate,
      reminder_days: input.reminderDays ?? [3, 1],
      status: 'pending',
      assigned_to: input.assignedTo ?? '',
      notes: input.notes ?? '',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateDeadline(userId: string, id: string, input: UpdateDeadlineInput) {
  const supabase = createServerClient();
  const patch: Record<string, unknown> = {};

  if (input.title !== undefined) patch.title = input.title;
  if (input.type !== undefined) patch.type = input.type;
  if (input.dueDate !== undefined) patch.due_date = input.dueDate;
  if (input.reminderDays !== undefined) patch.reminder_days = input.reminderDays;
  if (input.status !== undefined) patch.status = input.status;
  if (input.assignedTo !== undefined) patch.assigned_to = input.assignedTo;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await supabase
    .from('deadlines')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDeadline(userId: string, id: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('deadlines')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Fetch deadlines due within the next N days (default 7).
 */
export async function getUpcomingDeadlines(userId: string, days = 7) {
  const supabase = createServerClient();
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  const { data, error } = await supabase
    .from('deadlines')
    .select('*, processes(cnj, title)')
    .eq('user_id', userId)
    .in('status', ['pending'])
    .gte('due_date', now.toISOString())
    .lte('due_date', until.toISOString())
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Fetch all overdue deadlines (due_date in the past, status still pending/overdue).
 */
export async function getOverdueDeadlines(userId: string) {
  const supabase = createServerClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('deadlines')
    .select('*, processes(cnj, title)')
    .eq('user_id', userId)
    .in('status', ['pending', 'overdue'])
    .lt('due_date', now)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

/**
 * Mark a deadline as completed, recording the completion timestamp.
 */
export async function markDeadlineCompleted(id: string, userId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('deadlines')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
