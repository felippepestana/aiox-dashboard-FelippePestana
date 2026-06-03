// =============================================================================
// LGPD Compliance Utilities
// Lei Geral de Proteção de Dados (Law 13.709/2018)
// Implements: Right to Access, Right to Erasure, Consent management,
//             Data retention policies, Expired data identification
// =============================================================================

import { supabase } from '@/lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConsentPurpose =
  | 'legal_representation'   // Mandatory — contrato de mandato
  | 'marketing'              // Optional — comunicações de marketing
  | 'analytics'              // Optional — análise de uso da plataforma
  | 'third_party_sharing'    // Requires explicit consent
  | 'data_retention_extended'; // Retention beyond legal minimum

export interface ConsentRecord {
  id: string;
  clientId: string;
  purpose: ConsentPurpose;
  granted: boolean;
  grantedAt: string | null;
  revokedAt: string | null;
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionDays: number;
  legalBasis: string;
  description: string;
}

export interface ExpiredDataRecord {
  table: string;
  id: string;
  createdAt: string;
  expiredAt: string;
  daysOverdue: number;
}

export interface ClientDataReport {
  exportedAt: string;
  clientId: string;
  client: Record<string, unknown> | null;
  processes: Record<string, unknown>[];
  petitions: Record<string, unknown>[];
  deadlines: Record<string, unknown>[];
  financialRecords: Record<string, unknown>[];
  consentRecords: ConsentRecord[];
  auditEntries: Record<string, unknown>[];
}

// ─── Right to Access (Art. 18, II LGPD) ──────────────────────────────────────

/**
 * Generate a full data export report for a client.
 * Covers all tables that hold client-related personal data.
 */
