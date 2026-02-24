/**
 * @fileoverview Generic async operation hook with lifecycle-safe state management.
 *
 * `useAsync` wraps any async function with loading, error, success, and data states.
 * It is lifecycle-safe: if the component unmounts before the async operation completes,
 * state updates are suppressed to prevent React warnings.
 *
 * For a more flexible alternative with fallback operations and authenticated flows,
 * see `useAsyncOperation` in `./useAsyncOperation.ts`.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Optional } from '@sudobility/types';
import { getErrorMessage } from '../../../utils/errorHandling';

/** Internal state shape for useAsync */
interface UseAsyncState<T> {
  /** The resolved data (null until success) */
  data: Optional<T>;
  /** Error message string (null until failure) */
  error: Optional<string>;
  /** Whether the async function is currently executing */
  isLoading: boolean;
  /** Whether the last execution succeeded */
  isSuccess: boolean;
  /** Whether the last execution failed */
  isError: boolean;
}

/** Options for configuring useAsync behavior */
interface UseAsyncOptions<T = unknown> {
  /** If true, execute the async function immediately on mount (default: false) */
  immediate?: Optional<boolean>;
  /** Callback invoked with the result on successful execution */
  onSuccess?: Optional<(data: T) => void>;
  /** Callback invoked with the error message on failed execution */
  onError?: Optional<(error: string) => void>;
}

/**
 * Generic hook for executing an async function with managed loading/error/success state.
 *
 * Features:
 * - Lifecycle-safe: suppresses state updates after unmount
 * - Optional immediate execution on mount
 * - Success and error callbacks
 * - Reset function to clear all state
 *
 * @typeParam T - The return type of the async function
 * @param asyncFunction - The async function to execute
 * @param options - Configuration options
 * @returns Object with data, error, loading states, execute, and reset functions
 *
 * @example
 * ```typescript
 * function UserProfile({ userId }: { userId: string }) {
 *   const fetchUser = useCallback(() => api.getUser(userId), [userId]);
 *   const { data: user, isLoading, error, execute } = useAsync(fetchUser, {
 *     immediate: true,
 *     onSuccess: (user) => console.log('Loaded:', user.name),
 *   });
 *
 *   if (isLoading) return <Spinner />;
 *   if (error) return <Error message={error} onRetry={execute} />;
 *   return <div>{user?.name}</div>;
 * }
 * ```
 */
function useAsync<T = unknown>(
  asyncFunction: () => Promise<T>,
  options: UseAsyncOptions<T> = {}
) {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async () => {
    setState({
      data: null,
      error: null,
      isLoading: true,
      isSuccess: false,
      isError: false,
    });

    try {
      const result = await asyncFunction();

      if (isMountedRef.current) {
        setState({
          data: result,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
        });

        onSuccess?.(result);
      }

      return result;
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      if (isMountedRef.current) {
        setState({
          data: null,
          error: errorMessage,
          isLoading: false,
          isSuccess: false,
          isError: true,
        });

        onError?.(errorMessage);
      }

      throw error;
    }
  }, [asyncFunction, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate]); // Only run on mount when immediate is true

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

export { useAsync };
