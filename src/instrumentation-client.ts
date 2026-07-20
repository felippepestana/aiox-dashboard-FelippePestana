/**
 * Sentry browser-side initialization: 10% trace sampling; performance tracing and session replay are
 * enabled only after the visitor accepts the cookie banner (LGPD) — replay
 * records the session from SDK init, so starting it before consent would
 * ignore a "Recusar" choice. Error capture itself stays on (essential
 * operation, no session recording).
 */
import * as Sentry from '@sentry/nextjs';

function hasAnalyticsConsent(): boolean {
  try {
    const raw = localStorage.getItem('apex_cookie_consent');
    if (!raw) return false;
    return JSON.parse(raw)?.accepted === true;
  } catch {
    return false;
  }
}

const consent = hasAnalyticsConsent();

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: consent ? 0.1 : 0,
  // 0 until consent — takes effect on the next page load after accepting
  replaysSessionSampleRate: consent ? 0.1 : 0,
  replaysOnErrorSampleRate: consent ? 1.0 : 0,
});
