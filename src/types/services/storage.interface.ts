/**
 * Platform-agnostic storage service interface
 */

import { StorageType } from '../../business/core/enums';

export interface StorageService {
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
export interface SerializedStorageService {
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
export interface StorageFactory {
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
export interface StorageConfig {
  prefix?: string;
  encryption?: boolean;
  compression?: boolean;
  ttl?: number; // Time to live in milliseconds
}
