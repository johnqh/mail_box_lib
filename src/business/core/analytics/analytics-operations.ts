/**
 * Platform-agnostic analytics business logic
 * Handles analytics event creation, validation, and processing
 */

import {
  AnalyticsEvent,
  ChainType,
  EmailAction,
  EmailFolder,
  LoginMethod,
  SubscriptionAction,
  WalletType,
} from '../enums';

export interface AnalyticsEventData {
  name: AnalyticsEvent | string;
  properties: Record<string, any>;
  timestamp: number;
}

export interface UserProperties {
  userId?: string;
  walletAddress?: string;
  chainType?: ChainType;
  loginMethod?: LoginMethod;
  subscriptionStatus?: string;
  [key: string]: any;
}

export interface AnalyticsOperations {
  /**
   * Create authentication event
   */
  createAuthEvent(
    method: LoginMethod,
    walletType?: WalletType,
    chainType?: ChainType
  ): AnalyticsEventData;

  /**
   * Create email action event
   */
  createEmailActionEvent(
    action: EmailAction,
    emailId: string,
    folder?: EmailFolder
  ): AnalyticsEventData;

  /**
   * Create page view event
   */
  createPageViewEvent(pageName: string, pagePath: string): AnalyticsEventData;

  /**
   * Create subscription event
   */
  createSubscriptionEvent(
    action: SubscriptionAction,
    planType?: string,
    amount?: number,
    currency?: string
  ): AnalyticsEventData;

  /**
   * Create search event
   */
  createSearchEvent(query: string, resultsCount: number): AnalyticsEventData;

  /**
   * Create error event
   */
  createErrorEvent(
    errorType: string,
    errorMessage: string,
    pageName?: string
  ): AnalyticsEventData;

  /**
   * Create A/B test event
   */
  createABTestEvent(
    testName: string,
    variant: string,
    action: 'viewed' | 'converted',
    conversionType?: string
  ): AnalyticsEventData;

  /**
   * Create navigation event
   */
  createNavigationEvent(fromPage: string, toPage: string): AnalyticsEventData;

  /**
   * Create folder switch event
   */
  createFolderSwitchEvent(
    fromFolder: EmailFolder,
    toFolder: EmailFolder
  ): AnalyticsEventData;

  /**
   * Validate event data
   */
  validateEventData(eventData: AnalyticsEventData): boolean;

  /**
   * Sanitize event properties
   */
  sanitizeEventProperties(properties: Record<string, any>): Record<string, any>;

  /**
   * Create user properties
   */
  createUserProperties(userData: {
    walletAddress?: string;
    chainType?: ChainType;
    loginMethod?: LoginMethod;
    subscriptionStatus?: string;
  }): UserProperties;

  /**
   * Merge event properties with common properties
   */
  mergeWithCommonProperties(
    properties: Record<string, any>,
    commonProperties: Record<string, any>
  ): Record<string, any>;

  /**
   * Check if event should be tracked
   */
  shouldTrackEvent(eventName: string, properties: Record<string, any>): boolean;

  /**
   * Transform event for different analytics providers
   */
  transformEventForProvider(
    eventData: AnalyticsEventData,
    provider: 'firebase' | 'amplitude' | 'mixpanel'
  ): any;
}

export class DefaultAnalyticsOperations implements AnalyticsOperations {
  private readonly MAX_PROPERTY_LENGTH = 1000;
  private readonly MAX_EVENT_NAME_LENGTH = 40;

  createAuthEvent(
    method: LoginMethod,
    walletType?: WalletType,
    chainType?: ChainType
  ): AnalyticsEventData {
    return {
      name: AnalyticsEvent.USER_LOGIN,
      properties: {
        method,
        wallet_type: walletType,
        chain_type: chainType,
      },
      timestamp: Date.now(),
    };
  }

  createEmailActionEvent(
    action: EmailAction,
    emailId: string,
    folder?: EmailFolder
  ): AnalyticsEventData {
    const eventMap: Record<EmailAction, AnalyticsEvent> = {
      [EmailAction.OPEN]: AnalyticsEvent.EMAIL_OPEN,
      [EmailAction.REPLY]: AnalyticsEvent.EMAIL_REPLY,
      [EmailAction.FORWARD]: AnalyticsEvent.EMAIL_FORWARD,
      [EmailAction.DELETE]: AnalyticsEvent.EMAIL_DELETE,
      [EmailAction.STAR]: AnalyticsEvent.EMAIL_STAR,
      [EmailAction.UNSTAR]: AnalyticsEvent.EMAIL_STAR,
      [EmailAction.MARK_READ]: AnalyticsEvent.EMAIL_OPEN,
      [EmailAction.MARK_UNREAD]: AnalyticsEvent.EMAIL_OPEN,
    };

    return {
      name: eventMap[action],
      properties: {
        action,
        email_id: emailId,
        folder,
        starred: action === EmailAction.STAR,
      },
      timestamp: Date.now(),
    };
  }

  createPageViewEvent(pageName: string, pagePath: string): AnalyticsEventData {
    return {
      name: AnalyticsEvent.PAGE_VIEW,
      properties: {
        page_name: pageName,
        page_path: pagePath,
      },
      timestamp: Date.now(),
    };
  }

