// =============================================================================
// Dental Store - Sbarzi Odontologia e Saúde
// Zustand store for patients, treatment plans, appointments, and exams
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  Patient,
  TreatmentPlan,
  TreatmentProcedure,
  TreatmentPlanStatus,
  Appointment,
  AppointmentStatus,
  ExamRequest,
  ExamType,
  ExamUrgency,
  ToothRegion,
} from '@/types/dental';
import { DEFAULT_PRICE_TABLE, type PriceTable } from '@/lib/dental-pricing';

// ─── State Interface ────────────────────────────────────────────────────────

interface DentalState {
  patients: Patient[];
  treatmentPlans: TreatmentPlan[];
  appointments: Appointment[];
  examRequests: ExamRequest[];
  priceTable: PriceTable;

  // ── Patient Actions ─────────────────────────────────────────────────────
  addPatient: (patient: Omit<Patient, 'id'>) => string;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  removePatient: (id: string) => void;

  // ── Treatment Plan Actions ──────────────────────────────────────────────
  createTreatmentPlan: (
    plan: Omit<TreatmentPlan, 'id' | 'createdAt' | 'updatedAt' | 'totalPrice'>
  ) => string;
  updateTreatmentPlan: (
    id: string,
    updates: Partial<Omit<TreatmentPlan, 'id' | 'createdAt'>>
  ) => void;
  addProcedureToTreatment: (
    planId: string,
    procedure: TreatmentProcedure
  ) => void;
  removeProcedureFromTreatment: (
    planId: string,
    procedureIndex: number
  ) => void;
  updateTreatmentStatus: (id: string, status: TreatmentPlanStatus) => void;

  // ── Appointment Actions ─────────────────────────────────────────────────
  addAppointment: (
    appointment: Omit<Appointment, 'id'>
  ) => string;
  updateAppointment: (
    id: string,
    updates: Partial<Omit<Appointment, 'id'>>
  ) => void;
  cancelAppointment: (id: string) => void;

  // ── Exam Actions ────────────────────────────────────────────────────────
  requestExam: (
    exam: Omit<ExamRequest, 'id' | 'status' | 'resultUrl' | 'requestedAt'>
  ) => string;
  updateExamRequest: (
    id: string,
    updates: Partial<Omit<ExamRequest, 'id'>>
  ) => void;

  // ── Price Table Actions ─────────────────────────────────────────────────
  updatePriceTable: (updates: PriceTable) => void;
  resetPriceTable: () => void;

