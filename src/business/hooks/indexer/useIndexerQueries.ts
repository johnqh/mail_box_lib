/**
 * TanStack Query hooks for Indexer API GET endpoints
 * 
 * These hooks provide automatic caching, background refetching, and stale-while-revalidate behavior.
 * They replace custom caching logic with TanStack Query's optimized caching strategy.
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useAppConfig } from '../core/useServices';
import { IndexerClient } from '../../../network/clients/indexer';
import { convertToAppConfig } from './utils';
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

/**
 * Hook to validate address format (public endpoint)
 */
const useAddressValidation = (
  address: string,
  options?: UseQueryOptions<AddressValidationResponse>
): UseQueryResult<AddressValidationResponse> => {
  const config = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.validateAddress(address),
    queryFn: async (): Promise<AddressValidationResponse> => {
      const client = new IndexerClient(convertToAppConfig(config));
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
  chainId: number,
  walletAddress: string,
  domain: string,
  url: string,
  options?: UseQueryOptions<SigningMessageResponse>
): UseQueryResult<SigningMessageResponse> => {
  const config = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.message(chainId, walletAddress, domain, url),
    queryFn: async (): Promise<SigningMessageResponse> => {
      const client = new IndexerClient(convertToAppConfig(config));
      return client.getMessage(chainId, walletAddress, domain, url);
    },
    staleTime: STALE_TIMES.SIGNING_MESSAGE,
    enabled: !!(chainId && walletAddress && domain && url),
    ...options,
  });
};



/**
 * Hook to get points leaderboard (new API)
 */
const usePointsLeaderboard = (
  count: number = 10,
  options?: UseQueryOptions<PointsLeaderboardResponse>
): UseQueryResult<PointsLeaderboardResponse> => {
  const config = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.pointsLeaderboard(count),
    queryFn: async (): Promise<PointsLeaderboardResponse> => {
      const client = new IndexerClient(convertToAppConfig(config));
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
  options?: UseQueryOptions<SiteStatsResponse>
): UseQueryResult<SiteStatsResponse> => {
  const config = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.siteStats(),
    queryFn: async (): Promise<SiteStatsResponse> => {
      const client = new IndexerClient(convertToAppConfig(config));
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
  options?: UseQueryOptions<SolanaStatusResponse>
): UseQueryResult<SolanaStatusResponse> => {
  const config = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.solanaStatus(),
    queryFn: async (): Promise<SolanaStatusResponse> => {
      const client = new IndexerClient(convertToAppConfig(config));
      return client.getSolanaStatus();
    },
    staleTime: STALE_TIMES.SOLANA_STATUS,
    ...options,
  });
};

export {
  useAddressValidation,
  useSigningMessage,
  usePointsLeaderboard,
  useSiteStats,
  useSolanaStatus,
  type AddressValidationResponse,
  type SigningMessageResponse,
  type PointsLeaderboardResponse,
  type SiteStatsResponse,
  type SolanaStatusResponse
};