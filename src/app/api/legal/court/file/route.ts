import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cnj, system, petitionType, content, attachments } = body;

    if (!cnj || !system || !petitionType) {
      return NextResponse.json(
        { error: 'cnj, system, and petitionType are required fields' },
        { status: 400 }
      );
    }

    // Validate system
    const validSystems = ['pje', 'esaj', 'eproc'];
    if (!validSystems.includes(system)) {
      return NextResponse.json(
        { error: `Invalid system. Must be one of: ${validSystems.join(', ')}` },
        { status: 400 }
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
        { error: `Invalid petitionType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate CNJ format
    const cnjPattern = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
    if (!cnjPattern.test(cnj)) {
      return NextResponse.json(
        { error: 'Invalid CNJ format. Expected: NNNNNNN-NN.NNNN.N.NN.NNNN' },
        { status: 400 }
      );
    }

    // Generate mock protocol number
    const protocolNumber = `PROT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // In production, uses CourtAdapter to file petition electronically
    // - PJe: SOAP/REST API with digital certificate
    // - eSAJ: Web automation with certificate
    // - eProc: REST API with token auth
    return NextResponse.json({
      success: true,
      filing: {
        protocolNumber,
        cnj,
        system,
        petitionType,
        filedAt: new Date().toISOString(),
        status: 'pending_credentials',
        hasContent: !!content,
        attachmentCount: Array.isArray(attachments) ? attachments.length : 0,
        message: 'Filing simulated for development. Configure court credentials for production electronic filing.',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body. Expected JSON with cnj, system, and petitionType fields.' },
      { status: 400 }
    );
  }
}
