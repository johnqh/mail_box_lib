/**
 * TanStack Query hooks for Indexer API GET endpoints
 * 
 * These hooks provide automatic caching, background refetching, and stale-while-revalidate behavior.
 * They replace custom caching logic with TanStack Query's optimized caching strategy.
 */

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useAppConfig } from '../useServices';
import { IndexerClient } from '../../../network/clients/indexer';
import { queryKeys, STALE_TIMES } from '../../core/query';

// Types for API responses
export interface AddressValidationResponse {
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
export interface SigningMessageResponse {
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

export interface HowToEarnResponse {
  // Define based on actual API response structure
  [key: string]: unknown;
}

export interface PublicStatsResponse {
  // Define based on actual API response structure
  [key: string]: unknown;
}

export interface LeaderboardResponse {
  // Define based on actual API response structure
  [key: string]: unknown;
}

export interface CampaignsResponse {
  // Define based on actual API response structure
  [key: string]: unknown;
}

export interface CampaignStatsResponse {
  // Define based on actual API response structure
  [key: string]: unknown;
}

export interface PointsLeaderboardResponse {
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

export interface SiteStatsResponse {
  success: boolean;
  data: {
    totalPoints: string;
    totalUsers: number;
    lastUpdated: string;
    createdAt: string;
  };
}

export interface SolanaStatusResponse {
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
export const useAddressValidation = (
  address: string,
  options?: UseQueryOptions<AddressValidationResponse>
): UseQueryResult<AddressValidationResponse> => {
  const appConfig = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.validateAddress(address),
    queryFn: async (): Promise<AddressValidationResponse> => {
      const client = new IndexerClient(appConfig);
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
export const useSigningMessage = (
  chainId: number,
  walletAddress: string,
  domain: string,
  url: string,
  options?: UseQueryOptions<SigningMessageResponse>
): UseQueryResult<SigningMessageResponse> => {
  const appConfig = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.message(chainId, walletAddress, domain, url),
    queryFn: async (): Promise<SigningMessageResponse> => {
      const client = new IndexerClient(appConfig);
      return client.getMessage(chainId, walletAddress, domain, url);
    },
    staleTime: STALE_TIMES.SIGNING_MESSAGE,
    enabled: !!(chainId && walletAddress && domain && url),
    ...options,
  });
};

/**
 * Hook to get "How to Earn Points" information
 */
export const useHowToEarnPoints = (
  options?: UseQueryOptions<HowToEarnResponse>
): UseQueryResult<HowToEarnResponse> => {
  const appConfig = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.howToEarn(),
    queryFn: async (): Promise<HowToEarnResponse> => {
      const client = new IndexerClient(appConfig);
      return client.getHowToEarnPoints();
    },
    staleTime: STALE_TIMES.HOW_TO_EARN,
    ...options,
  });
};

/**
 * Hook to get public statistics
 */
export const usePublicStats = (
  options?: UseQueryOptions<PublicStatsResponse>
): UseQueryResult<PublicStatsResponse> => {
  const appConfig = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.publicStats(),
    queryFn: async (): Promise<PublicStatsResponse> => {
      const client = new IndexerClient(appConfig);
      return client.getPublicStats();
    },
    staleTime: STALE_TIMES.PUBLIC_STATS,
    ...options,
  });
};

/**
 * Hook to get leaderboard data
 */
export const useLeaderboard = (
  limit?: number,
  offset?: number,
  options?: UseQueryOptions<LeaderboardResponse>
): UseQueryResult<LeaderboardResponse> => {
  const appConfig = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.leaderboard(limit, offset),
    queryFn: async (): Promise<LeaderboardResponse> => {
      const client = new IndexerClient(appConfig);
      return client.getLeaderboard(limit, offset);
    },
    staleTime: STALE_TIMES.LEADERBOARD,
    ...options,
  });
};

/**
 * Hook to get campaigns list
 */
export const useCampaigns = (
  options?: UseQueryOptions<CampaignsResponse>
): UseQueryResult<CampaignsResponse> => {
  const appConfig = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.campaignsList(),
    queryFn: async (): Promise<CampaignsResponse> => {
      const client = new IndexerClient(appConfig);
      return client.getCampaigns();
    },
    staleTime: STALE_TIMES.CAMPAIGNS,
    ...options,
  });
};

/**
 * Hook to get campaign statistics
 */
export const useCampaignStats = (
  campaignId: string,
  options?: UseQueryOptions<CampaignStatsResponse>
): UseQueryResult<CampaignStatsResponse> => {
  const appConfig = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.campaignStats(campaignId),
    queryFn: async (): Promise<CampaignStatsResponse> => {
      const client = new IndexerClient(appConfig);
      return client.getCampaignStats(campaignId);
    },
    staleTime: STALE_TIMES.CAMPAIGN_STATS,
    enabled: !!campaignId,
    ...options,
  });
};

/**
 * Hook to get points leaderboard (new API)
 */
export const usePointsLeaderboard = (
  count: number = 10,
  options?: UseQueryOptions<PointsLeaderboardResponse>
): UseQueryResult<PointsLeaderboardResponse> => {
  const appConfig = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.pointsLeaderboard(count),
    queryFn: async (): Promise<PointsLeaderboardResponse> => {
      const client = new IndexerClient(appConfig);
      return client.getPointsLeaderboard(count);
    },
    staleTime: STALE_TIMES.LEADERBOARD,
    ...options,
  });
};

/**
 * Hook to get site-wide statistics
 */
export const useSiteStats = (
  options?: UseQueryOptions<SiteStatsResponse>
): UseQueryResult<SiteStatsResponse> => {
  const appConfig = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.siteStats(),
    queryFn: async (): Promise<SiteStatsResponse> => {
      const client = new IndexerClient(appConfig);
      return client.getPointsSiteStats();
    },
    staleTime: STALE_TIMES.SITE_STATS,
    ...options,
  });
};

/**
 * Hook to get Solana indexer status
 */
export const useSolanaStatus = (
  options?: UseQueryOptions<SolanaStatusResponse>
): UseQueryResult<SolanaStatusResponse> => {
  const appConfig = useAppConfig();
  
  return useQuery({
    queryKey: queryKeys.indexer.solanaStatus(),
    queryFn: async (): Promise<SolanaStatusResponse> => {
      const client = new IndexerClient(appConfig);
      return client.getSolanaStatus();
    },
    staleTime: STALE_TIMES.SOLANA_STATUS,
    ...options,
  });
};