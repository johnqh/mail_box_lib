/**
 * useMailboxMessages Hook
 * Manages the selected mailbox and fetches messages with pagination
 */

import { useCallback, useEffect, useState } from 'react';
import { Optional } from '@johnqh/types';
import { useWildduckMessages, WildduckConfig } from '@johnqh/wildduck_client';
import { useAccountMailboxes } from './useAccountMailboxes';
import {
  createGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';
import { useUnifiedMessagesStore } from '../../stores/unifiedMessagesStore';
import { Message, messageFromListItem } from '../../types/message';

/**
 * Global selected mailbox ID - shared across all components
 */
export const useGlobalSelectedMailboxId = createGlobalState<Optional<string>>(
  'selectedMailboxId',
  null
);

/**
 * Return type for useMailboxMessages hook
 */
export interface UseMailboxMessagesReturn {
  /** The currently selected mailbox ID */
  selectedMailboxId: Optional<string>;
  /** Function to select a mailbox */
  selectMailbox: (mailboxId: string) => void;
  /** Array of messages from the selected mailbox */
  messages: Message[];
  /** Total number of messages in the mailbox */
  totalMessages: number;
  /** Whether more messages are being loaded */
  isLoading: boolean;
  /** Whether all messages have been loaded */
  hasMore: boolean;
  /** Load more messages (next page) */
  loadMore: () => Promise<void>;
  /** Refresh messages (reload from first page) */
  refresh: () => Promise<void>;
  /** Error message if any */
  error: Optional<string>;
}

/**
 * Hook to manage the selected mailbox and its messages
 *
 * Features:
 * - Provides a setter to select a mailbox from useAccountMailboxes
 * - Fetches messages with includeHeaders for to, from, and subject
 * - Uses smart pagination to eventually get all messages
 * - Updates the exposed message list after each page load
 * - Automatically loads first page when mailbox is selected
 * - Caches messages in Zustand store using userId + mailboxId as key
 * - Returns cached messages immediately for better UX
 *
 * @param endpointUrl - WildDuck API backend URL
 * @param apiToken - WildDuck API token for authentication
 * @param emailDomain - Email domain (passed to useAccountMailboxes)
 * @param devMode - Whether to use mock data on errors
 * @param pageSize - Number of messages to fetch per page (default: 50)
 * @returns Object containing selectedMailboxId, selectMailbox, messages (cached), and pagination controls
 *
 * @example
 * ```tsx
 * function MailboxView() {
 *   const {
 *     selectedMailboxId,
 *     selectMailbox,
 *     messages,
 *     totalMessages,
 *     isLoading,
 *     hasMore,
 *     loadMore,
 *     refresh,
 *     error
 *   } = useMailboxMessages(
 *     'https://wildduck.example.com',
 *     'your-api-token',
 *     '0xmail.box',
 *     false,
 *     50
 *   );
 *
 *   return (
 *     <div>
 *       <button onClick={refresh} disabled={isLoading}>Refresh</button>
 *       {messages.map(msg => (
 *         <div key={msg.id}>
 *           <strong>{msg.from?.address}</strong>: {msg.subject}
 *         </div>
 *       ))}
 *       {hasMore && (
 *         <button onClick={loadMore} disabled={isLoading}>
 *           {isLoading ? 'Loading...' : 'Load More'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMailboxMessages(
  endpointUrl: string,
  apiToken: string,
  emailDomain: string,
  devMode: boolean = false,
  pageSize: number = 50
): UseMailboxMessagesReturn {
  const [selectedMailboxId] = useGlobalSelectedMailboxId();
  const { wildduckAuth } = useAccountMailboxes(
    endpointUrl,
    apiToken,
    emailDomain,
    devMode
  );

  // Get Zustand store methods
  const {
    getMessages: getCachedMessages,
    setMessages: cacheMessages,
    appendMessages,
  } = useUnifiedMessagesStore();

  // Check if we have cached messages for this mailbox
  const cachedData =
    wildduckAuth && selectedMailboxId
      ? getCachedMessages(wildduckAuth.userId, selectedMailboxId)
      : undefined;

  const [messages, setMessages] = useState<Message[]>(
    cachedData?.messages || []
  );
  const [totalMessages, setTotalMessages] = useState(
    cachedData?.totalMessages || 0
  );
  const [currentPage, setCurrentPage] = useState(cachedData?.currentPage || 1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const config: WildduckConfig = {
    backendUrl: endpointUrl,
    apiToken,
  };

  const messagesHook = useWildduckMessages(config, devMode);

  // Function to select a mailbox
  const selectMailbox = useCallback((mailboxId: string) => {
    setGlobalState('selectedMailboxId', mailboxId);
    // Reset pagination state when selecting a new mailbox
    setMessages([]);
    setTotalMessages(0);
    setCurrentPage(1);
    setError(null);
  }, []);

  // Load messages for a specific page
  const loadPage = useCallback(
    async (page: number) => {
      if (!wildduckAuth || !selectedMailboxId) {
        return;
      }

      try {
        setIsLoadingMore(true);
        setError(null);

        const result = await messagesHook.getMessages(
          wildduckAuth.userId,
          selectedMailboxId,
          {
            page,
            limit: pageSize,
            order: 'desc', // Most recent first
          }
        );

        // Transform WildduckMessage[] to Message[]
        const transformedMessages = result.map(msg => messageFromListItem(msg));

        // Stop if no messages returned
        if (transformedMessages.length === 0) {
          setIsLoadingMore(false);
          return;
        }

        // Update total from the hook
        const total = messagesHook.totalMessages;
        setTotalMessages(total);

        // Update local state and cache
        if (page === 1) {
          setMessages(transformedMessages);
          // Cache first page
          cacheMessages(
            wildduckAuth.userId,
            selectedMailboxId,
            transformedMessages,
            total,
            page
          );
        } else {
          setMessages(prev => [...prev, ...transformedMessages]);
          // Append to cache
          appendMessages(
            wildduckAuth.userId,
            selectedMailboxId,
            transformedMessages,
            total,
            page
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load messages';
        setError(errorMessage);
      } finally {
        setIsLoadingMore(false);
      }
    },
    [
      wildduckAuth,
      selectedMailboxId,
      messagesHook,
      pageSize,
      cacheMessages,
      appendMessages,
    ]
  );

  // Calculate if there are more messages to load
  const hasMore = messages.length < totalMessages;

  // Load first page when mailbox or auth changes
  useEffect(() => {
    if (wildduckAuth && selectedMailboxId) {
      setMessages([]);
      setCurrentPage(1);
      loadPage(1);
    } else {
      setMessages([]);
      setTotalMessages(0);
      setCurrentPage(1);
    }
    // loadPage is intentionally omitted from dependencies to prevent infinite loop
    // We only want to trigger when wildduckAuth or selectedMailboxId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wildduckAuth, selectedMailboxId]);

  // Load more messages (next page)
  const loadMore = useCallback(async () => {
    if (isLoadingMore) {
      return;
    }

    // Check if there are more messages
    if (messages.length >= totalMessages) {
      return;
    }

    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    await loadPage(nextPage);
  }, [currentPage, isLoadingMore, messages.length, totalMessages, loadPage]);

  const isLoading = messagesHook.isLoading || isLoadingMore;

  // Refresh function to reload messages from the first page
  const refresh = useCallback(async () => {
    if (!wildduckAuth || !selectedMailboxId) {
      return;
    }
    // Reset state and reload first page
    setMessages([]);
    setCurrentPage(1);
    await loadPage(1);
  }, [wildduckAuth, selectedMailboxId, loadPage]);

  return {
    selectedMailboxId,
    selectMailbox,
    messages,
    totalMessages,
    isLoading,
    hasMore,
    loadMore,
    refresh,
    error: error || messagesHook.error,
  };
}
