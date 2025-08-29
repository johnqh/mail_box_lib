/**
 * Navigation utilities
 */

// Web implementation
export * from './navigation.web';

// React Native implementation
export * from './navigation.reactnative';

// General navigation utilities
export * from './navigation';

// Re-export navigation types from centralized types
export type { NavigationService, NavigationHook, LocationHook, NavigationConfig } from '../../types/navigation';