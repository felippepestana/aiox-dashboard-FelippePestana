// =============================================================================
// Legal Marketing Store - Advocacia Privada Brasileira
// Zustand store for campaigns, leads, content items, and automations
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  LegalCampaign,
  LegalLead,
  LegalContentItem,
  LeadStatus,
  LegalArea,
  LegalCampaignChannel,
} from '@/types/legal';

// ─── Automation Type ───────────────────────────────────────────────────────

interface MarketingAutomation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  isActive: boolean;
  createdAt: string;
}

// ─── State Interface ────────────────────────────────────────────────────────

interface LegalMarketingState {
  campaigns: LegalCampaign[];
  leads: LegalLead[];
  contentItems: LegalContentItem[];
  automations: MarketingAutomation[];

  // ── Campaign Actions ────────────────────────────────────────────────────
  addCampaign: (campaign: Omit<LegalCampaign, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCampaign: (id: string, updates: Partial<Omit<LegalCampaign, 'id' | 'createdAt'>>) => void;
  removeCampaign: (id: string) => void;

  // ── Lead Actions ────────────────────────────────────────────────────────
  addLead: (lead: Omit<LegalLead, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateLead: (id: string, updates: Partial<Omit<LegalLead, 'id' | 'createdAt'>>) => void;
  removeLead: (id: string) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;

  // ── Content Actions ─────────────────────────────────────────────────────
  addContentItem: (item: Omit<LegalContentItem, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateContentItem: (id: string, updates: Partial<Omit<LegalContentItem, 'id' | 'createdAt'>>) => void;
  removeContentItem: (id: string) => void;

  // ── Automation Actions ──────────────────────────────────────────────────
  addAutomation: (automation: Omit<MarketingAutomation, 'id' | 'createdAt'>) => string;
  removeAutomation: (id: string) => void;
  toggleAutomation: (id: string) => void;

  // ── Selectors ───────────────────────────────────────────────────────────
  getLeadsByStatus: (status: LeadStatus) => LegalLead[];
  getCampaignsByArea: (area: LegalArea) => LegalCampaign[];
  getActiveLeads: () => LegalLead[];
  getConvertedLeads: () => LegalLead[];
  getLeadConversionRate: () => number;
  getCampaignROI: () => number;
  getContentByChannel: (channel: LegalCampaignChannel) => LegalContentItem[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useLegalMarketingStore = create<LegalMarketingState>()(
  persist(
    (set, get) => ({
      // ── Initial State ─────────────────────────────────────────────────────
      campaigns: [],
      leads: [],
      contentItems: [],
      automations: [],

      // ── Campaign Actions ──────────────────────────────────────────────────

      addCampaign: (campaign) => {
        const id = generateId('camp');
        const now = nowISO();
        set((state) => ({
          campaigns: [...state.campaigns, { ...campaign, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: nowISO() } : c
          ),
        }));
      },

      removeCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        }));
      },

      // ── Lead Actions ──────────────────────────────────────────────────────

      addLead: (lead) => {
        const id = generateId('lead');
        const now = nowISO();
        set((state) => ({
          leads: [...state.leads, { ...lead, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateLead: (id, updates) => {
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === id ? { ...l, ...updates, updatedAt: nowISO() } : l
          ),
        }));
      },

      removeLead: (id) => {
        set((state) => ({
          leads: state.leads.filter((l) => l.id !== id),
        }));
      },

      updateLeadStatus: (id, status) => {
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === id ? { ...l, status, updatedAt: nowISO() } : l
          ),
        }));
      },

      // ── Content Actions ───────────────────────────────────────────────────

      addContentItem: (item) => {
        const id = generateId('cnt');
        const now = nowISO();
        set((state) => ({
          contentItems: [...state.contentItems, { ...item, id, createdAt: now, updatedAt: now }],
        }));
        return id;
      },

      updateContentItem: (id, updates) => {
        set((state) => ({
          contentItems: state.contentItems.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: nowISO() } : c
          ),
        }));
      },

      removeContentItem: (id) => {
        set((state) => ({
          contentItems: state.contentItems.filter((c) => c.id !== id),
        }));
      },

      // ── Automation Actions ────────────────────────────────────────────────

      addAutomation: (automation) => {
        const id = generateId('auto');
        set((state) => ({
          automations: [...state.automations, { ...automation, id, createdAt: nowISO() }],
        }));
        return id;
      },

      removeAutomation: (id) => {
        set((state) => ({
          automations: state.automations.filter((a) => a.id !== id),
        }));
      },

      toggleAutomation: (id) => {
        set((state) => ({
          automations: state.automations.map((a) =>
            a.id === id ? { ...a, isActive: !a.isActive } : a
          ),
        }));
      },

      // ── Selectors ─────────────────────────────────────────────────────────

      getLeadsByStatus: (status) =>
        get().leads.filter((l) => l.status === status),

      getCampaignsByArea: (area) =>
        get().campaigns.filter((c) => c.area === area),

      getActiveLeads: () =>
        get().leads.filter((l) => l.status !== 'retained' && l.status !== 'lost'),

      getConvertedLeads: () =>
        get().leads.filter((l) => l.status === 'retained'),

      getLeadConversionRate: () => {
        const { leads } = get();
        if (leads.length === 0) return 0;
        const converted = leads.filter((l) => l.status === 'retained').length;
        return (converted / leads.length) * 100;
      },

      getCampaignROI: () => {
        const { campaigns } = get();
        const activeCampaigns = campaigns.filter((c) => c.status === 'active' || c.status === 'completed');
        if (activeCampaigns.length === 0) return 0;
        const totalROI = activeCampaigns.reduce((sum, c) => sum + c.metrics.roi, 0);
        return totalROI / activeCampaigns.length;
      },

      getContentByChannel: (channel) =>
        get().contentItems.filter((c) => c.channel === channel),
    }),
    {
      name: 'aios-legal-marketing-store',
      partialize: (state) => ({
        campaigns: state.campaigns,
        leads: state.leads,
        contentItems: state.contentItems,
        automations: state.automations,
      }),
    }
  )
);
