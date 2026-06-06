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

export async function GET(request: NextRequest, { params }: RouteContext) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const { id } = await params;

  try {
    const client = await getClientById(user.id, id);
    if (!client) return notFound('Client not found');
    return NextResponse.json({ client });
  } catch (error) {
    console.error('Failed to fetch client:', error);
    return notFound('Client not found');
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
    const client = await updateClient(user.id, id, body);
    if (!client) return notFound('Client not found');
    return NextResponse.json({ client });
  } catch (error) {
    console.error('Failed to update client:', error);
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
    await deleteClient(user.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete client:', error);
    return serverError();
  }
}
