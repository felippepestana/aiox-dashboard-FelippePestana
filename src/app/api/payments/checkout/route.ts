import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth';
import { createSubscription } from '@/lib/mercadopago';

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
    if (!plan || !['professional', 'enterprise'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
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