  // ── Computed / Selectors ────────────────────────────────────────────────
  getPatientById: (id: string) => Patient | undefined;
  getActiveTreatmentPlans: () => TreatmentPlan[];
  getTreatmentPlansByPatient: (patientId: string) => TreatmentPlan[];
  getUpcomingAppointments: () => Appointment[];
  getAppointmentsByPatient: (patientId: string) => Appointment[];
  getAppointmentsByDate: (date: string) => Appointment[];
  getPendingExams: () => ExamRequest[];
  getExamsByPatient: (patientId: string) => ExamRequest[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function calculateTotalPrice(procedures: TreatmentProcedure[]): number {
  return procedures.reduce((sum, p) => sum + p.price, 0);
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useDentalStore = create<DentalState>()(
  persist(
    (set, get) => ({
      // ── Initial State ─────────────────────────────────────────────────────
      patients: [],
      treatmentPlans: [],
      appointments: [],
      examRequests: [],
      priceTable: DEFAULT_PRICE_TABLE,

      // ── Patient Actions ───────────────────────────────────────────────────

      addPatient: (patient) => {
        const id = generateId('pat');
        set((state) => ({
          patients: [...state.patients, { ...patient, id }],
        }));
        return id;
      },

      updatePatient: (id, updates) => {
        set((state) => ({
          patients: state.patients.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      removePatient: (id) => {
        set((state) => ({
          patients: state.patients.filter((p) => p.id !== id),
        }));
      },

      // ── Treatment Plan Actions ────────────────────────────────────────────

      createTreatmentPlan: (plan) => {
        const id = generateId('tp');
        const now = nowISO();
        const totalPrice = calculateTotalPrice(plan.procedures);

        set((state) => ({
          treatmentPlans: [
            ...state.treatmentPlans,
            { ...plan, id, createdAt: now, updatedAt: now, totalPrice },
          ],
        }));
        return id;
      },

      updateTreatmentPlan: (id, updates) => {
        set((state) => ({
          treatmentPlans: state.treatmentPlans.map((tp) => {
            if (tp.id !== id) return tp;
            const updated = { ...tp, ...updates, updatedAt: nowISO() };
            if (updates.procedures) {
              updated.totalPrice = calculateTotalPrice(updates.procedures);
            }
            return updated;
          }),
        }));
      },

      addProcedureToTreatment: (planId, procedure) => {
        set((state) => ({
          treatmentPlans: state.treatmentPlans.map((tp) => {
            if (tp.id !== planId) return tp;
            const procedures = [...tp.procedures, procedure];
            return {
              ...tp,
              procedures,
              totalPrice: calculateTotalPrice(procedures),
              updatedAt: nowISO(),
            };
          }),
        }));
      },

      removeProcedureFromTreatment: (planId, procedureIndex) => {
        set((state) => ({
          treatmentPlans: state.treatmentPlans.map((tp) => {
            if (tp.id !== planId) return tp;
            const procedures = tp.procedures.filter(
              (_, i) => i !== procedureIndex
            );
            return {
              ...tp,
              procedures,
              totalPrice: calculateTotalPrice(procedures),
              updatedAt: nowISO(),
            };
          }),
        }));
      },

      updateTreatmentStatus: (id, status) => {
        set((state) => ({
          treatmentPlans: state.treatmentPlans.map((tp) =>
            tp.id === id ? { ...tp, status, updatedAt: nowISO() } : tp
          ),
        }));
      },

      // ── Appointment Actions ───────────────────────────────────────────────

      addAppointment: (appointment) => {
        const id = generateId('apt');
        set((state) => ({
          appointments: [...state.appointments, { ...appointment, id }],
        }));
        return id;
      },

      updateAppointment: (id, updates) => {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      cancelAppointment: (id) => {
        set((state) => ({
          appointments: state.appointments.map((a) =>
            a.id === id ? { ...a, status: 'cancelled' as AppointmentStatus } : a
          ),
        }));
      },

      // ── Exam Actions ──────────────────────────────────────────────────────

      requestExam: (exam) => {
        const id = generateId('exam');
        set((state) => ({
          examRequests: [
            ...state.examRequests,
            {
              ...exam,
              id,
              status: 'requested',
              resultUrl: null,
              requestedAt: nowISO(),
            },
          ],
        }));
        return id;
      },

      updateExamRequest: (id, updates) => {
        set((state) => ({
          examRequests: state.examRequests.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        }));
      },

      // ── Price Table Actions ───────────────────────────────────────────────

      updatePriceTable: (updates) => {
        set((state) => ({
          priceTable: { ...state.priceTable, ...updates },
        }));
      },

      resetPriceTable: () => {
        set({ priceTable: DEFAULT_PRICE_TABLE });
      },

      // ── Computed / Selectors ──────────────────────────────────────────────

      getPatientById: (id) => {
        return get().patients.find((p) => p.id === id);
      },

      getActiveTreatmentPlans: () => {
        return get().treatmentPlans.filter(
          (tp) =>
            tp.status === 'proposed' ||
            tp.status === 'accepted' ||
            tp.status === 'in_progress'
        );
      },

      getTreatmentPlansByPatient: (patientId) => {
        return get().treatmentPlans.filter(
          (tp) => tp.patientId === patientId
        );
      },

      getUpcomingAppointments: () => {
        const now = new Date().toISOString();
        return get()
          .appointments.filter(
            (a) =>
              a.dateTime >= now &&
              a.status !== 'cancelled' &&
              a.status !== 'completed' &&
              a.status !== 'no_show'
          )
          .sort((a, b) => a.dateTime.localeCompare(b.dateTime));
      },

      getAppointmentsByPatient: (patientId) => {
        return get().appointments.filter((a) => a.patientId === patientId);
      },

      getAppointmentsByDate: (date) => {
        return get().appointments.filter((a) => a.dateTime.startsWith(date));
      },

      getPendingExams: () => {
        return get().examRequests.filter(
          (e) => e.status === 'requested' || e.status === 'scheduled'
        );
      },

      getExamsByPatient: (patientId) => {
        return get().examRequests.filter((e) => e.patientId === patientId);
      },
    }),
    {
      name: 'sbarzi-dental-store',
      partialize: (state) => ({
        patients: state.patients,
        treatmentPlans: state.treatmentPlans,
        appointments: state.appointments,
        examRequests: state.examRequests,
        priceTable: state.priceTable,
      }),
    }
  )
);
