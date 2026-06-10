import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getPaymentInfo, getSubscriptionInfo } from '@/lib/mercadopago';

function planFromReason(reason: string | undefined): string {
  if (!reason) return 'professional';
  if (reason.toLowerCase().includes('enterprise')) return 'enterprise';
  return 'professional';
}

export async function POST(request: NextRequest) {
  // Verify Mercado Pago webhook signature
  const xSignature = request.headers.get('x-signature');
  const xRequestId = request.headers.get('x-request-id');
  const webhookSecret = process.env.MP_WEBHOOK_SECRET;

  if (webhookSecret && xSignature) {
    const parts = Object.fromEntries(
      xSignature.split(',').map(p => {
        const [k, v] = p.trim().split('=');
        return [k, v];
      })
    );

    const dataId = new URL(request.url).searchParams.get('data.id') || '';
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;

    const { createHmac } = await import('crypto');
    const hmac = createHmac('sha256', webhookSecret).update(manifest).digest('hex');

    if (hmac !== parts.v1) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    if (!data?.id || !/^\d+$/.test(String(data.id))) {
      return NextResponse.json({ received: true });
    }

    const id = String(data.id);

    if (type === 'payment') {
      const payment = await getPaymentInfo(id);
      if (!payment) return NextResponse.json({ received: true });

      const userId = payment.external_reference;
      if (!userId) return NextResponse.json({ received: true });

      const supabase = createServerClient();

      if (payment.status === 'approved') {
        const { error: updateError } = await supabase.from('profiles').update({
          subscription_status: 'active',
          mp_customer_id: payment.payer?.id?.toString() || null,
        }).eq('id', userId);

        if (updateError) {
          throw new Error(`Failed to update profile: ${updateError.message}`);
        }
      }
    }

    if (type === 'subscription_preapproval') {
      const subscription = await getSubscriptionInfo(id);
      if (!subscription) return NextResponse.json({ received: true });

      const userId = subscription.external_reference;
      if (!userId) return NextResponse.json({ received: true });

      const supabase = createServerClient();

      const statusMap: Record<string, string> = {
        authorized: 'active',
        paused: 'past_due',
        cancelled: 'canceled',
        pending: 'trialing',
      };

      const { error: updateError } = await supabase.from('profiles').update({
        subscription_status: statusMap[subscription.status] || 'free',
        subscription_plan: planFromReason(subscription.reason),
        subscription_preapproval_id: subscription.id,
        subscription_current_period_end: subscription.next_payment_date || null,
      }).eq('id', userId);

      if (updateError) {
        throw new Error(`Failed to update profile subscription: ${updateError.message}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
