/**
 * React hook for managing USDC approval for Mailer contracts
 * Provides functions to check, approve, and revoke USDC allowance for mailer contracts
 */

import { useCallback, useEffect, useState } from 'react';
import { type ApiKeys, RpcHelpers } from '@sudobility/configs';
import { Chain, Optional } from '@sudobility/types';
import {
  createPublicClient,
  createWalletClient,
  custom,
  formatUnits,
  http,
  parseUnits,
} from 'viem';
import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  polygon,
  polygonAmoy,
  sepolia,
} from 'viem/chains';
import type { Address, Chain as ViemChain } from 'viem';

// Helper function to get viem chain from chainId
const getViemChain = (chainId: number): ViemChain => {
  const chainMap: Record<number, ViemChain> = {
    1: mainnet,
    11155111: sepolia,
    137: polygon,
    80002: polygonAmoy,
    42161: arbitrum,
    421614: arbitrumSepolia,
    10: optimism,
    11155420: optimismSepolia,
    8453: base,
    84532: baseSepolia,
  };

  const chain = chainMap[chainId];
  if (!chain) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }

  return chain;
};

// ERC20 ABI for approve and allowance functions
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export interface UseMailerContractApprovalReturn {
  /** Current approved USDC amount (in USDC units, not micro-units) */
  approvedAmount: Optional<string>;
  /** Current approved amount as bigint (in micro-units with 6 decimals) */
  approvedAmountRaw: Optional<bigint>;
  /** Whether currently fetching allowance */
  isLoading: boolean;
  /** Whether currently approving */
  isApproving: boolean;
  /** Error message if any */
  error: Optional<string>;
  /** Success message from last operation */
  successMessage: Optional<string>;
  /** Fetch current allowance */
  fetchAllowance: () => Promise<void>;
  /** Approve USDC for mailer contract */
  approve: (amount: string) => Promise<void>;
  /** Revoke approval (set allowance to 0) */
  revoke: () => Promise<void>;
  /** Clear error message */
  clearError: () => void;
  /** Clear success message */
  clearSuccess: () => void;
  /** USDC contract address for current chain */
  usdcAddress: Optional<Address>;
  /** Mailer contract address for current chain */
  mailerAddress: Optional<Address>;
}

/**
 * Hook for managing USDC approval for Mailer contracts
 *
 * @example
 * ```typescript
 * const {
 *   approvedAmount,
 *   approve,
 *   revoke,
 *   isLoading
 * } = useMailerContractApproval({
 *   '0x...',
 *   Chain.ETH_MAINNET,
 *   wagmiConnector,
 *   { alchemyApiKey: 'your-key' }
 * });
 *
 * // Approve 100 USDC
 * await approve('100');
 *
 * // Revoke approval
 * await revoke();
 * ```
 */
