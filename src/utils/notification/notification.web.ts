/**
 * Web implementation of notification service using browser Notification API
 */

import {
  NotificationService,
  NotificationOptions,
  NotificationResult,
  NotificationPermissionResult,
  NotificationCapabilities,
  NotificationConfig
} from './../../types/notification';

const DEFAULT_CONFIG: NotificationConfig = {
  enableAutoClose: true,
  autoCloseDelay: 5000,
  defaultIcon: '/favicon.ico',
  enableDebugLogging: false,
  fallbackToAlert: false
};

export class WebNotificationService implements NotificationService {
  private config: NotificationConfig;
  private clickHandler?: (data?: any) => void;
  private activeNotifications: Map<string, Notification> = new Map();

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      typeof Notification.requestPermission === 'function'
    );
  }

  getPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    try {
      return Notification.permission;
    } catch (error) {
      this.log('Error getting permission status:', error);
      return 'unsupported';
    }
  }

  async requestPermission(): Promise<NotificationPermissionResult> {
    if (!this.isSupported()) {
      return {
        granted: false,
        permission: 'denied',
        error: 'Notifications not supported'
      };
    }

    try {
      const permission = await Notification.requestPermission();
      return {
        granted: permission === 'granted',
        permission,
        error: permission === 'denied' ? 'Permission denied by user' : undefined
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      this.log('Error requesting permission:', error);
      return {
        granted: false,
        permission: 'denied',
        error: errorMessage
      };
    }
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<NotificationResult> {
    if (!this.isSupported()) {
      return {
        success: false,
        error: 'Notifications not supported'
      };
    }

    if (!this.hasPermission()) {
      return {
        success: false,
        error: 'Notification permission not granted'
      };
    }

    try {
      const notificationId = options.tag || `notification-${Date.now()}-${Math.random()}`;
      
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || this.config.defaultIcon,
        badge: options.badge || this.config.defaultIcon,
        tag: options.tag,
        requireInteraction: options.requireInteraction,
        silent: options.silent,
        data: options.data
      });

      // Store notification reference
      this.activeNotifications.set(notificationId, notification);

      // Set up click handler
      notification.onclick = (event) => {
        this.log('Notification clicked:', { title, data: options.data });
        
        // Focus window if possible
        if (typeof window !== 'undefined') {
          window.focus();
        }
        
        // Close notification
        notification.close();
        this.activeNotifications.delete(notificationId);
        
        // Call custom click handler
        if (this.clickHandler) {
          this.clickHandler(options.data);
        }
      };

      // Set up close handler
      notification.onclose = () => {
        this.activeNotifications.delete(notificationId);
      };

      // Set up error handler
      notification.onerror = (error) => {
        this.log('Notification error:', error);
        this.activeNotifications.delete(notificationId);
      };

      // Auto-close if enabled and not requiring interaction
      if (this.config.enableAutoClose && !options.requireInteraction) {
        setTimeout(() => {
          if (this.activeNotifications.has(notificationId)) {
            notification.close();
            this.activeNotifications.delete(notificationId);
          }
        }, this.config.autoCloseDelay);
      }

      this.log('Notification shown:', { title, notificationId });

      return {
        success: true,
        notificationId
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to show notification';
      this.log('Error showing notification:', error);
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async closeNotification(notificationId: string): Promise<boolean> {
    try {
      const notification = this.activeNotifications.get(notificationId);
      if (notification) {
        notification.close();
        this.activeNotifications.delete(notificationId);
        return true;
      }
      return false;
    } catch (error) {
      this.log('Error closing notification:', error);
      return false;
    }
  }

  async clearAllNotifications(): Promise<boolean> {
    try {
      for (const [id, notification] of this.activeNotifications) {
        notification.close();
      }
      this.activeNotifications.clear();
      return true;
    } catch (error) {
      this.log('Error clearing notifications:', error);
      return false;
    }
  }

  setClickHandler(handler: (data?: any) => void): void {
    this.clickHandler = handler;
  }

  hasPermission(): boolean {
    return this.getPermissionStatus() === 'granted';
  }

  getCapabilities(): NotificationCapabilities {
    if (!this.isSupported()) {
      return {
        supportsActions: false,
        supportsIcon: false,
        supportsBadge: false,
        supportsData: false,
        supportsSound: false,
        supportsVibration: false
      };
    }

    return {
      supportsActions: 'actions' in Notification.prototype,
      supportsIcon: true,
      supportsBadge: 'badge' in Notification.prototype,
      supportsData: true,
      supportsSound: !('silent' in Notification.prototype), // Inverted logic
      supportsVibration: 'vibrate' in navigator,
      maxActions: 2 // Standard browser limit
    };
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableDebugLogging) {
      console.log(`[WebNotificationService] ${message}`, ...args);
    }
  }
}

/**
 * Create a web notification service instance
 */
export function createWebNotificationService(config?: Partial<NotificationConfig>): NotificationService {
  return new WebNotificationService(config);
}

/**
 * Default web notification service instance
 */
export const webNotificationService = createWebNotificationService();