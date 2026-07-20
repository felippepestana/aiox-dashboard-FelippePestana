import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit } from '@/lib/api-rate-limit';

const SESSION_COOKIE = 'aiox_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * POST /api/auth/login — authenticates the user against Supabase with email and
 * password and sets the session cookie with the access token.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = withRateLimit(request, 'auth');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Preencha todos os campos' },
        { status: 400 },
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Map Supabase error messages to Portuguese
      if (
        error.message.includes('Invalid login credentials') ||
        error.message.includes('invalid_credentials')
      ) {
        return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
      }
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json(
          { error: 'Confirme seu email antes de entrar' },
          { status: 401 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    if (!data.session || !data.user) {
      return NextResponse.json({ error: 'Falha ao criar sessão' }, { status: 500 });
    }

    // Fetch profile for name/role
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, role')
      .eq('id', data.user.id)
      .single();

    const user = {
      id: data.user.id,
      email: data.user.email || '',
      name: profile?.name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuário',
      role: profile?.role || 'advogado',
    };

    const response = NextResponse.json({ user });

    // Store the Supabase access_token in the session cookie (same name for middleware compat)
    response.cookies.set(SESSION_COOKIE, data.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_SECONDS,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
