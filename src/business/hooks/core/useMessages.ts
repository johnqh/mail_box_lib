/**
 * useMessages Hook
 * Unified hook for getting messages - handles both regular mailbox view and search
 *
 * When searchText is empty:
 * - Uses useMailboxMessages to get messages from the selected mailbox
 * - Supports infinite scroll with next() function
 *
 * When searchText is not empty:
 * - Uses useWildduckSearch for cursor-based search
 * - If searchScope is "current": searches only in mailboxId
 * - If searchScope is "all": searches across all mailboxes
 * - Supports infinite scroll with next() function
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NetworkClient,
  Optional,
  WildduckConfig,
  WildduckUserAuth,
} from '@sudobility/types';
import { useWildduckSearch } from '@sudobility/wildduck_client';
import { useMailboxMessages } from './useMailboxMessages';
import { Message, messageFromListItem } from '../../types/message';

export interface UseMessagesParams {
  /** WildDuck API backend URL */
  endpointUrl: string;
  /** WildDuck API token */
  apiToken: string;
  /** Email domain (e.g., 'example.com') */
  emailDomain: string;
  /** Network client for API calls */
  networkClient: NetworkClient;
  /** Whether to use mock data on errors */
  devMode?: boolean;
  /** Number of messages to fetch per page (default: 50) */
  pageSize?: number;
  /** Current mailbox ID to fetch messages from */
  mailboxId?: string;
  /** Search text (empty = no search) */
  searchText: string;
  /** Search scope: 'current' = current mailbox only, 'all' = all mailboxes */
  searchScope: 'current' | 'all';
  /** WildDuck authentication (includes wildduckUserAuth?.userId, wildduckUserAuth?.accessToken, and username) */
  wildduckUserAuth?: Optional<WildduckUserAuth>;
  /** Whether the hook is enabled */
  enabled?: boolean;
}

export interface UseMessagesReturn {
  /** Array of messages (search results or mailbox messages) */
  messages: Message[];
  /** Whether messages are being loaded */
  isLoading: boolean;
  /** Error message if any */
  error: Optional<Error>;
  /** Whether currently searching */
  isSearching: boolean;
  /** Total number of messages */
  totalMessages: number;
  /** Whether more messages are available */
  hasMore: boolean;
  /** Load next page of messages (infinite scroll) */
  next: () => Promise<void>;
  /** Refresh messages */
  refresh: () => Promise<void>;
}

