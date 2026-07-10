interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store: counters are per-process, which is sufficient for the
// current single-instance Node deployment. If the app moves to serverless or
// multi-replica hosting, swap this Map for a shared backend (Redis/KV) —
// checkRateLimit stays the single entry point either way.
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 5 * 60 * 1000);
  // Don't keep a long-running Node process alive just for cache pruning
  if (typeof timer === 'object' && 'unref' in timer) timer.unref();
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },     // 5 per 15 min
  ai: { maxRequests: 30, windowMs: 60 * 1000 },            // 30 per minute
  api: { maxRequests: 100, windowMs: 60 * 1000 },          // 100 per minute
} satisfies Record<string, RateLimitConfig>;

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs };
  }

  entry.count++;
  const allowed = entry.count <= config.maxRequests;
  return {
    allowed,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}
