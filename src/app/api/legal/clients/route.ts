import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorized, serverError, badRequest } from '@/lib/api-utils';
import { getClients, createClient } from '@/lib/db/clients';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const filters = {
    type: searchParams.get('type') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  };

  try {
    const clients = await getClients(user.id, filters);
    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Failed to fetch clients:', error);
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

  if (!body.name) {
    return badRequest('name is required');
  }

  try {
    const client = await createClient(user.id, body as unknown as Parameters<typeof createClient>[1]);
    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error('Failed to create client:', error);
    return serverError();
  }
}
