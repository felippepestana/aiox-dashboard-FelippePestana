import { NextRequest } from 'next/server';
import { callAIStream, type TaskType, type AIMessage } from '@/lib/ai-router';

export async function POST(request: NextRequest) {
  try {
    const { messages, taskType } = await request.json() as {
      messages: AIMessage[];
      taskType?: TaskType;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Messages required' }), { status: 400 });
    }

    const stream = await callAIStream(messages, taskType || 'chat_response');

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI service error';
    return new Response(JSON.stringify({ error: message }), { status: 503 });
  }
}
