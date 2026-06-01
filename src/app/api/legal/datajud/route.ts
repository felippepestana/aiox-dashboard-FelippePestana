// =============================================================================
// /api/legal/datajud
// DataJud synchronization API route
// =============================================================================
//
// GET  ?cnj=XXXXX            → search DataJud for a single process by CNJ
// POST { processId, cnj }    → sync movements for a process into Supabase
// POST { processIds: [...] } → bulk sync movements for multiple processes
// =============================================================================

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { searchByCNJ, getMovements, DataJudError } from '@/lib/court/datajud';
import { isValidCNJ } from '@/lib/court/cnj-utils';
import type { ProcessMovement } from '@/types/legal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function requireApiKey(): string | null {
  return process.env.DATAJUD_API_KEY || null;
}

// ─── GET — search for a process by CNJ ───────────────────────────────────────

/**
 * GET /api/legal/datajud?cnj=NNNNNNN-DD.AAAA.J.TR.OOOO
 *
 * Searches DataJud for the given CNJ and returns process metadata.
 * Does NOT write anything to the database.
 *
 * Query params:
 *   cnj  (required)  CNJ process number
 *
 * Response 200:
 *   { success: true, data: DataJudProcessInfo, movements: ProcessMovement[] }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cnj = searchParams.get('cnj');

  if (!cnj) {
    return NextResponse.json(
      { error: 'Parâmetro obrigatório ausente: cnj' },
      { status: 400 },
    );
  }

  if (!isValidCNJ(cnj)) {
    return NextResponse.json(
      {
        error: 'Formato de CNJ inválido',
        message: `"${cnj}" não corresponde ao padrão NNNNNNN-DD.AAAA.J.TR.OOOO`,
      },
      { status: 400 },
    );
  }

  const apiKey = requireApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'DATAJUD_API_KEY não configurada no servidor' },
      { status: 503 },
    );
  }

  try {
    const processInfo = await searchByCNJ(cnj, apiKey);

    if (!processInfo) {
      return NextResponse.json(
        {
          error: 'Processo não encontrado',
          cnj,
          message: `Nenhum processo encontrado com CNJ ${cnj} no DataJud.`,
        },
        { status: 404 },
      );
    }

    // Also fetch movements; use the CNJ as processId placeholder
    let movements: ProcessMovement[] = [];
    try {
      movements = await getMovements(cnj, apiKey, cnj);
    } catch {
      // Non-fatal — return meta without movements
    }

    return NextResponse.json({
      success: true,
      data: processInfo,
      movements,
    });
  } catch (error) {
    if (error instanceof DataJudError) {
      const status = error.status ?? 500;
      return NextResponse.json(
        { error: error.message },
        { status: status >= 400 && status < 600 ? status : 500 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 },
    );
  }
}

// ─── POST — sync movements into Supabase ─────────────────────────────────────

/**
 * POST /api/legal/datajud
 *
 * Fetches movements from DataJud and persists new ones into the `movements`
 * Supabase table. Already-existing movements (matched by the datajud ID
 * stored in the description prefix) are skipped.
 *
 * Body variants:
 *   { processId: string; cnj: string; since?: string }
 *     → sync a single process
 *
 *   { processIds: Array<{ processId: string; cnj: string }>; since?: string }
 *     → bulk sync multiple processes
 *
 * Response 200:
 *   {
 *     success: true,
 *     synced: number,              // total new movements inserted
 *     results: SyncResult[]        // per-process breakdown
 *   }
 */
export async function POST(request: Request) {
  const apiKey = requireApiKey();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'DATAJUD_API_KEY não configurada no servidor' },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 });
  }

  // Build the list of processes to sync
  type SyncTarget = { processId: string; cnj: string };
  let targets: SyncTarget[] = [];

  if (body.processIds && Array.isArray(body.processIds)) {
    // Bulk mode
    targets = (body.processIds as SyncTarget[]).filter(
      (t) => t.processId && t.cnj && isValidCNJ(t.cnj),
    );
    if (targets.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum processo válido fornecido em processIds' },
        { status: 400 },
      );
    }
  } else if (body.processId && body.cnj) {
    // Single mode
    const cnj = body.cnj as string;
    if (!isValidCNJ(cnj)) {
      return NextResponse.json(
        {
          error: 'Formato de CNJ inválido',
          message: `"${cnj}" não corresponde ao padrão NNNNNNN-DD.AAAA.J.TR.OOOO`,
        },
        { status: 400 },
      );
    }
    targets = [{ processId: body.processId as string, cnj }];
  } else {
    return NextResponse.json(
      {
        error: 'Parâmetros obrigatórios ausentes',
        message: 'Forneça { processId, cnj } ou { processIds: [{ processId, cnj }] }',
      },
      { status: 400 },
    );
  }

  const since = typeof body.since === 'string' ? body.since : undefined;

  // ─── Process each target ─────────────────────────────────────────────────

  interface SyncResult {
    processId: string;
    cnj: string;
    newMovements: number;
    error?: string;
  }

  const results: SyncResult[] = [];
  let totalSynced = 0;

  for (const target of targets) {
    try {
      // 1. Fetch movements from DataJud
      const datajudMovements = await getMovements(
        target.cnj,
        apiKey,
        target.processId,
        since,
      );

      if (datajudMovements.length === 0) {
        results.push({ processId: target.processId, cnj: target.cnj, newMovements: 0 });
        continue;
      }

      // 2. Load existing movements for this process from Supabase
      const { data: existing } = await supabase
        .from('movements')
        .select('id, type, date')
        .eq('process_id', target.processId)
        .eq('source', 'datajud');

      const existingKeys = new Set(
        (existing || []).map((m) => `${m.type}-${m.date}`),
      );

      // 3. Filter to new movements only
      const newMovements = datajudMovements.filter(
        (m) => !existingKeys.has(`${m.type}-${m.date}`),
      );

      if (newMovements.length === 0) {
        results.push({ processId: target.processId, cnj: target.cnj, newMovements: 0 });
        continue;
      }

      // 4. Insert new movements into Supabase
      const rows = newMovements.map((m) => ({
        process_id:  target.processId,
        date:        m.date,
        description: m.description,
        type:        m.type,
        source:      'datajud',
        is_read:     false,
      }));

      const { error: insertError } = await supabase.from('movements').insert(rows);

      if (insertError) {
        results.push({
          processId: target.processId,
          cnj: target.cnj,
          newMovements: 0,
          error: insertError.message,
        });
        continue;
      }

      totalSynced += newMovements.length;
      results.push({
        processId: target.processId,
        cnj: target.cnj,
        newMovements: newMovements.length,
      });
    } catch (error) {
      const msg =
        error instanceof DataJudError
          ? error.message
          : error instanceof Error
          ? error.message
          : 'Erro desconhecido';

      results.push({
        processId: target.processId,
        cnj: target.cnj,
        newMovements: 0,
        error: msg,
      });
    }
  }

  return NextResponse.json({
    success: true,
    synced: totalSynced,
    results,
  });
}
