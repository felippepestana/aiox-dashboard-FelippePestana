/**
 * Sentry initialization for the Edge runtime (middleware/edge routes), 10% trace sampling.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
