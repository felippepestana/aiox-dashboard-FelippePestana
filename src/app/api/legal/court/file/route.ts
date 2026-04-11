import { NextResponse } from 'next/server';
import { createCourtAdapter, getSystemInfo } from '@/lib/court/court-factory';
import { CourtAdapterError, isValidCNJ } from '@/lib/court/court-adapter';
import type { FilingPayload } from '@/lib/court/court-adapter';
import type { CourtSystem } from '@/types/legal';

/**
 * POST /api/legal/court/file
 *
 * File a petition (peticao) electronically to a court system.
 *
 * Request Body (JSON):
 * {
 *   cnj: string;          // CNJ process number (required)
 *   system: CourtSystem;  // Court system: pje, esaj, eproc, projudi (required)
 *   petitionType: string; // Type of petition (required)
 *   content: string;      // Text content of the petition (required)
 *   documents?: Array<{   // Attached documents (optional)
 *     name: string;
 *     data: string;       // Base64-encoded file content
 *     mimeType: string;
 *   }>;
 * }
 *
 * Responses:
 * - 201: Filing successful, returns FilingReceipt
 * - 400: Invalid request body or parameters
 * - 422: Filing rejected by the court system
 * - 500: Internal server error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cnj, system, petitionType, content, documents } = body as {
      cnj?: string;
      system?: CourtSystem;
      petitionType?: string;
      content?: string;
      documents?: Array<{ name: string; data: string; mimeType: string }>;
    };

    // ─── Validation ─────────────────────────────────────────────────────

    if (!cnj || !system || !petitionType || !content) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          message: 'Request body must include: cnj, system, petitionType, content',
          received: {
            cnj: !!cnj,
            system: !!system,
            petitionType: !!petitionType,
            content: !!content,
          },
        },
        { status: 400 },
      );
    }

    // Validate CNJ format
    if (!isValidCNJ(cnj)) {
      return NextResponse.json(
        {
          error: 'Invalid CNJ format',
          message: `"${cnj}" does not match the expected format: NNNNNNN-DD.AAAA.J.TR.OOOO`,
        },
        { status: 400 },
      );
    }

    // Validate system supports filing
    const filingSystems: CourtSystem[] = ['pje', 'esaj', 'eproc', 'projudi'];
    if (!filingSystems.includes(system)) {
      return NextResponse.json(
        {
          error: 'System does not support filing',
          message: `The "${system}" system does not support electronic filing. Supported systems: ${filingSystems.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Validate petition type
    const validTypes = [
      'inicial', 'contestacao', 'recurso', 'embargo', 'agravo',
      'tutela', 'mandado_seguranca', 'habeas_corpus', 'parecer',
      'contrarrazoes', 'recurso_especial', 'recurso_extraordinario', 'outro',
    ];
    if (!validTypes.includes(petitionType)) {
      return NextResponse.json(
        {
          error: 'Invalid petition type',
          message: `petitionType must be one of: ${validTypes.join(', ')}`,
        },
        { status: 400 },
      );
    }

    // Validate documents if provided
    if (documents && Array.isArray(documents)) {
      for (const doc of documents) {
        if (!doc.name || !doc.data || !doc.mimeType) {
          return NextResponse.json(
            {
              error: 'Invalid document format',
              message: 'Each document must have: name, data (base64), mimeType',
            },
            { status: 400 },
          );
        }
      }
    }

    // ─── Filing ─────────────────────────────────────────────────────────

    const adapter = createCourtAdapter(system);

    // Authenticate with available credentials
    await adapter.authenticate({
      system,
      username: process.env[`${system.toUpperCase()}_USERNAME`] || 'api-user',
      password: process.env[`${system.toUpperCase()}_PASSWORD`],
      apiKey: process.env[`${system.toUpperCase()}_API_KEY`],
      certificate: process.env[`${system.toUpperCase()}_CERTIFICATE`],
    });

    // Build the filing payload
    const payload: FilingPayload = {
      petitionType,
      content,
      documents: documents || [],
    };

    // File the document
    const receipt = await adapter.fileDocument(cnj, payload);

    return NextResponse.json(
      {
        success: true,
        receipt,
        message: `Petition filed successfully via ${system}`,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof CourtAdapterError) {
      if (error.code === 'FILING_REJECTED') {
        return NextResponse.json(
          {
            error: 'Filing rejected',
            code: error.code,
            message: error.message,
            system: error.system,
          },
          { status: 422 },
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

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          message: 'Expected a valid JSON body with cnj, system, petitionType, and content fields.',
        },
        { status: 400 },
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
