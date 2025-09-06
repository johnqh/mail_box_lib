/**
 * Platform-agnostic environment service
 * Automatically selects the appropriate environment provider based on platform
 */

import { AppConfig, EnvProvider } from '../types';

let envProvider: EnvProvider;
let appConfig: AppConfig;

/**
 * Get platform-appropriate environment provider
 */
function createEnvProvider(): EnvProvider {
  // Platform detection - web vs React Native
  if (typeof window !== 'undefined') {
    // Web environment - dynamic import for platform-specific code
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebEnvProvider, createWebAppConfig } = require('./env.web');
    const provider = new WebEnvProvider();
    appConfig = createWebAppConfig(provider);
    return provider;
  } else {
    // React Native environment - dynamic import for platform-specific code
    // For now, fall back to web logger, but React Native apps should use env.reactnative.ts directly
    const {
      ReactNativeEnvProvider,
      createReactNativeAppConfig,
    } = require('./env.reactnative'); // eslint-disable-line @typescript-eslint/no-require-imports
    const provider = new ReactNativeEnvProvider();
    appConfig = createReactNativeAppConfig(provider);
    return provider;
  }
}

/**
 * Get the default environment provider instance (singleton pattern)
 */
function getEnvProvider(): EnvProvider {
  if (!envProvider) {
    envProvider = createEnvProvider();
  }
  return envProvider;
}

/**
 * Get the app configuration
 */
function getAppConfig(): AppConfig {
  if (!appConfig) {
    getEnvProvider(); // This will create the config
  }
  return appConfig;
}

/**
 * Convenience functions for common environment checks
 */
const env = {
  isDevelopment: () => getEnvProvider().isDevelopment(),
  isProduction: () => getEnvProvider().isProduction(),
  get: (key: string, defaultValue?: string) =>
    getEnvProvider().get(key as any, defaultValue),
};

// Re-export types for convenience
export type { EnvProvider, AppConfig, EnvironmentVariables } from '../types';

export { env, getEnvProvider, getAppConfig };
