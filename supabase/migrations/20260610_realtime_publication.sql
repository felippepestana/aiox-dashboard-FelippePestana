-- Supabase Realtime only emits postgres_changes for tables added to the
-- supabase_realtime publication. use-realtime-notifications.ts subscribes to
-- processes (UPDATE), deadlines (INSERT) and profiles (UPDATE) — without this
-- migration those subscriptions stay permanently silent on any project
-- provisioned from the repo's migrations.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

-- ADD TABLE errors when the table is already in the publication — guard each.
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE processes;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE deadlines;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- The notification hook compares old vs new subscription_status on profile
-- UPDATEs; with the default replica identity the 'old' record only carries
-- the primary key, making that comparison always fire.
ALTER TABLE profiles REPLICA IDENTITY FULL;
