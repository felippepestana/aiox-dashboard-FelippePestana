// =============================================================================
// Data Encryption — AES-256-GCM at rest + PBKDF2 key derivation
// Used to protect sensitive PII fields (CPF, financial data, credentials)
// Matches the same scheme used in court-credential-manager.ts
// =============================================================================

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  pbkdf2Sync,
  randomBytes,
} from 'crypto';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 12; // 96 bits (GCM standard)
const TAG_LENGTH = 16; // 128 bits
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_DIGEST = 'sha256';
const SALT = 'aiox-legal-encryption-salt-v1'; // fixed per-app salt for key derivation

// ─── Key derivation ───────────────────────────────────────────────────────────

/**
 * Derive a 256-bit AES key from the AUTH_SECRET env variable using PBKDF2.
 * A custom key can be passed for field-level key rotation scenarios.
 */
function deriveKey(secret?: string): Buffer {
  const base = secret ?? process.env.AUTH_SECRET ?? 'fallback-dev-secret-change-in-production';
  return pbkdf2Sync(base, SALT, PBKDF2_ITERATIONS, KEY_LENGTH, PBKDF2_DIGEST);
}

// ─── Encryption ───────────────────────────────────────────────────────────────

/**
 * Encrypt a string value using AES-256-GCM.
 * Returns a base64-encoded blob: iv(12) || ciphertext || authTag(16).
 */
export function encryptSensitiveData(plaintext: string, keySecret?: string): string {
  const key = deriveKey(keySecret);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Layout: iv | ciphertext | authTag
  const blob = Buffer.concat([iv, encrypted, tag]);
  return blob.toString('base64');
}

/**
 * Decrypt a base64-encoded AES-256-GCM blob produced by encryptSensitiveData.
 * Throws if the data is tampered or the key is wrong.
 */
export function decryptSensitiveData(encryptedBase64: string, keySecret?: string): string {
  const key = deriveKey(keySecret);
  const blob = Buffer.from(encryptedBase64, 'base64');

  if (blob.length < IV_LENGTH + TAG_LENGTH) {
    throw new Error('Invalid encrypted payload: too short');
  }

  const iv = blob.subarray(0, IV_LENGTH);
  const tag = blob.subarray(blob.length - TAG_LENGTH);
  const ciphertext = blob.subarray(IV_LENGTH, blob.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

// ─── PII hashing ─────────────────────────────────────────────────────────────

/**
 * One-way SHA-256 hash of a PII value (e.g. CPF).
 * Use for indexed lookups without storing the plaintext.
 */
export function hashPII(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

// ─── Convenience helpers ──────────────────────────────────────────────────────

/**
 * Encrypt a plain object (JSON-serialised) for storage as a single encrypted column.
 */
export function encryptObject(obj: unknown, keySecret?: string): string {
  return encryptSensitiveData(JSON.stringify(obj), keySecret);
}

/**
 * Decrypt and JSON-parse an object previously encrypted with encryptObject.
 */
export function decryptObject<T = unknown>(encryptedBase64: string, keySecret?: string): T {
  return JSON.parse(decryptSensitiveData(encryptedBase64, keySecret)) as T;
}
