import { useState, useCallback } from 'react';

/**
 * Generic async operation hook with loading, error, and data states
 * Provides consistent error handling and fallback patterns
 */

export interface UseAsyncOperationOptions<T> {
  initialData?: T;
  fallbackOperation?: () => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface UseAsyncOperationReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (operation: () => Promise<T>) => Promise<T | null>;
  reset: () => void;
  retry: () => Promise<T | null>;
}

export const useAsyncOperation = <T = any>(
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncOperationReturn<T> => {
  const {
    initialData = null,
    fallbackOperation,
    onSuccess,
    onError,
    retryAttempts = 0,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<(() => Promise<T>) | null>(null);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    setLastOperation(() => operation);
    setLoading(true);
    setError(null);

    let attempts = 0;
    const maxAttempts = retryAttempts + 1;

    while (attempts < maxAttempts) {
      try {
        const result = await operation();
        setData(result);
        setError(null);
        onSuccess?.(result);
        return result;
      } catch (err) {
        attempts++;
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        
        if (attempts >= maxAttempts) {
          // All attempts failed, try fallback if available
          if (fallbackOperation) {
            try {
              console.warn('Primary operation failed, attempting fallback:', errorMessage);
              const fallbackResult = await fallbackOperation();
              setData(fallbackResult);
              setError(null);
              onSuccess?.(fallbackResult);
              return fallbackResult;
            } catch (fallbackErr) {
              const fallbackErrorMessage = fallbackErr instanceof Error ? 
                fallbackErr.message : 'Fallback operation also failed';
              console.error('Both primary and fallback operations failed:', {
                primary: errorMessage,
                fallback: fallbackErrorMessage
              });
              setError(`Operation failed: ${errorMessage}`);
              onError?.(err instanceof Error ? err : new Error(errorMessage));
            }
          } else {
            setError(errorMessage);
            onError?.(err instanceof Error ? err : new Error(errorMessage));
          }
          break;
        } else {
          // Wait before retrying
          if (retryDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
    }

    setLoading(false);
    return null;
  }, [fallbackOperation, onSuccess, onError, retryAttempts, retryDelay]);

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
    setLastOperation(null);
  }, [initialData]);

  const retry = useCallback(async (): Promise<T | null> => {
    if (lastOperation) {
      return execute(lastOperation);
    }
    return null;
  }, [lastOperation, execute]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry
  };
};

/**
 * Specialized hook for API operations with common patterns
 */
export interface UseApiOperationOptions<T> extends UseAsyncOperationOptions<T> {
  mockService?: () => Promise<T>;
}

export const useApiOperation = <T = any>(
  options: UseApiOperationOptions<T> = {}
): UseAsyncOperationReturn<T> => {
  const { mockService, ...baseOptions } = options;

  return useAsyncOperation<T>({
    ...baseOptions,
    fallbackOperation: mockService,
    retryAttempts: baseOptions.retryAttempts ?? 1,
    retryDelay: baseOptions.retryDelay ?? 1000,
    onError: (error) => {
      console.error('API operation failed:', error);
      baseOptions.onError?.(error);
    }
  });
};

/**
 * Hook for operations that require authentication
 */
export const useAuthenticatedOperation = <T = any>(
  isAuthenticated: boolean,
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncOperationReturn<T> & { canExecute: boolean } => {
  const asyncOp = useAsyncOperation<T>(options);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    if (!isAuthenticated) {
      asyncOp.reset();
      return null;
    }
    return asyncOp.execute(operation);
  }, [isAuthenticated, asyncOp]);

  return {
    ...asyncOp,
    execute,
    canExecute: isAuthenticated
  };
};