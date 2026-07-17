// Mercado Pago integration — uses direct fetch to the MP REST API.
// No npm package required; this avoids a build-time dependency.

/** Fetch wrapper for Mercado Pago API calls with a 10-second abort timeout. */
async function mpFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

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

/**
 * Create a one-time Mercado Pago checkout preference for a plan purchase
 * and return the preference with its payment init_point URLs.
 */
export async function createCheckoutPreference(params: {
  planName: string;
  priceInCents: number;
  userEmail: string;
  userId: string;
}): Promise<MPPreference> {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL not configured');

  const response = await mpFetch('https://api.mercadopago.com/checkout/preferences', {
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
        success: `${appUrl}/legal/billing?status=success`,
        failure: `${appUrl}/legal/billing?status=failure`,
        pending: `${appUrl}/legal/billing?status=pending`,
      },
      auto_return: 'approved',
      notification_url: `${appUrl}/api/payments/webhook`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create preference');
  }

  return response.json();
}

/**
 * Create a monthly recurring Mercado Pago subscription (preapproval) for a plan.
 */
export async function createSubscription(params: {
  planId: string;
  userEmail: string;
  userId: string;
}): Promise<MPSubscription> {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error('NEXT_PUBLIC_APP_URL not configured');

  const response = await mpFetch('https://api.mercadopago.com/preapproval', {
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
      back_url: `${appUrl}/legal/billing`,
      notification_url: `${appUrl}/api/payments/webhook`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create subscription');
  }

  return response.json();
}

/**
 * Fetch payment details from Mercado Pago; returns null when the payment is not found.
 */
export async function getPaymentInfo(paymentId: string) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

  const response = await mpFetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Mercado Pago API error (${response.status})`);
  }
  return response.json();
}

/**
 * Fetch a recurring authorized payment (subscription charge) from Mercado Pago;
 * returns null when not found. The result includes `preapproval_id`, linking
 * the charge back to its subscription.
 */
export async function getAuthorizedPaymentInfo(authorizedPaymentId: string) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

  const response = await mpFetch(`https://api.mercadopago.com/authorized_payments/${authorizedPaymentId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Mercado Pago API error (${response.status})`);
  }
  return response.json();
}

/**
 * Fetch subscription (preapproval) details from Mercado Pago; returns null when not found.
 */
export async function getSubscriptionInfo(preapprovalId: string) {
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) throw new Error('MP_ACCESS_TOKEN not configured');

  const response = await mpFetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Mercado Pago API error (${response.status})`);
  }
  return response.json();
}
