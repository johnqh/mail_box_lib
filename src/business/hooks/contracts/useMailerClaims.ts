/**
 * React hook for fetching mailer claims across multiple chains
 * Provides functionality to query and claim rewards from configured blockchain networks
 *
 * Note: Uses stateless OnchainMailerClient API
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  OnchainMailerClient,
  type UnifiedTransaction,
  type Wallet,
} from '@sudobility/contracts';
import { ChainType, Optional } from '@sudobility/types';
import type { ChainInfo } from '@sudobility/configs';
import type { ClaimableReward, ClaimRewardResult } from '../../../types';

interface UseMailerClaimsConfig {
  /** Connected wallet instance */
  connectedWallet: Wallet;

  /** Array of chain info to check for claimable rewards */
  chainInfos: ChainInfo[];

  /** Optional address to check claimable rewards for (defaults to connected wallet) */
  address?: string;

  /** Whether to automatically fetch rewards on mount */
  autoFetch?: boolean;
}

interface UseMailerClaimsReturn {
  /** Array of claimable rewards across all configured chains */
  rewards: ClaimableReward[];

  /** Total claimable amount across all chains (in USDC micro-units) */
  totalClaimable: bigint;

  /** Loading state for fetching rewards */
  isLoading: boolean;

  /** Loading state for claiming rewards */
  isClaiming: boolean;

  /** Error message if any operation failed */
  error: Optional<string>;

  /** Manually fetch claimable rewards */
  fetchRewards: () => Promise<void>;

  /** Refresh claimable rewards (alias for fetchRewards) */
  refresh: () => Promise<void>;

  /** Claim rewards on a specific chain */
  claimRewards: (chainType: ChainType) => Promise<ClaimRewardResult>;

  /** Clear any error state */
  clearError: () => void;
}

/**
 * Hook for managing mailer claims across multiple blockchain networks
 *
 * @example
 * ```typescript
 * import { RpcHelpers } from '@sudobility/configs';
 * import { Chain } from '@sudobility/types';
 *
 * const ethChainInfo = RpcHelpers.getChainInfo(Chain.ETH_MAINNET);
 * const solanaChainInfo = RpcHelpers.getChainInfo(Chain.SOLANA_MAINNET);
 *
 * const { rewards, totalClaimable, claimRewards, fetchRewards } = useMailerClaims({
 *   connectedWallet: myWallet,
 *   chainInfos: [ethChainInfo, solanaChainInfo],
 *   autoFetch: true
 * });
 *
 * // Display total claimable amount
 * console.log(`Total claimable: ${totalClaimable}`);
 *
 * // Claim rewards on a specific chain
 * const result = await claimRewards(ChainType.EVM);
 * ```
 */
export const useMailerClaims = (
  config: UseMailerClaimsConfig
): UseMailerClaimsReturn => {
  const { connectedWallet, chainInfos, address, autoFetch = false } = config;

  // Create stateless client instance
  const client = useMemo(() => new OnchainMailerClient(), []);

  const [rewards, setRewards] = useState<ClaimableReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch claimable rewards from all configured chains
   */
  const fetchRewards = useCallback(async () => {
    if (!connectedWallet || chainInfos.length === 0) {
      setError('Wallet or chain configurations not provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rewardPromises = chainInfos.map(async chainInfo => {
        try {
          // Determine recipient address - must be provided in config
          if (!address) {
            console.warn('No recipient address provided for chain:', chainInfo);
            return null;
          }

          const claimableInfo = await client.getRecipientClaimable(
            address,
            chainInfo
          );

          if (!claimableInfo) {
            return null;
          }

          const reward: ClaimableReward = {
            chainType: chainInfo.chainType,
            claimableAmount: claimableInfo.amount,
            chainId: chainInfo.chainId,
            rpcEndpoint: chainInfo.name, // Use chain name as identifier
          };

          return reward;
        } catch (err) {
          console.warn(
            `Failed to fetch claimable amount for chain:`,
            chainInfo,
            err
          );
          // Return zero claimable for failed chains
          return {
            chainType: chainInfo.chainType,
            claimableAmount: BigInt(0),
            chainId: chainInfo.chainId,
            rpcEndpoint: chainInfo.name,
          };
        }
      });

      const fetchedRewards = (await Promise.all(rewardPromises)).filter(
        (r): r is ClaimableReward => r !== null
      );
      setRewards(fetchedRewards);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Failed to fetch claimable rewards';
      setError(errorMessage);
      console.error('Error fetching rewards:', err);
    } finally {
      setIsLoading(false);
    }
  }, [client, connectedWallet, chainInfos, address]);

  // Alias for consistency with other hooks
  const refresh = fetchRewards;

  /**
   * Claim rewards on a specific chain
   */
  const claimRewards = useCallback(
    async (chainType: ChainType): Promise<ClaimRewardResult> => {
      if (!connectedWallet) {
        throw new Error('Wallet not provided');
      }

      // Find the chain info for the specified chain type
      const chainInfo = chainInfos.find(info => info.chainType === chainType);

      if (!chainInfo) {
        throw new Error(`No configuration found for chain type: ${chainType}`);
      }

      // Find the reward for this chain
      const reward = rewards.find(r => r.chainType === chainType);
      if (!reward || reward.claimableAmount === BigInt(0)) {
        throw new Error(
          `No claimable rewards found for chain type: ${chainType}`
        );
      }

      setIsClaiming(true);
      setError(null);

      try {
        const transaction: UnifiedTransaction = await client.claimRevenue(
          connectedWallet,
          chainInfo
        );

        const result: ClaimRewardResult = {
          chainType,
          transactionHash: transaction.hash,
          amountClaimed: reward.claimableAmount,
          success: true,
        };

        // Refresh rewards after claiming
        await refresh();

        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to claim rewards';
        setError(errorMessage);
        throw err;
      } finally {
        setIsClaiming(false);
      }
    },
    [client, connectedWallet, chainInfos, rewards, refresh]
  );

  // Auto-fetch rewards on mount if configured
  useEffect(() => {
    if (autoFetch && connectedWallet && chainInfos.length > 0) {
      fetchRewards();
    }
  }, [autoFetch, connectedWallet, chainInfos.length, fetchRewards]);

  // Calculate total claimable across all chains
  const totalClaimable = rewards.reduce(
    (total, reward) => total + reward.claimableAmount,
    BigInt(0)
  );

  return {
    rewards,
    totalClaimable,
    isLoading,
    isClaiming,
    error,
    fetchRewards,
    refresh,
    claimRewards,
    clearError,
  };
};

export type { UseMailerClaimsConfig, UseMailerClaimsReturn };
