/**
 * Platform-agnostic business logic layer
 *
 * This module exports all business logic operations that can be used across
 * web and React Native platforms. These modules contain no platform-specific
 * dependencies and focus purely on business rules and data transformations.
 */

// Note: Core enums now exported from @sudobility/types

// Analytics operations
export * from './analytics';

// Navigation and UI state
export * from './navigation/navigation-state';

// Authentication business logic
export * from './auth/auth-business-logic';

// TanStack Query system
export * from './query';

// Wallet status management
export * from './wallet';

// Direct imports for sync function
import { DefaultNavigationOperations } from './navigation/navigation-state';
import {
  DefaultAuthBusinessLogic,
  DefaultEmailAddressBusinessLogic,
} from './auth/auth-business-logic';

/**
 * Factory function to create all business logic operations with default implementations
 */
export async function createBusinessLogicServices() {
  return {
    navigationOps: new (
      await import('./navigation/navigation-state')
    ).DefaultNavigationOperations(),
    authOps: new (
      await import('./auth/auth-business-logic')
    ).DefaultAuthBusinessLogic(),
    emailAddressOps: new (
      await import('./auth/auth-business-logic')
    ).DefaultEmailAddressBusinessLogic(),
  };
}

/**
 * Sync version of factory function for immediate use
 */
function createBusinessLogicServicesSync() {
  return {
    navigationOps: new DefaultNavigationOperations(),
    authOps: new DefaultAuthBusinessLogic(),
    emailAddressOps: new DefaultEmailAddressBusinessLogic(),
  };
}

/**
 * Usage examples for React Native:
 *
 * ```typescript
 * // In your React Native app
 * import {
 *   NavigationStateManager
 * } from '@sudobility/lib';
 *
 * const navManager = new NavigationStateManager();
 *
 * // Use in your components
 * // The business logic is completely separated from UI frameworks
 * ```
 *
 * The business logic is completely separated from UI frameworks,
 * so it can be used with React Native, React, Vue, or any other framework.
 */

export { createBusinessLogicServicesSync };
