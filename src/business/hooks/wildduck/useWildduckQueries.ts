/**
 * TanStack Query hooks for WildDuck API GET endpoints
 * 
 * These hooks replace custom fetching logic with TanStack Query's optimized caching.
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, STALE_TIMES } from '../../core/query';
import { WildDuckConfig } from '../../../network/clients/wildduck';
import type {
  AddressData,
  GetMailboxesResponse,
  GetMessagesResponse,
  GetUsersResponse,
  MessageData,
  WildDuckUserData,
} from '../../../types/api/wildduck-responses';
import axios from 'axios';
import { WildDuckMockData } from './mocks';

// Define response types based on WildDuck API
interface WildduckHealthResponse {
  status: string;
  version: string;
  uptime: number;
  // Add other health response fields as needed
}

// Using WildDuckUserData from wildduck-responses.ts

// Using GetUsersResponse from wildduck-responses.ts

// Using AddressData from wildduck-responses.ts
// Using MessageData from wildduck-responses.ts  
// Using GetMessagesResponse from wildduck-responses.ts

interface WildduckUserSettings {
  // Define based on actual API response
  [key: string]: unknown;
}

interface WildduckFilter {
  id: string;
  name: string;
  query: object;
  action: object;
  disabled: boolean;
  created: string;
  // Add other filter fields
}

// Using MailboxData from wildduck-responses.ts
// Using GetMailboxesResponse from wildduck-responses.ts

interface WildduckAuthStatusResponse {
  success: boolean;
  user?: {
    id: string;
    username: string;
    address?: string;
  };
  authenticated: boolean;
}

/**
 * Hook to get WildDuck server health status
 */
const useWildduckHealth = (
  config: WildDuckConfig,
  devMode: boolean = false,
  options?: UseQueryOptions<WildduckHealthResponse>
): UseQueryResult<WildduckHealthResponse> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.health(),
    queryFn: async (): Promise<WildduckHealthResponse> => {
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

      try {
        const response = await axios.get(`${apiUrl}/health`, { headers });
        return response.data as WildduckHealthResponse;
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] Health check failed, returning mock data:', err);
          return WildDuckMockData.getHealthQuery();
        }
        throw err;
      }
    },
    staleTime: STALE_TIMES.HEALTH_STATUS,
    ...options,
  });
};

/**
 * Hook to get users list with optional filters
 */
const useWildduckUsersList = (
  config: WildDuckConfig,
  devMode: boolean = false,
  filters?: Record<string, unknown>,
  options?: UseQueryOptions<GetUsersResponse>
): UseQueryResult<GetUsersResponse> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.usersList(filters),
    queryFn: async (): Promise<GetUsersResponse> => {
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

      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }
      try {
        const response = await axios.get(
          `${apiUrl}/users?${params}`,
          { headers }
        );
        return response.data as GetUsersResponse;
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] Get users list failed, returning mock data:', err);
          return WildDuckMockData.getUsersListQuery() as unknown as GetUsersResponse;
        }
        throw err;
      }
    },
    staleTime: STALE_TIMES.USER_PROFILE,
    ...options,
  });
};

/**
 * Hook to get a specific user by ID
 */
const useWildduckUser = (
  config: WildDuckConfig,
  userId: string,
  devMode: boolean = false,
  options?: UseQueryOptions<WildDuckUserData>
): UseQueryResult<WildDuckUserData> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.user(userId),
    queryFn: async (): Promise<WildDuckUserData> => {
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

      try {
        const response = await axios.get(`${apiUrl}/users/${userId}`, { headers });
        const userData = response.data as { success: boolean; id: string; username: string; address?: string };
        return {
          id: userData.id,
          username: userData.username,
          name: userData.address || userData.username,
          tags: [],
          targets: [],
          autoreply: false,
          encryptMessages: false,
          encryptForwarded: false,
          quota: {
            allowed: 0,
            used: 0,
          },
          metaData: {},
          internalData: {},
          hasBlockchainAuth: true,
          activated: userData.success || false,
          disabled: false,
          suspended: false,
        };
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] Get user failed, returning mock data:', err);
          return WildDuckMockData.getUserQuery(userId) as WildDuckUserData;
        }
        throw err;
      }
    },
    staleTime: STALE_TIMES.USER_PROFILE,
    enabled: !!userId,
    ...options,
  });
};

