/**
 * Analytics utilities
 */

// Web implementation
export * from './analytics.web';

// React Native implementation  
export * from './analytics.reactnative';

// Re-export analytics types from centralized types
export type { AnalyticsClient, AnalyticsEvent, AnalyticsContextProvider } from '../../types/analytics';