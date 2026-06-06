import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

const SESSION_COOKIE = 'aiox_session';

export async function POST(request: Request) {
  try {
    // Try to sign out from Supabase using the token in the cookie
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
    const token = match?.[1];

    if (token) {
      const supabase = createServerClient();
      // Sign out server-side; ignore errors (token may already be expired or be legacy format)
      await supabase.auth.admin.signOut(token).catch(() => null);
    }

    const response = NextResponse.json({ success: true });

    // Clear the session cookie
    response.cookies.set(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erro ao fazer logout' }, { status: 500 });
  }
}
