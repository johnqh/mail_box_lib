/**
 * Custom hook for standardizing API call patterns
 * Reduces boilerplate in API-related hooks
 */

import { useCallback, useState } from 'react';
import { withLoadingState } from '../../utils/async-helpers';

export interface UseApiCallOptions {
  onError?: (error: Error) => void;
  context?: string;
}

export interface UseApiCallReturn {
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  executeAsync: <T>(operation: () => Promise<T>) => Promise<T | undefined>;
  execute: <T, TArgs extends any[]>(
    operation: (...args: TArgs) => Promise<T>
  ) => (...args: TArgs) => Promise<T | undefined>;
}

/**
 * Hook for managing API call state and error handling
 */
export const useApiCall = (
  options: UseApiCallOptions = {}
): UseApiCallReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeAsync = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T | undefined> => {
      return withLoadingState(
        operation,
        setIsLoading,
        setError,
        options.context
      );
    },
    [options.context]
  );

  const execute = useCallback(
    <T, TArgs extends any[]>(operation: (...args: TArgs) => Promise<T>) => {
      return async (...args: TArgs): Promise<T | undefined> => {
        return executeAsync(() => operation(...args));
      };
    },
    [executeAsync]
  );

  return {
    isLoading,
    error,
    clearError,
    executeAsync,
    execute,
  };
};

/**
 * Hook for API calls that throw errors instead of returning undefined
 */
export const useApiCallStrict = (options: UseApiCallOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const executeAsync = useCallback(
    async <T>(operation: () => Promise<T>): Promise<T> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await operation();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Operation failed';
        setError(errorMessage);

        if (options.onError) {
          options.onError(err instanceof Error ? err : new Error(errorMessage));
        }

        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [options.onError]
  );

  const execute = useCallback(
    <T, TArgs extends any[]>(operation: (...args: TArgs) => Promise<T>) => {
      return (...args: TArgs): Promise<T> => {
        return executeAsync(() => operation(...args));
      };
    },
    [executeAsync]
  );

  return {
    isLoading,
    error,
    clearError,
    executeAsync,
    execute,
  };
};

/**
 * Hook for multiple related API calls with shared loading state
 */
export const useApiGroup = (options: UseApiCallOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createMethod = useCallback(
    <T, TArgs extends any[]>(
      operation: (...args: TArgs) => Promise<T>,
      throwOnError: boolean = true
    ) => {
      return async (...args: TArgs): Promise<T | undefined> => {
        if (throwOnError) {
          setIsLoading(true);
          setError(null);

          try {
            const result = await operation(...args);
            return result;
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : 'Operation failed';
            setError(errorMessage);
            throw err;
          } finally {
            setIsLoading(false);
          }
        } else {
          return withLoadingState(
            () => operation(...args),
            setIsLoading,
            setError,
            options.context
          );
        }
      };
    },
    [options.context]
  );

  return {
    isLoading,
    error,
    clearError,
    createMethod,
  };
};
