// =============================================================================
// GET /api/legal/court/datajud
// DataJud public API — search for a Brazilian judicial process by CNJ number
// or run an advanced tribunal query.
//
// This route is used by the new-process form for auto-fill.
//
// Query Parameters:
//   cnj       (string)  — CNJ number for direct lookup (NNNNNNN-DD.AAAA.J.TR.OOOO)
//   tribunal  (string)  — Tribunal code for advanced query (e.g., 'TJSP', 'STJ')
//   classe    (string)  — Classe processual filter
//   assunto   (string)  — Subject matter filter
//   dataInicio (string) — Start date filter (ISO 8601)
//   dataFim   (string)  — End date filter (ISO 8601)
//   page      (number)  — Page number for pagination (default: 0)
//
// Responses:
//   200  { success: true, mode: 'cnj_search', data: DataJudProcessInfo, movements: ProcessMovement[] }
//   200  { success: true, mode: 'advanced_query', results, total, page, tribunal, filters }
//   400  Missing or invalid parameters
//   404  Process not found
//   503  DATAJUD_API_KEY not configured (when cnj search is requested)
// =============================================================================

import { NextResponse } from 'next/server';
import { searchByCNJ, getMovements, DataJudError } from '@/lib/court/datajud';
import { isValidCNJ } from '@/lib/court/cnj-utils';
import { DataJudAdapter } from '@/lib/court/datajud-adapter';
import { CourtAdapterError } from '@/lib/court/court-adapter';

// ─── GET handler ──────────────────────────────────────────────────────────────

export async function GET(request: Request) {
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

    const apiKey = process.env.DATAJUD_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'DATAJUD_API_KEY not configured',
          message: 'The DataJud API key is not set on the server. Configure DATAJUD_API_KEY in your environment.',
        },
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

  // ─── Mode 2: Advanced tribunal query (uses class-based adapter) ───────────

  if (tribunal) {
    try {
      const datajud = new DataJudAdapter();
      await datajud.authenticate({
        system: 'datajud',
        username: 'api-user',
        apiKey: process.env.DATAJUD_API_KEY || 'public-key',
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
