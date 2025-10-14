/**
 * Mail Webhooks Store
 * Zustand store for caching mail webhooks by wallet address
 */

import { create } from 'zustand';
import type { IndexerWebhookData } from '@sudobility/types';

/**
 * Mail webhook type alias
 */
type Webhook = IndexerWebhookData;

/**
 * Mail webhooks cache entry
 */
interface MailWebhooksCacheEntry {
  /** Array of mail webhooks for this wallet */
  webhooks: Webhook[];
  /** Total number of webhooks */
  total: number;
  /** Whether there are more webhooks available */
  hasMore: boolean;
  /** Timestamp when this data was cached */
  cachedAt: number;
}

/**
 * Mail webhooks store state
 */
interface MailWebhooksStoreState {
  /** Cache of mail webhooks keyed by wallet address */
  cache: Record<string, MailWebhooksCacheEntry>;
  /** Set mail webhooks for a specific wallet address */
  setWebhooks: (
    walletAddress: string,
    webhooks: Webhook[],
    total: number,
    hasMore: boolean
  ) => void;
  /** Get mail webhooks for a specific wallet address */
  getWebhooks: (walletAddress: string) => Webhook[] | undefined;
  /** Get cache entry for a specific wallet address */
  getCacheEntry: (walletAddress: string) => MailWebhooksCacheEntry | undefined;
  /** Clear mail webhooks for a specific wallet address */
  clearWebhooks: (walletAddress: string) => void;
  /** Clear all cached mail webhooks */
  clearAll: () => void;
}

/**
 * Zustand store for mail webhooks caching
 */
export const useMailWebhooksStore = create<MailWebhooksStoreState>(
  (set, get) => ({
    cache: {},

    setWebhooks: (
      walletAddress: string,
      webhooks: Webhook[],
      total: number,
      hasMore: boolean
    ) =>
      set(state => ({
        cache: {
          ...state.cache,
          [walletAddress.toLowerCase()]: {
            webhooks,
            total,
            hasMore,
            cachedAt: Date.now(),
          },
        },
      })),

    getWebhooks: (walletAddress: string) => {
      const entry = get().cache[walletAddress.toLowerCase()];
      return entry?.webhooks;
    },

    getCacheEntry: (walletAddress: string) => {
      return get().cache[walletAddress.toLowerCase()];
    },

    clearWebhooks: (walletAddress: string) =>
      set(state => {
        const newCache = { ...state.cache };
        delete newCache[walletAddress.toLowerCase()];
        return { cache: newCache };
      }),

    clearAll: () => set({ cache: {} }),
  })
);
