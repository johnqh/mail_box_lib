import { useCallback } from 'react';
import { IndexerClient } from '../../../network/clients/indexer';
import { useApiCall } from '../useApiCall';
import type {
  AddressValidationResponse,
  DelegatedFromResponse,
  DelegatedToResponse,
  EmailAccountsResponse,
  EntitlementResponse,
  LeaderboardResponse,
  NonceResponse,
  Optional,
  PointsResponse,
  SignInMessageResponse,
  SiteStatsResponse,
} from '@johnqh/types';
import { IndexerMockData } from './mocks';

interface UseIndexerMailReturn {
  isLoading: boolean;
  error: Optional<string>;
  // Public endpoints (no auth required)
  validateUsername: (username: string) => Promise<Optional<AddressValidationResponse>>;
  getSigningMessage: (
    walletAddress: string,
    chainId: number,
    domain: string,
    url: string
  ) => Promise<Optional<SignInMessageResponse>>;
  getPointsLeaderboard: (count?: number) => Promise<Optional<LeaderboardResponse>>;
  getPointsSiteStats: () => Promise<Optional<SiteStatsResponse>>;
  // Signature-protected endpoints
  getWalletAccounts: (
    walletAddress: string,
    signature: string,
    message: string,
    referralCode?: string
  ) => Promise<Optional<EmailAccountsResponse>>;
  getDelegatedTo: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<DelegatedToResponse>>;
  getDelegatedFrom: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<DelegatedFromResponse>>;
  createNonce: (
    username: string,
    signature: string,
    message: string
  ) => Promise<Optional<NonceResponse>>;
  getNonce: (
    username: string,
    signature: string,
    message: string
  ) => Promise<Optional<NonceResponse>>;
  getEntitlement: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<EntitlementResponse>>;
  getPointsBalance: (
    walletAddress: string,
    signature: string,
    message: string
  ) => Promise<Optional<PointsResponse>>;
  clearError: () => void;
}

/**
 * React hook for Indexer Mail API operations
 * Includes both public endpoints and signature-protected endpoints
 * Note: IP-restricted endpoints (using IPHelper) are not included as they're only accessible from WildDuck server
 */
const useIndexerMail = (endpointUrl: string, dev: boolean = false, devMode: boolean = false): UseIndexerMailReturn => {
  const indexerClient = new IndexerClient(endpointUrl, dev);
  const { isLoading, error, clearError, execute } = useApiCall({
    context: 'IndexerMail',
  });

  const validateUsername = useCallback(
    execute(async (username: string) => {
      try {
        return await indexerClient.validateUsername(username);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] validateUsername failed, returning mock data:', err);
          return IndexerMockData.getValidation(username);
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getSigningMessage = useCallback(
    execute(async (walletAddress: string, chainId: number, domain: string, url: string) => {
      try {
        return await indexerClient.getMessage(chainId, walletAddress, domain, url);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getSigningMessage failed, returning mock data:', err);
          return IndexerMockData.getSigningMessage(walletAddress, chainId, domain);
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getPointsLeaderboard = useCallback(
    execute(async (count: number = 10) => {
      try {
        return await indexerClient.getPointsLeaderboard(count);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getPointsLeaderboard failed, returning mock data:', err);
          return IndexerMockData.getLeaderboard();
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getPointsSiteStats = useCallback(
    execute(async () => {
      try {
        return await indexerClient.getPointsSiteStats();
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getPointsSiteStats failed, returning mock data:', err);
          return IndexerMockData.getSiteStats();
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  // Signature-protected endpoints
  const getWalletAccounts = useCallback(
    execute(async (walletAddress: string, signature: string, message: string, referralCode?: string) => {
      try {
        return await indexerClient.getWalletAccounts(walletAddress, signature, message, referralCode);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getWalletAccounts failed, returning mock data:', err);
          return IndexerMockData.getWalletAccounts(walletAddress);
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getDelegatedTo = useCallback(
    execute(async (walletAddress: string, signature: string, message: string) => {
      try {
        return await indexerClient.getDelegatedTo(walletAddress, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getDelegatedTo failed, returning mock data:', err);
          return IndexerMockData.getDelegatedTo(walletAddress);
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getDelegatedFrom = useCallback(
    execute(async (walletAddress: string, signature: string, message: string) => {
      try {
        return await indexerClient.getDelegatedFrom(walletAddress, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getDelegatedFrom failed, returning mock data:', err);
          return IndexerMockData.getDelegatedFrom(walletAddress);
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const createNonce = useCallback(
    execute(async (username: string, signature: string, message: string) => {
      try {
        return await indexerClient.createNonce(username, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] createNonce failed, returning mock data:', err);
          return IndexerMockData.createNonce(username);
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getNonce = useCallback(
    execute(async (username: string, signature: string, message: string) => {
      try {
        return await indexerClient.getNonce(username, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getNonce failed, returning mock data:', err);
          return IndexerMockData.getNonce(username);
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getEntitlement = useCallback(
    execute(async (walletAddress: string, signature: string, message: string) => {
      try {
        return await indexerClient.getEntitlement(walletAddress, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getEntitlement failed, returning mock data:', err);
          return IndexerMockData.getEntitlement(walletAddress);
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  const getPointsBalance = useCallback(
    execute(async (walletAddress: string, signature: string, message: string) => {
      try {
        return await indexerClient.getPointsBalance(walletAddress, signature, message);
      } catch (err) {
        if (devMode) {
          console.warn('[DevMode] getPointsBalance failed, returning mock data:', err);
          return IndexerMockData.getPointsBalance(walletAddress);
        }
        throw err;
      }
    }),
    [execute, indexerClient, devMode]
  );

  return {
    isLoading,
    error,
    // Public endpoints
    validateUsername,
    getSigningMessage,
    getPointsLeaderboard,
    getPointsSiteStats,
    // Signature-protected endpoints
    getWalletAccounts,
    getDelegatedTo,
    getDelegatedFrom,
    createNonce,
    getNonce,
    getEntitlement,
    getPointsBalance,
    clearError,
  };
};

export {
  useIndexerMail,
  type UseIndexerMailReturn
};