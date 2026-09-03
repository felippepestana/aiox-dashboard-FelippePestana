// =============================================================================
// /api/legal/court
// Unified court system integration API route
// =============================================================================
//
// GET  ?cnj=xxx&system=pje          → search a process in the specified court system
// GET  ?action=credentials          → list all saved credentials (no passwords)
// POST { action: 'sync', processId, cnj }
//                                   → sync process data from the court system
// POST { action: 'save-credential', system, username, password, tribunal }
//                                   → encrypt and save a court credential
// DELETE ?credentialId=xxx          → delete a saved credential
// DELETE ?credentialId=xxx&action=test
//                                   → test credential validity (uses GET instead)
// GET  ?action=test-credential&credentialId=xxx → test credential
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { supabase, createServerClient } from '@/lib/supabase';
import { getAuthUser, unauthorized } from '@/lib/api-utils';
import { hasActiveFeature, PLAN_FEATURE_REQUIRED_MESSAGE } from '@/lib/plan-access';
import { isValidCNJ, getTribunalFromCNJ } from '@/lib/court/cnj-utils';
import {
  getCourtSystemForCNJ,
  getCourtSystemForTribunal,
  buildConsultationUrl,
  COURT_SYSTEMS,
} from '@/lib/court/court-systems';
import {
  saveCredential,
  listCredentials,
  deleteCredential,
  testCredential,
} from '@/lib/court/credential-manager';
import { createCourtAdapter } from '@/lib/court/court-factory';
import type { CourtSystem } from '@/types/legal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function jsonOk(data: unknown) {
  return NextResponse.json({ success: true, data });
}

// ─── GET ──────────────────────────────────────────────────────────────────────

