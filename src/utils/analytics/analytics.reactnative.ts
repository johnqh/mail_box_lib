/**
 * React Native implementation of analytics client
 * This shows how to implement the AnalyticsClient for React Native
 */

import { AnalyticsClient, AnalyticsEvent, AnalyticsEventData } from "../../types";

/**
 * React Native analytics client implementation
 * This would typically use libraries like @react-native-firebase/analytics
 * or other React Native analytics providers
 */
export class ReactNativeAnalyticsClient implements AnalyticsClient {
  private enabled: boolean = true;

  constructor() {
    // Initialize React Native analytics SDK here
    console.log('React Native Analytics Client initialized');
  }

  trackEvent(event: AnalyticsEvent | AnalyticsEventData): void {
    if (!this.enabled) return;

    try {
      let eventName: string;
      let parameters: Record<string, any> | undefined;

      if (typeof event === 'string') {
        // It's an AnalyticsEvent enum value
        eventName = event;
        parameters = undefined;
      } else {
        // It's an AnalyticsEventData object
        eventName = event.event;
        parameters = event.parameters;
      }

      // In React Native, you would use something like:
      // import analytics from '@react-native-firebase/analytics';
      // analytics().logEvent(eventName, parameters);
      
      // Or for other providers like Mixpanel:
      // import { Mixpanel } from 'mixpanel-react-native';
      // Mixpanel.track(eventName, parameters);

      console.log('RN Analytics Event:', eventName, parameters);
    } catch (error) {
      console.warn('React Native analytics tracking failed:', error);
    }
  }

  setUserProperties(properties: Record<string, any>): void {
    try {
      // Example for Firebase Analytics:
      // analytics().setUserProperties(properties);
      
      // Example for Mixpanel:
      // Mixpanel.getPeople().set(properties);

      console.log('RN Analytics User Properties:', properties);
    } catch (error) {
      console.warn('React Native analytics setUserProperties failed:', error);
    }
  }

  setUserId(userId: string | null): void {
    try {
      // Example for Firebase Analytics:
      // analytics().setUserId(userId);
      
      // Example for Mixpanel:
      // Mixpanel.identify(userId);

      console.log('RN Analytics User ID:', userId);
    } catch (error) {
      console.warn('React Native analytics setUserId failed:', error);
    }
  }

  setAnalyticsEnabled(enabled: boolean): void {
    this.enabled = enabled;
    
    try {
      // Example for Firebase Analytics:
      // analytics().setAnalyticsCollectionEnabled(enabled);
      
      // Example for Mixpanel:
      // Mixpanel.optOutTracking(!enabled);

      console.log('RN Analytics Enabled:', enabled);
    } catch (error) {
      console.warn('React Native analytics setAnalyticsEnabled failed:', error);
    }
  }

  setCurrentScreen(screenName: string, screenClass?: string): void {
    try {
      // Example for Firebase Analytics:
      // analytics().logScreenView({
      //   screen_name: screenName,
      //   screen_class: screenClass
      // });

      console.log('RN Analytics Screen:', screenName, screenClass);
    } catch (error) {
      console.warn('React Native analytics setCurrentScreen failed:', error);
    }
  }
}

// Export default instance
export const reactNativeAnalyticsClient = new ReactNativeAnalyticsClient();

/**
 * Usage instructions for React Native:
 * 
 * 1. Install required packages:
 *    npm install @react-native-firebase/app @react-native-firebase/analytics
 *    # OR for other providers:
 *    npm install mixpanel-react-native
 * 
 * 2. In your React Native app setup:
 *    import { ReactNativeAnalyticsClient } from './utils/analytics.reactnative';
 *    import { Analytics } from './utils/analytics';
 *    
 *    const analyticsClient = new ReactNativeAnalyticsClient();
 *    const analytics = new Analytics(
 *      analyticsClient.trackEvent.bind(analyticsClient),
 *      getCurrentContext // your context provider
 *    );
 * 
 * 3. The Analytics class will work exactly the same as in web
 */