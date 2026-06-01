-- =============================================================================
-- Migration: court_credentials table
-- Stores AES-256-GCM encrypted passwords for Brazilian court system logins
-- =============================================================================
--
-- The encrypted_password column stores a base64-encoded blob:
--   iv(12 bytes) || ciphertext || authTag(16 bytes)
-- Encryption is performed server-side in credential-manager.ts using the
-- AUTH_SECRET environment variable as key material (PBKDF2 → AES-256-GCM).
--
-- A unique constraint on (system, tribunal_code, username) allows upserts
-- when refreshing a credential for the same account.
-- =============================================================================

create table if not exists court_credentials (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) on delete cascade,
  system           text not null check (system in ('pje', 'esaj', 'eproc', 'projudi', 'datajud')),
  tribunal_code    text not null,
  username         text not null,
  encrypted_password text not null,
  last_used        timestamptz,
  is_valid         boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Each (user, system, tribunal, username) combination must be unique
create unique index if not exists uidx_court_credentials_key
  on court_credentials (user_id, system, tribunal_code, username);

-- Fast lookups by system + tribunal when fetching credentials for a process
create index if not exists idx_court_credentials_system_tribunal
  on court_credentials (system, tribunal_code);

-- RLS: users can only manage their own credentials
alter table court_credentials enable row level security;

create policy "Users manage own court credentials"
  on court_credentials
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Keep updated_at in sync
create trigger tr_court_credentials_updated
  before update on court_credentials
  for each row execute function update_updated_at();
