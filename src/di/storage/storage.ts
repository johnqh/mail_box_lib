/**
 * Platform-agnostic storage interfaces for dependency injection
 * Consolidated storage definitions for both basic and advanced storage needs
 */

import { StorageType } from '../../business/core/enums';

/**
 * Basic platform storage interface
 * Can be implemented for web (localStorage) or React Native (AsyncStorage)
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

/**
 * Enhanced storage service interface from storage.interface.ts
 */
interface StorageService {
  /**
   * Get item from storage
   */
  getItem(key: string): Promise<string | null> | string | null;

  /**
   * Set item in storage
   */
  setItem(key: string, value: string): Promise<void> | void;

  /**
   * Remove item from storage
   */
  removeItem(key: string): Promise<void> | void;

  /**
   * Clear all items from storage
   */
  clear(): Promise<void> | void;

  /**
   * Get all keys in storage
   */
  getAllKeys(): Promise<string[]> | string[];

  /**
   * Check if storage is available
   */
  isAvailable(): boolean;

  /**
   * Get storage type
   */
  getType(): StorageType;
}

/**
 * Serialized storage service for objects
 */
interface SerializedStorageService {
  /**
   * Get object from storage
   */
  getObject<T>(key: string): Promise<T | null> | T | null;

  /**
   * Set object in storage
   */
  setObject<T>(key: string, value: T): Promise<void> | void;

  /**
   * Remove object from storage
   */
  removeObject(key: string): Promise<void> | void;

  /**
   * Check if object exists in storage
   */
  hasObject(key: string): Promise<boolean> | boolean;
}

/**
 * Storage factory interface
 */
interface StorageFactory {
  /**
   * Create storage service
   */
  createStorage(type: StorageType): StorageService;

  /**
   * Create serialized storage service
   */
  createSerializedStorage(type: StorageType): SerializedStorageService;

  /**
   * Get default storage type for platform
   */
  getDefaultStorageType(): StorageType;
}

/**
 * Storage configuration
 */
interface StorageConfig {
  prefix?: string;
  encryption?: boolean;
  compression?: boolean;
  ttl?: number; // Time to live in milliseconds
}

export {
  type PlatformStorage,
  type AdvancedPlatformStorage,
  type StorageProvider,
  type StorageService,
  type SerializedStorageService,
  type StorageFactory,
  type StorageConfig,
};
