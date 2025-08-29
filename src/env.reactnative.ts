/**
 * React Native implementation of environment variable provider
 */

import { EnvProvider, EnvironmentVariables, AppConfig } from './env.interface';

/**
 * React Native environment provider
 * Uses react-native-config or similar for environment variables
 */
export class ReactNativeEnvProvider implements EnvProvider {
  private config: EnvironmentVariables;

  constructor(config?: EnvironmentVariables) {
    // In React Native, you would typically use:
    // import Config from 'react-native-config';
    // this.config = Config;
    
    // For now, provide a way to inject config
    this.config = config || this.getDefaultConfig();
  }

  private getDefaultConfig(): EnvironmentVariables {
    // In React Native, you would use react-native-config:
    // import Config from 'react-native-config';
    // return Config;
    
    // Or use react-native-dotenv:
    // import { 
    //   VITE_WILDDUCK_API_TOKEN,
    //   VITE_REVENUECAT_API_KEY,
    //   // ... other vars
    // } from '@env';
    
    // For demo purposes, return empty config
    console.log('React Native environment config not set up yet');
    return {};
  }

  get(key: keyof EnvironmentVariables, defaultValue = ''): string {
    return this.config[key] || defaultValue;
  }

  getAll(): EnvironmentVariables {
    return this.config;
  }

  isDevelopment(): boolean {
    // In React Native, you can use __DEV__ global variable
    // @ts-ignore - __DEV__ is a React Native global
    return typeof __DEV__ !== 'undefined' ? __DEV__ : false;
  }

  isProduction(): boolean {
    // In React Native, production is the opposite of __DEV__
    // @ts-ignore - __DEV__ is a React Native global
    return typeof __DEV__ !== 'undefined' ? !__DEV__ : true;
  }
}

/**
 * Create app configuration for React Native
 */
export const createReactNativeAppConfig = (envProvider: EnvProvider): AppConfig => {
  return {
    wildDuckApiToken: envProvider.get('VITE_WILDDUCK_API_TOKEN', ''),
    wildDuckBackendUrl: envProvider.get('VITE_WILDDUCK_BACKEND_URL', 'http://localhost:8080'),
    revenueCatApiKey: envProvider.get('VITE_REVENUECAT_API_KEY', ''),
    walletConnectProjectId: envProvider.get('VITE_WALLETCONNECT_PROJECT_ID', '2f05ae7f5c7d8e3a6b8c4f3e8a7d9b1c'),
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

/**
 * Example usage in React Native:
 * 
 * 1. Install react-native-config:
 *    npm install react-native-config
 *    
 * 2. Create .env file in root:
 *    VITE_WILDDUCK_API_TOKEN=your_token_here
 *    VITE_REVENUECAT_API_KEY=your_key_here
 *    
 * 3. Use in your app:
 *    import Config from 'react-native-config';
 *    const envProvider = new ReactNativeEnvProvider(Config);
 *    const appConfig = createReactNativeAppConfig(envProvider);
 * 
 * Alternative with react-native-dotenv:
 * 
 * 1. Install react-native-dotenv:
 *    npm install react-native-dotenv
 *    
 * 2. Configure babel.config.js:
 *    plugins: [['module:react-native-dotenv']]
 *    
 * 3. Import variables:
 *    import { VITE_WILDDUCK_API_TOKEN } from '@env';
 */

// Export factory function
export const createReactNativeEnvProvider = (config?: EnvironmentVariables) => 
  new ReactNativeEnvProvider(config);