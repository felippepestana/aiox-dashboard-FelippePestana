import { NextResponse } from 'next/server';
import { anonymizeClient } from '@/lib/lgpd-compliance';
import { logAuditEvent } from '@/lib/audit-log';
import { getSession } from '@/lib/auth';

// POST /api/legal/lgpd/anonymize
// Body: { clientId }
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const session = await getSession();
    const userId = session?.id ?? 'anonymous';

    const result = await anonymizeClient(body.clientId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Audit the destructive action
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded?.split(',')[0]?.trim() ?? 'unknown';

    await logAuditEvent({
      userId,
      action: 'delete',
      resourceType: 'client',
      resourceId: body.clientId,
      details: { reason: 'LGPD Right to Erasure (Art. 18, VI)', anonymized: true },
      ipAddress,
      userAgent: request.headers.get('user-agent') ?? undefined,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