/**
 * Hook to get user addresses
 */
const useWildduckUserAddresses = (
  config: WildDuckConfig,
  userId: string,
  devMode: boolean = false,
  options?: UseQueryOptions<AddressData[]>
): UseQueryResult<AddressData[]> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.userAddresses(userId),
    queryFn: async (): Promise<AddressData[]> => {
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

      try {
        const response = await axios.get(`${apiUrl}/users/${userId}/addresses`, { headers });
        const addressData = response.data as { success: boolean; results: Array<{ id: string; address: string; main: boolean }> };
        return addressData.results?.map(addr => ({
          id: addr.id,
          address: addr.address,
          name: addr.address,
          user: userId,
          created: new Date().toISOString(),
          main: addr.main,
        })) || [];
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] Get user addresses failed, returning mock data:', err);
          const mockData = WildDuckMockData.getUserAddressesQuery();
          return mockData.addresses as AddressData[];
        }
        throw err;
      }
    },
    staleTime: STALE_TIMES.EMAIL_ADDRESSES,
    enabled: !!userId,
    ...options,
  });
};

/**
 * Hook to get user messages with optional filters
 */
const useWildduckUserMessages = (
  config: WildDuckConfig,
  userId: string,
  mailboxId: string,
  devMode: boolean = false,
  filters?: Record<string, unknown>,
  options?: UseQueryOptions<GetMessagesResponse>
): UseQueryResult<GetMessagesResponse> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.userMessages(userId, mailboxId, filters),
    queryFn: async (): Promise<GetMessagesResponse> => {
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

      try {
        const response = await axios.get(`${apiUrl}/users/${userId}/mailboxes/${mailboxId}/messages`, { headers });
        const messagesData = response.data as { success: boolean; results: any[]; total: number; page: number };
        return {
          success: messagesData.success as true,
          total: messagesData.total,
          page: messagesData.page,
          previousCursor: false,
          nextCursor: false,
          results: messagesData.results.map(msg => ({
            id: msg.id,
            mailbox: msg.mailbox,
            thread: msg.thread || '',
            envelope: {
              date: msg.date || '',
              subject: msg.subject || '',
              from: msg.from ? [{ name: msg.from.name || '', address: msg.from.address || '' }] : [],
              to: msg.to?.map((addr: any) => ({ name: addr.name || '', address: addr.address || '' })) || [],
              messageId: msg.id || '',
            },
            date: msg.date || '',
            idate: msg.date || '',
            size: msg.size || 0,
            intro: msg.intro || '',
            attachments: msg.attachments || false,
            seen: msg.seen || false,
            deleted: msg.deleted || false,
            flagged: msg.flagged || false,
            draft: msg.draft || false,
            answered: msg.answered || false,
            forwarded: msg.forwarded || false,
            references: msg.references || [],
          })) as MessageData[],
        };
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] Get user messages failed, returning mock data:', err);
          return WildDuckMockData.getUserMessagesQuery() as unknown as GetMessagesResponse;
        }
        throw err;
      }
    },
    staleTime: STALE_TIMES.MESSAGES,
    enabled: !!(userId && mailboxId),
    ...options,
  });
};

/**
 * Hook to get a specific message
 */
