import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ cnj: string }> }
) {
  const { cnj } = await params;

  if (!cnj) {
    return NextResponse.json({ error: 'CNJ parameter is required' }, { status: 400 });
  }

  // In production, queries court system for movements
  return NextResponse.json({
    cnj,
    movements: [],
    message: 'Movement tracking integration active in Phase 2.',
  });
}
