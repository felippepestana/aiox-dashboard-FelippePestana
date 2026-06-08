import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getPaymentInfo, getSubscriptionInfo } from '@/lib/mercadopago';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (type === 'payment') {
      const payment = await getPaymentInfo(data.id);
      if (!payment) return NextResponse.json({ received: true });

      const userId = payment.external_reference;
      if (!userId) return NextResponse.json({ received: true });

      const supabase = createServerClient();

      if (payment.status === 'approved') {
        await supabase.from('profiles').update({
          subscription_status: 'active',
          subscription_plan: 'professional',
          mp_customer_id: payment.payer?.id?.toString() || null,
        }).eq('id', userId);
      }
    }

    if (type === 'subscription_preapproval') {
      const subscription = await getSubscriptionInfo(data.id);
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

      await supabase.from('profiles').update({
        subscription_status: statusMap[subscription.status] || 'free',
        subscription_preapproval_id: subscription.id,
        subscription_current_period_end: subscription.next_payment_date || null,
      }).eq('id', userId);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
