import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (for client components)
export function createBrowserClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Server client (for API routes, server components)
export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;
  return createClient(supabaseUrl, serviceKey);
}

// Default export for backward compatibility.
// Lazily instantiated via a Proxy so a missing env var at build time does not
// crash Next.js page-data collection — the client is only created on first use
// (request time), where env vars are guaranteed to be present.
let _supabase: SupabaseClient | null = null;
function getDefaultClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getDefaultClient();
    const value = Reflect.get(client, prop);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
