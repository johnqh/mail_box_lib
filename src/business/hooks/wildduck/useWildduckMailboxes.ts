import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { WildDuckConfig } from '../../../network/clients/wildduck';
import type {
  GetMailboxesResponse,
  MailboxData,
} from '../../../types/api/wildduck-responses';
import type {
  CreateMailboxRequest,
  GetMailboxesRequest,
  Optional,
  UpdateMailboxRequest,
} from '@johnqh/types';
import { WildDuckMockData } from './mocks';

interface UseWildduckMailboxesReturn {
  // Query state
  mailboxes: MailboxData[];
  isLoading: boolean;
  error: Optional<string>;

  // Query functions
  getMailboxes: (
    userId: string,
    options?: Omit<GetMailboxesRequest, 'sess' | 'ip'>
  ) => Promise<MailboxData[]>;
  refresh: (userId: string) => Promise<void>;

  // Mutations
  createMailbox: (
    userId: string,
    params: Omit<CreateMailboxRequest, 'sess' | 'ip'>
  ) => Promise<{ success: boolean; id: string }>;
  isCreating: boolean;
  createError: Optional<Error>;

  updateMailbox: (
    userId: string,
    mailboxId: string,
    params: Omit<UpdateMailboxRequest, 'sess' | 'ip'>
  ) => Promise<{ success: boolean }>;
  isUpdating: boolean;
  updateError: Optional<Error>;

  deleteMailbox: (
    userId: string,
    mailboxId: string
  ) => Promise<{ success: boolean }>;
  isDeleting: boolean;
  deleteError: Optional<Error>;

  // Legacy compatibility
  clearError: () => void;
}

/**
 * Hook for WildDuck mailbox operations using React Query
 * Queries are cached and automatically refetched, mutations invalidate related queries
 */
const useWildduckMailboxes = (config: WildDuckConfig, devMode: boolean = false): UseWildduckMailboxesReturn => {
  const queryClient = useQueryClient();

  // Helper to build headers
  const buildHeaders = (): Record<string, string> => {
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

    return headers;
  };

  // Get mailboxes query (not auto-fetched, only when explicitly called)
  const getMailboxes = async (
    userId: string,
    options: {
      specialUse?: Optional<boolean>;
      showHidden?: Optional<boolean>;
      counters?: Optional<boolean>;
      sizes?: Optional<boolean>;
    } = {}
  ): Promise<MailboxData[]> => {
    try {
      const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
      const headers = buildHeaders();

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

      // Update cache
      queryClient.setQueryData(['wildduck-mailboxes', userId], mailboxList);

      return mailboxList;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to get mailboxes';

      // Return mock data in devMode when API fails
      if (devMode) {
        console.warn('[DevMode] Get mailboxes failed, returning mock data:', errorMessage);
        const mockData = WildDuckMockData.getMailboxes();
        const mockMailboxes = mockData.data.mailboxes as unknown as MailboxData[];

        // Update cache with mock data
        queryClient.setQueryData(['wildduck-mailboxes', userId], mockMailboxes);

        return mockMailboxes;
      }

      throw new Error(errorMessage);
    }
  };

  // Get cached mailboxes from query cache (used for reading state)
  const cachedMailboxes = queryClient.getQueryData<MailboxData[]>(['wildduck-mailboxes']) || [];

  // Create mailbox mutation
  const createMutation = useMutation({
    mutationKey: ['wildduck-create-mailbox', config.cloudflareWorkerUrl || config.backendUrl],
    mutationFn: async ({
      userId,
      params,
    }: {
      userId: string;
      params: Omit<CreateMailboxRequest, 'sess' | 'ip'>;
    }): Promise<{ success: boolean; id: string }> => {
      try {
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        const headers = buildHeaders();

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

        // Return mock data in devMode when API fails
        if (devMode) {
          console.warn('[DevMode] Create mailbox failed, returning mock success:', errorMessage);
          return WildDuckMockData.getCreateMailbox();
        }

        throw new Error(errorMessage);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate mailboxes query to refetch
      queryClient.invalidateQueries({ queryKey: ['wildduck-mailboxes', variables.userId] });
    },
  });

  // Update mailbox mutation
  const updateMutation = useMutation({
    mutationKey: ['wildduck-update-mailbox', config.cloudflareWorkerUrl || config.backendUrl],
    mutationFn: async ({
      userId,
      mailboxId,
      params,
    }: {
      userId: string;
      mailboxId: string;
      params: Omit<UpdateMailboxRequest, 'sess' | 'ip'>;
    }): Promise<{ success: boolean }> => {
      try {
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        const headers = buildHeaders();

        const response = await axios.put(
          `${apiUrl}/users/${userId}/mailboxes/${mailboxId}`,
          params,
          { headers }
        );

        return response.data as { success: boolean };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update mailbox';

        // Return mock data in devMode when API fails
        if (devMode) {
          console.warn('[DevMode] Update mailbox failed, returning mock success:', errorMessage);
          return WildDuckMockData.getUpdateMailbox();
        }

        throw new Error(errorMessage);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate mailboxes query to refetch
      queryClient.invalidateQueries({ queryKey: ['wildduck-mailboxes', variables.userId] });
    },
  });

  // Delete mailbox mutation
  const deleteMutation = useMutation({
    mutationKey: ['wildduck-delete-mailbox', config.cloudflareWorkerUrl || config.backendUrl],
    mutationFn: async ({
      userId,
      mailboxId,
    }: {
      userId: string;
      mailboxId: string;
    }): Promise<{ success: boolean }> => {
      try {
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        const headers = buildHeaders();

        const response = await axios.delete(
          `${apiUrl}/users/${userId}/mailboxes/${mailboxId}`,
          { headers }
        );

        return response.data as { success: boolean };
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete mailbox';

        // Return mock data in devMode when API fails
        if (devMode) {
          console.warn('[DevMode] Delete mailbox failed, returning mock success:', errorMessage);
          return WildDuckMockData.getDeleteMailbox();
        }

        throw new Error(errorMessage);
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate mailboxes query to refetch
      queryClient.invalidateQueries({ queryKey: ['wildduck-mailboxes', variables.userId] });
    },
  });

  // Refresh function (refetch with counters)
  const refresh = async (userId: string): Promise<void> => {
    await getMailboxes(userId, { counters: true });
  };

  // Aggregate loading and error states for legacy compatibility
  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const error: Optional<string> =
    createMutation.error?.message ||
    updateMutation.error?.message ||
    deleteMutation.error?.message ||
    null;

  return {
    // Query state
    mailboxes: cachedMailboxes,
    isLoading,
    error,

    // Query functions
    getMailboxes,
    refresh,

    // Create mutation
    createMailbox: async (userId: string, params: Omit<CreateMailboxRequest, 'sess' | 'ip'>) =>
      createMutation.mutateAsync({ userId, params }),
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update mutation
    updateMailbox: async (
      userId: string,
      mailboxId: string,
      params: Omit<UpdateMailboxRequest, 'sess' | 'ip'>
    ) => updateMutation.mutateAsync({ userId, mailboxId, params }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete mutation
    deleteMailbox: async (userId: string, mailboxId: string) =>
      deleteMutation.mutateAsync({ userId, mailboxId }),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Legacy compatibility
    clearError: () => {
      createMutation.reset();
      updateMutation.reset();
      deleteMutation.reset();
    },
  };
};

export {
  useWildduckMailboxes,
  type UseWildduckMailboxesReturn,
};
