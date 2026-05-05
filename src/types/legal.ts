// =============================================================================
// Legal Platform Types - Advocacia Privada Brasileira
// Full-service legal practice management
// =============================================================================

// ─── Enums ───────────────────────────────────────────────────────────────────

export type ProcessStatus =
  | 'active'
  | 'archived'
  | 'suspended'
  | 'closed'
  | 'won'
  | 'lost'
  | 'settled';

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low';

export type LegalArea =
  | 'civil'
  | 'trabalhista'
  | 'tributario'
  | 'penal'
  | 'administrativo'
  | 'consumidor'
  | 'familia'
  | 'empresarial'
  | 'previdenciario'
  | 'ambiental'
  | 'digital';

export type PetitionType =
  | 'inicial'
  | 'contestacao'
  | 'recurso'
  | 'embargo'
  | 'agravo'
  | 'tutela'
  | 'mandado_seguranca'
  | 'habeas_corpus'
  | 'parecer'
  | 'contrarrazoes'
  | 'recurso_especial'
  | 'recurso_extraordinario'
  | 'outro';

export type CourtSystem =
  | 'pje'
  | 'esaj'
  | 'eproc'
  | 'projudi'
  | 'datajud'
  | 'manual';

export type DeadlineType =
  | 'fatal'
  | 'judicial'
  | 'internal'
  | 'hearing'
  | 'mediation';

export type DeadlineStatus =
  | 'pending'
  | 'completed'
  | 'missed'
  | 'extended';

export type PetitionStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'filed'
  | 'rejected';

export type HonorarioType =
  | 'contractual'
  | 'sucumbencial'
  | 'ad_exitum'
  | 'pro_bono';

export type HonorarioStatus =
  | 'active'
  | 'completed'
  | 'defaulted'
  | 'cancelled';

export type FeeType = 'fixed' | 'hourly' | 'contingency' | 'mixed';

export type ClientType = 'pf' | 'pj';

export type MovementSource = 'manual' | 'dje' | 'pje' | 'datajud';

export type LegalTransactionType = 'income' | 'expense';

export type LegalTransactionCategory =
  | 'honorario_contratual'
  | 'honorario_sucumbencial'
  | 'honorario_exitum'
  | 'custas_judiciais'
  | 'emolumentos'
  | 'pericia'
  | 'salario'
  | 'aluguel'
  | 'tecnologia'
  | 'marketing_legal'
  | 'imposto_irpj'
  | 'imposto_csll'
  | 'imposto_iss'
  | 'imposto_pis_cofins'
  | 'provisao'
  | 'outro';

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'paid'
  | 'overdue'
  | 'cancelled';

