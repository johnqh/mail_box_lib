/**
 * Custom hooks for accessing services from the dependency injection container
 */

import { ServiceKeys } from '../../core/container/dependency-container';
import { useServiceContainer, useServiceResolver } from './ServiceProvider';
import type {
  PlatformAnalytics,
  PlatformNetwork,
  PlatformNotifications,
  PlatformStorage,
  PlatformTheme,
} from '../../core/container/dependency-container';

/**
 * Get a service from the dependency injection container
 */
function useService<T>(serviceKey: string): T {
  const container = useServiceContainer();
  return container.get<T>(serviceKey);
}

/**
 * Get the storage service
 */
function useStorageService(): PlatformStorage {
  const resolver = useServiceResolver();
  return resolver.getStorage();
}

/**
 * Get the analytics service
 */
function useAnalyticsService(): PlatformAnalytics {
  const resolver = useServiceResolver();
  return resolver.getAnalytics();
}

/**
 * Get the theme service
 */
function useThemeService(): PlatformTheme {
  return useService(ServiceKeys.THEME);
}

/**
 * Get the notifications service
 */
function useNotificationsService(): PlatformNotifications {
  return useService(ServiceKeys.NOTIFICATIONS);
}

/**
 * Get the network service
 */
function useNetworkService(): PlatformNetwork {
  return useService(ServiceKeys.NETWORK);
}

/**
 * Get the persistence service
 */
function usePersistenceService(): any {
  return useService(ServiceKeys.PERSISTENCE);
}

/**
 * Get the email service
 */
function useEmailService(): any {
  return useService(ServiceKeys.EMAIL_SERVICE);
}

/**
 * Get the auth service
 */
function useAuthService(): any {
  return useService(ServiceKeys.AUTH_SERVICE);
}

/**
 * Get the mailbox service
 */
function useMailboxService(): any {
  return useService(ServiceKeys.MAILBOX_SERVICE);
}

/**
 * Get the email address service
 */
function useEmailAddressService(): any {
  return useService(ServiceKeys.EMAIL_ADDRESS_SERVICE);
}

/**
 * Get the folder operations service
 */
function useFolderOperations() {
  return useService(ServiceKeys.FOLDER_OPERATIONS);
}

/**
 * Get the application configuration
 * This should be provided by the consuming application through DI context
 * For now, we'll throw an error to indicate proper DI setup is needed
 */
function useAppConfig() {
  const resolver = useServiceResolver();
  return resolver.getConfig();
}

export {
  useService,
  useStorageService,
  useAnalyticsService,
  useThemeService,
  useNotificationsService,
  useNetworkService,
  usePersistenceService,
  useEmailService,
  useAuthService,
  useMailboxService,
  useEmailAddressService,
  useFolderOperations,
  useAppConfig,
};
