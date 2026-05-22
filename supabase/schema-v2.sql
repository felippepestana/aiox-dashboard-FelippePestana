-- AIOX Legal Performance — Schema V2: Marketing & Strategy Tables
-- Execute after schema.sql in Supabase SQL Editor

-- ─── Leads ─────────────────────────────────────────────────────────────────

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  area text not null,
  source text,
  status text default 'prospect' check (status in ('prospect','qualified','contacted','proposal','retained','lost')),
  notes text default '',
  assigned_to text,
  converted_client_id uuid references clients(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_leads_user on leads(user_id);
create index idx_leads_status on leads(status);

-- ─── Campaigns ─────────────────────────────────────────────────────────────

create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  type text not null check (type in ('content','email','social','webinar','event','referral')),
  channel text not null,
  area text not null,
  status text default 'draft' check (status in ('draft','active','paused','completed')),
  start_date timestamptz,
  end_date timestamptz,
  budget bigint default 0,
  oab_compliant boolean default true,
  metrics jsonb default '{"impressions":0,"clicks":0,"leads":0,"conversions":0,"roi":0,"engagement":0}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_campaigns_user on campaigns(user_id);

-- ─── Content Items ─────────────────────────────────────────────────────────

create table if not exists content_items (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text default '',
  area text not null,
  channel text not null,
  status text default 'idea' check (status in ('idea','draft','review','approved','published')),
  scheduled_date timestamptz,
  published_date timestamptz,
  content text default '',
  oab_compliant boolean default true,
  campaign_id uuid references campaigns(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── KPIs ──────────────────────────────────────────────────────────────────

create table if not exists kpis (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  category text not null check (category in ('revenue','productivity','client','operations')),
  value real default 0,
  target real default 0,
  unit text default '',
  period text default ''
);

-- ─── SELEM Assessments ─────────────────────────────────────────────────────

create table if not exists selem_assessments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  pillar text not null check (pillar in ('synergy','strategy','leadership','education','mastery')),
  score real not null,
  notes text default '',
  date timestamptz not null,
  action_items text[] default '{}'
);

-- ─── Leadership Pipeline ───────────────────────────────────────────────────

create table if not exists leadership_pipeline (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  level text not null check (level in ('junior_associate','senior_associate','partner','managing_partner')),
  years_experience integer default 0,
  skills text[] default '{}',
  development_goals text[] default '{}',
  target_hours real default 0,
  billed_hours real default 0,
  revenue_generated real default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Legal Canvas ──────────────────────────────────────────────────────────

create table if not exists legal_canvas (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  firm_name text default '',
  mission text default '',
  vision text default '',
  values text[] default '{}',
  practice_areas text[] default '{}',
  target_clients text[] default '{}',
  channels text[] default '{}',
  revenue text[] default '{}',
  costs text[] default '{}',
  partnerships text[] default '{}',
  competitive_advantage text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Scaling Up Plans ──────────────────────────────────────────────────────

create table if not exists scaling_up_plans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  people text[] default '{}',
  strategy text[] default '{}',
  execution text[] default '{}',
  cash text[] default '{}',
  quarterly_priorities text[] default '{}',
  annual_goals text[] default '{}',
  bhag text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Row Level Security ────────────────────────────────────────────────────

alter table leads enable row level security;
alter table campaigns enable row level security;
alter table content_items enable row level security;
alter table kpis enable row level security;
alter table selem_assessments enable row level security;
alter table leadership_pipeline enable row level security;
alter table legal_canvas enable row level security;
alter table scaling_up_plans enable row level security;

create policy "Users see own leads" on leads for all using (true);
create policy "Users see own campaigns" on campaigns for all using (true);
create policy "Users see own content" on content_items for all using (true);
create policy "Users see own kpis" on kpis for all using (true);
create policy "Users see own selem" on selem_assessments for all using (true);
create policy "Users see own leadership" on leadership_pipeline for all using (true);
create policy "Users see own canvas" on legal_canvas for all using (true);
create policy "Users see own scaling" on scaling_up_plans for all using (true);

-- ─── Triggers ──────────────────────────────────────────────────────────────

create trigger tr_leads_updated before update on leads for each row execute function update_updated_at();
create trigger tr_campaigns_updated before update on campaigns for each row execute function update_updated_at();
create trigger tr_content_items_updated before update on content_items for each row execute function update_updated_at();
create trigger tr_leadership_updated before update on leadership_pipeline for each row execute function update_updated_at();
create trigger tr_canvas_updated before update on legal_canvas for each row execute function update_updated_at();
create trigger tr_scaling_updated before update on scaling_up_plans for each row execute function update_updated_at();
