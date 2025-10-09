/**
 * Mailbox Store
 * Zustand store for caching mailboxes by userId
 */

import { create } from 'zustand';
import { WildduckMailbox } from '@johnqh/wildduck_client';

/**
 * Mailbox cache entry
 */
interface MailboxCacheEntry {
  /** Array of mailboxes for this user */
  mailboxes: WildduckMailbox[];
  /** Timestamp when this data was cached */
  cachedAt: number;
}

/**
 * Mailbox store state
 */
interface MailboxStoreState {
  /** Cache of mailboxes keyed by userId */
  cache: Record<string, MailboxCacheEntry>;
  /** Set mailboxes for a specific userId */
  setMailboxes: (userId: string, mailboxes: WildduckMailbox[]) => void;
  /** Get mailboxes for a specific userId */
  getMailboxes: (userId: string) => WildduckMailbox[] | undefined;
  /** Clear mailboxes for a specific userId */
  clearMailboxes: (userId: string) => void;
  /** Clear all cached mailboxes */
  clearAll: () => void;
}

/**
 * Zustand store for mailbox caching
 */
export const useMailboxStore = create<MailboxStoreState>((set, get) => ({
  cache: {},

  setMailboxes: (userId: string, mailboxes: WildduckMailbox[]) =>
    set(state => ({
      cache: {
        ...state.cache,
        [userId]: {
          mailboxes,
          cachedAt: Date.now(),
        },
      },
    })),

  getMailboxes: (userId: string) => {
    const entry = get().cache[userId];
    return entry?.mailboxes;
  },

  clearMailboxes: (userId: string) =>
    set(state => {
      const newCache = { ...state.cache };
      delete newCache[userId];
      return { cache: newCache };
    }),

  clearAll: () => set({ cache: {} }),
}));
