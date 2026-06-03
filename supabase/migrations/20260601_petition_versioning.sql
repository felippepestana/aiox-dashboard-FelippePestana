-- =============================================================================
-- Migration: petition_versions + petition_approval_history
-- Sprint 3: document versioning and approval workflow for petitions
-- =============================================================================
--
-- petition_versions        — immutable snapshots of petition content at each
--                            save point, with optional diff for change-tracking.
-- petition_approval_history — audit trail for every status transition on a
--                             petition (draft → review → approved → filed, etc.)
-- =============================================================================

-- ─── petition_versions ───────────────────────────────────────────────────────

create table if not exists petition_versions (
  id                 uuid        primary key default gen_random_uuid(),
  petition_id        text        not null,
  version            integer     not null,
  content            text        not null,
  created_at         timestamptz not null default now(),
  created_by         text,
  change_description text,
  diff               jsonb,

  -- Each petition can only have one row per version number
  unique (petition_id, version)
);

-- RLS: authenticated users can manage petition versions
alter table petition_versions enable row level security;

create policy "Authenticated users manage petition versions"
  on petition_versions
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Fast lookups by petition (most common query: "give me all versions of X")
create index if not exists idx_petition_versions_petition_id
  on petition_versions (petition_id);

-- Useful for "latest version" queries
create index if not exists idx_petition_versions_petition_version
  on petition_versions (petition_id, version desc);

-- ─── petition_approval_history ───────────────────────────────────────────────

create table if not exists petition_approval_history (
  id              uuid        primary key default gen_random_uuid(),
  petition_id     text        not null,
  user_id         text,
  action          text        not null,
  previous_status text,
  new_status      text,
  comment         text,
  created_at      timestamptz not null default now()
);

-- RLS: authenticated users can manage petition approval history
alter table petition_approval_history enable row level security;

create policy "Authenticated users manage petition approval history"
  on petition_approval_history
  for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Fast lookups by petition (most common query: "give me the approval trail for X")
create index if not exists idx_petition_approval_history_petition_id
  on petition_approval_history (petition_id);

-- Chronological ordering within a petition
create index if not exists idx_petition_approval_history_petition_created
  on petition_approval_history (petition_id, created_at desc);
