/**
 * Query system exports
 *
 * Re-exports all query-related functionality for easy importing
 */

export * from './query-client';
export * from './query-keys';

// Re-export TanStack Query hooks with platform compatibility
// Note: QueryClientProvider and useQueryClient are exported from context layer
export {
  useQuery,
  useQueries,
  useInfiniteQuery,
  useMutation,
  useIsFetching,
  useIsMutating,
  QueryClient,
} from '@tanstack/react-query';

// Types
export type {
  UseQueryOptions,
  UseQueryResult,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  QueryKey,
  QueryFunction,
  InfiniteData,
} from '@tanstack/react-query';
