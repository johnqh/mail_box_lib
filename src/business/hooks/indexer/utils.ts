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
    wildDuckApiToken: config.wildduckApiToken || '',
    wildDuckBackendUrl: config.wildduckBaseUrl || 'https://0xmail.box',
    indexerBackendUrl: config.indexerBackendUrl || 'https://api.0xmail.box',
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