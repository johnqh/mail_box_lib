/**
 * Platform-agnostic dependency injection container
 * Manages all services and their dependencies
 */

import {
  EmailAddressService,
  EmailService,
  MailboxService,
} from '../../../types/services';
import {
  AuthEmailAddressService,
  AuthManager,
  AuthService,
  AuthStorageService,
} from '../../../di';
import {
  DefaultEmailOperations,
  EmailOperations,
} from '../email/email-operations';
import {
  DefaultMailboxOperations,
  MailboxOperations,
} from '../mailbox/mailbox-operations';
import {
  DefaultNavigationOperations,
  NavigationOperations,
} from '../navigation/navigation-state';
import {
  AuthBusinessLogic,
  DefaultAuthBusinessLogic,
  DefaultEmailAddressBusinessLogic,
  EmailAddressBusinessLogic,
} from '../auth/auth-business-logic';
import { DefaultFolderOperations } from '../folder/folder-operations';
import { PlatformType } from '../enums';

// Storage interface for platform abstraction
export interface PlatformStorage {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

// Analytics interface for platform abstraction
export interface PlatformAnalytics {
  trackEvent(event: string, properties: Record<string, any>): void;
  setUserProperty(key: string, value: string): void;
  setUserId(userId: string): void;
  isEnabled(): boolean;
}

// Notification interface for platform abstraction
export interface PlatformNotifications {
  showNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error'
  ): void;
  requestPermission(): Promise<boolean>;
  scheduleNotification(title: string, message: string, delay: number): void;
}

// Theme interface for platform abstraction
export interface PlatformTheme {
  applyTheme(theme: string): void;
  applyFontSize(fontSize: string): void;
  getCurrentTheme(): string;
  watchSystemTheme(callback: (theme: string) => void): () => void;
}

// Network interface for platform abstraction
export interface PlatformNetwork {
  request(url: string, options: RequestInit): Promise<Response>;
  isOnline(): boolean;
  watchNetworkStatus(callback: (isOnline: boolean) => void): () => void;
}

// Configuration interface
export interface ServiceContainerConfig {
  apiBaseUrl: string;
  apiToken?: string;
  revenueCatApiKey?: string;
  firebaseConfig?: any;
  platform: PlatformType;
  isDevelopment: boolean;
  enableAnalytics: boolean;
  enableNotifications: boolean;
}

/**
 * Service registry for dependency injection
 */
export class ServiceContainer {
  private services = new Map<string, any>();
  private singletons = new Map<string, any>();

  constructor(private config: ServiceContainerConfig) {}

  // Register a service factory
  register<T>(
    key: string,
    factory: (container: ServiceContainer) => T,
    singleton: boolean = true
  ): void {
    this.services.set(key, { factory, singleton });
  }

  // Get a service instance
  get<T>(key: string): T {
    const serviceEntry = this.services.get(key);
    if (!serviceEntry) {
      throw new Error(`Service '${key}' not registered`);
    }

    // Return singleton if exists
    if (serviceEntry.singleton && this.singletons.has(key)) {
      return this.singletons.get(key);
    }

    // Create new instance
    const instance = serviceEntry.factory(this);

    // Store singleton
    if (serviceEntry.singleton) {
      this.singletons.set(key, instance);
    }

    return instance;
  }

  // Check if service is registered
  has(key: string): boolean {
    return this.services.has(key);
  }

  // Get configuration
  getConfig(): ServiceContainerConfig {
    return { ...this.config };
  }

  // Clear all services (useful for testing)
  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }
}

/**
 * Service keys for type-safe service resolution
 */
export const ServiceKeys = {
  // Platform services
  STORAGE: 'storage',
  ANALYTICS: 'analytics',
  NOTIFICATIONS: 'notifications',
  THEME: 'theme',
  NETWORK: 'network',
  PERSISTENCE: 'persistence',

  // Business logic
  EMAIL_OPERATIONS: 'emailOperations',
  MAILBOX_OPERATIONS: 'mailboxOperations',
  FOLDER_OPERATIONS: 'folderOperations',
  NAVIGATION_OPERATIONS: 'navigationOperations',
  AUTH_BUSINESS_LOGIC: 'authBusinessLogic',
  EMAIL_ADDRESS_BUSINESS_LOGIC: 'emailAddressBusinessLogic',

  // Data services
  EMAIL_SERVICE: 'emailService',
  MAILBOX_SERVICE: 'mailboxService',
  EMAIL_ADDRESS_SERVICE: 'emailAddressService',

  // Auth services
  AUTH_SERVICE: 'authService',
  AUTH_STORAGE_SERVICE: 'authStorageService',
  AUTH_EMAIL_ADDRESS_SERVICE: 'authEmailAddressService',
  AUTH_MANAGER: 'authManager',

  // Configuration
  CONFIG: 'config',
} as const;

