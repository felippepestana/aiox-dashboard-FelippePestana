import { describe, expect, it } from 'vitest';
import {
  encryptSensitiveData,
  decryptSensitiveData,
  hashPII,
  encryptObject,
  decryptObject,
} from '@/lib/data-encryption';

// ─── encryptSensitiveData / decryptSensitiveData ──────────────────────────────

describe('data-encryption — encrypt/decrypt round-trip', () => {
  it('encrypting then decrypting a simple string returns the original', () => {
    const original = 'hello world';
    const encrypted = encryptSensitiveData(original);
    expect(decryptSensitiveData(encrypted)).toBe(original);
  });

  it('encrypting then decrypting a CPF string returns the original', () => {
    const cpf = '123.456.789-09';
    expect(decryptSensitiveData(encryptSensitiveData(cpf))).toBe(cpf);
  });

  it('encrypting then decrypting an empty string returns empty string', () => {
    const empty = '';
    expect(decryptSensitiveData(encryptSensitiveData(empty))).toBe(empty);
  });

  it('encrypting then decrypting a JSON string returns the original', () => {
    const json = JSON.stringify({ name: 'Alice', value: 42 });
    expect(decryptSensitiveData(encryptSensitiveData(json))).toBe(json);
  });

  it('encrypting then decrypting a unicode/accented string returns the original', () => {
    const unicode = 'Ação jurídica — § 3º';
    expect(decryptSensitiveData(encryptSensitiveData(unicode))).toBe(unicode);
  });

  it('encrypting then decrypting a long string returns the original', () => {
    const long = 'a'.repeat(10_000);
    expect(decryptSensitiveData(encryptSensitiveData(long))).toBe(long);
  });

  it('encrypted output is a non-empty base64 string', () => {
    const encrypted = encryptSensitiveData('test');
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(0);
    // base64 uses only A-Z a-z 0-9 + / =
    expect(encrypted).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it('two encryptions of the same plaintext produce different ciphertexts (random IV)', () => {
    const plaintext = 'same input';
    const c1 = encryptSensitiveData(plaintext);
    const c2 = encryptSensitiveData(plaintext);
    expect(c1).not.toBe(c2);
  });

  it('decrypting with the wrong key throws', () => {
    const encrypted = encryptSensitiveData('secret', 'correct-key');
    expect(() => decryptSensitiveData(encrypted, 'wrong-key')).toThrow();
  });

  it('decrypting tampered data throws', () => {
    const encrypted = encryptSensitiveData('data');
    // Flip one character in the middle of the base64
    const buf = Buffer.from(encrypted, 'base64');
    buf[20] ^= 0xff;
    const tampered = buf.toString('base64');
    expect(() => decryptSensitiveData(tampered)).toThrow();
  });

  it('decrypting a too-short payload throws', () => {
    // Less than IV_LENGTH (12) + TAG_LENGTH (16) = 28 bytes
    const tooShort = Buffer.alloc(10).toString('base64');
    expect(() => decryptSensitiveData(tooShort)).toThrow('Invalid encrypted payload: too short');
  });

  it('uses a custom keySecret for both encrypt and decrypt', () => {
    const secret = 'my-custom-secret';
    const plaintext = 'confidential';
    const encrypted = encryptSensitiveData(plaintext, secret);
    expect(decryptSensitiveData(encrypted, secret)).toBe(plaintext);
  });

  it('round-trips a numeric string representation', () => {
    const num = '1234567890.99';
    expect(decryptSensitiveData(encryptSensitiveData(num))).toBe(num);
  });
});

// ─── hashPII ─────────────────────────────────────────────────────────────────

describe('data-encryption — hashPII', () => {
  it('returns a 64-character hex string (SHA-256)', () => {
    const hash = hashPII('123.456.789-09');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns the same hash for the same input (deterministic)', () => {
    const h1 = hashPII('cpf-value');
    const h2 = hashPII('cpf-value');
    expect(h1).toBe(h2);
  });

  it('returns different hashes for different inputs', () => {
    expect(hashPII('input-A')).not.toBe(hashPII('input-B'));
  });

  it('is case-insensitive (trims and lowercases)', () => {
    expect(hashPII('ABC')).toBe(hashPII('abc'));
    expect(hashPII('  test  ')).toBe(hashPII('test'));
  });

  it('returns different hashes for similar but distinct values', () => {
    expect(hashPII('123.456.789-09')).not.toBe(hashPII('123.456.789-00'));
  });

  it('handles an empty string without throwing', () => {
    expect(() => hashPII('')).not.toThrow();
    expect(hashPII('')).toHaveLength(64);
  });

  it('handles unicode input without throwing', () => {
    expect(() => hashPII('José da Silva')).not.toThrow();
    expect(hashPII('José da Silva')).toHaveLength(64);
  });
});

// ─── encryptObject / decryptObject ───────────────────────────────────────────

describe('data-encryption — encryptObject / decryptObject', () => {
  it('round-trips a plain object', () => {
    const obj = { name: 'Alice', cpf: '123.456.789-09', age: 30 };
    const encrypted = encryptObject(obj);
    const decrypted = decryptObject<typeof obj>(encrypted);
    expect(decrypted).toEqual(obj);
  });

  it('round-trips an array', () => {
    const arr = [1, 2, 3, 'four'];
    const encrypted = encryptObject(arr);
    expect(decryptObject(encrypted)).toEqual(arr);
  });

  it('round-trips a null value', () => {
    const encrypted = encryptObject(null);
    expect(decryptObject(encrypted)).toBeNull();
  });

  it('round-trips a nested object', () => {
    const nested = { a: { b: { c: 'deep' } }, d: [1, 2] };
    expect(decryptObject(encryptObject(nested))).toEqual(nested);
  });

  it('round-trips a boolean', () => {
    expect(decryptObject(encryptObject(true))).toBe(true);
    expect(decryptObject(encryptObject(false))).toBe(false);
  });

  it('round-trips a number', () => {
    expect(decryptObject(encryptObject(42))).toBe(42);
    expect(decryptObject(encryptObject(3.14))).toBeCloseTo(3.14);
  });

  it('encryptObject output is a non-empty base64 string', () => {
    const enc = encryptObject({ x: 1 });
    expect(typeof enc).toBe('string');
    expect(enc).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it('uses custom keySecret correctly', () => {
    const key = 'object-key';
    const obj = { secret: 'data' };
    const encrypted = encryptObject(obj, key);
    expect(decryptObject(encrypted, key)).toEqual(obj);
  });

  it('decryptObject with wrong key throws', () => {
    const encrypted = encryptObject({ x: 1 }, 'key-a');
    expect(() => decryptObject(encrypted, 'key-b')).toThrow();
  });
});
