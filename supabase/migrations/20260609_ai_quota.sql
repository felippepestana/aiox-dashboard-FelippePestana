-- Atomic monthly AI-quota counter for free-tier users.
-- Counting ai_usage rows at request time is racy: concurrent requests all
-- read the same count and pass before any insert lands, letting a burst
-- exceed the advertised Starter cap. consume_ai_quota() reserves one unit
-- in a single statement (conditional upsert), so the cap holds under
-- concurrency.

CREATE TABLE IF NOT EXISTS ai_quota_counters (
  user_id uuid NOT NULL,
  month   date NOT NULL,
  count   integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, month)
);

-- Service-role only: RLS enabled with no policies denies anon/authenticated.
ALTER TABLE ai_quota_counters ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION consume_ai_quota(p_user_id uuid, p_limit integer)
RETURNS boolean AS $$
DECLARE
  v_month date := date_trunc('month', now())::date;
  v_count integer;
BEGIN
  INSERT INTO ai_quota_counters (user_id, month, count)
  VALUES (p_user_id, v_month, 1)
  ON CONFLICT (user_id, month)
  DO UPDATE SET count = ai_quota_counters.count + 1
    WHERE ai_quota_counters.count < p_limit
  RETURNING count INTO v_count;

  -- No row returned means the conditional update was skipped: quota exhausted
  RETURN v_count IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
