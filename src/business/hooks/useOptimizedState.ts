import { useCallback, useMemo, useRef, useState } from 'react';

// Platform-specific timer type
type NodeJSTimeout = ReturnType<typeof setTimeout>;

/**
 * Optimized state management hooks to reduce re-renders
 */

// Optimized useState that only triggers re-renders when value actually changes
export const useOptimizedState = <T>(
  initialValue: T,
  isEqual?: (a: T, b: T) => boolean
) => {
  const [value, setValue] = useState(initialValue);
  const currentValue = useRef(value);

  const optimizedSetValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const nextValue =
        typeof newValue === 'function'
          ? (newValue as (prev: T) => T)(currentValue.current)
          : newValue;

      // Use custom equality function or shallow comparison
      const hasChanged = isEqual
        ? !isEqual(currentValue.current, nextValue)
        : currentValue.current !== nextValue;

      if (hasChanged) {
        currentValue.current = nextValue;
        setValue(nextValue);
      }
    },
    [isEqual]
  );

  return [value, optimizedSetValue] as const;
};

// Batched state updates for multiple related state changes
export const useBatchedState = <T extends Record<string, any>>(
  initialState: T
) => {
  const [state, setState] = useState(initialState);
  const pendingUpdates = useRef<Partial<T>>({});
  const timeoutRef = useRef<NodeJSTimeout>();

  const batchedSetState = useCallback((updates: Partial<T>) => {
    pendingUpdates.current = { ...pendingUpdates.current, ...updates };

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => ({ ...prevState, ...pendingUpdates.current }));
      pendingUpdates.current = {};
    }, 0);
  }, []);

  const immediateSetState = useCallback((updates: Partial<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      pendingUpdates.current = {};
    }
    setState(prevState => ({ ...prevState, ...updates }));
  }, []);

  return [state, batchedSetState, immediateSetState] as const;
};

// Debounced state for high-frequency updates (like search inputs)
export const useDebouncedState = <T>(initialValue: T, delay: number = 300) => {
  const [value, setValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJSTimeout>();

  const setValueWithDebounce = useCallback(
    (newValue: T) => {
      setValue(newValue);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedValue(newValue);
      }, delay);
    },
    [delay]
  );

  return [value, debouncedValue, setValueWithDebounce] as const;
};

// Optimized array state with built-in operations
export const useArrayState = <T>(initialArray: T[] = []) => {
  const [array, setArray] = useState(initialArray);

  const operations = useMemo(
    () => ({
      add: (item: T) => setArray(prev => [...prev, item]),
      remove: (index: number) =>
        setArray(prev => prev.filter((_, i) => i !== index)),
      update: (index: number, item: T) =>
        setArray(prev =>
          prev.map((existingItem, i) => (i === index ? item : existingItem))
        ),
      clear: () => setArray([]),
      replace: (newArray: T[]) => setArray(newArray),
      toggle: (item: T, keySelector?: (item: T) => any) =>
        setArray(prev => {
          const key = keySelector ? keySelector(item) : item;
          const exists = keySelector
            ? prev.some(existingItem => keySelector(existingItem) === key)
            : prev.includes(item);

          return exists
            ? prev.filter(existingItem =>
                keySelector
                  ? keySelector(existingItem) !== key
                  : existingItem !== item
              )
            : [...prev, item];
        }),
    }),
    []
  );

  return [array, operations] as const;
};

// Map/object state with optimized operations
export const useMapState = <K, V>(initialMap?: Map<K, V>) => {
  const [map, setMap] = useState(() => initialMap || new Map<K, V>());

  const operations = useMemo(
    () => ({
      set: (key: K, value: V) => setMap(prev => new Map(prev.set(key, value))),
      delete: (key: K) =>
        setMap(prev => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        }),
      clear: () => setMap(new Map()),
      update: (key: K, updater: (value: V | undefined) => V) =>
        setMap(prev => {
          const newMap = new Map(prev);
          newMap.set(key, updater(prev.get(key)));
          return newMap;
        }),
    }),
    []
  );

  return [map, operations] as const;
};

// Previous value hook for debugging re-renders
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T>();
  const previousRef = useRef<T>();

  if (ref.current !== value) {
    previousRef.current = ref.current;
    ref.current = value;
  }

  return previousRef.current;
};

// Changed values detector for debugging
export const useChangedValues = <T extends Record<string, any>>(values: T) => {
  const previous = usePrevious(values);
  const changedValues = useRef<Partial<T>>({});

  if (previous) {
    const changed: Partial<T> = {};
    for (const key in values) {
      if (values[key] !== previous[key]) {
        changed[key] = values[key];
      }
    }
    changedValues.current = changed;
  }

  return changedValues.current;
};
