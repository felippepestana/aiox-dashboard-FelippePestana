// Shared API helper utilities for APEX Legal route handlers

import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import type { User } from '@/lib/auth';

/**
 * Extract and validate the authenticated user from an API request.
 * Reads the `aiox_session` cookie and delegates to validateSession.
 * Returns null when the session is absent or invalid.
 */
export async function getAuthUser(request: NextRequest): Promise<User | null> {
  const sessionCookie = request.cookies.get('aiox_session')?.value;
  if (!sessionCookie) return null;
  return validateSession(sessionCookie);
}

/**
 * Return a 401 Unauthorized JSON response.
 */
export function unauthorized(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

/**
 * Return a 404 Not Found JSON response.
 */
export function notFound(message = 'Not found'): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Return a 400 Bad Request JSON response.
 */
export function badRequest(message = 'Invalid request body'): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/**
 * Return a 500 Internal Server Error JSON response.
 */
export function serverError(message = 'Internal server error'): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 });
}
