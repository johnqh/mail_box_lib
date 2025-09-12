/**
 * TanStack Query hooks for WildDuck API GET endpoints
 * 
 * These hooks replace custom fetching logic with TanStack Query's optimized caching.
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '../../core/query';
import { WildDuckAPI } from '../../../network/clients/wildduck';
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
  options?: UseQueryOptions<WildduckHealthResponse>
): UseQueryResult<WildduckHealthResponse> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.health(),
    queryFn: async (): Promise<WildduckHealthResponse> => {
      const response = await axios.get(`${WildDuckAPI['baseUrl']}/health`, {
        headers: WildDuckAPI['headers'],
      });
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
  filters?: Record<string, unknown>,
  options?: UseQueryOptions<WildduckUsersListResponse>
): UseQueryResult<WildduckUsersListResponse> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.usersList(filters),
    queryFn: async (): Promise<WildduckUsersListResponse> => {
      const params = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined) {
            params.set(key, String(value));
          }
        });
      }
      const response = await axios.get(
        `${WildDuckAPI['baseUrl']}/users?${params}`,
        {
          headers: WildDuckAPI['headers'],
        }
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
  userId: string,
  options?: UseQueryOptions<WildduckUser>
): UseQueryResult<WildduckUser> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.user(userId),
    queryFn: async (): Promise<WildduckUser> => {
      const response = await WildDuckAPI.getUser(userId);
      return {
        id: response.id,
        username: response.username,
        name: response.address || response.username,
        address: response.address || '',
        quota: {
          allowed: 0,
          used: 0,
        },
        storageUsed: 0,
        enabled: response.success || false,
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
  userId: string,
  options?: UseQueryOptions<WildduckAddress[]>
): UseQueryResult<WildduckAddress[]> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.userAddresses(userId),
    queryFn: async (): Promise<WildduckAddress[]> => {
      const response = await WildDuckAPI.getAddresses(userId);
      return response.results?.map(addr => ({
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
  userId: string,
  mailboxId: string,
  filters?: Record<string, unknown>,
  options?: UseQueryOptions<WildduckMessagesResponse>
): UseQueryResult<WildduckMessagesResponse> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.userMessages(userId, mailboxId, filters),
    queryFn: async (): Promise<WildduckMessagesResponse> => {
      const response = await WildDuckAPI.getMessages(userId, mailboxId);
      return {
        success: response.success,
        results: response.results.map(msg => ({
          id: msg.id,
          mailbox: msg.mailbox,
          thread: msg.thread || '',
          from: {
            name: msg.from?.name || '',
            address: msg.from?.address || ''
          },
          to: msg.to?.map(addr => ({
            name: addr.name || '',
            address: addr.address || ''
          })) || [],
          subject: msg.subject,
          date: msg.date,
          size: msg.size,
          flags: [],
        })),
        total: response.total,
        page: response.page,
        pages: Math.ceil(response.total / (response.results?.length || 1)),
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
  userId: string,
  messageId: string,
  options?: UseQueryOptions<WildduckMessage>
): UseQueryResult<WildduckMessage> => {
  
  return useQuery({
    queryKey: queryKeys.wildduck.message(userId, messageId),
    queryFn: async (): Promise<WildduckMessage> => {
      const response = await WildDuckAPI.getMessage(userId, messageId);
      return {
        id: response.id,
        mailbox: response.mailbox,
        thread: '',
        from: {
          name: response.from?.name || '',
          address: response.from?.address || ''
        },
        to: response.to?.map(addr => ({
          name: addr.name || '',
          address: addr.address || ''
        })) || [],
        subject: response.subject,
        date: response.date,
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
  userId: string,
  options?: UseQueryOptions<WildduckFilter[]>
): UseQueryResult<WildduckFilter[]> => {
  return useQuery({
    queryKey: queryKeys.wildduck.userFilters(userId),
    queryFn: async (): Promise<WildduckFilter[]> => {
      const response = await axios.get(`${WildDuckAPI['baseUrl']}/users/${userId}/filters`, {
        headers: WildDuckAPI['headers'],
      });
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
  userId: string,
  options?: UseQueryOptions<WildduckUserSettings>
): UseQueryResult<WildduckUserSettings> => {
  return useQuery({
    queryKey: queryKeys.wildduck.userSettings(userId),
    queryFn: async (): Promise<WildduckUserSettings> => {
      const response = await axios.get(`${WildDuckAPI['baseUrl']}/users/${userId}/settings`, {
        headers: WildDuckAPI['headers'],
      });
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