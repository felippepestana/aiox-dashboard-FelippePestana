import { NextResponse } from 'next/server';
import { createCourtAdapter, getSystemInfo } from '@/lib/court/court-factory';
import { CourtAdapterError, isValidCNJ } from '@/lib/court/court-adapter';
import type { CourtSystem, CourtSearchResult } from '@/types/legal';

/**
 * GET /api/legal/court/search
 *
 * Search for a judicial process across court systems.
 *
 * Query Parameters:
 * - cnj (required): The CNJ process number (format: NNNNNNN-DD.AAAA.J.TR.OOOO)
 * - system (optional): Court system to search in (pje, esaj, eproc, projudi, datajud)
 *   If omitted, attempts DataJud first then infers the system from the CNJ number.
 *
 * Responses:
 * - 200: Process found, returns CourtSearchResult
 * - 400: Invalid parameters (missing or malformed CNJ)
 * - 404: Process not found in the specified system
 * - 500: Internal server error
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cnj = searchParams.get('cnj');
  const system = searchParams.get('system') as CourtSystem | null;

  // Validate CNJ parameter
  if (!cnj) {
    return NextResponse.json(
      {
        error: 'Missing required parameter: cnj',
        message: 'Please provide a CNJ process number in the format NNNNNNN-DD.AAAA.J.TR.OOOO',
      },
      { status: 400 },
    );
  }

  if (!isValidCNJ(cnj)) {
    return NextResponse.json(
      {
        error: 'Invalid CNJ format',
        message: `The provided CNJ "${cnj}" does not match the expected format: NNNNNNN-DD.AAAA.J.TR.OOOO`,
      },
      { status: 400 },
    );
  }

  // Validate system parameter if provided
  const validSystems: CourtSystem[] = ['pje', 'esaj', 'eproc', 'projudi', 'datajud'];
  if (system && !validSystems.includes(system)) {
    return NextResponse.json(
      {
        error: 'Invalid court system',
        message: `Supported systems: ${validSystems.join(', ')}`,
      },
      { status: 400 },
    );
  }

  try {
    let result: CourtSearchResult | null = null;
    let searchedSystem: CourtSystem;

    if (system) {
      // Search a specific system
      searchedSystem = system;
      const adapter = createCourtAdapter(system);

      await adapter.authenticate({
        system,
        username: process.env[`${system.toUpperCase()}_USERNAME`] || 'api-user',
        password: process.env[`${system.toUpperCase()}_PASSWORD`],
        apiKey: process.env[`${system.toUpperCase()}_API_KEY`],
        certificate: process.env[`${system.toUpperCase()}_CERTIFICATE`],
      });

      result = await adapter.searchProcess(cnj);
    } else {
      // Default: try DataJud first (broadest coverage, 144M+ processes)
      searchedSystem = 'datajud';
      try {
        const datajud = createCourtAdapter('datajud');
        await datajud.authenticate({
          system: 'datajud',
          username: 'api-user',
          apiKey: process.env.DATAJUD_API_KEY || 'public-key',
        });
        result = await datajud.searchProcess(cnj);
      } catch {
        // DataJud failed, result stays null
      }
    }

    if (!result) {
      return NextResponse.json(
        {
          error: 'Process not found',
          cnj,
          system: searchedSystem,
          message: `No process found with CNJ ${cnj} in ${searchedSystem}. Try specifying a different court system.`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
      system: searchedSystem,
    });
  } catch (error) {
    if (error instanceof CourtAdapterError) {
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
