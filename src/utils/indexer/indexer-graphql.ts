/**
 * @fileoverview Indexer GraphQL API Helper
 * @description Comprehensive GraphQL client for querying blockchain mail data from the indexer
 * 
 * @example Basic Mail Queries
 * ```typescript
 * import { IndexerGraphQLHelper } from '@/utils/indexerGraphQL';
 * 
 * // Get recent mails sent by a user
 * const sentMails = await IndexerGraphQLHelper.getMailsFromAddress(
 *   '0x742d35cc...', // Sender address
 *   1,              // Ethereum mainnet
 *   { first: 10 }   // Limit to 10 results
 * );
 * 
 * // Get mails received by a user
 * const receivedMails = await IndexerGraphQLHelper.getMailsToAddress(
 *   '0x742d35cc...', // Recipient address  
 *   137,            // Polygon network
 *   { orderBy: 'timestamp', orderDirection: 'desc' }
 * );
 * ```
 * 
 * @example Delegation Management
 * ```typescript
 * // Check if user can delegate email sending
 * const delegations = await IndexerGraphQLHelper.getActiveDelegationsFromAddress(
 *   '0x742d35cc...' // Delegator address
 * );
 * 
 * // Verify delegation permissions
 * const canSendFor = delegations.some(d => 
 *   d.to.toLowerCase() === targetAddress.toLowerCase() && d.isActive
 * );
 * 
 * // Get delegation history
 * const allDelegations = await IndexerGraphQLHelper.getDelegationsFromAddress(
 *   '0x742d35cc...',
 *   { includeInactive: true }
 * );
 * ```
 * 
 * @description Supported Networks:
 * - Ethereum (chainId: 1)
 * - Polygon (chainId: 137) 
 * - Arbitrum (chainId: 42161)
 * - Optimism (chainId: 10)
 * - Base (chainId: 8453)
 * 
 * @description GraphQL Endpoint:
 * - Production: https://indexer-api.0xmail.box/graphql
 * - Development: http://localhost:3001/graphql
 * - Configured via `VITE_INDEXER_BACKEND_URL` environment variable
 */

import { NetworkClient } from '@johnqh/di';

// Configuration interface for indexer GraphQL endpoint
export interface IndexerGraphQLConfig {
  indexerBackendUrl: string;
  networkClient: NetworkClient;
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface IndexerMail {
  id: string;
  chainId: number;
  contractAddress: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
  gasUsed?: string;
  gasPrice?: string;
}

export interface IndexerPreparedMail {
  id: string;
  chainId: number;
  contractAddress: string;
  from: string;
  to: string;
  mailId: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
  gasUsed?: string;
  gasPrice?: string;
}

export interface IndexerDelegation {
  id: string;
  chainId: number;
  contractAddress: string;
  delegator: string;
  delegate: string;
  isActive: boolean;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
  gasUsed?: string;
  gasPrice?: string;
}

export interface IndexerUserStatistics {
  id: string;
  chainId: number;
  address: string;
  mailsSent: number;
  mailsReceived: number;
  preparedMailsSent: number;
  preparedMailsReceived: number;
  delegationsGiven: number;
  delegationsReceived: number;
  totalGasUsed: string;
  averageGasPrice: string;
  firstMailTimestamp?: string;
  lastMailTimestamp?: string;
}

export interface IndexerChainStatistics {
  id: string;
  totalChains: number;
  totalMails: number;
  totalPreparedMails: number;
  totalDelegations: number;
  totalUsers: number;
  totalGasUsed: string;
  averageGasPrice: string;
}

export interface IndexerEventLog {
  id: string;
  chainId: number;
  eventName: string;
  contractAddress: string;
  eventData: string;
  timestamp: string;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
}

export interface PaginationInput {
  first?: number;
  skip?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface WhereInput {
  chainId?: number;
  chainId_in?: number[];
  from?: string;
  to?: string;
  address?: string;
  contractAddress?: string;
  timestamp_gte?: string;
  timestamp_lte?: string;
  isActive?: boolean;
}

const getIndexerGraphQLUrl = (config: IndexerGraphQLConfig): string => {
  return `${config.indexerBackendUrl}/graphql`;
};

/**
 * Indexer GraphQL Helper Class
 * Contains methods for querying blockchain data via GraphQL
 */
/**
 * GraphQL helper class for blockchain mail data queries
 * 
 * @description Provides static methods for common GraphQL operations
 * with built-in error handling, type safety, and logging.
 * 
 * @example Error Handling
 * ```typescript
 * try {
 *   const mails = await IndexerGraphQLHelper.getMails({
 *     from: '0x742d35cc...'
 *   });
 * } catch (error) {
 *   if (error.message.includes('GraphQL error')) {
 *     console.error('Server-side GraphQL error:', error);
 *   } else if (error.message.includes('HTTP error')) {
 *     console.error('Network error:', error);
 *   }
 * }
 * ```
 */
export class IndexerGraphQLHelper {
  private config: IndexerGraphQLConfig;
  private client: NetworkClient;
  