  createSubscriptionEvent(
    action: SubscriptionAction,
    planType?: string,
    amount?: number,
    currency?: string
  ): AnalyticsEventData {
    const eventMap: Record<SubscriptionAction, AnalyticsEvent> = {
      [SubscriptionAction.VIEW]: AnalyticsEvent.SUBSCRIPTION_VIEW,
      [SubscriptionAction.PURCHASE]: AnalyticsEvent.SUBSCRIPTION_PURCHASE,
      [SubscriptionAction.CANCEL]: AnalyticsEvent.SUBSCRIPTION_CANCEL,
      [SubscriptionAction.RESTORE]: AnalyticsEvent.SUBSCRIPTION_VIEW,
    };

    return {
      name: eventMap[action],
      properties: {
        action,
        plan_type: planType,
        amount,
        currency,
      },
      timestamp: Date.now(),
    };
  }

  createSearchEvent(query: string, resultsCount: number): AnalyticsEventData {
    return {
      name: AnalyticsEvent.SEARCH_PERFORMED,
      properties: {
        query: this.sanitizeString(query),
        results_count: resultsCount,
        query_length: query.length,
      },
      timestamp: Date.now(),
    };
  }

  createErrorEvent(
    errorType: string,
    errorMessage: string,
    pageName?: string
  ): AnalyticsEventData {
    return {
      name: AnalyticsEvent.ERROR_OCCURRED,
      properties: {
        error_type: errorType,
        error_message: this.sanitizeString(errorMessage),
        page_name: pageName,
      },
      timestamp: Date.now(),
    };
  }

  createABTestEvent(
    testName: string,
    variant: string,
    action: 'viewed' | 'converted',
    conversionType?: string
  ): AnalyticsEventData {
    const eventName =
      action === 'viewed'
        ? AnalyticsEvent.AB_TEST_VIEWED
        : AnalyticsEvent.AB_TEST_CONVERTED;

    return {
      name: eventName,
      properties: {
        test_name: testName,
        variant,
        conversion_type: conversionType,
      },
      timestamp: Date.now(),
    };
  }

  createNavigationEvent(fromPage: string, toPage: string): AnalyticsEventData {
    return {
      name: AnalyticsEvent.PAGE_VIEW,
      properties: {
        from_page: fromPage,
        to_page: toPage,
        page_name: toPage,
      },
      timestamp: Date.now(),
    };
  }

  createFolderSwitchEvent(
    fromFolder: EmailFolder,
    toFolder: EmailFolder
  ): AnalyticsEventData {
    return {
      name: AnalyticsEvent.FOLDER_SWITCH,
      properties: {
        from_folder: fromFolder,
        to_folder: toFolder,
      },
      timestamp: Date.now(),
    };
  }

  validateEventData(eventData: AnalyticsEventData): boolean {
    // Validate event name
    if (!eventData.name || typeof eventData.name !== 'string') {
      return false;
    }

    if (eventData.name.length > this.MAX_EVENT_NAME_LENGTH) {
      return false;
    }

    // Validate timestamp
    if (!eventData.timestamp || typeof eventData.timestamp !== 'number') {
      return false;
    }

    // Validate properties
    if (eventData.properties) {
      for (const [key, value] of Object.entries(eventData.properties)) {
        if (
          typeof value === 'string' &&
          value.length > this.MAX_PROPERTY_LENGTH
        ) {
          return false;
        }
      }
    }

    return true;
  }

  sanitizeEventProperties(
    properties: Record<string, any>
  ): Record<string, any> {
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      if (value === null || value === undefined) {
        continue;
      }

      // Sanitize key
      const sanitizedKey = this.sanitizeString(key).substring(0, 40);

      // Sanitize value based on type
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      } else {
        // Convert objects to strings
        sanitized[sanitizedKey] = this.sanitizeString(String(value));
      }
    }

    return sanitized;
  }

  createUserProperties(userData: {
    walletAddress?: string;
    chainType?: ChainType;
    loginMethod?: LoginMethod;
    subscriptionStatus?: string;
  }): UserProperties {
    const properties: UserProperties = {};

    if (userData.walletAddress) {
      properties.userId = userData.walletAddress;
      properties.walletAddress = userData.walletAddress;
    }

    if (userData.chainType) {
      properties.chainType = userData.chainType;
    }

    if (userData.loginMethod) {
      properties.loginMethod = userData.loginMethod;
    }

    if (userData.subscriptionStatus) {
      properties.subscriptionStatus = userData.subscriptionStatus;
    }

    return properties;
  }

  mergeWithCommonProperties(
    properties: Record<string, any>,
    commonProperties: Record<string, any>
  ): Record<string, any> {
    return {
      ...commonProperties,
      ...properties,
      timestamp: Date.now(),
    };
  }

  shouldTrackEvent(
    eventName: string,
    properties: Record<string, any>
  ): boolean {
    // Don't track sensitive events
    const sensitiveEvents = ['debug', 'test', 'internal'];
    if (
      sensitiveEvents.some(sensitive =>
        eventName.toLowerCase().includes(sensitive)
      )
    ) {
      return false;
    }

    // Don't track if user has opted out (would be checked via properties)
    if (properties.analytics_disabled === true) {
      return false;
    }

    return true;
  }

  transformEventForProvider(
    eventData: AnalyticsEventData,
    provider: 'firebase' | 'amplitude' | 'mixpanel'
  ): any {
    switch (provider) {
      case 'firebase':
        return {
          name: eventData.name,
          parameters: eventData.properties,
        };

      case 'amplitude':
        return {
          event_type: eventData.name,
          event_properties: eventData.properties,
          time: eventData.timestamp,
        };

      case 'mixpanel':
        return {
          event: eventData.name,
          properties: {
            ...eventData.properties,
            time: eventData.timestamp,
          },
        };

      default:
        return eventData;
    }
  }

  private sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '') // Remove potential HTML
      .replace(/[\x00-\x1f\x7f]/g, '') // Remove control characters
      .substring(0, this.MAX_PROPERTY_LENGTH);
  }
}
