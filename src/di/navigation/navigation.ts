/**
 * Platform-agnostic navigation interface
 * Abstracts navigation operations to work across web and React Native
 */

interface NavigationOptions {
  replace?: boolean;
  state?: any;
  preventScrollReset?: boolean;
}

interface NavigationState {
  currentPath: string;
  previousPath?: string;
  params: Record<string, string>;
  searchParams: Record<string, string>;
}

/**
 * Platform-agnostic navigation service
 */
interface NavigationService {
  /**
   * Navigate to a specific path
   * @param path Target path
   * @param options Navigation options
   */
  navigate(path: string, options?: NavigationOptions): void;

  /**
   * Go back to previous route
   * @param fallbackPath Fallback path if no history
   */
  goBack(fallbackPath?: string): void;

  /**
   * Go forward in navigation history
   */
  goForward(): void;

  /**
   * Replace current route
   * @param path Target path
   * @param options Navigation options
   */
  replace(path: string, options?: NavigationOptions): void;

  /**
   * Get current navigation state
   */
  getCurrentState(): NavigationState;

  /**
   * Get current path
   */
  getCurrentPath(): string;

  /**
   * Get search parameters
   */
  getSearchParams(): Record<string, string>;

  /**
   * Get path parameters
   */
  getParams(): Record<string, string>;

  /**
   * Check if can go back
   */
  canGoBack(): boolean;

  /**
   * Check if can go forward
   */
  canGoForward(): boolean;

  /**
   * Add navigation listener
   * @param listener Function to call on navigation changes
   * @returns Cleanup function
   */
  addListener(listener: (state: NavigationState) => void): () => void;

  /**
   * Check if navigation is supported
   */
  isSupported(): boolean;
}

/**
 * Navigation hook interface
 */
interface NavigationHook {
  navigate: (path: string, options?: NavigationOptions) => void;
  goBack: (fallbackPath?: string) => void;
  replace: (path: string, options?: NavigationOptions) => void;
  currentPath: string;
  searchParams: Record<string, string>;
  params: Record<string, string>;
  canGoBack: boolean;
  isSupported: boolean;
}

/**
 * Location hook interface
 */
interface LocationHook {
  pathname: string;
  search: string;
  searchParams: Record<string, string>;
  hash: string;
  state: any;
  key: string;
}

/**
 * Navigation configuration
 */
interface NavigationConfig {
  enableBackGesture?: boolean; // React Native specific
  enableSwipeGesture?: boolean; // React Native specific
  animationType?: 'slide' | 'fade' | 'none'; // React Native specific
  enableAnalytics?: boolean; // Track navigation events
  fallbackPath?: string; // Default fallback path
}

export {
  type NavigationOptions,
  type NavigationState,
  type NavigationService,
  type NavigationHook,
  type LocationHook,
  type NavigationConfig,
};
