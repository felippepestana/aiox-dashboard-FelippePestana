import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RATE_LIMITS } from './rate-limit';

type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Apply per-IP rate limiting to an API request.
 * Returns a 429 response when the limit is exceeded, or null to proceed.
 */
export function withRateLimit(request: NextRequest, type: RateLimitType): NextResponse | null {
  // Nginx appends the peer address via $proxy_add_x_forwarded_for, so the LAST
  // entry is the one set by our own proxy; earlier entries are client-supplied
  // and spoofable — never trust them for rate limiting.
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',').pop()?.trim()
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
