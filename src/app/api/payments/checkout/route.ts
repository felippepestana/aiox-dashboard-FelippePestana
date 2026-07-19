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

    const supabase = createServerClient();

    // Ensure the profiles row exists (legacy accounts may predate
    // profile-at-signup) without clobbering existing email/name.
    const { error: ensureError } = await supabase.from('profiles').upsert(
      { id: user.id, email: user.email, name: user.name },
      { onConflict: 'id', ignoreDuplicates: true },
    );
    if (ensureError) {
      Sentry.captureException(ensureError);
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }

    // A subscriber with an active/trialing preapproval must not start a second
    // recurring subscription (double billing) — MP would happily create one.
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_preapproval_id')
      .eq('id', user.id)
      .single();
    if (profileError) {
      Sentry.captureException(profileError);
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }

    const existingPreapproval = profile?.subscription_preapproval_id;
    const priorStatus = profile?.subscription_status ?? 'free';

    if (existingPreapproval && ['active', 'trialing'].includes(priorStatus)) {
      return NextResponse.json(
        { error: 'Você já possui uma assinatura ativa.' },
        { status: 409 },
      );
    }

    // Recovery path: an abandoned checkout ('incomplete') or a failing renewal
    // ('past_due') already has a preapproval — send the user back to it
    // instead of creating a second recurring subscription (double billing).
    if (existingPreapproval && ['incomplete', 'past_due'].includes(priorStatus)) {
      return NextResponse.json({
        subscriptionId: existingPreapproval,
        initPoint: `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_id=${existingPreapproval}`,
      });
    }

    // Atomic claim BEFORE calling Mercado Pago: the conditional update only
    // succeeds while no preapproval is stored, so of N concurrent requests
    // exactly one proceeds — the rest get 409 instead of minting duplicate
    // recurring subscriptions.
    const { data: claimed, error: claimError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'incomplete', subscription_plan: plan })
      .eq('id', user.id)
      .is('subscription_preapproval_id', null)
      .select('id');
    if (claimError) {
      Sentry.captureException(claimError);
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
    }
    if (!claimed || claimed.length === 0) {
      return NextResponse.json(
        { error: 'Um checkout já está em andamento. Tente novamente em instantes.' },
        { status: 409 },
      );
    }

    let subscription;
    try {
      subscription = await createSubscription({
        planId: plan,
        userEmail: user.email,
        userId: user.id,
      });
    } catch (mpError) {
      // Release the claim so a retry is possible
      await supabase
        .from('profiles')
        .update({ subscription_status: priorStatus })
        .eq('id', user.id)
        .is('subscription_preapproval_id', null);
      throw mpError;
    }

    // Persisting the preapproval is NOT best-effort: without it the
    // deduplication above cannot see this subscription on the next request.
    const { error: persistError } = await supabase
      .from('profiles')
      .update({ subscription_preapproval_id: subscription.id })
      .eq('id', user.id);
    if (persistError) {
      Sentry.captureMessage(
        `[payments/checkout] failed to persist pending preapproval ${subscription.id}: ${persistError.message}`,
        'error',
      );
      return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 });
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
