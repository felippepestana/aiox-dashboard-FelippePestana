// =============================================================================
// Legal Strategy Store - Advocacia Privada Brasileira
// Zustand store with Supabase API sync for SELEM, Canvas, Scaling Up, KPIs, Leadership
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/lib/api';

import type {
  SelemAssessment,
  LegalCanvas,
  ScalingUpPlan,
  KPI,
  SelemPillar,
} from '@/types/legal';

// ─── Leadership Pipeline Types ──────────────────────────────────────────────

export type AttorneyLevel = 'junior_associate' | 'senior_associate' | 'partner' | 'managing_partner';

export interface LeadershipEntry {
  id: string;
  name: string;
  level: AttorneyLevel;
  yearsExperience: number;
  skills: string[];
  developmentGoals: string[];
  targetHours: number;
  billedHours: number;
  revenueGenerated: number;
  createdAt: string;
  updatedAt: string;
}

// ─── State Interface ────────────────────────────────────────────────────────

interface LegalStrategyState {
  selemAssessments: SelemAssessment[];
  legalCanvas: LegalCanvas | null;
  scalingUpPlan: ScalingUpPlan | null;
  kpis: KPI[];
  leadershipPipeline: LeadershipEntry[];
  syncing: boolean;

  hydrateFromApi: () => Promise<void>;

  addAssessment: (assessment: Omit<SelemAssessment, 'id'>) => string;
  updateAssessment: (id: string, updates: Partial<Omit<SelemAssessment, 'id'>>) => void;
  removeAssessment: (id: string) => void;

  updateCanvas: (canvas: LegalCanvas) => void;
  clearCanvas: () => void;

  updateScalingPlan: (plan: ScalingUpPlan) => void;
  clearScalingPlan: () => void;

  addKPI: (kpi: Omit<KPI, 'id'>) => string;
  updateKPI: (id: string, updates: Partial<Omit<KPI, 'id'>>) => void;
  removeKPI: (id: string) => void;

