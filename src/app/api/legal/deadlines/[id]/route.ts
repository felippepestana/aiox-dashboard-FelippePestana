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

export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const deadline = await getDeadlineById(user.id, id);
    if (!deadline) return notFound('Deadline not found');
    return NextResponse.json({ deadline });
  } catch (error) {
    console.error('Failed to fetch deadline:', error);
    return notFound('Deadline not found');
  }
}

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
    console.error('Failed to update deadline:', error);
    return serverError();
  }
}

// Keep PUT as an alias for PATCH for backward compatibility
export async function PUT(request: NextRequest, context: RouteContext) {
  return PATCH(request, context);
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    await deleteDeadline(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete deadline:', error);
    return serverError();
  }
}
