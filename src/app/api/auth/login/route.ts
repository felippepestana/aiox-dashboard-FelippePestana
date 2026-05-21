import { NextResponse } from 'next/server';
import { findUserByEmail, hashPassword, createSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = findUserByEmail(email);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { passwordHash: _, ...safeUser } = user;
    await createSession(safeUser);

    return NextResponse.json({ user: safeUser });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
