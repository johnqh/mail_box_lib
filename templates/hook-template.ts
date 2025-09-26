/**
 * AI-Optimized Template for creating React hooks (v3.3.3)
 *
 * INSTRUCTIONS:
 * 1. Replace {{HookName}} with your actual hook name (PascalCase)
 * 2. Replace {{hookName}} with camelCase version
 * 3. Update all type definitions to match your data
 * 4. Implement actual service calls
 * 5. Use Optional<T> for all nullable values
 * 6. Follow Indexer/WildDuck patterns based on service type
 * 7. Add proper error handling with clearError function
 * 8. Write comprehensive tests for the hook
 *
 * AI NOTES:
 * - ALWAYS use Optional<T> instead of T | null | undefined
 * - For Indexer hooks: (endpointUrl: string, dev: boolean)
 * - For WildDuck hooks: (config: WildDuckConfig)
 * - Include clearError: () => void in return interface
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Optional } from '@johnqh/types';
import { create{{ServiceName}}Service } from '../../../utils/{{service-name}}';
import { {{ServiceName}}Operations } from '../../core/{{service-name}}/{{service-name}}-operations';

// For Indexer hooks, also import:
// import { IndexerClient } from '../../../network/clients/indexer';

// For WildDuck hooks, also import:
// import { WildDuckConfig } from '../../../network/clients/wildduck';

// Define hook return type with Optional<T> pattern
interface Use{{HookName}}Return {
  data: Optional<DataType>;
  isLoading: boolean; // Use isLoading for consistency with TanStack Query
  error: Optional<string>; // Use string for error messages
  refetch: () => Promise<void>;
  clearError: () => void; // Always include clearError
  // Add more specific methods as needed
  update: (updates: Partial<DataType>) => Promise<void>;
  reset: () => void;
}

// Define hook options with Optional<T>
interface Use{{HookName}}Options {
  enabled: Optional<boolean>;
  refetchInterval: Optional<number>;
  onSuccess: Optional<(data: DataType) => void>;
  onError: Optional<(error: string) => void>;
}

/**
 * Custom hook for {{description}}
 * 
 * @param param1 Description of parameter
 * @param options Hook configuration options
 * @returns Object containing data, loading state, and methods
 * 
 * @example
 * ```typescript
 * const { data, loading, error, refetch } = use{{HookName}}(userId, {
 *   enabled: true,
 *   onSuccess: (data) => console.log('Data loaded:', data),
 * });
 * ```
 */
export const use{{HookName}} = (
  param1: string,
  options: Use{{HookName}}Options = {}
): Use{{HookName}}Return => {
  const {
    enabled = true,
    refetchInterval,
    onSuccess,
    onError,
  } = options;

  // State management with Optional<T>
  const [data, setData] = useState<Optional<DataType>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  // Main fetch function
  const fetchData = useCallback(async () => {
    if (!enabled || !param1) return;

    try {
      setIsLoading(true);
      setError(null);

      // Use your service/operations here
      const result = await yourService.fetchData(param1);
      
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err; // Re-throw for caller handling
    } finally {
      setIsLoading(false);
    }
  }, [param1, enabled, onSuccess, onError]);

  // Update function
  const update = useCallback(async (updates: Partial<DataType>) => {
    if (!data) return;

    try {
      setLoading(true);
      setError(null);
      
      const updatedData = await yourService.updateData(data.id, updates);
      setData(updatedData);
      onSuccess?.(updatedData);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Update failed');
      setError(error);
      onError?.(error);
      throw error; // Re-throw for caller handling
    } finally {
      setLoading(false);
    }
  }, [data, onSuccess, onError]);

  // Reset function
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Polling setup
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchData, refetchInterval, enabled]);

  // Memoize return value to prevent unnecessary re-renders
  return useMemo(() => ({
    data,
    loading,
    error,
    refetch: fetchData,
    update,
    reset,
  }), [data, loading, error, fetchData, update, reset]);
};

// Alternative pattern for simpler hooks
export const useSimple{{HookName}} = (param1: string) => {
  const [state, setState] = useState({
    data: null as DataType | null,
    loading: true,
    error: null as Error | null,
  });

  useEffect(() => {
    if (!param1) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const result = await yourService.fetchData(param1);
        
        if (!cancelled) {
          setState({ data: result, loading: false, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          const error = err instanceof Error ? err : new Error('Unknown error');
          setState({ data: null, loading: false, error });
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [param1]);

  return state;
};

// Types - define these based on your actual data structures
interface DataType {
  id: string;
  name: string;
  // Add your actual data structure here
}

// Hook testing helper
export const create{{HookName}}TestWrapper = (
  initialProps: { param1: string; options?: Use{{HookName}}Options }
) => {
  // Helper for testing hooks - use with @testing-library/react-hooks
  return {
    initialProps,
    // Add mock functions if needed for testing
  };
};

/* 
Usage Examples:

// Basic usage
const { data, loading, error } = use{{HookName}}(userId);

// With options
const { data, loading, error, refetch } = use{{HookName}}(userId, {
  enabled: isAuthenticated,
  refetchInterval: 30000, // 30 seconds
  onSuccess: (data) => {
    console.log('Data loaded successfully:', data);
  },
  onError: (error) => {
    console.error('Failed to load data:', error);
  },
});

// Conditional rendering
if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <DataComponent data={data} onRefresh={refetch} />;

// Testing
import { renderHook, act } from '@testing-library/react';

test('should fetch data on mount', async () => {
  const { result, waitForNextUpdate } = renderHook(() =>
    use{{HookName}}('test-id')
  );

  expect(result.current.loading).toBe(true);

  await waitForNextUpdate();

  expect(result.current.loading).toBe(false);
  expect(result.current.data).toBeDefined();
});
*/