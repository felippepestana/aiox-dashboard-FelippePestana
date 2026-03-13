// =============================================================================
// Dental Platform Types - Sbarzi Odontologia e Saúde
// Porto Velho, RO - Brazil
// =============================================================================

// ─── Enums ───────────────────────────────────────────────────────────────────

export enum ExamType {
  PANORAMIC_XRAY = 'panoramic_xray',
  PERIAPICAL_XRAY = 'periapical_xray',
  CT_SCAN = 'ct_scan',
  MRI = 'mri',
  CEPHALOMETRIC = 'cephalometric',
  BITE_WING = 'bite_wing',
  OCCLUSAL = 'occlusal',
  PHOTOS = 'photos',
}

export enum ProcedureCategory {
  PREVENTIVE = 'preventive',
  RESTORATIVE = 'restorative',
  ENDODONTICS = 'endodontics',
  PERIODONTICS = 'periodontics',
  ORTHODONTICS = 'orthodontics',
  SURGERY = 'surgery',
  IMPLANTOLOGY = 'implantology',
  PROSTHODONTICS = 'prosthodontics',
  AESTHETICS = 'aesthetics',
  PEDIATRIC = 'pediatric',
}

/**
 * FDI (Fédération Dentaire Internationale) tooth notation.
 * Quadrants: 1 = upper-right, 2 = upper-left, 3 = lower-left, 4 = lower-right
 * Teeth numbered 1–8 in each quadrant (central incisor → third molar).
 * Deciduous: quadrants 5–8, teeth 1–5.
 */
export enum ToothRegion {
  // Upper-right quadrant (permanent)
  TOOTH_11 = '11', TOOTH_12 = '12', TOOTH_13 = '13', TOOTH_14 = '14',
  TOOTH_15 = '15', TOOTH_16 = '16', TOOTH_17 = '17', TOOTH_18 = '18',
  // Upper-left quadrant (permanent)
  TOOTH_21 = '21', TOOTH_22 = '22', TOOTH_23 = '23', TOOTH_24 = '24',
  TOOTH_25 = '25', TOOTH_26 = '26', TOOTH_27 = '27', TOOTH_28 = '28',
  // Lower-left quadrant (permanent)
  TOOTH_31 = '31', TOOTH_32 = '32', TOOTH_33 = '33', TOOTH_34 = '34',
  TOOTH_35 = '35', TOOTH_36 = '36', TOOTH_37 = '37', TOOTH_38 = '38',
  // Lower-right quadrant (permanent)
  TOOTH_41 = '41', TOOTH_42 = '42', TOOTH_43 = '43', TOOTH_44 = '44',
  TOOTH_45 = '45', TOOTH_46 = '46', TOOTH_47 = '47', TOOTH_48 = '48',
  // Deciduous upper-right
  TOOTH_51 = '51', TOOTH_52 = '52', TOOTH_53 = '53', TOOTH_54 = '54', TOOTH_55 = '55',
  // Deciduous upper-left
  TOOTH_61 = '61', TOOTH_62 = '62', TOOTH_63 = '63', TOOTH_64 = '64', TOOTH_65 = '65',
  // Deciduous lower-left
  TOOTH_71 = '71', TOOTH_72 = '72', TOOTH_73 = '73', TOOTH_74 = '74', TOOTH_75 = '75',
  // Deciduous lower-right
  TOOTH_81 = '81', TOOTH_82 = '82', TOOTH_83 = '83', TOOTH_84 = '84', TOOTH_85 = '85',
  // General regions
  UPPER_ARCH = 'upper_arch',
  LOWER_ARCH = 'lower_arch',
  FULL_MOUTH = 'full_mouth',
}

// ─── Procedure Types ─────────────────────────────────────────────────────────

export interface DentalProcedure {
  id: string;
  /** TUSS/CRO procedure code */
  code: string;
  name: string;
  description: string;
  category: ProcedureCategory;
  region: ToothRegion | null;
  images: string[];
  videoUrl: string | null;
  /** Estimated duration in minutes */
  estimatedDuration: number;
  /** 1 = simple, 2 = moderate, 3 = complex, 4 = advanced, 5 = specialist */
  complexity: 1 | 2 | 3 | 4 | 5;
  contraindications: string[];
  steps: string[];
  /** Official CFO / CRO source URL */
  officialSource: string;
  /** Default price in BRL (centavos) */
  price: number;
  toothNumbers: ToothRegion[];
}

// ─── Patient Types ───────────────────────────────────────────────────────────

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface MedicalHistory {
  conditions: string[];
  surgeries: string[];
  familyHistory: string[];
  smoker: boolean;
  alcoholUse: boolean;
  pregnant: boolean;
  bloodPressure?: string;
  diabetes: boolean;
  heartCondition: boolean;
  notes: string;
}

export interface DentalHistoryEntry {
  date: string;
  procedureCode: string;
  procedureName: string;
  toothNumbers: ToothRegion[];
  dentist: string;
  notes: string;
}

export interface Patient {
  id: string;
  name: string;
  /** CPF - Cadastro de Pessoa Física (Brazilian tax ID) */
  cpf: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  address: Address;
  medicalHistory: MedicalHistory;
  allergies: string[];
  currentMedications: string[];
  dentalHistory: DentalHistoryEntry[];
}

// ─── Treatment Plan Types ────────────────────────────────────────────────────

