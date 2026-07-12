import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorized, serverError, badRequest } from '@/lib/api-utils';
import { getPetitions, createPetition } from '@/lib/db/petitions';

/** GET /api/legal/petitions — lists the authenticated user's petitions, optionally filtered by status and process. */
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const filters = {
    status: searchParams.get('status') ?? undefined,
    processId: searchParams.get('processId') ?? undefined,
  };

  try {
    const petitions = await getPetitions(user.id, filters);
    return NextResponse.json({ petitions });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to fetch petitions:', error);
    return serverError();
  }
}

/** POST /api/legal/petitions — creates a new petition for the authenticated user (title required). */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }

  if (!body.title) {
    return badRequest('title is required');
  }

  try {
    const petition = await createPetition(user.id, body as unknown as Parameters<typeof createPetition>[1]);
    return NextResponse.json({ petition }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to create petition:', error);
    return serverError();
  }
}
