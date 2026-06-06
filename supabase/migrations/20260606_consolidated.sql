-- =============================================================================
-- AIOX Legal Performance — Consolidated Migration
-- Merges schema.sql + schema-v2.sql into a single idempotent migration
-- =============================================================================

-- ─── Extensions ─────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── updated_at Trigger Function ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- ─── Profiles ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text UNIQUE NOT NULL,
  name        text NOT NULL,
  role        text NOT NULL DEFAULT 'lawyer'
                CHECK (role IN ('admin', 'lawyer', 'intern', 'secretary')),
  office_name text,
  oab         text,
  state       text,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS tr_profiles_updated ON profiles;
CREATE TRIGGER tr_profiles_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own profile" ON profiles;
CREATE POLICY "Users can CRUD own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- ─── Clients ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS clients (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name       text NOT NULL,
  type       text NOT NULL CHECK (type IN ('pf', 'pj')),
  cpf_cnpj   text,
  email      text,
  phone      text,
  address    jsonb DEFAULT '{}',
  notes      text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_user_id   ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj  ON clients(cpf_cnpj);

DROP TRIGGER IF EXISTS tr_clients_updated ON clients;
CREATE TRIGGER tr_clients_updated
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own clients" ON clients;
CREATE POLICY "Users can CRUD own clients" ON clients
  FOR ALL USING (auth.uid() = user_id);

-- ─── Processes ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS processes (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id         uuid REFERENCES clients(id) ON DELETE SET NULL,
  cnj               text UNIQUE,
  title             text NOT NULL,
  area              text NOT NULL,
  court             text,
  judge             text,
  vara              text,
  comarca           text,
  state             text,
  opposing_party    text,
  opposing_lawyer   text,
  status            text NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active', 'suspended', 'archived', 'closed')),
  urgency           text NOT NULL DEFAULT 'media'
                      CHECK (urgency IN ('alta', 'media', 'baixa')),
  value_cents       bigint DEFAULT 0,
  distribution_date date,
  object            text,
  tags              text[] DEFAULT '{}',
  datajud_linked    boolean DEFAULT false,
  last_sync_at      timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_processes_user_id   ON processes(user_id);
CREATE INDEX IF NOT EXISTS idx_processes_client_id ON processes(client_id);
CREATE INDEX IF NOT EXISTS idx_processes_cnj       ON processes(cnj);
CREATE INDEX IF NOT EXISTS idx_processes_status    ON processes(status);

DROP TRIGGER IF EXISTS tr_processes_updated ON processes;
CREATE TRIGGER tr_processes_updated
  BEFORE UPDATE ON processes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE processes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own processes" ON processes;
CREATE POLICY "Users can CRUD own processes" ON processes
  FOR ALL USING (auth.uid() = user_id);

-- ─── Deadlines ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deadlines (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  process_id   uuid REFERENCES processes(id) ON DELETE CASCADE,
  title        text NOT NULL,
  description  text DEFAULT '',
  due_date     timestamptz NOT NULL,
  type         text NOT NULL CHECK (type IN ('fatal', 'ordinario', 'audiencia')),
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'completed', 'overdue')),
  completed_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deadlines_user_id    ON deadlines(user_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_process_id ON deadlines(process_id);
CREATE INDEX IF NOT EXISTS idx_deadlines_due_date   ON deadlines(due_date);
CREATE INDEX IF NOT EXISTS idx_deadlines_status     ON deadlines(status);

ALTER TABLE deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own deadlines" ON deadlines;
CREATE POLICY "Users can CRUD own deadlines" ON deadlines
  FOR ALL USING (auth.uid() = user_id);

-- ─── Petitions ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS petitions (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  process_id uuid REFERENCES processes(id) ON DELETE CASCADE,
  title      text NOT NULL,
  type       text NOT NULL,
  content    text DEFAULT '',
  status     text NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'review', 'final')),
  filed_at   timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_petitions_user_id    ON petitions(user_id);
CREATE INDEX IF NOT EXISTS idx_petitions_process_id ON petitions(process_id);

DROP TRIGGER IF EXISTS tr_petitions_updated ON petitions;
CREATE TRIGGER tr_petitions_updated
  BEFORE UPDATE ON petitions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE petitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own petitions" ON petitions;
CREATE POLICY "Users can CRUD own petitions" ON petitions
  FOR ALL USING (auth.uid() = user_id);

