import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorized, serverError, badRequest } from '@/lib/api-utils';
import { getProcesses, createProcess } from '@/lib/db/processes';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { searchParams } = new URL(request.url);
  const filters = {
    area: searchParams.get('area') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  };

  try {
    const processes = await getProcesses(user.id, filters);
    return NextResponse.json({ processes });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to fetch processes:', error);
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

  if (!body.title && !body.cnj) {
    return badRequest('Either title or cnj is required');
  }

  try {
    const process = await createProcess(user.id, body);
    return NextResponse.json({ process }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to create process:', error);
    return serverError();
  }
}
