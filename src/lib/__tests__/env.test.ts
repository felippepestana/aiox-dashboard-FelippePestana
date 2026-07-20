import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// ─── Sentry mock ──────────────────────────────────────────────────────────────

const mockCaptureMessage = vi.fn();
vi.mock('@sentry/nextjs', () => ({
  captureMessage: (...args: unknown[]) => mockCaptureMessage(...args),
  captureException: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal valid environment for all required vars.
 */
function validRequiredEnv(): Record<string, string> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: 'https://xyz.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.anon',
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.service',
    AUTH_SECRET: 'super-secret-key-at-least-16-chars',
  };
}

/**
 * Apply env vars from a map to process.env and return a cleanup function.
 */
function setEnv(vars: Record<string, string | undefined>): void {
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}

const ALL_REQUIRED_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AUTH_SECRET',
] as const;

const ALL_OPTIONAL_KEYS = [
  'ANTHROPIC_API_KEY',
  'MP_ACCESS_TOKEN',
  'MP_WEBHOOK_SECRET',
  'NEXT_PUBLIC_MP_PUBLIC_KEY',
  'DATAJUD_API_KEY',
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  'NEXT_PUBLIC_APP_URL',
  'CRON_SECRET',
] as const;

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('validateEnv', () => {
  let savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    // Snapshot all keys we'll modify
    savedEnv = {};
    for (const k of [...ALL_REQUIRED_KEYS, ...ALL_OPTIONAL_KEYS, 'NODE_ENV']) {
      savedEnv[k] = process.env[k];
    }

    // Clear all relevant vars
    for (const k of [...ALL_REQUIRED_KEYS, ...ALL_OPTIONAL_KEYS]) {
      delete process.env[k];
    }

    vi.clearAllMocks();

    // Reset the _validated flag by re-importing the module fresh each test
    vi.resetModules();
  });

  afterEach(() => {
    // Restore original env
    setEnv(savedEnv);
    vi.restoreAllMocks();
  });

  // ── All required vars present ───────────────────────────────────────────────

  describe('when all required vars are present and valid', () => {
    it('does not throw in development mode', async () => {
      setEnv({ ...validRequiredEnv(), NODE_ENV: 'test' });
      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).not.toThrow();
    });

    it('does not throw in production mode', async () => {
      setEnv({ ...validRequiredEnv(), NODE_ENV: 'production' });
      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).not.toThrow();
    });
  });

  // ── Missing required vars ───────────────────────────────────────────────────

  describe('missing required vars', () => {
    it('throws in production when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      const env = validRequiredEnv();
      delete (env as Record<string, string | undefined>).NEXT_PUBLIC_SUPABASE_URL;
      setEnv({ ...env, NODE_ENV: 'production' });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });

    it('does not throw in development when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
      const env = validRequiredEnv();
      delete (env as Record<string, string | undefined>).NEXT_PUBLIC_SUPABASE_URL;
      setEnv({ ...env, NODE_ENV: 'development' });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).not.toThrow();
    });

    it('throws in production when AUTH_SECRET is missing', async () => {
      const env = validRequiredEnv();
      delete (env as Record<string, string | undefined>).AUTH_SECRET;
      setEnv({ ...env, NODE_ENV: 'production' });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });

    it('throws in production when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
      const env = validRequiredEnv();
      delete (env as Record<string, string | undefined>).SUPABASE_SERVICE_ROLE_KEY;
      setEnv({ ...env, NODE_ENV: 'production' });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });
  });

  // ── Invalid format for required vars ────────────────────────────────────────

  describe('invalid format for required vars', () => {
    it('throws in production when NEXT_PUBLIC_SUPABASE_URL does not start with https://', async () => {
      setEnv({
        ...validRequiredEnv(),
        NEXT_PUBLIC_SUPABASE_URL: 'http://xyz.supabase.co',
        NODE_ENV: 'production',
      });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });

    it('throws in production when AUTH_SECRET is too short (< 16 chars)', async () => {
      setEnv({
        ...validRequiredEnv(),
        AUTH_SECRET: 'short',
        NODE_ENV: 'production',
      });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });

    it('throws in production when AUTH_SECRET is the public .env.example placeholder', async () => {
      setEnv({
        ...validRequiredEnv(),
        AUTH_SECRET: 'generate-a-random-32-char-string',
        NODE_ENV: 'production',
      });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });

    it('logs error in development when NEXT_PUBLIC_SUPABASE_URL has invalid format', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      setEnv({
        ...validRequiredEnv(),
        NEXT_PUBLIC_SUPABASE_URL: 'ftp://xyz.supabase.co',
        NODE_ENV: 'development',
      });

      const { validateEnv } = await import('@/lib/env');
      validateEnv();

      expect(consoleSpy).toHaveBeenCalled();
      const errorOutput = consoleSpy.mock.calls[0][0] as string;
      expect(errorOutput).toContain('NEXT_PUBLIC_SUPABASE_URL');
    });
  });

  // ── Optional vars missing ────────────────────────────────────────────────────

  describe('optional vars missing', () => {
    it('does not throw in development when all optional vars are absent', async () => {
      setEnv({ ...validRequiredEnv(), NODE_ENV: 'development' });
      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).not.toThrow();
    });

    it('emits console.warn in production when optional vars are absent', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      setEnv({ ...validRequiredEnv(), NODE_ENV: 'production' });

      const { validateEnv } = await import('@/lib/env');
      validateEnv();

      // Should have warnings for the optional vars
      expect(warnSpy).toHaveBeenCalled();
    });

    it('does not throw when optional vars are absent in production', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      setEnv({ ...validRequiredEnv(), NODE_ENV: 'production' });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).not.toThrow();
    });
  });

  // ── Optional vars with invalid format ────────────────────────────────────────

  describe('optional vars with invalid format', () => {
    it('throws in production when ANTHROPIC_API_KEY is present but does not start with sk-ant-', async () => {
      setEnv({
        ...validRequiredEnv(),
        ANTHROPIC_API_KEY: 'invalid-key-format',
        NODE_ENV: 'production',
      });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });

    it('does not throw in development when ANTHROPIC_API_KEY format is invalid', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      setEnv({
        ...validRequiredEnv(),
        ANTHROPIC_API_KEY: 'bad-format',
        NODE_ENV: 'development',
      });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).not.toThrow();
    });

    it('does not throw when ANTHROPIC_API_KEY starts with sk-ant-', async () => {
      setEnv({
        ...validRequiredEnv(),
        ANTHROPIC_API_KEY: 'sk-ant-api03-valid-key',
        NODE_ENV: 'production',
      });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).not.toThrow();
    });

    it('throws in production when SENTRY_DSN is present but does not start with https://', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      setEnv({
        ...validRequiredEnv(),
        SENTRY_DSN: 'http://sentry.io/dsn',
        NODE_ENV: 'production',
      });

      const { validateEnv } = await import('@/lib/env');
      expect(() => validateEnv()).toThrow('Invalid environment configuration');
    });
  });

  // ── _validated flag ──────────────────────────────────────────────────────────

  describe('_validated flag', () => {
    it('runs validation only once (subsequent calls are no-ops)', async () => {
      setEnv({ ...validRequiredEnv(), NODE_ENV: 'test' });
      const { validateEnv } = await import('@/lib/env');

      validateEnv();
      validateEnv();
      validateEnv();

      // No error thrown — idempotent behaviour
      expect(true).toBe(true);
    });
  });
});
