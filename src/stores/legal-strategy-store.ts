// =============================================================================
// Legal Strategy Store - Advocacia Privada Brasileira
// Zustand store for SELEM assessments, Legal Canvas, Scaling Up, KPIs, Leadership
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  // ── SELEM Actions ───────────────────────────────────────────────────────
  addAssessment: (assessment: Omit<SelemAssessment, 'id'>) => string;
  updateAssessment: (id: string, updates: Partial<Omit<SelemAssessment, 'id'>>) => void;
  removeAssessment: (id: string) => void;

  // ── Canvas Actions ──────────────────────────────────────────────────────
  updateCanvas: (canvas: LegalCanvas) => void;
  clearCanvas: () => void;

  // ── Scaling Up Actions ──────────────────────────────────────────────────
  updateScalingPlan: (plan: ScalingUpPlan) => void;
  clearScalingPlan: () => void;

  // ── KPI Actions ─────────────────────────────────────────────────────────
  addKPI: (kpi: Omit<KPI, 'id'>) => string;
  updateKPI: (id: string, updates: Partial<Omit<KPI, 'id'>>) => void;
  removeKPI: (id: string) => void;

  // ── Leadership Actions ──────────────────────────────────────────────────
  addLeadershipEntry: (entry: Omit<LeadershipEntry, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateLeadershipEntry: (id: string, updates: Partial<Omit<LeadershipEntry, 'id' | 'createdAt'>>) => void;
  removeLeadershipEntry: (id: string) => void;

  // ── Selectors ───────────────────────────────────────────────────────────
  getAssessmentsByPillar: (pillar: SelemPillar) => SelemAssessment[];
  getLatestAssessments: () => SelemAssessment[];
  getSelemOverallScore: () => number;
  getKPIsByCategory: (category: KPI['category']) => KPI[];
  getKPIsOnTarget: () => KPI[];
  getKPIsBelowTarget: () => KPI[];
  getLeadershipByLevel: (level: AttorneyLevel) => LeadershipEntry[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useLegalStrategyStore = create<LegalStrategyState>()(
  persist(
    (set, get) => ({
      // ── Initial State ─────────────────────────────────────────────────────
      selemAssessments: [],
      legalCanvas: null,
      scalingUpPlan: null,
      kpis: [],
      leadershipPipeline: [],

      // ── SELEM Actions ─────────────────────────────────────────────────────

      addAssessment: (assessment) => {
        const id = generateId('selem');
        set((state) => ({
          selemAssessments: [...state.selemAssessments, { ...assessment, id }],
        }));
        return id;
      },

      updateAssessment: (id, updates) => {
        set((state) => ({
          selemAssessments: state.selemAssessments.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      removeAssessment: (id) => {
        set((state) => ({
          selemAssessments: state.selemAssessments.filter((a) => a.id !== id),
        }));
      },

      // ── Canvas Actions ────────────────────────────────────────────────────

      updateCanvas: (canvas) => {
        set({ legalCanvas: canvas });
      },

      clearCanvas: () => {
        set({ legalCanvas: null });
      },

      // ── Scaling Up Actions ────────────────────────────────────────────────

      updateScalingPlan: (plan) => {
        set({ scalingUpPlan: plan });
      },

      clearScalingPlan: () => {
        set({ scalingUpPlan: null });
      },

      // ── KPI Actions ───────────────────────────────────────────────────────

      addKPI: (kpi) => {
        const id = generateId('kpi');
        set((state) => ({
          kpis: [...state.kpis, { ...kpi, id }],
        }));
        return id;
      },

      updateKPI: (id, updates) => {
        set((state) => ({
          kpis: state.kpis.map((k) =>
            k.id === id ? { ...k, ...updates } : k
          ),
        }));
      },

      removeKPI: (id) => {
        set((state) => ({
          kpis: state.kpis.filter((k) => k.id !== id),
        }));
      },

      // ── Leadership Actions ────────────────────────────────────────────────

      addLeadershipEntry: (entry) => {
        const id = generateId('ldr');
        const now = nowISO();
        set((state) => ({
          leadershipPipeline: [
            ...state.leadershipPipeline,
            { ...entry, id, createdAt: now, updatedAt: now },
          ],
        }));
        return id;
      },

      updateLeadershipEntry: (id, updates) => {
        set((state) => ({
          leadershipPipeline: state.leadershipPipeline.map((e) =>
            e.id === id ? { ...e, ...updates, updatedAt: nowISO() } : e
          ),
        }));
      },

      removeLeadershipEntry: (id) => {
        set((state) => ({
          leadershipPipeline: state.leadershipPipeline.filter((e) => e.id !== id),
        }));
      },

      // ── Selectors ─────────────────────────────────────────────────────────

      getAssessmentsByPillar: (pillar) =>
        get().selemAssessments.filter((a) => a.pillar === pillar),

      getLatestAssessments: () => {
        const { selemAssessments } = get();
        const pillars: SelemPillar[] = ['synergy', 'strategy', 'leadership', 'education', 'mastery'];
        const latest: SelemAssessment[] = [];

        for (const pillar of pillars) {
          const pillarAssessments = selemAssessments
            .filter((a) => a.pillar === pillar)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          if (pillarAssessments.length > 0) {
            latest.push(pillarAssessments[0]);
          }
        }

        return latest;
      },

      getSelemOverallScore: () => {
        const latest = get().getLatestAssessments();
        if (latest.length === 0) return 0;
        const total = latest.reduce((sum, a) => sum + a.score, 0);
        return total / latest.length;
      },

      getKPIsByCategory: (category) =>
        get().kpis.filter((k) => k.category === category),

      getKPIsOnTarget: () =>
        get().kpis.filter((k) => k.target > 0 && (k.value / k.target) >= 0.8),

      getKPIsBelowTarget: () =>
        get().kpis.filter((k) => k.target > 0 && (k.value / k.target) < 0.6),

      getLeadershipByLevel: (level) =>
        get().leadershipPipeline.filter((e) => e.level === level),
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
