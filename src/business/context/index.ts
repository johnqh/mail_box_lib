/**
 * React Context providers for business logic
 */

export {
  QueryClientProvider,
  useQueryClient,
  getQueryClient as getGlobalQueryClient,
} from './QueryProvider';

// Re-export common TanStack Query hooks
export {
  useQuery,
  useMutation,
  useInfiniteQuery,
  useQueries,
} from '@tanstack/react-query';

// Network connectivity context
export {
  NetworkProvider,
  useNetwork,
  type NetworkContextValue,
  type NetworkProviderProps,
} from './NetworkContext';
