import { NextRequest, NextResponse } from 'next/server';
import { generatePetition } from '@/lib/ai-router';
import { getAuthUser, unauthorized } from '@/lib/api-utils';
import { withRateLimit } from '@/lib/api-rate-limit';

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

    if (!area || !type || !facts) {
      return NextResponse.json(
        { error: 'area, type, and facts are required' },
        { status: 400 }
      );
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
