import { NextResponse } from 'next/server';
import { generateDataReport } from '@/lib/lgpd-compliance';
import { logAuditEvent } from '@/lib/audit-log';
import { getSession } from '@/lib/auth';

// GET /api/legal/lgpd/export?clientId=<id>
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  const session = await getSession();
  const userId = session?.id ?? 'anonymous';

  const report = await generateDataReport(clientId);

  // Log the export event
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded?.split(',')[0]?.trim() ?? 'unknown';

  await logAuditEvent({
    userId,
    action: 'export',
    resourceType: 'client',
    resourceId: clientId,
    details: { reason: 'LGPD Right to Access (Art. 18, II)', recordCount: report.processes.length + report.petitions.length },
    ipAddress,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  return NextResponse.json(report);
}
