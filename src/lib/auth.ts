// Auth Library — Supabase Auth with backward-compatible Base64 session fallback

import { createServerClient, createBrowserClient } from './supabase';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Server-side: get user from Supabase session token
export async function getServerUser(): Promise<User | null> {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get profile from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single();

  return {
    id: user.id,
    email: user.email || '',
    name: profile?.name || user.email?.split('@')[0] || 'Usuário',
    role: profile?.role || 'advogado',
  };
}

// Browser-side: sign in
export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

// Browser-side: sign up
export async function signUp(email: string, password: string, name: string) {
  const supabase = createBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

// Browser-side: sign out
export async function signOut() {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
}

// Browser-side: get current session
export async function getSession() {
  const supabase = createBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

// Validate a raw session token — tries Supabase first, falls back to legacy Base64 format
export async function validateSession(token: string): Promise<User | null> {
  // Try Supabase token validation
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser(token);

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      name: profile?.name || 'Usuário',
      role: profile?.role || 'advogado',
    };
  }

  // Fallback: try old Base64 session format for migration period
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp > Date.now()) {
      return {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role || 'admin',
      };
    }
  } catch {
    /* invalid token */
  }

  return null;
}
