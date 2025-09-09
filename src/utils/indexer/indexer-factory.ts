/**
 * Factory functions for creating indexer helper classes with automatic network client injection
 * These functions use the IndexerClient by default for easy integration
 */

import { AppConfig } from '../../types';
import { IndexerClient } from '../../network/clients/indexer';
import { 
  createIndexerAdminHelper, 
  IndexerAdminHelper
} from './indexer-admin';
import {
  createIndexerGraphQLHelper,
  IndexerGraphQLHelper
} from './indexer-graphql';
import {
  createIndexerWebhookHelper,
  IndexerWebhookHelper
} from './indexer-webhooks';

/**
 * Create IndexerAdminHelper with IndexerClient auto-injection
 * @param config App configuration containing indexer backend URL
 * @returns Configured IndexerAdminHelper instance
 * 
 * @example
 * ```typescript
 * import { createIndexerAdmin } from '@johnqh/lib';
 * 
 * const config = { indexerBackendUrl: 'https://indexer-api.0xmail.box' };
 * const admin = createIndexerAdmin(config);
 * 
 * // Use the admin helper
 * await admin.getOverviewStats(adminSignature);
 * ```
 */
export const createIndexerAdmin = (config: AppConfig): IndexerAdminHelper => {
  const networkClient = new IndexerClient(config);
  return createIndexerAdminHelper(
    config.indexerBackendUrl || 'https://indexer.0xmail.box',
    networkClient
  );
};

/**
 * Create IndexerGraphQLHelper with IndexerClient auto-injection
 * @param config App configuration containing indexer backend URL
 * @returns Configured IndexerGraphQLHelper instance
 * 
 * @example
 * ```typescript
 * import { createIndexerGraphQL } from '@johnqh/lib';
 * 
 * const config = { indexerBackendUrl: 'https://indexer-api.0xmail.box' };
 * const graphql = createIndexerGraphQL(config);
 * 
 * // Query blockchain mail data
 * const mails = await graphql.getMailsFromAddress('0x742d35cc...', 1, { first: 10 });
 * ```
 */
export const createIndexerGraphQL = (config: AppConfig): IndexerGraphQLHelper => {
  const networkClient = new IndexerClient(config);
  return createIndexerGraphQLHelper(
    config.indexerBackendUrl || 'https://indexer.0xmail.box',
    networkClient
  );
};

/**
 * Create IndexerWebhookHelper with IndexerClient auto-injection
 * @param config App configuration containing indexer backend URL
 * @returns Configured IndexerWebhookHelper instance
 * 
 * @example
 * ```typescript
 * import { createIndexerWebhook } from '@johnqh/lib';
 * 
 * const config = { indexerBackendUrl: 'https://indexer-api.0xmail.box' };
 * const webhook = createIndexerWebhook(config);
 * 
 * // Process webhook events
 * await webhook.processEmailSent({
 *   senderAddress: '0x123...',
 *   recipientAddress: '0x456...',
 *   emailId: 'email-123'
 * });
 * ```
 */
export const createIndexerWebhook = (config: AppConfig): IndexerWebhookHelper => {
  const networkClient = new IndexerClient(config);
  return createIndexerWebhookHelper(
    config.indexerBackendUrl || 'https://indexer.0xmail.box',
    networkClient
  );
};

/**
 * Create all indexer helpers with IndexerClient auto-injection
 * @param config App configuration containing indexer backend URL
 * @returns Object containing all configured indexer helpers
 * 
 * @example
 * ```typescript
 * import { createIndexerHelpers } from '@johnqh/lib';
 * 
 * const config = { indexerBackendUrl: 'https://indexer-api.0xmail.box' };
 * const { admin, graphql, webhook } = createIndexerHelpers(config);
 * 
 * // Use any helper as needed
 * const stats = await admin.getOverviewStats(adminSignature);
 * const mails = await graphql.getMailsFromAddress('0x742d35cc...', 1);
 * await webhook.processEmailSent(emailData);
 * ```
 */
export const createIndexerHelpers = (config: AppConfig) => {
  return {
    admin: createIndexerAdmin(config),
    graphql: createIndexerGraphQL(config),
    webhook: createIndexerWebhook(config)
  };
};