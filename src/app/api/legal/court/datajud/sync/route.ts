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
//   404  Process not found in DataJud
//   503  DATAJUD_API_KEY not configured
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorized, badRequest, serverError } from '@/lib/api-utils';
import { getMovements, DataJudError } from '@/lib/court/datajud';
import { isValidCNJ } from '@/lib/court/cnj-utils';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  // Auth check
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

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

  const apiKey = process.env.DATAJUD_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: 'DATAJUD_API_KEY not configured',
        message: 'The DataJud API key is not set on the server.',
      },
      { status: 503 },
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

    if (datajudMovements.length === 0) {
      return NextResponse.json({
        success: true,
        synced: 0,
        movements: [],
        message: 'No new movements found in DataJud.',
      });
    }

    // 2. Fetch existing movements for deduplication
    const supabase = createServerClient();
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
    if (insertError) {
      console.error('Failed to insert DataJud movements:', insertError);
      return serverError('Failed to save movements to database');
    }

    // 5. Update the process last_sync_at timestamp
    await supabase
      .from('processes')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', processId)
      .eq('user_id', user.id);

    return NextResponse.json({
      success: true,
      synced: newMovements.length,
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
    console.error('DataJud sync error:', error);
    return serverError();
  }
}
