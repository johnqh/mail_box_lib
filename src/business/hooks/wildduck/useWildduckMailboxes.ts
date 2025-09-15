import { useCallback, useState } from 'react';
import axios from 'axios';
import { WildDuckConfig } from '../../../network/clients/wildduck';
import type {
  GetMailboxesResponse,
  MailboxData,
} from '../../../types/api/wildduck-responses';
import type {
  CreateMailboxRequest,
  GetMailboxesRequest,
  UpdateMailboxRequest,
} from '@johnqh/types';

interface UseWildduckMailboxesReturn {
  isLoading: boolean;
  error: string | null;
  mailboxes: MailboxData[];
  getMailboxes: (
    userId: string,
    options?: Omit<GetMailboxesRequest, 'sess' | 'ip'>
  ) => Promise<MailboxData[]>;
  createMailbox: (
    userId: string,
    params: Omit<CreateMailboxRequest, 'sess' | 'ip'>
  ) => Promise<{ success: boolean; id: string }>;
  updateMailbox: (
    userId: string,
    mailboxId: string,
    params: Omit<UpdateMailboxRequest, 'sess' | 'ip'>
  ) => Promise<{ success: boolean }>;
  deleteMailbox: (
    userId: string,
    mailboxId: string
  ) => Promise<{ success: boolean }>;
  clearError: () => void;
  refresh: (userId: string) => Promise<void>;
}

/**
 * Hook for WildDuck mailbox operations
 */
const useWildduckMailboxes = (config: WildDuckConfig): UseWildduckMailboxesReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mailboxes, setMailboxes] = useState<MailboxData[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getMailboxes = useCallback(
    async (userId: string, options: {
      specialUse?: boolean;
      showHidden?: boolean;
      counters?: boolean;
      sizes?: boolean;
    } = {}): Promise<MailboxData[]> => {
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

        const queryParams = new URLSearchParams();
        if (options.specialUse) queryParams.append('specialUse', 'true');
        if (options.showHidden) queryParams.append('showHidden', 'true');
        if (options.counters) queryParams.append('counters', 'true');
        if (options.sizes) queryParams.append('sizes', 'true');

        const query = queryParams.toString();
        const endpoint = `/users/${userId}/mailboxes${query ? `?${query}` : ''}`;

        const response = await axios.get(`${apiUrl}${endpoint}`, { headers });
        const mailboxData = response.data as GetMailboxesResponse;
        const mailboxList = mailboxData.results || [];
        setMailboxes(mailboxList);
        return mailboxList;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get mailboxes';
        setError(errorMessage);
        setMailboxes([]);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const createMailbox = useCallback(
    async (
      userId: string,
      params: Omit<CreateMailboxRequest, 'sess' | 'ip'>
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
          `${apiUrl}/users/${userId}/mailboxes`,
          {
            path: params.path,
            hidden: params.hidden,
            retention: params.retention,
          },
          { headers }
        );

        return response.data as { success: boolean; id: string };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create mailbox';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateMailbox = useCallback(
    async (
      userId: string,
      mailboxId: string,
      params: Omit<UpdateMailboxRequest, 'sess' | 'ip'>
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
          `${apiUrl}/users/${userId}/mailboxes/${mailboxId}`,
          params,
          { headers }
        );

        return response.data as { success: boolean };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update mailbox';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteMailbox = useCallback(
    async (
      userId: string,
      mailboxId: string
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
          `${apiUrl}/users/${userId}/mailboxes/${mailboxId}`,
          { headers }
        );

        return response.data as { success: boolean };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete mailbox';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refresh = useCallback(
    async (userId: string): Promise<void> => {
      await getMailboxes(userId, { counters: true });
    },
    [getMailboxes]
  );

  return {
    isLoading,
    error,
    mailboxes,
    getMailboxes,
    createMailbox,
    updateMailbox,
    deleteMailbox,
    clearError,
    refresh,
  };
};

export {
  useWildduckMailboxes,
  type UseWildduckMailboxesReturn,
};