/**
 * Template for creating React hooks
 * Follow this pattern for consistent data fetching hooks
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// Define hook return type
interface Use{{HookName}}Return {
  data: DataType | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  // Add more specific methods as needed
  update: (updates: Partial<DataType>) => Promise<void>;
  reset: () => void;
}

// Define hook options
interface Use{{HookName}}Options {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: DataType) => void;
  onError?: (error: Error) => void;
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

  // State management
  const [data, setData] = useState<DataType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Main fetch function
  const fetchData = useCallback(async () => {
    if (!enabled || !param1) return;

    try {
      setLoading(true);
      setError(null);
      
      // Use your service/operations here
      const result = await yourService.fetchData(param1);
      
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
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