import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get('area');
  const status = searchParams.get('status');
  const urgency = searchParams.get('urgency');
  const search = searchParams.get('search');

  // In MVP, the client-side Zustand store handles data.
  // This route serves as a placeholder for Phase 2 SQLite integration.
  return NextResponse.json({
    processes: [],
    filters: { area, status, urgency, search },
    message: 'Use client-side store in MVP. SQLite integration in Phase 2.',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, process: body }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
