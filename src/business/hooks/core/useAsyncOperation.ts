/**
 * @fileoverview Async operation hooks with fallback support and authentication guards.
 *
 * This module provides three hooks:
 * - `useAsyncOperation` - Execute arbitrary async operations with fallback support
 * - `useApiOperation` - Specialization for API calls with mock service fallback
 * - `useAuthenticatedOperation` - Guards execution behind an authentication check
 *
 * Unlike `useAsync`, these hooks accept the operation at call time via `execute()`,
 * making them suitable for event-driven async flows (button clicks, form submits).
 */

import { useCallback, useState } from 'react';
import { Optional } from '@sudobility/types';

/** Options for configuring useAsyncOperation */
interface UseAsyncOperationOptions<T> {
  /** Initial data value before any operation executes */
  initialData?: T;
  /** Fallback async function to call if the primary operation fails */
  fallbackOperation?: () => Promise<T>;
  /** Callback invoked with the result on successful execution */
  onSuccess?: (data: T) => void;
  /** Callback invoked with the error on failed execution */
  onError?: (error: Error) => void;
}

/** Return type for useAsyncOperation */
interface UseAsyncOperationReturn<T> {
  /** The resolved data (null until success) */
  data: Optional<T>;
  /** Whether an operation is currently executing */
  loading: boolean;
  /** Error message string (null if no error) */
  error: Optional<string>;
  /** Execute an async operation, returning the result or null on failure */
  execute: (operation: () => Promise<T>) => Promise<Optional<T>>;
  /** Reset data, loading, and error to initial state */
  reset: () => void;
}

/**
 * Hook for executing async operations with automatic error handling and optional fallback.
 *
 * Unlike `useAsync`, this hook receives the operation at call time via `execute()`,
 * making it ideal for event-driven flows where the operation may vary.
 *
 * @typeParam T - The return type of the async operation
 * @param options - Configuration options including fallback and callbacks
 * @returns Object with data, loading, error, execute, and reset
 *
 * @example
 * ```typescript
 * function SaveButton() {
 *   const { loading, error, execute } = useAsyncOperation<SaveResult>({
 *     onSuccess: (result) => toast.success(`Saved: ${result.id}`),
 *     onError: (err) => toast.error(err.message),
 *   });
 *
 *   const handleSave = () => execute(() => api.save(formData));
 *
 *   return <button onClick={handleSave} disabled={loading}>Save</button>;
 * }
 * ```
 */
const useAsyncOperation = <T = any>(
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncOperationReturn<T> => {
  const { initialData = null, fallbackOperation, onSuccess, onError } = options;

  const [data, setData] = useState<Optional<T>>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<Optional<T>> => {
      setLoading(true);
      setError(null);

      try {
        const result = await operation();
        setData(result);
        setError(null);
        setLoading(false);
        onSuccess?.(result);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred';

        // Try fallback if available
        if (fallbackOperation) {
          try {
            console.warn(
              'Primary operation failed, attempting fallback:',
              errorMessage
            );
            const fallbackResult = await fallbackOperation();
            setData(fallbackResult);
            setError(null);
            setLoading(false);
            onSuccess?.(fallbackResult);
            return fallbackResult;
          } catch (fallbackErr) {
            const fallbackErrorMessage =
              fallbackErr instanceof Error
                ? fallbackErr.message
                : 'Fallback operation also failed';
            console.error('Both primary and fallback operations failed:', {
              primary: errorMessage,
              fallback: fallbackErrorMessage,
            });
            setError(`Operation failed: ${errorMessage}`);
            onError?.(err instanceof Error ? err : new Error(errorMessage));
          }
        } else {
          setError(errorMessage);
          onError?.(err instanceof Error ? err : new Error(errorMessage));
        }

        setLoading(false);
        return null;
      }
    },
    [fallbackOperation, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setLoading(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    loading,
    error,
    execute,
    reset,
  };
};

/**
 * Options for useApiOperation, extending the base options with optional mock service.
 */
interface UseApiOperationOptions<T> extends UseAsyncOperationOptions<T> {
  /** Mock service function used as fallback when the primary API call fails */
  mockService?: () => Promise<T>;
}

/**
 * Specialized hook for API operations with automatic error logging and optional mock service fallback.
 *
 * If `mockService` is provided, it is used as the fallback operation when the primary
 * API call fails, enabling graceful degradation during development or outages.
 *
 * @typeParam T - The return type of the API operation
 * @param options - Configuration options with optional mockService
 * @returns Same return shape as useAsyncOperation
 *
 * @example
 * ```typescript
 * const { data, execute } = useApiOperation<User[]>({
 *   mockService: () => Promise.resolve([{ id: 1, name: 'Mock User' }]),
 * });
 *
 * // Will fall back to mockService if the real API fails
 * await execute(() => api.getUsers());
 * ```
 */
const useApiOperation = <T = any>(
  options: UseApiOperationOptions<T> = {}
): UseAsyncOperationReturn<T> => {
  const { mockService, ...baseOptions } = options;

  const asyncOptions: UseAsyncOperationOptions<T> = {
    ...baseOptions,
    onError: error => {
      console.error('API operation failed:', error);
      baseOptions.onError?.(error);
    },
  };

  if (mockService) {
    asyncOptions.fallbackOperation = mockService;
  }

  return useAsyncOperation<T>(asyncOptions);
};

/**
 * Hook for async operations that require authentication.
 *
 * Wraps `useAsyncOperation` with an authentication guard. When `isAuthenticated` is false,
 * `execute()` returns null and resets state instead of running the operation.
 * The `canExecute` flag indicates whether the operation can currently be run.
 *
 * @typeParam T - The return type of the async operation
 * @param isAuthenticated - Whether the user is currently authenticated
 * @param options - Configuration options (same as useAsyncOperation)
 * @returns Extended return object with additional `canExecute` boolean
 *
 * @example
 * ```typescript
 * const { isVerified } = useWalletStatus();
 * const { execute, canExecute, data } = useAuthenticatedOperation<Profile>(isVerified);
 *
 * // Will no-op and return null if wallet is not verified
 * await execute(() => api.getProfile());
 * ```
 */
const useAuthenticatedOperation = <T = any>(
  isAuthenticated: boolean,
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncOperationReturn<T> & { canExecute: boolean } => {
  const asyncOp = useAsyncOperation<T>(options);

  const execute = useCallback(
    async (operation: () => Promise<T>): Promise<Optional<T>> => {
      if (!isAuthenticated) {
        asyncOp.reset();
        return null;
      }
      return asyncOp.execute(operation);
    },
    [isAuthenticated, asyncOp]
  );

  return {
    ...asyncOp,
    execute,
    canExecute: isAuthenticated,
  };
};

export {
  useAsyncOperation,
  useApiOperation,
  useAuthenticatedOperation,
  type UseAsyncOperationOptions,
  type UseAsyncOperationReturn,
  type UseApiOperationOptions,
};
