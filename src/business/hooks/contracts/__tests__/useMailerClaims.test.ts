/**
 * Tests for useMailerClaims React hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMailerClaims } from '../useMailerClaims';
import { OnchainMailerClient } from '@sudobility/contracts';
import { ChainType } from '@sudobility/types';

// Mock OnchainMailerClient
vi.mock('@sudobility/contracts', () => ({
  OnchainMailerClient: vi.fn(),
}));

describe('useMailerClaims', () => {
  const mockWallet = { walletClient: { address: '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398' } };
  const mockAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const mockChainInfos = [
    {
      chainType: ChainType.EVM,
      chainId: 1,
      name: 'Ethereum Mainnet',
      isDev: false,
      usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      mailerAddress: '0x123...',
    },
    {
      chainType: ChainType.SOLANA,
      chainId: -1,
      name: 'Solana Mainnet',
      isDev: false,
      usdcAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      mailerAddress: '9FLk...',
    },
  ];

  let mockGetRecipientClaimable: ReturnType<typeof vi.fn>;
  let mockClaimRevenue: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockGetRecipientClaimable = vi.fn();
    mockClaimRevenue = vi.fn();

    // Mock OnchainMailerClient constructor (stateless - no parameters)
    (OnchainMailerClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      function (this: any) {
        this.getRecipientClaimable = mockGetRecipientClaimable;
        this.claimRevenue = mockClaimRevenue;
      } as any
    );
  });

  describe('Initial State', () => {
    it('should start with empty rewards and no loading', () => {
      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
        })
      );

      expect(result.current.rewards).toEqual([]);
      expect(result.current.totalClaimable).toBe(BigInt(0));
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isClaiming).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Refresh Function', () => {
    it('should be an alias to fetchRewards', () => {
      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
        })
      );

      // Both should be the same function reference
      expect(result.current.refresh).toBe(result.current.fetchRewards);
    });
  });

  describe('Fetching Rewards', () => {
    it('should fetch claimable rewards from all chains', async () => {
      mockGetRecipientClaimable
        .mockResolvedValueOnce({ amount: BigInt(1000000), expiresAt: BigInt(0), isExpired: false }) // EVM chain
        .mockResolvedValueOnce({ amount: BigInt(2000000), expiresAt: BigInt(0), isExpired: false }); // Solana chain

      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
        })
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rewards).toHaveLength(2);
      expect(result.current.rewards[0].chainType).toBe(ChainType.EVM);
      expect(result.current.rewards[0].claimableAmount).toBe(BigInt(1000000));
      expect(result.current.rewards[1].chainType).toBe(ChainType.SOLANA);
      expect(result.current.rewards[1].claimableAmount).toBe(BigInt(2000000));
      expect(result.current.totalClaimable).toBe(BigInt(3000000));
      expect(mockGetRecipientClaimable).toHaveBeenCalledTimes(2);
    });

    it('should handle errors from individual chains gracefully', async () => {
      mockGetRecipientClaimable
        .mockRejectedValueOnce(new Error('EVM fetch failed'))
        .mockResolvedValueOnce({ amount: BigInt(2000000), expiresAt: BigInt(0), isExpired: false });

      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
        })
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should have results for both chains, with zero for failed chain
      expect(result.current.rewards).toHaveLength(2);
      expect(result.current.rewards[0].claimableAmount).toBe(BigInt(0));
      expect(result.current.rewards[1].claimableAmount).toBe(BigInt(2000000));
      expect(result.current.error).toBe(null);
    });

    it('should set error when wallet is not provided', async () => {
      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: null as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
        })
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      expect(result.current.error).toBe(
        'Wallet or chain configurations not provided'
      );
    });

    it('should set error when chain configs are empty', async () => {
      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: [],
          address: mockAddress,
        })
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      expect(result.current.error).toBe(
        'Wallet or chain configurations not provided'
      );
    });
  });

  describe('Claiming Rewards', () => {
    const mockTransaction = { hash: '0xabc123', chainType: ChainType.EVM };

    beforeEach(() => {
      // Setup some claimable rewards
      mockGetRecipientClaimable
        .mockResolvedValueOnce({ amount: BigInt(1000000), expiresAt: BigInt(0), isExpired: false })
        .mockResolvedValueOnce({ amount: BigInt(2000000), expiresAt: BigInt(0), isExpired: false });
    });

    it('should claim rewards and automatically refresh', async () => {
      mockClaimRevenue.mockResolvedValue(mockTransaction);

      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
        })
      );

      // First fetch rewards
      await act(async () => {
        await result.current.fetchRewards();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Reset mock to track refresh call
      mockGetRecipientClaimable.mockClear();
      mockGetRecipientClaimable
        .mockResolvedValueOnce({ amount: BigInt(0), expiresAt: BigInt(0), isExpired: false }) // After claiming, balance is 0
        .mockResolvedValueOnce({ amount: BigInt(2000000), expiresAt: BigInt(0), isExpired: false });

      // Now claim rewards for EVM chain
      let claimResult;
      await act(async () => {
        claimResult = await result.current.claimRewards(ChainType.EVM);
      });

      await waitFor(() => {
        expect(result.current.isClaiming).toBe(false);
      });

      // Verify claim was successful
      expect(mockClaimRevenue).toHaveBeenCalledTimes(1);
      expect(claimResult.success).toBe(true);
      expect(claimResult.transactionHash).toBe(mockTransaction.hash);
      expect(claimResult.chainType).toBe(ChainType.EVM);

      // Verify refresh was called (getRecipientClaimable should be called again)
      expect(mockGetRecipientClaimable).toHaveBeenCalledTimes(2);

      // Verify rewards were updated
      expect(result.current.rewards[0].claimableAmount).toBe(BigInt(0));
    });

    it('should throw error when trying to claim with no wallet', async () => {
      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: null as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
        })
      );

      await expect(async () => {
        await act(async () => {
          await result.current.claimRewards(ChainType.EVM);
        });
      }).rejects.toThrow('Wallet not provided');
    });

    it('should throw error when chain config not found', async () => {
      // Use a config that only has Solana, not EVM
      const solanaOnlyConfig = [
        {
          chainType: ChainType.SOLANA,
          chainId: -1,
          name: 'Solana Mainnet',
          isDev: false,
          usdcAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        },
      ];

      mockGetRecipientClaimable.mockResolvedValueOnce({ amount: BigInt(1000000), expiresAt: BigInt(0), isExpired: false });

      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: solanaOnlyConfig as any,
          address: mockAddress,
        })
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(async () => {
        await act(async () => {
          // Try to claim from EVM chain that doesn't exist in config
          await result.current.claimRewards(ChainType.EVM);
        });
      }).rejects.toThrow('No configuration found for chain type');
    });

    it('should throw error when no claimable rewards found', async () => {
      // Reset ALL mocks completely and set up zero amounts
      mockGetRecipientClaimable.mockReset();
      mockClaimRevenue.mockReset();

      mockGetRecipientClaimable
        .mockResolvedValueOnce({ amount: BigInt(0), expiresAt: BigInt(0), isExpired: false })
        .mockResolvedValueOnce({ amount: BigInt(0), expiresAt: BigInt(0), isExpired: false });

      // Mock claimRevenue to throw if somehow called (it shouldn't be)
      mockClaimRevenue.mockRejectedValue(
        new Error('claimRevenue should not be called for zero rewards')
      );

      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
        })
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify rewards were set to zero
      expect(result.current.rewards).toHaveLength(2);
      expect(result.current.rewards[0].claimableAmount).toBe(BigInt(0));
      expect(result.current.rewards[1].claimableAmount).toBe(BigInt(0));

      await expect(async () => {
        await act(async () => {
          await result.current.claimRewards(ChainType.EVM);
        });
      }).rejects.toThrow('No claimable rewards found');
    });

    it('should set error state when claim fails', async () => {
      // Reset mocks and set up fresh values (beforeEach already set up non-zero values)
      // Just use what beforeEach set up since we need non-zero values anyway
      mockClaimRevenue.mockReset();

      mockClaimRevenue.mockRejectedValue(
        new Error('Transaction failed')
      );

      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
        })
      );

      // First fetch rewards
      await act(async () => {
        await result.current.fetchRewards();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Try to claim - wrap try/catch inside act()
      await act(async () => {
        try {
          await result.current.claimRewards(ChainType.EVM);
        } catch (err) {
          // Expected to throw, error state should be set
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Transaction failed');
        expect(result.current.isClaiming).toBe(false);
      });
    });
  });

  describe('Auto-fetch', () => {
    it('should auto-fetch when enabled', async () => {
      mockGetRecipientClaimable
        .mockResolvedValueOnce({ amount: BigInt(1000000), expiresAt: BigInt(0), isExpired: false })
        .mockResolvedValueOnce({ amount: BigInt(2000000), expiresAt: BigInt(0), isExpired: false });

      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
          autoFetch: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rewards).toHaveLength(2);
      expect(mockGetRecipientClaimable).toHaveBeenCalledTimes(2);
    });

    it('should not auto-fetch when disabled', async () => {
      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
          autoFetch: false,
        })
      );

      // Wait a bit to ensure auto-fetch doesn't trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.rewards).toEqual([]);
      expect(mockGetRecipientClaimable).not.toHaveBeenCalled();
    });
  });

  describe('Clear Error', () => {
    it('should clear error when clearError is called', async () => {
      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: null as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
        })
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      expect(result.current.error).toBe(
        'Wallet or chain configurations not provided'
      );

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Total Claimable', () => {
    it('should calculate total claimable across all chains', async () => {
      mockGetRecipientClaimable
        .mockResolvedValueOnce({ amount: BigInt(1500000), expiresAt: BigInt(0), isExpired: false })
        .mockResolvedValueOnce({ amount: BigInt(2500000), expiresAt: BigInt(0), isExpired: false });

      const { result } = renderHook(() =>
        useMailerClaims({
          connectedWallet: mockWallet as any,
          chainInfos: mockChainInfos as any,
          address: mockAddress,
        })
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalClaimable).toBe(BigInt(4000000));
    });
  });
});