export const useMailerContractApproval = (
  walletAddress: Optional<string>,
  chain: Chain,
  connector: any,
  apiKeys?: ApiKeys
): UseMailerContractApprovalReturn => {
  const [approvedAmount, setApprovedAmount] = useState<Optional<string>>(null);
  const [approvedAmountRaw, setApprovedAmountRaw] =
    useState<Optional<bigint>>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<Optional<string>>(null);
  const [successMessage, setSuccessMessage] = useState<Optional<string>>(null);

  // Get chain info using convenient helper
  const chainInfo = RpcHelpers.getChainInfo(chain);
  const chainId = chainInfo?.chainId;
  const usdcAddress = chainInfo?.usdcAddress as Optional<Address>;
  const mailerAddress = chainInfo?.mailerAddress as Optional<Address>;

  // Extract API keys with defaults
  const alchemyApiKey = apiKeys?.alchemyApiKey || '';
  const ankrApiKey = apiKeys?.ankrApiKey || '';
  const metamaskApiKey = apiKeys?.metamaskApiKey || '';
  const isConnected = !!walletAddress && !!connector;

  /**
   * Fetch current USDC allowance for the mailer contract
   */
  const fetchAllowance = useCallback(async () => {
    if (!isConnected || !walletAddress || !usdcAddress || !mailerAddress) {
      setApprovedAmount(null);
      setApprovedAmountRaw(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!chainInfo) {
        throw new Error('Chain information not available');
      }

      // Build RPC URL with priority: Ankr > Metamask > Alchemy
      let rpcUrl: Optional<string> = null;

      if (ankrApiKey && chainInfo.ankrNetwork) {
        rpcUrl = `https://rpc.ankr.com/${chainInfo.ankrNetwork}/${ankrApiKey}`;
      } else if (metamaskApiKey && chainInfo.metamaskNetwork) {
        rpcUrl = `https://${chainInfo.metamaskNetwork}.infura.io/v3/${metamaskApiKey}`;
      } else if (alchemyApiKey && chainInfo.alchemyNetwork) {
        rpcUrl = `https://${chainInfo.alchemyNetwork}.g.alchemy.com/v2/${alchemyApiKey}`;
      }

      if (!rpcUrl) {
        throw new Error(
          'No RPC endpoint configured. Please provide at least one API key (Alchemy, Ankr, or Metamask).'
        );
      }

      // Create public client for reading using the RPC URL
      const publicClient = createPublicClient({
        chain: mainnet, // Wallet will auto-switch if needed
        transport: http(rpcUrl),
      });

      // Read allowance from USDC contract
      const allowance = await publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [walletAddress as Address, mailerAddress],
      });

      setApprovedAmountRaw(allowance);
      // Convert from 6 decimals to readable format
      setApprovedAmount(formatUnits(allowance, 6));
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch allowance';
      setError(errorMessage);
      console.error('Failed to fetch USDC allowance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    walletAddress,
    isConnected,
    usdcAddress,
    mailerAddress,
    chainInfo,
    alchemyApiKey,
    ankrApiKey,
    metamaskApiKey,
  ]);

  /**
   * Approve USDC for the mailer contract
   * @param amount Amount in USDC (e.g., "100" for 100 USDC)
   */
  const approve = useCallback(
    async (amount: string) => {
      if (!isConnected || !walletAddress || !usdcAddress || !mailerAddress) {
        throw new Error('Wallet not connected or contracts not available');
      }

      if (!connector) {
        throw new Error('Wallet connector not available');
      }

      setIsApproving(true);
      setError(null);
      setSuccessMessage(null);

      try {
        // Get provider from connector
        const provider = await connector.getProvider();

        // Get the correct viem chain for the target chainId
        if (!chainId) {
          throw new Error('Chain ID not available');
        }
        const targetChain = getViemChain(chainId);

        // Create wallet client with the correct chain
        const walletClient = await createWalletClient({
          chain: targetChain,
          transport: custom(provider),
        });

        // Convert amount to micro-units (6 decimals)
        const amountInMicroUnits = parseUnits(amount, 6);

        // Approve USDC
        const hash = await walletClient.writeContract({
          address: usdcAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [mailerAddress, amountInMicroUnits],
          account: walletAddress as Address,
        });

        // Create public client to wait for transaction confirmation
        let rpcUrl: Optional<string> = null;
        if (chainInfo) {
          if (ankrApiKey && chainInfo.ankrNetwork) {
            rpcUrl = `https://rpc.ankr.com/${chainInfo.ankrNetwork}/${ankrApiKey}`;
          } else if (metamaskApiKey && chainInfo.metamaskNetwork) {
            rpcUrl = `https://${chainInfo.metamaskNetwork}.infura.io/v3/${metamaskApiKey}`;
          } else if (alchemyApiKey && chainInfo.alchemyNetwork) {
            rpcUrl = `https://${chainInfo.alchemyNetwork}.g.alchemy.com/v2/${alchemyApiKey}`;
          }
        }

        if (rpcUrl) {
          const publicClient = createPublicClient({
            chain: targetChain,
            transport: http(rpcUrl),
          });

          // Wait for transaction confirmation
          await publicClient.waitForTransactionReceipt({ hash });
        }

        setSuccessMessage(
          `Successfully approved ${amount} USDC. Transaction: ${hash}`
        );

        // Refresh allowance after transaction is confirmed
        await fetchAllowance();
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to approve USDC';
        setError(errorMessage);
        throw err;
      } finally {
        setIsApproving(false);
      }
    },
    [
      walletAddress,
      isConnected,
      usdcAddress,
      mailerAddress,
      connector,
      fetchAllowance,
      chainId,
      chainInfo,
      alchemyApiKey,
      ankrApiKey,
      metamaskApiKey,
    ]
  );

  /**
   * Revoke USDC approval (set allowance to 0)
   */
  const revoke = useCallback(async () => {
    if (!isConnected || !walletAddress || !usdcAddress || !mailerAddress) {
      throw new Error('Wallet not connected or contracts not available');
    }

    if (!connector) {
      throw new Error('Wallet connector not available');
    }

    setIsApproving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Get provider from connector
      const provider = await connector.getProvider();

      // Get the correct viem chain for the target chainId
      if (!chainId) {
        throw new Error('Chain ID not available');
      }
      const targetChain = getViemChain(chainId);

      // Create wallet client with the correct chain
      const walletClient = await createWalletClient({
        chain: targetChain,
        transport: custom(provider),
      });

      // Revoke approval by setting allowance to 0
      const hash = await walletClient.writeContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [mailerAddress, 0n],
        account: walletAddress as Address,
      });

      // Create public client to wait for transaction confirmation
      let rpcUrl: Optional<string> = null;
      if (chainInfo) {
        if (ankrApiKey && chainInfo.ankrNetwork) {
          rpcUrl = `https://rpc.ankr.com/${chainInfo.ankrNetwork}/${ankrApiKey}`;
        } else if (metamaskApiKey && chainInfo.metamaskNetwork) {
          rpcUrl = `https://${chainInfo.metamaskNetwork}.infura.io/v3/${metamaskApiKey}`;
        } else if (alchemyApiKey && chainInfo.alchemyNetwork) {
          rpcUrl = `https://${chainInfo.alchemyNetwork}.g.alchemy.com/v2/${alchemyApiKey}`;
        }
      }

      if (rpcUrl) {
        const publicClient = createPublicClient({
          chain: targetChain,
          transport: http(rpcUrl),
        });

        // Wait for transaction confirmation
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setSuccessMessage(
        `Successfully revoked USDC approval. Transaction: ${hash}`
      );

      // Refresh allowance after transaction is confirmed
      await fetchAllowance();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to revoke approval';
      setError(errorMessage);
      throw err;
    } finally {
      setIsApproving(false);
    }
  }, [
    walletAddress,
    isConnected,
    usdcAddress,
    mailerAddress,
    connector,
    fetchAllowance,
    chainId,
    chainInfo,
    alchemyApiKey,
    ankrApiKey,
    metamaskApiKey,
  ]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccessMessage(null);
  }, []);

  // Always auto-fetch allowance on mount if wallet is connected
  useEffect(() => {
    if (isConnected) {
      fetchAllowance();
    }
  }, [isConnected, fetchAllowance]);

  return {
    approvedAmount,
    approvedAmountRaw,
    isLoading,
    isApproving,
    error,
    successMessage,
    fetchAllowance,
    approve,
    revoke,
    clearError,
    clearSuccess,
    usdcAddress,
    mailerAddress,
  };
};
