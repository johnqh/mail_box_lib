/**
 * TanStack Query hooks for WildDuck API GET endpoints
 * 
 * These hooks replace custom fetching logic with TanStack Query's optimized caching.
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../../core/query';
import { WildDuckConfig } from '../../../network/clients/wildduck';
import axios from 'axios';

// Define response types based on WildDuck API
interface WildduckHealthResponse {
  status: string;
  version: string;
  uptime: number;
  // Add other health response fields as needed
}

interface WildduckUser {
  id: string;
  username: string;
  name: string;
  address: string;
  quota: {
    allowed: number;
    used: number;
  };
  storageUsed: number;
  enabled: boolean;
  suspended: boolean;
  created: string;
  updated: string;
  // Add other user fields as needed
}

interface WildduckUsersListResponse {
  success: boolean;
  results: WildduckUser[];
  query: string;
  total: number;
  page: number;
  pages: number;
}

interface WildduckAddress {
  id: string;
  address: string;
  name: string;
  user: string;
  created: string;
  main: boolean;
  // Add other address fields
}

interface WildduckMessage {
  id: string;
  mailbox: string;
  thread: string;
  from: {
    name: string;
    address: string;
  };
  to: Array<{
    name: string;
    address: string;
  }>;
  subject: string;
  date: string;
  size: number;
  flags: string[];
  // Add other message fields
}

interface WildduckMessagesResponse {
  success: boolean;
  results: WildduckMessage[];
  total: number;
  page: number;
  pages: number;
}

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

/**
 * Hook to get WildDuck server health status
 */
const useWildduckHealth = (
  config: WildDuckConfig,
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

      const response = await axios.get(`${apiUrl}/health`, { headers });
      return response.data as WildduckHealthResponse;
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Hook to get users list with optional filters
 */
const useWildduckUsersList = (
  config: WildDuckConfig,
  filters?: Record<string, unknown>,
  options?: UseQueryOptions<WildduckUsersListResponse>
): UseQueryResult<WildduckUsersListResponse> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.usersList(filters),
    queryFn: async (): Promise<WildduckUsersListResponse> => {
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
      const response = await axios.get(
        `${apiUrl}/users?${params}`,
        { headers }
      );
      return response.data as WildduckUsersListResponse;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook to get a specific user by ID
 */
const useWildduckUser = (
  config: WildDuckConfig,
  userId: string,
  options?: UseQueryOptions<WildduckUser>
): UseQueryResult<WildduckUser> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.user(userId),
    queryFn: async (): Promise<WildduckUser> => {
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

      const response = await axios.get(`${apiUrl}/users/${userId}`, { headers });
      const userData = response.data as { success: boolean; id: string; username: string; address?: string };
      return {
        id: userData.id,
        username: userData.username,
        name: userData.address || userData.username,
        address: userData.address || '',
        quota: {
          allowed: 0,
          used: 0,
        },
        storageUsed: 0,
        enabled: userData.success || false,
        suspended: false,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
  options?: UseQueryOptions<WildduckAddress[]>
): UseQueryResult<WildduckAddress[]> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.userAddresses(userId),
    queryFn: async (): Promise<WildduckAddress[]> => {
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
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
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
  filters?: Record<string, unknown>,
  options?: UseQueryOptions<WildduckMessagesResponse>
): UseQueryResult<WildduckMessagesResponse> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.userMessages(userId, mailboxId, filters),
    queryFn: async (): Promise<WildduckMessagesResponse> => {
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

      const response = await axios.get(`${apiUrl}/users/${userId}/mailboxes/${mailboxId}/messages`, { headers });
      const messagesData = response.data as { success: boolean; results: any[]; total: number; page: number };
      return {
        success: messagesData.success,
        results: messagesData.results.map(msg => ({
          id: msg.id,
          mailbox: msg.mailbox,
          thread: msg.thread || '',
          from: {
            name: msg.from?.name || '',
            address: msg.from?.address || ''
          },
          to: msg.to?.map((addr: any) => ({
            name: addr.name || '',
            address: addr.address || ''
          })) || [],
          subject: msg.subject,
          date: msg.date,
          size: msg.size,
          flags: [],
        })),
        total: messagesData.total,
        page: messagesData.page,
        pages: Math.ceil(messagesData.total / (messagesData.results?.length || 1)),
      };
    },
    staleTime: 30 * 1000, // 30 seconds (messages change frequently)
    gcTime: 2 * 60 * 1000, // 2 minutes
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
  options?: UseQueryOptions<WildduckMessage>
): UseQueryResult<WildduckMessage> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.message(userId, messageId),
    queryFn: async (): Promise<WildduckMessage> => {
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

      const response = await axios.get(`${apiUrl}/users/${userId}/messages/${messageId}`, { headers });
      const messageData = response.data as any;
      return {
        id: messageData.id,
        mailbox: messageData.mailbox,
        thread: '',
        from: {
          name: messageData.from?.name || '',
          address: messageData.from?.address || ''
        },
        to: messageData.to?.map((addr: any) => ({
          name: addr.name || '',
          address: addr.address || ''
        })) || [],
        subject: messageData.subject,
        date: messageData.date,
        size: 0,
        flags: [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (specific messages don't change often)
    gcTime: 15 * 60 * 1000, // 15 minutes
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
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (filters change rarely)
    gcTime: 30 * 60 * 1000, // 30 minutes
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

      const response = await axios.get(`${apiUrl}/users/${userId}/settings`, { headers });
      const data = response.data as Record<string, unknown>;
      return data || {};
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!userId,
    ...options,
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
  type WildduckHealthResponse,
  type WildduckUser,
  type WildduckUsersListResponse,
  type WildduckAddress,
  type WildduckMessage,
  type WildduckMessagesResponse,
  type WildduckUserSettings,
  type WildduckFilter
};