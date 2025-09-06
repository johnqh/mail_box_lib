/**
 * Platform-agnostic analytics interface
 * This interface can be implemented for web (Firebase) or React Native (different analytics providers)
 */

// AnalyticsEvent is now imported from business logic enums (enum takes precedence over interface)
import { AnalyticsEvent } from '../../business/core/enums';
export { AnalyticsEvent };

/**
 * Analytics event data interface for passing event with parameters
 */
interface AnalyticsEventData {
  event: AnalyticsEvent;
  parameters?: Record<string, any>;
}

/**
 * Platform-agnostic analytics client interface
 * Abstracts analytics tracking to work across web and React Native
 */
interface _AnalyticsClient {
  /**
   * Track an analytics event
   * @param event Event enum value or event data with parameters
   */
  trackEvent(event: AnalyticsEvent | AnalyticsEventData): void;

  /**
   * Set user properties for analytics
   * @param properties User properties to set
   */
  setUserProperties(properties: Record<string, any>): void;

  /**
   * Set current user ID for analytics
   * @param userId User identifier
   */
  setUserId(userId: string | null): void;

  /**
   * Enable or disable analytics collection
   * @param enabled Whether analytics should be enabled
   */
  setAnalyticsEnabled(enabled: boolean): void;

  /**
   * Set current screen/page for analytics
   * @param screenName Name of the current screen/page
   * @param screenClass Optional screen class
   */
  setCurrentScreen(screenName: string, screenClass?: string): void;
}

/**
 * Context provider interface for getting current analytics context
 * This allows the analytics to automatically include context like user info, page, etc.
 */
interface _AnalyticsContextProvider {
  /**
   * Get current context data that should be included with all events
   * @returns Context data to merge with event parameters
   */
  getCurrentContext(): Record<string, any>;
}

export {
  type AnalyticsEventData,
  type _AnalyticsClient as AnalyticsClient,
  type _AnalyticsContextProvider as AnalyticsContextProvider,
};
