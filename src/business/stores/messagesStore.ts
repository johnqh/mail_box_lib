/**
 * Messages Store
 * Zustand store for caching messages by userId + mailboxId
 */

import { create } from 'zustand';
import { WildduckMessage } from '@johnqh/wildduck_client';

/**
 * Message cache entry
 */
interface MessageCacheEntry {
  /** Array of messages for this mailbox */
  messages: WildduckMessage[];
  /** Total number of messages in the mailbox */
  totalMessages: number;
  /** Current page loaded */
  currentPage: number;
  /** Timestamp when this data was cached */
  cachedAt: number;
}

/**
 * Messages store state
 */
interface MessagesStoreState {
  /** Cache of messages keyed by userId+mailboxId */
  cache: Record<string, MessageCacheEntry>;
  /** Set messages for a specific userId+mailboxId */
  setMessages: (
    userId: string,
    mailboxId: string,
    messages: WildduckMessage[],
    totalMessages: number,
    currentPage: number
  ) => void;
  /** Get messages for a specific userId+mailboxId */
  getMessages: (
    userId: string,
    mailboxId: string
  ) => MessageCacheEntry | undefined;
  /** Append messages to existing cache (for pagination) */
  appendMessages: (
    userId: string,
    mailboxId: string,
    newMessages: WildduckMessage[],
    totalMessages: number,
    currentPage: number
  ) => void;
  /** Clear messages for a specific userId+mailboxId */
  clearMessages: (userId: string, mailboxId: string) => void;
  /** Clear all cached messages */
  clearAll: () => void;
}

/**
 * Generate cache key from userId and mailboxId
 */
const getCacheKey = (userId: string, mailboxId: string): string => {
  return `${userId}:${mailboxId}`;
};

/**
 * Zustand store for message caching
 */
export const useMessagesStore = create<MessagesStoreState>((set, get) => ({
  cache: {},

  setMessages: (
    userId: string,
    mailboxId: string,
    messages: WildduckMessage[],
    totalMessages: number,
    currentPage: number
  ) => {
    const key = getCacheKey(userId, mailboxId);
    set(state => ({
      cache: {
        ...state.cache,
        [key]: {
          messages,
          totalMessages,
          currentPage,
          cachedAt: Date.now(),
        },
      },
    }));
  },

  getMessages: (userId: string, mailboxId: string) => {
    const key = getCacheKey(userId, mailboxId);
    return get().cache[key];
  },

  appendMessages: (
    userId: string,
    mailboxId: string,
    newMessages: WildduckMessage[],
    totalMessages: number,
    currentPage: number
  ) => {
    const key = getCacheKey(userId, mailboxId);
    set(state => {
      const existing = state.cache[key];
      if (!existing) {
        // If no existing cache, treat as new
        return {
          cache: {
            ...state.cache,
            [key]: {
              messages: newMessages,
              totalMessages,
              currentPage,
              cachedAt: Date.now(),
            },
          },
        };
      }

      // Append new messages to existing
      return {
        cache: {
          ...state.cache,
          [key]: {
            messages: [...existing.messages, ...newMessages],
            totalMessages,
            currentPage,
            cachedAt: Date.now(),
          },
        },
      };
    });
  },

  clearMessages: (userId: string, mailboxId: string) => {
    const key = getCacheKey(userId, mailboxId);
    set(state => {
      const newCache = { ...state.cache };
      delete newCache[key];
      return { cache: newCache };
    });
  },

  clearAll: () => set({ cache: {} }),
}));
