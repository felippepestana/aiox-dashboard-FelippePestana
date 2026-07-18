import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, unauthorized, serverError, badRequest } from '@/lib/api-utils';
import { getFinancialSummary, createTransaction } from '@/lib/db/financial';
import { hasActiveFeature, PLAN_FEATURE_REQUIRED_MESSAGE } from '@/lib/plan-access';

/** GET /api/legal/financial — returns the authenticated user's financial summary. */
export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  // Paid-module gate: financial_module requires an active Professional+ subscription
  if (!(await hasActiveFeature(user.id, 'financial_module'))) {
    return NextResponse.json({ error: PLAN_FEATURE_REQUIRED_MESSAGE }, { status: 402 });
  }

  try {
    const data = await getFinancialSummary(user.id);
    return NextResponse.json(data);
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to fetch financial data:', error);
    return serverError();
  }
}

/** POST /api/legal/financial — records an income or expense transaction for the authenticated user. */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  // Paid-module gate: financial_module requires an active Professional+ subscription
  if (!(await hasActiveFeature(user.id, 'financial_module'))) {
    return NextResponse.json({ error: PLAN_FEATURE_REQUIRED_MESSAGE }, { status: 402 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return badRequest();
  }

  if (!body.type || !['income', 'expense'].includes(body.type as string)) {
    return badRequest('type must be "income" or "expense"');
  }
  if (body.amount === undefined || body.amount === null) {
    return badRequest('amount is required');
  }

  try {
    const transaction = await createTransaction(
      user.id,
      body as unknown as Parameters<typeof createTransaction>[1]
    );
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    Sentry.captureException(error);
    console.error('Failed to create transaction:', error);
    return serverError();
  }
}
