/**
 * Sentry initialization for the Node.js server runtime, 10% trace sampling.
 */
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
