// =============================================================================
// Court Credential Manager
// Secure storage and retrieval of court system credentials using AES-256-GCM
// encryption backed by Supabase's `court_credentials` table.
// =============================================================================
//
// Encryption scheme:
//   - Algorithm : AES-256-GCM
//   - Key source: SHA-256 of AUTH_SECRET env var  (32 bytes)
//   - IV        : 12-byte random value, stored alongside ciphertext
//   - Auth tag  : 16 bytes, appended to ciphertext
//   - Wire format: base64( iv[12] || ciphertext || tag[16] )
//
// Supabase table `court_credentials` required columns:
//   id               uuid primary key default gen_random_uuid()
//   system           text not null
//   tribunal_code    text not null
//   username         text not null
//   encrypted_password text not null
//   last_used        timestamptz
//   is_valid         boolean default true
//   created_at       timestamptz default now()
//   updated_at       timestamptz default now()
// =============================================================================

import { supabase } from '@/lib/supabase';
import type { CourtSystem } from '@/types/legal';

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface CourtCredential {
  id: string;
  system: CourtSystem;
  username: string;
  /** Always undefined when returned from listCredentials — never exposed */
  password?: string;
  tribunalCode: string;
  lastUsed: string | null;
  isValid: boolean;
  createdAt: string;
}

export interface SaveCredentialInput {
  system: CourtSystem;
  username: string;
  password: string;
  tribunalCode: string;
}

// ─── Encryption Helpers ───────────────────────────────────────────────────────

/**
 * Derive a 256-bit AES key from AUTH_SECRET using SHA-256.
 * The key is cached for the process lifetime.
 */
let _cachedKey: CryptoKey | null = null;

/** Derive (and cache) the AES-256-GCM key from AUTH_SECRET via PBKDF2. */
async function getDerivedKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;

  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET (or NEXTAUTH_SECRET) is required for credential encryption');
  }
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey'],
  );

  _cachedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      // Static salt is acceptable here — the secret itself provides entropy
      salt: encoder.encode('aiox-court-credential-salt-v1'),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  return _cachedKey;
}

/**
 * Encrypt plaintext with AES-256-GCM.
 * Returns a base64-encoded blob: iv(12) + ciphertext + authTag(16)
 */
async function encryptPassword(plaintext: string): Promise<string> {
  const key = await getDerivedKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  );

  // Combine iv || ciphertext (which already includes the 16-byte auth tag)
  const combined = new Uint8Array(iv.byteLength + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), iv.byteLength);

  return Buffer.from(combined).toString('base64');
}

/**
 * Decrypt an AES-256-GCM encrypted blob produced by encryptPassword.
 * Returns the plaintext, or throws on tampered/corrupt data.
 */
async function decryptPassword(blob: string): Promise<string> {
  const key = await getDerivedKey();
  const combined = Buffer.from(blob, 'base64');

  const iv = combined.subarray(0, 12);
  const ciphertext = combined.subarray(12);

  const plaintextBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext,
  );

  return new TextDecoder().decode(plaintextBuffer);
}

// ─── Database Row Shape ───────────────────────────────────────────────────────

interface CredentialRow {
  id: string;
  system: string;
  username: string;
  encrypted_password: string;
  tribunal_code: string;
  last_used: string | null;
  is_valid: boolean;
  created_at: string;
}

/**
 * Map a court_credentials DB row to a CourtCredential, optionally
 * attaching the decrypted password.
 */
