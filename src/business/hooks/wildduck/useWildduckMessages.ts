import { useCallback, useState } from 'react';
import axios from 'axios';
import { WildDuckConfig } from '../../../network/clients/wildduck';
import type {
  GetMessageResponse,
  GetMessagesResponse,
  MessageData,
} from '../../../types/api/wildduck-responses';

interface GetMessagesOptions {
  limit?: number;
  page?: number;
  order?: 'asc' | 'desc';
  search?: string;
  thread?: string;
}

interface SendMessageParams {
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

interface UpdateMessageParams {
  seen?: boolean;
  flagged?: boolean;
  deleted?: boolean;
  mailbox?: string;
}

interface UseWildduckMessagesReturn {
  isLoading: boolean;
  error: string | null;
  messages: MessageData[];
  totalMessages: number;
  currentPage: number;
  getMessages: (
    userId: string,
    mailboxId: string,
    options?: GetMessagesOptions
  ) => Promise<MessageData[]>;
  getMessage: (
    userId: string,
    messageId: string
  ) => Promise<GetMessageResponse>;
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
  ) => Promise<MessageData[]>;
  clearError: () => void;
  refresh: () => Promise<void>;
}

/**
 * Hook for WildDuck message operations
 */
const useWildduckMessages = (config: WildDuckConfig): UseWildduckMessagesReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
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
    ): Promise<MessageData[]> => {
      setIsLoading(true);
      setError(null);
      setLastFetchParams({ userId, mailboxId, options });

      try {
        // Use config URLs and headers
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        if (config.cloudflareWorkerUrl) {
          headers['Authorization'] = `Bearer ${config.apiToken}`;
          headers['X-App-Source'] = '0xmail-box';
        } else {
          headers['X-Access-Token'] = config.apiToken;
        }

        const queryParams = new URLSearchParams();
        if (options.limit) queryParams.append('limit', options.limit.toString());
        if (options.page) queryParams.append('page', options.page.toString());
        if (options.order) queryParams.append('order', options.order);

        const query = queryParams.toString();
        const endpoint = `/users/${userId}/mailboxes/${mailboxId}/messages${query ? `?${query}` : ''}`;

        const response = await axios.get(`${apiUrl}${endpoint}`, { headers });
        const messageData = response.data as GetMessagesResponse;
        const messageList = messageData.results || [];
        setMessages(messageList);
        setTotalMessages(messageData.total || 0);
        setCurrentPage(messageData.page || 1);
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
    ): Promise<GetMessageResponse> => {
      setIsLoading(true);
      setError(null);

      try {
        // Use config URLs and headers
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        if (config.cloudflareWorkerUrl) {
          headers['Authorization'] = `Bearer ${config.apiToken}`;
          headers['X-App-Source'] = '0xmail-box';
        } else {
          headers['X-Access-Token'] = config.apiToken;
        }

        const response = await axios.get(
          `${apiUrl}/users/${userId}/messages/${messageId}`,
          { headers }
        );

        return response.data as GetMessageResponse;
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
        // Use config URLs and headers
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        if (config.cloudflareWorkerUrl) {
          headers['Authorization'] = `Bearer ${config.apiToken}`;
          headers['X-App-Source'] = '0xmail-box';
        } else {
          headers['X-Access-Token'] = config.apiToken;
        }

        const response = await axios.post(
          `${apiUrl}/users/${userId}/submit`,
          params,
          { headers }
        );

        return response.data as { success: boolean; id: string };
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
        // Use config URLs and headers
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        if (config.cloudflareWorkerUrl) {
          headers['Authorization'] = `Bearer ${config.apiToken}`;
          headers['X-App-Source'] = '0xmail-box';
        } else {
          headers['X-Access-Token'] = config.apiToken;
        }

        const response = await axios.put(
          `${apiUrl}/users/${userId}/messages/${messageId}`,
          params,
          { headers }
        );

        return response.data as { success: boolean };
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
        // Use config URLs and headers
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        if (config.cloudflareWorkerUrl) {
          headers['Authorization'] = `Bearer ${config.apiToken}`;
          headers['X-App-Source'] = '0xmail-box';
        } else {
          headers['X-Access-Token'] = config.apiToken;
        }

        const response = await axios.delete(
          `${apiUrl}/users/${userId}/messages/${messageId}`,
          { headers }
        );

        return response.data as { success: boolean };
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
        // Use config URLs and headers
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        if (config.cloudflareWorkerUrl) {
          headers['Authorization'] = `Bearer ${config.apiToken}`;
          headers['X-App-Source'] = '0xmail-box';
        } else {
          headers['X-Access-Token'] = config.apiToken;
        }

        const response = await axios.put(
          `${apiUrl}/users/${userId}/messages/${messageId}/move`,
          { mailbox: targetMailbox },
          { headers }
        );

        return response.data as { success: boolean };
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
    ): Promise<MessageData[]> => {
      setIsLoading(true);
      setError(null);

      try {
        // Use config URLs and headers
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        };

        if (config.cloudflareWorkerUrl) {
          headers['Authorization'] = `Bearer ${config.apiToken}`;
          headers['X-App-Source'] = '0xmail-box';
        } else {
          headers['X-Access-Token'] = config.apiToken;
        }

        const response = await axios.get(
          `${apiUrl}/users/${userId}/search?q=${encodeURIComponent(query)}&limit=${options.limit || 50}&page=${options.page || 1}`,
          { headers }
        );

        const searchResponse = response.data as { results?: MessageData[], total?: number, page?: number };
        const messageList = searchResponse.results || [];
        setMessages(messageList);
        setTotalMessages(searchResponse.total || 0);
        setCurrentPage(searchResponse.page || 1);
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

export {
  useWildduckMessages,
  type GetMessagesOptions,
  type SendMessageParams,
  // type UpdateMessageParams, // Moved to shared types
  type UseWildduckMessagesReturn
};