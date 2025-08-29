/**
 * Platform-agnostic environment variable interface
 * This interface abstracts environment variable access to work across web and React Native
 */

export interface EnvironmentVariables {
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
  VITE_USE_CLOUDFLARE_WORKER?: string;
  VITE_CLOUDFLARE_WORKER_URL?: string;
  VITE_USE_MOCK_FALLBACK?: string;
}

/**
 * Platform-agnostic environment variable provider
 */
export interface EnvProvider {
  /**
   * Get environment variable value
   * @param key Environment variable key
   * @param defaultValue Default value if not found
   */
  get(key: keyof EnvironmentVariables, defaultValue?: string): string;

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
export interface AppConfig {
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
  useCloudflareWorker: boolean;
  cloudflareWorkerUrl: string;
  useMockFallback: boolean;
}