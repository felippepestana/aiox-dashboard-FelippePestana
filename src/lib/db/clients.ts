// Data Access Layer — Clients
// All Supabase queries for the `clients` table go through this module.

import { createServerClient } from '@/lib/supabase';

// ─── Typed shape returned by the DB (mirrors consolidated migration) ──────────

export interface DbClient {
  id: string;
  user_id: string;
  name: string;
  type: 'pf' | 'pj';
  cpf_cnpj: string | null;
  email: string | null;
  phone: string | null;
  address: Record<string, unknown>;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ClientFilters {
  type?: string;
  search?: string;
}

export interface CreateClientInput {
  type?: string;
  name: string;
  cpfCnpj?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: Record<string, unknown>;
  notes?: string;
  leadSource?: string;
}

export type UpdateClientInput = Partial<CreateClientInput>;

export async function getClients(userId: string, filters: ClientFilters = {}) {
  const supabase = createServerClient();
  let query = supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (filters.type) query = query.eq('type', filters.type);
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,cpf_cnpj.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getClientById(userId: string, id: string) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function createClient(userId: string, input: CreateClientInput) {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('clients')
    .insert({
      user_id: userId,
      type: input.type,
      name: input.name,
      cpf_cnpj: input.cpfCnpj,
      email: input.email,
      phone: input.phone,
      whatsapp: input.whatsapp,
      address: input.address ?? {},
      notes: input.notes ?? '',
      lead_source: input.leadSource,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(userId: string, id: string, input: UpdateClientInput) {
  const supabase = createServerClient();
  const patch: Record<string, unknown> = {};

  if (input.type !== undefined) patch.type = input.type;
  if (input.name !== undefined) patch.name = input.name;
  if (input.cpfCnpj !== undefined) patch.cpf_cnpj = input.cpfCnpj;
  if (input.email !== undefined) patch.email = input.email;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.whatsapp !== undefined) patch.whatsapp = input.whatsapp;
  if (input.address !== undefined) patch.address = input.address;
  if (input.notes !== undefined) patch.notes = input.notes;
  if (input.leadSource !== undefined) patch.lead_source = input.leadSource;

  const { data, error } = await supabase
    .from('clients')
    .update(patch)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClient(userId: string, id: string) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