/**
 * Unified hook for getting messages - handles both regular mailbox view and search
 *
 * @param params Configuration parameters for the hook
 * @returns Object containing messages, loading state, and pagination controls
 *
 * @example
 * ```tsx
 * function MailView() {
 *   const {
 *     messages,
 *     isLoading,
 *     isSearching,
 *     hasMore,
 *     next,
 *   } = useMessages({
 *     endpointUrl: 'https://api.example.com',
 *     apiToken: 'your-api-token',
 *     emailDomain: 'example.com',
 *     networkClient,
 *     mailboxId: 'inbox-id',
 *     searchText: '',
 *     searchScope: 'current',
 *     wildduckUserAuth,
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map(msg => <MessageItem key={msg.id} message={msg} />)}
 *       {hasMore && <button onClick={next}>Load More</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMessages({
  endpointUrl,
  apiToken,
  emailDomain: _emailDomain,
  networkClient,
  devMode = false,
  pageSize = 50,
  mailboxId,
  searchText,
  searchScope,
  wildduckUserAuth,
  enabled = true,
}: UseMessagesParams): UseMessagesReturn {
  // Track mailbox transitions to show loading state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousMailboxId = useRef<Optional<string>>(mailboxId);

  const config: WildduckConfig = useMemo(
    () => ({
      backendUrl: endpointUrl,
      apiToken,
    }),
    [endpointUrl, apiToken]
  );

  // Always keep mailbox messages hook active so it's ready when search is cleared
  const mailboxMessages = useMailboxMessages(
    networkClient,
    wildduckUserAuth,
    endpointUrl,
    apiToken,
    devMode,
    pageSize
  );

  // Build search params conditionally
  const searchParams = useMemo(() => {
    const params: {
      wildduckUserAuth?: WildduckUserAuth;
      query?: string;
      mailbox?: string;
    } = {};

    if (wildduckUserAuth) {
      params.wildduckUserAuth = wildduckUserAuth;
    }
    if (searchText.trim()) {
      params.query = searchText.trim();
    }
    if (searchScope === 'current' && mailboxId) {
      params.mailbox = mailboxId;
    }

    return params;
  }, [wildduckUserAuth, searchText, searchScope, mailboxId]);

  // Search hook for when searchText is provided
  const searchHook = useWildduckSearch(
    networkClient,
    config,
    searchParams,
    pageSize
  );

  // Select the mailbox if provided (always, not just when not searching)
  useEffect(() => {
    if (mailboxId && mailboxMessages.selectMailbox) {
      // Detect mailbox change
      if (previousMailboxId.current !== mailboxId) {
        setIsTransitioning(true);
        previousMailboxId.current = mailboxId;
      }
      mailboxMessages.selectMailbox(mailboxId);
    }
    // Only depend on mailboxId to avoid array size changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mailboxId]);

  // Clear transitioning state when messages are loaded
  useEffect(() => {
    if (!mailboxMessages.isLoading && isTransitioning) {
      setIsTransitioning(false);
    }
  }, [mailboxMessages.isLoading, isTransitioning]);

  // Reset search results when search text changes
  useEffect(() => {
    if (searchText.trim()) {
      searchHook.resetResults();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, searchScope, mailboxId]);

  // Return the appropriate data based on whether we're searching
  const isSearching = !!searchText.trim() && enabled;

  // Transform search results to Message type
  const searchMessages = useMemo(() => {
    if (!isSearching) return [];
    return searchHook.results.map(msg => messageFromListItem(msg));
  }, [isSearching, searchHook.results]);

  // Refresh function that works for both search and mailbox view
  const refresh = useCallback(async () => {
    if (isSearching) {
      // Reset and refetch search results
      searchHook.resetResults();
      searchHook.refetch();
    } else {
      // Refresh mailbox messages
      await mailboxMessages.refresh();
    }
  }, [isSearching, searchHook, mailboxMessages]);

  // Extract stable references to prevent next() from being recreated
  const searchNext = searchHook.next;
  const mailboxNext = mailboxMessages.next;

  // Next function for infinite scroll - memoized with stable dependencies
  const next = useCallback(async () => {
    if (isSearching) {
      // Load next page of search results
      await searchNext();
    } else {
      // Load next page of mailbox messages
      await mailboxNext();
    }
  }, [isSearching, searchNext, mailboxNext]);

  // Memoize computed values to prevent unnecessary re-renders
  const messages = useMemo(
    () => (isSearching ? searchMessages : mailboxMessages.messages || []),
    [isSearching, searchMessages, mailboxMessages.messages]
  );

  const isLoading = useMemo(
    () =>
      isSearching
        ? searchHook.isLoading
        : mailboxMessages.isLoading || isTransitioning,
    [
      isSearching,
      searchHook.isLoading,
      mailboxMessages.isLoading,
      isTransitioning,
    ]
  );

  const error = useMemo(
    () =>
      isSearching
        ? searchHook.error
        : mailboxMessages.error
          ? new Error(mailboxMessages.error)
          : null,
    [isSearching, searchHook.error, mailboxMessages.error]
  );

  const totalMessages = useMemo(
    () =>
      isSearching
        ? (searchHook.data?.total ?? 0)
        : mailboxMessages.totalMessages,
    [isSearching, searchHook.data?.total, mailboxMessages.totalMessages]
  );

  const hasMore = useMemo(
    () => (isSearching ? searchHook.hasNextPage : mailboxMessages.hasMore),
    [isSearching, searchHook.hasNextPage, mailboxMessages.hasMore]
  );

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(
    () => ({
      messages,
      isLoading,
      error,
      isSearching,
      totalMessages,
      hasMore,
      next,
      refresh,
    }),
    [
      messages,
      isLoading,
      error,
      isSearching,
      totalMessages,
      hasMore,
      next,
      refresh,
    ]
  );
}
