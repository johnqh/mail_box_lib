/**
 * Message Store
 * Zustand store for caching individual messages by userId + messageId
 */

import { create } from 'zustand';
import { Optional } from '@johnqh/types';
import { WildduckMessageDetail } from '@johnqh/wildduck_client';

/**
 * Message cache entry
 */
interface MessageCacheEntry {
  /** Full message detail with payload */
  message: WildduckMessageDetail;
  /** Timestamp when this data was cached */
  cachedAt: number;
}

/**
 * Message store state
 */
interface MessageStoreState {
  /** Cache of messages keyed by userId+messageId */
  cache: Record<string, MessageCacheEntry>;
  /** Set a message for a specific userId+messageId */
  setMessage: (
    userId: string,
    messageId: string,
    message: WildduckMessageDetail
  ) => void;
  /** Get message for a specific userId+messageId */
  getMessage: (
    userId: string,
    messageId: string
  ) => Optional<WildduckMessageDetail>;
  /** Clear message for a specific userId+messageId */
  clearMessage: (userId: string, messageId: string) => void;
  /** Clear all cached messages */
  clearAll: () => void;
}

/**
 * Generate cache key from userId and messageId
 */
const getCacheKey = (userId: string, messageId: string): string => {
  return `${userId}:${messageId}`;
};

/**
 * Zustand store for individual message caching
 */
export const useMessageStore = create<MessageStoreState>((set, get) => ({
  cache: {},

  setMessage: (
    userId: string,
    messageId: string,
    message: WildduckMessageDetail
  ) => {
    const key = getCacheKey(userId, messageId);
    set(state => ({
      cache: {
        ...state.cache,
        [key]: {
          message,
          cachedAt: Date.now(),
        },
      },
    }));
  },

  getMessage: (userId: string, messageId: string) => {
    const key = getCacheKey(userId, messageId);
    return get().cache[key]?.message;
  },

  clearMessage: (userId: string, messageId: string) => {
    const key = getCacheKey(userId, messageId);
    set(state => {
      const newCache = { ...state.cache };
      delete newCache[key];
      return { cache: newCache };
    });
  },

  clearAll: () => set({ cache: {} }),
}));
