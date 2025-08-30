/**
 * Analytics utilities
 */

// Web implementation
export * from './analytics.web';

// React Native implementation  
export * from './analytics.reactnative';

// Note: AnalyticsEvent enum is exported from business/core/enums
// AnalyticsClient interface is available from business logic
// Avoid duplicate exports to prevent conflicts