  addLeadershipEntry: (entry: Omit<LeadershipEntry, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateLeadershipEntry: (id: string, updates: Partial<Omit<LeadershipEntry, 'id' | 'createdAt'>>) => void;
  removeLeadershipEntry: (id: string) => void;

  getAssessmentsByPillar: (pillar: SelemPillar) => SelemAssessment[];
  getLatestAssessments: () => SelemAssessment[];
  getSelemOverallScore: () => number;
  getKPIsByCategory: (category: KPI['category']) => KPI[];
  getKPIsOnTarget: () => KPI[];
  getKPIsBelowTarget: () => KPI[];
  getLeadershipByLevel: (level: AttorneyLevel) => LeadershipEntry[];
}

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function fire(fn: () => Promise<unknown>) {
  fn().catch(() => {});
}

export const useLegalStrategyStore = create<LegalStrategyState>()(
  persist(
    (set, get) => ({
      selemAssessments: [],
      legalCanvas: null,
      scalingUpPlan: null,
      kpis: [],
      leadershipPipeline: [],
      syncing: false,

      hydrateFromApi: async () => {
        set({ syncing: true });
        try {
          const [assessments, kpis, entries, canvas] = await Promise.all([
            api.fetchSelemAssessments(),
            api.fetchKpis(),
            api.fetchLeadershipEntries(),
            api.fetchCanvas(),
          ]);
          set({
            selemAssessments: assessments as SelemAssessment[],
            kpis: kpis as KPI[],
            leadershipPipeline: entries as LeadershipEntry[],
            legalCanvas: canvas as LegalCanvas | null,
            syncing: false,
          });
        } catch {
          set({ syncing: false });
        }
      },

      // ── SELEM ─────────────────────────────────────────────────────────────

      addAssessment: (assessment) => {
        const id = generateId('selem');
        set((state) => ({
          selemAssessments: [...state.selemAssessments, { ...assessment, id }],
        }));
        fire(async () => {
          const saved = await api.createSelemAssessment(assessment as unknown as Record<string, unknown>);
          set((state) => ({
            selemAssessments: state.selemAssessments.map((a) =>
              a.id === id ? { ...a, ...(saved as Partial<SelemAssessment>), id: saved.id as string || id } : a
            ),
          }));
        });
        return id;
      },

      updateAssessment: (id, updates) => {
        set((state) => ({
          selemAssessments: state.selemAssessments.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
        fire(() => api.updateSelemAssessment(id, updates as unknown as Record<string, unknown>));
      },

      removeAssessment: (id) => {
        set((state) => ({
          selemAssessments: state.selemAssessments.filter((a) => a.id !== id),
        }));
        fire(() => api.deleteSelemAssessment(id));
      },

      // ── Canvas ────────────────────────────────────────────────────────────

      updateCanvas: (canvas) => {
        set({ legalCanvas: canvas });
        fire(() => api.saveCanvas(canvas as unknown as Record<string, unknown>));
      },

      clearCanvas: () => {
        set({ legalCanvas: null });
      },

      // ── Scaling Up (stays local — single-document, no table needed) ───────

      updateScalingPlan: (plan) => {
        set({ scalingUpPlan: plan });
      },

      clearScalingPlan: () => {
        set({ scalingUpPlan: null });
      },

      // ── KPIs ──────────────────────────────────────────────────────────────

      addKPI: (kpi) => {
        const id = generateId('kpi');
        set((state) => ({ kpis: [...state.kpis, { ...kpi, id }] }));
        fire(async () => {
          const saved = await api.createKpi(kpi as unknown as Record<string, unknown>);
          set((state) => ({
            kpis: state.kpis.map((k) =>
              k.id === id ? { ...k, ...(saved as Partial<KPI>), id: saved.id as string || id } : k
            ),
          }));
        });
        return id;
      },

      updateKPI: (id, updates) => {
        set((state) => ({
          kpis: state.kpis.map((k) => (k.id === id ? { ...k, ...updates } : k)),
        }));
        fire(() => api.updateKpi(id, updates as unknown as Record<string, unknown>));
      },

      removeKPI: (id) => {
        set((state) => ({ kpis: state.kpis.filter((k) => k.id !== id) }));
        fire(() => api.deleteKpi(id));
      },

      // ── Leadership ────────────────────────────────────────────────────────

      addLeadershipEntry: (entry) => {
        const id = generateId('ldr');
        const now = nowISO();
        set((state) => ({
          leadershipPipeline: [...state.leadershipPipeline, { ...entry, id, createdAt: now, updatedAt: now }],
        }));
        fire(async () => {
          const saved = await api.createLeadershipEntry(entry as unknown as Record<string, unknown>);
          set((state) => ({
            leadershipPipeline: state.leadershipPipeline.map((e) =>
              e.id === id ? { ...e, ...(saved as Partial<LeadershipEntry>), id: saved.id as string || id } : e
            ),
          }));
        });
        return id;
      },

      updateLeadershipEntry: (id, updates) => {
        set((state) => ({
          leadershipPipeline: state.leadershipPipeline.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: nowISO() } : e
          ),
        }));
        fire(() => api.updateLeadershipEntry(id, updates as unknown as Record<string, unknown>));
      },

      removeLeadershipEntry: (id) => {
        set((state) => ({
          leadershipPipeline: state.leadershipPipeline.filter((e) => e.id !== id),
        }));
        fire(() => api.deleteLeadershipEntry(id));
      },

      // ── Selectors ─────────────────────────────────────────────────────────

      getAssessmentsByPillar: (pillar) =>
        get().selemAssessments.filter((a) => a.pillar === pillar),

      getLatestAssessments: () => {
        const { selemAssessments } = get();
        const pillars: SelemPillar[] = ['synergy', 'strategy', 'leadership', 'education', 'mastery'];
        const latest: SelemAssessment[] = [];
        for (const pillar of pillars) {
          const sorted = selemAssessments
            .filter((a) => a.pillar === pillar)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (sorted.length > 0) latest.push(sorted[0]);
        }
        return latest;
      },

      getSelemOverallScore: () => {
        const latest = get().getLatestAssessments();
        if (latest.length === 0) return 0;
        return latest.reduce((sum, a) => sum + a.score, 0) / latest.length;
      },

      getKPIsByCategory: (category) => get().kpis.filter((k) => k.category === category),
      getKPIsOnTarget: () => get().kpis.filter((k) => k.target > 0 && (k.value / k.target) >= 0.8),
      getKPIsBelowTarget: () => get().kpis.filter((k) => k.target > 0 && (k.value / k.target) < 0.6),
      getLeadershipByLevel: (level) => get().leadershipPipeline.filter((e) => e.level === level),
    }),
    {
      name: 'aios-legal-strategy-store',
      partialize: (state) => ({
        selemAssessments: state.selemAssessments,
        legalCanvas: state.legalCanvas,
        scalingUpPlan: state.scalingUpPlan,
        kpis: state.kpis,
        leadershipPipeline: state.leadershipPipeline,
      }),
    }
  )
);
