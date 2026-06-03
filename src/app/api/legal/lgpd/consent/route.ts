import { NextResponse } from 'next/server';
import { getConsentStatus, recordConsent } from '@/lib/lgpd-compliance';
import type { ConsentPurpose } from '@/lib/lgpd-compliance';

// GET /api/legal/lgpd/consent?clientId=<id>
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId');

  if (!clientId) {
    return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
  }

  const consents = await getConsentStatus(clientId);
  return NextResponse.json({ consents });
}

// POST /api/legal/lgpd/consent
// Body: { clientId, purpose, granted }
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.clientId || !body.purpose || body.granted === undefined) {
      return NextResponse.json(
        { error: 'clientId, purpose, and granted are required' },
        { status: 400 },
      );
    }

    const result = await recordConsent(
      body.clientId,
      body.purpose as ConsentPurpose,
      Boolean(body.granted),
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
