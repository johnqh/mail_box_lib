/**
 * Platform-agnostic storage interface
 * This interface can be implemented for web (localStorage) or React Native (AsyncStorage)
 */

interface PlatformStorage {
  /**
   * Store a value with a key
   * @param key Storage key
   * @param value Value to store
   */
  setItem(key: string, value: string): Promise<void> | void;

  /**
   * Retrieve a value by key
   * @param key Storage key
   * @returns The stored value or null if not found
   */
  getItem(key: string): Promise<string | null> | string | null;

  /**
   * Remove a value by key
   * @param key Storage key
   */
  removeItem(key: string): Promise<void> | void;

  /**
   * Clear all storage (optional)
   */
  clear?(): Promise<void> | void;

  /**
   * Get all keys (optional)
   */
  getAllKeys?(): Promise<string[]> | string[];
}

/**
 * Advanced storage interface with TTL and prefix support
 */
interface AdvancedPlatformStorage extends PlatformStorage {
  /**
   * Store a value with optional TTL
   * @param key Storage key
   * @param value Value to store
   * @param ttl Time to live in milliseconds (optional)
   */
  setItem(key: string, value: string, ttl?: number): Promise<void> | void;

  /**
   * Check if a key exists
   * @param key Storage key
   */
  hasItem(key: string): Promise<boolean> | boolean;

  /**
   * Clear items matching a pattern
   * @param pattern Pattern to match (optional)
   */
  clearPattern(pattern?: string): Promise<void> | void;
}

/**
 * Storage provider implementation that wraps platform storage
 */
interface StorageProvider {
  storage: PlatformStorage | AdvancedPlatformStorage;
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string, ttl?: number): Promise<void> | void;
  remove(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

export {
  type PlatformStorage,
  type AdvancedPlatformStorage,
  type StorageProvider,
};
