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

    const existingPreapproval = profile?.subscription_preapproval_id;
    const status = profile?.subscription_status ?? '';

    if (existingPreapproval && ['active', 'trialing'].includes(status)) {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura ativa.' },
        { status: 409 },
      );
    }

    // Recovery path: an abandoned checkout ('incomplete') or a failing renewal
    // ('past_due') already has a preapproval — send the user back to it
    // instead of creating a second recurring subscription (double billing).
    if (existingPreapproval && ['incomplete', 'past_due'].includes(status)) {
      return NextResponse.json({
        subscriptionId: existingPreapproval,
        initPoint: `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${existingPreapproval}`,
      });
    }

    const subscription = await createSubscription({
      planId: plan,
      userEmail: user.email,
      userId: user.id,
    });

    // Persist the pending preapproval NOW, not only when the webhook lands —
    // otherwise a retry (or concurrent request) before webhook delivery sees
    // no preapproval and creates a second subscription. Best-effort: the
    // webhook remains the source of truth for the final status.
    const { error: persistError } = await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      name: user.name,
      subscription_status: 'incomplete',
      subscription_plan: plan,
      subscription_preapproval_id: subscription.id,
    });
    if (persistError) {
      Sentry.captureMessage(
        `[payments/checkout] failed to persist pending preapproval: ${persistError.message}`,
        'error',
      );
    }

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
