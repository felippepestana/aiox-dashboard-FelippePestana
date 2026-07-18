import * as Sentry from '@sentry/nextjs';
import { NextRequest } from 'next/server';
import { callAIStream, VALID_TASK_TYPES, type TaskType, type AIMessage } from '@/lib/ai-router';
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
      return new Response(
        JSON.stringify({ error: 'each message requires a valid role and string content' }),
        { status: 400 }
      );
    }

    // Validate before the quota reservation — an unknown taskType would burn a
    // quota unit and then 500 inside callAIStream (MODEL_CONFIG[undefined]).
    if (taskType !== undefined && !VALID_TASK_TYPES.includes(taskType)) {
      return new Response(JSON.stringify({ error: 'Invalid taskType' }), { status: 400 });
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
        // Nginx proxies with proxy_buffering on — without this, SSE chunks
        // are held until the buffer fills and streaming stops being live
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    const message = error instanceof Error ? error.message : 'AI service error';
    return new Response(JSON.stringify({ error: message }), { status: 503 });
  }
}
