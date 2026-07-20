import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  createCheckoutPreference,
  createSubscription,
  getPaymentInfo,
  getSubscriptionInfo,
} from '@/lib/mercadopago';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOkResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeErrorResponse(body: unknown, status = 400): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── createCheckoutPreference ─────────────────────────────────────────────────

describe('createCheckoutPreference', () => {
  beforeEach(() => {
    process.env.MP_ACCESS_TOKEN = 'test-token';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test';
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    delete process.env.MP_ACCESS_TOKEN;
    delete process.env.NEXT_PUBLIC_APP_URL;
    vi.restoreAllMocks();
  });

  it('throws when MP_ACCESS_TOKEN is not set', async () => {
    delete process.env.MP_ACCESS_TOKEN;
    await expect(
      createCheckoutPreference({ planName: 'Pro', priceInCents: 19700, userEmail: 'a@b.com', userId: 'u1' }),
    ).rejects.toThrow('MP_ACCESS_TOKEN not configured');
  });

  it('calls the correct MP endpoint with POST', async () => {
    const preference = { id: 'pref-1', init_point: 'https://mp.com/pay', sandbox_init_point: 'https://sandbox.mp.com/pay' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse(preference));

    await createCheckoutPreference({ planName: 'Pro', priceInCents: 19700, userEmail: 'a@b.com', userId: 'u1' });

    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(String(url)).toBe('https://api.mercadopago.com/checkout/preferences');
    expect((init as RequestInit).method).toBe('POST');
  });

  it('sends Authorization header with Bearer token', async () => {
    const preference = { id: 'pref-1', init_point: 'https://mp.com/pay', sandbox_init_point: 'https://sandbox.mp.com/pay' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse(preference));

    await createCheckoutPreference({ planName: 'Pro', priceInCents: 19700, userEmail: 'a@b.com', userId: 'u1' });

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-token');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('sends correctly shaped body', async () => {
    const preference = { id: 'pref-1', init_point: 'https://mp.com/pay', sandbox_init_point: 'https://sandbox.mp.com/pay' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse(preference));

    await createCheckoutPreference({ planName: 'Pro', priceInCents: 19700, userEmail: 'user@example.com', userId: 'user-123' });

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);

    expect(body.items[0].title).toContain('Pro');
    expect(body.items[0].unit_price).toBe(197); // 19700 / 100
    expect(body.items[0].currency_id).toBe('BRL');
    expect(body.payer.email).toBe('user@example.com');
    expect(body.external_reference).toBe('user-123');
    expect(body.back_urls.success).toContain('/legal/billing?status=success');
  });

  it('returns the parsed MPPreference on success', async () => {
    const preference = { id: 'pref-1', init_point: 'https://mp.com/pay', sandbox_init_point: 'https://sandbox.mp.com/pay' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse(preference));

    const result = await createCheckoutPreference({ planName: 'Pro', priceInCents: 19700, userEmail: 'a@b.com', userId: 'u1' });

    expect(result).toEqual(preference);
  });

  it('throws when the API response is not ok', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeErrorResponse({ message: 'Invalid credentials' }, 401));

    await expect(
      createCheckoutPreference({ planName: 'Pro', priceInCents: 19700, userEmail: 'a@b.com', userId: 'u1' }),
    ).rejects.toThrow('Invalid credentials');
  });
});

// ─── createSubscription ───────────────────────────────────────────────────────

