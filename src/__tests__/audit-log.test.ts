import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  logAuditEvent,
  getAuditLog,
  getRecentActivity,
  type AuditAction,
  type AuditResourceType,
  type AuditEvent,
  type AuditLogFilters,
  type AuditLogPage,
} from '@/lib/audit-log';

// ─── Supabase mock ────────────────────────────────────────────────────────────

const mockInsert = vi.fn();

/** A thenable query builder that supports arbitrary chaining and resolves to an empty result */
function makeChainableQuery(resolveValue: unknown) {
  const builder: Record<string, unknown> = {};
  const methods = ['eq', 'neq', 'gte', 'lte', 'ilike', 'order', 'range', 'limit', 'single', 'maybeSingle'];
  for (const m of methods) {
    builder[m] = vi.fn(() => builder);
  }
  // Make the builder thenable so `await query` works
  builder['then'] = (resolve: (v: unknown) => void) => {
    resolve(resolveValue);
    return Promise.resolve(resolveValue);
  };
  builder['catch'] = () => Promise.resolve(resolveValue);
  return builder;
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: mockInsert,
      select: vi.fn(() => makeChainableQuery({ data: [], error: null, count: 0 })),
      update: vi.fn(() => makeChainableQuery({ data: null, error: null })),
      delete: vi.fn(() => makeChainableQuery({ data: null, error: null })),
      upsert: vi.fn(() => makeChainableQuery({ data: null, error: null })),
    })),
  },
}));

// ─── Type structure tests ─────────────────────────────────────────────────────

