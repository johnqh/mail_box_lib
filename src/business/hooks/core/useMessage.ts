/**
 * useMessage Hook
 * Manages a single message with full payload fetching from WildDuck
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  NetworkClient,
  Optional,
  WildduckConfig,
  WildduckUserAuth,
} from '@sudobility/types';
import { useWildduckMessages } from '@sudobility/wildduck_client';
import {
  createGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';
import { useUnifiedMessagesStore } from '../../stores/unifiedMessagesStore';
import { Message, messageFromDetailedResponse } from '../../types/message';

/**
 * Global selected message ID - shared across all components
 */
export const useGlobalSelectedMessageId = createGlobalState<Optional<string>>(
  'selectedMessageId',
  null
);

/**
 * Return type for useMessage hook
 */
export interface UseMessageReturn {
  /** The currently selected message ID */
  selectedMessageId: Optional<string>;
  /** Function to select a message */
  selectMessage: (messageId: string) => void;
  /** Full message detail with payload */
  message: Optional<Message>;
  /** Whether message is currently loading */
  isLoading: boolean;
  /** Error message if any */
  error: Optional<string>;
}

/**
 * Hook to manage a single message with full payload
 *
 * Features:
 * - Provides a setter to select a message by messageId
 * - Fetches full message payload from WildDuck when messageId is set
 * - Accepts wildduckAuth as parameter for authentication
 * - Caches messages in Zustand store using userId + messageId as key
 * - Returns cached message immediately for better UX
 *
 * @param wildduckAuth - WildDuck authentication object (from useAccountWildduckAuth)
 * @param selectedMailboxId - Currently selected mailbox ID (from useMailboxMessages)
 * @param endpointUrl - WildDuck API backend URL
 * @param apiToken - WildDuck API token for authentication
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing selectedMessageId, selectMessage, message (cached), isLoading, and error
 *
 * @example
 * ```tsx
 * function MessageView() {
 *   const wildduckAuth = useAccountWildduckAuth(config, storage, false);
 *   const { selectedMailboxId } = useMailboxMessages(wildduckAuth, endpointUrl, apiToken, false);
 *
 *   const {
 *     selectedMessageId,
 *     selectMessage,
 *     message,
 *     isLoading,
 *     error
 *   } = useMessage(
 *     wildduckAuth,
 *     selectedMailboxId,
 *     'https://wildduck.example.com',
 *     'your-api-token',
 *     false
 *   );
 *
 *   return (
 *     <div>
 *       {isLoading && <div>Loading...</div>}
 *       {error && <div>Error: {error}</div>}
 *       {message && (
 *         <div>
 *           <h2>{message.subject}</h2>
 *           <p>From: {message.from?.address}</p>
 *           <div dangerouslySetInnerHTML={{ __html: message.html || '' }} />
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useMessage(
  networkClient: NetworkClient,
  wildduckAuth: Optional<WildduckUserAuth>,
  selectedMailboxId: Optional<string>,
  endpointUrl: string,
  apiToken: string,
  devMode: boolean = false
): UseMessageReturn {
  const [selectedMessageId] = useGlobalSelectedMessageId();

  // Get Zustand store methods
  const { getMessage: getCachedMessage, setMessage: cacheMessage } =
    useUnifiedMessagesStore();

  // Check if we have cached message
  const cachedMessage =
    wildduckAuth && selectedMessageId
      ? getCachedMessage(wildduckAuth.userId, selectedMessageId)
      : undefined;

  const [message, setMessage] = useState<Optional<Message>>(
    cachedMessage || null
  );
  const [isLoadingMessage, setIsLoadingMessage] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  // Memoize config to prevent getMessage from being recreated
  const config = useMemo<WildduckConfig>(
    () => ({
      backendUrl: endpointUrl,
      apiToken,
    }),
    [endpointUrl, apiToken]
  );

  const messagesHook = useWildduckMessages(networkClient, config, devMode);
  // Extract getMessage to prevent useEffect from triggering on messagesHook state changes
  const { getMessage } = messagesHook;

  // Function to select a message
  const selectMessage = useCallback((messageId: string) => {
    setGlobalState('selectedMessageId', messageId);
    // Reset state when selecting a new message
    setMessage(null);
    setError(null);
  }, []);

  // Load message when messageId or auth changes
  useEffect(() => {
    if (!wildduckAuth || !selectedMessageId) {
      setMessage(null);
      setError(null);
      return;
    }

    // Determine mailboxId: prefer cached message's mailbox, fall back to selected mailbox
    const mailboxId = cachedMessage?.mailbox || selectedMailboxId;
    if (!mailboxId) {
      console.error('[useMessage] No mailbox ID available!', {
        cachedMailbox: cachedMessage?.mailbox,
        selectedMailboxId,
      });
      setError('No mailbox selected');
      return;
    }

    // Don't re-fetch if we're already loading
    if (isLoadingMessage) {
      return;
    }

    (async () => {
      try {
        setIsLoadingMessage(true);
        setError(null);

        const response = await getMessage(
          wildduckAuth.userId,
          mailboxId,
          selectedMessageId
        );

        // The WildDuck API returns the message directly in the response, not nested in a 'data' field
        // Response structure: { success: true, id, mailbox, html, attachments, ... }
        if (response && response.success) {
          // Transform the detailed response to Message
          // Merge with existing cached message if available to preserve list view data
          // The response type from the API is compatible with WildduckMessageDetail
          const transformedMessage = messageFromDetailedResponse(
            response as any,
            cachedMessage
          );
          setMessage(transformedMessage);
          // Cache the message - this will also update any list cache that contains it
          cacheMessage(
            wildduckAuth.userId,
            selectedMessageId,
            transformedMessage
          );
        } else {
          console.warn(
            '[useMessage] No message data in response or request failed'
          );
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load message';
        console.error('[useMessage] Error loading message:', err);
        setError(errorMessage);
      } finally {
        setIsLoadingMessage(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wildduckAuth,
    selectedMessageId,
    selectedMailboxId,
    cachedMessage?.mailbox,
  ]);

  const isLoading = messagesHook.isLoading || isLoadingMessage;
  const combinedError = error || messagesHook.error;

  // Memoize the return object to prevent unnecessary re-renders
  // Only recreate when any of the properties actually change
  return useMemo<UseMessageReturn>(
    () => ({
      selectedMessageId,
      selectMessage,
      message,
      isLoading,
      error: combinedError,
    }),
    [selectedMessageId, selectMessage, message, isLoading, combinedError]
  );
}
