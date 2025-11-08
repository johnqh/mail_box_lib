/**
 * React hook for fetching mailer claims across multiple chains
 * Provides functionality to query and claim rewards from configured blockchain networks
 *
 * Note: Uses stateless OnchainMailerClient API
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type EVMWallet,
  OnchainMailerClient,
  type UnifiedTransaction,
  type Wallet,
} from '@sudobility/contracts';
import { Chain, Optional } from '@sudobility/types';
import { RpcHelpers } from '@sudobility/configs';
import type { ClaimableReward, ClaimRewardResult } from '../../../types';

interface UseMailerClaimsReturn {
  /** Array of claimable rewards (single reward for the specified chain) */
  rewards: ClaimableReward[];

  /** Total claimable amount (in USDC micro-units) */
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

  /** Claim rewards on the chain */
  claimRewards: () => Promise<ClaimRewardResult>;

  /** Clear any error state */
  clearError: () => void;
}

/**
 * Hook for managing mailer claims on a specific blockchain network
 *
 * @param connectedWallet - Connected wallet instance
 * @param chain - Chain to check for claimable rewards
 *
 * @example
 * ```typescript
 * import { Chain } from '@sudobility/types';
 *
 * const { rewards, totalClaimable, claimRewards, fetchRewards } = useMailerClaims(
 *   myWallet,
 *   Chain.ETH_MAINNET
 * );
 *
 * // Automatically fetches rewards on mount
 * // Display total claimable amount (in USDC micro-units)
 * console.log(`Total claimable: ${totalClaimable}`);
 *
 * // Claim rewards
 * const result = await claimRewards();
 * ```
 */
export const useMailerClaims = (
  connectedWallet: Wallet,
  chain: Chain
): UseMailerClaimsReturn => {
  // Create stateless client instance
  const client = useMemo(() => new OnchainMailerClient(), []);

  // Get chain info for the specified chain
  const chainInfo = useMemo(() => {
    return RpcHelpers.getChainInfo(chain);
  }, [chain]);

  // Store chainType for claiming
  const chainType = chainInfo?.chainType;

  const [rewards, setRewards] = useState<ClaimableReward[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetch claimable rewards from the chain
   */
  const fetchRewards = useCallback(async () => {
    if (!connectedWallet || !chainInfo) {
      setError('Wallet or chain configuration not provided');
      return;
    }

    // Get address from connected wallet
    const walletAddress =
      (connectedWallet as any).address ||
      (connectedWallet as any).walletClient?.address ||
      (connectedWallet as any).publicKey?.toBase58();

    if (!walletAddress) {
      setError('Unable to determine wallet address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const claimableInfo = await client.getRecipientClaimable(
        walletAddress,
        chainInfo
      );

      if (!claimableInfo) {
        setRewards([]);
        return;
      }

      const reward: ClaimableReward = {
        chainType: chainInfo.chainType,
        claimableAmount: claimableInfo.amount,
        chainId: chainInfo.chainId,
        rpcEndpoint: chainInfo.name,
      };

      setRewards([reward]);
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
  }, [client, connectedWallet, chainInfo]);

  // Alias for consistency with other hooks
  const refresh = fetchRewards;

  /**
   * Claim rewards on the chain
   */
  const claimRewards = useCallback(async (): Promise<ClaimRewardResult> => {
    if (!connectedWallet) {
      throw new Error('Wallet not provided');
    }

    if (!chainInfo || !chainType) {
      throw new Error('Chain configuration not available');
    }

    // Find the reward for this chain
    const reward = rewards[0];
    if (!reward || reward.claimableAmount === BigInt(0)) {
      throw new Error('No claimable rewards found');
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

      // Wait for transaction to be mined and confirmed
      if (transaction.hash && (connectedWallet as EVMWallet).publicClient) {
        const publicClient = (connectedWallet as EVMWallet).publicClient!;
        await publicClient.waitForTransactionReceipt({
          hash: transaction.hash as `0x${string}`,
        });

        // Wait additional time for indexer to process the event
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

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
  }, [client, connectedWallet, chainInfo, chainType, rewards, refresh]);

  // Always auto-fetch rewards on mount
  useEffect(() => {
    if (connectedWallet && chainInfo) {
      fetchRewards();
    }
  }, [connectedWallet, chainInfo, fetchRewards]);

  // Calculate total claimable
  const totalClaimable = rewards[0]?.claimableAmount ?? BigInt(0);

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

export type { UseMailerClaimsReturn };
