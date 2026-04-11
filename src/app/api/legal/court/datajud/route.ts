import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cnj = searchParams.get('cnj');
  const tribunal = searchParams.get('tribunal');
  const classe = searchParams.get('classe');

  // In production, queries DataJud REST API with APIKey auth
  // Base URL: https://api-publica.datajud.cnj.jus.br/
  return NextResponse.json({
    results: [],
    query: { cnj, tribunal, classe },
    total: 0,
    message: 'DataJud integration active in Phase 2. Configure API key in settings.',
  });
}
