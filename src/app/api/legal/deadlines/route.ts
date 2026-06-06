import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorized, serverError, badRequest } from '@/lib/api-utils';
import { getDeadlines, createDeadline, updateDeadline } from '@/lib/db/deadlines';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const filters = {
    status: searchParams.get('status') ?? undefined,
    processId: searchParams.get('processId') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  };

  try {
    const result = await getDeadlines(user.id, filters, searchParams);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch deadlines:', error);
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
  if (!body.dueDate) {
    return badRequest('dueDate is required');
  }

  try {
    const deadline = await createDeadline(user.id, body as unknown as Parameters<typeof createDeadline>[1]);
    return NextResponse.json({ deadline }, { status: 201 });
  } catch (error) {
    console.error('Failed to create deadline:', error);
    return serverError();
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return badRequest('id query parameter is required');
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }

  try {
    const deadline = await updateDeadline(user.id, id, body as unknown as Parameters<typeof updateDeadline>[2]);
    return NextResponse.json({ deadline });
  } catch (error) {
    console.error('Failed to update deadline:', error);
    return serverError();
  }
}
