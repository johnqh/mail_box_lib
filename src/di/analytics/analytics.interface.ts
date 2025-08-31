/**
 * Platform-agnostic analytics service interface
 */

import {
  AnalyticsEvent,
  ChainType,
  LoginMethod,
  WalletType,
} from '../../business/core/enums';

export interface AnalyticsEventProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface AnalyticsService {
  /**
   * Initialize analytics service
   */
  initialize(config: AnalyticsConfig): Promise<void>;

  /**
   * Track an event
   */
  trackEvent(
    event: AnalyticsEvent | string,
    properties?: AnalyticsEventProperties
  ): void;

  /**
   * Set user property
   */
  setUserProperty(key: string, value: string): void;

  /**
   * Set user ID
   */
  setUserId(userId: string): void;

  /**
   * Set user properties in batch
   */
  setUserProperties(properties: Record<string, string>): void;

  /**
   * Track screen/page view
   */
  trackScreen(screenName: string, properties?: AnalyticsEventProperties): void;

  /**
   * Track error
   */
  trackError(error: Error, context?: AnalyticsEventProperties): void;

  /**
   * Track timing event
   */
  trackTiming(
    category: string,
    variable: string,
    time: number,
    label?: string
  ): void;

  /**
   * Check if analytics is enabled
   */
  isEnabled(): boolean;

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void;

  /**
   * Reset user data (for logout)
   */
  resetUser(): void;
}

export interface AnalyticsConfig {
  apiKey?: string;
  appId?: string;
  measurementId?: string;
  enabled: boolean;
  debugMode: boolean;
  userId?: string;
}

/**
 * Email-specific analytics events interface
 */
export interface EmailAnalyticsService extends AnalyticsService {
  /**
   * Track user authentication
   */
  trackAuth(
    method: LoginMethod,
    walletType?: WalletType,
    chainType?: ChainType
  ): void;

  /**
   * Track email action
   */
  trackEmailAction(
    action: string,
    emailId: string,
    properties?: AnalyticsEventProperties
  ): void;

  /**
   * Track navigation
   */
  trackNavigation(
    from: string,
    to: string,
    properties?: AnalyticsEventProperties
  ): void;

  /**
   * Track subscription event
   */
  trackSubscription(
    action: string,
    planType?: string,
    properties?: AnalyticsEventProperties
  ): void;

  /**
   * Track search
   */
  trackSearch(
    query: string,
    resultsCount: number,
    properties?: AnalyticsEventProperties
  ): void;

  /**
   * Track A/B test
   */
  trackABTest(
    testName: string,
    variant: string,
    action: 'viewed' | 'converted',
    conversionType?: string
  ): void;
}

/**
 * Analytics event builders for common events
 */
export class AnalyticsEventBuilder {
  static userLogin(
    method: LoginMethod,
    walletType?: WalletType
  ): AnalyticsEventProperties {
    return {
      method,
      wallet_type: walletType,
      timestamp: Date.now(),
    };
  }

  static emailAction(
    action: string,
    emailId: string,
    folder?: string
  ): AnalyticsEventProperties {
    return {
      action,
      email_id: emailId,
      folder,
      timestamp: Date.now(),
    };
  }

  static pageView(
    pageName: string,
    pagePath: string
  ): AnalyticsEventProperties {
    return {
      page_name: pageName,
      page_path: pagePath,
      timestamp: Date.now(),
    };
  }

  static error(
    errorType: string,
    errorMessage: string,
    pageName?: string
  ): AnalyticsEventProperties {
    return {
      error_type: errorType,
      error_message: errorMessage,
      page_name: pageName,
      timestamp: Date.now(),
    };
  }

  static subscription(
    action: string,
    planType?: string,
    amount?: number,
    currency?: string
  ): AnalyticsEventProperties {
    return {
      action,
      plan_type: planType,
      amount,
      currency,
      timestamp: Date.now(),
    };
  }
}
