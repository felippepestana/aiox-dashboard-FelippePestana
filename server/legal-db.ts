/**
 * AIOS Legal Module - Database Layer
 *
 * SQLite database for legal practice management.
 * Uses Bun's native SQLite for performance.
 */

import { Database } from 'bun:sqlite';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import type {
  LegalProcess,
  LegalClient,
  Deadline,
  Petition,
  ProcessMovement,
  Honorario,
  LegalTransaction,
  Publication,
} from '../src/types/legal';

const DB_PATH = process.env.LEGAL_DB || `${process.env.HOME}/.aios/legal/legal.db`;

let db: Database;

export function initLegalDb(): Database {
  // Ensure directory exists
  mkdirSync(dirname(DB_PATH), { recursive: true });

  db = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  db.run('PRAGMA journal_mode = WAL');

  // ─── Legal Processes ───────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS legal_processes (
      id TEXT PRIMARY KEY,
      cnj TEXT NOT NULL,
      title TEXT NOT NULL,
      area TEXT NOT NULL,
      court TEXT NOT NULL,
      judge TEXT,
      vara TEXT,
      comarca TEXT,
      state TEXT,
      client_id TEXT NOT NULL,
      opposing_party TEXT,
      opposing_lawyer TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      urgency TEXT NOT NULL DEFAULT 'medium',
      court_system TEXT,
      object TEXT,
      cause_value REAL DEFAULT 0,
      fee_type TEXT,
      fee_amount REAL DEFAULT 0,
      contingency_pct REAL,
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // ─── Legal Clients ─────────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS legal_clients (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      cpf_cnpj TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      whatsapp TEXT,
      address TEXT DEFAULT '{}',
      rg TEXT,
      profession TEXT,
      company_name TEXT,
      state_registration TEXT,
      process_ids TEXT DEFAULT '[]',
      contract_ids TEXT DEFAULT '[]',
      lead_source TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // ─── Legal Deadlines ───────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS legal_deadlines (
      id TEXT PRIMARY KEY,
      process_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      due_date TEXT NOT NULL,
      reminder_days TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'pending',
      assigned_to TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // ─── Legal Petitions ───────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS legal_petitions (
      id TEXT PRIMARY KEY,
      process_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      content TEXT,
      template_id TEXT,
      squad_workflow_id TEXT,
      filed_at TEXT,
      protocol_number TEXT,
      court_system TEXT,
      document_ids TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // ─── Legal Movements ───────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS legal_movements (
      id TEXT PRIMARY KEY,
      process_id TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT,
      source TEXT NOT NULL DEFAULT 'manual',
      is_read INTEGER NOT NULL DEFAULT 0
    )
  `);

  // ─── Legal Honorarios ──────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS legal_honorarios (
      id TEXT PRIMARY KEY,
      client_id TEXT NOT NULL,
      process_id TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      installments INTEGER NOT NULL DEFAULT 1,
      paid_installments INTEGER NOT NULL DEFAULT 0,
      contract_date TEXT NOT NULL,
      due_day INTEGER NOT NULL DEFAULT 10,
      status TEXT NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  // ─── Legal Transactions ────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS legal_transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL DEFAULT 0,
      description TEXT,
      date TEXT NOT NULL,
      process_id TEXT,
      client_id TEXT,
      honorario_id TEXT,
      invoice_id TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // ─── Legal Publications ────────────────────────────────────────────────────
  db.run(`
    CREATE TABLE IF NOT EXISTS legal_publications (
      id TEXT PRIMARY KEY,
      process_id TEXT,
      source TEXT NOT NULL,
      content TEXT NOT NULL,
      publication_date TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      matched_cnj TEXT,
      matched_oab TEXT,
      created_at TEXT NOT NULL
    )
  `);

  // ─── Indexes ───────────────────────────────────────────────────────────────
  db.run(`CREATE INDEX IF NOT EXISTS idx_processes_cnj ON legal_processes(cnj)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_processes_client_id ON legal_processes(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_processes_status ON legal_processes(status)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_deadlines_due_date ON legal_deadlines(due_date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_deadlines_process_id ON legal_deadlines(process_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_deadlines_status ON legal_deadlines(status)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_movements_date ON legal_movements(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_movements_process_id ON legal_movements(process_id)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_honorarios_client_id ON legal_honorarios(client_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_honorarios_status ON legal_honorarios(status)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON legal_transactions(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON legal_transactions(category)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_transactions_client_id ON legal_transactions(client_id)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj ON legal_clients(cpf_cnpj)`);

  db.run(`CREATE INDEX IF NOT EXISTS idx_publications_process_id ON legal_publications(process_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_publications_matched_cnj ON legal_publications(matched_cnj)`);

  return db;
}

// ─── Process Functions ─────────────────────────────────────────────────────

export function insertProcess(process: LegalProcess): void {
  const stmt = db.prepare(`
    INSERT INTO legal_processes (
      id, cnj, title, area, court, judge, vara, comarca, state,
      client_id, opposing_party, opposing_lawyer, status, urgency,
      court_system, object, cause_value, fee_type, fee_amount,
      contingency_pct, tags, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    process.id,
    process.cnj,
    process.title,
    process.area,
    process.court,
    process.judge,
    process.vara,
    process.comarca,
    process.state,
    process.clientId,
    process.opposingParty,
    process.opposingLawyer,
    process.status,
    process.urgency,
    process.courtSystem,
    process.object,
    process.causeValue,
    process.feeType,
    process.feeAmount,
    process.contingencyPct ?? null,
    JSON.stringify(process.tags),
    process.createdAt,
    process.updatedAt
  );
}

export function getProcesses(options: {
  status?: string;
  clientId?: string;
  area?: string;
  limit?: number;
  offset?: number;
} = {}): LegalProcess[] {
  let sql = 'SELECT * FROM legal_processes WHERE 1=1';
  const params: unknown[] = [];

  if (options.status) {
    sql += ' AND status = ?';
    params.push(options.status);
  }
  if (options.clientId) {
    sql += ' AND client_id = ?';
    params.push(options.clientId);
  }
  if (options.area) {
    sql += ' AND area = ?';
    params.push(options.area);
  }

  sql += ' ORDER BY updated_at DESC';

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }
  if (options.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToProcess);
}

export function getProcessById(id: string): LegalProcess | null {
  const row = db.prepare('SELECT * FROM legal_processes WHERE id = ?').get(id) as Record<string, unknown> | null;
  return row ? rowToProcess(row) : null;
}

function rowToProcess(row: Record<string, unknown>): LegalProcess {
  return {
    id: row.id as string,
    cnj: row.cnj as string,
    title: row.title as string,
    area: row.area as LegalProcess['area'],
    court: row.court as string,
    judge: row.judge as string,
    vara: row.vara as string,
    comarca: row.comarca as string,
    state: row.state as string,
    clientId: row.client_id as string,
    opposingParty: row.opposing_party as string,
    opposingLawyer: row.opposing_lawyer as string,
    status: row.status as LegalProcess['status'],
    urgency: row.urgency as LegalProcess['urgency'],
    courtSystem: row.court_system as LegalProcess['courtSystem'],
    object: row.object as string,
    causeValue: row.cause_value as number,
    feeType: row.fee_type as LegalProcess['feeType'],
    feeAmount: row.fee_amount as number,
    contingencyPct: row.contingency_pct as number | undefined,
    tags: JSON.parse((row.tags as string) || '[]'),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Client Functions ──────────────────────────────────────────────────────

export function insertClient(client: LegalClient): void {
  const stmt = db.prepare(`
    INSERT INTO legal_clients (
      id, type, name, cpf_cnpj, email, phone, whatsapp, address,
      rg, profession, company_name, state_registration,
      process_ids, contract_ids, lead_source, notes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    client.id,
    client.type,
    client.name,
    client.cpfCnpj,
    client.email,
    client.phone,
    client.whatsapp,
    JSON.stringify(client.address),
    client.rg ?? null,
    client.profession ?? null,
    client.companyName ?? null,
    client.stateRegistration ?? null,
    JSON.stringify(client.processIds),
    JSON.stringify(client.contractIds),
    client.leadSource ?? null,
    client.notes,
    client.createdAt,
    client.updatedAt
  );
}

export function getClients(options: {
  type?: string;
  limit?: number;
  offset?: number;
} = {}): LegalClient[] {
  let sql = 'SELECT * FROM legal_clients WHERE 1=1';
  const params: unknown[] = [];

  if (options.type) {
    sql += ' AND type = ?';
    params.push(options.type);
  }

  sql += ' ORDER BY name ASC';

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }
  if (options.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToClient);
}

function rowToClient(row: Record<string, unknown>): LegalClient {
  return {
    id: row.id as string,
    type: row.type as LegalClient['type'],
    name: row.name as string,
    cpfCnpj: row.cpf_cnpj as string,
    email: row.email as string,
    phone: row.phone as string,
    whatsapp: row.whatsapp as string,
    address: JSON.parse((row.address as string) || '{}'),
    rg: row.rg as string | undefined,
    profession: row.profession as string | undefined,
    companyName: row.company_name as string | undefined,
    stateRegistration: row.state_registration as string | undefined,
    processIds: JSON.parse((row.process_ids as string) || '[]'),
    contractIds: JSON.parse((row.contract_ids as string) || '[]'),
    leadSource: row.lead_source as string | undefined,
    notes: row.notes as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ─── Deadline Functions ────────────────────────────────────────────────────

export function insertDeadline(deadline: Deadline): void {
  const stmt = db.prepare(`
    INSERT INTO legal_deadlines (
      id, process_id, title, type, due_date, reminder_days,
      status, assigned_to, notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    deadline.id,
    deadline.processId,
    deadline.title,
    deadline.type,
    deadline.dueDate,
    JSON.stringify(deadline.reminderDays),
    deadline.status,
    deadline.assignedTo,
    deadline.notes,
    deadline.createdAt
  );
}

export function getDeadlines(options: {
  processId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
} = {}): Deadline[] {
  let sql = 'SELECT * FROM legal_deadlines WHERE 1=1';
  const params: unknown[] = [];

  if (options.processId) {
    sql += ' AND process_id = ?';
    params.push(options.processId);
  }
  if (options.status) {
    sql += ' AND status = ?';
    params.push(options.status);
  }
  if (options.fromDate) {
    sql += ' AND due_date >= ?';
    params.push(options.fromDate);
  }
  if (options.toDate) {
    sql += ' AND due_date <= ?';
    params.push(options.toDate);
  }

  sql += ' ORDER BY due_date ASC';

  if (options.limit) {
    sql += ' LIMIT ?';
    params.push(options.limit);
  }
  if (options.offset) {
    sql += ' OFFSET ?';
    params.push(options.offset);
  }

  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map(rowToDeadline);
}

function rowToDeadline(row: Record<string, unknown>): Deadline {
  return {
    id: row.id as string,
    processId: row.process_id as string,
    title: row.title as string,
    type: row.type as Deadline['type'],
    dueDate: row.due_date as string,
    reminderDays: JSON.parse((row.reminder_days as string) || '[]'),
    status: row.status as Deadline['status'],
    assignedTo: row.assigned_to as string,
    notes: row.notes as string,
    createdAt: row.created_at as string,
  };
}

// ─── Petition Functions ────────────────────────────────────────────────────

export function insertPetition(petition: Petition): void {
  const stmt = db.prepare(`
    INSERT INTO legal_petitions (
      id, process_id, type, title, status, content,
      template_id, squad_workflow_id, filed_at, protocol_number,
      court_system, document_ids, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    petition.id,
    petition.processId,
    petition.type,
    petition.title,
    petition.status,
    petition.content,
    petition.templateId ?? null,
    petition.squadWorkflowId ?? null,
    petition.filedAt ?? null,
    petition.protocolNumber ?? null,
    petition.courtSystem ?? null,
    JSON.stringify(petition.documentIds),
    petition.createdAt,
    petition.updatedAt
  );
}

// ─── Movement Functions ────────────────────────────────────────────────────

export function insertMovement(movement: ProcessMovement): void {
  const stmt = db.prepare(`
    INSERT INTO legal_movements (
      id, process_id, date, description, type, source, is_read
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    movement.id,
    movement.processId,
    movement.date,
    movement.description,
    movement.type,
    movement.source,
    movement.isRead ? 1 : 0
  );
}

// ─── Honorario Functions ───────────────────────────────────────────────────

export function insertHonorario(honorario: Honorario): void {
  const stmt = db.prepare(`
    INSERT INTO legal_honorarios (
      id, client_id, process_id, type, amount, installments,
      paid_installments, contract_date, due_day, status,
      notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    honorario.id,
    honorario.clientId,
    honorario.processId ?? null,
    honorario.type,
    honorario.amount,
    honorario.installments,
    honorario.paidInstallments,
    honorario.contractDate,
    honorario.dueDay,
    honorario.status,
    honorario.notes,
    honorario.createdAt,
    honorario.updatedAt
  );
}

// ─── Transaction Functions ─────────────────────────────────────────────────

export function insertTransaction(transaction: LegalTransaction): void {
  const stmt = db.prepare(`
    INSERT INTO legal_transactions (
      id, type, category, amount, description, date,
      process_id, client_id, honorario_id, invoice_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    transaction.id,
    transaction.type,
    transaction.category,
    transaction.amount,
    transaction.description,
    transaction.date,
    transaction.processId ?? null,
    transaction.clientId ?? null,
    transaction.honorarioId ?? null,
    transaction.invoiceId ?? null,
    transaction.createdAt
  );
}
