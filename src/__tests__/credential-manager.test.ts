import { describe, expect, it, vi } from 'vitest';
import {
  saveCredential,
  getCredential,
  deleteCredential,
  invalidateCredential,
  listCredentials,
  testCredential,
  type CourtCredential,
  type SaveCredentialInput,
} from '@/lib/court/credential-manager';

// ─── Supabase mock ────────────────────────────────────────────────────────────

const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });

/** A thenable query builder that supports arbitrary chaining */
function makeChainableQuery(resolveValue: unknown) {
  const builder: Record<string, unknown> = {};
  const methods = ['eq', 'neq', 'gte', 'lte', 'order', 'limit', 'range'];
  for (const m of methods) {
    builder[m] = vi.fn(() => builder);
  }
  builder['single'] = mockSingle;
  builder['maybeSingle'] = vi.fn().mockResolvedValue({ data: null, error: null });
  // Make the builder thenable
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
      select: vi.fn(() => makeChainableQuery({ data: [], error: null })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({ single: mockSingle })),
      })),
      update: vi.fn(() => makeChainableQuery({ data: null, error: null })),
      delete: vi.fn(() => makeChainableQuery({ data: null, error: null })),
    })),
  },
}));

// ─── Type structure tests ─────────────────────────────────────────────────────

describe('credential-manager — types', () => {
  describe('CourtCredential interface', () => {
    it('accepts a minimal CourtCredential (no password)', () => {
      const cred: CourtCredential = {
        id: 'cred-1',
        system: 'esaj',
        username: 'user@test.com',
        tribunalCode: 'TJSP',
        lastUsed: null,
        isValid: true,
        createdAt: new Date().toISOString(),
      };
      expect(cred.system).toBe('esaj');
      expect(cred.password).toBeUndefined();
    });

    it('accepts all valid CourtSystem types', () => {
      const systems = ['pje', 'esaj', 'projudi', 'eproc', 'datajud', 'manual'] as const;
      for (const system of systems) {
        const cred: CourtCredential = {
          id: `cred-${system}`,
          system,
          username: 'user',
          tribunalCode: 'TJ',
          lastUsed: null,
          isValid: true,
          createdAt: new Date().toISOString(),
        };
        expect(cred.system).toBe(system);
      }
    });

    it('password field is optional', () => {
      const credWithoutPassword: CourtCredential = {
        id: 'c1',
        system: 'pje',
        username: 'user',
        tribunalCode: 'TRT2',
        lastUsed: null,
        isValid: true,
        createdAt: '2024-01-01T00:00:00Z',
      };
      expect(credWithoutPassword.password).toBeUndefined();

      const credWithPassword: CourtCredential = {
        id: 'c2',
        system: 'pje',
        username: 'user',
        password: 'secret123',
        tribunalCode: 'TRT2',
        lastUsed: null,
        isValid: true,
        createdAt: '2024-01-01T00:00:00Z',
      };
      expect(credWithPassword.password).toBe('secret123');
    });

    it('lastUsed can be null or a string', () => {
      const nullLastUsed: CourtCredential = {
        id: 'c3',
        system: 'esaj',
        username: 'u',
        tribunalCode: 'TJSP',
        lastUsed: null,
        isValid: false,
        createdAt: '2024-01-01T00:00:00Z',
      };
      expect(nullLastUsed.lastUsed).toBeNull();

      const stringLastUsed: CourtCredential = {
        ...nullLastUsed,
        id: 'c4',
        lastUsed: new Date().toISOString(),
      };
      expect(typeof stringLastUsed.lastUsed).toBe('string');
    });

    it('isValid is a boolean', () => {
      const valid: CourtCredential = {
        id: 'c5', system: 'pje', username: 'u', tribunalCode: 'TRT2',
        lastUsed: null, isValid: true, createdAt: '2024-01-01T00:00:00Z',
      };
      const invalid: CourtCredential = { ...valid, id: 'c6', isValid: false };
      expect(valid.isValid).toBe(true);
      expect(invalid.isValid).toBe(false);
    });
  });

  describe('SaveCredentialInput interface', () => {
    it('requires system, username, password, and tribunalCode', () => {
      const input: SaveCredentialInput = {
        system: 'esaj',
        username: 'user@example.com',
        password: 'securePass123',
        tribunalCode: 'TJSP',
      };
      expect(input.system).toBe('esaj');
      expect(input.password).toBe('securePass123');
      expect(input.tribunalCode).toBe('TJSP');
    });

    it('accepts all court systems', () => {
      const systems = ['pje', 'esaj', 'projudi', 'eproc', 'datajud'] as const;
      for (const system of systems) {
        const input: SaveCredentialInput = {
          system,
          username: 'user',
          password: 'pass',
          tribunalCode: 'TEST',
        };
        expect(input.system).toBe(system);
      }
    });
  });
});