/**
 * Factory function to create a pre-configured service container
 */
export function createServiceContainer(
  config: ServiceContainerConfig
): ServiceContainer {
  const container = new ServiceContainer(config);

  // Register business logic services (platform-agnostic)
  container.register(
    ServiceKeys.EMAIL_OPERATIONS,
    () => new DefaultEmailOperations()
  );
  container.register(
    ServiceKeys.MAILBOX_OPERATIONS,
    () => new DefaultMailboxOperations()
  );
  container.register(
    ServiceKeys.FOLDER_OPERATIONS,
    () => new DefaultFolderOperations()
  );
  container.register(
    ServiceKeys.NAVIGATION_OPERATIONS,
    () => new DefaultNavigationOperations()
  );
  container.register(
    ServiceKeys.AUTH_BUSINESS_LOGIC,
    () => new DefaultAuthBusinessLogic()
  );
  container.register(
    ServiceKeys.EMAIL_ADDRESS_BUSINESS_LOGIC,
    () => new DefaultEmailAddressBusinessLogic()
  );

  return container;
}

/**
 * Type-safe service resolver
 */
export class ServiceResolver {
  constructor(private container: ServiceContainer) {}

  // Business logic services
  getEmailOperations(): EmailOperations {
    return this.container.get<EmailOperations>(ServiceKeys.EMAIL_OPERATIONS);
  }

  getMailboxOperations(): MailboxOperations {
    return this.container.get<MailboxOperations>(
      ServiceKeys.MAILBOX_OPERATIONS
    );
  }

  getNavigationOperations(): NavigationOperations {
    return this.container.get<NavigationOperations>(
      ServiceKeys.NAVIGATION_OPERATIONS
    );
  }

  getAuthBusinessLogic(): AuthBusinessLogic {
    return this.container.get<AuthBusinessLogic>(
      ServiceKeys.AUTH_BUSINESS_LOGIC
    );
  }

  getEmailAddressBusinessLogic(): EmailAddressBusinessLogic {
    return this.container.get<EmailAddressBusinessLogic>(
      ServiceKeys.EMAIL_ADDRESS_BUSINESS_LOGIC
    );
  }

  // Platform services
  getStorage(): PlatformStorage {
    return this.container.get<PlatformStorage>(ServiceKeys.STORAGE);
  }

  getAnalytics(): PlatformAnalytics {
    return this.container.get<PlatformAnalytics>(ServiceKeys.ANALYTICS);
  }

  getNotifications(): PlatformNotifications {
    return this.container.get<PlatformNotifications>(ServiceKeys.NOTIFICATIONS);
  }

  getTheme(): PlatformTheme {
    return this.container.get<PlatformTheme>(ServiceKeys.THEME);
  }

  getNetwork(): PlatformNetwork {
    return this.container.get<PlatformNetwork>(ServiceKeys.NETWORK);
  }

  // Data services
  getEmailService(): EmailService {
    return this.container.get<EmailService>(ServiceKeys.EMAIL_SERVICE);
  }

  getMailboxService(): MailboxService {
    return this.container.get<MailboxService>(ServiceKeys.MAILBOX_SERVICE);
  }

  getEmailAddressService(): EmailAddressService {
    return this.container.get<EmailAddressService>(
      ServiceKeys.EMAIL_ADDRESS_SERVICE
    );
  }

  // Auth services
  getAuthService(): AuthService {
    return this.container.get<AuthService>(ServiceKeys.AUTH_SERVICE);
  }

  getAuthStorageService(): AuthStorageService {
    return this.container.get<AuthStorageService>(
      ServiceKeys.AUTH_STORAGE_SERVICE
    );
  }

  getAuthEmailAddressService(): AuthEmailAddressService {
    return this.container.get<AuthEmailAddressService>(
      ServiceKeys.AUTH_EMAIL_ADDRESS_SERVICE
    );
  }

  getAuthManager(): AuthManager {
    return this.container.get<AuthManager>(ServiceKeys.AUTH_MANAGER);
  }

  // Configuration
  getConfig(): ServiceContainerConfig {
    return this.container.getConfig();
  }
}
