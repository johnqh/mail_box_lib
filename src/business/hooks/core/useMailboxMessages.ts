/**
 * useMailboxMessages Hook
 * Manages the selected mailbox and fetches messages with pagination
 */

import { useCallback, useEffect, useState } from 'react';
import { NetworkClient, Optional } from '@sudobility/types';
import { WildduckConfig, WildduckUserAuth } from '@sudobility/mail_box_types';
import { useWildduckMessages } from '@sudobility/wildduck_client';
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
  /** Whether more messages are available */
  hasMore: boolean;
  /** Load next page of messages - uses cursor-based pagination */
  next: () => Promise<void>;
  /** Refresh messages (reload from first page) */
  refresh: () => Promise<void>;
  /** Error message if any */
  error: Optional<string>;
}

/**
 * Options for useMailboxMessages hook
 */
export interface UseMailboxMessagesOptions {
  /** Enable WebSocket for real-time updates */
  enableWebSocket?: boolean;
}

/**
 * Hook to manage the selected mailbox and its messages
 *
 * Features:
 * - Provides a setter to select a mailbox
 * - Fetches messages with includeHeaders for to, from, and subject
 * - Uses smart pagination to eventually get all messages
 * - Updates the exposed message list after each page load
 * - Automatically loads first page when mailbox is selected
 * - Caches messages in Zustand store using userId + mailboxId as key
 * - Returns cached messages immediately for better UX
 *
 * @param wildduckUserAuth - WildDuck authentication object (from useAccountWildduckAuth)
 * @param endpointUrl - WildDuck API backend URL
 * @param apiToken - WildDuck API token for authentication
 * @param devMode - Whether to use mock data on errors
 * @param pageSize - Number of messages to fetch per page (default: 50)
 * @param options - Optional configuration including WebSocket support
 * @returns Object containing selectedMailboxId, selectMailbox, messages (cached), and pagination controls
 *
 * @example
 * ```tsx
 * function MailboxView() {
 *   const wildduckUserAuth = useAccountWildduckAuth(config, storage, false);
 *
 *   const {
 *     selectedMailboxId,
 *     selectMailbox,
 *     messages,
 *     totalMessages,
 *     isLoading,
 *     hasMore,
 *     next,
 *     refresh,
 *     error
 *   } = useMailboxMessages(
 *     wildduckUserAuth,
 *     'https://wildduck.example.com',
 *     'your-api-token',
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
 *         <button onClick={next} disabled={isLoading}>
 *           {isLoading ? 'Loading...' : 'Load More'}
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMailboxMessages(
  networkClient: NetworkClient,
  wildduckUserAuth: Optional<WildduckUserAuth>,
  endpointUrl: string,
  apiToken: string,
  devMode: boolean = false,
  pageSize: number = 50,
  options?: UseMailboxMessagesOptions
): UseMailboxMessagesReturn {
  const [selectedMailboxId] = useGlobalSelectedMailboxId();

  // Get Zustand store methods
  const { getMessages: getCachedMessages, setMessages: cacheMessages } =
    useUnifiedMessagesStore();

  // Check if we have cached messages for this mailbox
  const cachedData =
    wildduckUserAuth && selectedMailboxId
      ? getCachedMessages(wildduckUserAuth.userId, selectedMailboxId)
      : undefined;

  const [messages, setMessages] = useState<Message[]>(
    cachedData?.messages || []
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const config: WildduckConfig = {
    backendUrl: endpointUrl,
    apiToken,
  };

  const messagesHook = useWildduckMessages(
    networkClient,
    config,
    devMode,
    pageSize,
    options
  );

  // Function to select a mailbox
  const selectMailbox = useCallback(
    (mailboxId: string) => {
      setGlobalState('selectedMailboxId', mailboxId);
      // Check for cached messages for the new mailbox
      const cached = wildduckUserAuth
        ? getCachedMessages(wildduckUserAuth.userId, mailboxId)
        : undefined;
      // Use cached messages if available, otherwise clear
      if (cached?.messages && cached.messages.length > 0) {
        setMessages(cached.messages);
      } else {
        setMessages([]);
      }
      setError(null);
      messagesHook.resetMessages();
    },
    [messagesHook, wildduckUserAuth, getCachedMessages]
  );

  // Load initial messages for the selected mailbox
  const loadInitialMessages = useCallback(async () => {
    if (!wildduckUserAuth || !selectedMailboxId) {
      return;
    }

    try {
      setIsLoadingMore(true);
      setError(null);

      const result = await messagesHook.getMessages(
        wildduckUserAuth,
        selectedMailboxId,
        {
          limit: pageSize,
          order: 'desc', // Most recent first
        }
      );

      // Transform WildduckMessage[] to Message[]
      const transformedMessages = result.map(msg => messageFromListItem(msg));

      // Update local state and cache
      setMessages(transformedMessages);

      // Cache messages
      if (transformedMessages.length > 0) {
        cacheMessages(
          wildduckUserAuth.userId,
          selectedMailboxId,
          transformedMessages,
          messagesHook.totalMessages,
          1
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load messages';
      setError(errorMessage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [
    wildduckUserAuth,
    selectedMailboxId,
    messagesHook,
    pageSize,
    cacheMessages,
  ]);

  // Whether more messages are available (based on cursor)
  const hasMore = messagesHook.hasNextPage;

  // Load initial messages when mailbox or auth changes
  useEffect(() => {
    if (wildduckUserAuth && selectedMailboxId) {
      // Check for cached messages for immediate display
      const cached = getCachedMessages(
        wildduckUserAuth.userId,
        selectedMailboxId
      );
      if (cached?.messages && cached.messages.length > 0) {
        setMessages(cached.messages);
      } else {
        setMessages([]);
      }
      // Always load fresh messages in the background
      loadInitialMessages();
    } else {
      setMessages([]);
    }
    // loadInitialMessages and getCachedMessages are intentionally omitted from dependencies to prevent infinite loop
    // We only want to trigger when wildduckUserAuth or selectedMailboxId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wildduckUserAuth, selectedMailboxId]);

  // Update messages when wildduckMessages hook state changes
  useEffect(() => {
    if (messagesHook.messages.length > 0) {
      const transformedMessages = messagesHook.messages.map(msg =>
        messageFromListItem(msg)
      );
      setMessages(transformedMessages);

      // Update cache
      if (wildduckUserAuth && selectedMailboxId) {
        cacheMessages(
          wildduckUserAuth.userId,
          selectedMailboxId,
          transformedMessages,
          messagesHook.totalMessages,
          messagesHook.currentPage
        );
      }
    }
  }, [
    messagesHook.messages,
    messagesHook.totalMessages,
    messagesHook.currentPage,
    wildduckUserAuth,
    selectedMailboxId,
    cacheMessages,
  ]);

  // Load next page using cursor-based pagination
  const next = useCallback(async () => {
    if (isLoadingMore || !hasMore) {
      return;
    }

    try {
      setIsLoadingMore(true);
      setError(null);
      await messagesHook.next();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load more messages';
      setError(errorMessage);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, messagesHook]);

  const isLoading = messagesHook.isLoading || isLoadingMore;

  // Refresh function to reload messages from the first page
  const refresh = useCallback(async () => {
    if (!wildduckUserAuth || !selectedMailboxId) {
      return;
    }
    // Reset state and reload initial messages
    setMessages([]);
    messagesHook.resetMessages();
    await loadInitialMessages();
  }, [wildduckUserAuth, selectedMailboxId, messagesHook, loadInitialMessages]);

  return {
    selectedMailboxId,
    selectMailbox,
    messages,
    totalMessages: messagesHook.totalMessages,
    isLoading,
    hasMore,
    next,
    refresh,
    error: error || messagesHook.error,
  };
}
