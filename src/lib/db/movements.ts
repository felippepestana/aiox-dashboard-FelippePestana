// Data Access Layer — Movements
// All Supabase queries for the `movements` table go through this module.
// Note: movements are scoped to processes (no direct user_id column).
// RLS enforces ownership through the processes table.

import { createServerClient } from '@/lib/supabase';

// ─── Typed shape returned by the DB (mirrors consolidated migration) ──────────

export interface DbMovement {
  id: string;
  process_id: string;
  type: string | null;
  title: string;
  description: string;
  date: string;
  tribunal: string | null;
  author: string | null;
  source: 'manual' | 'dje' | 'pje' | 'datajud' | 'esaj' | 'eproc';
  is_read: boolean;
  created_at: string;
}

export interface CreateMovementInput {
  process_id: string;
  type?: string | null;
  title: string;
  description?: string;
  date: string;
  tribunal?: string | null;
  author?: string | null;
  source?: 'manual' | 'dje' | 'pje' | 'datajud' | 'esaj' | 'eproc';
}

export type UpdateMovementInput = Partial<Omit<CreateMovementInput, 'process_id'>>;

// =============================================================================
// Queries
// =============================================================================

/**
 * Fetch all movements for a user (joined through processes RLS).
 */
export async function getMovements(userId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('movements')
    .select('*, processes!inner(user_id, cnj, title)')
    .eq('processes.user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbMovement[];
}

/**
 * Fetch all movements for a specific process.
 * The userId param is used to verify process ownership via the processes table.
 */
export async function getMovementsByProcess(processId: string, userId: string) {
  const supabase = createServerClient();
  // First verify process ownership
  const { error: ownershipError } = await supabase
    .from('processes')
    .select('id')
    .eq('id', processId)
    .eq('user_id', userId)
    .single();
  if (ownershipError) throw ownershipError;

  const { data, error } = await supabase
    .from('movements')
    .select('*')
    .eq('process_id', processId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbMovement[];
}

/**
 * Fetch a single movement by id. Requires userId to verify process ownership.
 */
export async function getMovementById(id: string, userId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('movements')
    .select('*, processes!inner(user_id, cnj, title)')
    .eq('id', id)
    .eq('processes.user_id', userId)
    .single();
  if (error) throw error;
  return data as DbMovement;
}

/**
 * Create a new movement. Verifies the process belongs to userId first.
 */
export async function createMovement(userId: string, input: CreateMovementInput) {
  const supabase = createServerClient();

  // Verify process ownership before insert
  const { error: ownershipError } = await supabase
    .from('processes')
    .select('id')
    .eq('id', input.process_id)
    .eq('user_id', userId)
    .single();
  if (ownershipError) throw ownershipError;

  const { data, error } = await supabase
    .from('movements')
    .insert({
      process_id: input.process_id,
      type: input.type ?? null,
      title: input.title,
      description: input.description ?? '',
      date: input.date,
      tribunal: input.tribunal ?? null,
      author: input.author ?? null,
      source: input.source ?? 'manual',
      is_read: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data as DbMovement;
}

/**
 * Update a movement (scoped by userId via process ownership check).
 */
export async function updateMovement(
  id: string,
  userId: string,
  input: UpdateMovementInput
) {
  const supabase = createServerClient();
  const patch: Record<string, unknown> = {};
  if (input.type !== undefined) patch.type = input.type;
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.date !== undefined) patch.date = input.date;
  if (input.tribunal !== undefined) patch.tribunal = input.tribunal;
  if (input.author !== undefined) patch.author = input.author;
  if (input.source !== undefined) patch.source = input.source;

  // Fetch movement first to obtain process_id for ownership check
  const { data: existing, error: fetchError } = await supabase
    .from('movements')
    .select('process_id')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;

  const { error: ownershipError } = await supabase
    .from('processes')
    .select('id')
    .eq('id', existing.process_id)
    .eq('user_id', userId)
    .single();
  if (ownershipError) throw ownershipError;

  const { data, error } = await supabase
    .from('movements')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as DbMovement;
}

/**
 * Delete a movement (scoped by userId via process ownership check).
 */
export async function deleteMovement(id: string, userId: string) {
  const supabase = createServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from('movements')
    .select('process_id')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;

  const { error: ownershipError } = await supabase
    .from('processes')
    .select('id')
    .eq('id', existing.process_id)
    .eq('user_id', userId)
    .single();
  if (ownershipError) throw ownershipError;

  const { error } = await supabase.from('movements').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Mark a movement as read.
 */
export async function markMovementRead(id: string, userId: string) {
  const supabase = createServerClient();

  const { data: existing, error: fetchError } = await supabase
    .from('movements')
    .select('process_id')
    .eq('id', id)
    .single();
  if (fetchError) throw fetchError;

  const { error: ownershipError } = await supabase
    .from('processes')
    .select('id')
    .eq('id', existing.process_id)
    .eq('user_id', userId)
    .single();
  if (ownershipError) throw ownershipError;

  const { data, error } = await supabase
    .from('movements')
    .update({ is_read: true })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as DbMovement;
}