const useWildduckMessage = (
  config: WildDuckConfig,
  userId: string,
  messageId: string,
  devMode: boolean = false,
  options?: UseQueryOptions<MessageData>
): UseQueryResult<MessageData> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.message(userId, messageId),
    queryFn: async (): Promise<MessageData> => {
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

      try {
        const response = await axios.get(`${apiUrl}/users/${userId}/messages/${messageId}`, { headers });
        const messageData = response.data as any;
        return {
          id: messageData.id,
          mailbox: messageData.mailbox,
          thread: messageData.thread || '',
          envelope: {
            date: messageData.date || '',
            subject: messageData.subject || '',
            from: messageData.from ? [{ name: messageData.from.name || '', address: messageData.from.address || '' }] : [],
            to: messageData.to?.map((addr: any) => ({ name: addr.name || '', address: addr.address || '' })) || [],
            messageId: messageData.id || '',
          },
          date: messageData.date || '',
          idate: messageData.date || '',
          size: messageData.size || 0,
          intro: messageData.intro || '',
          attachments: messageData.attachments || false,
          seen: messageData.seen || false,
          deleted: messageData.deleted || false,
          flagged: messageData.flagged || false,
          draft: messageData.draft || false,
          answered: messageData.answered || false,
          forwarded: messageData.forwarded || false,
          references: messageData.references || [],
        };
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] Get message failed, returning mock data:', err);
          return WildDuckMockData.getMessageQuery(messageId, userId) as MessageData;
        }
        throw err;
      }
    },
    staleTime: STALE_TIMES.MESSAGE_CONTENT,
    enabled: !!(userId && messageId),
    ...options,
  });
};

/**
 * Hook to get user filters
 * Note: getUserFilters method not yet implemented in WildDuckAPI
 */
const useWildduckUserFilters = (
  config: WildDuckConfig,
  userId: string,
  devMode: boolean = false,
  options?: UseQueryOptions<WildduckFilter[]>
): UseQueryResult<WildduckFilter[]> => {
  return useQuery({
    queryKey: queryKeys.wildduck.userFilters(userId),
    queryFn: async (): Promise<WildduckFilter[]> => {
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

      try {
        const response = await axios.get(`${apiUrl}/users/${userId}/filters`, { headers });
        const data = response.data as { results?: any[] };
        return data.results?.map(filter => ({
          id: filter.id || '',
          name: filter.name || '',
          query: filter.query || {},
          action: filter.action || {},
          disabled: filter.disabled || false,
          created: filter.created || new Date().toISOString(),
        })) || [];
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] Get user filters failed, returning mock data:', err);
          const mockData = WildDuckMockData.getUserFiltersQuery();
          return mockData.filters as WildduckFilter[];
        }
        throw err;
      }
    },
    staleTime: STALE_TIMES.USER_PROFILE, // Filters are part of user profile data
    enabled: !!userId,
    ...options,
  });
};

/**
 * Hook to get user settings
 * Note: getUserSettings method not yet implemented in WildDuckAPI
 */
const useWildduckUserSettings = (
  config: WildDuckConfig,
  userId: string,
  devMode: boolean = false,
  options?: UseQueryOptions<WildduckUserSettings>
): UseQueryResult<WildduckUserSettings> => {
  return useQuery({
    queryKey: queryKeys.wildduck.userSettings(userId),
    queryFn: async (): Promise<WildduckUserSettings> => {
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

      try {
        const response = await axios.get(`${apiUrl}/users/${userId}/settings`, { headers });
        const data = response.data as Record<string, unknown>;
        return data || {};
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] Get user settings failed, returning mock data:', err);
          const mockData = WildDuckMockData.getUserSettingsQuery();
          return mockData.settings as WildduckUserSettings;
        }
        throw err;
      }
    },
    staleTime: STALE_TIMES.USER_PROFILE, // Settings are part of user profile data
    enabled: !!userId,
    ...options,
  });
};

/**
 * Hook to get user mailboxes
 */
