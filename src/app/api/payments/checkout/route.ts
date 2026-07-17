import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createSubscription } from '@/lib/mercadopago';
import { createServerClient } from '@/lib/supabase';

/**
 * POST /api/payments/checkout — creates a Mercado Pago subscription for the
 * requested plan and returns the checkout init point URL.
 */
export async function POST(request: NextRequest) {
  const sessionCookie = request.cookies.get('aiox_session')?.value;
  if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await validateSession(sessionCookie);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { plan } = await request.json();
    // Enterprise is consultation-only (sales-led) — self-serve checkout is
    // restricted to the professional plan.
    if (plan !== 'professional') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // A subscriber with an active/trialing preapproval must not start a second
    // recurring subscription (double billing) — MP would happily create one.
    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_preapproval_id')
      .eq('id', user.id)
      .single();

    if (
      profile?.subscription_preapproval_id &&
      ['active', 'trialing'].includes(profile.subscription_status ?? '')
    ) {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura ativa.' },
        { status: 409 },
      );
    }

    const subscription = await createSubscription({
      planId: plan,
      userEmail: user.email,
      userId: user.id,
    });

    return NextResponse.json({
      subscriptionId: subscription.id,
      initPoint: subscription.init_point || `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${subscription.id}`,
    });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
  }
}