-- ─── Movements ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS movements (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  process_id  uuid NOT NULL REFERENCES processes(id) ON DELETE CASCADE,
  type        text,
  title       text NOT NULL,
  description text DEFAULT '',
  date        timestamptz NOT NULL,
  tribunal    text,
  author      text,
  source      text DEFAULT 'manual'
                CHECK (source IN ('manual', 'dje', 'pje', 'datajud', 'esaj', 'eproc')),
  is_read     boolean DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_movements_process_id ON movements(process_id);
CREATE INDEX IF NOT EXISTS idx_movements_date       ON movements(date);

ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own movements" ON movements;
CREATE POLICY "Users can CRUD own movements" ON movements
  FOR ALL USING (
    process_id IN (SELECT id FROM processes WHERE user_id = auth.uid())
  );

-- ─── Financial Transactions ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS financial_transactions (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  process_id  uuid REFERENCES processes(id) ON DELETE SET NULL,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  type        text NOT NULL CHECK (type IN ('income', 'expense')),
  category    text NOT NULL,
  description text,
  amount_cents bigint NOT NULL,
  date        timestamptz NOT NULL,
  status      text NOT NULL DEFAULT 'paid'
                CHECK (status IN ('paid', 'pending', 'overdue')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_id    ON financial_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_process_id ON financial_transactions(process_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_client_id  ON financial_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date       ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status     ON financial_transactions(status);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own financial_transactions" ON financial_transactions;
CREATE POLICY "Users can CRUD own financial_transactions" ON financial_transactions
  FOR ALL USING (auth.uid() = user_id);

-- ─── Honorarios ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS honorarios (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id   uuid REFERENCES clients(id) ON DELETE SET NULL,
  process_id  uuid REFERENCES processes(id) ON DELETE SET NULL,
  type        text NOT NULL CHECK (type IN ('fixed', 'hourly', 'success', 'contingency')),
  value_cents bigint NOT NULL,
  status      text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'paid', 'overdue', 'cancelled')),
  due_date    date,
  paid_at     timestamptz,
  notes       text DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_honorarios_user_id    ON honorarios(user_id);
CREATE INDEX IF NOT EXISTS idx_honorarios_client_id  ON honorarios(client_id);
CREATE INDEX IF NOT EXISTS idx_honorarios_process_id ON honorarios(process_id);
CREATE INDEX IF NOT EXISTS idx_honorarios_status     ON honorarios(status);
CREATE INDEX IF NOT EXISTS idx_honorarios_due_date   ON honorarios(due_date);

DROP TRIGGER IF EXISTS tr_honorarios_updated ON honorarios;
CREATE TRIGGER tr_honorarios_updated
  BEFORE UPDATE ON honorarios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE honorarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own honorarios" ON honorarios;
CREATE POLICY "Users can CRUD own honorarios" ON honorarios
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- MARKETING & STRATEGY TABLES  (from schema-v2.sql)
-- =============================================================================

-- ─── Leads ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  email                text,
  phone                text,
  area                 text NOT NULL,
  source               text,
  status               text DEFAULT 'prospect'
                         CHECK (status IN ('prospect','qualified','contacted','proposal','retained','lost')),
  notes                text DEFAULT '',
  assigned_to          text,
  converted_client_id  uuid REFERENCES clients(id) ON DELETE SET NULL,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status  ON leads(status);

DROP TRIGGER IF EXISTS tr_leads_updated ON leads;
CREATE TRIGGER tr_leads_updated
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own leads" ON leads;
CREATE POLICY "Users can CRUD own leads" ON leads
  FOR ALL USING (auth.uid() = user_id);

-- ─── Campaigns ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaigns (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          text NOT NULL,
  type          text NOT NULL CHECK (type IN ('content','email','social','webinar','event','referral')),
  channel       text NOT NULL,
  area          text NOT NULL,
  status        text DEFAULT 'draft' CHECK (status IN ('draft','active','paused','completed')),
  start_date    timestamptz,
  end_date      timestamptz,
  budget        bigint DEFAULT 0,
  oab_compliant boolean DEFAULT true,
  metrics       jsonb DEFAULT '{"impressions":0,"clicks":0,"leads":0,"conversions":0,"roi":0,"engagement":0}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);

DROP TRIGGER IF EXISTS tr_campaigns_updated ON campaigns;
CREATE TRIGGER tr_campaigns_updated
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own campaigns" ON campaigns;
CREATE POLICY "Users can CRUD own campaigns" ON campaigns
  FOR ALL USING (auth.uid() = user_id);

-- ─── Content Items ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_items (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text DEFAULT '',
  area           text NOT NULL,
  channel        text NOT NULL,
  status         text DEFAULT 'idea'
                   CHECK (status IN ('idea','draft','review','approved','published')),
  scheduled_date timestamptz,
  published_date timestamptz,
  content        text DEFAULT '',
  oab_compliant  boolean DEFAULT true,
  campaign_id    uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_items_user_id ON content_items(user_id);

DROP TRIGGER IF EXISTS tr_content_items_updated ON content_items;
CREATE TRIGGER tr_content_items_updated
  BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own content_items" ON content_items;
CREATE POLICY "Users can CRUD own content_items" ON content_items
  FOR ALL USING (auth.uid() = user_id);

-- ─── KPIs ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kpis (
  id       uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name     text NOT NULL,
  category text NOT NULL CHECK (category IN ('revenue','productivity','client','operations')),
  value    real DEFAULT 0,
  target   real DEFAULT 0,
  unit     text DEFAULT '',
  period   text DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_kpis_user_id ON kpis(user_id);

ALTER TABLE kpis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own kpis" ON kpis;
CREATE POLICY "Users can CRUD own kpis" ON kpis
  FOR ALL USING (auth.uid() = user_id);

-- ─── SELEM Assessments ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS selem_assessments (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pillar       text NOT NULL CHECK (pillar IN ('synergy','strategy','leadership','education','mastery')),
  score        real NOT NULL,
  notes        text DEFAULT '',
  date         timestamptz NOT NULL,
  action_items text[] DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_selem_assessments_user_id ON selem_assessments(user_id);

ALTER TABLE selem_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own selem_assessments" ON selem_assessments;
CREATE POLICY "Users can CRUD own selem_assessments" ON selem_assessments
  FOR ALL USING (auth.uid() = user_id);

-- ─── Leadership Pipeline ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leadership_pipeline (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name              text NOT NULL,
  level             text NOT NULL
                      CHECK (level IN ('junior_associate','senior_associate','partner','managing_partner')),
  years_experience  integer DEFAULT 0,
  skills            text[] DEFAULT '{}',
  development_goals text[] DEFAULT '{}',
  target_hours      real DEFAULT 0,
  billed_hours      real DEFAULT 0,
  revenue_generated real DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leadership_pipeline_user_id ON leadership_pipeline(user_id);

DROP TRIGGER IF EXISTS tr_leadership_updated ON leadership_pipeline;
CREATE TRIGGER tr_leadership_updated
  BEFORE UPDATE ON leadership_pipeline
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE leadership_pipeline ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own leadership_pipeline" ON leadership_pipeline;
CREATE POLICY "Users can CRUD own leadership_pipeline" ON leadership_pipeline
  FOR ALL USING (auth.uid() = user_id);

-- ─── Legal Canvas ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS legal_canvas (
  id                   uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  firm_name            text DEFAULT '',
  mission              text DEFAULT '',
  vision               text DEFAULT '',
  values               text[] DEFAULT '{}',
  practice_areas       text[] DEFAULT '{}',
  target_clients       text[] DEFAULT '{}',
  channels             text[] DEFAULT '{}',
  revenue              text[] DEFAULT '{}',
  costs                text[] DEFAULT '{}',
  partnerships         text[] DEFAULT '{}',
  competitive_advantage text[] DEFAULT '{}',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_legal_canvas_user_id ON legal_canvas(user_id);

DROP TRIGGER IF EXISTS tr_canvas_updated ON legal_canvas;
CREATE TRIGGER tr_canvas_updated
  BEFORE UPDATE ON legal_canvas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE legal_canvas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own legal_canvas" ON legal_canvas;
CREATE POLICY "Users can CRUD own legal_canvas" ON legal_canvas
  FOR ALL USING (auth.uid() = user_id);

-- ─── Scaling Up Plans ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS scaling_up_plans (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  people              text[] DEFAULT '{}',
  strategy            text[] DEFAULT '{}',
  execution           text[] DEFAULT '{}',
  cash                text[] DEFAULT '{}',
  quarterly_priorities text[] DEFAULT '{}',
  annual_goals        text[] DEFAULT '{}',
  bhag                text DEFAULT '',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scaling_up_plans_user_id ON scaling_up_plans(user_id);

DROP TRIGGER IF EXISTS tr_scaling_updated ON scaling_up_plans;
CREATE TRIGGER tr_scaling_updated
  BEFORE UPDATE ON scaling_up_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE scaling_up_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own scaling_up_plans" ON scaling_up_plans;
CREATE POLICY "Users can CRUD own scaling_up_plans" ON scaling_up_plans
  FOR ALL USING (auth.uid() = user_id);

-- =============================================================================
-- AI / DOCUMENT AUXILIARY TABLES  (retained from schema.sql)
-- =============================================================================

-- ─── AI Usage Tracking ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_usage (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  task_type   text NOT NULL,
  model       text NOT NULL,
  complexity  text NOT NULL,
  tokens_used integer NOT NULL,
  cost_usd    real NOT NULL,
  duration_ms integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id    ON ai_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own ai_usage" ON ai_usage;
CREATE POLICY "Users can CRUD own ai_usage" ON ai_usage
  FOR ALL USING (auth.uid() = user_id);

-- ─── Documents ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  process_id   uuid REFERENCES processes(id) ON DELETE SET NULL,
  name         text NOT NULL,
  type         text,
  size         bigint,
  storage_path text,
  analysis     jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id    ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_process_id ON documents(process_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own documents" ON documents;
CREATE POLICY "Users can CRUD own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);
