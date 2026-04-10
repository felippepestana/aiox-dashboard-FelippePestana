// =============================================================================
// Legal Store - Advocacia Privada Brasileira
// Zustand store for processes, clients, deadlines, petitions, and movements
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  LegalProcess,
  LegalClient,
  Deadline,
  Petition,
  ProcessMovement,
  ProcessStatus,
  UrgencyLevel,
  LegalArea,
  DeadlineStatus,
  PetitionStatus,
} from '@/types/legal';

// ─── State Interface ────────────────────────────────────────────────────────

interface LegalState {
  processes: LegalProcess[];
  clients: LegalClient[];
  deadlines: Deadline[];
  petitions: Petition[];
  movements: ProcessMovement[];

  // ── Process Actions ──────────────────────────────────────────────────────
  addProcess: (process: Omit<LegalProcess, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateProcess: (id: string, updates: Partial<Omit<LegalProcess, 'id' | 'createdAt'>>) => void;
  removeProcess: (id: string) => void;

  // ── Client Actions ───────────────────────────────────────────────────────
  addClient: (client: Omit<LegalClient, 'id' | 'createdAt' | 'updatedAt' | 'processIds' | 'contractIds'>) => string;
  updateClient: (id: string, updates: Partial<Omit<LegalClient, 'id' | 'createdAt'>>) => void;
  removeClient: (id: string) => void;

  // ── Deadline Actions ─────────────────────────────────────────────────────
  addDeadline: (deadline: Omit<Deadline, 'id' | 'createdAt'>) => string;
  updateDeadline: (id: string, updates: Partial<Omit<Deadline, 'id' | 'createdAt'>>) => void;
  removeDeadline: (id: string) => void;
  completeDeadline: (id: string) => void;

  // ── Petition Actions ─────────────────────────────────────────────────────
  addPetition: (petition: Omit<Petition, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updatePetition: (id: string, updates: Partial<Omit<Petition, 'id' | 'createdAt'>>) => void;
  removePetition: (id: string) => void;
  updatePetitionStatus: (id: string, status: PetitionStatus) => void;

  // ── Movement Actions ─────────────────────────────────────────────────────
  addMovement: (movement: Omit<ProcessMovement, 'id'>) => string;
  markMovementRead: (id: string) => void;

  // ── Selectors ────────────────────────────────────────────────────────────
  getProcessById: (id: string) => LegalProcess | undefined;
  getProcessByCnj: (cnj: string) => LegalProcess | undefined;
  getProcessesByClient: (clientId: string) => LegalProcess[];
  getProcessesByStatus: (status: ProcessStatus) => LegalProcess[];
  getProcessesByArea: (area: LegalArea) => LegalProcess[];
  getClientById: (id: string) => LegalClient | undefined;
  getUpcomingDeadlines: (days?: number) => Deadline[];
  getOverdueDeadlines: () => Deadline[];
  getDeadlinesByProcess: (processId: string) => Deadline[];
  getPetitionsByProcess: (processId: string) => Petition[];
  getMovementsByProcess: (processId: string) => ProcessMovement[];
  getUnreadMovements: () => ProcessMovement[];
  getActiveProcessCount: () => number;
  getPendingDeadlineCount: () => number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useLegalStore = create<LegalState>()(
  persist(
    (set, get) => ({
      // ── Initial State ─────────────────────────────────────────────────────
      processes: [],
      clients: [],
      deadlines: [],
      petitions: [],
      movements: [],

      // ── Process Actions ───────────────────────────────────────────────────

      addProcess: (process) => {
        const id = generateId('proc');
        const now = nowISO();
        set((state) => ({
          processes: [...state.processes, { ...process, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateProcess: (id, updates) => {
        set((state) => ({
          processes: state.processes.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: nowISO() } : p
          ),
        }));
      },

      removeProcess: (id) => {
        set((state) => ({
          processes: state.processes.filter((p) => p.id !== id),
          deadlines: state.deadlines.filter((d) => d.processId !== id),
          petitions: state.petitions.filter((p) => p.processId !== id),
          movements: state.movements.filter((m) => m.processId !== id),
        }));
      },

      // ── Client Actions ────────────────────────────────────────────────────

      addClient: (client) => {
        const id = generateId('cli');
        const now = nowISO();
        set((state) => ({
          clients: [...state.clients, { ...client, id, processIds: [], contractIds: [], createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateClient: (id, updates) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: nowISO() } : c
          ),
        }));
      },

      removeClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        }));
      },

      // ── Deadline Actions ──────────────────────────────────────────────────

      addDeadline: (deadline) => {
        const id = generateId('dl');
        set((state) => ({
          deadlines: [...state.deadlines, { ...deadline, id, createdAt: nowISO() }],
        }));
        return id;
      },

      updateDeadline: (id, updates) => {
        set((state) => ({
          deadlines: state.deadlines.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },

      removeDeadline: (id) => {
        set((state) => ({
          deadlines: state.deadlines.filter((d) => d.id !== id),
        }));
      },

      completeDeadline: (id) => {
        set((state) => ({
          deadlines: state.deadlines.map((d) =>
            d.id === id ? { ...d, status: 'completed' as DeadlineStatus } : d
          ),
        }));
      },

      // ── Petition Actions ──────────────────────────────────────────────────

      addPetition: (petition) => {
        const id = generateId('pet');
        const now = nowISO();
        set((state) => ({
          petitions: [...state.petitions, { ...petition, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updatePetition: (id, updates) => {
        set((state) => ({
          petitions: state.petitions.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: nowISO() } : p
          ),
        }));
      },

      removePetition: (id) => {
        set((state) => ({
          petitions: state.petitions.filter((p) => p.id !== id),
        }));
      },

      updatePetitionStatus: (id, status) => {
        set((state) => ({
          petitions: state.petitions.map((p) =>
            p.id === id ? { ...p, status, updatedAt: nowISO() } : p
          ),
        }));
      },

      // ── Movement Actions ──────────────────────────────────────────────────

      addMovement: (movement) => {
        const id = generateId('mov');
        set((state) => ({
          movements: [...state.movements, { ...movement, id }],
        }));
        return id;
      },

      markMovementRead: (id) => {
        set((state) => ({
          movements: state.movements.map((m) =>
            m.id === id ? { ...m, isRead: true } : m
          ),
        }));
      },

      // ── Selectors ─────────────────────────────────────────────────────────

      getProcessById: (id) => get().processes.find((p) => p.id === id),

      getProcessByCnj: (cnj) => get().processes.find((p) => p.cnj === cnj),

      getProcessesByClient: (clientId) =>
        get().processes.filter((p) => p.clientId === clientId),

      getProcessesByStatus: (status) =>
        get().processes.filter((p) => p.status === status),

      getProcessesByArea: (area) =>
        get().processes.filter((p) => p.area === area),

      getClientById: (id) => get().clients.find((c) => c.id === id),

      getUpcomingDeadlines: (days = 7) => {
        const now = new Date();
        const limit = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
        return get()
          .deadlines.filter(
            (d) =>
              d.status === 'pending' &&
              new Date(d.dueDate) >= now &&
              new Date(d.dueDate) <= limit
          )
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      },

      getOverdueDeadlines: () => {
        const now = new Date();
        return get()
          .deadlines.filter(
            (d) => d.status === 'pending' && new Date(d.dueDate) < now
          )
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      },

      getDeadlinesByProcess: (processId) =>
        get().deadlines.filter((d) => d.processId === processId),

      getPetitionsByProcess: (processId) =>
        get().petitions.filter((p) => p.processId === processId),

      getMovementsByProcess: (processId) =>
        get()
          .movements.filter((m) => m.processId === processId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),

      getUnreadMovements: () =>
        get().movements.filter((m) => !m.isRead),

      getActiveProcessCount: () =>
        get().processes.filter((p) => p.status === 'active').length,

      getPendingDeadlineCount: () =>
        get().deadlines.filter((d) => d.status === 'pending').length,
    }),
    {
      name: 'aios-legal-store',
      partialize: (state) => ({
        processes: state.processes,
        clients: state.clients,
        deadlines: state.deadlines,
        petitions: state.petitions,
        movements: state.movements,
      }),
    }
  )
);
