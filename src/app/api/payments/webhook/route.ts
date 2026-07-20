import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import {
  getPaymentInfo,
  getSubscriptionInfo,
  getAuthorizedPaymentInfo,
} from '@/lib/mercadopago';

/** Infers the subscription plan name from a Mercado Pago preapproval reason string. */
function planFromReason(reason: string | undefined): string {
  if (!reason) return 'professional';
  if (reason.toLowerCase().includes('enterprise')) return 'enterprise';
  return 'professional';
}

/**
 * Fetches a preapproval from Mercado Pago and syncs the owner profile's
 * subscription status/plan/period-end. Shared by the initial preapproval
 * event and recurring authorized-payment events. `forceStatus` overrides the
 * preapproval-derived status (e.g. 'past_due' when a renewal charge failed
 * but MP still reports the preapproval as 'authorized' during retries).
 */
async function syncSubscriptionFromPreapproval(
  preapprovalId: string,
  forceStatus?: string,
): Promise<void> {
  const subscription = await getSubscriptionInfo(preapprovalId);
  if (!subscription) return;

  const userId = subscription.external_reference;
  if (!userId) return;

  const supabase = createServerClient();

  // 'pending' means checkout started but not authorized/paid — it must NOT
  // grant active access, so it maps to the non-active 'incomplete' status.
  const statusMap: Record<string, string> = {
    authorized: 'active',
    paused: 'past_due',
    cancelled: 'canceled',
    pending: 'incomplete',
  };

  const fields = {
    subscription_status: forceStatus || statusMap[subscription.status] || 'free',
    subscription_plan: planFromReason(subscription.reason),
    subscription_preapproval_id: subscription.id,
    subscription_current_period_end: subscription.next_payment_date || null,
  };

  await persistProfileBilling(supabase, userId, fields, subscription.payer_email);
}

/**
 * Writes billing fields to the user's profile. Updates in place when the row
 * exists; inserts a full row (profiles.email/name are NOT NULL) when it
 * doesn't — legacy accounts may predate profile creation at signup, and a
 * zero-row update reports no error, silently dropping the paid state.
 */
async function persistProfileBilling(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  fields: Record<string, unknown>,
  email?: string | null,
): Promise<void> {
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId)
    .select('id');

  if (updateError) {
    throw new Error(`Failed to update profile subscription: ${updateError.message}`);
  }

  if (!updated || updated.length === 0) {
    const { error: insertError } = await supabase.from('profiles').insert({
      id: userId,
      email: email || `${userId}@sem-email.invalid`,
      name: 'Usuário',
      ...fields,
    });
    if (insertError) {
      throw new Error(`Failed to create profile for subscription: ${insertError.message}`);
    }
  }
}

/**
 * POST /api/payments/webhook — Mercado Pago webhook that verifies the HMAC
 * signature and updates the user's profile subscription state for payment,
 * preapproval, and recurring authorized-payment events.
 */
export async function POST(request: NextRequest) {
  // Verify Mercado Pago webhook signature
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  // The public sample value from .env.example must count as "not configured" —
  // anyone reading the repo could sign forged webhooks with it.
  const rawSecret = process.env.MP_WEBHOOK_SECRET;
  const webhookSecret =
    rawSecret && rawSecret !== 'your-mp-webhook-secret' ? rawSecret : undefined;
  const signedDataId = new URL(request.url).searchParams.get('data.id') || '';

  // Fail closed: with payments configured in production, an unsigned webhook
  // must never mutate billing state — anyone replaying a real MP resource ID
  // could otherwise force subscription updates.
  if (!webhookSecret && process.env.MP_ACCESS_TOKEN && process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(
      '[payments/webhook] MP_WEBHOOK_SECRET is not set in production — rejecting webhook',
      'error',
    );
    return NextResponse.json({ error: 'Webhook signature not configured' }, { status: 503 });
  }

  if (webhookSecret) {
    // A configured secret makes the signature mandatory — unsigned requests are rejected
    if (!xSignature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const parts = Object.fromEntries(
      xSignature.split(',').map(p => {
        const [k, v] = p.trim().split('=');
        return [k, v];
      })
    );

    const manifest = `id:${signedDataId};request-id:${xRequestId};ts:${parts.ts};`;

    const { createHmac, timingSafeEqual } = await import('crypto');
    const hmac = createHmac('sha256', webhookSecret).update(manifest).digest('hex');

    const expected = Buffer.from(hmac, 'utf8');
    const received = Buffer.from(String(parts.v1 ?? ''), 'utf8');
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    // Payment IDs are numeric; preapproval (subscription) IDs are alphanumeric
    // strings (e.g. "2c938084..."), so each type gets its own format guard.
    const id = String(data?.id ?? '');
    const isValidId =
      type === 'payment' || type === 'subscription_authorized_payment'
        ? /^\d+$/.test(id)
        : /^[A-Za-z0-9_-]{1,64}$/.test(id);

    if (!id || !isValidId) {
      return NextResponse.json({ received: true });
    }

    // The HMAC signs the query-string data.id — processing a different ID from
    // the body would let a signed/replayed request act on another resource.
    if (webhookSecret && signedDataId !== id) {
      return NextResponse.json({ error: 'ID mismatch' }, { status: 401 });
    }

    if (type === 'payment') {
      const payment = await getPaymentInfo(id);
      if (!payment) return NextResponse.json({ received: true });

      const userId = payment.external_reference;
      if (!userId) return NextResponse.json({ received: true });

      const supabase = createServerClient();

      if (payment.status === 'approved') {
        // Payment events only carry customer metadata — a replayed/old
        // approved-payment event must not overwrite 'canceled'/'past_due'
        // with 'active'. The preapproval is the authoritative subscription
        // state, so re-sync it when one is on file.
        const { data: prof, error: profError } = await supabase
          .from('profiles')
          .select('subscription_preapproval_id')
          .eq('id', userId)
          .single();
        if (profError && profError.code !== 'PGRST116') {
          throw new Error(`Failed to read profile: ${profError.message}`);
        }

        await persistProfileBilling(
          supabase,
          userId,
          { mp_customer_id: payment.payer?.id?.toString() || null },
          payment.payer?.email,
        );

        const preapprovalId = prof?.subscription_preapproval_id;
        if (preapprovalId) {
          await syncSubscriptionFromPreapproval(String(preapprovalId));
        }
      }
    }

    if (type === 'subscription_preapproval') {
      await syncSubscriptionFromPreapproval(id);
    }

    // Recurring subscription charges (renewals, failed monthly payments) arrive
    // under this topic — re-sync the parent preapproval so past-due subscribers
    // don't keep 'active' access until an unrelated preapproval event fires.
    if (type === 'subscription_authorized_payment') {
      const authorizedPayment = await getAuthorizedPaymentInfo(id);
      const preapprovalId = authorizedPayment?.preapproval_id;
      if (preapprovalId) {
        // MP keeps the preapproval 'authorized' while it retries a failed
        // charge ('recycling' invoices / rejected payments), so the invoice
        // status must drive the downgrade — not the preapproval status.
        const invoiceStatus = String(authorizedPayment.status ?? '');
        const chargeStatus = String(authorizedPayment.payment?.status ?? '');
        const renewalFailed =
          invoiceStatus === 'recycling' || chargeStatus === 'rejected';

        await syncSubscriptionFromPreapproval(
          String(preapprovalId),
          renewalFailed ? 'past_due' : undefined,
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
