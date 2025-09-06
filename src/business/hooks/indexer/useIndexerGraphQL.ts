import { useCallback, useState } from 'react';
import {
  IndexerDelegation,
  IndexerMail,
  IndexerPreparedMail,
  GraphQLPaginationInput as PaginationInput,
  GraphQLWhereInput as WhereInput,
} from '../../../types';
import { IndexerClient } from '../../../network/clients/indexer';
import { useAppConfig } from '../core/useServices';
import { convertToAppConfig } from './utils';

// Define interfaces for GraphQL responses
interface IndexerUserStatistics {
  userId: string;
  totalEmails: number;
  totalSentEmails: number;
  totalReceivedEmails: number;
  totalDelegations: number;
  points?: number;
  joinedAt: string;
  lastActivity?: string;
}

interface IndexerChainStatistics {
  chainId: number;
  networkName: string;
  totalEmails: number;
  totalUsers: number;
  totalDelegations: number;
  contractAddress?: string;
  isActive: boolean;
  lastUpdated: string;
}

interface IndexerEventLog {
  id: string;
  chainId: number;
  blockNumber: string;
  transactionHash: string;
  logIndex: number;
  eventType: string;
  contractAddress: string;
  from?: string;
  to?: string;
  timestamp: string;
  data: Record<string, any>;
}

// Helper class for GraphQL-like operations using REST API
class IndexerGraphQLHelper {
  constructor(private client: IndexerClient) {}
  async getMails(where?: WhereInput, pagination?: PaginationInput) {
    try {
      const address = where?.from || where?.to;
      if (address) {
        const delegatedEmails = await this.client.getDelegated(
          address,
          String(pagination?.first || 10),
          String(pagination?.skip || 0)
        );
        return { mails: { items: delegatedEmails || [] as IndexerMail[] } };
      }
      return { mails: { items: [] as IndexerMail[] } };
    } catch (error) {
      console.error('Failed to get mails:', error);
      return { mails: { items: [] as IndexerMail[] } };
    }
  }

  async getPreparedMails(_where?: WhereInput, _pagination?: PaginationInput) {
    try {
      // Placeholder implementation - would need specific API endpoint
      return { preparedMails: { items: [] as IndexerPreparedMail[] } };
    } catch (error) {
      console.error('Failed to get prepared mails:', error);
      return { preparedMails: { items: [] as IndexerPreparedMail[] } };
    }
  }

  async getDelegations(where?: WhereInput, pagination?: PaginationInput) {
    try {
      const address = where?.from || where?.to; // Use from/to as proxy for delegator/delegate
      if (address) {
        const [delegatedTo, delegatedFrom] = await Promise.all([
          this.client.getDelegatedTo(
            address,
            String(pagination?.first || 10),
            String(pagination?.skip || 0)
          ),
          this.client.getDelegated(
            address,
            String(pagination?.first || 10),
            String(pagination?.skip || 0)
          )
        ]);
        
        const delegations: IndexerDelegation[] = [
          ...(delegatedTo?.delegations || []),
          ...(delegatedFrom?.delegations || [])
        ];
        
        return { delegations: { items: delegations } };
      }
      return { delegations: { items: [] as IndexerDelegation[] } };
    } catch (error) {
      console.error('Failed to get delegations:', error);
      return { delegations: { items: [] as IndexerDelegation[] } };
    }
  }

  async getUserStatistics(address: string, _chainId?: number) {
    try {
      const userStats: IndexerUserStatistics = {
        userId: address,
        totalEmails: 0,
        totalSentEmails: 0,
        totalReceivedEmails: 0,
        totalDelegations: 0,
        joinedAt: new Date().toISOString()
      };

      const delegations = await this.getDelegations({ from: address });
      userStats.totalDelegations = delegations.delegations.items.length;

      return { userStatistics: { items: [userStats] } };
    } catch (error) {
      console.error('Failed to get user statistics:', error);
      return { userStatistics: { items: [] as IndexerUserStatistics[] } };
    }
  }

