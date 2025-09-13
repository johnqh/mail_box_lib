/**
 * AI-Friendly React Hook Template
 * 
 * Instructions for AI assistants:
 * 1. Replace {{HOOK_NAME}} with the actual hook name (e.g., useWalletBalance)
 * 2. Replace {{SERVICE_TYPE}} with the service interface name
 * 3. Replace {{RETURN_TYPE}} with the hook's return interface
 * 4. Add specific parameters and business logic as needed
 * 5. Update imports to match actual dependencies
 * 6. Add JSDoc with usage examples
 * 
 * Pattern: Custom hook with async operations, loading states, and error handling
 */

import { useCallback, useEffect, useState } from 'react';
import { {{SERVICE_TYPE}} } from '../../../types/services/{{service-name}}.interface';

/**
 * Hook return interface
 * Define all return values with proper TypeScript types
 */
export interface {{RETURN_TYPE}} {
  /** Current data state */
  data: {{DATA_TYPE}} | null;
  /** Loading state indicator */
  isLoading: boolean;
  /** Error state (null when no error) */
  error: Error | null;
  /** Refetch function to reload data */
  refetch: () => Promise<void>;
  /** Clear error state */
  clearError: () => void;
}

/**
 * {{HOOK_NAME}} - Brief description of what this hook does
 * 
 * @param service - Service instance for data operations
 * @param options - Optional configuration parameters
 * @returns Hook interface with data, loading, error states and actions
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const service = useServiceInstance();
 *   const { data, isLoading, error, refetch } = {{HOOK_NAME}}(service);
 * 
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 * 
 *   return (
 *     <div>
 *       <pre>{JSON.stringify(data, null, 2)}</pre>
 *       <button onClick={refetch}>Refresh</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const {{HOOK_NAME}} = (
  service: {{SERVICE_TYPE}},
  options?: {{OPTIONS_TYPE}}
): {{RETURN_TYPE}} => {
  // State management
  const [data, setData] = useState<{{DATA_TYPE}} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Main data fetching function
  const fetchData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual service call
      const result = await service.getData(options);
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(errorMessage);
      console.error('{{HOOK_NAME}} error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [service, options]);

  // Refetch function (exposed to consumers)
  const refetch = useCallback(async (): Promise<void> => {
    await fetchData();
  }, [fetchData]);

  // Initial data loading
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    clearError,
  };
};

/**
 * AI Instructions for customization:
 * 
 * 1. Data Flow Patterns:
 *    - For simple GET requests: Use the template as-is
 *    - For cached data: Add caching logic in fetchData
 *    - For real-time data: Add WebSocket or polling in useEffect
 *    - For form data: Add additional state for form values
 * 
 * 2. Error Handling Patterns:
 *    - Network errors: Handle in catch block with retry logic
 *    - Validation errors: Add separate validation state
 *    - Business logic errors: Handle with specific error types
 * 
 * 3. Loading State Patterns:
 *    - Initial loading: Use isLoading state
 *    - Refetch loading: Add isFetching state if needed
 *    - Background loading: Use separate isRefreshing state
 * 
 * 4. Common Modifications:
 *    - Add pagination: Include page state and pagination methods
 *    - Add search/filtering: Include filter state and filter methods
 *    - Add optimistic updates: Update data immediately, revert on error
 *    - Add mutations: Include separate loading/error states for mutations
 * 
 * 5. Testing Patterns:
 *    - Mock the service dependency
 *    - Test loading, success, and error states
 *    - Test refetch functionality
 *    - Use renderHook from @testing-library/react
 * 
 * 6. Performance Patterns:
 *    - Use useMemo for expensive computations
 *    - Use useCallback for function stability
 *    - Consider useRef for values that don't trigger re-renders
 *    - Add cleanup in useEffect return for subscriptions
 */

export default {{HOOK_NAME}};