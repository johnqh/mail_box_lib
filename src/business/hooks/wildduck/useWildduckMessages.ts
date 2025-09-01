import { useCallback, useState } from 'react';
import axios from 'axios';
import {
  WildDuckAPI,
  WildDuckMessage,
  WildDuckMessageResponse,
  WildDuckMessagesResponse,
} from '../../../network/clients/wildduck';

export interface GetMessagesOptions {
  limit?: number;
  page?: number;
  order?: 'asc' | 'desc';
  search?: string;
  thread?: string;
}

export interface SendMessageParams {
  from?: string;
  to: Array<{ name?: string; address: string }>;
  cc?: Array<{ name?: string; address: string }>;
  bcc?: Array<{ name?: string; address: string }>;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
  inReplyTo?: string;
  references?: string[];
}

export interface UpdateMessageParams {
  seen?: boolean;
  flagged?: boolean;
  deleted?: boolean;
  mailbox?: string;
}

export interface UseWildduckMessagesReturn {
  isLoading: boolean;
  error: string | null;
  messages: WildDuckMessage[];
  totalMessages: number;
  currentPage: number;
  getMessages: (
    userId: string,
    mailboxId: string,
    options?: GetMessagesOptions
  ) => Promise<WildDuckMessage[]>;
  getMessage: (
    userId: string,
    messageId: string
  ) => Promise<WildDuckMessageResponse>;
  sendMessage: (
    userId: string,
    params: SendMessageParams
  ) => Promise<{ success: boolean; id: string }>;
  updateMessage: (
    userId: string,
    messageId: string,
    params: UpdateMessageParams
  ) => Promise<{ success: boolean }>;
  deleteMessage: (
    userId: string,
    messageId: string
  ) => Promise<{ success: boolean }>;
  moveMessage: (
    userId: string,
    messageId: string,
    targetMailbox: string
  ) => Promise<{ success: boolean }>;
  searchMessages: (
    userId: string,
    query: string,
    options?: GetMessagesOptions
  ) => Promise<WildDuckMessage[]>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

/**
 * Hook for WildDuck message operations
 */
export const useWildduckMessages = (): UseWildduckMessagesReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<WildDuckMessage[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastFetchParams, setLastFetchParams] = useState<{
    userId: string;
    mailboxId: string;
    options?: GetMessagesOptions;
  } | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getMessages = useCallback(
    async (
      userId: string,
      mailboxId: string,
      options: GetMessagesOptions = {}
    ): Promise<WildDuckMessage[]> => {
      setIsLoading(true);
      setError(null);
      setLastFetchParams({ userId, mailboxId, options });

      try {
        const response: WildDuckMessagesResponse =
          await WildDuckAPI.getMessages(userId, mailboxId, options);
        const messageList = response.results || [];
        setMessages(messageList);
        setTotalMessages(response.total || 0);
        setCurrentPage(response.page || 1);
        return messageList;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get messages';
        setError(errorMessage);
        setMessages([]);
        setTotalMessages(0);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getMessage = useCallback(
    async (
      userId: string,
      messageId: string
    ): Promise<WildDuckMessageResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await WildDuckAPI.getMessage(userId, messageId);
        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (
      userId: string,
      params: SendMessageParams
    ): Promise<{ success: boolean; id: string }> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class
        const response = await axios.post(
          `${WildDuckAPI['baseUrl']}/users/${userId}/submit`,
          params,
          {
            headers: WildDuckAPI['headers'],
          }
        );

        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateMessage = useCallback(
    async (
      userId: string,
      messageId: string,
      params: UpdateMessageParams
    ): Promise<{ success: boolean }> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class
        const response = await axios.put(
          `${WildDuckAPI['baseUrl']}/users/${userId}/messages/${messageId}`,
          params,
          {
            headers: WildDuckAPI['headers'],
          }
        );

        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteMessage = useCallback(
    async (
      userId: string,
      messageId: string
    ): Promise<{ success: boolean }> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class
        const response = await axios.delete(
          `${WildDuckAPI['baseUrl']}/users/${userId}/messages/${messageId}`,
          {
            headers: WildDuckAPI['headers'],
          }
        );

        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const moveMessage = useCallback(
    async (
      userId: string,
      messageId: string,
      targetMailbox: string
    ): Promise<{ success: boolean }> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class
        const response = await axios.put(
          `${WildDuckAPI['baseUrl']}/users/${userId}/messages/${messageId}/move`,
          { mailbox: targetMailbox },
          {
            headers: WildDuckAPI['headers'],
          }
        );

        return response.data;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to move message';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const searchMessages = useCallback(
    async (
      userId: string,
      query: string,
      options: GetMessagesOptions = {}
    ): Promise<WildDuckMessage[]> => {
      setIsLoading(true);
      setError(null);

      try {
        // This would need to be added to the WildDuckAPI class - search across all mailboxes
        const response = await axios.get(
          `${WildDuckAPI['baseUrl']}/users/${userId}/search?q=${encodeURIComponent(query)}&limit=${options.limit || 50}&page=${options.page || 1}`,
          {
            headers: WildDuckAPI['headers'],
          }
        );

        const messageList = response.data.results || [];
        setMessages(messageList);
        setTotalMessages(response.data.total || 0);
        setCurrentPage(response.data.page || 1);
        return messageList;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to search messages';
        setError(errorMessage);
        setMessages([]);
        setTotalMessages(0);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(async (): Promise<void> => {
    if (lastFetchParams) {
      await getMessages(
        lastFetchParams.userId,
        lastFetchParams.mailboxId,
        lastFetchParams.options
      );
    }
  }, [getMessages, lastFetchParams]);

  return {
    isLoading,
    error,
    messages,
    totalMessages,
    currentPage,
    getMessages,
    getMessage,
    sendMessage,
    updateMessage,
    deleteMessage,
    moveMessage,
    searchMessages,
    clearError,
    refresh,
  };
};
