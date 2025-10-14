/**
 * Mail Templates Store
 * Zustand store for caching mail templates by wallet address
 */

import { create } from 'zustand';
import type { IndexerTemplateData } from '@sudobility/types';

/**
 * Mail template type alias
 */
type MailTemplate = IndexerTemplateData;

/**
 * Mail templates cache entry
 */
interface MailTemplatesCacheEntry {
  /** Array of mail templates for this wallet */
  templates: MailTemplate[];
  /** Total number of templates */
  total: number;
  /** Whether there are more templates available */
  hasMore: boolean;
  /** Timestamp when this data was cached */
  cachedAt: number;
}

/**
 * Mail templates store state
 */
interface MailTemplatesStoreState {
  /** Cache of mail templates keyed by wallet address */
  cache: Record<string, MailTemplatesCacheEntry>;
  /** Set mail templates for a specific wallet address */
  setTemplates: (
    walletAddress: string,
    templates: MailTemplate[],
    total: number,
    hasMore: boolean
  ) => void;
  /** Get mail templates for a specific wallet address */
  getTemplates: (walletAddress: string) => MailTemplate[] | undefined;
  /** Get cache entry for a specific wallet address */
  getCacheEntry: (walletAddress: string) => MailTemplatesCacheEntry | undefined;
  /** Clear mail templates for a specific wallet address */
  clearTemplates: (walletAddress: string) => void;
  /** Clear all cached mail templates */
  clearAll: () => void;
}

/**
 * Zustand store for mail templates caching
 */
export const useMailTemplatesStore = create<MailTemplatesStoreState>(
  (set, get) => ({
    cache: {},

    setTemplates: (
      walletAddress: string,
      templates: MailTemplate[],
      total: number,
      hasMore: boolean
    ) =>
      set(state => ({
        cache: {
          ...state.cache,
          [walletAddress.toLowerCase()]: {
            templates,
            total,
            hasMore,
            cachedAt: Date.now(),
          },
        },
      })),

    getTemplates: (walletAddress: string) => {
      const entry = get().cache[walletAddress.toLowerCase()];
      return entry?.templates;
    },

    getCacheEntry: (walletAddress: string) => {
      return get().cache[walletAddress.toLowerCase()];
    },

    clearTemplates: (walletAddress: string) =>
      set(state => {
        const newCache = { ...state.cache };
        delete newCache[walletAddress.toLowerCase()];
        return { cache: newCache };
      }),

    clearAll: () => set({ cache: {} }),
  })
);
