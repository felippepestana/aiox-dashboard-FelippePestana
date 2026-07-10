import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  logAuditEvent,
  getAuditLog,
  getRecentActivity,
  type AuditAction,
  type AuditResourceType,
  type AuditEvent,
} from '@/lib/audit-log';

// ─── Sentry mock ──────────────────────────────────────────────────────────────

vi.mock('@sentry/nextjs', () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));

// ─── Supabase mock ────────────────────────────────────────────────────────────

const mockInsert = vi.fn();
const mockFrom = vi.fn();

// Build a generic chainable query builder that resolves to `result`
function makeQuery(result: Record<string, unknown>) {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select', 'eq', 'order', 'range', 'limit',
    'gte', 'lte', 'ilike', 'insert',
  ];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  // Make it awaitable
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).then = (resolve: (v: unknown) => void) => {
    resolve(result);
    return Promise.resolve(result);
  };
  return chain;
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
  createServerClient: vi.fn(),
  createBrowserClient: vi.fn(),
}));

// ─── logAuditEvent ────────────────────────────────────────────────────────────

describe('logAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls supabase.from("audit_logs") with insert', async () => {
    const insertChain = makeQuery({ error: null });
    mockFrom.mockReturnValue(insertChain);

    await logAuditEvent({
      userId: 'user-1',
      action: 'create',
      resourceType: 'client',
      resourceId: 'client-1',
    });

    expect(mockFrom).toHaveBeenCalledWith('audit_logs');
  });

  it('inserts correct fields: user_id, action, resource_type', async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    const chain: Record<string, unknown> = {};
    chain.insert = vi.fn((payload: Record<string, unknown>) => {
      capturedPayload = payload;
      return { then: (r: (v: unknown) => void) => { r({ error: null }); return Promise.resolve({ error: null }); } };
    });
    mockFrom.mockReturnValue(chain);

    await logAuditEvent({
      userId: 'user-42',
      action: 'delete',
      resourceType: 'process',
      resourceId: 'proc-99',
    });

    expect(capturedPayload).not.toBeNull();
    expect(capturedPayload!.user_id).toBe('user-42');
    expect(capturedPayload!.action).toBe('delete');
    expect(capturedPayload!.resource_type).toBe('process');
    expect(capturedPayload!.resource_id).toBe('proc-99');
  });

  it('sets resource_id to null when not provided', async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    const chain: Record<string, unknown> = {};
    chain.insert = vi.fn((payload: Record<string, unknown>) => {
      capturedPayload = payload;
      return { then: (r: (v: unknown) => void) => { r({ error: null }); return Promise.resolve({ error: null }); } };
    });
    mockFrom.mockReturnValue(chain);

    await logAuditEvent({
      userId: 'user-1',
      action: 'login',
      resourceType: 'credential',
    });

    expect(capturedPayload!.resource_id).toBeNull();
  });

  it('sets details to null when not provided', async () => {
    let capturedPayload: Record<string, unknown> | null = null;

    const chain: Record<string, unknown> = {};
    chain.insert = vi.fn((payload: Record<string, unknown>) => {
      capturedPayload = payload;
      return { then: (r: (v: unknown) => void) => { r({ error: null }); return Promise.resolve({ error: null }); } };
    });
    mockFrom.mockReturnValue(chain);

    await logAuditEvent({
      userId: 'user-1',
      action: 'read',
      resourceType: 'client',
    });

    expect(capturedPayload!.details).toBeNull();
  });

  it('does not throw when Supabase returns an error (swallowed, reported to Sentry)', async () => {
    const errorChain = makeQuery({ error: { message: 'DB down' } });
    mockFrom.mockReturnValue(errorChain);
    const Sentry = await import('@sentry/nextjs');

    await expect(
      logAuditEvent({ userId: 'user-1', action: 'create', resourceType: 'client' }),
    ).resolves.toBeUndefined();
    expect(Sentry.captureMessage).toHaveBeenCalled();
  });

  it('does not throw when Supabase insert throws an exception (swallowed, reported to Sentry)', async () => {
    const chain: Record<string, unknown> = {};
    chain.insert = vi.fn(() => { throw new Error('Unexpected crash'); });
    mockFrom.mockReturnValue(chain);
    const Sentry = await import('@sentry/nextjs');

    await expect(
      logAuditEvent({ userId: 'user-1', action: 'create', resourceType: 'client' }),
    ).resolves.toBeUndefined();
    expect(Sentry.captureException).toHaveBeenCalled();
  });
});

// ─── AuditAction type validation ──────────────────────────────────────────────

describe('AuditAction valid values', () => {
  const validActions: AuditAction[] = [
    'create', 'read', 'update', 'delete', 'export', 'login', 'logout', 'share',
  ];

  it('all expected action types are valid AuditAction values', () => {
    for (const action of validActions) {
      expect(typeof action).toBe('string');
      expect(action.length).toBeGreaterThan(0);
    }
  });

  it('contains exactly 8 action types', () => {
    expect(validActions).toHaveLength(8);
  });
});

