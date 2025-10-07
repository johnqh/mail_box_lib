import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Custom implementation of useBetween for React 19 compatibility
 *
 * This replaces the use-between library which doesn't work with React 19.
 * Uses a simple subscription pattern with module-level state and aggressive caching.
 *
 * @param useHook - The hook to make shared across components
 * @returns The shared hook
 *
 * @example
 * ```tsx
 * const useCounterState = () => {
 *   const [count, setCount] = useState(0);
 *   return { count, setCount };
 * };
 *
 * export const useCounter = () => useBetween(useCounterState);
 * ```
 */

// Store for each hook instance - module level storage
const storeMap = new Map<
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  Function,
  {
    result: any;
    listeners: Set<() => void>;
    wrappedCache: WeakMap<any, any>; // Cache wrapped objects to prevent re-wrapping
  }
>();

export function useBetween<T>(useHook: () => T): T {
  // Get or create store for this hook
  if (!storeMap.has(useHook)) {
    storeMap.set(useHook, {
      result: null,
      listeners: new Set(),
      wrappedCache: new WeakMap(),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const store = storeMap.get(useHook)!;

  // Force re-render
  const [, forceUpdate] = useState({});

  // Track previous result to detect changes
  const prevResultRef = useRef<T | null>(null);

  // Call the hook - this MUST be called at the top level, always
  const result = useHook();

  // Check if result actually changed using shallow comparison
  const hasChanged = !shallowEqual(prevResultRef.current, result);

  // Update stored result only if changed
  if (hasChanged) {
    store.result = result;
    prevResultRef.current = result;
  }

  // Subscribe to changes
  useEffect(() => {
    const listener = () => forceUpdate({});
    store.listeners.add(listener);

    return () => {
      store.listeners.delete(listener);
    };
  }, [store]);

  // Wrap setter functions to notify listeners - use memoization to prevent re-wrapping
  const wrapped = useMemo(() => {
    // Check if we already wrapped this exact result object
    if (store.wrappedCache.has(result as any)) {
      return store.wrappedCache.get(result as any);
    }

    const wrappedResult = wrapSetters(result, () => {
      store.listeners.forEach(listener => listener());
    });

    // Cache the wrapped result
    if (typeof result === 'object' && result !== null) {
      store.wrappedCache.set(result as any, wrappedResult);
    }

    return wrappedResult;
  }, [result, store]);

  return wrapped;
}

/**
 * Shallow equality check for objects
 */
function shallowEqual(objA: any, objB: any): boolean {
  if (objA === objB) return true;
  if (!objA || !objB) return false;
  if (typeof objA !== 'object' || typeof objB !== 'object') return false;

  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (objA[key] !== objB[key]) return false;
  }

  return true;
}

/**
 * Wraps setter functions to trigger notifications
 * Uses a cache to prevent re-creating wrapper functions
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const wrappedFunctionCache = new WeakMap<Function, Function>();

function wrapSetters<T>(obj: T, notify: () => void): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const wrapped: any = {};

  for (const key in obj) {
    const value = obj[key];

    // Wrap functions that start with 'set' (React convention for setters)
    if (typeof value === 'function' && key.startsWith('set')) {
      // Check if we already wrapped this function
      if (wrappedFunctionCache.has(value)) {
        wrapped[key] = wrappedFunctionCache.get(value);
      } else {
        const wrappedFn = (...args: any[]) => {
          const result = value(...args);
          // Notify after state change
          setTimeout(() => notify(), 0);
          return result;
        };
        wrappedFunctionCache.set(value, wrappedFn);
        wrapped[key] = wrappedFn;
      }
    } else {
      wrapped[key] = value;
    }
  }

  return wrapped;
}
