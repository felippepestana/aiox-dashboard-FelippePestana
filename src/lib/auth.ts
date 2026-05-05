// =============================================================================
// Auth Library - Cookie-based session management
// =============================================================================

import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

interface Session {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

// ─── In-Memory Stores ───────────────────────────────────────────────────────

const sessions = new Map<string, Session>();

const users: Array<User & { passwordHash: string }> = [
  {
    id: 'usr-admin-001',
    email: 'admin@aiox.legal',
    name: 'Administrador',
    role: 'admin',
    passwordHash: hashPassword('admin123'),
  },
];

// ─── Password Helpers ───────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// ─── Session Management ─────────────────────────────────────────────────────

const SESSION_COOKIE = 'aiox_session';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();

  sessions.set(token, {
    userId,
    createdAt: now,
    expiresAt: now + SESSION_TTL,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL / 1000,
  });

  return token;
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const session = sessions.get(token);
  if (!session) return null;

  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return null;
  }

  const user = users.find((u) => u.id === session.userId);
  if (!user) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    sessions.delete(token);
  }

  cookieStore.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

// ─── User Lookup ────────────────────────────────────────────────────────────

export function findUserByEmail(email: string) {
  return users.find((u) => u.email === email) ?? null;
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE;
}