  async getChainStatistics() {
    try {
      const siteStats = await this.client.getPointsSiteStats();
      
      const chainStats: IndexerChainStatistics = {
        chainId: 1,
        networkName: 'Ethereum',
        totalEmails: 0,
        totalUsers: siteStats?.data?.totalUsers || 0,
        totalDelegations: 0,
        isActive: true,
        lastUpdated: new Date().toISOString()
      };

      return { chainStatistics: chainStats };
    } catch (error) {
      console.error('Failed to get chain statistics:', error);
      const fallbackStats: IndexerChainStatistics = {
        chainId: 1,
        networkName: 'Ethereum',
        totalEmails: 0,
        totalUsers: 0,
        totalDelegations: 0,
        isActive: false,
        lastUpdated: new Date().toISOString()
      };
      return { chainStatistics: fallbackStats };
    }
  }

  async getEventLogs(_where?: WhereInput, _pagination?: PaginationInput) {
    try {
      // Event logs would need to be implemented in the IndexerClient
      return { eventLogs: { items: [] as IndexerEventLog[] } };
    } catch (error) {
      console.error('Failed to get event logs:', error);
      return { eventLogs: { items: [] as IndexerEventLog[] } };
    }
  }

  async getMailsFromAddress(
    fromAddress: string,
    chainId?: number,
    pagination?: PaginationInput
  ): Promise<IndexerMail[]> {
    try {
      const result = await this.getMails({ from: fromAddress, chainId }, pagination);
      return result.mails.items;
    } catch (error) {
      console.error('Failed to get mails from address:', error);
      return [];
    }
  }

  async getMailsToAddress(
    toAddress: string,
    chainId?: number,
    pagination?: PaginationInput
  ): Promise<IndexerMail[]> {
    try {
      const result = await this.getMails({ to: toAddress, chainId }, pagination);
      return result.mails.items;
    } catch (error) {
      console.error('Failed to get mails to address:', error);
      return [];
    }
  }

  async getActiveDelegationsFromAddress(
    delegatorAddress: string,
    chainId?: number
  ): Promise<IndexerDelegation[]> {
    try {
      const result = await this.getDelegations({ from: delegatorAddress, chainId });
      return result.delegations.items.filter(d => d.isActive);
    } catch (error) {
      console.error('Failed to get active delegations from address:', error);
      return [];
    }
  }

  async getActiveDelegationsToAddress(
    delegateAddress: string,
    chainId?: number
  ): Promise<IndexerDelegation[]> {
    try {
      const result = await this.getDelegations({ to: delegateAddress, chainId });
      return result.delegations.items.filter(d => d.isActive);
    } catch (error) {
      console.error('Failed to get active delegations to address:', error);
      return [];
    }
  }

  async query<T = unknown>(
    _query: string,
    _variables?: Record<string, unknown>
  ): Promise<T> {
    throw new Error('Direct GraphQL queries not supported yet - use specific methods instead');
  }
}

interface UseIndexerGraphQLReturn {
  isLoading: boolean;
  error: string | null;
  getMails: (
    where?: WhereInput,
    pagination?: PaginationInput
  ) => Promise<IndexerMail[]>;
  getPreparedMails: (
    where?: WhereInput,
    pagination?: PaginationInput
  ) => Promise<IndexerPreparedMail[]>;
  getDelegations: (
    where?: WhereInput,
    pagination?: PaginationInput
  ) => Promise<IndexerDelegation[]>;
  getUserStatistics: (
    address: string,
    chainId?: number
  ) => Promise<IndexerUserStatistics[]>;
  getChainStatistics: () => Promise<IndexerChainStatistics>;
  getEventLogs: (
    where?: WhereInput,
    pagination?: PaginationInput
  ) => Promise<IndexerEventLog[]>;
  getMailsFromAddress: (
    fromAddress: string,
    chainId?: number,
    pagination?: PaginationInput
  ) => Promise<IndexerMail[]>;
  getMailsToAddress: (
    toAddress: string,
    chainId?: number,
    pagination?: PaginationInput
  ) => Promise<IndexerMail[]>;
  getActiveDelegationsFromAddress: (
    delegatorAddress: string,
    chainId?: number
  ) => Promise<IndexerDelegation[]>;
  getActiveDelegationsToAddress: (
    delegateAddress: string,
    chainId?: number
  ) => Promise<IndexerDelegation[]>;
  executeCustomQuery: <T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ) => Promise<T>;
  clearError: () => void;
}

