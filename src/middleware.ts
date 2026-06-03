import { NextRequest, NextResponse } from 'next/server';

// ─── Route config ─────────────────────────────────────────────────────────────

const PROTECTED_PREFIXES = ['/legal', '/dental', '/kanban'];

const PUBLIC_PATHS = ['/login', '/api/auth'];

// ─── Security headers ─────────────────────────────────────────────────────────

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-eval in dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
};

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

// ─── In-memory rate limiter ───────────────────────────────────────────────────
// Simple sliding-window counter: 100 requests / 60 seconds per IP.
// Note: This is a per-instance store — for multi-replica deployments use
// a shared store (Redis / Upstash) instead.

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const RATE_LIMIT_MAX = 100;
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const rateLimitStore = new Map<string, RateLimitEntry>();

/** Returns true when the IP has exceeded the rate limit. */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  if (entry.count > RATE_LIMIT_MAX) {
    return true;
  }

  return false;
}

/** Periodically purge stale entries to avoid unbounded memory growth. */
function pruneRateLimitStore(): void {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS * 2) {
      rateLimitStore.delete(ip);
    }
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files early — no auth, headers, or rate limiting needed
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Rate limit API routes
  if (pathname.startsWith('/api/')) {
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded?.split(',')[0]?.trim() ?? '127.0.0.1';

    // Prune stale entries every request (cheap operation on typical store size)
    pruneRateLimitStore();

    if (isRateLimited(ip)) {
      const response = NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
      response.headers.set('Retry-After', '60');
      return applySecurityHeaders(response);
    }
  }

  // Allow public paths without auth
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Auth guard for protected routes
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isDashboardRoute =
    pathname.startsWith('/agents') ||
    pathname.startsWith('/monitor') ||
    pathname.startsWith('/github') ||
    pathname.startsWith('/squads') ||
    pathname.startsWith('/terminals') ||
    pathname.startsWith('/settings');

  if (isProtected || isDashboardRoute) {
    const sessionCookie = request.cookies.get('aiox_session');

    if (!sessionCookie?.value) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
