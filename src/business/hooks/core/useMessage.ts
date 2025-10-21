/**
 * useMessage Hook
 * Manages a single message with full payload fetching from WildDuck
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Optional } from '@sudobility/types';
import {
  useWildduckMessages,
  WildduckConfig,
} from '@sudobility/wildduck_client';
import { useSelectedAccount } from './useSelectedAccount';
import {
  createGlobalState,
  setGlobalState,
} from '../../../utils/useGlobalState';
import { useUnifiedMessagesStore } from '../../stores/unifiedMessagesStore';
import { Message, messageFromDetailedResponse } from '../../types/message';
import { useGlobalSelectedMailboxId } from './useMailboxMessages';

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
 * - Observes wildduckAuth from useSelectedAccount for authentication
 * - Caches messages in Zustand store using userId + messageId as key
 * - Returns cached message immediately for better UX
 *
 * @param endpointUrl - WildDuck API backend URL
 * @param apiToken - WildDuck API token for authentication
 * @param devMode - Whether to use mock data on errors
 * @returns Object containing selectedMessageId, selectMessage, message (cached), isLoading, and error
 *
 * @example
 * ```tsx
 * function MessageView() {
 *   const {
 *     selectedMessageId,
 *     selectMessage,
 *     message,
 *     isLoading,
 *     error
 *   } = useMessage(
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
  endpointUrl: string,
  apiToken: string,
  devMode: boolean = false
): UseMessageReturn {
  const [selectedMessageId] = useGlobalSelectedMessageId();
  const [selectedMailboxId] = useGlobalSelectedMailboxId();
  const { wildduckAuth } = useSelectedAccount(endpointUrl, apiToken, devMode);

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

  const messagesHook = useWildduckMessages(config, devMode);
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
    console.log('[useMessage] Effect triggered:', {
      hasAuth: !!wildduckAuth,
      selectedMessageId,
      selectedMailboxId,
      cachedMailbox: cachedMessage?.mailbox,
    });

    if (!wildduckAuth || !selectedMessageId) {
      setMessage(null);
      setError(null);
      return;
    }

    // Determine mailboxId: prefer cached message's mailbox, fall back to selected mailbox
    const mailboxId = cachedMessage?.mailbox || selectedMailboxId;
    console.log('[useMessage] Determined mailboxId:', mailboxId);
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

        console.log('[useMessage] Fetching message:', {
          userId: wildduckAuth.userId,
          mailboxId,
          messageId: selectedMessageId,
        });

        const response = await getMessage(
          wildduckAuth.userId,
          mailboxId,
          selectedMessageId
        );

        console.log('[useMessage] API response:', response);

        const messageData = response.data;
        if (messageData) {
          console.log('[useMessage] Message data received:', messageData);
          // Transform the detailed response to Message
          // Merge with existing cached message if available to preserve list view data
          const transformedMessage = messageFromDetailedResponse(
            messageData,
            cachedMessage
          );
          console.log('[useMessage] Transformed message:', transformedMessage);
          setMessage(transformedMessage);
          console.log('[useMessage] Message state set successfully');
          // Cache the message - this will also update any list cache that contains it
          cacheMessage(
            wildduckAuth.userId,
            selectedMessageId,
            transformedMessage
          );
        } else {
          console.warn('[useMessage] No message data in response');
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
