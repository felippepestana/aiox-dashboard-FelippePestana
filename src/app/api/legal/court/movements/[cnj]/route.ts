import { NextResponse } from 'next/server';
import { createCourtAdapter, inferSystemFromTribunal } from '@/lib/court/court-factory';
import { CourtAdapterError, isValidCNJ, parseCNJ } from '@/lib/court/court-adapter';
import type { CourtSystem } from '@/types/legal';

/**
 * GET /api/legal/court/movements/[cnj]
 *
 * Retrieve procedural movements (andamentos) for a CNJ process number.
 *
 * Path Parameters:
 * - cnj (required): The CNJ process number
 *
 * Query Parameters:
 * - since (optional): ISO 8601 date to filter movements from
 * - system (optional): Court system to query (pje, esaj, eproc, projudi, datajud)
 *
 * Responses:
 * - 200: Movements found
 * - 400: Invalid CNJ format
 * - 404: Process not found
 * - 500: Internal server error
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ cnj: string }> },
) {
  const { cnj } = await params;
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since') || undefined;
  const system = searchParams.get('system') as CourtSystem | null;

  // Validate CNJ
  if (!cnj) {
    return NextResponse.json(
      { error: 'CNJ parameter is required' },
      { status: 400 },
    );
  }

  const decodedCnj = decodeURIComponent(cnj);

  if (!isValidCNJ(decodedCnj)) {
    return NextResponse.json(
      {
        error: 'Invalid CNJ format',
        message: `"${decodedCnj}" does not match the expected format: NNNNNNN-DD.AAAA.J.TR.OOOO`,
      },
      { status: 400 },
    );
  }

  // Validate since date if provided
  if (since && isNaN(Date.parse(since))) {
    return NextResponse.json(
      {
        error: 'Invalid date format for "since" parameter',
        message: 'Provide an ISO 8601 date string (e.g., 2024-01-01)',
      },
      { status: 400 },
    );
  }

  try {
    // Determine which system to use
    const targetSystem: CourtSystem = system || 'datajud';

    const adapter = createCourtAdapter(targetSystem);

    // Authenticate with available credentials
    await adapter.authenticate({
      system: targetSystem,
      username: process.env[`${targetSystem.toUpperCase()}_USERNAME`] || 'api-user',
      password: process.env[`${targetSystem.toUpperCase()}_PASSWORD`],
      apiKey: process.env[`${targetSystem.toUpperCase()}_API_KEY`],
      certificate: process.env[`${targetSystem.toUpperCase()}_CERTIFICATE`],
    });

    const movements = await adapter.getMovements(decodedCnj, since);

    return NextResponse.json({
      success: true,
      cnj: decodedCnj,
      system: targetSystem,
      since: since || null,
      movements,
      total: movements.length,
    });
  } catch (error) {
    if (error instanceof CourtAdapterError) {
      if (error.code === 'PROCESS_NOT_FOUND') {
        return NextResponse.json(
          {
            error: 'Process not found',
            cnj: decodedCnj,
            message: error.message,
          },
          { status: 404 },
        );
      }

      const statusCode = error.statusCode || 500;
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          system: error.system,
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