const useWildduckUserMailboxes = (
  config: WildDuckConfig,
  userId: string,
  devMode: boolean = false,
  options?: {
    specialUse?: boolean;
    showHidden?: boolean;
    counters?: boolean;
    sizes?: boolean;
  },
  queryOptions?: UseQueryOptions<GetMailboxesResponse>
): UseQueryResult<GetMailboxesResponse> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.userMailboxes(userId, options),
    queryFn: async (): Promise<GetMailboxesResponse> => {
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

      const params = new URLSearchParams();
      if (options?.specialUse) params.set('specialUse', 'true');
      if (options?.showHidden) params.set('showHidden', 'true');
      if (options?.counters) params.set('counters', 'true');
      if (options?.sizes) params.set('sizes', 'true');

      const queryString = params.toString();
      const endpoint = `${apiUrl}/users/${userId}/mailboxes${queryString ? `?${queryString}` : ''}`;

      try {
        const response = await axios.get(endpoint, { headers });
        return response.data as GetMailboxesResponse;
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] Get user mailboxes failed, returning mock data:', err);
          const mockData = WildDuckMockData.getUserMailboxesQuery();
          return { success: true, results: mockData.mailboxes } as unknown as GetMailboxesResponse;
        }
        throw err;
      }
    },
    staleTime: STALE_TIMES.MAILBOXES,
    enabled: !!userId,
    ...queryOptions,
  });
};

/**
 * Hook to check authentication status
 */
const useWildduckAuthStatus = (
  config: WildDuckConfig,
  token?: string,
  devMode: boolean = false,
  queryOptions?: UseQueryOptions<WildduckAuthStatusResponse>
): UseQueryResult<WildduckAuthStatusResponse> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.authStatus(token),
    queryFn: async (): Promise<WildduckAuthStatusResponse> => {
      const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };

      if (config.cloudflareWorkerUrl) {
        headers['Authorization'] = `Bearer ${token || config.apiToken}`;
        headers['X-App-Source'] = '0xmail-box';
      } else {
        headers['X-Access-Token'] = token || config.apiToken;
      }

      try {
        const httpResponse = await axios.get(`${apiUrl}/users/me`, { headers });
        const data = httpResponse.data as { success: boolean; id?: string; username?: string; address?: string };
        
        const response: WildduckAuthStatusResponse = {
          success: data.success,
          authenticated: data.success,
        };

        if (data.success && (data.id || data.username)) {
          const user: { id: string; username: string; address?: string } = {
            id: data.id || '',
            username: data.username || '',
          };
          if (data.address) {
            user.address = data.address;
          }
          response.user = user;
        }

        return response;
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] Auth status check failed, returning mock data:', err);
          return WildDuckMockData.getAuthStatusQuery() as WildduckAuthStatusResponse;
        }
        throw err;
      }
    },
    staleTime: STALE_TIMES.USER_PROFILE,
    enabled: !!token || !!config.apiToken,
    ...queryOptions,
  });
};

/**
 * Hook to search messages
 */
const useWildduckSearchMessages = (
  config: WildDuckConfig,
  userId: string,
  mailboxId: string,
  query: string,
  devMode: boolean = false,
  searchOptions?: Record<string, unknown>,
  queryOptions?: UseQueryOptions<GetMessagesResponse>
): UseQueryResult<GetMessagesResponse> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.searchMessages(userId, mailboxId, query, searchOptions),
    queryFn: async (): Promise<GetMessagesResponse> => {
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

      const params = new URLSearchParams();
      params.set('q', query);
      if (searchOptions) {
        Object.entries(searchOptions).forEach(([key, value]) => {
          if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }

      try {
        const response = await axios.get(
          `${apiUrl}/users/${userId}/mailboxes/${mailboxId}/messages?${params}`,
          { headers }
        );
        return response.data as GetMessagesResponse;
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] Search messages failed, returning mock data:', err);
          return WildDuckMockData.getSearchMessagesQuery() as unknown as GetMessagesResponse;
        }
        throw err;
      }
    },
    staleTime: STALE_TIMES.MESSAGES,
    enabled: !!(userId && mailboxId && query),
    ...queryOptions,
  });
};

export {
  useWildduckHealth,
  useWildduckUsersList,
  useWildduckUser,
  useWildduckUserAddresses,
  useWildduckUserMessages,
  useWildduckMessage,
  useWildduckUserFilters,
  useWildduckUserSettings,
  useWildduckUserMailboxes,
  useWildduckAuthStatus,
  useWildduckSearchMessages,
  type WildduckHealthResponse,
  type WildduckUserSettings,
  type WildduckFilter,
  type WildduckAuthStatusResponse
};