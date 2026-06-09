import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from './rate-limit';

type RateLimitType = keyof typeof RATE_LIMITS;

export function withRateLimit(request: NextRequest, type: RateLimitType): NextResponse | null {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const key = `${type}:${ip}`;
  const config = RATE_LIMITS[type];
  const { allowed, remaining, resetAt } = checkRateLimit(key, config);

  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        },
      }
    );
  }

  return null; // No rate limit hit — proceed normally
}
