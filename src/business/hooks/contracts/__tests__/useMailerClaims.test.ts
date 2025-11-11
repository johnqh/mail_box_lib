/**
 * Tests for useMailerClaims React hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMailerClaims } from '../useMailerClaims';
import { OnchainMailerClient } from '@sudobility/contracts';
import { Chain, ChainType } from '@sudobility/types';

// Mock OnchainMailerClient
vi.mock('@sudobility/contracts', () => ({
  OnchainMailerClient: vi.fn(),
}));

// Mock RpcHelpers
vi.mock('@sudobility/configs', () => ({
  RpcHelpers: {
    getChainInfo: vi.fn(),
  },
}));

describe('useMailerClaims', () => {
  const mockWallet = { walletClient: { address: '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398' } };
  const mockAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const mockChainInfo = {
    chainType: ChainType.EVM,
    chainId: 1,
    name: 'Ethereum Mainnet',
    isTestNet: false,
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    mailerAddress: '0x123...',
  };

  let mockGetRecipientClaimable: ReturnType<typeof vi.fn>;
  let mockClaimRevenue: ReturnType<typeof vi.fn>;
  let mockGetChainInfo: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockGetRecipientClaimable = vi.fn();
    mockClaimRevenue = vi.fn();

    // Get the mocked RpcHelpers
    const { RpcHelpers } = await import('@sudobility/configs');
    mockGetChainInfo = RpcHelpers.getChainInfo as ReturnType<
      typeof vi.fn
    >;
    mockGetChainInfo.mockReturnValue(mockChainInfo);

    // Mock OnchainMailerClient constructor (stateless - no parameters)
    (OnchainMailerClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      function (this: any) {
        this.getRecipientClaimable = mockGetRecipientClaimable;
        this.claimRevenue = mockClaimRevenue;
      } as any
    );
  });

  describe('Initial State', () => {
    it('should start with empty rewards and no loading', async () => {
      // Mock getRecipientClaimable to return null (no rewards)
      mockGetRecipientClaimable.mockResolvedValueOnce(null);

      const { result } = renderHook(() =>
        useMailerClaims(mockWallet as any, Chain.ETH_MAINNET)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rewards).toEqual([]);
      expect(result.current.totalClaimable).toBe(BigInt(0));
      expect(result.current.isClaiming).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Refresh Function', () => {
    it('should be an alias to fetchRewards', async () => {
      mockGetRecipientClaimable.mockResolvedValueOnce(null);

      const { result } = renderHook(() =>
        useMailerClaims(mockWallet as any, Chain.ETH_MAINNET)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Both should be the same function reference
      expect(result.current.refresh).toBe(result.current.fetchRewards);
    });
  });

  describe('Fetching Rewards', () => {
    it('should fetch claimable rewards from the chain', async () => {
      // Auto-fetch on mount
      mockGetRecipientClaimable.mockResolvedValueOnce({
        amount: BigInt(1000000),
        expiresAt: BigInt(0),
        isExpired: false,
      });

      const { result } = renderHook(() =>
        useMailerClaims(mockWallet as any, Chain.ETH_MAINNET)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rewards).toHaveLength(1);
      expect(result.current.rewards[0].chainType).toBe(ChainType.EVM);
      expect(result.current.rewards[0].claimableAmount).toBe(BigInt(1000000));
      expect(result.current.totalClaimable).toBe(BigInt(1000000));
      expect(mockGetRecipientClaimable).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when fetching rewards', async () => {
      mockGetRecipientClaimable.mockRejectedValueOnce(
        new Error('Fetch failed')
      );

      const { result } = renderHook(() =>
        useMailerClaims(mockWallet as any, Chain.ETH_MAINNET)
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Fetch failed');
      expect(result.current.rewards).toEqual([]);
    });

    it('should set error when wallet is not provided', async () => {
      const { result } = renderHook(() =>
        useMailerClaims(null as any, Chain.ETH_MAINNET)
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      expect(result.current.error).toBe(
        'Wallet or chain configuration not provided'
      );
    });

    it('should set error when chain info is not available', async () => {
      // Mock null chain info
      mockGetChainInfo.mockReturnValue(null);

      const { result } = renderHook(() =>
        useMailerClaims(mockWallet as any, Chain.ETH_MAINNET)
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      expect(result.current.error).toBe(
        'Wallet or chain configuration not provided'
      );
    });
  });

  describe('Claiming Rewards', () => {
    const mockTransaction = { hash: '0xabc123', chainType: ChainType.EVM };

    it('should claim rewards and automatically refresh', async () => {
      mockClaimRevenue.mockResolvedValue(mockTransaction);

      // Auto-fetch on mount will consume first mock
      mockGetRecipientClaimable.mockResolvedValueOnce({
        amount: BigInt(1000000),
        expiresAt: BigInt(0),
        isExpired: false,
      });

      const { result } = renderHook(() =>
        useMailerClaims(mockWallet as any, Chain.ETH_MAINNET)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Set up mock for refresh after claim
      mockGetRecipientClaimable.mockResolvedValueOnce({
        amount: BigInt(0),
        expiresAt: BigInt(0),
        isExpired: false,
      }); // After claiming, balance is 0

      // Now claim rewards
      let claimResult;
      await act(async () => {
        claimResult = await result.current.claimRewards();
      });

      await waitFor(() => {
        expect(result.current.isClaiming).toBe(false);
      });

      // Verify claim was successful
      expect(mockClaimRevenue).toHaveBeenCalledTimes(1);
      expect(claimResult.success).toBe(true);
      expect(claimResult.transactionHash).toBe(mockTransaction.hash);
      expect(claimResult.chainType).toBe(ChainType.EVM);

      // Verify rewards were updated
      expect(result.current.rewards[0].claimableAmount).toBe(BigInt(0));
    });

    it('should return undefined and set error when trying to claim with no wallet', async () => {
      const { result } = renderHook(() =>
        useMailerClaims(null as any, Chain.ETH_MAINNET)
      );

      let claimResult;
      await act(async () => {
        claimResult = await result.current.claimRewards();
      });

      expect(claimResult).toBeUndefined();
      expect(result.current.error).toBe('Wallet not provided');
    });

    it('should return undefined and set error when chain info not available', async () => {
      // Mock null chain info
      mockGetChainInfo.mockReturnValue(null);

      const { result } = renderHook(() =>
        useMailerClaims(mockWallet as any, Chain.ETH_MAINNET)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      let claimResult;
      await act(async () => {
        claimResult = await result.current.claimRewards();
      });

      expect(claimResult).toBeUndefined();
      expect(result.current.error).toBe('Chain configuration not available');
    });

    it('should return undefined and set error when no claimable rewards found', async () => {
      // Auto-fetch on mount with zero amount
      mockGetRecipientClaimable.mockResolvedValueOnce({
        amount: BigInt(0),
        expiresAt: BigInt(0),
        isExpired: false,
      });

      // Mock claimRevenue to throw if somehow called (it shouldn't be)
      mockClaimRevenue.mockRejectedValue(
        new Error('claimRevenue should not be called for zero rewards')
      );

      const { result } = renderHook(() =>
        useMailerClaims(mockWallet as any, Chain.ETH_MAINNET)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Verify rewards were set to zero
      expect(result.current.rewards).toHaveLength(1);
      expect(result.current.rewards[0].claimableAmount).toBe(BigInt(0));

      let claimResult;
      await act(async () => {
        claimResult = await result.current.claimRewards();
      });

      expect(claimResult).toBeUndefined();
      expect(result.current.error).toBe('No claimable rewards found');
    });

    it('should set error state when claim fails', async () => {
      mockClaimRevenue.mockRejectedValue(new Error('Transaction failed'));

      // Auto-fetch on mount with non-zero amount
      mockGetRecipientClaimable.mockResolvedValueOnce({
        amount: BigInt(1000000),
        expiresAt: BigInt(0),
        isExpired: false,
      });

      const { result } = renderHook(() =>
        useMailerClaims(mockWallet as any, Chain.ETH_MAINNET)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Try to claim - wrap try/catch inside act()
      await act(async () => {
        try {
          await result.current.claimRewards();
        } catch (err) {
          // Expected to throw, error state should be set
        }
      });

      expect(result.current.error).toBe('Transaction failed');
      expect(result.current.isClaiming).toBe(false);
    });
  });

  describe('Auto-fetch', () => {
    it('should always auto-fetch on mount', async () => {
      mockGetRecipientClaimable.mockResolvedValueOnce({
        amount: BigInt(1000000),
        expiresAt: BigInt(0),
        isExpired: false,
      });

      const { result } = renderHook(() =>
        useMailerClaims(mockWallet as any, Chain.ETH_MAINNET)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.rewards).toHaveLength(1);
      expect(mockGetRecipientClaimable).toHaveBeenCalledTimes(1);
    });

    it('should not auto-fetch when wallet is not connected', async () => {
      const { result } = renderHook(() =>
        useMailerClaims(null as any, Chain.ETH_MAINNET)
      );

      // Wait a bit to ensure auto-fetch doesn't trigger
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.rewards).toEqual([]);
      expect(mockGetRecipientClaimable).not.toHaveBeenCalled();
    });
  });

  describe('Clear Error', () => {
    it('should clear error when clearError is called', async () => {
      const { result } = renderHook(() =>
        useMailerClaims(null as any, Chain.ETH_MAINNET)
      );

      await act(async () => {
        await result.current.fetchRewards();
      });

      expect(result.current.error).toBe(
        'Wallet or chain configuration not provided'
      );

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Total Claimable', () => {
    it('should return total claimable for the chain', async () => {
      // Auto-fetch on mount
      mockGetRecipientClaimable.mockResolvedValueOnce({
        amount: BigInt(1500000),
        expiresAt: BigInt(0),
        isExpired: false,
      });

      const { result } = renderHook(() =>
        useMailerClaims(mockWallet as any, Chain.ETH_MAINNET)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.totalClaimable).toBe(BigInt(1500000));
    });
  });
});