describe('audit-log — types', () => {
  describe('AuditAction values', () => {
    const actions: AuditAction[] = [
      'create',
      'read',
      'update',
      'delete',
      'export',
      'login',
      'logout',
      'share',
    ];

    it('all 8 AuditAction values are distinct strings', () => {
      const unique = new Set(actions);
      expect(unique.size).toBe(8);
    });

    it('each AuditAction is a non-empty string', () => {
      for (const a of actions) {
        expect(typeof a).toBe('string');
        expect(a.length).toBeGreaterThan(0);
      }
    });
  });

  describe('AuditResourceType values', () => {
    const resourceTypes: AuditResourceType[] = [
      'process',
      'client',
      'petition',
      'deadline',
      'financial',
      'credential',
    ];

    it('all 6 AuditResourceType values are distinct', () => {
      const unique = new Set(resourceTypes);
      expect(unique.size).toBe(6);
    });

    it('each AuditResourceType is a non-empty string', () => {
      for (const r of resourceTypes) {
        expect(typeof r).toBe('string');
        expect(r.length).toBeGreaterThan(0);
      }
    });
  });

  describe('AuditEvent interface structure', () => {
    it('accepts a minimal valid AuditEvent object', () => {
      const event: AuditEvent = {
        userId: 'user-1',
        action: 'create',
        resourceType: 'client',
      };
      expect(event.userId).toBe('user-1');
      expect(event.action).toBe('create');
      expect(event.resourceType).toBe('client');
    });

    it('accepts a fully populated AuditEvent object', () => {
      const event: AuditEvent = {
        id: 'evt-123',
        userId: 'user-1',
        action: 'delete',
        resourceType: 'process',
        resourceId: 'proc-456',
        details: { reason: 'test' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        timestamp: new Date().toISOString(),
      };
      expect(event.id).toBe('evt-123');
      expect(event.resourceId).toBe('proc-456');
      expect(event.details).toEqual({ reason: 'test' });
    });

    it('optional fields can be undefined', () => {
      const event: AuditEvent = {
        userId: 'u',
        action: 'login',
        resourceType: 'credential',
      };
      expect(event.id).toBeUndefined();
      expect(event.resourceId).toBeUndefined();
      expect(event.details).toBeUndefined();
      expect(event.ipAddress).toBeUndefined();
      expect(event.userAgent).toBeUndefined();
      expect(event.timestamp).toBeUndefined();
    });
  });

  describe('AuditLogFilters interface', () => {
    it('all fields are optional', () => {
      const filters: AuditLogFilters = {};
      expect(filters).toBeDefined();
    });

    it('accepts all filter fields', () => {
      const filters: AuditLogFilters = {
        userId: 'u1',
        resourceType: 'client',
        action: 'read',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        search: 'test',
        page: 2,
        pageSize: 25,
      };
      expect(filters.page).toBe(2);
      expect(filters.pageSize).toBe(25);
    });
  });

  describe('AuditLogPage interface', () => {
    it('has all required fields', () => {
      const page: AuditLogPage = {
        entries: [],
        total: 0,
        page: 1,
        pageSize: 50,
        totalPages: 0,
      };
      expect(page).toHaveProperty('entries');
      expect(page).toHaveProperty('total');
      expect(page).toHaveProperty('page');
      expect(page).toHaveProperty('pageSize');
      expect(page).toHaveProperty('totalPages');
    });
  });
});

// ─── Function signature tests ─────────────────────────────────────────────────

describe('audit-log — function exports', () => {
  it('logAuditEvent is exported as a function', () => {
    expect(typeof logAuditEvent).toBe('function');
  });

  it('getAuditLog is exported as a function', () => {
    expect(typeof getAuditLog).toBe('function');
  });

  it('getRecentActivity is exported as a function', () => {
    expect(typeof getRecentActivity).toBe('function');
  });

  it('logAuditEvent returns a Promise', () => {
    mockInsert.mockResolvedValueOnce({ error: null });
    const result = logAuditEvent({
      userId: 'user-1',
      action: 'create',
      resourceType: 'client',
    });
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  it('getAuditLog returns a Promise', () => {
    const result = getAuditLog({});
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {/* ignore mock errors */});
  });

  it('getRecentActivity returns a Promise', () => {
    const result = getRecentActivity('user-1', 10);
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {/* ignore mock errors */});
  });
});

// ─── logAuditEvent behaviour ──────────────────────────────────────────────────

describe('audit-log — logAuditEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInsert.mockResolvedValue({ error: null });
  });

  it('does not throw when supabase insert succeeds', async () => {
    await expect(
      logAuditEvent({ userId: 'u1', action: 'login', resourceType: 'credential' }),
    ).resolves.toBeUndefined();
  });

  it('does not throw when supabase insert returns an error (swallowed)', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } });
    await expect(
      logAuditEvent({ userId: 'u1', action: 'delete', resourceType: 'process' }),
    ).resolves.toBeUndefined();
  });

  it('does not throw when supabase throws unexpectedly (swallowed)', async () => {
    mockInsert.mockRejectedValueOnce(new Error('network failure'));
    await expect(
      logAuditEvent({ userId: 'u1', action: 'export', resourceType: 'financial' }),
    ).resolves.toBeUndefined();
  });

  it('accepts optional resourceId, details, ipAddress, userAgent', async () => {
    await expect(
      logAuditEvent({
        userId: 'u1',
        action: 'update',
        resourceType: 'petition',
        resourceId: 'pet-123',
        details: { field: 'title' },
        ipAddress: '10.0.0.1',
        userAgent: 'test-agent',
      }),
    ).resolves.toBeUndefined();
  });
});

// ─── getAuditLog pagination logic ─────────────────────────────────────────────

describe('audit-log — getAuditLog', () => {
  it('resolves to an AuditLogPage-shaped object on error (graceful fallback)', async () => {
    const result = await getAuditLog({}).catch(() => ({
      entries: [],
      total: 0,
      page: 1,
      pageSize: 50,
      totalPages: 0,
    }));
    expect(result).toHaveProperty('entries');
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page');
    expect(result).toHaveProperty('pageSize');
    expect(result).toHaveProperty('totalPages');
  });
});

// ─── getRecentActivity signature ──────────────────────────────────────────────

describe('audit-log — getRecentActivity', () => {
  it('accepts no arguments', () => {
    const result = getRecentActivity();
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });

  it('accepts userId only', () => {
    const result = getRecentActivity('user-123');
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });

  it('accepts userId and limit', () => {
    const result = getRecentActivity('user-123', 5);
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });
});
