import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthUser,
  unauthorized,
  notFound,
  serverError,
  badRequest,
} from '@/lib/api-utils';
import { getClientById, updateClient, deleteClient } from '@/lib/db/clients';

type RouteContext = { params: Promise<{ id: string }> };

/** GET /api/legal/clients/[id] — fetches a single client owned by the authenticated user. */
export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const client = await getClientById(user.id, id);
    if (!client) return notFound('Client not found');
    return NextResponse.json({ client });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to fetch client:', error);
    return notFound('Client not found');
  }
}

/** PATCH /api/legal/clients/[id] — partially updates a client owned by the authenticated user. */
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
    const client = await updateClient(user.id, id, body);
    if (!client) return notFound('Client not found');
    return NextResponse.json({ client });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to update client:', error);
    return serverError();
  }
}

// Keep PUT as an alias for PATCH for backward compatibility
/** PUT /api/legal/clients/[id] — backward-compatible alias that delegates to PATCH. */
export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
}

/** DELETE /api/legal/clients/[id] — deletes a client owned by the authenticated user. */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    await deleteClient(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to delete client:', error);
    return serverError();
  }
}
