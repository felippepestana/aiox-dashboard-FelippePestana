import { describe, expect, it, vi } from 'vitest';
import {
  getDataRetentionPolicy,
  generateDataReport,
  anonymizeClient,
  getConsentStatus,
  recordConsent,
  identifyExpiredData,
  type ConsentPurpose,
  type ConsentRecord,
  type DataRetentionPolicy,
  type ExpiredDataRecord,
  type ClientDataReport,
} from '@/lib/lgpd-compliance';

// ─── Supabase mock ────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      lt: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

// ─── Type structure tests ─────────────────────────────────────────────────────

describe('lgpd-compliance — types', () => {
  describe('ConsentPurpose values', () => {
    const purposes: ConsentPurpose[] = [
      'legal_representation',
      'marketing',
      'analytics',
      'third_party_sharing',
      'data_retention_extended',
    ];

    it('has exactly 5 consent purposes', () => {
      const unique = new Set(purposes);
      expect(unique.size).toBe(5);
    });

    it('each purpose is a non-empty string', () => {
      for (const p of purposes) {
        expect(typeof p).toBe('string');
        expect(p.length).toBeGreaterThan(0);
      }
    });
  });

  describe('ConsentRecord interface', () => {
    it('accepts a fully populated ConsentRecord', () => {
      const record: ConsentRecord = {
        id: 'rec-1',
        clientId: 'client-1',
        purpose: 'marketing',
        granted: true,
        grantedAt: new Date().toISOString(),
        revokedAt: null,
      };
      expect(record.clientId).toBe('client-1');
      expect(record.granted).toBe(true);
      expect(record.revokedAt).toBeNull();
    });

    it('grantedAt and revokedAt can be null', () => {
      const record: ConsentRecord = {
        id: 'rec-2',
        clientId: 'client-2',
        purpose: 'analytics',
        granted: false,
        grantedAt: null,
        revokedAt: null,
      };
      expect(record.grantedAt).toBeNull();
    });
  });

  describe('DataRetentionPolicy interface', () => {
    it('accepts a valid DataRetentionPolicy', () => {
      const policy: DataRetentionPolicy = {
        dataType: 'processes',
        retentionDays: 1825,
        legalBasis: 'CPC art. 206',
        description: 'Processos judiciais',
      };
      expect(policy.retentionDays).toBe(1825);
    });
  });

  describe('ExpiredDataRecord interface', () => {
    it('accepts a valid ExpiredDataRecord', () => {
      const record: ExpiredDataRecord = {
        table: 'audit_logs',
        id: 'row-123',
        createdAt: '2020-01-01T00:00:00Z',
        expiredAt: '2022-01-01T00:00:00Z',
        daysOverdue: 100,
      };
      expect(record.daysOverdue).toBe(100);
    });
  });
});

// ─── Function exports ─────────────────────────────────────────────────────────

describe('lgpd-compliance — function exports', () => {
  it('getDataRetentionPolicy is a function', () => {
    expect(typeof getDataRetentionPolicy).toBe('function');
  });

  it('generateDataReport is a function', () => {
    expect(typeof generateDataReport).toBe('function');
  });

  it('anonymizeClient is a function', () => {
    expect(typeof anonymizeClient).toBe('function');
  });

  it('getConsentStatus is a function', () => {
    expect(typeof getConsentStatus).toBe('function');
  });

  it('recordConsent is a function', () => {
    expect(typeof recordConsent).toBe('function');
  });

  it('identifyExpiredData is a function', () => {
    expect(typeof identifyExpiredData).toBe('function');
  });
});

// ─── getDataRetentionPolicy — pure function ───────────────────────────────────

