import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';

const SESSION_COOKIE = 'aiox_session';

/**
 * GET /api/auth/token — returns the caller's own Supabase access token after
 * validating the session. The token lives in an httpOnly cookie, so browser
 * code (e.g. the realtime client, which needs `realtime.setAuth(token)` for
 * RLS-guarded postgres_changes) cannot read it directly. Only the already
 * authenticated owner of the cookie can obtain it, which is equivalent to
 * Supabase's default localStorage session model.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(SESSION_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const user = await validateSession(token);
    if (!user) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada' }, { status: 401 });
    }

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
