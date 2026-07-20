import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  generateDataReport,
  anonymizeClient,
  getConsentStatus,
  recordConsent,
  getDataRetentionPolicy,
  identifyExpiredData,
  type ConsentPurpose,
  type DataRetentionPolicy,
} from '@/lib/lgpd-compliance';

// ─── Supabase mock ────────────────────────────────────────────────────────────

const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockUpsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockLt = vi.fn();
const mockLimit = vi.fn();
const mockOrder = vi.fn();
const mockSingle = vi.fn();

// Build a chainable query builder
function makeChain(terminal: Record<string, unknown>) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'lt', 'lte', 'gte', 'order', 'limit', 'single', 'insert', 'update', 'upsert'];
  for (const m of methods) {
    chain[m] = vi.fn(() => chain);
  }
  // Override terminal resolution — awaiting resolves to `terminal`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (chain as any).then = (resolve: (v: unknown) => void) => {
    resolve(terminal);
    return Promise.resolve(terminal);
  };
  return chain;
}

const mockFrom = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
  createServerClient: vi.fn(),
  createBrowserClient: vi.fn(),
}));

// ─── generateDataReport ───────────────────────────────────────────────────────

describe('generateDataReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a report with clientId and exportedAt', async () => {
    const emptyChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(emptyChain);

    const report = await generateDataReport('client-123');

    expect(report.clientId).toBe('client-123');
    expect(typeof report.exportedAt).toBe('string');
    expect(new Date(report.exportedAt).toISOString()).toBe(report.exportedAt);
  });

  it('returns correct structure with all required fields', async () => {
    const emptyChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(emptyChain);

    const report = await generateDataReport('client-xyz');

    expect(report).toHaveProperty('exportedAt');
    expect(report).toHaveProperty('clientId');
    expect(report).toHaveProperty('client');
    expect(report).toHaveProperty('processes');
    expect(report).toHaveProperty('petitions');
    expect(report).toHaveProperty('deadlines');
    expect(report).toHaveProperty('financialRecords');
    expect(report).toHaveProperty('consentRecords');
    expect(report).toHaveProperty('auditEntries');
  });

  it('arrays default to [] when Supabase returns null data', async () => {
    const emptyChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(emptyChain);

    const report = await generateDataReport('client-null');

    expect(report.processes).toEqual([]);
    expect(report.petitions).toEqual([]);
    expect(report.deadlines).toEqual([]);
    expect(report.financialRecords).toEqual([]);
    expect(report.consentRecords).toEqual([]);
    expect(report.auditEntries).toEqual([]);
  });

  it('client field is null when Supabase single returns null', async () => {
    const emptyChain = makeChain({ data: null, error: null });
    mockFrom.mockReturnValue(emptyChain);

    const report = await generateDataReport('client-empty');
    expect(report.client).toBeNull();
  });
});

// ─── anonymizeClient ──────────────────────────────────────────────────────────

describe('anonymizeClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success:true when Supabase update succeeds', async () => {
    const updateChain = makeChain({ error: null });
    mockFrom.mockReturnValue(updateChain);

    const result = await anonymizeClient('client-abc');
    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('returns success:false with error message when update fails', async () => {
    const failChain = makeChain({ error: { message: 'DB constraint violation' } });
    mockFrom.mockReturnValue(failChain);

    const result = await anonymizeClient('client-abc');
    expect(result.success).toBe(false);
    expect(result.error).toBe('DB constraint violation');
  });

  it('calls supabase.from("clients") during anonymization', async () => {
    const updateChain = makeChain({ error: null });
    mockFrom.mockReturnValue(updateChain);

    await anonymizeClient('client-abc');

    expect(mockFrom).toHaveBeenCalledWith('clients');
  });
});

// ─── getConsentStatus ─────────────────────────────────────────────────────────

describe('getConsentStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a map with all 5 consent purposes', async () => {
    const queryChain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(queryChain);

    const map = await getConsentStatus('client-1');

    const expectedPurposes: ConsentPurpose[] = [
      'legal_representation',
      'marketing',
      'analytics',
      'third_party_sharing',
      'data_retention_extended',
    ];
    for (const p of expectedPurposes) {
      expect(map).toHaveProperty(p);
    }
  });

  it('sets all purposes to null when no consent records exist', async () => {
    const queryChain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(queryChain);

    const map = await getConsentStatus('client-empty');

    expect(map.legal_representation).toBeNull();
    expect(map.marketing).toBeNull();
    expect(map.analytics).toBeNull();
    expect(map.third_party_sharing).toBeNull();
    expect(map.data_retention_extended).toBeNull();
  });

  it('maps consent rows to ConsentRecord shape', async () => {
    const row = {
      id: 'consent-1',
      client_id: 'client-1',
      purpose: 'marketing',
      granted: true,
      granted_at: '2024-01-01T00:00:00Z',
      revoked_at: null,
    };
    const queryChain = makeChain({ data: [row], error: null });
    mockFrom.mockReturnValue(queryChain);

    const map = await getConsentStatus('client-1');
    const marketing = map.marketing;

    expect(marketing).not.toBeNull();
    expect(marketing?.id).toBe('consent-1');
    expect(marketing?.clientId).toBe('client-1');
    expect(marketing?.purpose).toBe('marketing');
    expect(marketing?.granted).toBe(true);
    expect(marketing?.grantedAt).toBe('2024-01-01T00:00:00Z');
    expect(marketing?.revokedAt).toBeNull();
  });
});

// ─── recordConsent ────────────────────────────────────────────────────────────

