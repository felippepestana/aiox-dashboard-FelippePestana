import * as Sentry from '@sentry/nextjs';
import { NextRequest } from 'next/server';
import { callAIStream, type TaskType, type AIMessage } from '@/lib/ai-router';
import { getAuthUser, unauthorized } from '@/lib/api-utils';
import { withRateLimit } from '@/lib/api-rate-limit';
import { checkAIQuota, AI_QUOTA_EXCEEDED_MESSAGE } from '@/lib/ai-quota';

/**
 * POST /api/ai/chat/stream — streams an AI chat completion back to the client
 * as server-sent events.
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  const rateLimitResponse = withRateLimit(request, 'ai');
  if (rateLimitResponse) return rateLimitResponse;


  try {
    const { messages, taskType } = await request.json() as {
      messages: AIMessage[];
      taskType?: TaskType;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages required' }), { status: 400 });
    }

    // Quota is reserved only after input validation — the atomic counter
    // consumes a unit, and malformed 400 requests must not burn it.
    const quota = await checkAIQuota(user.id);
    if (!quota.allowed) {
      return new Response(JSON.stringify({ error: AI_QUOTA_EXCEEDED_MESSAGE }), { status: 402 });
    }

    const stream = await callAIStream(messages, taskType || 'chat_response', {
      userId: user.id,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'AI service error';
    return new Response(JSON.stringify({ error: message }), { status: 503 });
  }
}
