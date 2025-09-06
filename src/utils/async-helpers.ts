/**
 * Common async operation patterns and helpers
 * Reduces boilerplate code for common async operations
 */

import { logger } from './logger';

type AsyncResult<T> = {
  data?: T;
  error?: Error;
  success: boolean;
};

/**
 * Safely execute an async operation with error handling
 * Returns a result object instead of throwing
 */
const safeAsync = async <T>(
  operation: () => Promise<T>,
  context?: string
): Promise<AsyncResult<T>> => {
  try {
    const data = await operation();
    return { data, success: true };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error(`Async operation failed: ${errorObj.message}`, context, error);
    return { error: errorObj, success: false };
  }
};

/**
 * Execute async operation with loading state tracking
 */
const withLoadingState = async <T>(
  operation: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void,
  context?: string
): Promise<T | undefined> => {
  setLoading(true);
  setError(null);

  try {
    const result = await operation();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    setError(errorMessage);
    logger.error(`Operation failed: ${errorMessage}`, context, error);
    return undefined;
  } finally {
    setLoading(false);
  }
};

/**
 * Execute multiple async operations in parallel with error handling
 */
const safeParallel = async <T extends readonly unknown[]>(
  operations: readonly [...{ [K in keyof T]: () => Promise<T[K]> }],
  context?: string
): Promise<AsyncResult<T>> => {
  try {
    const results = await Promise.all(operations.map(op => op()));
    return { data: results as unknown as T, success: true };
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error(
      `Parallel operations failed: ${errorObj.message}`,
      context,
      error
    );
    return { error: errorObj, success: false };
  }
};

/**
 * Execute async operation with timeout
 */
const withTimeout = async <T>(
  operation: () => Promise<T>,
  timeoutMs: number,
  context?: string
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error(`Operation timed out after ${timeoutMs}ms`)),
      timeoutMs
    )
  );

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    logger.error(`Timeout operation failed`, context, error);
    throw error;
  }
};

/**
 * Cache async operation results with TTL
 */
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const withCache = async <T>(
  key: string,
  operation: () => Promise<T>,
  ttlMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> => {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && now - cached.timestamp < cached.ttl) {
    return cached.data;
  }

  const result = await operation();
  cache.set(key, { data: result, timestamp: now, ttl: ttlMs });
  return result;
};

/**
 * Clear expired cache entries
 */
const clearExpiredCache = (): void => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp >= entry.ttl) {
      cache.delete(key);
    }
  }
};

/**
 * Debounce async operations
 */
const debounceMap = new Map<string, NodeJS.Timeout>();

const debounceAsync = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  delay: number,
  key: string
): ((...args: T) => Promise<R | undefined>) => {
  return (...args: T): Promise<R | undefined> => {
    return new Promise(resolve => {
      const existingTimeout = debounceMap.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(async () => {
        debounceMap.delete(key);
        try {
          const result = await fn(...args);
          resolve(result);
        } catch (error) {
          logger.error(`Debounced operation failed`, key, error);
          resolve(undefined);
        }
      }, delay);

      debounceMap.set(key, timeout);
    });
  };
};

export {
  safeAsync,
  withLoadingState,
  safeParallel,
  withTimeout,
  withCache,
  clearExpiredCache,
  debounceAsync,
  type AsyncResult,
};
