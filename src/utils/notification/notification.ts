/**
 * Platform-agnostic notification utilities
 * Uses dependency injection - the NotificationService implementation must be provided by the consumer
 */

import { NotificationService } from '../../di';

/**
 * Create notification helper utilities for a given NotificationService implementation
 * @param notificationService Platform-specific notification service implementation
 */
function createNotificationHelper(notificationService: NotificationService) {
  return {
    /**
     * Check if notifications are supported
     */
    isSupported: () => {
      return notificationService.isSupported();
    },

    /**
     * Get current permission status
     */
    getPermissionStatus: () => {
      return notificationService.getPermissionStatus();
    },

    /**
     * Request notification permission
     */
    requestPermission: async () => {
      return await notificationService.requestPermission();
    },

    /**
     * Show a notification
     * @param title Notification title
     * @param body Notification body text
     * @param options Additional options
     */
    showNotification: async (title: string, body?: string, options?: any) => {
      return await notificationService.showNotification(title, {
        body,
        ...options,
      });
    },

    /**
     * Show a simple notification with just title and body
     * @param title Notification title
     * @param body Notification body text
     */
    notify: async (title: string, body?: string) => {
      return await notificationService.showNotification(
        title,
        body ? { body } : {}
      );
    },

    /**
     * Show an email notification
     * @param emailCount Number of new emails
     * @param from Email sender (for single email)
     * @param subject Email subject (for single email)
     */
    notifyNewEmail: async (
      emailCount: number,
      from?: string,
      subject?: string
    ) => {
      const title = emailCount === 1 ? 'New Email' : `${emailCount} New Emails`;
      let body: string;

      if (emailCount === 1 && from && subject) {
        body = `From: ${from}\nSubject: ${subject}`;
      } else {
        body = `You have ${emailCount} new email${emailCount === 1 ? '' : 's'}`;
      }

      return await notificationService.showNotification(title, {
        body,
        icon: '/favicon.ico',
        tag: 'new-emails',
        data: { type: 'new-email', count: emailCount },
      });
    },

    /**
     * Set click handler for notifications
     * @param handler Function to call when notification is clicked
     */
    setClickHandler: (handler: (data?: any) => void) => {
      notificationService.setClickHandler(handler);
    },

    /**
     * Check if permission is granted
     */
    hasPermission: () => {
      return notificationService.hasPermission();
    },

    /**
     * Close a specific notification
     * @param notificationId Notification ID
     */
    closeNotification: async (notificationId: string) => {
      return await notificationService.closeNotification(notificationId);
    },

    /**
     * Clear all notifications
     */
    clearAll: async () => {
      return await notificationService.clearAllNotifications();
    },

    /**
     * Get platform capabilities
     */
    getCapabilities: () => {
      return notificationService.getCapabilities();
    },
  };
}

// Re-export types for convenience
export type {
  NotificationService,
  NotificationOptions,
  NotificationResult,
  NotificationPermissionResult,
  NotificationCapabilities,
} from '../../di';

export { createNotificationHelper };