describe('createSubscription', () => {
  beforeEach(() => {
    process.env.MP_ACCESS_TOKEN = 'test-token';
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.test';
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    delete process.env.MP_ACCESS_TOKEN;
    delete process.env.NEXT_PUBLIC_APP_URL;
    vi.restoreAllMocks();
  });

  it('throws when MP_ACCESS_TOKEN is not set', async () => {
    delete process.env.MP_ACCESS_TOKEN;
    await expect(
      createSubscription({ planId: 'professional', userEmail: 'a@b.com', userId: 'u1' }),
    ).rejects.toThrow('MP_ACCESS_TOKEN not configured');
  });

  it('sets transaction_amount to 197 for professional plan', async () => {
    const subscription = { id: 'sub-1', status: 'authorized', payer_email: 'a@b.com', next_payment_date: '2025-01-01' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse(subscription));

    await createSubscription({ planId: 'professional', userEmail: 'a@b.com', userId: 'u1' });

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.auto_recurring.transaction_amount).toBe(197);
  });

  it('sets transaction_amount to 997 for enterprise plan', async () => {
    const subscription = { id: 'sub-2', status: 'authorized', payer_email: 'a@b.com', next_payment_date: '2025-01-01' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse(subscription));

    await createSubscription({ planId: 'enterprise', userEmail: 'a@b.com', userId: 'u1' });

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.auto_recurring.transaction_amount).toBe(997);
  });

  it('calls the correct MP endpoint with POST', async () => {
    const subscription = { id: 'sub-1', status: 'authorized', payer_email: 'a@b.com', next_payment_date: '2025-01-01' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse(subscription));

    await createSubscription({ planId: 'professional', userEmail: 'a@b.com', userId: 'u1' });

    const [url, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(String(url)).toBe('https://api.mercadopago.com/preapproval');
    expect((init as RequestInit).method).toBe('POST');
  });

  it('sends Authorization header with Bearer token', async () => {
    const subscription = { id: 'sub-1', status: 'authorized', payer_email: 'a@b.com', next_payment_date: '2025-01-01' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse(subscription));

    await createSubscription({ planId: 'professional', userEmail: 'a@b.com', userId: 'u1' });

    const [, init] = vi.mocked(globalThis.fetch).mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer test-token');
  });

  it('returns the parsed MPSubscription on success', async () => {
    const subscription = { id: 'sub-1', status: 'authorized', payer_email: 'a@b.com', next_payment_date: '2025-01-01' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse(subscription));

    const result = await createSubscription({ planId: 'professional', userEmail: 'a@b.com', userId: 'u1' });

    expect(result).toEqual(subscription);
  });

  it('throws when the API response is not ok', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeErrorResponse({ message: 'Plan not found' }, 404));

    await expect(
      createSubscription({ planId: 'professional', userEmail: 'a@b.com', userId: 'u1' }),
    ).rejects.toThrow('Plan not found');
  });
});

// ─── getPaymentInfo ───────────────────────────────────────────────────────────

describe('getPaymentInfo', () => {
  beforeEach(() => {
    process.env.MP_ACCESS_TOKEN = 'test-token';
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    delete process.env.MP_ACCESS_TOKEN;
    vi.restoreAllMocks();
  });

  it('throws when MP_ACCESS_TOKEN is not set', async () => {
    delete process.env.MP_ACCESS_TOKEN;
    await expect(getPaymentInfo('pay-1')).rejects.toThrow('MP_ACCESS_TOKEN not configured');
  });

  it('returns parsed payment data on success', async () => {
    const payment = { id: 'pay-1', status: 'approved', external_reference: 'user-1' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse(payment));

    const result = await getPaymentInfo('pay-1');

    expect(result).toEqual(payment);
  });

  it('calls the correct MP endpoint with the payment ID', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse({ id: 'pay-1' }));

    await getPaymentInfo('pay-1');

    const [url] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(String(url)).toBe('https://api.mercadopago.com/v1/payments/pay-1');
  });

  it('returns null when the API response is not ok', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeErrorResponse({ message: 'Not found' }, 404));

    const result = await getPaymentInfo('nonexistent');

    expect(result).toBeNull();
  });
});

// ─── getSubscriptionInfo ──────────────────────────────────────────────────────

describe('getSubscriptionInfo', () => {
  beforeEach(() => {
    process.env.MP_ACCESS_TOKEN = 'test-token';
    vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    delete process.env.MP_ACCESS_TOKEN;
    vi.restoreAllMocks();
  });

  it('throws when MP_ACCESS_TOKEN is not set', async () => {
    delete process.env.MP_ACCESS_TOKEN;
    await expect(getSubscriptionInfo('sub-1')).rejects.toThrow('MP_ACCESS_TOKEN not configured');
  });

  it('returns parsed subscription data on success', async () => {
    const sub = { id: 'sub-1', status: 'authorized', payer_email: 'a@b.com', next_payment_date: '2025-01-01' };
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse(sub));

    const result = await getSubscriptionInfo('sub-1');

    expect(result).toEqual(sub);
  });

  it('calls the correct MP endpoint with the preapproval ID', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeOkResponse({ id: 'sub-1' }));

    await getSubscriptionInfo('sub-1');

    const [url] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(String(url)).toBe('https://api.mercadopago.com/preapproval/sub-1');
  });

  it('returns null when the API response is not ok', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(makeErrorResponse({ message: 'Not found' }, 404));

    const result = await getSubscriptionInfo('nonexistent');

    expect(result).toBeNull();
  });
});
