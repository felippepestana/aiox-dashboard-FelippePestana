-- Add Mercado Pago subscription fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS mp_customer_id text,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'starter',
  ADD COLUMN IF NOT EXISTS subscription_preapproval_id text,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_mp_customer ON profiles(mp_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON profiles(subscription_status);
