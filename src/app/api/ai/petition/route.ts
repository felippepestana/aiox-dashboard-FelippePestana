import { NextRequest, NextResponse } from 'next/server';
import { generatePetition } from '@/lib/ai-router';
import { getAuthUser, unauthorized } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

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
      area, type, facts, args || '', requests || '', court || ''
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
