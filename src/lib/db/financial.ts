// Data Access Layer — Financial (financial_transactions + honorarios)
// All Supabase queries for the financial tables go through this module.

import { createServerClient } from '@/lib/supabase';

// =============================================================================
// Types
// =============================================================================

export interface DbFinancialTransaction {
  id: string;
  user_id: string;
  process_id: string | null;
  client_id: string | null;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  amount_cents: number;
  date: string;
  status: 'paid' | 'pending' | 'overdue';
  created_at: string;
}

export interface DbHonorario {
  id: string;
  user_id: string;
  client_id: string | null;
  process_id: string | null;
  type: 'fixed' | 'hourly' | 'success' | 'contingency';
  value_cents: number;
  status: 'active' | 'paid' | 'overdue' | 'cancelled';
  due_date: string | null;
  paid_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalIncomeCents: number;
  totalExpenseCents: number;
  profitCents: number;
  pendingIncomeCents: number;
  pendingExpenseCents: number;
  activeHonorariosCents: number;
}

// ─── Legacy input shape (retained for backward compat) ───────────────────────

export interface CreateTransactionInput {
  type: 'income' | 'expense';
  amount: number;
  date?: string;
  description?: string;
  category?: string;
  processId?: string;
  honorariosId?: string;
}

// ─── New canonical input shapes for financial_transactions ───────────────────

export interface CreateFinancialTransactionInput {
  process_id?: string | null;
  client_id?: string | null;
  type: 'income' | 'expense';
  category: string;
  description?: string | null;
  amount_cents: number;
  date: string;
  status?: 'paid' | 'pending' | 'overdue';
}

export type UpdateFinancialTransactionInput = Partial<CreateFinancialTransactionInput>;

export interface CreateHonorarioInput {
  client_id?: string | null;
  process_id?: string | null;
  type: 'fixed' | 'hourly' | 'success' | 'contingency';
  value_cents: number;
  status?: 'active' | 'paid' | 'overdue' | 'cancelled';
  due_date?: string | null;
  paid_at?: string | null;
  notes?: string;
}

export type UpdateHonorarioInput = Partial<CreateHonorarioInput>;

// =============================================================================
// Financial Transactions CRUD
// =============================================================================

export async function getFinancialTransactions(
  userId: string,
  filters: {
    type?: 'income' | 'expense';
    status?: 'paid' | 'pending' | 'overdue';
    processId?: string;
    clientId?: string;
  } = {}
) {
  const supabase = createServerClient();
  let query = supabase
    .from('financial_transactions')
    .select('*, processes(cnj, title), clients(name)')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (filters.type) query = query.eq('type', filters.type);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.processId) query = query.eq('process_id', filters.processId);
  if (filters.clientId) query = query.eq('client_id', filters.clientId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DbFinancialTransaction[];
}

export async function getFinancialTransactionById(id: string, userId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('financial_transactions')
    .select('*, processes(cnj, title), clients(name)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data as DbFinancialTransaction;
}

export async function createFinancialTransaction(
  userId: string,
  input: CreateFinancialTransactionInput
) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('financial_transactions')
    .insert({
      user_id: userId,
      process_id: input.process_id ?? null,
      client_id: input.client_id ?? null,
      type: input.type,
      category: input.category,
      description: input.description ?? null,
      amount_cents: input.amount_cents,
      date: input.date,
      status: input.status ?? 'paid',
    })
    .select()
    .single();
  if (error) throw error;
  return data as DbFinancialTransaction;
}

export async function updateFinancialTransaction(
  id: string,
  userId: string,
  input: UpdateFinancialTransactionInput
) {
  const supabase = createServerClient();
  const patch: Record<string, unknown> = {};
  if (input.process_id !== undefined) patch.process_id = input.process_id;
  if (input.client_id !== undefined) patch.client_id = input.client_id;
  if (input.type !== undefined) patch.type = input.type;
  if (input.category !== undefined) patch.category = input.category;
  if (input.description !== undefined) patch.description = input.description;
  if (input.amount_cents !== undefined) patch.amount_cents = input.amount_cents;
  if (input.date !== undefined) patch.date = input.date;
  if (input.status !== undefined) patch.status = input.status;

  const { data, error } = await supabase
    .from('financial_transactions')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as DbFinancialTransaction;
}

