/**
 * Environment variable validation — fails fast on startup if required vars are missing.
 * Called from src/instrumentation.ts (nodejs runtime only) before any service initialisation.
 */

import * as Sentry from '@sentry/nextjs';

interface EnvVar {
  key: string;
  required: boolean;
  validate?: (value: string) => boolean;
  hint?: string;
}

const ENV_VARS: EnvVar[] = [
  // Supabase — required
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    validate: (v) => v.startsWith('https://'),
    hint: 'Must be a valid https:// URL (e.g. https://xyz.supabase.co)',
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    validate: (v) => v.length > 10,
    hint: 'Must be a non-empty JWT string',
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    validate: (v) => v.length > 10,
    hint: 'Must be a non-empty JWT string',
  },

  // Auth — required
  {
    key: 'AUTH_SECRET',
    required: true,
    validate: (v) => v.length >= 16,
    hint: 'Must be at least 16 characters (use: openssl rand -hex 32)',
  },

  // AI — optional but validated if present
  {
    key: 'ANTHROPIC_API_KEY',
    required: false,
    validate: (v) => v.startsWith('sk-ant-'),
    hint: 'Must start with "sk-ant-"',
  },

  // Mercado Pago — optional
  { key: 'MP_ACCESS_TOKEN', required: false },
  { key: 'MP_WEBHOOK_SECRET', required: false },
  { key: 'NEXT_PUBLIC_MP_PUBLIC_KEY', required: false },

  // DataJud — optional (falls back to mock data in development)
  { key: 'DATAJUD_API_KEY', required: false },

  // Sentry — optional
  {
    key: 'SENTRY_DSN',
    required: false,
    validate: (v) => v.startsWith('https://'),
    hint: 'Must be a valid https:// URL',
  },
  {
    key: 'NEXT_PUBLIC_SENTRY_DSN',
    required: false,
    validate: (v) => v.startsWith('https://'),
    hint: 'Must be a valid https:// URL',
  },

  // App URL — optional
  {
    key: 'NEXT_PUBLIC_APP_URL',
    required: false,
    validate: (v) => v.startsWith('http://') || v.startsWith('https://'),
    hint: 'Must be a valid http(s):// URL',
  },

  // Cron — optional
  {
    key: 'CRON_SECRET',
    required: false,
    validate: (v) => v.length >= 16,
    hint: 'Must be at least 16 characters',
  },
];

let _validated = false;

export function validateEnv(): void {
  if (_validated) return;
  _validated = true;

  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === 'production';

  for (const { key, required, validate, hint } of ENV_VARS) {
    const value = process.env[key];

    if (!value) {
      if (required) {
        errors.push(`Missing required: ${key}${hint ? ` — ${hint}` : ''}`);
      } else if (isProduction) {
        warnings.push(`Missing optional: ${key}`);
      }
      continue;
    }

    if (validate && !validate(value)) {
      const label = required ? 'Invalid required' : 'Invalid optional';
      errors.push(`${label}: ${key}${hint ? ` — ${hint}` : ''}`);
    }
  }

  if (warnings.length > 0) {
    Sentry.captureMessage(
      `Environment warnings:\n${warnings.map((w) => `  ${w}`).join('\n')}`,
      'warning'
    );
    console.warn(
      `\n⚠️  Environment warnings:\n${warnings.map((w) => `  ${w}`).join('\n')}\n`,
    );
  }

  if (errors.length > 0) {
    const msg = `\n❌ Environment validation failed:\n${errors.map((e) => `  ${e}`).join('\n')}\n`;
    Sentry.captureMessage(`Environment validation failed:\n${errors.map((e) => `  ${e}`).join('\n')}`, 'error');
    console.error(msg);

    if (isProduction) {
      throw new Error('Invalid environment configuration — check server logs');
    }
  }
}
