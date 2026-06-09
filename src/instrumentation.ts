import { validateEnv } from './lib/env';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    validateEnv();
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}
