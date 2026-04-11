import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const oab = searchParams.get('oab');
  const since = searchParams.get('since');

  // In production, monitors DJE across courts for OAB/CNJ matches
  return NextResponse.json({
    publications: [],
    query: { oab, since },
    message: 'DJE publication monitoring active in Phase 2.',
  });
}
