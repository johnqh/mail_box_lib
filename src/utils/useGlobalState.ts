/**
 * useGlobalState - Provider-free global state management for React and React Native
 *
 * This hook creates module-level shared state that works across all component instances
 * without requiring a Context Provider. Perfect for React Native compatibility.
 *
 * @example
 * ```typescript
 * // Define your global state
 * const useSharedCounter = createGlobalState('counter', 0);
 *
 * // Use in any component
 * function Component() {
 *   const [count, setCount] = useSharedCounter();
 *   return <button onClick={() => setCount(count + 1)}>{count}</button>;
 * }
 * ```
 */

import { useCallback, useEffect, useState } from 'react';

// Module-level storage for all global states
const globalStates = new Map<
  string,
  {
    value: any;
    listeners: Set<(value: any) => void>;
  }
>();

/**
 * Creates a global state hook that can be used across components without a provider
 *
 * @param key - Unique identifier for this global state
 * @param initialValue - Initial value for the state
 * @returns A hook that returns [value, setValue] tuple (like useState)
 *
 * @example
 * ```typescript
 * // Create the global state hook
 * export const useCurrentUser = createGlobalState<User | null>('currentUser', null);
 *
 * // Use in components
 * function UserProfile() {
 *   const [user, setUser] = useCurrentUser();
 *   // ...
 * }
 * ```
 */
export function createGlobalState<T>(key: string, initialValue: T) {
  // Initialize the global state if it doesn't exist
  if (!globalStates.has(key)) {
    globalStates.set(key, {
      value: initialValue,
      listeners: new Set(),
    });
  }

  return function useGlobalState(): [T, (value: T | ((prev: T) => T)) => void] {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const state = globalStates.get(key)!;

    // Local state to trigger re-renders
    const [, forceUpdate] = useState({});

    // Subscribe to changes
    useEffect(() => {
      const listener = () => {
        forceUpdate({});
      };

      state.listeners.add(listener);

      return () => {
        state.listeners.delete(listener);
      };
    }, [state]);

    // Setter function
    const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const state = globalStates.get(key)!;

      // Handle functional updates
      const valueToSet =
        typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(state.value)
          : newValue;

      // Only update if value actually changed
      if (state.value !== valueToSet) {
        state.value = valueToSet;

        // Notify all listeners
        state.listeners.forEach(listener => listener(valueToSet));
      }
    }, []);

    return [state.value, setValue];
  };
}

/**
 * Gets the current value of a global state without subscribing to updates
 * Useful for one-time reads or in non-React contexts
 *
 * @param key - The key of the global state
 * @returns The current value, or undefined if the state doesn't exist
 */
export function getGlobalState<T>(key: string): T | undefined {
  return globalStates.get(key)?.value;
}

/**
 * Sets a global state value directly without using a hook
 * Useful for updating state from non-React contexts
 *
 * @param key - The key of the global state
 * @param value - The new value or updater function
 */
export function setGlobalState<T>(
  key: string,
  value: T | ((prev: T) => T)
): void {
  const state = globalStates.get(key);

  if (!state) {
    console.warn(
      `Global state "${key}" does not exist. Create it first with createGlobalState.`
    );
    return;
  }

  // Handle functional updates
  const valueToSet =
    typeof value === 'function'
      ? (value as (prev: T) => T)(state.value)
      : value;

  if (state.value !== valueToSet) {
    state.value = valueToSet;
    state.listeners.forEach(listener => listener(valueToSet));
  }
}

/**
 * Resets a global state to its initial value
 *
 * @param key - The key of the global state
 * @param initialValue - The value to reset to
 */
export function resetGlobalState<T>(key: string, initialValue: T): void {
  setGlobalState(key, initialValue);
}

/**
 * Clears all global states (useful for testing)
 */
export function clearAllGlobalStates(): void {
  globalStates.clear();
}
