/**
 * Tests for useMailerDelegations React hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMailerDelegations } from '../useMailerDelegations';
import { OnchainMailerClient } from '@sudobility/contracts';
import {
  useIndexerGetDelegatedFrom,
  useIndexerGetDelegatedTo,
} from '@sudobility/indexer_client';
import { Chain, ChainType } from '@sudobility/types';
import type { ChainInfo } from '@sudobility/configs';

// Mock dependencies
vi.mock('@sudobility/contracts', () => ({
  OnchainMailerClient: vi.fn(),
}));

vi.mock('@sudobility/indexer_client', () => ({
  useIndexerGetDelegatedTo: vi.fn(),
  useIndexerGetDelegatedFrom: vi.fn(),
}));

// Mock RpcHelpers
vi.mock('@sudobility/configs', () => ({
  RpcHelpers: {
    getChainInfo: vi.fn(),
  },
}));

describe('useMailerDelegations', () => {
  const mockEndpointUrl = 'https://indexer.example.com';
  const mockWalletAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const mockAuth = {
    message: 'Test message',
    signature: 'Test signature',
    signer: mockWalletAddress,
  };
  const mockConnectedWallet = {
    walletClient: { address: mockWalletAddress },
  };
  const mockChainInfo: ChainInfo = {
    chain: Chain.ETH_MAINNET,
    chainType: ChainType.EVM,
    chainId: 1,
    name: 'Ethereum Mainnet',
    alchemyNetwork: 'eth-mainnet',
    ankrNetwork: 'eth',
    metamaskNetwork: 'mainnet',
    explorerDomain: 'api.etherscan.io',
    explorerBrowserDomain: 'etherscan.io',
    isTestNet: false,
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    mailerAddress: '0x1234567890123456789012345678901234567890',
  };

  const mockDelegatedTo = {
    walletAddress: '0xTargetWallet',
    chainType: ChainType.EVM,
    chainId: 1,
    txHash: '0xhash1',
  };

  const mockDelegatedFrom = [
    {
      walletAddress: '0xDelegator1',
      chainType: ChainType.EVM,
      chainId: 1,
      txHash: '0xhash2',
    },
    {
      walletAddress: '0xDelegator2',
      chainType: ChainType.EVM,
      chainId: 1,
      txHash: '0xhash3',
    },
  ];

  let mockDelegateTo: ReturnType<typeof vi.fn>;
  let mockRejectDelegation: ReturnType<typeof vi.fn>;
  let mockRefetchTo: ReturnType<typeof vi.fn>;
  let mockRefetchFrom: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mock functions
    mockDelegateTo = vi.fn();
    mockRejectDelegation = vi.fn();
    mockRefetchTo = vi.fn();
    mockRefetchFrom = vi.fn();

    // Mock OnchainMailerClient constructor (stateless - no constructor parameters)
    (OnchainMailerClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      function (this: any) {
        this.delegateTo = mockDelegateTo;
        this.rejectDelegation = mockRejectDelegation;
      } as any
    );

    // Mock useIndexerGetDelegatedTo
    (useIndexerGetDelegatedTo as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        success: true,
        data: mockDelegatedTo,
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetchTo,
    });

    // Mock useIndexerGetDelegatedFrom
    (useIndexerGetDelegatedFrom as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        success: true,
        data: {
          from: mockDelegatedFrom,
        },
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetchFrom,
    });
  });

  beforeEach(async () => {
    // Get and configure the mocked RpcHelpers
    const { RpcHelpers } = await import('@sudobility/configs');
    const mockGetChainInfo = RpcHelpers.getChainInfo as ReturnType<typeof vi.fn>;
    mockGetChainInfo.mockReturnValue(mockChainInfo);
  });

  describe('Initial State', () => {
    it('should initialize with delegation data from indexer', () => {
      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      expect(result.current.delegatedToMe).toEqual(mockDelegatedTo);
      expect(result.current.delegatedFromMe).toEqual(mockDelegatedFrom);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle no delegations', () => {
      (useIndexerGetDelegatedTo as ReturnType<typeof vi.fn>).mockReturnValue({
        data: { success: true, data: null },
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetchTo,
      });

      (useIndexerGetDelegatedFrom as ReturnType<typeof vi.fn>).mockReturnValue({
        data: { success: true, data: { from: [] } },
        isLoading: false,
        isError: false,
        error: null,
        refetch: mockRefetchFrom,
      });

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      expect(result.current.delegatedToMe).toBe(null);
      expect(result.current.delegatedFromMe).toEqual([]);
    });

    it('should show loading state when queries are loading', () => {
      (useIndexerGetDelegatedTo as ReturnType<typeof vi.fn>).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
        refetch: mockRefetchTo,
      });

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Delegation Operations', () => {
    it('should delegate to a target address', async () => {
      const targetAddress = '0xNewDelegate';
      const mockResult = {
        success: true,
        transactionHash: '0xtxhash',
      };

      mockDelegateTo.mockResolvedValue(mockResult);
      mockRefetchTo.mockResolvedValue({});
      mockRefetchFrom.mockResolvedValue({});

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      let delegateResult;
      await act(async () => {
        delegateResult = await result.current.delegate(targetAddress);
      });

      expect(mockDelegateTo).toHaveBeenCalledWith(
        mockConnectedWallet,
        mockChainInfo,
        targetAddress
      );
      expect(delegateResult).toEqual(mockResult);
      expect(mockRefetchTo).toHaveBeenCalled();
      expect(mockRefetchFrom).toHaveBeenCalled();
    });

    it('should throw error if delegating without wallet', async () => {
      const { result } = renderHook(() =>
        useMailerDelegations(
          null,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await expect(async () => {
        await act(async () => {
          await result.current.delegate('0xTarget');
        });
      }).rejects.toThrow('Wallet and chain info are required for delegation operations');
    });

    it('should throw error if delegating with empty address', async () => {
      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await expect(async () => {
        await act(async () => {
          await result.current.delegate('');
        });
      }).rejects.toThrow('Target address is required');
    });

    it('should handle delegation errors', async () => {
      const errorMessage = 'Delegation failed';
      mockDelegateTo.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      let caughtError = false;
      await act(async () => {
        try {
          await result.current.delegate('0xTarget');
        } catch (err) {
          caughtError = true;
          expect(err).toBeInstanceOf(Error);
          expect((err as Error).message).toBe(errorMessage);
        }
      });

      expect(caughtError).toBe(true);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Revoke Operations', () => {
    it('should revoke delegation', async () => {
      const mockResult = {
        success: true,
        transactionHash: '0xrevoke',
      };

      mockDelegateTo.mockResolvedValue(mockResult);
      mockRefetchTo.mockResolvedValue({});
      mockRefetchFrom.mockResolvedValue({});

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      let revokeResult;
      await act(async () => {
        revokeResult = await result.current.revoke();
      });

      expect(mockDelegateTo).toHaveBeenCalledWith(
        mockConnectedWallet,
        mockChainInfo,
        '0x0000000000000000000000000000000000000000'
      );
      expect(revokeResult).toEqual(mockResult);
      expect(mockRefetchTo).toHaveBeenCalled();
      expect(mockRefetchFrom).toHaveBeenCalled();
    });

    it('should throw error if revoking without wallet', async () => {
      const { result } = renderHook(() =>
        useMailerDelegations(
          null,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await expect(async () => {
        await act(async () => {
          await result.current.revoke();
        });
      }).rejects.toThrow('Wallet and chain info are required for delegation operations');
    });
  });

  describe('Reject Operations', () => {
    it('should reject delegation from a delegator', async () => {
      const delegatorAddress = '0xDelegator1';
      const mockResult = {
        transactionHash: '0xreject',
        success: true,
      };

      mockRejectDelegation.mockResolvedValue(mockResult);
      mockRefetchTo.mockResolvedValue({});
      mockRefetchFrom.mockResolvedValue({});

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      let rejectResult;
      await act(async () => {
        rejectResult = await result.current.reject(delegatorAddress);
      });

      expect(mockRejectDelegation).toHaveBeenCalledWith(
        mockConnectedWallet,
        mockChainInfo,
        delegatorAddress
      );
      expect(rejectResult).toEqual(mockResult);
      expect(mockRefetchTo).toHaveBeenCalled();
      expect(mockRefetchFrom).toHaveBeenCalled();
    });

    it('should throw error if rejecting without wallet', async () => {
      const { result } = renderHook(() =>
        useMailerDelegations(
          null,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await expect(async () => {
        await act(async () => {
          await result.current.reject('0xDelegator');
        });
      }).rejects.toThrow('Wallet and chain info are required for delegation operations');
    });

    it('should throw error if rejecting with empty address', async () => {
      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await expect(async () => {
        await act(async () => {
          await result.current.reject('');
        });
      }).rejects.toThrow('Delegator address is required');
    });

    it('should handle rejection errors', async () => {
      const errorMessage = 'Rejection failed';
      mockRejectDelegation.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      let caughtError = false;
      await act(async () => {
        try {
          await result.current.reject('0xDelegator');
        } catch (err) {
          caughtError = true;
          expect(err).toBeInstanceOf(Error);
          expect((err as Error).message).toBe(errorMessage);
        }
      });

      expect(caughtError).toBe(true);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Refresh Function', () => {
    it('should refresh delegation data', async () => {
      mockRefetchTo.mockResolvedValue({});
      mockRefetchFrom.mockResolvedValue({});

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockRefetchTo).toHaveBeenCalled();
      expect(mockRefetchFrom).toHaveBeenCalled();
    });
  });

  describe('Clear Error', () => {
    it('should clear error state', async () => {
      mockDelegateTo.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      // Trigger an error
      await act(async () => {
        try {
          await result.current.delegate('0xTarget');
        } catch {
          // Expected error
        }
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('Query Errors', () => {
    it('should set error when delegatedTo query fails', async () => {
      const errorMessage = 'Failed to fetch delegated-to';
      (useIndexerGetDelegatedTo as ReturnType<typeof vi.fn>).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error(errorMessage),
        refetch: mockRefetchTo,
      });

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await waitFor(() => {
        expect(result.current.error).toContain('delegated-to');
      });
    });

    it('should set error when delegatedFrom query fails', async () => {
      const errorMessage = 'Failed to fetch delegated-from';
      (useIndexerGetDelegatedFrom as ReturnType<typeof vi.fn>).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: new Error(errorMessage),
        refetch: mockRefetchFrom,
      });

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await waitFor(() => {
        expect(result.current.error).toContain('delegated-from');
      });
    });
  });

  describe('Indexer Queries', () => {
    it('should call indexer hooks with correct parameters', () => {
      renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      expect(useIndexerGetDelegatedTo).toHaveBeenCalledWith(
        mockEndpointUrl,
        false,
        mockWalletAddress,
        mockAuth
      );

      expect(useIndexerGetDelegatedFrom).toHaveBeenCalledWith(
        mockEndpointUrl,
        false,
        mockWalletAddress,
        mockAuth
      );
    });

    it('should handle null wallet and auth', () => {
      renderHook(() =>
        useMailerDelegations(
          null,
          Chain.ETH_MAINNET,
          null,
          mockEndpointUrl,
          false
        )
      );

      expect(useIndexerGetDelegatedTo).toHaveBeenCalledWith(
        mockEndpointUrl,
        false,
        '',
        expect.objectContaining({ message: '', signature: '', signer: '' })
      );
    });
  });

  describe('Refresh Function', () => {
    it('should manually refresh delegation data', async () => {
      mockRefetchTo.mockResolvedValue({});
      mockRefetchFrom.mockResolvedValue({});

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await act(async () => {
        await result.current.refresh();
      });

      expect(mockRefetchTo).toHaveBeenCalled();
      expect(mockRefetchFrom).toHaveBeenCalled();
    });

    it('should clear error when refresh is called', async () => {
      mockRefetchTo.mockResolvedValue({});
      mockRefetchFrom.mockResolvedValue({});

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      // Set an error manually
      await act(async () => {
        try {
          await result.current.delegate('0xTarget');
        } catch (e) {
          // Expected to fail
        }
      });

      // Now refresh should clear the error
      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBe(null);
    });

    it('should call refresh after successful delegate operation', async () => {
      const targetAddress = '0xNewDelegate';
      const mockResult = {
        success: true,
        transactionHash: '0xtxhash',
      };

      mockDelegateTo.mockResolvedValue(mockResult);
      mockRefetchTo.mockResolvedValue({});
      mockRefetchFrom.mockResolvedValue({});

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await act(async () => {
        await result.current.delegate(targetAddress);
      });

      // Verify refresh was called (via refetch methods)
      expect(mockRefetchTo).toHaveBeenCalledTimes(1);
      expect(mockRefetchFrom).toHaveBeenCalledTimes(1);
    });

    it('should call refresh after successful revoke operation', async () => {
      const mockResult = {
        success: true,
        transactionHash: '0xrevoke',
      };

      mockDelegateTo.mockResolvedValue(mockResult);
      mockRefetchTo.mockResolvedValue({});
      mockRefetchFrom.mockResolvedValue({});

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await act(async () => {
        await result.current.revoke();
      });

      // Verify refresh was called (via refetch methods)
      expect(mockRefetchTo).toHaveBeenCalledTimes(1);
      expect(mockRefetchFrom).toHaveBeenCalledTimes(1);
    });

    it('should call refresh after successful reject operation', async () => {
      const delegatorAddress = '0xDelegator1';
      const mockResult = {
        transactionHash: '0xreject',
        success: true,
      };

      mockRejectDelegation.mockResolvedValue(mockResult);
      mockRefetchTo.mockResolvedValue({});
      mockRefetchFrom.mockResolvedValue({});

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      await act(async () => {
        await result.current.reject(delegatorAddress);
      });

      // Verify refresh was called (via refetch methods)
      expect(mockRefetchTo).toHaveBeenCalledTimes(1);
      expect(mockRefetchFrom).toHaveBeenCalledTimes(1);
    });

    it('should not call refresh after failed operations', async () => {
      mockDelegateTo.mockRejectedValue(new Error('Operation failed'));
      mockRefetchTo.mockResolvedValue({});
      mockRefetchFrom.mockResolvedValue({});

      const { result } = renderHook(() =>
        useMailerDelegations(
          mockConnectedWallet as any,
          Chain.ETH_MAINNET,
          mockAuth,
          mockEndpointUrl,
          false
        )
      );

      try {
        await act(async () => {
          await result.current.delegate('0xTarget');
        });
      } catch (e) {
        // Expected to fail
      }

      // Verify refresh was NOT called after failure
      expect(mockRefetchTo).not.toHaveBeenCalled();
      expect(mockRefetchFrom).not.toHaveBeenCalled();
    });
  });
});
