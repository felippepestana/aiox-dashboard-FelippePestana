// =============================================================================
// Marketing Store - Sbarzi Odontologia e Saúde
// Zustand store for campaigns, content calendar, and social media posts
// =============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type {
  MarketingCampaign,
  CampaignMetrics,
  CampaignType,
  CampaignChannel,
  CampaignStatus,
  ContentCalendarItem,
  ContentStatus,
  SocialMediaPost,
} from '@/types/dental';

// ─── State Interface ────────────────────────────────────────────────────────

interface MarketingState {
  campaigns: MarketingCampaign[];
  contentCalendar: ContentCalendarItem[];
  socialMediaPosts: SocialMediaPost[];

  // ── Campaign Actions ────────────────────────────────────────────────────
  createCampaign: (
    campaign: Omit<MarketingCampaign, 'id' | 'metrics'>
  ) => string;
  updateCampaign: (
    id: string,
    updates: Partial<Omit<MarketingCampaign, 'id'>>
  ) => void;
  removeCampaign: (id: string) => void;
  updateCampaignMetrics: (id: string, metrics: Partial<CampaignMetrics>) => void;
  updateCampaignStatus: (id: string, status: CampaignStatus) => void;

  // ── Content Calendar Actions ────────────────────────────────────────────
  addContentItem: (
    item: Omit<ContentCalendarItem, 'id'>
  ) => string;
  updateContentItem: (
    id: string,
    updates: Partial<Omit<ContentCalendarItem, 'id'>>
  ) => void;
  removeContentItem: (id: string) => void;
  updateContentStatus: (id: string, status: ContentStatus) => void;

  // ── Social Media Post Actions ───────────────────────────────────────────
  schedulePost: (
    post: Omit<SocialMediaPost, 'id' | 'publishedAt' | 'metrics'>
  ) => string;
  updatePost: (
    id: string,
    updates: Partial<Omit<SocialMediaPost, 'id'>>
  ) => void;
  publishPost: (id: string) => void;
  removePost: (id: string) => void;

  // ── Analytics / Computed ────────────────────────────────────────────────
  getMetrics: () => AggregatedMetrics;
  getCampaignById: (id: string) => MarketingCampaign | undefined;
  getActiveCampaigns: () => MarketingCampaign[];
  getCampaignsByChannel: (channel: CampaignChannel) => MarketingCampaign[];
  getContentByMonth: (month: string) => ContentCalendarItem[];
  getScheduledPosts: () => SocialMediaPost[];
  getTotalBudget: () => number;
  getTotalSpentBudget: () => number;
  getAverageROI: () => number;
  getEngagementByChannel: () => { channel: CampaignChannel; engagement: number }[];
  getConversionsByChannel: () => { channel: CampaignChannel; conversions: number }[];
}

// ─── Aggregated Metrics Type ────────────────────────────────────────────────