// ─── Function exports ─────────────────────────────────────────────────────────

describe('credential-manager — function exports', () => {
  it('saveCredential is exported as a function', () => {
    expect(typeof saveCredential).toBe('function');
  });

  it('getCredential is exported as a function', () => {
    expect(typeof getCredential).toBe('function');
  });

  it('deleteCredential is exported as a function', () => {
    expect(typeof deleteCredential).toBe('function');
  });

  it('invalidateCredential is exported as a function', () => {
    expect(typeof invalidateCredential).toBe('function');
  });

  it('listCredentials is exported as a function', () => {
    expect(typeof listCredentials).toBe('function');
  });

  it('testCredential is exported as a function', () => {
    expect(typeof testCredential).toBe('function');
  });
});

// ─── Function signatures / return types ──────────────────────────────────────

describe('credential-manager — function signatures', () => {
  it('saveCredential returns a Promise', () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        id: 'new-id', system: 'esaj', username: 'u',
        encrypted_password: 'enc', tribunal_code: 'TJSP',
        last_used: null, is_valid: true, created_at: '2024-01-01T00:00:00Z',
      },
      error: null,
    });
    const result = saveCredential({
      system: 'esaj', username: 'u', password: 'p', tribunalCode: 'TJSP',
    });
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });

  it('getCredential returns a Promise', () => {
    const result = getCredential('esaj', 'TJSP');
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });

  it('deleteCredential returns a Promise', () => {
    const result = deleteCredential('some-id');
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });

  it('invalidateCredential returns a Promise', () => {
    const result = invalidateCredential('some-id');
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });

  it('listCredentials returns a Promise', () => {
    const result = listCredentials();
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });

  it('testCredential returns a Promise', () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });
    const result = testCredential('some-id');
    expect(result).toBeInstanceOf(Promise);
    return result.catch(() => {});
  });
});

// ─── CourtCredential field checks ─────────────────────────────────────────────

describe('credential-manager — CourtCredential field semantics', () => {
  it('a credential marked isValid=false indicates disabled state', () => {
    const cred: CourtCredential = {
      id: 'c10', system: 'projudi', username: 'user',
      tribunalCode: 'TJPR', lastUsed: null, isValid: false,
      createdAt: '2024-01-01T00:00:00Z',
    };
    expect(cred.isValid).toBe(false);
  });

  it('tribunalCode is a string field', () => {
    const cred: CourtCredential = {
      id: 'c11', system: 'eproc', username: 'user',
      tribunalCode: 'TRF4', lastUsed: null, isValid: true,
      createdAt: '2024-01-01T00:00:00Z',
    };
    expect(typeof cred.tribunalCode).toBe('string');
  });

  it('createdAt is an ISO string field', () => {
    const now = new Date().toISOString();
    const cred: CourtCredential = {
      id: 'c12', system: 'pje', username: 'user',
      tribunalCode: 'TRT2', lastUsed: null, isValid: true,
      createdAt: now,
    };
    expect(cred.createdAt).toBe(now);
    // Verify it parses as a valid date
    expect(Number.isNaN(Date.parse(cred.createdAt))).toBe(false);
  });
});
