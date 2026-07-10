import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  encryptSensitiveData,
  decryptSensitiveData,
  hashPII,
  encryptObject,
  decryptObject,
} from '@/lib/data-encryption';

// ─── encryptSensitiveData / decryptSensitiveData ──────────────────────────────

describe('encrypt → decrypt roundtrip', () => {
  it('decrypting an encrypted string returns the original plaintext', () => {
    const plaintext = 'Hello, APEX Legal!';
    const ciphertext = encryptSensitiveData(plaintext);
    expect(decryptSensitiveData(ciphertext)).toBe(plaintext);
  });

  it('roundtrip works for a CPF value', () => {
    const cpf = '123.456.789-09';
    expect(decryptSensitiveData(encryptSensitiveData(cpf))).toBe(cpf);
  });

  it('roundtrip works for an empty string', () => {
    const empty = '';
    expect(decryptSensitiveData(encryptSensitiveData(empty))).toBe(empty);
  });

  it('roundtrip works for a long string', () => {
    const long = 'A'.repeat(10_000);
    expect(decryptSensitiveData(encryptSensitiveData(long))).toBe(long);
  });

  it('roundtrip works for unicode / Portuguese characters', () => {
    const text = 'Descrição do processo: réu João da Silva — São Paulo';
    expect(decryptSensitiveData(encryptSensitiveData(text))).toBe(text);
  });

  it('roundtrip preserves JSON-like strings', () => {
    const json = '{"name":"Alice","cpf":"000.000.000-00"}';
    expect(decryptSensitiveData(encryptSensitiveData(json))).toBe(json);
  });
});

describe('encryption produces unique ciphertexts', () => {
  it('encrypting the same plaintext twice yields different base64 blobs (random IV)', () => {
    const plaintext = 'same input';
    const ct1 = encryptSensitiveData(plaintext);
    const ct2 = encryptSensitiveData(plaintext);
    expect(ct1).not.toBe(ct2);
  });

  it('encrypting different inputs produces different ciphertexts', () => {
    const ct1 = encryptSensitiveData('input-A');
    const ct2 = encryptSensitiveData('input-B');
    expect(ct1).not.toBe(ct2);
  });

  it('returns a base64 string', () => {
    const ct = encryptSensitiveData('test');
    expect(() => Buffer.from(ct, 'base64')).not.toThrow();
    // Re-encoding should reproduce the same string (valid base64)
    expect(Buffer.from(ct, 'base64').toString('base64')).toBe(ct);
  });
});

describe('custom key support', () => {
  it('encrypting with a custom key and decrypting with the same key succeeds', () => {
    const secret = 'my-custom-key-for-field-rotation';
    const plaintext = 'field-level secret';
    const ct = encryptSensitiveData(plaintext, secret);
    expect(decryptSensitiveData(ct, secret)).toBe(plaintext);
  });

  it('decrypting with a wrong key throws', () => {
    const ct = encryptSensitiveData('secret', 'correct-key');
    expect(() => decryptSensitiveData(ct, 'wrong-key')).toThrow();
  });

  it('decrypting with default key fails when encrypted with custom key', () => {
    const ct = encryptSensitiveData('secret', 'custom-key-abc');
    // Default key != custom key, so this must throw
    expect(() => decryptSensitiveData(ct)).toThrow();
  });
});

describe('error handling', () => {
  it('throws on payload that is too short to contain iv + tag', () => {
    const tooShort = Buffer.from('tooshort').toString('base64');
    expect(() => decryptSensitiveData(tooShort)).toThrow('Invalid encrypted payload: too short');
  });

  it('throws on completely invalid base64 payload', () => {
    // A random 30-byte blob — invalid GCM auth tag
    const garbage = Buffer.alloc(30, 0xff).toString('base64');
    expect(() => decryptSensitiveData(garbage)).toThrow();
  });
});

describe('AUTH_SECRET env fallback', () => {
  const originalEnv = process.env.AUTH_SECRET;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.AUTH_SECRET = originalEnv;
    } else {
      delete process.env.AUTH_SECRET;
    }
  });

  it('uses AUTH_SECRET when set', () => {
    process.env.AUTH_SECRET = 'env-secret-key';
    const plaintext = 'env-driven plaintext';
    const ct = encryptSensitiveData(plaintext);
    expect(decryptSensitiveData(ct)).toBe(plaintext);
  });

  it('throws when AUTH_SECRET is absent instead of using a fallback secret', () => {
    delete process.env.AUTH_SECRET;
    expect(() => encryptSensitiveData('no fallback allowed')).toThrow(/AUTH_SECRET/);
  });
});

// ─── hashPII ──────────────────────────────────────────────────────────────────

describe('hashPII', () => {
  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = hashPII('123.456.789-09');
    expect(hash).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });

  it('is deterministic — same input produces same hash', () => {
    const value = '987.654.321-00';
    expect(hashPII(value)).toBe(hashPII(value));
  });

  it('different inputs produce different hashes', () => {
    expect(hashPII('cpf-a')).not.toBe(hashPII('cpf-b'));
  });

  it('is case-insensitive (lowercases before hashing)', () => {
    expect(hashPII('CPF-VALUE')).toBe(hashPII('cpf-value'));
  });

  it('trims whitespace before hashing', () => {
    expect(hashPII('  123.456.789-09  ')).toBe(hashPII('123.456.789-09'));
  });
});

// ─── encryptObject / decryptObject ────────────────────────────────────────────

describe('encryptObject / decryptObject', () => {
  it('roundtrip preserves a plain object', () => {
    const obj = { name: 'Alice', cpf: '000.000.000-00', amount: 42 };
    const encrypted = encryptObject(obj);
    const decrypted = decryptObject<typeof obj>(encrypted);
    expect(decrypted).toEqual(obj);
  });

  it('roundtrip preserves an array', () => {
    const arr = [1, 2, 3, 'four'];
    const encrypted = encryptObject(arr);
    const decrypted = decryptObject<typeof arr>(encrypted);
    expect(decrypted).toEqual(arr);
  });

  it('roundtrip preserves null', () => {
    const encrypted = encryptObject(null);
    const decrypted = decryptObject(encrypted);
    expect(decrypted).toBeNull();
  });

  it('roundtrip preserves nested objects', () => {
    const nested = { a: { b: { c: 'deep' } } };
    const encrypted = encryptObject(nested);
    const decrypted = decryptObject<typeof nested>(encrypted);
    expect(decrypted.a.b.c).toBe('deep');
  });

  it('decryptObject with wrong key throws', () => {
    const ct = encryptObject({ secret: true }, 'key-a');
    expect(() => decryptObject(ct, 'key-b')).toThrow();
  });
});
