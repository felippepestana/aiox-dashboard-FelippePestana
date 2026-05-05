import { NextResponse } from 'next/server';
import { createCourtAdapter } from '@/lib/court/court-factory';
import { CourtAdapterError } from '@/lib/court/court-adapter';
import type { CourtSystem, Publication } from '@/types/legal';

/**
 * GET /api/legal/court/publications
 *
 * Fetch DJE (Diario de Justica Eletronico) publications matching
 * an OAB registration number.
 *
 * Query Parameters:
 * - oab (required): OAB registration number (e.g., 'SP123456')
 * - since (optional): ISO 8601 date to filter publications from
 * - system (optional): Court system to query (pje, esaj, eproc, projudi)
 *   If omitted, queries all systems with available credentials.
 *
 * Responses:
 * - 200: Publications found (may be empty array)
 * - 400: Missing required OAB parameter
 * - 500: Internal server error
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const oab = searchParams.get('oab');
  const since = searchParams.get('since') || undefined;
  const system = searchParams.get('system') as CourtSystem | null;

  // Validate OAB parameter
  if (!oab) {
    return NextResponse.json(
      {
        error: 'Missing required parameter: oab',
        message: 'Please provide an OAB registration number (e.g., SP123456)',
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
    const allPublications: Publication[] = [];

    // Systems that support publication monitoring
    const publicationSystems: CourtSystem[] = system
      ? [system]
      : ['pje', 'esaj', 'eproc', 'projudi'];

    // Query each system for publications
    const queries = publicationSystems.map(async (sys) => {
      try {
        const adapter = createCourtAdapter(sys);
        await adapter.authenticate({
          system: sys,
          username: process.env[`${sys.toUpperCase()}_USERNAME`] || 'api-user',
          password: process.env[`${sys.toUpperCase()}_PASSWORD`],
          apiKey: process.env[`${sys.toUpperCase()}_API_KEY`],
          certificate: process.env[`${sys.toUpperCase()}_CERTIFICATE`],
        });

        const pubs = await adapter.getPublications(oab, since);
        return { system: sys, publications: pubs, error: null };
      } catch (error) {
        return {
          system: sys,
          publications: [] as Publication[],
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const results = await Promise.all(queries);

    // Aggregate publications from all systems
    const systemStatuses: Record<string, { count: number; error: string | null }> = {};

    for (const result of results) {
      allPublications.push(...result.publications);
      systemStatuses[result.system] = {
        count: result.publications.length,
        error: result.error,
      };
    }

    // Sort by publication date descending
    allPublications.sort(
      (a, b) =>
        new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime(),
    );

    return NextResponse.json({
      success: true,
      oab,
      since: since || null,
      publications: allPublications,
      total: allPublications.length,
      systemStatuses,
    });
  } catch (error) {
    if (error instanceof CourtAdapterError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          system: error.system,
        },
        { status: 500 },
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
