// Auth Library — Stateless cookie-based auth (works in serverless/Vercel)

import { cookies } from 'next/headers';
import { createHash, randomBytes } from 'crypto';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
}

const SESSION_COOKIE = 'aiox_session';
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const DEFAULT_USERS: Array<User & { passwordHash: string }> = [
  {
    id: 'usr-admin-001',
    email: 'admin@aiox.legal',
    name: 'Administrador',
    role: 'admin',
    passwordHash: createHash('sha256').update('admin123').digest('hex'),
  },
];

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function findUserByEmail(email: string): (User & { passwordHash: string }) | undefined {
  return DEFAULT_USERS.find(u => u.email === email);
}

function encodeSession(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + SESSION_TTL,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeSession(token: string): User | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString('utf-8'));
    if (payload.exp < Date.now()) return null;
    return { id: payload.id, email: payload.email, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

export async function createSession(user: User): Promise<string> {
  const token = encodeSession(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL / 1000,
    path: '/',
  });
  return token;
}

export async function getSession(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
