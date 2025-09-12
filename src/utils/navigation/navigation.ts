/**
 * Platform-agnostic navigation service
 * Automatically selects the appropriate navigation implementation based on platform
 */

import {
  LocationHook,
  NavigationConfig,
  NavigationHook,
  NavigationOptions,
  NavigationService,
} from '../../di';

let navigationService: NavigationService;

/**
 * Get platform-appropriate navigation service
 */
function createNavigationService(
  config?: Partial<NavigationConfig>
): NavigationService {
  // Platform detection - web vs React Native
  if (typeof window !== 'undefined') {
    // Web environment - dynamic import for platform-specific code
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createWebNavigationService } = require('./navigation.web');
    return createWebNavigationService(config);
  } else {
    // React Native environment - dynamic import for platform-specific code
    const {
      createReactNativeNavigationService,
    } = require('./navigation.reactnative'); // eslint-disable-line @typescript-eslint/no-require-imports
    return createReactNativeNavigationService(config);
  }
}

/**
 * Get the default navigation service instance (singleton pattern)
 */
function getNavigationService(
  config?: Partial<NavigationConfig>
): NavigationService {
  if (!navigationService) {
    navigationService = createNavigationService(config);
  }
  return navigationService;
}

/**
 * Platform-agnostic navigation hook
 * Drop-in replacement for React Router's useNavigate
 */
function useNavigation(): NavigationHook {
  const service = getNavigationService();
  const currentState = service.getCurrentState();

  return {
    navigate: (path: string, options?: NavigationOptions) => {
      service.navigate(path, options);
    },
    goBack: (fallbackPath?: string) => {
      service.goBack(fallbackPath);
    },
    replace: (path: string, options?: NavigationOptions) => {
      service.replace(path, options);
    },
    currentPath: currentState.currentPath,
    searchParams: currentState.searchParams,
    params: currentState.params,
    canGoBack: service.canGoBack(),
    isSupported: service.isSupported(),
  };
}

/**
 * Platform-agnostic location hook
 * Drop-in replacement for React Router's useLocation
 */
function useLocation(): LocationHook {
  const service = getNavigationService();
  const currentState = service.getCurrentState();

  // Build search string from searchParams
  const searchString =
    Object.keys(currentState.searchParams).length > 0
      ? `?${new URLSearchParams(currentState.searchParams).toString()}`
      : '';

  return {
    pathname: currentState.currentPath,
    search: searchString,
    searchParams: currentState.searchParams,
    hash: '', // Not commonly used in mobile apps
    state: null, // Would need to be tracked separately
    key: currentState.currentPath, // Simplified key generation
  };
}

/**
 * Platform-agnostic search params hook
 * Drop-in replacement for React Router's useSearchParams
 */
function useSearchParams(): [
  URLSearchParams,
  (params: URLSearchParams | Record<string, string>) => void,
] {
  const service = getNavigationService();
  const currentState = service.getCurrentState();

  const searchParams = new URLSearchParams(currentState.searchParams);

  const setSearchParams = (
    params: URLSearchParams | Record<string, string>
  ) => {
    const newSearchParams =
      params instanceof URLSearchParams
        ? Object.fromEntries(params.entries())
        : params;

    const newSearch = new URLSearchParams(newSearchParams).toString();
    const newPath =
      currentState.currentPath + (newSearch ? `?${newSearch}` : '');

    service.replace(newPath);
  };

  return [searchParams, setSearchParams];
}

/**
 * Convenience functions for common navigation operations
 */
const navigationHelper = {
  /**
   * Navigate to a path
   * @param path Target path
   * @param options Navigation options
   */
  navigate: (path: string, options?: NavigationOptions) => {
    const service = getNavigationService();
    service.navigate(path, options);
  },

  /**
   * Go back to previous screen
   * @param fallbackPath Fallback path if no history
   */
  goBack: (fallbackPath?: string) => {
    const service = getNavigationService();
    service.goBack(fallbackPath);
  },

  /**
   * Replace current route
   * @param path Target path
   * @param options Navigation options
   */
  replace: (path: string, options?: NavigationOptions) => {
    const service = getNavigationService();
    service.replace(path, options);
  },

  /**
   * Get current path
   */
  getCurrentPath: () => {
    const service = getNavigationService();
    return service.getCurrentPath();
  },

  /**
   * Get search parameters
   */
  getSearchParams: () => {
    const service = getNavigationService();
    return service.getSearchParams();
  },

  /**
   * Navigate to mail app
   */
  goToMail: () => {
    navigationHelper.navigate('/mail');
  },

  /**
   * Navigate to preferences
   */
  goToPreferences: () => {
    navigationHelper.navigate('/preferences');
  },

  /**
   * Navigate to compose page
   * @param type Compose type (compose, reply, forward)
   * @param params Additional parameters
   */
  goToCompose: (type?: string, params?: Record<string, string>) => {
    const searchParams = new URLSearchParams();
    if (type) searchParams.set('type', type);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        searchParams.set(key, value);
      });
    }
    const search = searchParams.toString();
    navigationHelper.navigate(`/mail/compose${search ? `?${search}` : ''}`);
  },

  /**
   * Navigate to connect wallet page
   */
  goToConnect: () => {
    navigationHelper.navigate('/connect');
  },

  /**
   * Navigate to home page
   */
  goToHome: () => {
    navigationHelper.navigate('/');
  },

  /**
   * Check if can go back
   */
  canGoBack: () => {
    const service = getNavigationService();
    return service.canGoBack();
  },
};

// Note: NavigationState interface is available from business/core/navigation
// Other navigation types are available from the main library exports
// Avoid duplicate exports to prevent conflicts

export {
  navigationHelper,
  getNavigationService,
  useNavigation,
  useLocation,
  useSearchParams,
};
