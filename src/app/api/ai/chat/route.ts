import { NextRequest, NextResponse } from 'next/server';
import { callAI, VALID_TASK_TYPES, type TaskType, type AIMessage } from '@/lib/ai-router';
import { getAuthUser, unauthorized } from '@/lib/api-utils';
import { withRateLimit } from '@/lib/api-rate-limit';
import { checkAIQuota, AI_QUOTA_EXCEEDED_MESSAGE } from '@/lib/ai-quota';

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

    // Every entry must be a role/string-content pair — a malformed entry
    // passes the array check, burns a quota unit, then 500s in callAI when
    // it reads m.content.length.
    const validMessages = messages.every(
      (m) =>
        m &&
        typeof m === 'object' &&
        ['user', 'assistant', 'system'].includes((m as AIMessage).role) &&
        typeof (m as AIMessage).content === 'string'
    );
    if (!validMessages) {
      return NextResponse.json(
        { error: 'each message requires a valid role and string content' },
        { status: 400 }
      );
    }

    // Validate before the quota reservation — an unknown taskType would burn a
    // quota unit and then 500 inside callAI (MODEL_CONFIG[undefined]).
    if (!VALID_TASK_TYPES.includes(taskType)) {
      return NextResponse.json({ error: 'Invalid taskType' }, { status: 400 });
    }

    // Quota is reserved only after input validation — the atomic counter
    // consumes a unit, and malformed 400 requests must not burn it.
    const quota = await checkAIQuota(user.id);
    if (!quota.allowed) {
      return NextResponse.json({ error: AI_QUOTA_EXCEEDED_MESSAGE }, { status: 402 });
    }

    const result = await callAI(messages, taskType, { userId: user.id });

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
