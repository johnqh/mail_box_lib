/**
 * Notification utilities - Types and interfaces only
 */

// General notification utilities
export * from './notification';

// Re-export notification types from centralized types
export type { NotificationClient, NotificationContextProvider } from '../../di';
