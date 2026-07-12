import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { withRateLimit } from '@/lib/api-rate-limit';

const SESSION_COOKIE = 'aiox_session';
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

/**
 * POST /api/auth/signup — registers a new user in Supabase; sets the session
 * cookie immediately or asks for email confirmation depending on settings.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = withRateLimit(request, 'auth');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Preencha todos os campos' },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 },
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      if (
        error.message.includes('already registered') ||
        error.message.includes('User already registered')
      ) {
        return NextResponse.json(
          { error: 'Email já cadastrado' },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'Falha ao criar conta' }, { status: 500 });
    }

    // If email confirmation is disabled, a session is returned immediately
    if (data.session) {
      const user = {
        id: data.user.id,
        email: data.user.email || '',
        name: name,
        role: 'advogado',
      };

      const response = NextResponse.json({ user });

      response.cookies.set(SESSION_COOKIE, data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_TTL_SECONDS,
        path: '/',
      });

      return response;
    }

    // Email confirmation required — inform the client
    return NextResponse.json(
      { message: 'Verifique seu email para confirmar o cadastro' },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
