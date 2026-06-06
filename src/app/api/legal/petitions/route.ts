import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorized, serverError, badRequest } from '@/lib/api-utils';
import { getPetitions, createPetition } from '@/lib/db/petitions';

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
    console.error('Failed to fetch petitions:', error);
    return serverError();
  }
}

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
    console.error('Failed to create petition:', error);
    return serverError();
  }
}
