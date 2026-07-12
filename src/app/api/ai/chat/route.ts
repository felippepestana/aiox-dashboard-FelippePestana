import { NextRequest, NextResponse } from 'next/server';
import { callAI, type TaskType, type AIMessage } from '@/lib/ai-router';
import { getAuthUser, unauthorized } from '@/lib/api-utils';
import { withRateLimit } from '@/lib/api-rate-limit';

/**
 * POST /api/ai/chat — forwards a chat message history to the AI router and
 * returns the model response with usage metadata.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const rateLimitResponse = withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const { messages, taskType = 'chat_response' } = body as {
      messages: AIMessage[];
      taskType?: TaskType;
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      );
    }

    const result = await callAI(messages, taskType);

    return NextResponse.json({
      content: result.content,
      model: result.model,
      complexity: result.complexity,
      tokensUsed: result.tokensUsed,
      estimatedCost: result.estimatedCost,
      durationMs: result.durationMs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { error: 'AI not configured', message: 'Anthropic API key missing from .env' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'AI request failed', message },
      { status: 500 }
    );
  }
}