export interface AggregatedMetrics {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageROI: number;
  averageEngagement: number;
  totalBudget: number;
  activeCampaignCount: number;
  scheduledPostCount: number;
  contentInPipelineCount: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

const EMPTY_METRICS: CampaignMetrics = {
  impressions: 0,
  clicks: 0,
  conversions: 0,
  roi: 0,
  engagement: 0,
};

// ─── Store ──────────────────────────────────────────────────────────────────

export const useMarketingStore = create<MarketingState>()(
  persist(
    (set, get) => ({
      // ── Initial State ─────────────────────────────────────────────────────
      campaigns: [],
      contentCalendar: [],
      socialMediaPosts: [],

      // ── Campaign Actions ──────────────────────────────────────────────────

      createCampaign: (campaign) => {
        const id = generateId('camp');
        set((state) => ({
          campaigns: [
            ...state.campaigns,
            { ...campaign, id, metrics: { ...EMPTY_METRICS } },
          ],
        }));
        return id;
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      removeCampaign: (id) => {
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c.id !== id),
        }));
      },

      updateCampaignMetrics: (id, metrics) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id
              ? { ...c, metrics: { ...c.metrics, ...metrics } }
              : c
          ),
        }));
      },

      updateCampaignStatus: (id, status) => {
        set((state) => ({
          campaigns: state.campaigns.map((c) =>
            c.id === id ? { ...c, status } : c
          ),
        }));
      },

      // ── Content Calendar Actions ──────────────────────────────────────────

      addContentItem: (item) => {
        const id = generateId('content');
        set((state) => ({
          contentCalendar: [...state.contentCalendar, { ...item, id }],
        }));
        return id;
      },

      updateContentItem: (id, updates) => {
        set((state) => ({
          contentCalendar: state.contentCalendar.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        }));
      },

      removeContentItem: (id) => {
        set((state) => ({
          contentCalendar: state.contentCalendar.filter((c) => c.id !== id),
        }));
      },

      updateContentStatus: (id, status) => {
        set((state) => ({
          contentCalendar: state.contentCalendar.map((c) =>
            c.id === id ? { ...c, status } : c
          ),
        }));
      },

      // ── Social Media Post Actions ─────────────────────────────────────────

      schedulePost: (post) => {
        const id = generateId('post');
        set((state) => ({
          socialMediaPosts: [
            ...state.socialMediaPosts,
            { ...post, id, publishedAt: null, metrics: {} },
          ],
        }));
        return id;
      },

      updatePost: (id, updates) => {
        set((state) => ({
          socialMediaPosts: state.socialMediaPosts.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        }));
      },

      publishPost: (id) => {
        set((state) => ({
          socialMediaPosts: state.socialMediaPosts.map((p) =>
            p.id === id
              ? { ...p, publishedAt: nowISO(), status: 'published' as ContentStatus }
              : p
          ),
        }));
      },

      removePost: (id) => {
        set((state) => ({
          socialMediaPosts: state.socialMediaPosts.filter((p) => p.id !== id),
        }));
      },

      // ── Analytics / Computed ──────────────────────────────────────────────

      getMetrics: () => {
        const { campaigns, socialMediaPosts, contentCalendar } = get();

        const activeCampaigns = campaigns.filter(
          (c) => c.status === 'active'
        );

        const totalImpressions = campaigns.reduce(
          (sum, c) => sum + c.metrics.impressions,
          0
        );
        const totalClicks = campaigns.reduce(
          (sum, c) => sum + c.metrics.clicks,
          0
        );
        const totalConversions = campaigns.reduce(
          (sum, c) => sum + c.metrics.conversions,
          0
        );
        const totalBudget = campaigns.reduce(
          (sum, c) => sum + c.budget,
          0
        );

        const roiValues = campaigns
          .filter((c) => c.metrics.roi !== 0)
          .map((c) => c.metrics.roi);
        const averageROI =
          roiValues.length > 0
            ? roiValues.reduce((sum, r) => sum + r, 0) / roiValues.length
            : 0;

        const engagementValues = campaigns
          .filter((c) => c.metrics.engagement !== 0)
          .map((c) => c.metrics.engagement);
        const averageEngagement =
          engagementValues.length > 0
            ? engagementValues.reduce((sum, e) => sum + e, 0) /
              engagementValues.length
            : 0;

        const scheduledPostCount = socialMediaPosts.filter(
          (p) => p.status === 'approved' || p.status === 'review'
        ).length;

        const contentInPipelineCount = contentCalendar.filter(
          (c) =>
            c.status === 'idea' ||
            c.status === 'draft' ||
            c.status === 'review'
        ).length;

        return {
          totalImpressions,
          totalClicks,
          totalConversions,
          averageROI: Math.round(averageROI * 100) / 100,
          averageEngagement: Math.round(averageEngagement * 100) / 100,
          totalBudget,
          activeCampaignCount: activeCampaigns.length,
          scheduledPostCount,
          contentInPipelineCount,
        };
      },

      getCampaignById: (id) => {
        return get().campaigns.find((c) => c.id === id);
      },

      getActiveCampaigns: () => {
        return get().campaigns.filter((c) => c.status === 'active');
      },

      getCampaignsByChannel: (channel) => {
        return get().campaigns.filter((c) => c.channel === channel);
      },

      getContentByMonth: (month) => {
        return get().contentCalendar.filter((c) =>
          c.scheduledDate.startsWith(month)
        );
      },

      getScheduledPosts: () => {
        const now = nowISO();
        return get()
          .socialMediaPosts.filter(
            (p) =>
              p.publishedAt === null &&
              p.scheduledAt >= now &&
              p.status !== 'published'
          )
          .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
      },

      getTotalBudget: () => {
        return get().campaigns.reduce((sum, c) => sum + c.budget, 0);
      },

      getTotalSpentBudget: () => {
        return get()
          .campaigns.filter(
            (c) => c.status === 'completed' || c.status === 'active'
          )
          .reduce((sum, c) => sum + c.budget, 0);
      },

      getAverageROI: () => {
        const campaigns = get().campaigns.filter(
          (c) => c.metrics.roi !== 0
        );
        if (campaigns.length === 0) return 0;
        const total = campaigns.reduce((sum, c) => sum + c.metrics.roi, 0);
        return Math.round((total / campaigns.length) * 100) / 100;
      },

      getEngagementByChannel: () => {
        const channelMap = new Map<CampaignChannel, number[]>();

        for (const campaign of get().campaigns) {
          const values = channelMap.get(campaign.channel) ?? [];
          values.push(campaign.metrics.engagement);
          channelMap.set(campaign.channel, values);
        }

        return Array.from(channelMap.entries()).map(([channel, values]) => ({
          channel,
          engagement:
            values.length > 0
              ? Math.round(
                  (values.reduce((s, v) => s + v, 0) / values.length) * 100
                ) / 100
              : 0,
        }));
      },

      getConversionsByChannel: () => {
        const channelMap = new Map<CampaignChannel, number>();

        for (const campaign of get().campaigns) {
          channelMap.set(
            campaign.channel,
            (channelMap.get(campaign.channel) ?? 0) +
              campaign.metrics.conversions
          );
        }

        return Array.from(channelMap.entries())
          .map(([channel, conversions]) => ({ channel, conversions }))
          .sort((a, b) => b.conversions - a.conversions);
      },
    }),
    {
      name: 'sbarzi-marketing-store',
      partialize: (state) => ({
        campaigns: state.campaigns,
        contentCalendar: state.contentCalendar,
        socialMediaPosts: state.socialMediaPosts,
      }),
    }
  )
);
