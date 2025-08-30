/**
 * Storage layer - Platform-agnostic storage implementations
 */

// Web implementation
export * from './storage.web';

// React Native implementation
export * from './storage.reactnative';

// Re-export storage types from centralized types
export type { StorageProvider } from "../types";