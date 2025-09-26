/**
 * AI-Optimized Template for creating Indexer hooks (v3.3.3)
 *
 * INSTRUCTIONS:
 * 1. Replace {{HookName}} with your actual hook name (PascalCase)
 * 2. Replace {{endpointPath}} with actual API endpoint path
 * 3. Update DataType to match expected response structure
 * 4. ALL Indexer hooks MUST use (endpointUrl: string, dev: boolean) parameters
 * 5. Use Optional<T> for all nullable values
 * 6. Include clearError function in return interface
 *
 * AI PATTERN RECOGNITION:
 * - Indexer hooks always use IndexerClient
 * - Parameters: (endpointUrl: string, dev: boolean, [additional params])
 * - Error handling: string messages, not Error objects
 * - Network responses require type assertions for response.data
 * - Dev mode is passed as x-dev header
 */

import { useCallback, useState } from 'react';
import { Optional } from '@johnqh/types';
import { IndexerClient } from '../../../network/clients/indexer';

// Define expected response data type
interface {{HookName}}Data {
  // Update this interface based on your API response structure
  id: string;
  // Add your actual data fields here
}

// Hook return interface
interface Use{{HookName}}Return {
  data: Optional<{{HookName}}Data>;
  isLoading: boolean;
  error: Optional<string>;
  execute: (param?: string) => Promise<{{HookName}}Data>;
  clearError: () => void;
}

/**
 * Hook for {{description}} using Indexer API
 *
 * @param endpointUrl - Indexer API base URL
 * @param dev - Development mode flag (passed as x-dev header)
 * @returns Hook interface with data, loading state, and execution function
 *
 * @example
 * ```typescript
 * const { data, isLoading, error, execute, clearError } = use{{HookName}}(
 *   'https://indexer.example.com',
 *   true
 * );
 *
 * // Execute the API call
 * const handleSubmit = async () => {
 *   try {
 *     const result = await execute(someParam);
 *     console.log('Success:', result);
 *   } catch (err) {
 *     // Error is already set in hook state
 *     console.error('Failed:', error);
 *   }
 * };
 * ```
 */
export const use{{HookName}} = (
  endpointUrl: string,
  dev: boolean
): Use{{HookName}}Return => {
  const [data, setData] = useState<Optional<{{HookName}}Data>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  // Initialize client
  const client = new IndexerClient(endpointUrl, dev);

  const execute = useCallback(
    async (param?: string): Promise<{{HookName}}Data> => {
      setIsLoading(true);
      setError(null);

      try {
        // Update endpoint path based on your API
        const endpoint = param
          ? `/api/{{endpointPath}}/${encodeURIComponent(param)}`
          : '/api/{{endpointPath}}';

        const response = await client.get(endpoint);

        if (!response.ok) {
          throw new Error(
            `{{HookName}} failed: ${(response.data as any)?.error || 'Unknown error'}`
          );
        }

        // Type assertion needed for IndexerClient responses
        const result = response.data as {{HookName}}Data;
        setData(result);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Operation failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [client]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    execute,
    clearError,
  };
};

/**
 * Alternative TanStack Query pattern for Indexer hooks
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export const use{{HookName}}Query = (
  endpointUrl: string,
  dev: boolean,
  param: Optional<string>,
  options?: UseQueryOptions<{{HookName}}Data>
) => {
  const client = new IndexerClient(endpointUrl, dev);

  return useQuery({
    queryKey: ['{{hookName}}', endpointUrl, dev, param],
    queryFn: async (): Promise<{{HookName}}Data> => {
      if (!param) throw new Error('Parameter required');

      const endpoint = `/api/{{endpointPath}}/${encodeURIComponent(param)}`;
      const response = await client.get(endpoint);

      if (!response.ok) {
        throw new Error(
          `{{HookName}} failed: ${(response.data as any)?.error || 'Unknown error'}`
        );
      }

      return response.data as {{HookName}}Data;
    },
    enabled: !!param,
    ...options,
  });
};

/*
USAGE EXAMPLES:

// Basic usage
const { data, isLoading, error, execute, clearError } = use{{HookName}}(
  process.env.VITE_INDEXER_URL!,
  process.env.NODE_ENV === 'development'
);

// With error handling
const handleExecute = async () => {
  try {
    const result = await execute(inputValue);
    console.log('Success:', result);
  } catch (err) {
    // Error is automatically set in hook state
    toast.error(error || 'Operation failed');
  }
};

// TanStack Query version
const { data, isLoading, error } = use{{HookName}}Query(
  process.env.VITE_INDEXER_URL!,
  process.env.NODE_ENV === 'development',
  walletAddress,
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  }
);

// TESTING EXAMPLE:
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

describe('use{{HookName}}', () => {
  it('should execute successfully', async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValue({
        ok: true,
        data: { id: 'test', /* mock data */ },
      }),
    };

    const { result } = renderHook(() =>
      use{{HookName}}('https://test-url.com', true)
    );

    await act(async () => {
      const data = await result.current.execute('test-param');
      expect(data.id).toBe('test');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
*/