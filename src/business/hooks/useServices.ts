/**
 * Custom hooks for accessing services from the dependency injection container
 */

// Temporarily removed useServiceContainer import - needs proper context implementation
// import { useServiceContainer } from '../context/ServiceContainerContext';
import { ServiceKeys } from '../core/container/dependency-container';
// Temporarily import StorageService type from types
// import { StorageService } from '../../types';
// Temporarily import AnalyticsService type from DI
// import { AnalyticsService } from '../../di';
// Temporarily import PersistenceService type from types
// import { PersistenceService } from '../../types';
import { DefaultFolderOperations } from '../core/folder/folder-operations';
import type { 
  PlatformTheme, 
  PlatformNotifications, 
  PlatformNetwork,
  PlatformStorage,
  PlatformAnalytics
} from '../core/container/dependency-container';

/**
 * Get a service from the dependency injection container
 */
export function useService<T>(serviceKey: string): T {
  // TODO: Implement proper service container context
  throw new Error('Service container not implemented yet - needs context setup');
}

/**
 * Get the storage service
 */
export function useStorageService(): PlatformStorage {
  // TODO: Replace with proper DI implementation
  throw new Error('Storage service not implemented yet - needs context setup');
}

/**
 * Get the analytics service
 */
export function useAnalyticsService(): PlatformAnalytics {
  // TODO: Replace with proper DI implementation
  throw new Error('Analytics service not implemented yet - needs context setup');
}

/**
 * Get the theme service
 */
export function useThemeService(): PlatformTheme {
  return useService(ServiceKeys.THEME);
}

/**
 * Get the notifications service
 */
export function useNotificationsService(): PlatformNotifications {
  return useService(ServiceKeys.NOTIFICATIONS);
}

/**
 * Get the network service
 */
export function useNetworkService(): PlatformNetwork {
  return useService(ServiceKeys.NETWORK);
}

/**
 * Get the persistence service
 */
export function usePersistenceService(): any {
  // TODO: Replace with proper DI implementation
  throw new Error('Persistence service not implemented yet - needs context setup');
}

/**
 * Get the email service
 */
export function useEmailService(): any {
  return useService(ServiceKeys.EMAIL_SERVICE);
}

/**
 * Get the auth service
 */
export function useAuthService(): any {
  return useService(ServiceKeys.AUTH_SERVICE);
}

/**
 * Get the mailbox service
 */
export function useMailboxService(): any {
  return useService(ServiceKeys.MAILBOX_SERVICE);
}

/**
 * Get the email address service
 */
export function useEmailAddressService(): any {
  return useService(ServiceKeys.EMAIL_ADDRESS_SERVICE);
}

/**
 * Get the folder operations service
 */
export function useFolderOperations() {
  // TODO: Replace with proper DI implementation - temporary direct instantiation
  return new DefaultFolderOperations();
}

/**
 * Get the application configuration
 * This provides environment-specific configuration in a DI-compliant way
 */
export function useAppConfig() {
  // Import the config here to maintain DI pattern while accessing environment config
  // This is acceptable since config is essentially a singleton constant
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  if (typeof window !== 'undefined') {
    // Web environment
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { webAppConfig } = require('../../di/env');
    return webAppConfig;
  } else {
    // React Native environment  
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { reactNativeAppConfig } = require('../../di/env');
    return reactNativeAppConfig;
  }
}