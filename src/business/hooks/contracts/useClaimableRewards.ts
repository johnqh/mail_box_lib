/**
 * React hook for fetching claimable rewards across multiple chains
 * Provides functionality to query and claim rewards from configured blockchain networks
 */

import { useCallback, useEffect, useState } from 'react';
import {
  type ChainConfig,
  OnchainMailerClient,
  type UnifiedTransaction,
  type UnifiedWallet,
} from '@sudobility/contracts';
import { ChainType, Optional } from '@sudobility/types';
import type { ClaimableReward, ClaimRewardResult } from '../../../types';

interface UseClaimableRewardsConfig {
  /** Unified wallet instance */
  wallet: UnifiedWallet;

  /** Array of chain configurations to check for claimable rewards */
  chainConfigs: ChainConfig[];

  /** Optional address to check claimable rewards for (defaults to connected wallet) */
  address?: string;

  /** Whether to automatically fetch rewards on mount */
  autoFetch?: boolean;
}

interface UseClaimableRewardsReturn {
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

  /** Claim rewards on a specific chain */
  claimRewards: (chainType: ChainType) => Promise<ClaimRewardResult>;

  /** Clear any error state */
  clearError: () => void;
}

/**
 * Hook for managing claimable rewards across multiple blockchain networks
 *
 * @example
 * ```typescript
 * const { rewards, totalClaimable, claimRewards, fetchRewards } = useClaimableRewards({
 *   wallet: myWallet,
 *   chainConfigs: [
 *     {
 *       evm: {
 *         rpc: 'https://eth-mainnet.alchemyapi.io/...',
 *         chainId: 1,
 *         contracts: { mailer: '0x...', usdc: '0x...' }
 *       }
 *     },
 *     {
 *       solana: {
 *         rpc: 'https://api.mainnet-beta.solana.com',
 *         usdcMint: 'EPjF...',
 *         programs: { mailer: '9FLk...' }
 *       }
 *     }
 *   ],
 *   autoFetch: true
 * });
 *
 * // Display total claimable
 * console.log('Total claimable:', Number(totalClaimable) / 1_000_000, 'USDC');
 *
 * // Claim rewards on a specific chain
 * const result = await claimRewards(ChainType.EVM);
 * console.log('Claimed:', result.amountClaimed);
 * ```
 */
export const useClaimableRewards = (
  config: UseClaimableRewardsConfig
): UseClaimableRewardsReturn => {
  const { wallet, chainConfigs, address, autoFetch = false } = config;

  const [rewards, setRewards] = useState<ClaimableReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Get chain type from config
   */
  const getChainTypeFromConfig = (chainConfig: ChainConfig): ChainType => {
    if (chainConfig.evm) {
      return ChainType.EVM;
    } else if (chainConfig.solana) {
      return ChainType.SOLANA;
    }
    throw new Error('Invalid chain configuration');
  };

  /**
   * Get chain identifier from config
   */
  const getChainId = (chainConfig: ChainConfig): number | string => {
    if (chainConfig.evm) {
      return chainConfig.evm.chainId;
    } else if (chainConfig.solana) {
      return 'solana';
    }
    return 'unknown';
  };

  /**
   * Get RPC endpoint from config
   */
  const getRpcEndpoint = (chainConfig: ChainConfig): string => {
    if (chainConfig.evm) {
      return chainConfig.evm.rpc;
    } else if (chainConfig.solana) {
      return chainConfig.solana.rpc;
    }
    return '';
  };

  /**
   * Fetch claimable rewards from all configured chains
   */
  const fetchRewards = useCallback(async () => {
    if (!wallet || chainConfigs.length === 0) {
      setError('Wallet or chain configurations not provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const rewardPromises = chainConfigs.map(async chainConfig => {
        try {
          const client = new OnchainMailerClient(wallet, chainConfig);
          const claimableAmount = await client.getClaimableAmount(address);

          const reward: ClaimableReward = {
            chainType: getChainTypeFromConfig(chainConfig),
            claimableAmount,
            chainId: getChainId(chainConfig),
            rpcEndpoint: getRpcEndpoint(chainConfig),
          };

          return reward;
        } catch (err) {
          console.warn(
            `Failed to fetch claimable amount for chain:`,
            chainConfig,
            err
          );
          // Return zero claimable for failed chains
          return {
            chainType: getChainTypeFromConfig(chainConfig),
            claimableAmount: BigInt(0),
            chainId: getChainId(chainConfig),
            rpcEndpoint: getRpcEndpoint(chainConfig),
          };
        }
      });

      const fetchedRewards = await Promise.all(rewardPromises);
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
  }, [wallet, chainConfigs, address]);

  /**
   * Claim rewards on a specific chain
   */
  const claimRewards = useCallback(
    async (chainType: ChainType): Promise<ClaimRewardResult> => {
      if (!wallet) {
        throw new Error('Wallet not provided');
      }

      // Find the chain config for the specified chain type
      const chainConfig = chainConfigs.find(config => {
        if (chainType === ChainType.EVM && config.evm) return true;
        if (chainType === ChainType.SOLANA && config.solana) return true;
        return false;
      });

      if (!chainConfig) {
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
        const client = new OnchainMailerClient(wallet, chainConfig);
        const transaction: UnifiedTransaction = await client.claimRevenue();

        const result: ClaimRewardResult = {
          chainType,
          transactionHash: transaction.hash,
          amountClaimed: reward.claimableAmount,
          success: true,
        };

        // Refresh rewards after claiming
        await fetchRewards();

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
    [wallet, chainConfigs, rewards, fetchRewards]
  );

  // Auto-fetch rewards on mount if configured
  useEffect(() => {
    if (autoFetch && wallet && chainConfigs.length > 0) {
      fetchRewards();
    }
  }, [autoFetch, wallet, chainConfigs.length, fetchRewards]);

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
    claimRewards,
    clearError,
  };
};

export type { UseClaimableRewardsConfig, UseClaimableRewardsReturn };
