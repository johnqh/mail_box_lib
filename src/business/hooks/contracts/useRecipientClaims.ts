/**
 * React hook for fetching and claiming recipient revenue shares across multiple EVM chains
 * Uses RpcHelpers to automatically discover all configured chains with mailer contracts
 */

import { useCallback, useEffect, useState } from 'react';
import { type ChainInfo, RpcHelpers } from '@sudobility/configs';
import { ChainType, Optional } from '@sudobility/types';
import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { mainnet } from 'viem/chains';

export interface ChainClaimInfo {
  /** Chain information from RpcHelpers */
  chainInfo: ChainInfo;
  /** Claimable amount in USDC micro-units (6 decimals) */
  claimableAmount: Optional<bigint>;
  /** Loading state for this specific chain */
  isLoading: boolean;
  /** Error message for this specific chain */
  error: Optional<string>;
}

export interface UseRecipientClaimsConfig {
  /** Wallet address to check claims for */
  walletAddress: string;
  /** Whether wallet is connected */
  isConnected: boolean;
  /** Current chain type (only EVM supported) */
  chainType: 'evm' | 'solana';
  /** Wallet connector for signing transactions */
  connector: any; // WagmiConnector type
  /** Alchemy API key for RPC access */
  alchemyApiKey?: string;
  /** Whether to automatically fetch on mount */
  autoFetch?: boolean;
}

export interface UseRecipientClaimsReturn {
  /** Array of claim information for each configured chain */
  chainClaims: ChainClaimInfo[];
  /** Whether initial loading is in progress */
  isInitialLoading: boolean;
  /** Chain ID currently being claimed (null if not claiming) */
  claimingChainId: Optional<number>;
  /** Success message from last claim operation */
  successMessage: Optional<string>;
  /** Total claimable across all chains */
  totalClaimable: bigint;
  /** Manually fetch claimable amounts for all chains */
  fetchAllClaims: () => Promise<void>;
  /** Claim revenue for a specific chain */
  claimRevenue: (chainId: number, amount: bigint) => Promise<void>;
  /** Clear success message */
  clearSuccess: () => void;
}

/**
 * Hook for managing recipient revenue claims across multiple EVM chains
 *
 * Automatically discovers all chains with deployed mailer contracts using RpcHelpers
 * and fetches claimable amounts in parallel. Provides a simple interface for claiming.
 *
 * @example
 * ```typescript
 * const { chainClaims, claimRevenue, totalClaimable } = useRecipientClaims({
 *   walletAddress: '0x...',
 *   isConnected: true,
 *   chainType: 'evm',
 *   connector: wagmiConnector,
 *   alchemyApiKey: 'your-api-key',
 *   autoFetch: true
 * });
 *
 * // Display all claims
 * chainClaims.forEach(claim => {
 *   console.log(`${claim.chainInfo.name}: ${claim.claimableAmount} USDC`);
 * });
 *
 * // Claim revenue on a specific chain
 * await claimRevenue(1, claimableAmount); // Ethereum Mainnet
 * ```
 */