function rowToCredential(row: CredentialRow, includePassword?: false): CourtCredential;
function rowToCredential(row: CredentialRow, password: string): CourtCredential & { password: string };
function rowToCredential(row: CredentialRow, password?: string | false): CourtCredential {
  return {
    id: row.id,
    system: row.system as CourtSystem,
    username: row.username,
    ...(password ? { password } : {}),
    tribunalCode: row.tribunal_code,
    lastUsed: row.last_used,
    isValid: row.is_valid,
    createdAt: row.created_at,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Encrypt and persist a court credential.
 * If a credential for the same (system, tribunalCode, username) already exists
 * it is updated in place; otherwise a new row is inserted.
 *
 * @returns The saved credential (without the password field)
 */
export async function saveCredential(input: SaveCredentialInput): Promise<CourtCredential> {
  const { system, username, password, tribunalCode } = input;

  const encryptedPassword = await encryptPassword(password);

  // Upsert on (system, tribunal_code, username) unique key
  const { data, error } = await supabase
    .from('court_credentials')
    .upsert(
      {
        system,
        username,
        encrypted_password: encryptedPassword,
        tribunal_code: tribunalCode,
        is_valid: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'system,tribunal_code,username' },
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Falha ao salvar credencial: ${error.message}`);
  }

  return rowToCredential(data as CredentialRow);
}

/**
 * Retrieve and decrypt the password for a specific (system, tribunalCode).
 * Returns null when no credential is found.
 */
export async function getCredential(
  system: CourtSystem,
  tribunalCode: string,
): Promise<(CourtCredential & { password: string }) | null> {
  const { data, error } = await supabase
    .from('court_credentials')
    .select('*')
    .eq('system', system)
    .eq('tribunal_code', tribunalCode)
    .eq('is_valid', true)
    .order('last_used', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao recuperar credencial: ${error.message}`);
  }

  if (!data) return null;

  const row = data as CredentialRow;
  const password = await decryptPassword(row.encrypted_password);

  // Update last_used timestamp asynchronously (fire-and-forget)
  supabase
    .from('court_credentials')
    .update({ last_used: new Date().toISOString() })
    .eq('id', row.id)
    .then(() => {/* ignore */});

  return rowToCredential(row, password);
}

/**
 * Permanently delete a saved credential by ID.
 */
export async function deleteCredential(id: string): Promise<void> {
  const { error } = await supabase
    .from('court_credentials')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Falha ao remover credencial: ${error.message}`);
  }
}

/**
 * Mark a credential as invalid (soft-disable without deleting).
 * Useful when a credential fails authentication.
 */
export async function invalidateCredential(id: string): Promise<void> {
  const { error } = await supabase
    .from('court_credentials')
    .update({ is_valid: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Falha ao invalidar credencial: ${error.message}`);
  }
}

/**
 * List all saved credentials (passwords are never included in this list).
 * Ordered by system then tribunal_code.
 */
export async function listCredentials(): Promise<CourtCredential[]> {
  const { data, error } = await supabase
    .from('court_credentials')
    .select('id, system, username, tribunal_code, last_used, is_valid, created_at')
    .order('system')
    .order('tribunal_code');

  if (error) {
    throw new Error(`Falha ao listar credenciais: ${error.message}`);
  }

  return (data as CredentialRow[]).map((row) => rowToCredential(row));
}

/**
 * Test whether a saved credential is still valid by attempting a lightweight
 * authenticated request to the court system.
 *
 * This is a best-effort check — if the court system is unreachable the
 * credential is considered inconclusive (returns null) rather than invalid.
 *
 * @returns true = valid, false = definitely invalid, null = inconclusive
 */
export async function testCredential(id: string): Promise<boolean | null> {
  const { data, error } = await supabase
    .from('court_credentials')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;

  const row = data as CredentialRow;

  try {
    const password = await decryptPassword(row.encrypted_password);

    // Dynamic import to avoid circular dependency with court-factory
    const { createCourtAdapter } = await import('./court-factory');
    const adapter = createCourtAdapter(row.system as CourtSystem);

    await adapter.authenticate({
      system: row.system as CourtSystem,
      username: row.username,
      password,
    });

    const valid = adapter.isAuthenticated();

    // Update validity flag in DB
    await supabase
      .from('court_credentials')
      .update({ is_valid: valid, updated_at: new Date().toISOString() })
      .eq('id', id);

    return valid;
  } catch {
    // Network error or system unavailable → inconclusive
    return null;
  }
}