/**
 * GET /api/legal/court
 *
 * Modes (determined by query parameters):
 *
 * 1. Search process:
 *    ?cnj=NNNNNNN-DD.AAAA.J.TR.OOOO[&system=pje|esaj|eproc|projudi|datajud]
 *    Returns: { success, data: CourtSearchResult, system, tribunal, consultationUrl }
 *
 * 2. List credentials:
 *    ?action=credentials
 *    Returns: { success, data: CourtCredential[] }
 *
 * 3. Test credential:
 *    ?action=test-credential&credentialId=UUID
 *    Returns: { success, data: { valid: boolean | null } }
 *
 * 4. Get system info:
 *    ?action=systems
 *    Returns: { success, data: CourtSystemDescriptor[] }
 */
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  // ── List systems ──────────────────────────────────────────────────────────
  if (action === 'systems') {
    return jsonOk(Object.values(COURT_SYSTEMS));
  }

  // ── List credentials ──────────────────────────────────────────────────────
  if (action === 'credentials') {
    try {
      const credentials = await listCredentials();
      return jsonOk(credentials);
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : 'Erro ao listar credenciais', 500);
    }
  }

  // ── Test credential ───────────────────────────────────────────────────────
  if (action === 'test-credential') {
    const credentialId = searchParams.get('credentialId');
    if (!credentialId) return jsonError('credentialId é obrigatório', 400);

    try {
      const valid = await testCredential(credentialId);
      return jsonOk({ valid });
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : 'Erro ao testar credencial', 500);
    }
  }

  // ── Search process in court system ────────────────────────────────────────
  const cnj = searchParams.get('cnj');
  if (!cnj) {
    return jsonError(
      'Parâmetro obrigatório ausente. Use: ?cnj=xxx ou ?action=credentials',
      400,
    );
  }

  if (!isValidCNJ(cnj)) {
    return jsonError(
      `Formato de CNJ inválido: "${cnj}". Esperado: NNNNNNN-DD.AAAA.J.TR.OOOO`,
      400,
    );
  }

  const systemParam = searchParams.get('system') as CourtSystem | null;
  const validSystems: CourtSystem[] = ['pje', 'esaj', 'eproc', 'projudi', 'datajud'];
  if (systemParam && !validSystems.includes(systemParam)) {
    return jsonError(`Sistema inválido: "${systemParam}". Válidos: ${validSystems.join(', ')}`, 400);
  }

  const tribunal = getTribunalFromCNJ(cnj) ?? 'DESCONHECIDO';
  const system = systemParam ?? getCourtSystemForCNJ(cnj);
  const consultationUrl = buildConsultationUrl(cnj, system);

  // Paid-module gate for the DataJud-backed search
  if (system === 'datajud' && !(await hasActiveFeature(user.id, 'datajud_integration'))) {
    return NextResponse.json({ error: PLAN_FEATURE_REQUIRED_MESSAGE }, { status: 402 });
  }

  try {
    const adapter = createCourtAdapter(system);

    // DataJud uses an API key; other public systems use empty credentials
    if (system === 'datajud') {
      const apiKey = process.env.DATAJUD_API_KEY;
      if (!apiKey) {
        return jsonError('DATAJUD_API_KEY não configurada no servidor', 503);
      }
      await adapter.authenticate({ system, username: '', apiKey });
    } else {
      // Try to load saved credential for this system + tribunal
      const { getCredential } = await import('@/lib/court/credential-manager');
      const cred = await getCredential(system, tribunal).catch(() => null);
      if (cred) {
        await adapter.authenticate({
          system,
          username: cred.username,
          password: cred.password,
        });
      } else {
        // No credential — authenticate with empty creds (public consultation only)
        await adapter.authenticate({ system, username: '' });
      }
    }

    const result = await adapter.searchProcess(cnj);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: 'Processo não encontrado',
          cnj,
          system,
          tribunal,
          consultationUrl,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      system,
      tribunal,
      consultationUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return jsonError(message, 500);
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/legal/court
 *
 * Request body must include an `action` field:
 *
 * action = 'sync'
 *   Body: { processId: string; cnj: string; system?: CourtSystem }
 *   Returns: { success, data: CourtProcessData }
 *   Syncs process data from the court system and persists new movements to Supabase.
 *
 * action = 'save-credential'
 *   Body: { system: CourtSystem; username: string; password: string; tribunal: string }
 *   Returns: { success, data: CourtCredential }
 *   Encrypts and saves the credential to Supabase.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonError('Corpo da requisição inválido (JSON esperado)', 400);
  }

  const action = body.action as string | undefined;

  // ── Save credential ───────────────────────────────────────────────────────
  if (action === 'save-credential') {
    const { system, username, password, tribunal } = body as {
      system?: CourtSystem;
      username?: string;
      password?: string;
      tribunal?: string;
    };

    if (!system || !username || !password || !tribunal) {
      return jsonError('Campos obrigatórios ausentes: system, username, password, tribunal', 400);
    }

    const validSystems: CourtSystem[] = ['pje', 'esaj', 'eproc', 'projudi', 'datajud'];
    if (!validSystems.includes(system)) {
      return jsonError(`Sistema inválido: ${system}`, 400);
    }

    try {
      const credential = await saveCredential({ system, username, password, tribunalCode: tribunal });
      return jsonOk(credential);
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : 'Erro ao salvar credencial', 500);
    }
  }

  // ── Sync process ──────────────────────────────────────────────────────────
  if (action === 'sync') {
    const { processId, cnj, system: systemParam } = body as {
      processId?: string;
      cnj?: string;
      system?: CourtSystem;
    };

    if (!processId || !cnj) {
      return jsonError('Campos obrigatórios ausentes: processId, cnj', 400);
    }

    if (!isValidCNJ(cnj)) {
      return jsonError(`Formato de CNJ inválido: "${cnj}"`, 400);
    }

    const tribunal = getTribunalFromCNJ(cnj) ?? 'DESCONHECIDO';
    const system = systemParam ?? getCourtSystemForCNJ(cnj);

    if (system === 'datajud' && !(await hasActiveFeature(user.id, 'datajud_integration'))) {
      return NextResponse.json({ error: PLAN_FEATURE_REQUIRED_MESSAGE }, { status: 402 });
    }

    // Ownership check: processId is caller-controlled and the service-role
    // client bypasses RLS — without this any signed-in user could inject
    // movements into another tenant's process by UUID. The default anon-key
    // client carries no user JWT, so RLS would blind it even to the caller's
    // own rows — the sync path must use the service-role client throughout.
    const db = createServerClient();
    const { data: ownedProcess, error: ownedError } = await db
      .from('processes')
      .select('id')
      .eq('id', processId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (ownedError) {
      return jsonError('Falha ao validar a titularidade do processo', 500);
    }
    if (!ownedProcess) {
      return jsonError('Processo não encontrado ou não pertence ao usuário', 403);
    }

    try {
      const adapter = createCourtAdapter(system);

      // Authenticate
      if (system === 'datajud') {
        const apiKey = process.env.DATAJUD_API_KEY;
        if (!apiKey) return jsonError('DATAJUD_API_KEY não configurada no servidor', 503);
        await adapter.authenticate({ system, username: '', apiKey });
      } else {
        const { getCredential } = await import('@/lib/court/credential-manager');
        const cred = await getCredential(system, tribunal).catch(() => null);
        if (cred) {
          await adapter.authenticate({ system, username: cred.username, password: cred.password });
        } else {
          await adapter.authenticate({ system, username: '' });
        }
      }

      // Fetch process data
      const [searchResult, movements, deadlines] = await Promise.all([
        adapter.searchProcess(cnj).catch(() => null),
        adapter.getMovements(cnj).catch(() => []),
        adapter.getDeadlines(cnj).catch(() => []),
      ]);

      // Persist new movements to Supabase
      let newMovementsCount = 0;
      if (movements.length > 0) {
        // Load existing movement keys for this process
        const { data: existing } = await db
          .from('movements')
          .select('type, date')
          .eq('process_id', processId);

        const existingKeys = new Set(
          (existing ?? []).map((m: { type: string; date: string }) => `${m.type}-${m.date}`),
        );

        const newMovements = movements.filter(
          (m) => !existingKeys.has(`${m.type}-${m.date}`),
        );

        if (newMovements.length > 0) {
          // `title` is NOT NULL in the movements schema — mirror description
          const rows = newMovements.map((m) => ({
            process_id: processId,
            date: m.date,
            title: m.description,
            description: m.description,
            type: m.type,
            source: system,
            is_read: false,
          }));

          const { error: insertError } = await db.from('movements').insert(rows);
          // 23505 = concurrent sync already inserted these rows
          if (insertError && insertError.code !== '23505') {
            return jsonError(`Falha ao salvar movimentações: ${insertError.message}`, 500);
          }
          newMovementsCount = insertError ? 0 : newMovements.length;
        }
      }

      return jsonOk({
        cnj,
        processId,
        system,
        tribunal,
        searchResult,
        newMovementsCount,
        deadlines,
        syncedAt: new Date().toISOString(),
      });
    } catch (err) {
      return jsonError(err instanceof Error ? err.message : 'Erro ao sincronizar processo', 500);
    }
  }

  return jsonError(`Ação desconhecida: "${action}". Use: sync, save-credential`, 400);
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * DELETE /api/legal/court?credentialId=UUID
 *
 * Permanently removes a saved court credential.
 */
export async function DELETE(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const credentialId = searchParams.get('credentialId');

  if (!credentialId) {
    return jsonError('Parâmetro obrigatório ausente: credentialId', 400);
  }

  try {
    await deleteCredential(credentialId);
    return jsonOk({ deleted: credentialId });
  } catch (err) {
    return jsonError(err instanceof Error ? err.message : 'Erro ao remover credencial', 500);
  }
}
