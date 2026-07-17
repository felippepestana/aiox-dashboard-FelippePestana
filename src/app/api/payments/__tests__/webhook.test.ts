import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/payments/webhook/route';

// ─── Module mocks ─────────────────────────────────────────────────────────────

const mockGetPaymentInfo = vi.fn();
const mockGetSubscriptionInfo = vi.fn();
const mockGetAuthorizedPaymentInfo = vi.fn();

vi.mock('@/lib/mercadopago', () => ({
  getPaymentInfo: (...args: unknown[]) => mockGetPaymentInfo(...args),
  getSubscriptionInfo: (...args: unknown[]) => mockGetSubscriptionInfo(...args),
  getAuthorizedPaymentInfo: (...args: unknown[]) => mockGetAuthorizedPaymentInfo(...args),
}));

// The route persists via upsert (profiles rows may not exist for new users)
const mockUpdate = vi.fn();

vi.mock('@/lib/supabase', () => ({
  createServerClient: () => ({
    from: vi.fn(() => ({
      upsert: mockUpdate,
    })),
  }),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/payments/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

async function parseJson(response: Response): Promise<unknown> {
  return response.json();
}

// ─── payment events ───────────────────────────────────────────────────────────

describe('POST /api/payments/webhook — payment events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({ error: null });
  });

  it('returns { received: true } with status 200 for an approved payment', async () => {
    mockGetPaymentInfo.mockResolvedValueOnce({
      status: 'approved',
      external_reference: 'user-1',
      payer: { id: 'mp-payer-1' },
    });

    const req = makeRequest({ type: 'payment', data: { id: '12345' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await parseJson(res)).toEqual({ received: true });
  });

  it('calls supabase update with subscription_status=active for approved payment', async () => {
    mockGetPaymentInfo.mockResolvedValueOnce({
      status: 'approved',
      external_reference: 'user-1',
      payer: { id: 'mp-payer-1' },
    });

    const req = makeRequest({ type: 'payment', data: { id: '12345' } });
    await POST(req);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_status: 'active',
        mp_customer_id: 'mp-payer-1',
      }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
    );
  });

  it('returns { received: true } without calling update when payment status is not approved', async () => {
    mockGetPaymentInfo.mockResolvedValueOnce({
      status: 'pending',
      external_reference: 'user-1',
      payer: { id: 'mp-payer-1' },
    });

    const req = makeRequest({ type: 'payment', data: { id: '12345' } });
    await POST(req);

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns { received: true } when getPaymentInfo returns null', async () => {
    mockGetPaymentInfo.mockResolvedValueOnce(null);

    const req = makeRequest({ type: 'payment', data: { id: '12345' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await parseJson(res)).toEqual({ received: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns { received: true } when payment has no external_reference', async () => {
    mockGetPaymentInfo.mockResolvedValueOnce({
      status: 'approved',
      external_reference: null,
      payer: { id: 'mp-payer-1' },
    });

    const req = makeRequest({ type: 'payment', data: { id: '12345' } });
    const res = await POST(req);

    expect(await parseJson(res)).toEqual({ received: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('stores null for mp_customer_id when payer id is absent', async () => {
    mockGetPaymentInfo.mockResolvedValueOnce({
      status: 'approved',
      external_reference: 'user-1',
      payer: {},
    });

    const req = makeRequest({ type: 'payment', data: { id: '99999' } });
    await POST(req);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ mp_customer_id: null }),
    );
  });
});

// ─── subscription_authorized_payment events (renewals) ───────────────────────

describe('POST /api/payments/webhook — subscription_authorized_payment events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({ error: null });
  });

  it('re-syncs the parent preapproval on a successful renewal charge', async () => {
    mockGetAuthorizedPaymentInfo.mockResolvedValueOnce({
      preapproval_id: 'sub-1',
      status: 'processed',
      payment: { status: 'approved' },
    });
    mockGetSubscriptionInfo.mockResolvedValueOnce({
      id: 'sub-1',
      status: 'authorized',
      external_reference: 'user-1',
      next_payment_date: '2025-02-01',
    });

    const req = makeRequest({ type: 'subscription_authorized_payment', data: { id: '777' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockGetSubscriptionInfo).toHaveBeenCalledWith('sub-1');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_status: 'active' }),
    );
  });

  it('marks the subscriber past_due when the renewal charge failed (recycling invoice)', async () => {
    mockGetAuthorizedPaymentInfo.mockResolvedValueOnce({
      preapproval_id: 'sub-1',
      status: 'recycling',
      payment: { status: 'rejected' },
    });
    // MP keeps the preapproval 'authorized' during retry windows
    mockGetSubscriptionInfo.mockResolvedValueOnce({
      id: 'sub-1',
      status: 'authorized',
      external_reference: 'user-1',
      next_payment_date: '2025-02-01',
    });

    const req = makeRequest({ type: 'subscription_authorized_payment', data: { id: '777' } });
    await POST(req);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_status: 'past_due' }),
    );
  });

  it('ignores authorized payments without a preapproval_id', async () => {
    mockGetAuthorizedPaymentInfo.mockResolvedValueOnce({ status: 'processed' });

    const req = makeRequest({ type: 'subscription_authorized_payment', data: { id: '777' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockGetSubscriptionInfo).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── subscription_preapproval events ──────────────────────────────────────────

describe('POST /api/payments/webhook — subscription_preapproval events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockResolvedValue({ error: null });
  });

  const statusMappings: Array<[string, string]> = [
    ['authorized', 'active'],
    ['paused', 'past_due'],
    ['cancelled', 'canceled'],
    // 'pending' (checkout started, not yet paid) must NOT map to an
    // active-equivalent status like 'trialing'
    ['pending', 'incomplete'],
  ];

  for (const [mpStatus, internalStatus] of statusMappings) {
    it(`maps MP status "${mpStatus}" → internal status "${internalStatus}"`, async () => {
      mockGetSubscriptionInfo.mockResolvedValueOnce({
        id: 'sub-1',
        status: mpStatus,
        external_reference: 'user-1',
        next_payment_date: '2025-01-01',
      });

      const req = makeRequest({ type: 'subscription_preapproval', data: { id: '55555' } });
      await POST(req);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ subscription_status: internalStatus }),
      );
    });
  }

  it('processes alphanumeric preapproval IDs (MP subscription IDs are not numeric)', async () => {
    mockGetSubscriptionInfo.mockResolvedValueOnce({
      id: '2c938084726fca480172750000000000',
      status: 'authorized',
      external_reference: 'user-1',
      next_payment_date: '2025-01-01',
    });

    const req = makeRequest({
      type: 'subscription_preapproval',
      data: { id: '2c938084726fca480172750000000000' },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockGetSubscriptionInfo).toHaveBeenCalledWith('2c938084726fca480172750000000000');
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_status: 'active' }),
    );
  });

  it('maps unknown MP status to "free"', async () => {
    mockGetSubscriptionInfo.mockResolvedValueOnce({
      id: 'sub-1',
      status: 'unknown_mp_status',
      external_reference: 'user-1',
      next_payment_date: '2025-01-01',
    });

    const req = makeRequest({ type: 'subscription_preapproval', data: { id: '55555' } });
    await POST(req);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_status: 'free' }),
    );
  });

  it('stores subscription_preapproval_id and next_payment_date', async () => {
    mockGetSubscriptionInfo.mockResolvedValueOnce({
      id: 'sub-42',
      status: 'authorized',
      external_reference: 'user-1',
      next_payment_date: '2025-06-01',
    });

    const req = makeRequest({ type: 'subscription_preapproval', data: { id: '55555' } });
    await POST(req);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_preapproval_id: 'sub-42',
        subscription_current_period_end: '2025-06-01',
      }),
    );
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1' }),
    );
  });

  it('returns { received: true } when getSubscriptionInfo returns null', async () => {
    mockGetSubscriptionInfo.mockResolvedValueOnce(null);

    const req = makeRequest({ type: 'subscription_preapproval', data: { id: '55555' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await parseJson(res)).toEqual({ received: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns { received: true } when subscription has no external_reference', async () => {
    mockGetSubscriptionInfo.mockResolvedValueOnce({
      id: 'sub-1',
      status: 'authorized',
      external_reference: null,
      next_payment_date: '2025-01-01',
    });

    const req = makeRequest({ type: 'subscription_preapproval', data: { id: '55555' } });
    const res = await POST(req);

    expect(await parseJson(res)).toEqual({ received: true });
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── Invalid / edge-case inputs ───────────────────────────────────────────────

describe('POST /api/payments/webhook — invalid inputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns { received: true } when data.id is non-numeric', async () => {
    const req = makeRequest({ type: 'payment', data: { id: 'not-a-number' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await parseJson(res)).toEqual({ received: true });
    expect(mockGetPaymentInfo).not.toHaveBeenCalled();
  });

  it('returns { received: true } when data is missing', async () => {
    const req = makeRequest({ type: 'payment' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await parseJson(res)).toEqual({ received: true });
    expect(mockGetPaymentInfo).not.toHaveBeenCalled();
  });

  it('returns { received: true } when data.id is undefined', async () => {
    const req = makeRequest({ type: 'payment', data: {} });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await parseJson(res)).toEqual({ received: true });
    expect(mockGetPaymentInfo).not.toHaveBeenCalled();
  });

  it('returns { received: true } for an unrecognized event type with valid numeric id', async () => {
    const req = makeRequest({ type: 'some_other_event', data: { id: '12345' } });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(await parseJson(res)).toEqual({ received: true });
    expect(mockGetPaymentInfo).not.toHaveBeenCalled();
    expect(mockGetSubscriptionInfo).not.toHaveBeenCalled();
  });
});

// ─── Error handling ───────────────────────────────────────────────────────────

describe('POST /api/payments/webhook — error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 500 when getPaymentInfo throws', async () => {
    mockGetPaymentInfo.mockRejectedValueOnce(new Error('MP API down'));

    const req = makeRequest({ type: 'payment', data: { id: '12345' } });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await parseJson(res)).toEqual({ error: 'Webhook processing failed' });
  });

  it('returns 500 when getSubscriptionInfo throws', async () => {
    mockGetSubscriptionInfo.mockRejectedValueOnce(new Error('MP API down'));

    const req = makeRequest({ type: 'subscription_preapproval', data: { id: '55555' } });
    const res = await POST(req);

    expect(res.status).toBe(500);
    expect(await parseJson(res)).toEqual({ error: 'Webhook processing failed' });
  });
});
