import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cnj = searchParams.get('cnj');
  const system = searchParams.get('system');

  if (!cnj) {
    return NextResponse.json({ error: 'CNJ parameter is required' }, { status: 400 });
  }

  // In production, uses CourtAdapter factory to search across systems
  return NextResponse.json({
    results: [],
    query: { cnj, system },
    message: 'Court search integration active in Phase 2. Configure court credentials in settings.',
  });
}
