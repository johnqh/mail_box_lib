/**
 * Platform-agnostic persistence service interface
 * Handles data persistence across different storage mechanisms
 */

import { RequestStatus } from '../../business/core/enums';
import { StorageType } from '../../di';

interface PersistenceOptions {
  ttl?: number; // Time to live in milliseconds
  encrypted?: boolean;
  compressed?: boolean;
  serializer?: 'json' | 'msgpack' | 'custom';
}

interface PersistenceResult<T> {
  data: T | null;
  status: RequestStatus;
  error?: string;
  cachedAt?: Date;
  expiresAt?: Date;
}

interface PersistenceService {
  /**
   * Store data with key
   */
  store<T>(key: string, data: T, options?: PersistenceOptions): Promise<void>;

  /**
   * Retrieve data by key
   */
  retrieve<T>(key: string): Promise<PersistenceResult<T>>;

  /**
   * Check if data exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Remove data by key
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all data
   */
  clear(): Promise<void>;

  /**
   * Get all keys
   */
  keys(): Promise<string[]>;

  /**
   * Get storage info
   */
  getStorageInfo(): Promise<StorageInfo>;
}

interface StorageInfo {
  type: StorageType;
  totalSize: number;
  usedSize: number;
  availableSize: number;
  keyCount: number;
}

/**
 * Cache-specific persistence service
 */
interface CacheService extends PersistenceService {
  /**
   * Store with automatic expiration
   */
  cache<T>(key: string, data: T, ttl: number): Promise<void>;

  /**
   * Get from cache with freshness check
   */
  get<T>(key: string, maxAge?: number): Promise<PersistenceResult<T>>;

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): Promise<void>;

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): Promise<void>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  totalSize: number;
  keyCount: number;
}

/**
 * Database-like persistence service for complex queries
 */
interface DatabaseService {
  /**
   * Store record with index support
   */
  put<T>(
    table: string,
    key: string,
    record: T,
    indexes?: Record<string, any>
  ): Promise<void>;

  /**
   * Get record by key
   */
  get<T>(table: string, key: string): Promise<T | null>;

  /**
   * Query records by index
   */
  query<T>(table: string, index: string, value: any): Promise<T[]>;

  /**
   * Update record
   */
  update<T>(table: string, key: string, updates: Partial<T>): Promise<void>;

  /**
   * Delete record
   */
  delete(table: string, key: string): Promise<void>;

  /**
   * Create table/collection
   */
  createTable(table: string, schema?: any): Promise<void>;

  /**
   * Drop table/collection
   */
  dropTable(table: string): Promise<void>;

  /**
   * Transaction support
   */
  transaction<T>(operations: DatabaseOperation[]): Promise<T>;
}

interface DatabaseOperation {
  type: 'put' | 'get' | 'update' | 'delete';
  table: string;
  key: string;
  data?: any;
}

/**
 * User-specific persistence service
 */
interface UserPersistenceService {
  /**
   * Store user data
   */
  storeUserData<T>(
    userId: string,
    key: string,
    data: T,
    options?: PersistenceOptions
  ): Promise<void>;

  /**
   * Retrieve user data
   */
  getUserData<T>(userId: string, key: string): Promise<PersistenceResult<T>>;

  /**
   * Remove user data
   */
  removeUserData(userId: string, key: string): Promise<void>;

  /**
   * Clear all user data
   */
  clearUserData(userId: string): Promise<void>;

  /**
   * Get user data keys
   */
  getUserDataKeys(userId: string): Promise<string[]>;

  /**
   * Export user data
   */
  exportUserData(userId: string): Promise<Record<string, any>>;

  /**
   * Import user data
   */
  importUserData(userId: string, data: Record<string, any>): Promise<void>;
}

/**
 * Settings persistence service
 */
interface SettingsPersistenceService {
  /**
   * Get setting value
   */
  getSetting<T>(key: string, defaultValue?: T): Promise<T>;

  /**
   * Set setting value
   */
  setSetting<T>(key: string, value: T): Promise<void>;

  /**
   * Remove setting
   */
  removeSetting(key: string): Promise<void>;

  /**
   * Get all settings
   */
  getAllSettings(): Promise<Record<string, any>>;

  /**
   * Reset to defaults
   */
  resetToDefaults(): Promise<void>;

  /**
   * Watch setting changes
   */
  watchSetting<T>(key: string, callback: (value: T) => void): () => void;
}

/**
 * Factory for creating persistence services
 */
interface PersistenceServiceFactory {
  /**
   * Create basic persistence service
   */
  createPersistenceService(storageType: StorageType): PersistenceService;

  /**
   * Create cache service
   */
  createCacheService(storageType: StorageType): CacheService;

  /**
   * Create database service
   */
  createDatabaseService(storageType: StorageType): DatabaseService;

  /**
   * Create user persistence service
   */
  createUserPersistenceService(
    storageType: StorageType
  ): UserPersistenceService;

  /**
   * Create settings persistence service
   */
  createSettingsPersistenceService(
    storageType: StorageType
  ): SettingsPersistenceService;
}

export {
  type PersistenceOptions,
  type PersistenceResult,
  type PersistenceService,
  type StorageInfo,
  type CacheService,
  type CacheStats,
  type DatabaseService,
  type DatabaseOperation,
  type UserPersistenceService,
  type SettingsPersistenceService,
  type PersistenceServiceFactory,
};