/**
 * React hook for Indexer GraphQL API operations
 */
const useIndexerGraphQL = (): UseIndexerGraphQLReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const config = useAppConfig();
  const appConfig = convertToAppConfig(config);
  
  // Create helper instance
  const helper = new IndexerGraphQLHelper(new IndexerClient(appConfig));

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const getMails = useCallback(
    async (
      where?: WhereInput,
      pagination?: PaginationInput
    ): Promise<IndexerMail[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await helper.getMails(where, pagination);
        return result.mails.items;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get mails';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getPreparedMails = useCallback(
    async (
      where?: WhereInput,
      pagination?: PaginationInput
    ): Promise<IndexerPreparedMail[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await helper.getPreparedMails(where, pagination);
        return result.preparedMails.items;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get prepared mails';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getDelegations = useCallback(
    async (
      where?: WhereInput,
      pagination?: PaginationInput
    ): Promise<IndexerDelegation[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await helper.getDelegations(where, pagination);
        return result.delegations.items;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get delegations';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getUserStatistics = useCallback(
    async (
      address: string,
      chainId?: number
    ): Promise<IndexerUserStatistics[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await helper.getUserStatistics(address, chainId);
        return result.userStatistics.items;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get user statistics';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getChainStatistics =
    useCallback(async (): Promise<IndexerChainStatistics> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await helper.getChainStatistics();
        return result.chainStatistics;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get chain statistics';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    }, []);

  const getEventLogs = useCallback(
    async (
      where?: WhereInput,
      pagination?: PaginationInput
    ): Promise<IndexerEventLog[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await helper.getEventLogs(where, pagination);
        return result.eventLogs.items;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get event logs';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getMailsFromAddress = useCallback(
    async (
      fromAddress: string,
      chainId?: number,
      pagination?: PaginationInput
    ): Promise<IndexerMail[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await helper.getMailsFromAddress(
          fromAddress,
          chainId,
          pagination
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to get mails from address';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getMailsToAddress = useCallback(
    async (
      toAddress: string,
      chainId?: number,
      pagination?: PaginationInput
    ): Promise<IndexerMail[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await helper.getMailsToAddress(
          toAddress,
          chainId,
          pagination
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to get mails to address';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getActiveDelegationsFromAddress = useCallback(
    async (
      delegatorAddress: string,
      chainId?: number
    ): Promise<IndexerDelegation[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const result =
          await helper.getActiveDelegationsFromAddress(
            delegatorAddress,
            chainId
          );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to get active delegations from address';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getActiveDelegationsToAddress = useCallback(
    async (
      delegateAddress: string,
      chainId?: number
    ): Promise<IndexerDelegation[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await helper.getActiveDelegationsToAddress(
          delegateAddress,
          chainId
        );
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to get active delegations to address';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const executeCustomQuery = useCallback(
    async <T = unknown>(
      query: string,
      variables?: Record<string, unknown>
    ): Promise<T> => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await helper.query<T>(query, variables);
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to execute custom query';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    getMails,
    getPreparedMails,
    getDelegations,
    getUserStatistics,
    getChainStatistics,
    getEventLogs,
    getMailsFromAddress,
    getMailsToAddress,
    getActiveDelegationsFromAddress,
    getActiveDelegationsToAddress,
    executeCustomQuery,
    clearError,
  };
};

export {
  useIndexerGraphQL,
  type UseIndexerGraphQLReturn
};