describe('lgpd-compliance — getDataRetentionPolicy', () => {
  it('returns an array', () => {
    expect(Array.isArray(getDataRetentionPolicy())).toBe(true);
  });

  it('returns exactly 6 policies', () => {
    expect(getDataRetentionPolicy()).toHaveLength(6);
  });

  it('each policy has a non-empty dataType', () => {
    for (const p of getDataRetentionPolicy()) {
      expect(typeof p.dataType).toBe('string');
      expect(p.dataType.length).toBeGreaterThan(0);
    }
  });

  it('each policy has a positive retentionDays', () => {
    for (const p of getDataRetentionPolicy()) {
      expect(p.retentionDays).toBeGreaterThan(0);
    }
  });

  it('each policy has a non-empty legalBasis', () => {
    for (const p of getDataRetentionPolicy()) {
      expect(typeof p.legalBasis).toBe('string');
      expect(p.legalBasis.length).toBeGreaterThan(0);
    }
  });

  it('each policy has a non-empty description', () => {
    for (const p of getDataRetentionPolicy()) {
      expect(typeof p.description).toBe('string');
      expect(p.description.length).toBeGreaterThan(0);
    }
  });

  it('covers processes, clients, petitions, financial, audit_logs, consent_records', () => {
    const dataTypes = getDataRetentionPolicy().map((p) => p.dataType);
    expect(dataTypes).toContain('processes');
    expect(dataTypes).toContain('clients');
    expect(dataTypes).toContain('petitions');
    expect(dataTypes).toContain('financial');
    expect(dataTypes).toContain('audit_logs');
    expect(dataTypes).toContain('consent_records');
  });

  it('processes retention is 5 years (1825 days)', () => {
    const policy = getDataRetentionPolicy().find((p) => p.dataType === 'processes');
    expect(policy?.retentionDays).toBe(5 * 365);
  });

  it('clients retention is 5 years (1825 days)', () => {
    const policy = getDataRetentionPolicy().find((p) => p.dataType === 'clients');
    expect(policy?.retentionDays).toBe(5 * 365);
  });

  it('audit_logs retention is 2 years (730 days)', () => {
    const policy = getDataRetentionPolicy().find((p) => p.dataType === 'audit_logs');
    expect(policy?.retentionDays).toBe(2 * 365);
  });

  it('consent_records retention is 10 years (3650 days)', () => {
    const policy = getDataRetentionPolicy().find((p) => p.dataType === 'consent_records');
    expect(policy?.retentionDays).toBe(10 * 365);
  });

  it('is deterministic — same result on every call', () => {
    expect(getDataRetentionPolicy()).toEqual(getDataRetentionPolicy());
  });

  it('all dataType values are unique', () => {
    const types = getDataRetentionPolicy().map((p) => p.dataType);
    expect(new Set(types).size).toBe(types.length);
  });
});

// ─── generateDataReport — signature ──────────────────────────────────────────

describe('lgpd-compliance — generateDataReport', () => {
  it('returns a Promise', () => {
    const result = generateDataReport('client-123');
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {/* ignore mock errors */});
  });

  it('accepts a clientId string argument', () => {
    expect(() => generateDataReport('any-id')).not.toThrow();
    return generateDataReport('any-id').catch(() => {});
  });
});

// ─── anonymizeClient — signature ──────────────────────────────────────────────

describe('lgpd-compliance — anonymizeClient', () => {
  it('returns a Promise', () => {
    const result = anonymizeClient('client-123');
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });
});

// ─── getConsentStatus — signature ────────────────────────────────────────────

describe('lgpd-compliance — getConsentStatus', () => {
  it('returns a Promise', () => {
    const result = getConsentStatus('client-123');
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });
});

// ─── recordConsent — signature ───────────────────────────────────────────────

describe('lgpd-compliance — recordConsent', () => {
  it('accepts clientId, purpose, and granted boolean', () => {
    const result = recordConsent('client-1', 'marketing', true);
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });

  it('accepts granted=false', () => {
    const result = recordConsent('client-1', 'analytics', false);
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });
});

// ─── identifyExpiredData — signature ─────────────────────────────────────────

describe('lgpd-compliance — identifyExpiredData', () => {
  it('returns a Promise', () => {
    const result = identifyExpiredData([]);
    expect(result).toBeInstanceOf(Promise);
    return result;
  });

  it('returns an empty array when given no policies', async () => {
    const result = await identifyExpiredData([]);
    expect(result).toEqual([]);
  });

  it('skips non-audit_logs policies (only audit_logs is checked directly)', async () => {
    const policies = getDataRetentionPolicy().filter((p) => p.dataType !== 'audit_logs');
    const result = await identifyExpiredData(policies);
    expect(result).toEqual([]);
  });
});
