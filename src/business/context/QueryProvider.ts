/**
 * TanStack Query setup and utilities
 *
 * This module provides the global query client and utilities for TanStack Query.
 */

import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from '@tanstack/react-query';
import { createQueryClient } from '../core/query/query-client';

// Global query client instance for consistency
let globalQueryClient: QueryClient | undefined;

/**
 * Get or create the global query client
 */
const getGlobalQueryClient = (): QueryClient => {
  if (!globalQueryClient) {
    globalQueryClient = createQueryClient();
  }
  return globalQueryClient;
};

/**
 * Re-export QueryClientProvider from TanStack Query for app setup
 *
 * Usage:
 * ```tsx
 * import { QueryClientProvider, getQueryClient } from '@johnqh/lib';
 *
 * function App() {
 *   return (
 *     <QueryClientProvider client={getQueryClient()}>
 *       <YourAppComponents />
 *     </QueryClientProvider>
 *   );
 * }
 * ```
 */
export { QueryClientProvider };

/**
 * Hook to access the query client directly
 * This is useful for programmatic cache operations
 */
export { useQueryClient };

/**
 * Export the global query client for use outside React components
 */
export const getQueryClient = getGlobalQueryClient;
