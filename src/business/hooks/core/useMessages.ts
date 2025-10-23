/**
 * useMessages Hook
 * Unified hook for getting messages - handles both regular mailbox view and search
 *
 * When searchText is empty:
 * - Uses useMailboxMessages to get messages from the selected mailbox
 *
 * When searchText is not empty:
 * - Calls WildDuck search API
 * - If searchScope is "current": searches only in mailboxId
 * - If searchScope is "all": searches across all mailboxes
 */

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Optional } from '@sudobility/types';
import type { StorageService } from '@sudobility/di';
import type { NetworkClient } from '../../../types/infrastructure/network';
import { useMailboxMessages } from './useMailboxMessages';
import { Message } from '../../types/message';

export interface UseMessagesParams {
  /** WildDuck API backend URL */
  endpointUrl: string;
  /** Email domain (e.g., '0xmail.box') */
  emailDomain: string;
  /** Storage service for caching */
  storage: StorageService;
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
  /** WildDuck user ID for search */
  userId?: string;
  /** Access token for authenticated search */
  accessToken?: string;
  /** Whether the hook is enabled */
  enabled?: boolean;
}

interface SearchResponse {
  success: boolean;
  results: Message[];
  total: number;
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
  /** Whether more messages are available (only for mailbox view) */
  hasMore: boolean;
  /** Load more messages (only for mailbox view) */
  loadMore?: () => Promise<void>;
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
 *     loadMore,
 *   } = useMessages({
 *     endpointUrl: 'https://api.0xmail.box',
 *     emailDomain: '0xmail.box',
 *     storage,
 *     networkClient,
 *     mailboxId: 'inbox-id',
 *     searchText: '',
 *     searchScope: 'current',
 *     userId: 'user-123',
 *     accessToken: 'token',
 *   });
 *
 *   return (
 *     <div>
 *       {messages.map(msg => <MessageItem key={msg.id} message={msg} />)}
 *       {hasMore && <button onClick={loadMore}>Load More</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMessages({
  endpointUrl,
  emailDomain,
  storage,
  networkClient,
  devMode = false,
  pageSize = 50,
  mailboxId,
  searchText,
  searchScope,
  userId,
  accessToken,
  enabled = true,
}: UseMessagesParams): UseMessagesReturn {
  // Track mailbox transitions to show loading state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const previousMailboxId = useRef<Optional<string>>(mailboxId);

  // Always keep mailbox messages hook active so it's ready when search is cleared
  const mailboxMessages = useMailboxMessages(
    endpointUrl,
    '',
    emailDomain,
    storage,
    devMode,
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

  // Search query when searchText is not empty
  const searchQuery = useQuery({
    queryKey: ['messages-search', userId, searchText, searchScope, mailboxId],
    queryFn: async () => {
      if (!userId || !accessToken) {
        throw new Error('Not authenticated');
      }

      // Build search query parameters
      const params = new URLSearchParams({
        query: searchText,
        limit: '100',
      });

      // If scope is "current" and we have a mailboxId, search only in that mailbox
      if (searchScope === 'current' && mailboxId) {
        params.append('mailbox', mailboxId);
      }

      const url = `${endpointUrl}/users/${userId}/search?${params.toString()}`;

      const response = await networkClient.get<SearchResponse>(url, {
        headers: {
          'X-Access-Token': accessToken,
        },
      });

      if (response.ok && response.data.results) {
        return response.data.results;
      }

      return [];
    },
    enabled: enabled && !!searchText.trim() && !!userId && !!accessToken,
    staleTime: 1000, // Search results are fresh for 1 second
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Return the appropriate data based on whether we're searching
  const isSearching = !!searchText.trim();

  const result: UseMessagesReturn = {
    messages: isSearching
      ? (searchQuery.data ?? [])
      : mailboxMessages.messages || [],
    isLoading: isSearching
      ? searchQuery.isLoading
      : mailboxMessages.isLoading || isTransitioning,
    error: isSearching
      ? searchQuery.error
      : mailboxMessages.error
        ? new Error(mailboxMessages.error)
        : null,
    isSearching,
    totalMessages: isSearching
      ? (searchQuery.data?.length ?? 0)
      : mailboxMessages.totalMessages,
    hasMore: isSearching ? false : mailboxMessages.hasMore,
  };

  // Only add loadMore if not searching
  if (!isSearching && mailboxMessages.loadMore) {
    result.loadMore = mailboxMessages.loadMore;
  }

  return result;
}