  constructor(config: IndexerGraphQLConfig) {
    this.config = config;
    this.client = config.networkClient;
  }
  /**
   * Execute a GraphQL query with comprehensive error handling
   * 
   * @template T - Expected return type of the GraphQL query
   * @param query - GraphQL query string
   * @param variables - Query variables object (optional)
   * @returns Promise resolving to typed query result
   * 
   * @throws {Error} When HTTP request fails (network issues, 4xx/5xx status)
   * @throws {Error} When GraphQL returns errors (schema validation, resolver errors)
   * @throws {Error} When response contains no data
   * 
   * @description Error Types:
   * - **HTTP errors**: Network issues, server unavailable, authentication failures
   * - **GraphQL errors**: Invalid queries, missing fields, resolver exceptions
   * - **Data errors**: Empty responses, malformed data structures
   * 
   * @example Custom Query
   * ```typescript
 * const customQuery = `
 *   query GetUserStats($address: String!) {
 *     mails(where: { from: $address }) {
 *       id
 *       timestamp
 *       to
 *     }
 *   }
 * `;
 * 
 * const stats = await IndexerGraphQLHelper.query(customQuery, {
 *   address: '0x742d35cc...'
 * });
 * ```
   */
  async query<T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    const response = await this.client.post(getIndexerGraphQLUrl(this.config), {
      query,
      variables,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: GraphQLResponse<T> = response.data as GraphQLResponse<T>;
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(`GraphQL error: ${result.errors[0].message}`);
    }

    if (!result.data) {
      throw new Error('No data returned from GraphQL query');
    }

    return result.data;
  }

  /**
   * Get mails with optional filtering and pagination
   */
  async getMails(
    where?: WhereInput,
    pagination?: PaginationInput
  ): Promise<{ mails: { items: IndexerMail[] } }> {
    const query = `
      query GetMails($where: MailFilter, $first: Int, $skip: Int, $orderBy: String, $orderDirection: String) {
        mails(where: $where, first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
          items {
            id
            chainId
            contractAddress
            from
            to
            subject
            body
            timestamp
            blockNumber
            transactionHash
            logIndex
            gasUsed
            gasPrice
          }
        }
      }
    `;

    return this.query(query, { where, ...pagination });
  }

  /**
   * Get prepared mails with optional filtering and pagination
   */
  async getPreparedMails(
    where?: WhereInput,
    pagination?: PaginationInput
  ): Promise<{ preparedMails: { items: IndexerPreparedMail[] } }> {
    const query = `
      query GetPreparedMails($where: PreparedMailFilter, $first: Int, $skip: Int, $orderBy: String, $orderDirection: String) {
        preparedMails(where: $where, first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
          items {
            id
            chainId
            contractAddress
            from
            to
            mailId
            timestamp
            blockNumber
            transactionHash
            logIndex
            gasUsed
            gasPrice
          }
        }
      }
    `;

    return this.query(query, { where, ...pagination });
  }

  /**
   * Get delegations with optional filtering and pagination
   */
  async getDelegations(
    where?: WhereInput,
    pagination?: PaginationInput
  ): Promise<{ delegations: { items: IndexerDelegation[] } }> {
    const query = `
      query GetDelegations($where: DelegationFilter, $first: Int, $skip: Int, $orderBy: String, $orderDirection: String) {
        delegations(where: $where, first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
          items {
            id
            chainId
            contractAddress
            delegator
            delegate
            isActive
            timestamp
            blockNumber
            transactionHash
            logIndex
            gasUsed
            gasPrice
          }
        }
      }
    `;

    return this.query(query, { where, ...pagination });
  }

