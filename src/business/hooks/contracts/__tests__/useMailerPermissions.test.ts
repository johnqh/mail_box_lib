/**
 * Tests for useMailerPermissions React hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMailerPermissions } from '../useMailerPermissions';
import { useIndexerGetWalletPermissions } from '@sudobility/indexer_client';
import { OnchainMailerClient } from '@sudobility/contracts';
import { Chain, ChainType, NetworkClient } from '@sudobility/types';

// Mock NetworkClient
const mockNetworkClient: NetworkClient = {
  request: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

// Mock indexer client hooks
vi.mock('@sudobility/indexer_client', () => ({
  useIndexerGetWalletPermissions: vi.fn(),
}));

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

describe('useMailerPermissions', () => {
  const mockEndpointUrl = 'https://indexer.example.com';
  const mockWalletAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const mockWallet = { walletClient: { address: mockWalletAddress } };
  const mockPermissions = [
    '0x1234567890123456789012345678901234567890',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  ];

  const mockChainInfo = {
    chainType: ChainType.EVM,
    chainId: 1,
    name: 'Ethereum Mainnet',
    isTestNet: false,
    usdcAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    mailerAddress: '0x123...',
  };

  let mockRefetch: ReturnType<typeof vi.fn>;
  let mockSetPermission: ReturnType<typeof vi.fn>;
  let mockRemovePermission: ReturnType<typeof vi.fn>;
  let mockGetChainInfo: ReturnType<typeof vi.fn>;

  // Helper function to setup mock permissions query response
  const mockGetWalletPermissions = (response: any, options?: { isError?: boolean; error?: Error }) => {
    (useIndexerGetWalletPermissions as ReturnType<typeof vi.fn>).mockReturnValue({
      data: options?.isError ? undefined : response,
      isLoading: false,
      isError: options?.isError || false,
      error: options?.error || null,
      refetch: mockRefetch,
    });
  };

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mock implementations
    mockRefetch = vi.fn();
    mockSetPermission = vi.fn();
    mockRemovePermission = vi.fn();

    // Get the mocked RpcHelpers
    const { RpcHelpers } = await import('@sudobility/configs');
    mockGetChainInfo = RpcHelpers.getChainInfo as ReturnType<typeof vi.fn>;
    mockGetChainInfo.mockReturnValue(mockChainInfo);

    // Default mock for useIndexerGetWalletPermissions hook - returns empty permissions
    (useIndexerGetWalletPermissions as ReturnType<typeof vi.fn>).mockReturnValue({
      data: {
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: 1,
          permissions: [],
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      },
      isLoading: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });

    // Mock OnchainMailerClient constructor
    (OnchainMailerClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      function (this: any) {
        this.setPermission = mockSetPermission;
        this.removePermission = mockRemovePermission;
      } as any
    );
  });

  describe('Initial State', () => {
    it('should start with empty permissions and no loading', async () => {
      mockGetWalletPermissions({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: 1,
          permissions: [],
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe(null);
    });

    it('should not fetch when walletAddress is not provided', async () => {
      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, null, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait a bit for any side effects
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe(null);
      // Hook is called but with enabled: false
      expect(useIndexerGetWalletPermissions).toHaveBeenCalledWith(
        mockNetworkClient,
        mockEndpointUrl,
        false,
        '',
        1,
        false,
        { enabled: false }
      );
    });
  });

  describe('Fetching Permissions', () => {
    it('should fetch permissions successfully', async () => {
      mockGetWalletPermissions({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: 1,
          permissions: mockPermissions,
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual(mockPermissions);
      expect(result.current.error).toBe(null);
      expect(useIndexerGetWalletPermissions).toHaveBeenCalledWith(
        mockNetworkClient,
        mockEndpointUrl,
        false,
        mockWalletAddress,
        1,
        false,
        { enabled: true }
      );
    });

    it('should handle API errors', async () => {
      mockGetWalletPermissions({
        success: false,
        data: null,
        error: 'API Error',
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe('API Error');
    });

    it('should handle network errors', async () => {
      mockGetWalletPermissions(undefined, { isError: true, error: new Error('Network error') });

      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe('Network error');
    });

    it('should not fetch when wallet address is missing', async () => {
      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, null, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait a bit for side effects
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe(null);
      // Hook is called but with enabled: false
      expect(useIndexerGetWalletPermissions).toHaveBeenCalledWith(
        mockNetworkClient,
        mockEndpointUrl,
        false,
        '',
        1,
        false,
        { enabled: false }
      );
    });

    it('should auto-fetch when enabled and walletAddress is provided', async () => {
      mockGetWalletPermissions({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: 1,
          permissions: mockPermissions,
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(useIndexerGetWalletPermissions).toHaveBeenCalled();
      expect(result.current.permissions).toEqual(mockPermissions);
    });

    it('should not auto-fetch when disabled', async () => {
      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait a bit but not long enough to auto-fetch
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.permissions).toEqual([]);
    });

    it('should not auto-fetch when walletAddress is null', async () => {
      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, null, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait a bit to ensure auto-fetch doesn't trigger
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(result.current.permissions).toEqual([]);
      // Hook is called but with enabled: false
      expect(useIndexerGetWalletPermissions).toHaveBeenCalledWith(
        mockNetworkClient,
        mockEndpointUrl,
        false,
        '',
        1,
        false,
        { enabled: false }
      );
    });

    it('should refetch permissions when refresh is called', async () => {
      mockGetWalletPermissions({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: 1,
          permissions: mockPermissions,
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Clear previous calls to refetch
      mockRefetch.mockClear();

      // Call refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(mockRefetch).toHaveBeenCalledTimes(1);
    });

    it.skip('should clear error when clearError is called', async () => {
      mockSetPermission.mockRejectedValue(new Error('Operation failed'));

      mockGetWalletPermissions({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: 1,
          permissions: [],
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Trigger an operation error
      await expect(async () => {
        await act(async () => {
          await result.current.addPermission('0xContractAddress');
        });
      }).rejects.toThrow('Operation failed');

      // Wait for error to be set
      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      // Clear the error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });

    it('should pass testNet parameter to API call', async () => {
      const testNetChainInfo = { ...mockChainInfo, isTestNet: true };
      mockGetChainInfo.mockReturnValue(testNetChainInfo);

      mockGetWalletPermissions({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: 11155111,
          permissions: [],
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_SEPOLIA, mockEndpointUrl, true)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(useIndexerGetWalletPermissions).toHaveBeenCalledWith(
        mockNetworkClient,
        mockEndpointUrl,
        true,
        mockWalletAddress,
        testNetChainInfo.chainId,
        true,
        { enabled: true }
      );
    });

    it('should handle empty permissions array', async () => {
      mockGetWalletPermissions({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: 1,
          permissions: [],
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
      );

      // Wait for auto-fetch to complete
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Permission Operations', () => {
    describe('addPermission', () => {
      it('should add permission and refresh data', async () => {
        const mockTransaction = { hash: '0xabc123' };
        mockSetPermission.mockResolvedValue(mockTransaction);

        // Initial fetch
        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: [],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
        );

        // Wait for auto-fetch to complete
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Set up mock for refresh after adding permission
        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: ['0x1234567890123456789012345678901234567890'],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        await act(async () => {
          await result.current.addPermission('0x1234567890123456789012345678901234567890');
        });

        expect(mockSetPermission).toHaveBeenCalledWith(
          mockWallet,
          mockChainInfo,
          '0x1234567890123456789012345678901234567890'
        );
      });

      it('should return undefined and set error when mailerClient is not initialized', async () => {
        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: [],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockNetworkClient, null, Chain.ETH_MAINNET, mockEndpointUrl, false)
        );

        let addResult;
        await act(async () => {
          addResult = await result.current.addPermission('0x1234567890123456789012345678901234567890');
        });

        expect(addResult).toBeUndefined();
        expect(result.current.error).toBe('Wallet and chain info are required for permission operations');
      });

      it('should return undefined and set error when contract address is empty', async () => {
        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: [],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
        );

        // Wait for auto-fetch
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        let addResult;
        await act(async () => {
          addResult = await result.current.addPermission('');
        });

        expect(addResult).toBeUndefined();
        expect(result.current.error).toBe('Contract address is required');
      });

      it('should handle errors and set error state', async () => {
        mockSetPermission.mockRejectedValue(new Error('Transaction failed'));

        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: [],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
        );

        // Wait for auto-fetch
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
          try {
            await result.current.addPermission('0x1234567890123456789012345678901234567890');
          } catch (err) {
            // Expected to throw
          }
        });

        expect(result.current.error).toBe('Transaction failed');
      });

      it('should set isLoading during operation', async () => {
        const mockTransaction = { hash: '0xabc123' };
        mockSetPermission.mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(mockTransaction), 100))
        );

        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: [],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
        );

        // Wait for auto-fetch
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        let isLoadingDuringOp = false;
        act(() => {
          result.current.addPermission('0x1234567890123456789012345678901234567890');
        });

        // Check if isLoading is true during the operation
        await waitFor(() => {
          if (result.current.isLoading) {
            isLoadingDuringOp = true;
          }
          return result.current.isLoading === false;
        });

        expect(isLoadingDuringOp).toBe(true);
      });
    });

    describe('removePermission', () => {
      it('should remove permission and refresh data', async () => {
        const mockTransaction = { hash: '0xdef456' };
        mockRemovePermission.mockResolvedValue(mockTransaction);

        // Initial fetch
        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: ['0x1234567890123456789012345678901234567890'],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
        );

        // Wait for auto-fetch
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        // Set up mock for refresh after removing permission
        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: [],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        await act(async () => {
          await result.current.removePermission('0x1234567890123456789012345678901234567890');
        });

        expect(mockRemovePermission).toHaveBeenCalledWith(
          mockWallet,
          mockChainInfo,
          '0x1234567890123456789012345678901234567890'
        );
      });

      it('should return undefined and set error when mailerClient is not initialized', async () => {
        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: [],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockNetworkClient, null, Chain.ETH_MAINNET, mockEndpointUrl, false)
        );

        let removeResult;
        await act(async () => {
          removeResult = await result.current.removePermission('0x1234567890123456789012345678901234567890');
        });

        expect(removeResult).toBeUndefined();
        expect(result.current.error).toBe('Wallet and chain info are required for permission operations');
      });

      it('should return undefined and set error when contract address is empty', async () => {
        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: [],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
        );

        // Wait for auto-fetch
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        let removeResult;
        await act(async () => {
          removeResult = await result.current.removePermission('');
        });

        expect(removeResult).toBeUndefined();
        expect(result.current.error).toBe('Contract address is required');
      });

      it('should handle errors and set error state', async () => {
        mockRemovePermission.mockRejectedValue(new Error('Transaction failed'));

        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: [],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
        );

        // Wait for auto-fetch
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        await act(async () => {
          try {
            await result.current.removePermission('0x1234567890123456789012345678901234567890');
          } catch (err) {
            // Expected to throw
          }
        });

        expect(result.current.error).toBe('Transaction failed');
      });

      it('should set isLoading during operation', async () => {
        const mockTransaction = { hash: '0xdef456' };
        mockRemovePermission.mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve(mockTransaction), 100))
        );

        mockGetWalletPermissions({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: 1,
            permissions: [],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockNetworkClient, mockWallet as any, Chain.ETH_MAINNET, mockEndpointUrl, false)
        );

        // Wait for auto-fetch
        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        let isLoadingDuringOp = false;
        act(() => {
          result.current.removePermission('0x1234567890123456789012345678901234567890');
        });

        // Check if isLoading is true during the operation
        await waitFor(() => {
          if (result.current.isLoading) {
            isLoadingDuringOp = true;
          }
          return result.current.isLoading === false;
        });

        expect(isLoadingDuringOp).toBe(true);
      });
    });
  });
});