export async function deleteFinancialTransaction(id: string, userId: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('financial_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// =============================================================================
// Honorarios CRUD
// =============================================================================

export async function getHonorarios(
  userId: string,
  filters: { status?: string; clientId?: string; processId?: string } = {}
) {
  const supabase = createServerClient();
  let query = supabase
    .from('honorarios')
    .select('*, clients(name), processes(cnj, title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.clientId) query = query.eq('client_id', filters.clientId);
  if (filters.processId) query = query.eq('process_id', filters.processId);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DbHonorario[];
}

export async function getHonorarioById(id: string, userId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('honorarios')
    .select('*, clients(name), processes(cnj, title)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data as DbHonorario;
}

/**
 * Return all honorarios for a specific client (scoped to the requesting user).
 */
export async function getHonorariosByClient(clientId: string, userId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('honorarios')
    .select('*, processes(cnj, title)')
    .eq('client_id', clientId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DbHonorario[];
}

export async function createHonorario(userId: string, input: CreateHonorarioInput) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('honorarios')
    .insert({
      user_id: userId,
      client_id: input.client_id ?? null,
      process_id: input.process_id ?? null,
      type: input.type,
      value_cents: input.value_cents,
      status: input.status ?? 'active',
      due_date: input.due_date ?? null,
      paid_at: input.paid_at ?? null,
      notes: input.notes ?? '',
    })
    .select()
    .single();
  if (error) throw error;
  return data as DbHonorario;
}

export async function updateHonorario(
  id: string,
  userId: string,
  input: UpdateHonorarioInput
) {
  const supabase = createServerClient();
  const patch: Record<string, unknown> = {};
  if (input.client_id !== undefined) patch.client_id = input.client_id;
  if (input.process_id !== undefined) patch.process_id = input.process_id;
  if (input.type !== undefined) patch.type = input.type;
  if (input.value_cents !== undefined) patch.value_cents = input.value_cents;
  if (input.status !== undefined) patch.status = input.status;
  if (input.due_date !== undefined) patch.due_date = input.due_date;
  if (input.paid_at !== undefined) patch.paid_at = input.paid_at;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await supabase
    .from('honorarios')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as DbHonorario;
}

export async function deleteHonorario(id: string, userId: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('honorarios')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

// =============================================================================
// Aggregate helpers
// =============================================================================

/**
 * Compute income/expense/profit totals and active honorarios for a user.
 * Uses the `financial_transactions` table (amount_cents column).
 */
export async function getFinancialSummary(userId: string): Promise<FinancialSummary> {
  const supabase = createServerClient();

  const [txnResult, honorarioResult] = await Promise.all([
    supabase
      .from('financial_transactions')
      .select('type, status, amount_cents')
      .eq('user_id', userId),
    supabase
      .from('honorarios')
      .select('value_cents, status')
      .eq('user_id', userId),
  ]);

  if (txnResult.error) throw txnResult.error;
  if (honorarioResult.error) throw honorarioResult.error;

  const txns = txnResult.data ?? [];
  const honorarios = honorarioResult.data ?? [];

  const totalIncomeCents = txns
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + (t.amount_cents ?? 0), 0);

  const totalExpenseCents = txns
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + (t.amount_cents ?? 0), 0);

  const pendingIncomeCents = txns
    .filter((t) => t.type === 'income' && t.status === 'pending')
    .reduce((s, t) => s + (t.amount_cents ?? 0), 0);

  const pendingExpenseCents = txns
    .filter((t) => t.type === 'expense' && t.status === 'pending')
    .reduce((s, t) => s + (t.amount_cents ?? 0), 0);

  const activeHonorariosCents = honorarios
    .filter((h) => h.status === 'active')
    .reduce((s, h) => s + (h.value_cents ?? 0), 0);

  return {
    totalIncomeCents,
    totalExpenseCents,
    profitCents: totalIncomeCents - totalExpenseCents,
    pendingIncomeCents,
    pendingExpenseCents,
    activeHonorariosCents,
  };
}

// =============================================================================
// Legacy helper — kept for backward compatibility with existing API routes
// that reference the `transactions` table name and `amount` column.
// =============================================================================

export async function createTransaction(userId: string, input: CreateTransactionInput) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: input.type,
      amount: input.amount,
      date: input.date ?? new Date().toISOString().slice(0, 10),
      description: input.description,
      category: input.category,
      process_id: input.processId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
