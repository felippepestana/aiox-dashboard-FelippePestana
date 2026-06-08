export {};

try {
  const Sentry = require('@sentry/nextjs');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
  });
} catch {
  // Sentry not installed
}
