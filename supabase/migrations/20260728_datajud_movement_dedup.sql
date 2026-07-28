-- =============================================================================
-- DataJud movement dedup — server-side safety net
-- =============================================================================
-- The app deduplicates synced movements by the `${type}-${date}` key before
-- inserting. This partial unique index enforces the same key per process for
-- source='datajud' only, so concurrent syncs cannot double-insert. Manual and
-- DJE movements are unaffected (they may legitimately repeat and can have a
-- NULL type). Insert paths treat error 23505 as "already synced".

CREATE UNIQUE INDEX IF NOT EXISTS uq_movements_datajud_dedup
  ON movements (process_id, type, date)
  WHERE source = 'datajud';
