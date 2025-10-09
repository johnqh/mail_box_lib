/**
 * Unified Messages Store
 * Zustand store for caching messages by userId + mailboxId and userId + messageId
 * This store handles both message lists (from mailbox view) and individual messages (detail view)
 * using a unified Message type
 */

import { create } from 'zustand';
import { Optional } from '@johnqh/types';
import { Message } from '../types/message';

/**
 * Message list cache entry for a mailbox
 */
interface MessageListCacheEntry {
  /** Array of messages for this mailbox */
  messages: Message[];
  /** Total number of messages in the mailbox */
  totalMessages: number;
  /** Current page loaded */
  currentPage: number;
  /** Timestamp when this data was cached */
  cachedAt: number;
}

/**
 * Individual message cache entry
 */
interface MessageCacheEntry {
  /** Full message with detailed content */
  message: Message;
  /** Timestamp when this data was cached */
  cachedAt: number;
}

/**
 * Unified messages store state
 */
interface UnifiedMessagesStoreState {
  /** Cache of message lists keyed by userId+mailboxId */
  listCache: Record<string, MessageListCacheEntry>;
  /** Cache of individual messages keyed by userId+messageId */
  messageCache: Record<string, MessageCacheEntry>;

  // List operations
  /** Set messages for a specific userId+mailboxId */
  setMessages: (
    userId: string,
    mailboxId: string,
    messages: Message[],
    totalMessages: number,
    currentPage: number
  ) => void;
  /** Get messages for a specific userId+mailboxId */
  getMessages: (
    userId: string,
    mailboxId: string
  ) => MessageListCacheEntry | undefined;
  /** Append messages to existing cache (for pagination) */
  appendMessages: (
    userId: string,
    mailboxId: string,
    newMessages: Message[],
    totalMessages: number,
    currentPage: number
  ) => void;
  /** Clear messages for a specific userId+mailboxId */
  clearMessages: (userId: string, mailboxId: string) => void;

  // Individual message operations
  /** Set a message for a specific userId+messageId */
  setMessage: (userId: string, messageId: string, message: Message) => void;
  /** Get message for a specific userId+messageId */
  getMessage: (userId: string, messageId: string) => Optional<Message>;
  /** Clear message for a specific userId+messageId */
  clearMessage: (userId: string, messageId: string) => void;

  // Global operations
  /** Clear all cached data */
  clearAll: () => void;
}

/**
 * Generate cache key for message list from userId and mailboxId
 */
const getListCacheKey = (userId: string, mailboxId: string): string => {
  return `list:${userId}:${mailboxId}`;
};

/**
 * Generate cache key for individual message from userId and messageId
 */
const getMessageCacheKey = (userId: string, messageId: string): string => {
  return `msg:${userId}:${messageId}`;
};

/**
 * Zustand store for unified message caching
 */
export const useUnifiedMessagesStore = create<UnifiedMessagesStoreState>(
  (set, get) => ({
    listCache: {},
    messageCache: {},

    // List operations
    setMessages: (
      userId: string,
      mailboxId: string,
      messages: Message[],
      totalMessages: number,
      currentPage: number
    ) => {
      const listKey = getListCacheKey(userId, mailboxId);
      set(state => ({
        listCache: {
          ...state.listCache,
          [listKey]: {
            messages,
            totalMessages,
            currentPage,
            cachedAt: Date.now(),
          },
        },
      }));

      // Also cache each message individually for quick access
      messages.forEach(msg => {
        const msgKey = getMessageCacheKey(userId, String(msg.id));
        set(state => ({
          messageCache: {
            ...state.messageCache,
            [msgKey]: {
              message: msg,
              cachedAt: Date.now(),
            },
          },
        }));
      });
    },

    getMessages: (userId: string, mailboxId: string) => {
      const listKey = getListCacheKey(userId, mailboxId);
      return get().listCache[listKey];
    },

    appendMessages: (
      userId: string,
      mailboxId: string,
      newMessages: Message[],
      totalMessages: number,
      currentPage: number
    ) => {
      const listKey = getListCacheKey(userId, mailboxId);
      set(state => {
        const existing = state.listCache[listKey];
        if (!existing) {
          // If no existing cache, treat as new
          return {
            listCache: {
              ...state.listCache,
              [listKey]: {
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
          listCache: {
            ...state.listCache,
            [listKey]: {
              messages: [...existing.messages, ...newMessages],
              totalMessages,
              currentPage,
              cachedAt: Date.now(),
            },
          },
        };
      });

      // Also cache each new message individually
      newMessages.forEach(msg => {
        const msgKey = getMessageCacheKey(userId, String(msg.id));
        set(state => ({
          messageCache: {
            ...state.messageCache,
            [msgKey]: {
              message: msg,
              cachedAt: Date.now(),
            },
          },
        }));
      });
    },

    clearMessages: (userId: string, mailboxId: string) => {
      const listKey = getListCacheKey(userId, mailboxId);
      set(state => {
        const newListCache = { ...state.listCache };
        delete newListCache[listKey];
        return { listCache: newListCache };
      });
    },

    // Individual message operations
    setMessage: (userId: string, messageId: string, message: Message) => {
      const msgKey = getMessageCacheKey(userId, messageId);
      set(state => {
        // Update the message cache
        const updatedMessageCache = {
          ...state.messageCache,
          [msgKey]: {
            message,
            cachedAt: Date.now(),
          },
        };

        // Also update the message in any list cache that contains it
        const updatedListCache = { ...state.listCache };
        Object.keys(updatedListCache).forEach(listKey => {
          const entry = updatedListCache[listKey];
          if (entry && entry.messages) {
            const messageIndex = entry.messages.findIndex(
              m => m.id === message.id
            );
            if (messageIndex !== -1) {
              // Merge the detailed content with the existing list item
              const updatedMessages = [...entry.messages];
              updatedMessages[messageIndex] = {
                ...updatedMessages[messageIndex],
                ...message,
              };
              updatedListCache[listKey] = {
                ...entry,
                messages: updatedMessages,
              };
            }
          }
        });

        return {
          messageCache: updatedMessageCache,
          listCache: updatedListCache,
        };
      });
    },

    getMessage: (userId: string, messageId: string) => {
      const msgKey = getMessageCacheKey(userId, messageId);
      return get().messageCache[msgKey]?.message;
    },

    clearMessage: (userId: string, messageId: string) => {
      const msgKey = getMessageCacheKey(userId, messageId);
      set(state => {
        const newMessageCache = { ...state.messageCache };
        delete newMessageCache[msgKey];
        return { messageCache: newMessageCache };
      });
    },

    // Global operations
    clearAll: () => set({ listCache: {}, messageCache: {} }),
  })
);
