/**
 * Utility functions for indexer hooks
 */

import type { AppConfig } from '../../../types';
import type { ServiceContainerConfig } from '../../core/container/dependency-container';

/**
 * Convert ServiceContainerConfig to AppConfig for IndexerClient compatibility
 */
function convertToAppConfig(config: ServiceContainerConfig): AppConfig {
  return {
    wildDuckApiToken: '',
    wildDuckBackendUrl: 'https://0xmail.box',
    indexerBackendUrl: config.apiBaseUrl || 'https://api.0xmail.box',
    revenueCatApiKey: config.revenueCatApiKey || '',
    walletConnectProjectId: '',
    privyAppId: '',
    firebase: config.firebaseConfig || {
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      vapidKey: '',
    },
    cloudflareWorkerUrl: '',
    devMode: config.isDevelopment || false,
  };
}

export {
  convertToAppConfig
};