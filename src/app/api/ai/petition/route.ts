import { NextRequest, NextResponse } from 'next/server';
import { generatePetition } from '@/lib/ai-router';
import { getAuthUser, unauthorized } from '@/lib/api-utils';
import { withRateLimit } from '@/lib/api-rate-limit';
import { checkAIQuota, AI_QUOTA_EXCEEDED_MESSAGE } from '@/lib/ai-quota';

/**
 * POST /api/ai/petition — generates a legal petition draft with AI from the
 * given area, type, facts, arguments, requests, and court.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const rateLimitResponse = withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;


  try {
    const body = await request.json();
    const { area, type, facts, arguments: args, requests, court } = body;

    // Type checks matter: truthy non-strings pass a presence-only guard,
    // burn a quota unit, then get interpolated into a paid model request.
    const isNonEmptyString = (v: unknown): v is string =>
      typeof v === 'string' && v.length > 0;
    const isOptionalString = (v: unknown) => v === undefined || typeof v === 'string';

    if (
      !isNonEmptyString(area) || !isNonEmptyString(type) || !isNonEmptyString(facts) ||
      !isOptionalString(args) || !isOptionalString(requests) || !isOptionalString(court)
    ) {
      return NextResponse.json(
        { error: 'area, type, and facts are required (all fields must be strings)' },
        { status: 400 }
      );
    }

    // Quota is reserved only after input validation — the atomic counter
    // consumes a unit, and malformed 400 requests must not burn it.
    const quota = await checkAIQuota(user.id);
    if (!quota.allowed) {
      return NextResponse.json({ error: AI_QUOTA_EXCEEDED_MESSAGE }, { status: 402 });
    }

    const result = await generatePetition(
      area, type, facts, args || '', requests || '', court || '', user.id
    );

    return NextResponse.json({
      petition: result.content,
      model: result.model,
      complexity: result.complexity,
      tokensUsed: result.tokensUsed,
      estimatedCost: result.estimatedCost,
      durationMs: result.durationMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Petition generation failed', message }, { status: 500 });
  }
}
