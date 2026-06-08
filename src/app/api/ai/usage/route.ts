import { NextRequest, NextResponse } from 'next/server';
import { getAIUsageSummary } from '@/lib/ai-usage';
import { validateSession } from '@/lib/auth';

const SESSION_COOKIE = 'aiox_session';

async function getAuthUser(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  const token = match?.[1];
  if (!token) return null;
  return validateSession(token);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
    const summary = await getAIUsageSummary(user.id, days);
    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to fetch AI usage', message }, { status: 500 });
  }
}
