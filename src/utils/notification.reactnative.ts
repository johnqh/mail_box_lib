/**
 * React Native implementation of notification service
 * Uses React Native push notifications or fallback methods
 */

import {
  NotificationService,
  NotificationOptions,
  NotificationResult,
  NotificationPermissionResult,
  NotificationCapabilities,
  NotificationConfig
} from './notification.interface';

const DEFAULT_CONFIG: NotificationConfig = {
  enableAutoClose: false, // React Native handles this automatically
  autoCloseDelay: 0,
  defaultIcon: '',
  enableDebugLogging: true,
  fallbackToAlert: true
};

export class ReactNativeNotificationService implements NotificationService {
  private config: NotificationConfig;
  private clickHandler?: (data?: any) => void;
  private hasRequestedPermission = false;

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  isSupported(): boolean {
    // In React Native, notifications are typically supported
    // This would depend on the specific React Native notification library used
    return typeof window === 'undefined'; // Simple React Native detection
  }

  getPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (!this.isSupported()) {
      return 'unsupported';
    }

    // In React Native, you would check with the notification library
    // For now, return a mock status
    if (this.hasRequestedPermission) {
      return 'granted'; // Mock granted status
    }
    return 'default';
  }

  async requestPermission(): Promise<NotificationPermissionResult> {
    if (!this.isSupported()) {
      return {
        granted: false,
        permission: 'denied',
        error: 'React Native notifications not configured'
      };
    }

    try {
      // In React Native, you would use something like:
      // import PushNotification from 'react-native-push-notification';
      // const result = await PushNotification.requestPermissions();
      
      this.log('Requesting notification permission in React Native');
      
      // Mock implementation
      this.hasRequestedPermission = true;
      
      return {
        granted: true,
        permission: 'granted'
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
        error: 'React Native notifications not supported'
      };
    }

    try {
      const notificationId = `rn-notification-${Date.now()}-${Math.random()}`;
      
      this.log('Showing React Native notification:', { title, options });

      // In React Native, you would use something like:
      // import PushNotification from 'react-native-push-notification';
      // PushNotification.localNotification({
      //   title,
      //   message: options.body || '',
      //   userInfo: options.data,
      //   playSound: !options.silent,
      //   soundName: 'default',
      //   importance: 'high',
      //   priority: 'high',
      // });

      // Fallback to alert for development/testing
      if (this.config.fallbackToAlert) {
        const message = options.body ? `${title}\n\n${options.body}` : title;
        // In React Native: Alert.alert(title, options.body);
        console.log(`[React Native Notification] ${message}`);
      }

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
      this.log('Closing React Native notification:', notificationId);
      
      // In React Native, you would use something like:
      // import PushNotification from 'react-native-push-notification';
      // PushNotification.cancelLocalNotifications({id: notificationId});
      
      return true;
    } catch (error) {
      this.log('Error closing notification:', error);
      return false;
    }
  }

  async clearAllNotifications(): Promise<boolean> {
    try {
      this.log('Clearing all React Native notifications');
      
      // In React Native, you would use something like:
      // import PushNotification from 'react-native-push-notification';
      // PushNotification.cancelAllLocalNotifications();
      
      return true;
    } catch (error) {
      this.log('Error clearing notifications:', error);
      return false;
    }
  }

  setClickHandler(handler: (data?: any) => void): void {
    this.clickHandler = handler;
    this.log('Set notification click handler');
    
    // In React Native, you would set up notification event listeners:
    // import PushNotification from 'react-native-push-notification';
    // PushNotification.configure({
    //   onNotification: (notification) => {
    //     if (notification.userInteraction) {
    //       handler(notification.data);
    //     }
    //   }
    // });
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
      supportsActions: true, // React Native supports notification actions
      supportsIcon: false, // Icons work differently in React Native
      supportsBadge: true, // Badge numbers are supported
      supportsData: true, // Custom data is supported
      supportsSound: true, // Sound is supported
      supportsVibration: true, // Vibration is supported
      maxActions: 3 // React Native typically supports more actions
    };
  }

  private log(message: string, ...args: any[]): void {
    if (this.config.enableDebugLogging) {
      console.log(`[ReactNativeNotificationService] ${message}`, ...args);
    }
  }
}

/**
 * Create a React Native notification service instance
 */
export function createReactNativeNotificationService(config?: Partial<NotificationConfig>): NotificationService {
  return new ReactNativeNotificationService(config);
}

/**
 * Default React Native notification service instance
 */
export const reactNativeNotificationService = createReactNativeNotificationService();