/**
 * React Native implementation of navigation service
 * Uses React Navigation or similar React Native navigation library
 */

import {
  NavigationConfig,
  NavigationOptions,
  NavigationService,
  NavigationState,
} from '../../types';

const DEFAULT_CONFIG: NavigationConfig = {
  enableBackGesture: true,
  enableSwipeGesture: true,
  animationType: 'slide',
  enableAnalytics: true,
  fallbackPath: '/',
};

export class ReactNativeNavigationService implements NavigationService {
  private config: NavigationConfig;
  private listeners: ((state: NavigationState) => void)[] = [];
  private currentState: NavigationState;
  private navigationRef: any = null; // Reference to React Navigation

  constructor(config: Partial<NavigationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentState = this.buildCurrentState();
  }

  /**
   * Set navigation reference for React Navigation
   * This would be called from the app root with the navigation container ref
   */
  setNavigationRef(ref: any): void {
    this.navigationRef = ref;
  }

  navigate(path: string, options: NavigationOptions = {}): void {
    if (!this.isSupported()) {
      console.warn('React Native navigation not configured');
      return;
    }

    try {
      // In React Native with React Navigation, you would use:
      // this.navigationRef?.navigate(path, options);

      console.log(`[RN Navigation] Navigate to: ${path}`, options);

      // Mock implementation for development
      this.updateCurrentState(path);
      this.notifyListeners();

      if (this.config.enableAnalytics) {
        this.trackNavigation('navigate', path);
      }
    } catch (error) {
      console.warn('React Native navigation failed:', error);
    }
  }

  goBack(fallbackPath?: string): void {
    if (!this.isSupported()) {
      console.warn('React Native navigation not configured');
      return;
    }

    try {
      // In React Native with React Navigation, you would use:
      // if (this.navigationRef?.canGoBack()) {
      //   this.navigationRef.goBack();
      // } else if (fallbackPath) {
      //   this.navigate(fallbackPath);
      // }

      console.log(`[RN Navigation] Go back, fallback: ${fallbackPath}`);

      if (this.canGoBack()) {
        // Mock going back
        this.updateCurrentState(
          this.currentState.previousPath || this.config.fallbackPath || '/'
        );
        this.notifyListeners();

        if (this.config.enableAnalytics) {
          this.trackNavigation('back');
        }
      } else if (fallbackPath) {
        this.navigate(fallbackPath);
      }
    } catch (error) {
      console.warn('React Native go back failed:', error);
    }
  }

  goForward(): void {
    // React Navigation doesn't typically have a forward concept
    console.log('[RN Navigation] Go forward not supported in React Navigation');
  }

  replace(path: string, options: NavigationOptions = {}): void {
    if (!this.isSupported()) {
      console.warn('React Native navigation not configured');
      return;
    }

    try {
      // In React Native with React Navigation, you would use:
      // this.navigationRef?.replace(path, options);

      console.log(`[RN Navigation] Replace with: ${path}`, options);

      // Mock implementation
      this.updateCurrentState(path);
      this.notifyListeners();

      if (this.config.enableAnalytics) {
        this.trackNavigation('replace', path);
      }
    } catch (error) {
      console.warn('React Native replace failed:', error);
    }
  }

  getCurrentState(): NavigationState {
    return { ...this.currentState };
  }

  getCurrentPath(): string {
    // In React Native with React Navigation, you would use:
    // return this.navigationRef?.getCurrentRoute()?.name || '/';

    return this.currentState.currentPath;
  }

  getSearchParams(): Record<string, string> {
    // In React Native, search params would be passed as route params
    // This is a simplified implementation
    return this.currentState.searchParams;
  }

  getParams(): Record<string, string> {
    // In React Native with React Navigation, you would use:
    // return this.navigationRef?.getCurrentRoute()?.params || {};

    return this.currentState.params;
  }

  canGoBack(): boolean {
    // In React Native with React Navigation, you would use:
    // return this.navigationRef?.canGoBack() || false;

    return Boolean(this.currentState.previousPath);
  }

  canGoForward(): boolean {
    // React Navigation doesn't support forward navigation
    return false;
  }

  addListener(listener: (state: NavigationState) => void): () => void {
    this.listeners.push(listener);

    // In React Native with React Navigation, you would also add:
    // const unsubscribe = this.navigationRef?.addListener('state', (e) => {
    //   const state = this.convertNavigationState(e.data.state);
    //   listener(state);
    // });

    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
      // unsubscribe?.();
    };
  }

  isSupported(): boolean {
    // In React Native, you would check:
    // return this.navigationRef !== null;

    // For development, assume it's supported in React Native environment
    return typeof window === 'undefined';
  }

  private buildCurrentState(): NavigationState {
    return {
      currentPath: '/',
      params: {},
      searchParams: {},
    };
  }

  private updateCurrentState(newPath?: string): void {
    const previousPath = this.currentState.currentPath;
    this.currentState = {
      currentPath: newPath || this.currentState.currentPath,
      previousPath,
      params: {}, // Would be extracted from navigation state
      searchParams: {}, // Would be extracted from navigation state
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.warn('React Native navigation listener error:', error);
      }
    });
  }

  private trackNavigation(type: string, path?: string): void {
    // In a real app, you would integrate with your analytics service here
    console.debug(
      `[RN Navigation Analytics] ${type}:`,
      path || this.currentState.currentPath
    );
  }
}

/**
 * Create a React Native navigation service instance
 */
export function createReactNativeNavigationService(
  config?: Partial<NavigationConfig>
): NavigationService {
  return new ReactNativeNavigationService(config);
}

/**
 * React Native specific navigation helpers
 */
export const reactNativeNavigationHelpers = {
  /**
   * Initialize React Navigation integration
   * This would be called from your navigation container
   */
  initializeNavigation: (navigationRef: any) => {
    const service = navigationService as ReactNativeNavigationService;
    service.setNavigationRef(navigationRef);
  },

  /**
   * Convert React Navigation state to our navigation state
   */
  convertNavigationState: (rnState: any): NavigationState => {
    return {
      currentPath: rnState?.routes?.[rnState.index]?.name || '/',
      params: rnState?.routes?.[rnState.index]?.params || {},
      searchParams: {}, // React Navigation doesn't use search params
    };
  },

  /**
   * Get screen options for React Navigation
   */
  getScreenOptions: (config: NavigationConfig) => ({
    gestureEnabled: config.enableBackGesture,
    animationTypeForReplace: config.animationType,
    // Add more React Navigation specific options
  }),
};

// Export singleton instance for React Native
export const navigationService = createReactNativeNavigationService();
