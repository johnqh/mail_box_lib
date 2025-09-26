import { useCallback, useEffect, useState } from 'react';

type SetValue<T> = T | ((prevValue: T) => T);

function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  }
): [T, (value: SetValue<T>) => void, () => void] {
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;

  // Get initial value from localStorage or use provided initial value
  const getStoredValue = useCallback((): T => {
    try {
      // Check if localStorage is available (web environment)
      if (typeof window !== 'undefined' && window.localStorage) {
        const item = window.localStorage.getItem(key);
        if (!item) {
          return initialValue;
        }
        return deserialize(item);
      }
      // Fallback for non-web environments (React Native)
      return initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, deserialize]);

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Update localStorage when value changes
  const setValue = useCallback(
    (value: SetValue<T>) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        setStoredValue(valueToStore);

        // Check if localStorage is available (web environment)
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, serialize(valueToStore));

          // Dispatch custom event for cross-tab synchronization (web only)
          if (
            typeof window.dispatchEvent === 'function' &&
            typeof CustomEvent !== 'undefined'
          ) {
            window.dispatchEvent(
              new CustomEvent('local-storage', {
                detail: { key, value: valueToStore },
              })
            );
          }
        }
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, serialize, storedValue]
  );

  // Remove value from localStorage
  const removeValue = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
        setStoredValue(initialValue);

        // Dispatch custom event for cross-tab synchronization (web only)
        if (
          typeof window.dispatchEvent === 'function' &&
          typeof CustomEvent !== 'undefined'
        ) {
          window.dispatchEvent(
            new CustomEvent('local-storage', {
              detail: { key, value: null },
            })
          );
        }
      } else {
        setStoredValue(initialValue);
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes from other tabs/windows (web only)
  useEffect(() => {
    // Only set up event listeners in web environment
    if (typeof window === 'undefined' || !window.addEventListener) {
      return;
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(deserialize(e.newValue));
        } catch (error) {
          console.error(
            `Error parsing localStorage value for key "${key}":`,
            error
          );
        }
      }
    };

    const handleCustomEvent = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value ?? initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('local-storage' as any, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('local-storage' as any, handleCustomEvent);
    };
  }, [key, initialValue, deserialize]);

  return [storedValue, setValue, removeValue];
}

export { useLocalStorage };