// ─── AuditResourceType validation ────────────────────────────────────────────

describe('AuditResourceType valid values', () => {
  const validResourceTypes: AuditResourceType[] = [
    'process', 'client', 'petition', 'deadline', 'financial', 'credential',
  ];

  it('all expected resource types are valid strings', () => {
    for (const rt of validResourceTypes) {
      expect(typeof rt).toBe('string');
      expect(rt.length).toBeGreaterThan(0);
    }
  });

  it('contains exactly 6 resource types', () => {
    expect(validResourceTypes).toHaveLength(6);
  });
});

// ─── getAuditLog ──────────────────────────────────────────────────────────────

describe('getAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an AuditLogPage with correct shape on success', async () => {
    const row = {
      id: 'log-1',
      user_id: 'user-1',
      action: 'create',
      resource_type: 'client',
      resource_id: 'c-1',
      details: null,
      ip_address: null,
      user_agent: null,
      created_at: '2024-06-01T10:00:00Z',
    };
    const queryChain = makeQuery({ data: [row], error: null, count: 1 });
    mockFrom.mockReturnValue(queryChain);

    const page = await getAuditLog();

    expect(page).toHaveProperty('entries');
    expect(page).toHaveProperty('total');
    expect(page).toHaveProperty('page');
    expect(page).toHaveProperty('pageSize');
    expect(page).toHaveProperty('totalPages');
  });

  it('maps row data to AuditEvent shape', async () => {
    const row = {
      id: 'log-2',
      user_id: 'user-2',
      action: 'export',
      resource_type: 'client',
      resource_id: 'c-2',
      details: { reason: 'LGPD request' },
      ip_address: '192.168.0.1',
      user_agent: 'Mozilla/5.0',
      created_at: '2024-06-01T12:00:00Z',
    };
    const queryChain = makeQuery({ data: [row], error: null, count: 1 });
    mockFrom.mockReturnValue(queryChain);

    const page = await getAuditLog();
    const entry = page.entries[0];

    expect(entry.id).toBe('log-2');
    expect(entry.userId).toBe('user-2');
    expect(entry.action).toBe('export');
    expect(entry.resourceType).toBe('client');
    expect(entry.resourceId).toBe('c-2');
    expect(entry.details).toEqual({ reason: 'LGPD request' });
    expect(entry.ipAddress).toBe('192.168.0.1');
    expect(entry.userAgent).toBe('Mozilla/5.0');
    expect(entry.timestamp).toBe('2024-06-01T12:00:00Z');
  });

  it('defaults page to 1 and pageSize to 50', async () => {
    const queryChain = makeQuery({ data: [], error: null, count: 0 });
    mockFrom.mockReturnValue(queryChain);

    const page = await getAuditLog();
    expect(page.page).toBe(1);
    expect(page.pageSize).toBe(50);
  });

  it('calculates totalPages correctly', async () => {
    const queryChain = makeQuery({ data: [], error: null, count: 105 });
    mockFrom.mockReturnValue(queryChain);

    const page = await getAuditLog({ pageSize: 50 });
    // ceil(105 / 50) = 3
    expect(page.totalPages).toBe(3);
    expect(page.total).toBe(105);
  });

  it('returns empty result on Supabase error', async () => {
    const errorChain = makeQuery({ data: null, error: { message: 'Query failed' }, count: null });
    mockFrom.mockReturnValue(errorChain);

    const page = await getAuditLog();
    expect(page.entries).toEqual([]);
    expect(page.total).toBe(0);
    expect(page.totalPages).toBe(0);
  });
});

// ─── getRecentActivity ────────────────────────────────────────────────────────

describe('getRecentActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an array of AuditEvent entries', async () => {
    const row = {
      id: 'log-5',
      user_id: 'user-5',
      action: 'login',
      resource_type: 'credential',
      resource_id: null,
      details: null,
      ip_address: null,
      user_agent: null,
      created_at: '2024-06-01T09:00:00Z',
    };
    const queryChain = makeQuery({ data: [row], error: null });
    mockFrom.mockReturnValue(queryChain);

    const events = await getRecentActivity();
    expect(Array.isArray(events)).toBe(true);
    expect(events[0].action).toBe('login');
  });

  it('returns empty array on Supabase error', async () => {
    const errorChain = makeQuery({ data: null, error: { message: 'DB error' } });
    mockFrom.mockReturnValue(errorChain);

    const events = await getRecentActivity();
    expect(events).toEqual([]);
  });

  it('returns empty array when no data', async () => {
    const queryChain = makeQuery({ data: [], error: null });
    mockFrom.mockReturnValue(queryChain);

    const events = await getRecentActivity('user-1', 10);
    expect(events).toEqual([]);
  });
});