export const useRecipientClaims = (
  config: UseRecipientClaimsConfig
): UseRecipientClaimsReturn => {
  const {
    walletAddress,
    isConnected,
    chainType,
    connector,
    alchemyApiKey = '',
    autoFetch = false,
  } = config;

  const [chainClaims, setChainClaims] = useState<ChainClaimInfo[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [claimingChainId, setClaimingChainId] =
    useState<Optional<number>>(null);
  const [successMessage, setSuccessMessage] = useState<Optional<string>>(null);

  /**
   * Fetch claimable amounts for all configured chains
   */
  const fetchAllClaims = useCallback(async () => {
    if (!isConnected || !walletAddress || chainType !== 'evm') {
      setIsInitialLoading(false);
      return;
    }

    try {
      setIsInitialLoading(true);

      // Get all visible EVM chains (both production and dev)
      const prodChains = RpcHelpers.getVisibleChains(ChainType.EVM, false);
      const devChains = RpcHelpers.getVisibleChains(ChainType.EVM, true);
      const allChains = [...prodChains, ...devChains];

      // Initialize chain claims array
      const initialChainClaims: ChainClaimInfo[] = allChains.map(chainInfo => ({
        chainInfo,
        claimableAmount: null,
        isLoading: true,
        error: null,
      }));

      setChainClaims(initialChainClaims);

      // Import MailerClient
      const { MailerClient } = await import('@sudobility/contracts/evm');

      // Fetch claimable amounts for all chains in parallel
      const fetchPromises = allChains.map(async (chainInfo, index) => {
        if (!chainInfo.mailerAddress) {
          return {
            index,
            claimableAmount: null,
            error: 'No mailer contract deployed',
          };
        }

        try {
          const rpcUrl = RpcHelpers.getRpcUrl(
            alchemyApiKey,
            chainInfo.alchemyNetwork as any
          );

          if (!rpcUrl) {
            return {
              index,
              claimableAmount: null,
              error: 'RPC not available',
            };
          }

          const publicClient = createPublicClient({
            chain: mainnet,
            transport: http(rpcUrl),
          });

          const mailerClient = new MailerClient(
            chainInfo.mailerAddress as `0x${string}`,
            publicClient
          );

          const result = await mailerClient.getRecipientClaimable(
            walletAddress as `0x${string}`
          );

          return {
            index,
            claimableAmount: result.amount,
            error: null,
          };
        } catch (err: any) {
          console.error(
            `Error fetching claimable amount for ${chainInfo.name}:`,
            err
          );
          return {
            index,
            claimableAmount: null,
            error: err.message || 'Failed to fetch',
          };
        }
      });

      const results = await Promise.all(fetchPromises);

      // Update chain claims with results
      setChainClaims(prev =>
        prev.map((claim, index) => {
          const result = results[index];
          if (!result) {
            return {
              ...claim,
              isLoading: false,
              error: 'Failed to fetch claim data',
            };
          }
          return {
            ...claim,
            claimableAmount: result.claimableAmount,
            isLoading: false,
            error: result.error,
          };
        })
      );
    } catch (err: any) {
      console.error('Error fetching claimable amounts:', err);
    } finally {
      setIsInitialLoading(false);
    }
  }, [walletAddress, isConnected, chainType, alchemyApiKey]);

  /**
   * Claim revenue for a specific chain
   */
  const claimRevenue = useCallback(
    async (targetChainId: number, claimableAmount: bigint) => {
      if (!connector) {
        throw new Error('Wallet connector not available');
      }

      setClaimingChainId(targetChainId);
      setSuccessMessage(null);

      // Helper to update specific chain's error state
      const updateChainError = (error: Optional<string>) => {
        setChainClaims(prev =>
          prev.map(c =>
            c.chainInfo.chainId === targetChainId ? { ...c, error } : c
          )
        );
      };

      try {
        updateChainError(null);

        const targetChain = chainClaims.find(
          c => c.chainInfo.chainId === targetChainId
        );
        if (!targetChain || !targetChain.chainInfo.mailerAddress) {
          updateChainError('Mailer contract not configured');
          throw new Error('Mailer contract not configured for this network');
        }

        const mailerContractAddress = targetChain.chainInfo
          .mailerAddress as `0x${string}`;

        // Import MailerClient
        const { MailerClient } = await import('@sudobility/contracts/evm');

        // Get provider from connector
        const provider = await connector.getProvider();

        // Get RPC URL for the target chain
        const rpcUrl = RpcHelpers.getRpcUrl(
          alchemyApiKey,
          targetChain.chainInfo.alchemyNetwork as any
        );
        if (!rpcUrl) {
          updateChainError('Unable to connect to RPC');
          throw new Error('Unable to connect to blockchain RPC');
        }

        // Create clients for the target chain
        const publicClient = createPublicClient({
          chain: mainnet,
          transport: http(rpcUrl),
        });

        const walletClient = createWalletClient({
          chain: mainnet,
          transport: custom(provider),
        });

        // Create Mailer client and claim
        // The wallet will automatically prompt to switch networks if needed
        const mailerClient = new MailerClient(
          mailerContractAddress,
          publicClient
        );
        const txHash = await mailerClient.claimRecipientShare(
          walletClient,
          walletAddress as `0x${string}`
        );

        // Format amount for display
        const amountFormatted = (Number(claimableAmount) / 1_000_000).toFixed(
          2
        );
        setSuccessMessage(
          `Successfully claimed ${amountFormatted} USDC on ${targetChain.chainInfo.name}! Transaction: ${txHash}`
        );

        // Refresh claimable amount for this chain
        const result = await mailerClient.getRecipientClaimable(
          walletAddress as `0x${string}`
        );
        setChainClaims(prev =>
          prev.map(c =>
            c.chainInfo.chainId === targetChainId
              ? { ...c, claimableAmount: result.amount }
              : c
          )
        );
      } catch (err: any) {
        console.error('Error claiming revenue:', err);

        if (err.message?.includes('user rejected')) {
          updateChainError('Transaction was rejected');
        } else if (err.message?.includes('insufficient funds')) {
          updateChainError('Insufficient funds for gas');
        } else {
          updateChainError(err.message || 'Failed to claim revenue');
        }
        throw err;
      } finally {
        setClaimingChainId(null);
      }
    },
    [connector, chainClaims, walletAddress, alchemyApiKey]
  );

  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  // Auto-fetch on mount if configured
  useEffect(() => {
    if (autoFetch && isConnected && walletAddress && chainType === 'evm') {
      fetchAllClaims();
    }
  }, [autoFetch, isConnected, walletAddress, chainType, fetchAllClaims]);

  // Calculate total claimable across all chains
  const totalClaimable = chainClaims.reduce(
    (total, claim) => total + (claim.claimableAmount || BigInt(0)),
    BigInt(0)
  );

  return {
    chainClaims,
    isInitialLoading,
    claimingChainId,
    successMessage,
    totalClaimable,
    fetchAllClaims,
    claimRevenue,
    clearSuccess,
  };
};
