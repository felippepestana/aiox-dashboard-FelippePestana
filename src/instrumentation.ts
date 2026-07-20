import * as Sentry from '@sentry/nextjs';
import { validateEnv } from './lib/env';

/**
 * Next.js instrumentation hook: validates env vars and loads the
 * runtime-appropriate Sentry config (nodejs or edge) at startup.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateEnv();
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

/**
 * Captures Server Component, middleware, and route handler request errors
 * (Next 15+ hook — without it those failures never reach Sentry).
 */
export const onRequestError = Sentry.captureRequestError;