export type TreatmentProcedureStatus =
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface TreatmentProcedure {
  procedureId: string;
  toothNumbers: ToothRegion[];
  notes: string;
  beforeImageUrl: string | null;
  afterProjectionUrl: string | null;
  /** Price in BRL (centavos) */
  price: number;
  status: TreatmentProcedureStatus;
}

export type TreatmentPlanStatus =
  | 'draft'
  | 'proposed'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type PresentationMode =
  | 'clinical'
  | 'patient_friendly'
  | 'detailed'
  | 'visual';

export interface TreatmentPlan {
  id: string;
  patientId: string;
  dentistNotes: string;
  procedures: TreatmentProcedure[];
  status: TreatmentPlanStatus;
  /** Total price in BRL (centavos) */
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  presentationMode: PresentationMode;
}

// ─── Appointment Types ───────────────────────────────────────────────────────

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'checked_in'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export interface Appointment {
  id: string;
  patientId: string;
  procedureIds: string[];
  dateTime: string;
  /** Duration in minutes */
  duration: number;
  status: AppointmentStatus;
  googleCalendarEventId: string | null;
  notes: string;
}

// ─── Exam Types ──────────────────────────────────────────────────────────────

export type ExamUrgency = 'routine' | 'urgent' | 'emergency';

export type ExamStatus =
  | 'requested'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface ExamRequest {
  id: string;
  patientId: string;
  examType: ExamType;
  region: ToothRegion;
  justification: string;
  urgency: ExamUrgency;
  status: ExamStatus;
  resultUrl: string | null;
  requestedAt: string;
}

// ─── Financial Types ─────────────────────────────────────────────────────────

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface InvoiceItem {
  procedureId: string;
  description: string;
  quantity: number;
  /** Unit price in BRL (centavos) */
  unitPrice: number;
  /** Total in BRL (centavos) */
  total: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  treatmentPlanId: string;
  items: InvoiceItem[];
  /** Subtotal in BRL (centavos) */
  subtotal: number;
  /** Discount in BRL (centavos) */
  discount: number;
  /** Total in BRL (centavos) */
  total: number;
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
}

export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'procedure_payment'
  | 'insurance_reimbursement'
  | 'product_sale'
  | 'salary'
  | 'rent'
  | 'utilities'
  | 'supplies'
  | 'equipment'
  | 'marketing'
  | 'taxes'
  | 'maintenance'
  | 'other';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  /** Amount in BRL (centavos) */
  amount: number;
  description: string;
  date: string;
  invoiceId?: string;
}

// ─── Marketing Types ─────────────────────────────────────────────────────────

export type CampaignType =
  | 'social_media'
  | 'email'
  | 'sms'
  | 'whatsapp'
  | 'google_ads'
  | 'referral'
  | 'event'
  | 'content';

export type CampaignChannel =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'google'
  | 'whatsapp'
  | 'email'
  | 'website'
  | 'in_clinic';

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  roi: number;
  engagement: number;
}

export interface MarketingCampaign {
  id: string;
  name: string;
  type: CampaignType;
  channel: CampaignChannel;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  /** Budget in BRL (centavos) */
  budget: number;
  metrics: CampaignMetrics;
}

// ─── Content Calendar Types ──────────────────────────────────────────────────

export type ContentStatus = 'idea' | 'draft' | 'review' | 'approved' | 'published';

export interface ContentCalendarItem {
  id: string;
  title: string;
  description: string;
  channel: CampaignChannel;
  scheduledDate: string;
  status: ContentStatus;
  content: string;
  mediaUrls: string[];
  campaignId: string | null;
}

export interface SocialMediaPost {
  id: string;
  channel: CampaignChannel;
  content: string;
  mediaUrls: string[];
  scheduledAt: string;
  publishedAt: string | null;
  status: ContentStatus;
  metrics: Partial<CampaignMetrics>;
  campaignId: string | null;
}

// ─── Voice Command Types ─────────────────────────────────────────────────────

export type VoiceIntent =
  | 'schedule_appointment'
  | 'search_patient'
  | 'create_treatment_plan'
  | 'request_exam'
  | 'check_schedule'
  | 'record_note'
  | 'lookup_procedure'
  | 'financial_query'
  | 'unknown';

export interface VoiceCommandEntity {
  type: string;
  value: string;
  confidence: number;
}

export interface VoiceCommand {
  id: string;
  transcript: string;
  intent: VoiceIntent;
  entities: VoiceCommandEntity[];
  timestamp: string;
  processed: boolean;
}

// ─── Budget & Cash Flow Types ────────────────────────────────────────────────

export interface MonthlyBudget {
  month: string;
  /** Planned income in BRL (centavos) */
  plannedIncome: number;
  /** Planned expenses in BRL (centavos) */
  plannedExpenses: number;
  /** Actual income in BRL (centavos) */
  actualIncome: number;
  /** Actual expenses in BRL (centavos) */
  actualExpenses: number;
}

export interface CashFlowEntry {
  date: string;
  /** Balance in BRL (centavos) */
  balance: number;
  /** Inflows in BRL (centavos) */
  inflows: number;
  /** Outflows in BRL (centavos) */
  outflows: number;
}

// ─── Report Types ────────────────────────────────────────────────────────────

export interface MonthlyReport {
  month: string;
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  procedureCount: number;
  newPatients: number;
  topProcedures: { procedureId: string; count: number; revenue: number }[];
}

export interface AnnualReport {
  year: number;
  months: MonthlyReport[];
  totalRevenue: number;
  totalExpenses: number;
  profit: number;
  totalProcedures: number;
  totalNewPatients: number;
}
