-- Add Mercado Pago subscription fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mp_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS subscription_preapproval_id text,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_mp_customer ON profiles(mp_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_status);

-- ─── Protect billing columns from self-service edits ─────────────────────────
-- The "Users can CRUD own profile" RLS policy is FOR ALL on the user's own
-- row, so without this guard any signed-in browser client could set
-- subscription_status='active' / subscription_plan='enterprise' directly and
-- bypass Mercado Pago entirely. Billing fields may only change through the
-- service role (webhook / server routes).
CREATE OR REPLACE FUNCTION prevent_subscription_self_update()
RETURNS trigger AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      -- A fresh row must not be born with paid-tier values (the profiles
      -- policy is FOR ALL, so users can INSERT their own row directly).
      IF COALESCE(NEW.subscription_status, 'free') IS DISTINCT FROM 'free' OR
         COALESCE(NEW.subscription_plan, 'starter') IS DISTINCT FROM 'starter' OR
         NEW.subscription_preapproval_id IS NOT NULL OR
         NEW.subscription_current_period_end IS NOT NULL OR
         NEW.mp_customer_id IS NOT NULL THEN
        RAISE EXCEPTION 'subscription fields can only be set by the service role';
      END IF;
    ELSIF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status OR
          NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan OR
          NEW.subscription_preapproval_id IS DISTINCT FROM OLD.subscription_preapproval_id OR
          NEW.subscription_current_period_end IS DISTINCT FROM OLD.subscription_current_period_end OR
          NEW.mp_customer_id IS DISTINCT FROM OLD.mp_customer_id THEN
      RAISE EXCEPTION 'subscription fields can only be updated by the service role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_protect_subscription ON profiles;
CREATE TRIGGER tr_profiles_protect_subscription
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_subscription_self_update();
