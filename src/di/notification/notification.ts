/**
 * Platform-agnostic notification interface
 * Abstracts notification operations to work across web and React Native
 */

export interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
  actions?: NotificationAction[];
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationResult {
  success: boolean;
  error?: string;
  notificationId?: string;
}

export interface NotificationPermissionResult {
  granted: boolean;
  permission: 'granted' | 'denied' | 'default';
  error?: string;
}

/**
 * Platform-agnostic notification service
 */
export interface NotificationService {
  /**
   * Check if notifications are supported on this platform
   */
  isSupported(): boolean;

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported';

  /**
   * Request notification permission from user
   * @returns Promise with permission result
   */
  requestPermission(): Promise<NotificationPermissionResult>;

  /**
   * Show a notification
   * @param title Notification title
   * @param options Notification options
   * @returns Promise with operation result
   */
  showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<NotificationResult>;

  /**
   * Close a notification by ID
   * @param notificationId Notification identifier
   */
  closeNotification(notificationId: string): Promise<boolean>;

  /**
   * Clear all notifications
   */
  clearAllNotifications(): Promise<boolean>;

  /**
   * Set notification click handler
   * @param handler Function to call when notification is clicked
   */
  setClickHandler(handler: (data?: any) => void): void;

  /**
   * Check if permission is granted
   */
  hasPermission(): boolean;

  /**
   * Get platform-specific capabilities
   */
  getCapabilities(): NotificationCapabilities;
}

export interface NotificationCapabilities {
  supportsActions: boolean;
  supportsIcon: boolean;
  supportsBadge: boolean;
  supportsData: boolean;
  supportsSound: boolean;
  supportsVibration: boolean;
  maxActions?: number;
}

/**
 * Notification service configuration
 */
export interface NotificationConfig {
  enableAutoClose: boolean;
  autoCloseDelay: number; // milliseconds
  defaultIcon: string;
  enableDebugLogging: boolean;
  fallbackToAlert: boolean; // Use alert() as fallback in React Native
}

/**
 * Notification client wrapper for easier usage
 */
export interface NotificationClient {
  service: NotificationService;
  config: NotificationConfig;
  show(
    title: string,
    options?: NotificationOptions
  ): Promise<NotificationResult>;
  requestPermissions(): Promise<NotificationPermissionResult>;
}

/**
 * Notification context provider interface
 */
export interface NotificationContextProvider {
  client: NotificationClient;
  isSupported: boolean;
  hasPermission: boolean;
  requestPermission(): Promise<void>;
}