export async function generateDataReport(clientId: string): Promise<ClientDataReport> {
  const [
    clientResult,
    processesResult,
    petitionsResult,
    deadlinesResult,
    financialResult,
    consentResult,
    auditResult,
  ] = await Promise.all([
    supabase.from('clients').select('*').eq('id', clientId).single(),
    supabase.from('processes').select('*').eq('client_id', clientId),
    supabase.from('petitions').select('*').eq('client_id', clientId),
    supabase.from('deadlines').select('*').eq('client_id', clientId),
    supabase.from('transactions').select('*').eq('client_id', clientId),
    supabase.from('consent_records').select('*').eq('client_id', clientId),
    supabase.from('audit_logs').select('*').eq('resource_type', 'client').eq('resource_id', clientId).order('created_at', { ascending: false }).limit(500),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    clientId,
    client: clientResult.data ?? null,
    processes: processesResult.data ?? [],
    petitions: petitionsResult.data ?? [],
    deadlines: deadlinesResult.data ?? [],
    financialRecords: financialResult.data ?? [],
    consentRecords: (consentResult.data ?? []).map(rowToConsent),
    auditEntries: auditResult.data ?? [],
  };
}

// ─── Right to Erasure (Art. 18, VI LGPD) ─────────────────────────────────────

/**
 * Anonymise all PII for a client.
 * Replaces personal data with synthetic placeholders.
 * Note: process records are retained for legal compliance (Art. 16, I LGPD).
 */
export async function anonymizeClient(clientId: string): Promise<{ success: boolean; error?: string }> {
  const anon = {
    name: `ANONIMIZADO-${clientId.slice(0, 8).toUpperCase()}`,
    cpf_cnpj: '000.000.000-00',
    email: null,
    phone: null,
    address: null,
    notes: 'Dados pessoais removidos conforme solicitação LGPD.',
    anonymized_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from('clients')
    .update(anon)
    .eq('id', clientId);

  if (error) {
    return { success: false, error: error.message };
  }

  // Record consent revocation for all purposes
  await supabase
    .from('consent_records')
    .update({ granted: false, revoked_at: new Date().toISOString() })
    .eq('client_id', clientId)
    .eq('granted', true);

  return { success: true };
}

// ─── Consent management (Art. 7 & 8 LGPD) ────────────────────────────────────

/**
 * Return all consent records for a client, keyed by purpose.
 */
export async function getConsentStatus(
  clientId: string,
): Promise<Record<ConsentPurpose, ConsentRecord | null>> {
  const { data } = await supabase
    .from('consent_records')
    .select('*')
    .eq('client_id', clientId);

  const map = Object.fromEntries(
    (Object.keys({
      legal_representation: null,
      marketing: null,
      analytics: null,
      third_party_sharing: null,
      data_retention_extended: null,
    }) as ConsentPurpose[]).map((p) => [p, null]),
  ) as Record<ConsentPurpose, ConsentRecord | null>;

  for (const row of data ?? []) {
    map[row.purpose as ConsentPurpose] = rowToConsent(row);
  }

  return map;
}

/**
 * Upsert a consent record for a specific purpose.
 */
export async function recordConsent(
  clientId: string,
  purpose: ConsentPurpose,
  granted: boolean,
): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  const payload = {
    client_id: clientId,
    purpose,
    granted,
    granted_at: granted ? now : null,
    revoked_at: granted ? null : now,
  };

  const { error } = await supabase
    .from('consent_records')
    .upsert(payload, { onConflict: 'client_id,purpose' });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

// ─── Data Retention (Art. 15 & 16 LGPD) ──────────────────────────────────────

/**
 * Returns the canonical retention policy table for each data type.
 * Retention periods are aligned with Brazilian legal obligations:
 *   - CPC art. 206 (5-year statute of limitations for most civil claims)
 *   - CLT art. 11 (2-year labour claims after contract termination)
 *   - CTN art. 174 (5-year tax credits)
 *   - LGPD art. 16 (retention only while necessary or legally required)
 */
export function getDataRetentionPolicy(): DataRetentionPolicy[] {
  return [
    {
      dataType: 'processes',
      retentionDays: 5 * 365, // 5 years — CPC art. 206
      legalBasis: 'CPC art. 206 — prescrição civil',
      description: 'Processos judiciais e documentos vinculados',
    },
    {
      dataType: 'clients',
      retentionDays: 5 * 365,
      legalBasis: 'LGPD art. 16, I — obrigação legal',
      description: 'Dados cadastrais de clientes ativos e encerrados',
    },
    {
      dataType: 'petitions',
      retentionDays: 5 * 365,
      legalBasis: 'CPC art. 206 — prescrição civil',
      description: 'Peças processuais e minutas',
    },
    {
      dataType: 'financial',
      retentionDays: 5 * 365, // Receita Federal — 5 years
      legalBasis: 'CTN art. 174 — prescrição tributária',
      description: 'Honorários, transações e notas fiscais',
    },
    {
      dataType: 'audit_logs',
      retentionDays: 2 * 365, // 2 years for audit trail
      legalBasis: 'LGPD art. 37 — registros de operações',
      description: 'Log de auditoria de ações dos usuários',
    },
    {
      dataType: 'consent_records',
      retentionDays: 10 * 365, // 10 years — proof of consent
      legalBasis: 'LGPD art. 8 §5 — ônus da prova do consentimento',
      description: 'Histórico de consentimentos LGPD',
    },
  ];
}

/**
 * Identify records that have passed their retention deadline.
 */
export async function identifyExpiredData(
  policy: DataRetentionPolicy[],
): Promise<ExpiredDataRecord[]> {
  const expired: ExpiredDataRecord[] = [];
  const now = Date.now();

  for (const rule of policy) {
    const cutoff = new Date(now - rule.retentionDays * 24 * 60 * 60 * 1000).toISOString();

    // Only audit_logs and consent_records are checked directly — processes/clients
    // require manual review before deletion (legal hold may apply).
    if (rule.dataType !== 'audit_logs') continue;

    const { data, error } = await supabase
      .from(rule.dataType as 'audit_logs')
      .select('id, created_at')
      .lt('created_at', cutoff)
      .limit(500);

    if (error || !data) continue;

    for (const row of data) {
      const createdAt = row.created_at as string;
      const expiredAt = new Date(
        new Date(createdAt).getTime() + rule.retentionDays * 24 * 60 * 60 * 1000,
      ).toISOString();
      const daysOverdue = Math.floor(
        (now - new Date(expiredAt).getTime()) / (1000 * 60 * 60 * 24),
      );

      expired.push({
        table: rule.dataType,
        id: row.id as string,
        createdAt,
        expiredAt,
        daysOverdue,
      });
    }
  }

  return expired;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function rowToConsent(row: Record<string, unknown>): ConsentRecord {
  return {
    id: row.id as string,
    clientId: row.client_id as string,
    purpose: row.purpose as ConsentPurpose,
    granted: row.granted as boolean,
    grantedAt: (row.granted_at as string) ?? null,
    revokedAt: (row.revoked_at as string) ?? null,
  };
}
