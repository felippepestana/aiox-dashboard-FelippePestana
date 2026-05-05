import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const processId = searchParams.get('processId');
  const days = searchParams.get('days');

  return NextResponse.json({
    deadlines: [],
    filters: { status, processId, days },
    message: 'Use client-side store in MVP. SQLite integration in Phase 2.',
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, deadline: body }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
