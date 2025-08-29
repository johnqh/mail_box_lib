/**
 * Web implementation of environment variable provider using Vite
 */

import { EnvProvider, EnvironmentVariables, AppConfig } from '../types/environment';

/**
 * Web environment provider using import.meta.env (Vite)
 */
export class WebEnvProvider implements EnvProvider {
  get(key: keyof EnvironmentVariables, defaultValue = ''): string {
    // Use type assertion to satisfy TypeScript
    const env = (import.meta as any).env;
    return env?.[key] || defaultValue;
  }

  getAll(): EnvironmentVariables {
    const env = (import.meta as any).env;
    return {
      VITE_WILDDUCK_API_TOKEN: env?.VITE_WILDDUCK_API_TOKEN,
      VITE_WILDDUCK_BACKEND_URL: env?.VITE_WILDDUCK_BACKEND_URL,
      VITE_REVENUECAT_API_KEY: env?.VITE_REVENUECAT_API_KEY,
      VITE_WALLETCONNECT_PROJECT_ID: env?.VITE_WALLETCONNECT_PROJECT_ID,
      VITE_PRIVY_APP_ID: env?.VITE_PRIVY_APP_ID,
      VITE_FIREBASE_API_KEY: env?.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: env?.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: env?.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_STORAGE_BUCKET: env?.VITE_FIREBASE_STORAGE_BUCKET,
      VITE_FIREBASE_MESSAGING_SENDER_ID: env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
      VITE_FIREBASE_APP_ID: env?.VITE_FIREBASE_APP_ID,
      VITE_FIREBASE_MEASUREMENT_ID: env?.VITE_FIREBASE_MEASUREMENT_ID,
      VITE_FIREBASE_VAPID_KEY: env?.VITE_FIREBASE_VAPID_KEY,
      VITE_USE_CLOUDFLARE_WORKER: env?.VITE_USE_CLOUDFLARE_WORKER,
      VITE_CLOUDFLARE_WORKER_URL: env?.VITE_CLOUDFLARE_WORKER_URL,
      VITE_USE_MOCK_FALLBACK: env?.VITE_USE_MOCK_FALLBACK
    };
  }

  isDevelopment(): boolean {
    try {
      const env = (import.meta as any)?.env;
      return env?.DEV === true || env?.MODE === 'development';
    } catch (error) {
      // Fallback for environments without import.meta.env
      return false;
    }
  }

  isProduction(): boolean {
    try {
      const env = (import.meta as any)?.env;
      return env?.PROD === true || env?.MODE === 'production';
    } catch (error) {
      // Fallback for environments without import.meta.env
      return true; // Default to production for safety
    }
  }
}

/**
 * Create app configuration from environment variables
 */
export const createWebAppConfig = (envProvider: EnvProvider = new WebEnvProvider()): AppConfig => {
  return {
    wildDuckApiToken: envProvider.get('VITE_WILDDUCK_API_TOKEN', ''),
    wildDuckBackendUrl: envProvider.get('VITE_WILDDUCK_BACKEND_URL', 'http://localhost:8080'),
    revenueCatApiKey: envProvider.get('VITE_REVENUECAT_API_KEY', ''),
    walletConnectProjectId: envProvider.get('VITE_WALLETCONNECT_PROJECT_ID', '2f05ae7f1f5344b5ae075017bfaaa560'),
    privyAppId: envProvider.get('VITE_PRIVY_APP_ID', ''),
    firebase: {
      apiKey: envProvider.get('VITE_FIREBASE_API_KEY', ''),
      authDomain: envProvider.get('VITE_FIREBASE_AUTH_DOMAIN', ''),
      projectId: envProvider.get('VITE_FIREBASE_PROJECT_ID', ''),
      storageBucket: envProvider.get('VITE_FIREBASE_STORAGE_BUCKET', ''),
      messagingSenderId: envProvider.get('VITE_FIREBASE_MESSAGING_SENDER_ID', ''),
      appId: envProvider.get('VITE_FIREBASE_APP_ID', ''),
      measurementId: envProvider.get('VITE_FIREBASE_MEASUREMENT_ID'),
      vapidKey: envProvider.get('VITE_FIREBASE_VAPID_KEY', '')
    },
    useCloudflareWorker: envProvider.get('VITE_USE_CLOUDFLARE_WORKER', 'false') === 'true',
    cloudflareWorkerUrl: envProvider.get('VITE_CLOUDFLARE_WORKER_URL', 'https://wildduck-proxy.workers.dev'),
    useMockFallback: envProvider.get('VITE_USE_MOCK_FALLBACK', 'true') === 'true'
  };
};

// Export default instance
export const webEnvProvider = new WebEnvProvider();
export const webAppConfig = createWebAppConfig(webEnvProvider);