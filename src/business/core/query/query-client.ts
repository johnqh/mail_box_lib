/**
 * TanStack Query Client Configuration
 *
 * Configures global query behavior for caching, stale times, and retry logic.
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * Default stale times for different types of queries
 */
const STALE_TIMES = {
  // Very stable data - rarely changes
  CAMPAIGNS: 5 * 60 * 1000, // 5 minutes
  HOW_TO_EARN: 10 * 60 * 1000, // 10 minutes
  USER_PROFILE: 5 * 60 * 1000, // 5 minutes (user data changes infrequently)
  MAILBOXES: 5 * 60 * 1000, // 5 minutes (mailbox structure is stable)

  // Moderately stable data
  PUBLIC_STATS: 2 * 60 * 1000, // 2 minutes
  SITE_STATS: 2 * 60 * 1000, // 2 minutes
  SOLANA_STATUS: 1 * 60 * 1000, // 1 minute
  EMAIL_ADDRESSES: 2 * 60 * 1000, // 2 minutes (addresses change occasionally)
  HEALTH_STATUS: 1 * 60 * 1000, // 1 minute

  // Dynamic data - changes frequently
  LEADERBOARD: 30 * 1000, // 30 seconds
  CAMPAIGN_STATS: 1 * 60 * 1000, // 1 minute
  MESSAGES: 30 * 1000, // 30 seconds (new emails arrive frequently)
  MESSAGE_CONTENT: 5 * 60 * 1000, // 5 minutes (message content is immutable)

  // User-specific or contextual data
  ADDRESS_VALIDATION: 10 * 60 * 1000, // 10 minutes (address format is deterministic)
  SIGNING_MESSAGE: 5 * 60 * 1000, // 5 minutes (deterministic)
  NAME_SERVICE_RESOLUTION: 5 * 60 * 1000, // 5 minutes (ENS/SNS resolution)
  INDEXER_EMAIL_ADDRESSES: 2 * 60 * 1000, // 2 minutes (indexer data)
  POINTS_BALANCE: 1 * 60 * 1000, // 1 minute (points can change frequently)
} as const;

/**
 * Create a configured QueryClient instance
 */
const createQueryClient = (): QueryClient => {
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
let queryClient: QueryClient;

/**
 * Initialize the global query client
 * Call this once in your app setup
 */
const initializeQueryClient = (): QueryClient => {
  queryClient = createQueryClient();
  return queryClient;
};

/**
 * Get the global query client instance
 * Throws an error if not initialized
 */
const getQueryClient = (): QueryClient => {
  if (!queryClient) {
    throw new Error(
      'QueryClient not initialized. Call initializeQueryClient() first.'
    );
  }
  return queryClient;
};

export {
  STALE_TIMES,
  createQueryClient,
  queryClient,
  initializeQueryClient,
  getQueryClient,
};
