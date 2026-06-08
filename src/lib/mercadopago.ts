// Mercado Pago integration — uses direct fetch to the MP REST API.
// No npm package required; this avoids a build-time dependency.

interface MPPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

interface MPSubscription {
  id: string;
  status: string;
  payer_email: string;
  next_payment_date: string;
  init_point?: string;
}

export async function createCheckoutPreference(params: {
  planName: string;
  priceInCents: number;
  userEmail: string;
  userId: string;
}): Promise<MPPreference> {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

  const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      items: [{
        title: `APEX Legal - Plano ${params.planName}`,
        quantity: 1,
        unit_price: params.priceInCents / 100,
        currency_id: 'BRL',
      }],
      payer: { email: params.userEmail },
      external_reference: params.userId,
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/legal/billing?status=success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/legal/billing?status=failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL}/legal/billing?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create preference');
  }

  return response.json();
}

export async function createSubscription(params: {
  planId: string;
  userEmail: string;
  userId: string;
}): Promise<MPSubscription> {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

  const response = await fetch('https://api.mercadopago.com/preapproval', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      reason: `APEX Legal - Assinatura ${params.planId}`,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: params.planId === 'professional' ? 197 : 997,
        currency_id: 'BRL',
      },
      payer_email: params.userEmail,
      external_reference: params.userId,
      back_url: `${process.env.NEXT_PUBLIC_APP_URL}/legal/billing`,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create subscription');
  }

  return response.json();
}

export async function getPaymentInfo(paymentId: string) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Mercado Pago API error (${response.status})`);
  }
  return response.json();
}

export async function getSubscriptionInfo(preapprovalId: string) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

  const response = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Mercado Pago API error (${response.status})`);
  }
  return response.json();
}
