/**
 * Web implementation of navigation service using React Router
 * Provides React Router compatibility with navigation abstraction
 */

import {
  NavigationConfig,
  NavigationOptions,
  NavigationService,
  NavigationState,
} from '../../di';

const DEFAULT_CONFIG: NavigationConfig = {
  enableBackGesture: false, // Not applicable to web
  enableSwipeGesture: false, // Not applicable to web
  animationType: 'none', // Not applicable to web
  enableAnalytics: true,
  fallbackPath: '/',
};

export class WebNavigationService implements NavigationService {
  private config: NavigationConfig;
  private listeners: ((state: NavigationState) => void)[] = [];
  private currentState: NavigationState;

  constructor(config?: Partial<NavigationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.currentState = this.buildCurrentState();

    // Listen to browser navigation events
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', this.handlePopState.bind(this));
    }
  }

  navigate(path: string, options: NavigationOptions = {}): void {
    if (!this.isSupported()) {
      console.warn('Navigation not supported in this environment');
      return;
    }

    try {
      if (typeof window !== 'undefined' && window.history) {
        const method = options.replace ? 'replaceState' : 'pushState';
        window.history[method](options.state || null, '', path);

        this.updateCurrentState();
        this.notifyListeners();

        if (this.config.enableAnalytics) {
          this.trackNavigation('navigate', path);
        }
      }
    } catch (error) {
      console.warn('Navigation failed:', error);
    }
  }

  goBack(fallbackPath?: string): void {
    if (!this.isSupported()) {
      console.warn('Navigation not supported in this environment');
      return;
    }

    try {
      if (this.canGoBack() && typeof window !== 'undefined' && window.history) {
        window.history.back();

        if (this.config.enableAnalytics) {
          this.trackNavigation('back');
        }
      } else if (fallbackPath) {
        this.navigate(fallbackPath);
      } else if (this.config.fallbackPath) {
        this.navigate(this.config.fallbackPath);
      }
    } catch (error) {
      console.warn('Go back failed:', error);
    }
  }

  goForward(): void {
    if (!this.isSupported()) {
      console.warn('Navigation not supported in this environment');
      return;
    }

    try {
      if (
        this.canGoForward() &&
        typeof window !== 'undefined' &&
        window.history
      ) {
        window.history.forward();

        if (this.config.enableAnalytics) {
          this.trackNavigation('forward');
        }
      }
    } catch (error) {
      console.warn('Go forward failed:', error);
    }
  }

  replace(path: string, options: NavigationOptions = {}): void {
    this.navigate(path, { ...options, replace: true });
  }

  getCurrentState(): NavigationState {
    return { ...this.currentState };
  }

  getCurrentPath(): string {
    if (typeof window !== 'undefined' && window.location) {
      return window.location.pathname;
    }
    return '/';
  }

  getSearchParams(): Record<string, string> {
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const result: Record<string, string> = {};
      params.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }
    return {};
  }

  getParams(): Record<string, string> {
    // In web environment, path parameters would be handled by React Router
    // This is a simplified implementation
    return {};
  }

  canGoBack(): boolean {
    if (typeof window !== 'undefined' && window.history) {
      return window.history.length > 1;
    }
    return false;
  }

  canGoForward(): boolean {
    // Browser doesn't provide a direct way to check if we can go forward
    // This is a limitation of the History API
    return false;
  }

  addListener(listener: (state: NavigationState) => void): () => void {
    this.listeners.push(listener);

    // Return cleanup function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.history !== 'undefined' &&
      typeof window.location !== 'undefined'
    );
  }

  private buildCurrentState(): NavigationState {
    return {
      currentPath: this.getCurrentPath(),
      params: this.getParams(),
      searchParams: this.getSearchParams(),
    };
  }

  private updateCurrentState(): void {
    const previousPath = this.currentState.currentPath;
    this.currentState = {
      ...this.buildCurrentState(),
      previousPath,
    };
  }

  private handlePopState(): void {
    this.updateCurrentState();
    this.notifyListeners();

    if (this.config.enableAnalytics) {
      this.trackNavigation('popstate', this.currentState.currentPath);
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
      } catch (error) {
        console.warn('Navigation listener error:', error);
      }
    });
  }

  private trackNavigation(type: string, path?: string): void {
    // In a real app, you would integrate with your analytics service here
    console.debug(
      `[Navigation Analytics] ${type}:`,
      path || this.currentState.currentPath
    );
  }
}

/**
 * Create a web navigation service instance
 */
export function createWebNavigationService(
  config?: Partial<NavigationConfig>
): NavigationService {
  return new WebNavigationService(config);
}

/**
 * Web-specific navigation helpers that work with React Router
 */
export const webNavigationHelpers = {
  /**
   * Get React Router navigate function
   * This is for compatibility with existing React Router code
   */
  getReactRouterNavigate: () => {
    // This would be used in components that still need direct React Router access
    // Returns the useNavigate hook for backward compatibility
    console.warn('getReactRouterNavigate should only be used during migration');
    return null;
  },

  /**
   * Convert React Router location to navigation state
   */
  convertLocationToState: (location: any): NavigationState => {
    return {
      currentPath: location.pathname || '/',
      params: location.params || {},
      searchParams: location.search
        ? Object.fromEntries(new URLSearchParams(location.search))
        : {},
    };
  },
};
