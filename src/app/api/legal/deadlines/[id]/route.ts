import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthUser,
  unauthorized,
  notFound,
  serverError,
  badRequest,
} from '@/lib/api-utils';
import { getDeadlineById, updateDeadline, deleteDeadline } from '@/lib/db/deadlines';

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/legal/deadlines/[id] — fetches a single deadline owned by the authenticated user. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const deadline = await getDeadlineById(user.id, id);
    if (!deadline) return notFound('Deadline not found');
    return NextResponse.json({ deadline });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to fetch deadline:', error);
    return notFound('Deadline not found');
  }
}

/** PATCH /api/legal/deadlines/[id] — partially updates a deadline owned by the authenticated user. */
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
    const deadline = await updateDeadline(user.id, id, body);
    if (!deadline) return notFound('Deadline not found');
    return NextResponse.json({ deadline });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to update deadline:', error);
    return serverError();
  }
}

// Keep PUT as an alias for PATCH for backward compatibility
/** PUT /api/legal/deadlines/[id] — backward-compatible alias that delegates to PATCH. */
export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
}

/** DELETE /api/legal/deadlines/[id] — deletes a deadline owned by the authenticated user. */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    await deleteDeadline(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to delete deadline:', error);
    return serverError();
  }
}
