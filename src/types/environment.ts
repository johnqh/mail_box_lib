/**
 * Platform-agnostic environment variable interface
 * This interface abstracts environment variable access to work across web and React Native
 */

interface EnvironmentVariables {
  VITE_WILDDUCK_API_TOKEN?: string;
  VITE_WILDDUCK_BACKEND_URL?: string;
  VITE_INDEXER_BACKEND_URL?: string;
  VITE_REVENUECAT_API_KEY?: string;
  VITE_WALLETCONNECT_PROJECT_ID?: string;
  VITE_PRIVY_APP_ID?: string;
  VITE_FIREBASE_API_KEY?: string;
  VITE_FIREBASE_AUTH_DOMAIN?: string;
  VITE_FIREBASE_PROJECT_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_MEASUREMENT_ID?: string;
  VITE_FIREBASE_VAPID_KEY?: string;
  VITE_CLOUDFLARE_WORKER_URL?: string;
  VITE_DEV_MODE?: string;
}

/**
 * Platform-agnostic environment variable provider
 */
interface EnvProvider {
  /**
   * Get environment variable value
   * @param key Environment variable key
   * @param defaultValue Default value if not found
   */
  get(
    key: keyof EnvironmentVariables,
    defaultValue?: string | boolean
  ): string | boolean;

  /**
   * Get all environment variables
   */
  getAll(): EnvironmentVariables;

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean;

  /**
   * Check if running in production mode
   */
  isProduction(): boolean;
}

/**
 * Environment configuration for the application
 */
interface AppConfig {
  wildDuckApiToken: string;
  wildDuckBackendUrl: string;
  indexerBackendUrl: string;
  revenueCatApiKey: string;
  walletConnectProjectId: string;
  privyAppId: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
    vapidKey: string;
  };
  cloudflareWorkerUrl: string;
  devMode: boolean;
}

export { type AppConfig, type EnvironmentVariables, type EnvProvider };