// ─── Core Legal Interfaces ──────────────────────────────────────────────────

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface LegalClient {
  id: string;
  type: ClientType;
  name: string;
  cpfCnpj: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: Address;
  rg?: string;
  profession?: string;
  companyName?: string;
  stateRegistration?: string;
  processIds: string[];
  contractIds: string[];
  leadSource?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessMovement {
  id: string;
  processId: string;
  date: string;
  description: string;
  type: string;
  source: MovementSource;
  isRead: boolean;
}

export interface Deadline {
  id: string;
  processId: string;
  title: string;
  type: DeadlineType;
  dueDate: string;
  reminderDays: number[];
  status: DeadlineStatus;
  assignedTo: string;
  notes: string;
  createdAt: string;
}

export interface Petition {
  id: string;
  processId: string;
  type: PetitionType;
  title: string;
  status: PetitionStatus;
  content: string;
  templateId?: string;
  squadWorkflowId?: string;
  filedAt?: string;
  protocolNumber?: string;
  courtSystem?: CourtSystem;
  documentIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LegalDocument {
  id: string;
  processId: string;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: string;
}

export interface ProcessNote {
  id: string;
  processId: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface LegalProcess {
  id: string;
  cnj: string;
  title: string;
  area: LegalArea;
  court: string;
  judge: string;
  vara: string;
  comarca: string;
  state: string;
  clientId: string;
  opposingParty: string;
  opposingLawyer: string;
  status: ProcessStatus;
  urgency: UrgencyLevel;
  courtSystem: CourtSystem;
  object: string;
  causeValue: number;
  feeType: FeeType;
  feeAmount: number;
  contingencyPct?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Financial Types ────────────────────────────────────────────────────────

export interface Honorario {
  id: string;
  clientId: string;
  processId?: string;
  type: HonorarioType;
  amount: number;
  installments: number;
  paidInstallments: number;
  contractDate: string;
  dueDay: number;
  status: HonorarioStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalTransaction {
  id: string;
  type: LegalTransactionType;
  category: LegalTransactionCategory;
  amount: number;
  description: string;
  date: string;
  processId?: string;
  clientId?: string;
  honorarioId?: string;
  invoiceId?: string;
  createdAt: string;
}

export interface LegalInvoice {
  id: string;
  clientId: string;
  processId?: string;
  honorarioId?: string;
  items: LegalInvoiceItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface TaxObligation {
  id: string;
  type: 'irpj' | 'csll' | 'iss' | 'pis_cofins';
  period: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  paidAt?: string;
}

export interface CashFlowEntry {
  date: string;
  balance: number;
  inflows: number;
  outflows: number;
}

// ─── Publication Monitoring ─────────────────────────────────────────────────

export interface Publication {
  id: string;
  processId?: string;
  source: string;
  content: string;
  publicationDate: string;
  isRead: boolean;
  matchedCnj?: string;
  matchedOab?: string;
  createdAt: string;
}

// ─── Strategy Types (Pilar 2) ───────────────────────────────────────────────

export type SelemPillar =
  | 'synergy'
  | 'strategy'
  | 'leadership'
  | 'education'
  | 'mastery';

export interface SelemAssessment {
  id: string;
  pillar: SelemPillar;
  score: number;
  notes: string;
  date: string;
  actionItems: string[];
}

export interface LegalCanvas {
  id: string;
  firmName: string;
  mission: string;
  vision: string;
  values: string[];
  practiceAreas: LegalArea[];
  targetClients: string[];
  channels: string[];
  revenue: string[];
  costs: string[];
  partnerships: string[];
  competitiveAdvantage: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ScalingUpPlan {
  id: string;
  people: string[];
  strategy: string[];
  execution: string[];
  cash: string[];
  quarterlyPriorities: string[];
  annualGoals: string[];
  bhag: string;
  createdAt: string;
  updatedAt: string;
}

export interface KPI {
  id: string;
  name: string;
  category: 'revenue' | 'productivity' | 'client' | 'operations';
  value: number;
  target: number;
  unit: string;
  period: string;
}

// ─── Marketing Types (Pilar 3) ──────────────────────────────────────────────

export type LeadStatus =
  | 'prospect'
  | 'qualified'
  | 'contacted'
  | 'proposal'
  | 'retained'
  | 'lost';

export interface LegalLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: LegalArea;
  source: string;
  status: LeadStatus;
  notes: string;
  assignedTo: string;
  convertedClientId?: string;
  createdAt: string;
  updatedAt: string;
}

export type LegalCampaignType =
  | 'content'
  | 'email'
  | 'social'
  | 'webinar'
  | 'event'
  | 'referral';

export type LegalCampaignChannel =
  | 'instagram'
  | 'linkedin'
  | 'youtube'
  | 'blog'
  | 'email'
  | 'whatsapp'
  | 'google_ads';

export interface LegalCampaign {
  id: string;
  name: string;
  type: LegalCampaignType;
  channel: LegalCampaignChannel;
  area: LegalArea;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  budget: number;
  oabCompliant: boolean;
  metrics: LegalCampaignMetrics;
  createdAt: string;
  updatedAt: string;
}

export interface LegalCampaignMetrics {
  impressions: number;
  clicks: number;
  leads: number;
  conversions: number;
  roi: number;
  engagement: number;
}

export interface LegalContentItem {
  id: string;
  title: string;
  description: string;
  area: LegalArea;
  channel: LegalCampaignChannel;
  status: 'idea' | 'draft' | 'review' | 'approved' | 'published';
  scheduledDate?: string;
  publishedDate?: string;
  content: string;
  oabCompliant: boolean;
  campaignId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Court Integration Types ────────────────────────────────────────────────

export interface CourtCredentials {
  system: CourtSystem;
  username: string;
  password?: string;
  certificate?: string;
  apiKey?: string;
}

export interface CourtSearchResult {
  cnj: string;
  title: string;
  court: string;
  vara: string;
  comarca: string;
  status: string;
  lastMovement?: string;
  source: CourtSystem;
}

export interface FilingReceipt {
  protocolNumber: string;
  filedAt: string;
  court: string;
  cnj: string;
  system: CourtSystem;
}

// ─── Interview Assistant Types (Fase 3) ─────────────────────────────────────

export interface InterviewSession {
  id: string;
  clientId?: string;
  area: LegalArea;
  status: 'active' | 'paused' | 'completed';
  startedAt: string;
  endedAt?: string;
  transcriptEntries: TranscriptEntry[];
  suggestions: InterviewSuggestion[];
  strategyDraft?: string;
  petitionDraft?: string;
}

export interface TranscriptEntry {
  id: string;
  speaker: 'lawyer' | 'client' | 'system';
  text: string;
  timestamp: string;
  confidence: number;
}

export interface InterviewSuggestion {
  id: string;
  type: 'question' | 'precedent' | 'strategy' | 'warning';
  content: string;
  relevance: number;
  timestamp: string;
  accepted: boolean;
}
