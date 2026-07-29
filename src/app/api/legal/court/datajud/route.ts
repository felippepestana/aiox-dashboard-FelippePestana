// =============================================================================
// GET /api/legal/court/datajud
// DataJud public API — search for a Brazilian judicial process by CNJ number
// or run an advanced tribunal query.
//
// This route is used by the new-process form for auto-fill.
// Requires an authenticated session with the datajud_integration feature.
//
// Query Parameters:
//   cnj          (string) — CNJ number for direct lookup (NNNNNNN-DD.AAAA.J.TR.OOOO)
//   tribunal     (string) — Tribunal sigla for advanced query (e.g., 'TJSP', 'TRE-GO')
//   classe       (string) — Classe processual filter (nome, text match)
//   assunto      (string) — Subject matter filter
//   dataInicio   (string) — Start date filter (ISO 8601)
//   dataFim      (string) — End date filter (ISO 8601)
//   page         (number) — Page number for pagination (default: 0)
//   classeCodigo (number) — TPU class code (with orgaoCodigo: cursor-paginated search)
//   orgaoCodigo  (number) — Judging-body code
//   size         (number) — Page size for the class/órgão search (1–100)
//   searchAfter  (string) — JSON array cursor from the previous page
//
// Responses:
//   200  { success: true, mode: 'cnj_search', data: DataJudProcessInfo, movements: ProcessMovement[] }
//   200  { success: true, mode: 'advanced_query', results, total, page, tribunal, filters }
//   200  { success: true, mode: 'class_orgao_search', processes, total, nextSearchAfter }
//   400  Missing or invalid parameters
//   401  Not authenticated
//   402  Plan does not include the DataJud integration
//   404  Process not found
//   503  DATAJUD_API_KEY not configured
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import {
  searchByCNJ,
  getMovements,
  searchByClassAndOrgao,
  getDatajudApiKey,
  DATAJUD_NOT_CONFIGURED_MESSAGE,
  DataJudError,
} from '@/lib/court/datajud';
import { isValidCNJ } from '@/lib/court/cnj-utils';
import { DataJudAdapter } from '@/lib/court/datajud-adapter';
import { CourtAdapterError } from '@/lib/court/court-adapter';
import { getAuthUser, unauthorized } from '@/lib/api-utils';
import { hasActiveFeature, PLAN_FEATURE_REQUIRED_MESSAGE } from '@/lib/plan-access';

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  // Paid-module gate: datajud_integration requires an active Professional+ plan
  if (!(await hasActiveFeature(user.id, 'datajud_integration'))) {
    return NextResponse.json({ error: PLAN_FEATURE_REQUIRED_MESSAGE }, { status: 402 });
  }

  const { searchParams } = new URL(request.url);
  const cnj      = searchParams.get('cnj');
  const tribunal = searchParams.get('tribunal');
  const classe   = searchParams.get('classe');
  const assunto  = searchParams.get('assunto');
  const dataInicio = searchParams.get('dataInicio');
  const dataFim  = searchParams.get('dataFim');
  const page     = parseInt(searchParams.get('page') || '0', 10);

  // At least one search mode is required
  if (!cnj && !tribunal) {
    return NextResponse.json(
      {
        error: 'Missing required parameter',
        message: 'Provide either "cnj" for direct search or "tribunal" for advanced query.',
      },
      { status: 400 },
    );
  }

  // ─── Mode 1: Direct CNJ search ───────────────────────────────────────────

  if (cnj) {
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

    try {
      // Fetch process metadata
      const processInfo = await searchByCNJ(cnj, apiKey);

      if (!processInfo) {
        return NextResponse.json(
          {
            error: 'Process not found',
            cnj,
            message: `No process found with CNJ ${cnj} in DataJud.`,
          },
          { status: 404 },
        );
      }

      // Fetch movements — non-fatal if this fails
      let movements: unknown[] = [];
      try {
        movements = await getMovements(cnj, apiKey, cnj);
      } catch {
        // Return process metadata even without movements
      }

      return NextResponse.json({
        success: true,
        mode: 'cnj_search',
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
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 },
      );
    }
  }

  // ─── Mode 2: Advanced tribunal query ─────────────────────────────────────

  if (tribunal) {
    const apiKey = getDatajudApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DATAJUD_API_KEY not configured', message: DATAJUD_NOT_CONFIGURED_MESSAGE },
        { status: 503 },
      );
    }

    // ── Mode 2a: class + judging-body search with cursor pagination ──
    const classeCodigoParam = searchParams.get('classeCodigo');
    const orgaoCodigoParam = searchParams.get('orgaoCodigo');

    // Half-specified pair must not silently fall through to the text-query
    // mode (with no text filters that would run an unrelated match_all page)
    if (Boolean(classeCodigoParam) !== Boolean(orgaoCodigoParam)) {
      return NextResponse.json(
        { error: 'Forneça classeCodigo e orgaoCodigo juntos para a busca por classe/órgão' },
        { status: 400 },
      );
    }

    if (classeCodigoParam && orgaoCodigoParam) {
      const classeCodigo = parseInt(classeCodigoParam, 10);
      const orgaoJulgadorCodigo = parseInt(orgaoCodigoParam, 10);
      if (!Number.isInteger(classeCodigo) || !Number.isInteger(orgaoJulgadorCodigo)) {
        return NextResponse.json(
          { error: 'classeCodigo e orgaoCodigo devem ser números inteiros' },
          { status: 400 },
        );
      }

      let searchAfter: Array<number | string> | undefined;
      const searchAfterParam = searchParams.get('searchAfter');
      if (searchAfterParam) {
        try {
          const parsedCursor: unknown = JSON.parse(searchAfterParam);
          if (
            !Array.isArray(parsedCursor) ||
            !parsedCursor.every((v) => typeof v === 'number' || typeof v === 'string')
          ) {
            throw new Error('not a cursor');
          }
          searchAfter = parsedCursor;
        } catch {
          return NextResponse.json(
            { error: 'searchAfter deve ser um array JSON de números/strings' },
            { status: 400 },
          );
        }
      }

      try {
        const result = await searchByClassAndOrgao(
          {
            tribunal,
            classeCodigo,
            orgaoJulgadorCodigo,
            size: parseInt(searchParams.get('size') || '20', 10) || 20,
            searchAfter,
          },
          apiKey,
        );

        return NextResponse.json({
          success: true,
          mode: 'class_orgao_search',
          tribunal,
          processes: result.processes,
          total: result.total,
          nextSearchAfter: result.nextSearchAfter,
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
          { error: error instanceof Error ? error.message : 'Internal server error' },
          { status: 500 },
        );
      }
    }

    // ── Mode 2b: text filters via the adapter (from/size pagination) ──
    try {
      const datajud = new DataJudAdapter();
      await datajud.authenticate({
        system: 'datajud',
        username: 'api-user',
        apiKey,
      });

      // Build Elasticsearch query
      const mustClauses: Record<string, unknown>[] = [];

      if (classe) {
        mustClauses.push({ match: { 'classe.nome': classe } });
      }
      if (assunto) {
        mustClauses.push({ match: { 'assuntos.nome': assunto } });
      }
      if (dataInicio || dataFim) {
        const range: Record<string, string> = {};
        if (dataInicio) range.gte = dataInicio;
        if (dataFim)    range.lte = dataFim;
        mustClauses.push({ range: { dataAjuizamento: range } });
      }

      const esQuery: Record<string, unknown> = mustClauses.length > 0
        ? { query: { bool: { must: mustClauses } } }
        : { query: { match_all: {} } };

      const result = await datajud.searchByQuery(tribunal, esQuery, page);

      return NextResponse.json({
        success: true,
        mode: 'advanced_query',
        tribunal,
        filters: { classe, assunto, dataInicio, dataFim },
        results: result.results,
        total: result.total,
        page,
      });
    } catch (error) {
      if (error instanceof CourtAdapterError) {
        const statusCode = error.statusCode || 500;
        return NextResponse.json(
          {
            error: error.code,
            message: error.message,
            retryable: error.retryable,
          },
          { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 },
        );
      }
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Internal server error' },
        { status: 500 },
      );
    }
  }
}
