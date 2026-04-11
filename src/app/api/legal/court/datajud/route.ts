import { NextResponse } from 'next/server';
import { DataJudAdapter } from '@/lib/court/datajud-adapter';
import { CourtAdapterError, isValidCNJ } from '@/lib/court/court-adapter';

/**
 * GET /api/legal/court/datajud
 *
 * Query the DataJud API (CNJ public API for 144M+ judicial processes).
 *
 * Supports two modes:
 * 1. Direct CNJ search: provide `cnj` parameter
 * 2. Advanced query: provide `tribunal` + optional `classe`, `assunto`, `page`
 *
 * Query Parameters:
 * - cnj (optional): CNJ process number for direct lookup
 * - tribunal (optional): Tribunal code for advanced search (e.g., 'TJSP', 'STJ')
 * - classe (optional): Classe processual filter (e.g., 'Procedimento Comum Civel')
 * - assunto (optional): Subject matter filter
 * - dataInicio (optional): Start date filter (ISO 8601)
 * - dataFim (optional): End date filter (ISO 8601)
 * - page (optional): Page number for pagination (default: 0)
 *
 * Responses:
 * - 200: Query results
 * - 400: Invalid parameters
 * - 404: Process not found (CNJ search mode)
 * - 500: Internal server error
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cnj = searchParams.get('cnj');
  const tribunal = searchParams.get('tribunal');
  const classe = searchParams.get('classe');
  const assunto = searchParams.get('assunto');
  const dataInicio = searchParams.get('dataInicio');
  const dataFim = searchParams.get('dataFim');
  const page = parseInt(searchParams.get('page') || '0', 10);

  // Need at least cnj or tribunal
  if (!cnj && !tribunal) {
    return NextResponse.json(
      {
        error: 'Missing required parameter',
        message: 'Provide either "cnj" for direct search or "tribunal" for advanced query.',
      },
      { status: 400 },
    );
  }

  try {
    const datajud = new DataJudAdapter();
    await datajud.authenticate({
      system: 'datajud',
      username: 'api-user',
      apiKey: process.env.DATAJUD_API_KEY || 'public-key',
    });

    // Mode 1: Direct CNJ search
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

      const result = await datajud.searchProcess(cnj);

      if (!result) {
        return NextResponse.json(
          {
            error: 'Process not found',
            cnj,
            message: `No process found with CNJ ${cnj} in DataJud.`,
          },
          { status: 404 },
        );
      }

      // Also fetch movements for the process
      let movements;
      try {
        movements = await datajud.getMovements(cnj);
      } catch {
        movements = [];
      }

      return NextResponse.json({
        success: true,
        mode: 'cnj_search',
        data: {
          process: result,
          movements,
        },
      });
    }

    // Mode 2: Advanced tribunal query
    if (tribunal) {
      // Build Elasticsearch query
      const mustClauses: Record<string, unknown>[] = [];

      if (classe) {
        mustClauses.push({
          match: { 'classe.nome': classe },
        });
      }

      if (assunto) {
        mustClauses.push({
          match: { 'assuntos.nome': assunto },
        });
      }

      if (dataInicio || dataFim) {
        const range: Record<string, string> = {};
        if (dataInicio) range.gte = dataInicio;
        if (dataFim) range.lte = dataFim;
        mustClauses.push({
          range: { dataAjuizamento: range },
        });
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
    }
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
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 },
    );
  }
}
