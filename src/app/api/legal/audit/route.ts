import { NextResponse } from 'next/server';
import { getAuditLog, logAuditEvent } from '@/lib/audit-log';
import type { AuditAction, AuditResourceType } from '@/lib/audit-log';

// GET /api/legal/audit
// Query params: userId, resourceType, action, dateFrom, dateTo, page, pageSize, search
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const filters = {
    userId: searchParams.get('userId') ?? undefined,
    resourceType: (searchParams.get('resourceType') as AuditResourceType) ?? undefined,
    action: (searchParams.get('action') as AuditAction) ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    pageSize: searchParams.get('pageSize') ? Number(searchParams.get('pageSize')) : 50,
  };

  const result = await getAuditLog(filters);

  return NextResponse.json(result);
}

// POST /api/legal/audit
// Body: { userId, action, resourceType, resourceId?, details?, ipAddress?, userAgent? }
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.userId || !body.action || !body.resourceType) {
      return NextResponse.json(
        { error: 'userId, action, and resourceType are required' },
        { status: 400 },
      );
    }

    // Resolve client IP from headers when the body doesn't supply one
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = body.ipAddress ?? forwarded?.split(',')[0]?.trim() ?? 'unknown';
    const userAgent = body.userAgent ?? request.headers.get('user-agent') ?? undefined;

    await logAuditEvent({
      userId: body.userId,
      action: body.action as AuditAction,
      resourceType: body.resourceType as AuditResourceType,
      resourceId: body.resourceId,
      details: body.details,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
