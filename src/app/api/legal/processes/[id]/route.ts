import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthUser,
  unauthorized,
  notFound,
  serverError,
  badRequest,
} from '@/lib/api-utils';
import { getProcessById, updateProcess, deleteProcess } from '@/lib/db/processes';

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/legal/processes/[id] — fetches a single legal process owned by the authenticated user. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const process = await getProcessById(user.id, id);
    if (!process) return notFound('Process not found');
    return NextResponse.json({ process });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to fetch process:', error);
    return notFound('Process not found');
  }
}

/** PATCH /api/legal/processes/[id] — partially updates a legal process owned by the authenticated user. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }

  try {
    const process = await updateProcess(user.id, id, body);
    if (!process) return notFound('Process not found');
    return NextResponse.json({ process });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to update process:', error);
    return serverError();
  }
}

// Keep PUT as an alias for PATCH for backward compatibility
/** PUT /api/legal/processes/[id] — backward-compatible alias that delegates to PATCH. */
export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
}

/** DELETE /api/legal/processes/[id] — deletes a legal process owned by the authenticated user. */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    await deleteProcess(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to delete process:', error);
    return serverError();
  }
}
