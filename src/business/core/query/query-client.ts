/**
 * TanStack Query Client Configuration
 *
 * Configures global query behavior for caching, stale times, and retry logic.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Default stale times for different types of queries
 */
export const STALE_TIMES = {
  // Very stable data - rarely changes
  CAMPAIGNS: 5 * 60 * 1000, // 5 minutes
  HOW_TO_EARN: 10 * 60 * 1000, // 10 minutes

  // Moderately stable data
  PUBLIC_STATS: 2 * 60 * 1000, // 2 minutes
  SITE_STATS: 2 * 60 * 1000, // 2 minutes
  SOLANA_STATUS: 1 * 60 * 1000, // 1 minute

  // Dynamic data - changes frequently
  LEADERBOARD: 30 * 1000, // 30 seconds
  CAMPAIGN_STATS: 1 * 60 * 1000, // 1 minute

  // User-specific or contextual data
  SIGNING_MESSAGE: 5 * 60 * 1000, // 5 minutes (deterministic)
} as const;

/**
 * Create a configured QueryClient instance
 */
export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time - data is considered fresh for 1 minute
        staleTime: 1 * 60 * 1000,

        // Cache time - how long to keep data in cache after component unmount
        gcTime: 5 * 60 * 1000, // 5 minutes (was cacheTime in v4)

        // Retry configuration
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.statusCode >= 400 && error?.statusCode < 500) {
            return false;
          }

          // Retry up to 3 times for other errors
          return failureCount < 3;
        },

        // Retry delay with exponential backoff
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Background refetch settings
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,

        // Network settings
        networkMode: 'online',
      },
      mutations: {
        // Mutation retry logic
        retry: (failureCount, error: any) => {
          // Don't retry mutations on client errors
          if (error?.statusCode >= 400 && error?.statusCode < 500) {
            return false;
          }

          // Only retry once for mutations
          return failureCount < 1;
        },

        networkMode: 'online',
      },
    },
  });
};

/**
 * Global query client instance
 * Use this for accessing the query client outside of React components
 */
export let queryClient: QueryClient;

/**
 * Initialize the global query client
 * Call this once in your app setup
 */
export const initializeQueryClient = (): QueryClient => {
  queryClient = createQueryClient();
  return queryClient;
};

/**
 * Get the global query client instance
 * Throws an error if not initialized
 */
export const getQueryClient = (): QueryClient => {
  if (!queryClient) {
    throw new Error(
      'QueryClient not initialized. Call initializeQueryClient() first.'
    );
  }
  return queryClient;
};
