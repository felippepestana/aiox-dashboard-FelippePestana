-- =============================================================================
-- DataJud movement dedup — server-side safety net
-- =============================================================================
-- The app deduplicates synced movements by the `${type}-${date}` key before
-- inserting. This partial unique index enforces the same key per process for
-- source='datajud' only, so concurrent syncs cannot double-insert. Manual and
-- DJE movements are unaffected (they may legitimately repeat and can have a
-- NULL type). Insert paths treat error 23505 by retrying the non-conflicting
-- remainder.

-- Backfill: earlier syncs did unprotected read-then-insert, so historical
-- duplicates may exist and would abort the unique index build. Keep the
-- oldest row of each (process_id, type, date) group and drop the rest.
DELETE FROM movements m
USING movements dup
WHERE m.source = 'datajud'
  AND dup.source = 'datajud'
  AND m.process_id = dup.process_id
  AND m.type = dup.type
  AND m.date = dup.date
  AND m.ctid > dup.ctid;

-- Not CONCURRENTLY: the Supabase migration runner wraps each file in a
-- transaction (CREATE INDEX CONCURRENTLY cannot run inside one), and the
-- movements table is small at this stage — the brief write lock is acceptable.
CREATE UNIQUE INDEX IF NOT EXISTS uq_movements_datajud_dedup
  ON movements (process_id, type, date)
  WHERE source = 'datajud';
