/**
 * TanStack Query hooks for Indexer API GET endpoints
 * 
 * These hooks provide automatic caching, background refetching, and stale-while-revalidate behavior.
 * They replace custom caching logic with TanStack Query's optimized caching strategy.
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { IndexerClient } from '../../../network/clients/indexer';
import { queryKeys, STALE_TIMES } from '../../core/query';

// Types for API responses
interface AddressValidationResponse {
  isValid: boolean;
  addressType: string;
  normalizedAddress: string;
  formats?: {
    standard: string;
    checksummed?: string;
    compressed?: string;
  };
  message?: string;
  error?: string;
  timestamp: string;
}
interface SigningMessageResponse {
  walletAddress: string;
  addressType: string;
  chainId: number;
  domain: string;
  uri: string;
  messages: {
    deterministic?: string;
    simple: string;
    solana?: string;
    info: {
      domain: string;
      uri: string;
      chainId: number;
      date?: string;
    };
  };
  recommended: string;
  instructions: {
    evm: string;
    solana: string;
  };
  verification: {
    endpoint: string;
    method: string;
    body: object;
    note: string;
  };
  regeneration: {
    note: string;
    endpoint: string;
  };
  timestamp: string;
}


interface PointsLeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: Array<{
      walletAddress: string;
      pointsEarned: string;
      rank: number;
    }>;
    count: number;
  };
}

interface SiteStatsResponse {
  success: boolean;
  data: {
    totalPoints: string;
    totalUsers: number;
    lastUpdated: string;
    createdAt: string;
  };
}

interface SolanaStatusResponse {
  solanaIndexers: Array<{
    chainId: number;
    initialized: boolean;
    networkName: string;
  }>;
  totalIndexers: number;
  configured: boolean;
}

interface IndexerEmailAddressesResponse {
  success: boolean;
  data: Array<{
    address: string;
    verified: boolean;
    primary?: boolean;
  }>;
}

interface IndexerDelegatedResponse {
  success: boolean;
  data: Array<{
    delegatedAddress: string;
    permissions: string[];
  }>;
}

interface IndexerPointsBalanceResponse {
  success: boolean;
  data: {
    walletAddress: string;
    pointsEarned: string;
    totalTransactions: number;
    lastUpdated: string;
  };
}

interface IndexerNameServiceEntitlementResponse {
  success: boolean;
  data: {
    entitled: boolean;
    subscriptionType?: string;
    expiresAt?: string;
  };
}

/**
 * Hook to validate address format (public endpoint)
 */
const useAddressValidation = (
  endpointUrl: string,
  dev: boolean,
  address: string,
  options?: UseQueryOptions<AddressValidationResponse>
): UseQueryResult<AddressValidationResponse> => {
  return useQuery({
    queryKey: queryKeys.indexer.validateAddress(address),
    queryFn: async (): Promise<AddressValidationResponse> => {
      const client = new IndexerClient(endpointUrl, dev);
      return client.validateAddress(address);
    },
    staleTime: STALE_TIMES.ADDRESS_VALIDATION,
    enabled: !!address,
    ...options,
  });
};

/**
 * Hook to get signing message for wallet verification
 */
const useSigningMessage = (
  endpointUrl: string,
  dev: boolean,
  chainId: number,
  walletAddress: string,
  domain: string,
  url: string,
  options?: UseQueryOptions<SigningMessageResponse>
): UseQueryResult<SigningMessageResponse> => {
  return useQuery({
    queryKey: queryKeys.indexer.message(chainId, walletAddress, domain, url),
    queryFn: async (): Promise<SigningMessageResponse> => {
      const client = new IndexerClient(endpointUrl, dev);
      return client.getMessage(chainId, walletAddress, domain, url);
    },
    staleTime: STALE_TIMES.SIGNING_MESSAGE,
    enabled: !!(chainId && walletAddress && domain && url),
    ...options,
  });
};



/**
 * Hook to get points leaderboard from indexer (new API)
 */
const useIndexerPointsLeaderboard = (
  endpointUrl: string,
  dev: boolean,
  count: number = 10,
  options?: UseQueryOptions<PointsLeaderboardResponse>
): UseQueryResult<PointsLeaderboardResponse> => {
  return useQuery({
    queryKey: queryKeys.indexer.pointsLeaderboard(count),
    queryFn: async (): Promise<PointsLeaderboardResponse> => {
      const client = new IndexerClient(endpointUrl, dev);
      return client.getPointsLeaderboard(count);
    },
    staleTime: STALE_TIMES.LEADERBOARD,
    ...options,
  });
};

/**
 * Hook to get site-wide statistics
 */
const useSiteStats = (
  endpointUrl: string,
  dev: boolean,
  options?: UseQueryOptions<SiteStatsResponse>
): UseQueryResult<SiteStatsResponse> => {
  return useQuery({
    queryKey: queryKeys.indexer.siteStats(),
    queryFn: async (): Promise<SiteStatsResponse> => {
      const client = new IndexerClient(endpointUrl, dev);
      return client.getPointsSiteStats();
    },
    staleTime: STALE_TIMES.SITE_STATS,
    ...options,
  });
};

/**
 * Hook to get Solana indexer status
 */
