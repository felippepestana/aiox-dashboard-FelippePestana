// Data Access Layer — Petitions
// All Supabase queries for the `petitions` table go through this module.

import { createServerClient } from '@/lib/supabase';

// ─── Typed shape returned by the DB (mirrors consolidated migration) ──────────

export interface DbPetition {
  id: string;
  user_id: string;
  process_id: string | null;
  title: string;
  type: string;
  content: string;
  status: 'draft' | 'review' | 'final';
  filed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PetitionFilters {
  status?: string;
  processId?: string;
}

export interface CreatePetitionInput {
  processId?: string;
  type?: string;
  title: string;
  status?: string;
  content?: string;
  templateId?: string;
  courtSystem?: string;
  aiModel?: string;
  aiCost?: number;
}

export type UpdatePetitionInput = Partial<CreatePetitionInput>;

export async function getPetitions(userId: string, filters: PetitionFilters = {}) {
  const supabase = createServerClient();
  let query = supabase
    .from('petitions')
    .select('*, processes(cnj, title)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters.status) query = query.eq('status', filters.status);
  if (filters.processId) query = query.eq('process_id', filters.processId);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getPetitionById(userId: string, id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('petitions')
    .select('*, processes(cnj, title)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function createPetition(userId: string, input: CreatePetitionInput) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('petitions')
    .insert({
      user_id: userId,
      process_id: input.processId,
      type: input.type,
      title: input.title,
      status: input.status ?? 'draft',
      content: input.content ?? '',
      template_id: input.templateId,
      court_system: input.courtSystem,
      ai_model: input.aiModel,
      ai_cost: input.aiCost,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePetition(userId: string, id: string, input: UpdatePetitionInput) {
  const supabase = createServerClient();
  const patch: Record<string, unknown> = {};

  if (input.processId !== undefined) patch.process_id = input.processId;
  if (input.type !== undefined) patch.type = input.type;
  if (input.title !== undefined) patch.title = input.title;
  if (input.status !== undefined) patch.status = input.status;
  if (input.content !== undefined) patch.content = input.content;
  if (input.templateId !== undefined) patch.template_id = input.templateId;
  if (input.courtSystem !== undefined) patch.court_system = input.courtSystem;
  if (input.aiModel !== undefined) patch.ai_model = input.aiModel;
  if (input.aiCost !== undefined) patch.ai_cost = input.aiCost;

  const { data, error } = await supabase
    .from('petitions')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePetition(userId: string, id: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('petitions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
