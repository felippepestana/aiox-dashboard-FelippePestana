-- =============================================================================
-- Migration: audit_logs + consent_records
-- LGPD-compliant audit trail and consent management
-- =============================================================================
--
-- audit_logs    — immutable event log for every sensitive action (Art. 37 LGPD)
-- consent_records — per-client per-purpose consent history (Art. 7 & 8 LGPD)
-- =============================================================================

-- ─── audit_logs ──────────────────────────────────────────────────────────────

create table if not exists audit_logs (
  id            uuid        primary key default gen_random_uuid(),
  user_id       text        not null,                   -- auth user id (text to support non-UUID ids)
  action        text        not null
                  check (action in ('create','read','update','delete','export','login','logout','share')),
  resource_type text        not null
                  check (resource_type in ('process','client','petition','deadline','financial','credential')),
  resource_id   text,                                   -- optional — id of the affected row
  details       jsonb,                                  -- arbitrary context (e.g. field changes)
  ip_address    text,
  user_agent    text,
  created_at    timestamptz not null default now()
);

-- Audit logs must never be updated or deleted by regular users
-- (only a service-role migration may purge expired rows)
alter table audit_logs enable row level security;

-- Admins can read all audit logs; regular users can only read their own
drop policy if exists "Admins read all audit logs" on audit_logs;
create policy "Admins read all audit logs"
  on audit_logs
  for select
  using (
    exists (
      select 1 from profiles
       where profiles.id = auth.uid()
         and profiles.role = 'admin'
    )
  );

drop policy if exists "Users read own audit logs" on audit_logs;
create policy "Users read own audit logs"
  on audit_logs
  for select
  using (user_id = auth.uid()::text);

-- Inserts are allowed for any authenticated user (via service role in practice)
drop policy if exists "Authenticated users insert audit logs" on audit_logs;
create policy "Authenticated users insert audit logs"
  on audit_logs
  for insert
  with check (true);

-- No UPDATE or DELETE via RLS — logs are append-only
-- (service role can still delete expired rows via migrations)

-- Performance indexes
create index if not exists idx_audit_logs_created_at
  on audit_logs (created_at desc);

create index if not exists idx_audit_logs_user_id
  on audit_logs (user_id);

create index if not exists idx_audit_logs_resource_type
  on audit_logs (resource_type);

create index if not exists idx_audit_logs_action
  on audit_logs (action);

-- Composite: most common query pattern (user + date range)
create index if not exists idx_audit_logs_user_created
  on audit_logs (user_id, created_at desc);

-- ─── consent_records ─────────────────────────────────────────────────────────

create table if not exists consent_records (
  id            uuid        primary key default gen_random_uuid(),
  client_id     uuid        not null references clients(id) on delete cascade,
  purpose       text        not null
                  check (purpose in (
                    'legal_representation',
                    'marketing',
                    'analytics',
                    'third_party_sharing',
                    'data_retention_extended'
                  )),
  granted       boolean     not null default false,
  granted_at    timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- One consent record per client per purpose (upsert-friendly)
  unique (client_id, purpose)
);

alter table consent_records enable row level security;

-- Lawyers and admins can manage consent records
drop policy if exists "Users manage consent records" on consent_records;
create policy "Users manage consent records"
  on consent_records
  for all
  using (
    exists (
      select 1 from profiles
       where profiles.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from profiles
       where profiles.id = auth.uid()
    )
  );

create index if not exists idx_consent_records_client_id
  on consent_records (client_id);

create index if not exists idx_consent_records_purpose
  on consent_records (purpose);

-- Keep updated_at in sync (reuses the function created in earlier migrations)
drop trigger if exists tr_consent_records_updated on consent_records;
create trigger tr_consent_records_updated
  before update on consent_records
  for each row execute function update_updated_at();
