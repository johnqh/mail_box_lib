/**
 * Storage layer - Types and interfaces only
 */

// Re-export storage types from DI layer
export type {
  StorageProvider,
  PlatformStorage,
  AdvancedPlatformStorage,
  StorageService,
  SerializedStorageService,
  StorageFactory,
  StorageConfig,
} from '../di/storage/storage';