describe('recordConsent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns success:true when upsert succeeds', async () => {
    const upsertChain = makeChain({ error: null });
    mockFrom.mockReturnValue(upsertChain);

    const result = await recordConsent('client-1', 'marketing', true);
    expect(result.success).toBe(true);
  });

  it('returns success:false with error message when upsert fails', async () => {
    const upsertChain = makeChain({ error: { message: 'Upsert failed' } });
    mockFrom.mockReturnValue(upsertChain);

    const result = await recordConsent('client-1', 'marketing', false);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Upsert failed');
  });

  it('calls supabase.from("consent_records")', async () => {
    const upsertChain = makeChain({ error: null });
    mockFrom.mockReturnValue(upsertChain);

    await recordConsent('client-1', 'analytics', true);
    expect(mockFrom).toHaveBeenCalledWith('consent_records');
  });
});

// ─── getDataRetentionPolicy ───────────────────────────────────────────────────

describe('getDataRetentionPolicy', () => {
  it('returns an array of retention policies', () => {
    const policies = getDataRetentionPolicy();
    expect(Array.isArray(policies)).toBe(true);
    expect(policies.length).toBeGreaterThan(0);
  });

  it('each policy has required fields: dataType, retentionDays, legalBasis, description', () => {
    const policies = getDataRetentionPolicy();
    for (const policy of policies) {
      expect(typeof policy.dataType).toBe('string');
      expect(policy.dataType.length).toBeGreaterThan(0);
      expect(typeof policy.retentionDays).toBe('number');
      expect(policy.retentionDays).toBeGreaterThan(0);
      expect(typeof policy.legalBasis).toBe('string');
      expect(policy.legalBasis.length).toBeGreaterThan(0);
      expect(typeof policy.description).toBe('string');
    }
  });

  it('includes policies for processes, clients, petitions, financial, audit_logs, consent_records', () => {
    const policies = getDataRetentionPolicy();
    const types = policies.map((p) => p.dataType);
    expect(types).toContain('processes');
    expect(types).toContain('clients');
    expect(types).toContain('petitions');
    expect(types).toContain('financial');
    expect(types).toContain('audit_logs');
    expect(types).toContain('consent_records');
  });

  it('processes retention is 5 years (1825 days)', () => {
    const policies = getDataRetentionPolicy();
    const processes = policies.find((p) => p.dataType === 'processes');
    expect(processes?.retentionDays).toBe(5 * 365);
  });

  it('consent_records retention is 10 years (3650 days)', () => {
    const policies = getDataRetentionPolicy();
    const consent = policies.find((p) => p.dataType === 'consent_records');
    expect(consent?.retentionDays).toBe(10 * 365);
  });

  it('audit_logs retention is 2 years (730 days)', () => {
    const policies = getDataRetentionPolicy();
    const audit = policies.find((p) => p.dataType === 'audit_logs');
    expect(audit?.retentionDays).toBe(2 * 365);
  });
});

// ─── identifyExpiredData ──────────────────────────────────────────────────────

describe('identifyExpiredData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns an empty array when no expired records exist', async () => {
    const queryChain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(queryChain);

    const policy = getDataRetentionPolicy();
    const expired = await identifyExpiredData(policy);
    expect(Array.isArray(expired)).toBe(true);
  });

  it('returns ExpiredDataRecord entries for old audit_log rows', async () => {
    const oldDate = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 3 years ago
    const queryChain = makeChain({
      data: [{ id: 'log-1', created_at: oldDate }],
      error: null,
    });
    mockFrom.mockReturnValue(queryChain);

    const auditPolicy: DataRetentionPolicy[] = [
      {
        dataType: 'audit_logs',
        retentionDays: 2 * 365,
        legalBasis: 'LGPD art. 37',
        description: 'Audit logs',
      },
    ];

    const expired = await identifyExpiredData(auditPolicy);

    expect(expired.length).toBeGreaterThan(0);
    expect(expired[0].table).toBe('audit_logs');
    expect(expired[0].id).toBe('log-1');
    expect(typeof expired[0].daysOverdue).toBe('number');
    expect(expired[0].daysOverdue).toBeGreaterThan(0);
  });

  it('only checks audit_logs (other data types require manual review)', async () => {
    const queryChain = makeChain({ data: [], error: null });
    mockFrom.mockReturnValue(queryChain);

    const mixedPolicy: DataRetentionPolicy[] = [
      { dataType: 'processes', retentionDays: 5 * 365, legalBasis: 'CPC', description: 'p' },
      { dataType: 'clients', retentionDays: 5 * 365, legalBasis: 'LGPD', description: 'c' },
      { dataType: 'audit_logs', retentionDays: 2 * 365, legalBasis: 'LGPD', description: 'a' },
    ];

    await identifyExpiredData(mixedPolicy);

    // Only audit_logs table should be queried
    const calledTables = mockFrom.mock.calls.map((args: unknown[]) => args[0] as string);
    expect(calledTables).toContain('audit_logs');
    expect(calledTables).not.toContain('processes');
    expect(calledTables).not.toContain('clients');
  });

  it('returns empty array when Supabase returns an error', async () => {
    const errorChain = makeChain({ data: null, error: { message: 'DB error' } });
    mockFrom.mockReturnValue(errorChain);

    const policy: DataRetentionPolicy[] = [
      { dataType: 'audit_logs', retentionDays: 2 * 365, legalBasis: 'LGPD', description: 'a' },
    ];

    const expired = await identifyExpiredData(policy);
    expect(expired).toEqual([]);
  });
});