const useSolanaStatus = (
  endpointUrl: string,
  dev: boolean,
  options?: UseQueryOptions<SolanaStatusResponse>
): UseQueryResult<SolanaStatusResponse> => {
  return useQuery({
    queryKey: queryKeys.indexer.solanaStatus(),
    queryFn: async (): Promise<SolanaStatusResponse> => {
      const client = new IndexerClient(endpointUrl, dev);
      return client.getSolanaStatus();
    },
    staleTime: STALE_TIMES.SOLANA_STATUS,
    ...options,
  });
};

/**
 * Hook to get email addresses for a wallet (protected endpoint)
 */
const useIndexerEmailAddresses = (
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  signature: string,
  message: string,
  options?: UseQueryOptions<IndexerEmailAddressesResponse>
): UseQueryResult<IndexerEmailAddressesResponse> => {
  return useQuery({
    queryKey: [...queryKeys.indexer.addresses(), 'email-addresses', walletAddress, signature] as const,
    queryFn: async (): Promise<IndexerEmailAddressesResponse> => {
      const client = new IndexerClient(endpointUrl, dev);
      return client.getEmailAddresses(walletAddress, signature, message);
    },
    staleTime: STALE_TIMES.INDEXER_EMAIL_ADDRESSES,
    enabled: !!(walletAddress && signature && message),
    ...options,
  });
};

/**
 * Hook to get delegated addresses (protected endpoint)
 */
const useIndexerDelegated = (
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  signature: string,
  message: string,
  options?: UseQueryOptions<IndexerDelegatedResponse>
): UseQueryResult<IndexerDelegatedResponse> => {
  return useQuery({
    queryKey: [...queryKeys.indexer.addresses(), 'delegated', walletAddress, signature] as const,
    queryFn: async (): Promise<IndexerDelegatedResponse> => {
      const client = new IndexerClient(endpointUrl, dev);
      return client.getDelegated(walletAddress, signature, message);
    },
    staleTime: STALE_TIMES.INDEXER_EMAIL_ADDRESSES,
    enabled: !!(walletAddress && signature && message),
    ...options,
  });
};

/**
 * Hook to get delegated-to addresses (protected endpoint)
 */
const useIndexerDelegatedTo = (
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  signature: string,
  message: string,
  options?: UseQueryOptions<IndexerDelegatedResponse>
): UseQueryResult<IndexerDelegatedResponse> => {
  return useQuery({
    queryKey: [...queryKeys.indexer.addresses(), 'delegated-to', walletAddress, signature] as const,
    queryFn: async (): Promise<IndexerDelegatedResponse> => {
      const client = new IndexerClient(endpointUrl, dev);
      return client.getDelegatedTo(walletAddress, signature, message);
    },
    staleTime: STALE_TIMES.INDEXER_EMAIL_ADDRESSES,
    enabled: !!(walletAddress && signature && message),
    ...options,
  });
};

/**
 * Hook to get points balance for a wallet (protected endpoint)
 */
const useIndexerPointsBalance = (
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  signature: string,
  message: string,
  options?: UseQueryOptions<IndexerPointsBalanceResponse>
): UseQueryResult<IndexerPointsBalanceResponse> => {
  return useQuery({
    queryKey: [...queryKeys.indexer.points(), 'balance', walletAddress, signature] as const,
    queryFn: async (): Promise<IndexerPointsBalanceResponse> => {
      const client = new IndexerClient(endpointUrl, dev);
      return client.getPointsBalance(walletAddress, signature, message);
    },
    staleTime: STALE_TIMES.POINTS_BALANCE,
    enabled: !!(walletAddress && signature && message),
    ...options,
  });
};

/**
 * Hook to check name service entitlement (protected endpoint)
 */
const useIndexerNameServiceEntitlement = (
  endpointUrl: string,
  dev: boolean,
  walletAddress: string,
  signature: string,
  message: string,
  options?: UseQueryOptions<IndexerNameServiceEntitlementResponse>
): UseQueryResult<IndexerNameServiceEntitlementResponse> => {
  return useQuery({
    queryKey: [...queryKeys.indexer.addresses(), 'entitlement', walletAddress, signature] as const,
    queryFn: async (): Promise<IndexerNameServiceEntitlementResponse> => {
      const client = new IndexerClient(endpointUrl, dev);
      return client.checkNameServiceEntitlement(walletAddress, signature, message);
    },
    staleTime: STALE_TIMES.NAME_SERVICE_RESOLUTION,
    enabled: !!(walletAddress && signature && message),
    ...options,
  });
};

export {
  useAddressValidation,
  useSigningMessage,
  useIndexerPointsLeaderboard,
  useSiteStats,
  useSolanaStatus,
  useIndexerEmailAddresses,
  useIndexerDelegated,
  useIndexerDelegatedTo,
  useIndexerPointsBalance,
  useIndexerNameServiceEntitlement,
  type AddressValidationResponse,
  type SigningMessageResponse,
  type PointsLeaderboardResponse,
  type SiteStatsResponse,
  type SolanaStatusResponse,
  type IndexerEmailAddressesResponse,
  type IndexerDelegatedResponse,
  type IndexerPointsBalanceResponse,
  type IndexerNameServiceEntitlementResponse
};