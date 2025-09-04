/**
 * Custom hooks for accessing services from the dependency injection container
 */

import { ServiceKeys } from '../core/container/dependency-container';
import { useServiceContainer, useServiceResolver } from './ServiceProvider';
import type {
  PlatformAnalytics,
  PlatformNetwork,
  PlatformNotifications,
  PlatformStorage,
  PlatformTheme,
} from '../core/container/dependency-container';

/**
 * Get a service from the dependency injection container
 */
export function useService<T>(serviceKey: string): T {
  const container = useServiceContainer();
  return container.get<T>(serviceKey);
}

/**
 * Get the storage service
 */
export function useStorageService(): PlatformStorage {
  const resolver = useServiceResolver();
  return resolver.getStorage();
}

/**
 * Get the analytics service
 */
export function useAnalyticsService(): PlatformAnalytics {
  const resolver = useServiceResolver();
  return resolver.getAnalytics();
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
  return useService(ServiceKeys.PERSISTENCE);
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
  return useService(ServiceKeys.FOLDER_OPERATIONS);
}

/**
 * Get the application configuration
 * This should be provided by the consuming application through DI context
 * For now, we'll throw an error to indicate proper DI setup is needed
 */
export function useAppConfig() {
  const resolver = useServiceResolver();
  return resolver.getConfig();
}
