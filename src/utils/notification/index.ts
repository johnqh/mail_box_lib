/**
 * Notification utilities
 */

// Web implementation
export * from './notification.web';

// React Native implementation
export * from './notification.reactnative';

// General notification utilities
export * from './notification';

// Re-export notification types from centralized types
export type {
  NotificationClient,
  NotificationContextProvider,
} from '../../types';
