/**
 * AI-Optimized Template for creating WildDuck hooks (v3.3.3)
 *
 * INSTRUCTIONS:
 * 1. Replace {{HookName}} with your actual hook name (PascalCase)
 * 2. Replace {{endpointPath}} with actual API endpoint path
 * 3. Update DataType to match expected response structure
 * 4. ALL WildDuck hooks MUST use (config: WildDuckConfig) parameter
 * 5. Use Optional<T> for all nullable values
 * 6. Include clearError function in return interface
 *
 * AI PATTERN RECOGNITION:
 * - WildDuck hooks always use WildDuckConfig
 * - Parameters: (config: WildDuckConfig, [additional params])
 * - Headers: Bearer token for Cloudflare Worker, X-Access-Token for backend
 * - Response check: response.data === undefined (allows null)
 * - Error handling: string messages, not Error objects
 * - Config determines API URL: cloudflareWorkerUrl || backendUrl
 */

import { useCallback, useState } from 'react';
import { Optional } from '@johnqh/types';
import { WildDuckConfig } from '../../../network/clients/wildduck';
import axios from 'axios';

// Define expected response data type
interface {{HookName}}Data {
  // Update this interface based on your API response structure
  success: boolean;
  // Add your actual data fields here
}

// WildDuck API response wrapper
interface WildDuckResponse<T> {
  success: boolean;
  data: Optional<T>;
  error: Optional<string>;
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
 * Hook for {{description}} using WildDuck API
 *
 * @param config - WildDuck configuration object
 * @returns Hook interface with data, loading state, and execution function
 *
 * @example
 * ```typescript
 * const config: WildDuckConfig = {
 *   apiToken: process.env.VITE_WILDDUCK_API_TOKEN!,
 *   backendUrl: process.env.VITE_WILDDUCK_BACKEND_URL,
 *   cloudflareWorkerUrl: process.env.VITE_CLOUDFLARE_WORKER_URL,
 *   useMockFallback: process.env.VITE_USE_MOCK_FALLBACK === 'true',
 * };
 *
 * const { data, isLoading, error, execute, clearError } = use{{HookName}}(config);
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
export const use{{HookName}} = (config: WildDuckConfig): Use{{HookName}}Return => {
  const [data, setData] = useState<Optional<{{HookName}}Data>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const execute = useCallback(
    async (param?: string): Promise<{{HookName}}Data> => {
      setIsLoading(true);
      setError(null);

      try {
        // Determine API URL (Cloudflare Worker takes precedence)
        const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
        if (!apiUrl) {
          throw new Error('No API URL configured');
        }

        // Setup headers based on configuration
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

        // Build endpoint URL
        const endpoint = param
          ? `${apiUrl}/{{endpointPath}}/${encodeURIComponent(param)}`
          : `${apiUrl}/{{endpointPath}}`;

        const response = await axios.get<WildDuckResponse<{{HookName}}Data>>(
          endpoint,
          { headers }
        );

        // Check WildDuck response format
        if (!response.data.success || response.data.data === undefined) {
          throw new Error(response.data.error || '{{HookName}} failed');
        }

        const result = response.data.data;
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
    [config]
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
 * Alternative TanStack Query pattern for WildDuck hooks
 */
import { useQuery, UseQueryOptions } from '@tanstack/react-query';

export const use{{HookName}}Query = (
  config: WildDuckConfig,
  param: Optional<string>,
  options?: UseQueryOptions<{{HookName}}Data>
) => {
  return useQuery({
    queryKey: ['{{hookName}}', config, param],
    queryFn: async (): Promise<{{HookName}}Data> => {
      if (!param) throw new Error('Parameter required');

      const apiUrl = config.cloudflareWorkerUrl || config.backendUrl;
      if (!apiUrl) throw new Error('No API URL configured');

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

      const endpoint = `${apiUrl}/{{endpointPath}}/${encodeURIComponent(param)}`;

      const response = await axios.get<WildDuckResponse<{{HookName}}Data>>(
        endpoint,
        { headers }
      );

      if (!response.data.success || response.data.data === undefined) {
        throw new Error(response.data.error || '{{HookName}} failed');
      }

      return response.data.data;
    },
    enabled: !!param && !!config.apiToken,
    ...options,
  });
};

/*
USAGE EXAMPLES:

// Configuration setup
const wildDuckConfig: WildDuckConfig = {
  apiToken: process.env.VITE_WILDDUCK_API_TOKEN!,
  backendUrl: process.env.VITE_WILDDUCK_BACKEND_URL,
  cloudflareWorkerUrl: process.env.VITE_CLOUDFLARE_WORKER_URL,
  useMockFallback: process.env.VITE_USE_MOCK_FALLBACK === 'true',
};

// Basic usage
const { data, isLoading, error, execute, clearError } = use{{HookName}}(wildDuckConfig);

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
  wildDuckConfig,
  userId,
  {
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  }
);

// Conditional rendering
if (isLoading) return <Spinner />;
if (error) return <ErrorMessage message={error} onRetry={clearError} />;
if (!data) return <EmptyState />;

return <DataComponent data={data} />;

// TESTING EXAMPLE:
import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

describe('use{{HookName}}', () => {
  const mockConfig: WildDuckConfig = {
    apiToken: 'test-token',
    backendUrl: 'https://test-backend.com',
    cloudflareWorkerUrl: null,
    useMockFallback: false,
  };

  it('should execute successfully', async () => {
    // Mock axios
    vi.mock('axios');
    const mockedAxios = axios as jest.Mocked<typeof axios>;

    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        data: { success: true, /* mock data */ },
        error: null,
      },
    });

    const { result } = renderHook(() => use{{HookName}}(mockConfig));

    await act(async () => {
      const data = await result.current.execute('test-param');
      expect(data.success).toBe(true);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
*/