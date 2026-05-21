-- AIOX Legal Performance — Supabase Database Schema
-- Execute this in Supabase SQL Editor (Dashboard → SQL Editor → New query)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Users / Profiles ───────────────────────────────────────────────────────

create table if not exists profiles (
  id uuid primary key default uuid_generate_v4(),
  email text unique not null,
  name text not null,
  oab text,
  phone text,
  role text default 'lawyer' check (role in ('admin', 'lawyer', 'intern', 'secretary')),
  firm_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Clients ────────────────────────────────────────────────────────────────

create table if not exists clients (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null check (type in ('pf', 'pj')),
  name text not null,
  cpf_cnpj text,
  email text,
  phone text,
  whatsapp text,
  address jsonb default '{}',
  notes text default '',
  lead_source text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_clients_user on clients(user_id);
create index idx_clients_cpf on clients(cpf_cnpj);

-- ─── Processes ──────────────────────────────────────────────────────────────

create table if not exists processes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  cnj text,
  title text not null,
  area text not null,
  court text,
  judge text,
  vara text,
  comarca text,
  state text,
  opposing_party text,
  opposing_lawyer text,
  status text default 'active' check (status in ('active','archived','suspended','closed','won','lost','settled')),
  urgency text default 'medium' check (urgency in ('critical','high','medium','low')),
  court_system text default 'manual',
  object text,
  cause_value bigint default 0,
  fee_type text default 'fixed',
  fee_amount bigint default 0,
  contingency_pct real,
  tags text[] default '{}',
  datajud_linked boolean default false,
  last_sync_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_processes_user on processes(user_id);
create index idx_processes_cnj on processes(cnj);
create index idx_processes_client on processes(client_id);
create index idx_processes_status on processes(status);

-- ─── Deadlines ──────────────────────────────────────────────────────────────

create table if not exists deadlines (
  id uuid primary key default uuid_generate_v4(),
  process_id uuid references processes(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  title text not null,
  type text not null check (type in ('fatal','judicial','internal','hearing','mediation')),
  due_date timestamptz not null,
  reminder_days integer[] default '{3,1}',
  status text default 'pending' check (status in ('pending','completed','missed','extended')),
  assigned_to text,
  notes text default '',
  created_at timestamptz default now()
);

create index idx_deadlines_process on deadlines(process_id);
create index idx_deadlines_due on deadlines(due_date);
create index idx_deadlines_status on deadlines(status);

-- ─── Petitions ──────────────────────────────────────────────────────────────

create table if not exists petitions (
  id uuid primary key default uuid_generate_v4(),
  process_id uuid references processes(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  status text default 'draft' check (status in ('draft','review','approved','filed','rejected')),
  content text default '',
  template_id text,
  filed_at timestamptz,
  protocol_number text,
  court_system text,
  ai_model text,
  ai_cost real,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_petitions_process on petitions(process_id);

-- ─── Movements ──────────────────────────────────────────────────────────────

create table if not exists movements (
  id uuid primary key default uuid_generate_v4(),
  process_id uuid references processes(id) on delete cascade,
  date timestamptz not null,
  description text not null,
  type text,
  source text default 'manual' check (source in ('manual','dje','pje','datajud','esaj','eproc')),
  is_read boolean default false,
  created_at timestamptz default now()
);

create index idx_movements_process on movements(process_id);
create index idx_movements_date on movements(date);

-- ─── Honorarios ─────────────────────────────────────────────────────────────

create table if not exists honorarios (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  process_id uuid references processes(id) on delete set null,
  type text not null check (type in ('contractual','sucumbencial','ad_exitum','pro_bono')),
  amount bigint not null,
  installments integer default 1,
  paid_installments integer default 0,
  contract_date timestamptz,
  due_day integer default 10,
  status text default 'active' check (status in ('active','completed','defaulted','cancelled')),
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Transactions ───────────────────────────────────────────────────────────

create table if not exists transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  type text not null check (type in ('income','expense')),
  category text not null,
  amount bigint not null,
  description text,
  date timestamptz not null,
  process_id uuid references processes(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  honorario_id uuid references honorarios(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_transactions_date on transactions(date);
create index idx_transactions_user on transactions(user_id);

-- ─── AI Usage Tracking ──────────────────────────────────────────────────────

create table if not exists ai_usage (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  task_type text not null,
  model text not null,
  complexity text not null,
  tokens_used integer not null,
  cost_usd real not null,
  duration_ms integer,
  created_at timestamptz default now()
);

create index idx_ai_usage_user on ai_usage(user_id);
create index idx_ai_usage_date on ai_usage(created_at);

-- ─── Documents ──────────────────────────────────────────────────────────────

create table if not exists documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) on delete cascade,
  process_id uuid references processes(id) on delete set null,
  name text not null,
  type text,
  size bigint,
  storage_path text,
  analysis jsonb,
  created_at timestamptz default now()
);

-- ─── Row Level Security ─────────────────────────────────────────────────────

alter table profiles enable row level security;
alter table clients enable row level security;
alter table processes enable row level security;
alter table deadlines enable row level security;
alter table petitions enable row level security;
alter table movements enable row level security;
alter table honorarios enable row level security;
alter table transactions enable row level security;
alter table ai_usage enable row level security;
alter table documents enable row level security;

-- Policies: each user sees only their own data
create policy "Users see own profile" on profiles for all using (true);
create policy "Users see own clients" on clients for all using (user_id = auth.uid());
create policy "Users see own processes" on processes for all using (user_id = auth.uid());
create policy "Users see own deadlines" on deadlines for all using (user_id = auth.uid());
create policy "Users see own petitions" on petitions for all using (user_id = auth.uid());
create policy "Users see own movements" on movements for all using (
  process_id in (select id from processes where user_id = auth.uid())
);
create policy "Users see own honorarios" on honorarios for all using (user_id = auth.uid());
create policy "Users see own transactions" on transactions for all using (user_id = auth.uid());
create policy "Users see own ai_usage" on ai_usage for all using (user_id = auth.uid());
create policy "Users see own documents" on documents for all using (user_id = auth.uid());

-- ─── Updated_at Trigger ─────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger tr_profiles_updated before update on profiles for each row execute function update_updated_at();
create trigger tr_clients_updated before update on clients for each row execute function update_updated_at();
create trigger tr_processes_updated before update on processes for each row execute function update_updated_at();
create trigger tr_petitions_updated before update on petitions for each row execute function update_updated_at();
create trigger tr_honorarios_updated before update on honorarios for each row execute function update_updated_at();
