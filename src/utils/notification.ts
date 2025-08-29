/**
 * Platform-agnostic notification service
 * Automatically selects the appropriate notification implementation based on platform
 */

import { NotificationService, NotificationConfig } from './notification.interface';

let notificationService: NotificationService;

/**
 * Get platform-appropriate notification service
 */
function createNotificationService(config?: Partial<NotificationConfig>): NotificationService {
  // Platform detection - web vs React Native
  if (typeof window !== 'undefined' && 'Notification' in window) {
    // Web environment with Notification API
    const { createWebNotificationService } = require('./notification.web');
    return createWebNotificationService(config);
  } else {
    // React Native environment
    const { createReactNativeNotificationService } = require('./notification.reactnative');
    return createReactNativeNotificationService(config);
  }
}

/**
 * Get the default notification service instance (singleton pattern)
 */
export function getNotificationService(): NotificationService {
  if (!notificationService) {
    notificationService = createNotificationService();
  }
  return notificationService;
}

/**
 * Convenience functions for common notification operations
 */
export const notificationHelper = {
  /**
   * Check if notifications are supported
   */
  isSupported: () => {
    const service = getNotificationService();
    return service.isSupported();
  },

  /**
   * Get current permission status
   */
  getPermissionStatus: () => {
    const service = getNotificationService();
    return service.getPermissionStatus();
  },

  /**
   * Request notification permission
   */
  requestPermission: async () => {
    const service = getNotificationService();
    return await service.requestPermission();
  },

  /**
   * Show a notification
   * @param title Notification title
   * @param body Notification body text
   * @param options Additional options
   */
  showNotification: async (title: string, body?: string, options?: any) => {
    const service = getNotificationService();
    return await service.showNotification(title, { body, ...options });
  },

  /**
   * Show a simple notification with just title and body
   * @param title Notification title
   * @param body Notification body text
   */
  notify: async (title: string, body?: string) => {
    const service = getNotificationService();
    return await service.showNotification(title, { body });
  },

  /**
   * Show an email notification
   * @param emailCount Number of new emails
   * @param from Email sender (for single email)
   * @param subject Email subject (for single email)
   */
  notifyNewEmail: async (emailCount: number, from?: string, subject?: string) => {
    const service = getNotificationService();
    
    const title = emailCount === 1 ? 'New Email' : `${emailCount} New Emails`;
    let body: string;
    
    if (emailCount === 1 && from && subject) {
      body = `From: ${from}\nSubject: ${subject}`;
    } else {
      body = `You have ${emailCount} new email${emailCount === 1 ? '' : 's'}`;
    }
    
    return await service.showNotification(title, {
      body,
      icon: '/favicon.ico',
      tag: 'new-emails',
      data: { type: 'new-email', count: emailCount }
    });
  },

  /**
   * Set click handler for notifications
   * @param handler Function to call when notification is clicked
   */
  setClickHandler: (handler: (data?: any) => void) => {
    const service = getNotificationService();
    service.setClickHandler(handler);
  },

  /**
   * Check if permission is granted
   */
  hasPermission: () => {
    const service = getNotificationService();
    return service.hasPermission();
  },

  /**
   * Close a specific notification
   * @param notificationId Notification ID
   */
  closeNotification: async (notificationId: string) => {
    const service = getNotificationService();
    return await service.closeNotification(notificationId);
  },

  /**
   * Clear all notifications
   */
  clearAll: async () => {
    const service = getNotificationService();
    return await service.clearAllNotifications();
  },

  /**
   * Get platform capabilities
   */
  getCapabilities: () => {
    const service = getNotificationService();
    return service.getCapabilities();
  }
};

// Re-export types for convenience
export type {
  NotificationService,
  NotificationOptions,
  NotificationResult,
  NotificationPermissionResult,
  NotificationCapabilities,
  NotificationConfig
} from './notification.interface';