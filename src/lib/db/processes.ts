// Data Access Layer — Processes
// All Supabase queries for the `processes` table go through this module.

import { createServerClient } from '@/lib/supabase';

// ─── Typed shape returned by the DB (mirrors consolidated migration) ──────────

export interface DbProcess {
  id: string;
  user_id: string;
  client_id: string | null;
  cnj: string | null;
  title: string;
  area: string;
  court: string | null;
  judge: string | null;
  vara: string | null;
  comarca: string | null;
  state: string | null;
  opposing_party: string | null;
  opposing_lawyer: string | null;
  status: 'active' | 'suspended' | 'archived' | 'closed';
  urgency: 'alta' | 'media' | 'baixa';
  value_cents: number | null;
  distribution_date: string | null;
  object: string | null;
  tags: string[];
  datajud_linked: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProcessFilters {
  area?: string;
  status?: string;
  search?: string;
}

export interface CreateProcessInput {
  cnj?: string;
  title?: string;
  area?: string;
  court?: string;
  judge?: string;
  vara?: string;
  comarca?: string;
  state?: string;
  clientId?: string | null;
  opposingParty?: string;
  opposingLawyer?: string;
  status?: string;
  urgency?: string;
  courtSystem?: string;
  object?: string;
  causeValue?: number;
  feeType?: string;
  feeAmount?: number;
  contingencyPct?: number;
  tags?: string[];
}

export type UpdateProcessInput = Partial<CreateProcessInput>;

export async function getProcesses(userId: string, filters: ProcessFilters = {}) {
  const supabase = createServerClient();
  let query = supabase
    .from('processes')
    .select('*, clients(name, cpf_cnpj)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters.area) query = query.eq('area', filters.area);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search) {
    query = query.or(`cnj.ilike.%${filters.search}%,title.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getProcessById(userId: string, id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('processes')
    .select('*, clients(name, cpf_cnpj)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function createProcess(userId: string, input: CreateProcessInput) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('processes')
    .insert({
      user_id: userId,
      cnj: input.cnj,
      title: input.title,
      area: input.area,
      court: input.court,
      judge: input.judge,
      vara: input.vara,
      comarca: input.comarca,
      state: input.state,
      client_id: input.clientId ?? null,
      opposing_party: input.opposingParty,
      opposing_lawyer: input.opposingLawyer,
      status: input.status ?? 'active',
      urgency: input.urgency ?? 'medium',
      court_system: input.courtSystem ?? 'manual',
      object: input.object,
      cause_value: input.causeValue ?? 0,
      fee_type: input.feeType ?? 'fixed',
      fee_amount: input.feeAmount ?? 0,
      contingency_pct: input.contingencyPct,
      tags: input.tags ?? [],
      datajud_linked: input.tags?.includes('datajud-vinculado') ?? false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateProcess(userId: string, id: string, input: UpdateProcessInput) {
  const supabase = createServerClient();
  const patch: Record<string, unknown> = {};

  if (input.cnj !== undefined) patch.cnj = input.cnj;
  if (input.title !== undefined) patch.title = input.title;
  if (input.area !== undefined) patch.area = input.area;
  if (input.court !== undefined) patch.court = input.court;
  if (input.judge !== undefined) patch.judge = input.judge;
  if (input.vara !== undefined) patch.vara = input.vara;
  if (input.comarca !== undefined) patch.comarca = input.comarca;
  if (input.state !== undefined) patch.state = input.state;
  if (input.clientId !== undefined) patch.client_id = input.clientId;
  if (input.opposingParty !== undefined) patch.opposing_party = input.opposingParty;
  if (input.opposingLawyer !== undefined) patch.opposing_lawyer = input.opposingLawyer;
  if (input.status !== undefined) patch.status = input.status;
  if (input.urgency !== undefined) patch.urgency = input.urgency;
  if (input.object !== undefined) patch.object = input.object;
  if (input.causeValue !== undefined) patch.cause_value = input.causeValue;
  if (input.feeType !== undefined) patch.fee_type = input.feeType;
  if (input.feeAmount !== undefined) patch.fee_amount = input.feeAmount;
  if (input.contingencyPct !== undefined) patch.contingency_pct = input.contingencyPct;
  if (input.tags !== undefined) patch.tags = input.tags;

  const { data, error } = await supabase
    .from('processes')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProcess(userId: string, id: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('processes')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Fetch a process by its CNJ number (scoped to the requesting user).
 */
export async function getProcessByCnj(cnj: string, userId: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('processes')
    .select('*, clients(name, cpf_cnpj)')
    .eq('cnj', cnj)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}
