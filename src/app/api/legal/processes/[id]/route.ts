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

export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const process = await getProcessById(user.id, id);
    if (!process) return notFound('Process not found');
    return NextResponse.json({ process });
  } catch (error) {
    console.error('Failed to fetch process:', error);
    return notFound('Process not found');
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
    const process = await updateProcess(user.id, id, body);
    if (!process) return notFound('Process not found');
    return NextResponse.json({ process });
  } catch (error) {
    console.error('Failed to update process:', error);
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
    await deleteProcess(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete process:', error);
    return serverError();
  }
}