  /**
   * Get user statistics for a specific address and chain
   */
  async getUserStatistics(
    address: string,
    chainId?: number
  ): Promise<{ userStatistics: { items: IndexerUserStatistics[] } }> {
    const query = `
      query GetUserStatistics($where: UserStatisticsFilter) {
        userStatistics(where: $where) {
          items {
            id
            chainId
            address
            mailsSent
            mailsReceived
            preparedMailsSent
            preparedMailsReceived
            delegationsGiven
            delegationsReceived
            totalGasUsed
            averageGasPrice
            firstMailTimestamp
            lastMailTimestamp
          }
        }
      }
    `;

    const where = chainId 
      ? { address: address.toLowerCase(), chainId }
      : { address: address.toLowerCase() };

    return this.query(query, { where });
  }

  /**
   * Get global chain statistics
   */
  async getChainStatistics(): Promise<{ chainStatistics: IndexerChainStatistics }> {
    const query = `
      query GetChainStatistics {
        chainStatistics(id: "global") {
          id
          totalChains
          totalMails
          totalPreparedMails
          totalDelegations
          totalUsers
          totalGasUsed
          averageGasPrice
        }
      }
    `;

    return this.query(query);
  }

  /**
   * Get event logs with optional filtering and pagination
   */
  async getEventLogs(
    where?: WhereInput,
    pagination?: PaginationInput
  ): Promise<{ eventLogs: { items: IndexerEventLog[] } }> {
    const query = `
      query GetEventLogs($where: EventLogFilter, $first: Int, $skip: Int, $orderBy: String, $orderDirection: String) {
        eventLogs(where: $where, first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
          items {
            id
            chainId
            eventName
            contractAddress
            eventData
            timestamp
            blockNumber
            transactionHash
            logIndex
          }
        }
      }
    `;

    return this.query(query, { where, ...pagination });
  }

  /**
   * Get mails sent by a specific address across all chains
   */
  async getMailsFromAddress(
    fromAddress: string,
    chainId?: number,
    pagination?: PaginationInput
  ): Promise<IndexerMail[]> {
    const where = chainId 
      ? { from: fromAddress.toLowerCase(), chainId }
      : { from: fromAddress.toLowerCase() };

    const result = await this.getMails(where, {
      orderBy: 'timestamp',
      orderDirection: 'desc',
      ...pagination,
    });

    return result.mails.items;
  }

  /**
   * Get mails received by a specific address across all chains
   */
  async getMailsToAddress(
    toAddress: string,
    chainId?: number,
    pagination?: PaginationInput
  ): Promise<IndexerMail[]> {
    const where = chainId 
      ? { to: toAddress.toLowerCase(), chainId }
      : { to: toAddress.toLowerCase() };

    const result = await this.getMails(where, {
      orderBy: 'timestamp',
      orderDirection: 'desc',
      ...pagination,
    });

    return result.mails.items;
  }

  /**
   * Get active delegations for a specific delegator
   */
  async getActiveDelegationsFromAddress(
    delegatorAddress: string,
    chainId?: number
  ): Promise<IndexerDelegation[]> {
    const where = chainId 
      ? { delegator: delegatorAddress.toLowerCase(), isActive: true, chainId }
      : { delegator: delegatorAddress.toLowerCase(), isActive: true };

    const result = await this.getDelegations(where, {
      orderBy: 'timestamp',
      orderDirection: 'desc',
    });

    return result.delegations.items;
  }

  /**
   * Get active delegations TO a specific delegate
   */
  async getActiveDelegationsToAddress(
    delegateAddress: string,
    chainId?: number
  ): Promise<IndexerDelegation[]> {
    const where = chainId 
      ? { delegate: delegateAddress.toLowerCase(), isActive: true, chainId }
      : { delegate: delegateAddress.toLowerCase(), isActive: true };

    const result = await this.getDelegations(where, {
      orderBy: 'timestamp',
      orderDirection: 'desc',
    });

    return result.delegations.items;
  }
}

/**
 * Factory function to create IndexerGraphQLHelper with network client
 */
export const createIndexerGraphQLHelper = (
  indexerBackendUrl: string, 
  networkClient: NetworkClient
): IndexerGraphQLHelper => {
  return new IndexerGraphQLHelper({
    indexerBackendUrl,
    networkClient
  });
};