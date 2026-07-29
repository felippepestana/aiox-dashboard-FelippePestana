// =============================================================================
// POST /api/legal/court/datajud/sync
// Sync DataJud movements for an existing process into the database.
//
// Body:
//   { processId: string; cnj: string; since?: string }
//
// Responses:
//   200  { success: true, synced: number, movements: ProcessMovement[] }
//   400  Missing or invalid parameters
//   401  Unauthenticated
//   402  Plan does not include the DataJud integration
//   403  Process does not belong to the authenticated user
//   404  Process not found in DataJud
//   503  DATAJUD_API_KEY not configured
// =============================================================================

import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorized, badRequest, serverError } from '@/lib/api-utils';
import { getMovements, getDatajudApiKey, DATAJUD_NOT_CONFIGURED_MESSAGE, DataJudError } from '@/lib/court/datajud';
import { isValidCNJ } from '@/lib/court/cnj-utils';
import { createServerClient } from '@/lib/supabase';
import { hasActiveFeature, PLAN_FEATURE_REQUIRED_MESSAGE } from '@/lib/plan-access';

/**
 * POST /api/legal/court/datajud/sync — fetches DataJud movements for a process,
 * inserts only the new ones into the movements table, and updates last_sync_at.
 */
export async function POST(request: NextRequest) {
  // Auth check
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  // Paid-module gate: datajud_integration requires an active Professional+ subscription
  if (!(await hasActiveFeature(user.id, 'datajud_integration'))) {
    return NextResponse.json({ error: PLAN_FEATURE_REQUIRED_MESSAGE }, { status: 402 });
  }

  // Parse body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest('Invalid request body');
  }

  const { processId, cnj, since } = body as {
    processId?: string;
    cnj?: string;
    since?: string;
  };

  if (!processId || typeof processId !== 'string') {
    return badRequest('processId is required');
  }
  if (!cnj || typeof cnj !== 'string') {
    return badRequest('cnj is required');
  }
  if (!isValidCNJ(cnj)) {
    return NextResponse.json(
      {
        error: 'Invalid CNJ format',
        message: `"${cnj}" does not match the expected format: NNNNNNN-DD.AAAA.J.TR.OOOO`,
      },
      { status: 400 },
    );
  }

  const apiKey = getDatajudApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'DATAJUD_API_KEY not configured', message: DATAJUD_NOT_CONFIGURED_MESSAGE },
      { status: 503 },
    );
  }

  // Ownership check BEFORE any external call or write: the service-role
  // client bypasses RLS and processId is caller-controlled — without this,
  // any subscriber could inject movements into another tenant's process.
  const supabase = createServerClient();
  const { data: ownedProcess, error: ownedError } = await supabase
    .from('processes')
    .select('id')
    .eq('id', processId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (ownedError) {
    Sentry.captureException(ownedError);
    return serverError('Failed to verify process ownership');
  }
  if (!ownedProcess) {
    return NextResponse.json(
      { error: 'Processo não encontrado ou não pertence ao usuário' },
      { status: 403 },
    );
  }

  try {
    // 1. Fetch latest movements from DataJud
    const datajudMovements = await getMovements(
      cnj,
      apiKey,
      processId,
      typeof since === 'string' ? since : undefined,
    );

    // Marks the process linked and stamps the sync time — also on successful
    // no-op syncs (found in DataJud, nothing new to insert). A failure here is
    // reported to Sentry but does not fail the request: the movements are
    // already persisted, and the stamp self-heals on the next sync.
    const markLinked = async () => {
      const { error: linkError } = await supabase
        .from('processes')
        .update({ last_sync_at: new Date().toISOString(), datajud_linked: true })
        .eq('id', processId)
        .eq('user_id', user.id);
      if (linkError) {
        Sentry.captureMessage(
          `Failed to stamp datajud_linked for process ${processId}: ${linkError.message}`,
          'warning',
        );
      }
    };

    if (datajudMovements.length === 0) {
      await markLinked();
      return NextResponse.json({
        success: true,
        synced: 0,
        movements: [],
        message: 'No new movements found in DataJud.',
      });
    }

    // 2. Fetch existing movements for deduplication
    const { data: existing } = await supabase
      .from('movements')
      .select('type, date')
      .eq('process_id', processId)
      .eq('source', 'datajud');

    const existingKeys = new Set(
      (existing || []).map((m: { type: string; date: string }) => `${m.type}-${m.date}`),
    );

    // 3. Filter to new movements only
    const newMovements = datajudMovements.filter(
      (m) => !existingKeys.has(`${m.type}-${m.date}`),
    );

    if (newMovements.length === 0) {
      await markLinked();
      return NextResponse.json({
        success: true,
        synced: 0,
        movements: datajudMovements,
        message: 'All movements are already up to date.',
      });
    }

    // 4. Insert new movements into the database
    const rows = newMovements.map((m) => ({
      process_id:  processId,
      type:        m.type,
      title:       m.description,
      description: m.description,
      date:        m.date,
      source:      'datajud' as const,
      is_read:     false,
    }));

    const { error: insertError } = await supabase.from('movements').insert(rows);

    let syncedCount = insertError ? 0 : newMovements.length;

    // 23505 = unique violation on the dedup index: a concurrent sync won the
    // race for at least one row. The batch insert is atomic, so genuinely new
    // rows rolled back too — re-read what now exists and retry the remainder.
    if (insertError && insertError.code === '23505') {
      const { data: nowExisting } = await supabase
        .from('movements')
        .select('type, date')
        .eq('process_id', processId)
        .eq('source', 'datajud');
      const nowKeys = new Set(
        (nowExisting || []).map((m: { type: string; date: string }) => `${m.type}-${m.date}`),
      );
      const remainder = rows.filter((r) => !nowKeys.has(`${r.type}-${r.date}`));
      if (remainder.length > 0) {
        const { error: retryError } = await supabase.from('movements').insert(remainder);
        if (retryError) {
          // Rows genuinely new are still missing — this is a failed sync, not
          // an up-to-date process; do not mark it linked.
          Sentry.captureMessage(
            `DataJud dedup retry failed: ${retryError.message}`, 'error',
          );
          return serverError('Failed to save movements to database');
        }
        syncedCount = remainder.length;
      }
    } else if (insertError) {
      Sentry.captureMessage(`Failed to insert DataJud movements: ${insertError.message}`, 'error');
      console.error('Failed to insert DataJud movements:', insertError);
      return serverError('Failed to save movements to database');
    }

    // 5. Mark the process as linked and record the sync timestamp
    await markLinked();

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      movements: datajudMovements,
    });
  } catch (error) {
    if (error instanceof DataJudError) {
      const status = error.status ?? 500;
      if (status === 404) {
        return NextResponse.json(
          { error: 'Processo não encontrado no DataJud', cnj },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: status >= 400 && status < 600 ? status : 500 },
      );
    }
    Sentry.captureException(error);
    console.error('DataJud sync error:', error);
    return serverError();
  }
}
