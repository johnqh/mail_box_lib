/**
 * @fileoverview Debounce utility hooks for delaying value updates and callback executions.
 *
 * Provides two hooks:
 * - `useDebounce<T>` - Debounces a reactive value (e.g., search input text)
 * - `useDebouncedCallback` - Debounces a callback function (e.g., API calls)
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Platform-specific timer type
type NodeJSTimeout = ReturnType<typeof setTimeout>;

/**
 * Debounces a value, only updating the returned value after a specified delay
 * has elapsed since the last change.
 *
 * Useful for delaying expensive operations (like API calls) until the user
 * stops typing or interacting.
 *
 * @typeParam T - The type of value to debounce
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds before the debounced value updates (default: 500)
 * @returns The debounced value (updates `delay` ms after the last `value` change)
 *
 * @example
 * ```typescript
 * function SearchComponent() {
 *   const [searchText, setSearchText] = useState('');
 *   const debouncedSearch = useDebounce(searchText, 300);
 *
 *   useEffect(() => {
 *     // Only fires 300ms after the user stops typing
 *     fetchResults(debouncedSearch);
 *   }, [debouncedSearch]);
 *
 *   return <input value={searchText} onChange={e => setSearchText(e.target.value)} />;
 * }
 * ```
 */
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounces a callback function, ensuring it is only called after a specified
 * delay has elapsed since the last invocation.
 *
 * The callback reference is kept up-to-date via a ref, so the returned function
 * always calls the latest callback without being recreated.
 *
 * @typeParam T - The callback function type
 * @param callback - The callback to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns A debounced version of the callback with the same signature
 *
 * @example
 * ```typescript
 * function AutoSave() {
 *   const save = useDebouncedCallback((content: string) => {
 *     api.save(content);
 *   }, 1000);
 *
 *   return <textarea onChange={e => save(e.target.value)} />;
 * }
 * ```
 */
function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<NodeJSTimeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  ) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

export { useDebounce, useDebouncedCallback };
