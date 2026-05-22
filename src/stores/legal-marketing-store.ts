// =============================================================================
// Legal Marketing Store - Advocacia Privada Brasileira
// Zustand store with Supabase API sync for campaigns, leads, content, automations
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as api from '@/lib/api';

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
  syncing: boolean;

  hydrateFromApi: () => Promise<void>;

  addCampaign: (campaign: Omit<LegalCampaign, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateCampaign: (id: string, updates: Partial<Omit<LegalCampaign, 'id' | 'createdAt'>>) => void;
  removeCampaign: (id: string) => void;

  addLead: (lead: Omit<LegalLead, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateLead: (id: string, updates: Partial<Omit<LegalLead, 'id' | 'createdAt'>>) => void;
  removeLead: (id: string) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;

  addContentItem: (item: Omit<LegalContentItem, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateContentItem: (id: string, updates: Partial<Omit<LegalContentItem, 'id' | 'createdAt'>>) => void;
  removeContentItem: (id: string) => void;

  addAutomation: (automation: Omit<MarketingAutomation, 'id' | 'createdAt'>) => string;
  removeAutomation: (id: string) => void;
  toggleAutomation: (id: string) => void;

  getLeadsByStatus: (status: LeadStatus) => LegalLead[];
  getCampaignsByArea: (area: LegalArea) => LegalCampaign[];
  getActiveLeads: () => LegalLead[];
  getConvertedLeads: () => LegalLead[];
  getLeadConversionRate: () => number;
  getCampaignROI: () => number;
  getContentByChannel: (channel: LegalCampaignChannel) => LegalContentItem[];
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

export const useLegalMarketingStore = create<LegalMarketingState>()(
  persist(
    (set, get) => ({
      campaigns: [],
      leads: [],
      contentItems: [],
      automations: [],
      syncing: false,

      hydrateFromApi: async () => {
        set({ syncing: true });
        try {
          const [leads, campaigns, contentItems] = await Promise.all([
            api.fetchLeads(),
            api.fetchCampaigns(),
            api.fetchContentItems(),
          ]);
          set({
            leads: leads as LegalLead[],
            campaigns: (campaigns as LegalCampaign[]).map((c) => ({
              ...c,
              metrics: c.metrics || { impressions: 0, clicks: 0, leads: 0, conversions: 0, roi: 0, engagement: 0 },
            })),
            contentItems: contentItems as LegalContentItem[],
            syncing: false,
          });
        } catch {
          set({ syncing: false });
        }
      },

      addCampaign: (campaign) => {
        const id = generateId('camp');
        const now = nowISO();
        set((state) => ({
          campaigns: [...state.campaigns, { ...campaign, id, createdAt: now, updatedAt: now }],
        }));
        fire(async () => {
          const saved = await api.createCampaign(campaign as unknown as Record<string, unknown>);
          set((state) => ({
            campaigns: state.campaigns.map((c) =>
              c.id === id ? { ...c, ...(saved as Partial<LegalCampaign>), id: saved.id as string || id } : c
            ),
          }));
        });
        return id;
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: nowISO() } : c
          ),
        }));
        fire(() => api.updateCampaign(id, updates as unknown as Record<string, unknown>));
      },

      removeCampaign: (id) => {
        set((state) => ({ campaigns: state.campaigns.filter((c) => c.id !== id) }));
        fire(() => api.deleteCampaign(id));
      },

      addLead: (lead) => {
        const id = generateId('lead');
        const now = nowISO();
        set((state) => ({
          leads: [...state.leads, { ...lead, id, createdAt: now, updatedAt: now }],
        }));
        fire(async () => {
          const saved = await api.createLead(lead as unknown as Record<string, unknown>);
          set((state) => ({
            leads: state.leads.map((l) =>
              l.id === id ? { ...l, ...(saved as Partial<LegalLead>), id: saved.id as string || id } : l
            ),
          }));
        });
        return id;
      },

      updateLead: (id, updates) => {
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === id ? { ...l, ...updates, updatedAt: nowISO() } : l
          ),
        }));
        fire(() => api.updateLead(id, updates as unknown as Record<string, unknown>));
      },

      removeLead: (id) => {
        set((state) => ({ leads: state.leads.filter((l) => l.id !== id) }));
        fire(() => api.deleteLead(id));
      },

      updateLeadStatus: (id, status) => {
        set((state) => ({
          leads: state.leads.map((l) =>
            l.id === id ? { ...l, status, updatedAt: nowISO() } : l
          ),
        }));
        fire(() => api.updateLead(id, { status }));
      },

      addContentItem: (item) => {
        const id = generateId('cnt');
        const now = nowISO();
        set((state) => ({
          contentItems: [...state.contentItems, { ...item, id, createdAt: now, updatedAt: now }],
        }));
        fire(async () => {
          const saved = await api.createContentItem(item as unknown as Record<string, unknown>);
          set((state) => ({
            contentItems: state.contentItems.map((c) =>
              c.id === id ? { ...c, ...(saved as Partial<LegalContentItem>), id: saved.id as string || id } : c
            ),
          }));
        });
        return id;
      },

      updateContentItem: (id, updates) => {
        set((state) => ({
          contentItems: state.contentItems.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: nowISO() } : c
          ),
        }));
        fire(() => api.updateContentItem(id, updates as unknown as Record<string, unknown>));
      },

      removeContentItem: (id) => {
        set((state) => ({ contentItems: state.contentItems.filter((c) => c.id !== id) }));
        fire(() => api.deleteContentItem(id));
      },

      // Automations stay local only (no Supabase table)
      addAutomation: (automation) => {
        const id = generateId('auto');
        set((state) => ({
          automations: [...state.automations, { ...automation, id, createdAt: nowISO() }],
        }));
        return id;
      },

      removeAutomation: (id) => {
        set((state) => ({ automations: state.automations.filter((a) => a.id !== id) }));
      },

      toggleAutomation: (id) => {
        set((state) => ({
          automations: state.automations.map((a) =>
            a.id === id ? { ...a, isActive: !a.isActive } : a
          ),
        }));
      },

      getLeadsByStatus: (status) => get().leads.filter((l) => l.status === status),
      getCampaignsByArea: (area) => get().campaigns.filter((c) => c.area === area),
      getActiveLeads: () => get().leads.filter((l) => l.status !== 'retained' && l.status !== 'lost'),
      getConvertedLeads: () => get().leads.filter((l) => l.status === 'retained'),
      getLeadConversionRate: () => {
        const { leads } = get();
        if (leads.length === 0) return 0;
        return (leads.filter((l) => l.status === 'retained').length / leads.length) * 100;
      },
      getCampaignROI: () => {
        const active = get().campaigns.filter((c) => c.status === 'active' || c.status === 'completed');
        if (active.length === 0) return 0;
        return active.reduce((sum, c) => sum + c.metrics.roi, 0) / active.length;
      },
      getContentByChannel: (channel) => get().contentItems.filter((c) => c.channel === channel),
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
