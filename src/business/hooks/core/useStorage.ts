/**
 * Platform-agnostic storage hook that works with both web and React Native
 * Uses the platform storage abstraction instead of direct localStorage
 */

import { useCallback, useEffect, useState } from 'react';
import { PlatformStorage } from '../../core/container/dependency-container';
import { useStorageService } from './useServices';

type SetValue<T> = T | ((prevValue: T) => T);

interface UseStorageOptions<T> {
  storage?: PlatformStorage;
  serialize?: (value: T) => string;
  deserialize?: (value: string) => T;
}

function useStorage<T>(
  key: string,
  initialValue: T,
  options?: UseStorageOptions<T>
): [T, (value: SetValue<T>) => void, () => void] {
  const defaultStorage = useStorageService();
  const storage = options?.storage || defaultStorage;
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;

  // Get initial value from storage or use provided initial value
  const getStoredValue = useCallback(async (): Promise<T> => {
    try {
      const item = await storage.getItem(key);
      if (!item) {
        return initialValue;
      }
      return deserialize(item);
    } catch (error) {
      console.error(`Error reading storage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserialize, storage]);

  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Initialize stored value on mount
  useEffect(() => {
    getStoredValue().then(setStoredValue);
  }, [getStoredValue]);

  // Update storage when value changes
  const setValue = useCallback(
    async (value: SetValue<T>) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        await storage.setItem(key, serialize(valueToStore));
      } catch (error) {
        console.error(`Error setting storage key "${key}":`, error);
      }
    },
    [key, serialize, storedValue, storage]
  );

  // Remove value from storage
  const removeValue = useCallback(async () => {
    try {
      await storage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing storage key "${key}":`, error);
    }
  }, [key, initialValue, storage]);

  return [storedValue, setValue, removeValue];
}

// Note: useLocalStorage is web-specific and conflicts with existing useLocalStorage.ts
// This web-specific implementation has been removed to avoid conflicts.
// For web-specific localStorage functionality, import from './useLocalStorage' instead.

export { useStorage };
