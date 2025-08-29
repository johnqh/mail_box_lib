/**
 * Web implementation of analytics client using Firebase Analytics
 */

import { AnalyticsClient, AnalyticsEvent } from './../../types/analytics';

/**
 * Web analytics client using Firebase Analytics
 * This implementation maintains current Firebase behavior
 */
export class WebAnalyticsClient implements AnalyticsClient {
  private firebaseTrackEvent: (event: AnalyticsEvent) => void;
  private firebaseSetUserProperties: (properties: Record<string, any>) => void;
  private firebaseSetUserId: (userId: string | null) => void;
  private firebaseSetAnalyticsEnabled: (enabled: boolean) => void;
  private firebaseSetCurrentScreen: (screenName: string, screenClass?: string) => void;

  constructor(
    firebaseTrackEvent: (event: AnalyticsEvent) => void,
    firebaseSetUserProperties: (properties: Record<string, any>) => void = () => {},
    firebaseSetUserId: (userId: string | null) => void = () => {},
    firebaseSetAnalyticsEnabled: (enabled: boolean) => void = () => {},
    firebaseSetCurrentScreen: (screenName: string, screenClass?: string) => void = () => {}
  ) {
    this.firebaseTrackEvent = firebaseTrackEvent;
    this.firebaseSetUserProperties = firebaseSetUserProperties;
    this.firebaseSetUserId = firebaseSetUserId;
    this.firebaseSetAnalyticsEnabled = firebaseSetAnalyticsEnabled;
    this.firebaseSetCurrentScreen = firebaseSetCurrentScreen;
  }

  trackEvent(event: AnalyticsEvent): void {
    try {
      this.firebaseTrackEvent(event);
    } catch (error) {
      console.warn('Analytics tracking failed:', error);
    }
  }

  setUserProperties(properties: Record<string, any>): void {
    try {
      this.firebaseSetUserProperties(properties);
    } catch (error) {
      console.warn('Analytics setUserProperties failed:', error);
    }
  }

  setUserId(userId: string | null): void {
    try {
      this.firebaseSetUserId(userId);
    } catch (error) {
      console.warn('Analytics setUserId failed:', error);
    }
  }

  setAnalyticsEnabled(enabled: boolean): void {
    try {
      this.firebaseSetAnalyticsEnabled(enabled);
    } catch (error) {
      console.warn('Analytics setAnalyticsEnabled failed:', error);
    }
  }

  setCurrentScreen(screenName: string, screenClass?: string): void {
    try {
      this.firebaseSetCurrentScreen(screenName, screenClass);
    } catch (error) {
      console.warn('Analytics setCurrentScreen failed:', error);
    }
  }
}

/**
 * Create web analytics client from Firebase context
 */
export const createWebAnalyticsClient = (
  trackEvent: (event: AnalyticsEvent) => void,
  setUserProperties?: (properties: Record<string, any>) => void,
  setUserId?: (userId: string | null) => void,
  setAnalyticsEnabled?: (enabled: boolean) => void,
  setCurrentScreen?: (screenName: string, screenClass?: string) => void
): WebAnalyticsClient => {
  return new WebAnalyticsClient(
    trackEvent,
    setUserProperties,
    setUserId,
    setAnalyticsEnabled,
    setCurrentScreen
  );
};