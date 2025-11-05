/**
 * Tests for useMailerPermissions React hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMailerPermissions } from '../useMailerPermissions';
import { IndexerClient } from '@sudobility/indexer_client';
import { OnchainMailerClient } from '@sudobility/contracts';

// Mock IndexerClient
vi.mock('@sudobility/indexer_client', () => ({
  IndexerClient: vi.fn(),
}));

// Mock OnchainMailerClient
vi.mock('@sudobility/contracts', () => ({
  OnchainMailerClient: vi.fn(),
}));

describe('useMailerPermissions', () => {
  const mockEndpointUrl = 'https://indexer.example.com';
  const mockWalletAddress = '0x742d35Cc6e3c05652aA6E10f35F74c29C5881398';
  const mockChainId = 1;
  const mockPermissions = [
    '0x1234567890123456789012345678901234567890',
    '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
  ];

  let mockGetWalletPermissions: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create mock implementation
    mockGetWalletPermissions = vi.fn();

    // Mock IndexerClient constructor
    (IndexerClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      function (this: any) {
        this.getWalletPermissions = mockGetWalletPermissions;
      } as any
    );
  });

  describe('Initial State', () => {
    it('should start with empty permissions and no loading', () => {
      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
        })
      );

      expect(result.current.permissions).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should set error if walletAddress is not provided', () => {
      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: null,
          chainId: mockChainId,
        })
      );

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Fetching Permissions', () => {
    it('should fetch permissions successfully', async () => {
      mockGetWalletPermissions.mockResolvedValue({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
          permissions: mockPermissions,
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual(mockPermissions);
      expect(result.current.error).toBe(null);
      expect(mockGetWalletPermissions).toHaveBeenCalledWith(
        mockWalletAddress,
        mockChainId,
        false
      );
    });

    it('should handle API errors', async () => {
      const errorMessage = 'Failed to fetch permissions';
      mockGetWalletPermissions.mockResolvedValue({
        success: false,
        data: null,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle network errors', async () => {
      mockGetWalletPermissions.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe('Network error');
    });

    it('should handle missing wallet address', async () => {
      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: null,
          chainId: mockChainId,
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe('Wallet address is required');
      expect(mockGetWalletPermissions).not.toHaveBeenCalled();
    });
  });

  describe('Auto-fetch', () => {
    it('should auto-fetch when enabled and walletAddress is provided', async () => {
      mockGetWalletPermissions.mockResolvedValue({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
          permissions: mockPermissions,
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
          autoFetch: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual(mockPermissions);
      expect(mockGetWalletPermissions).toHaveBeenCalledTimes(1);
    });

    it('should not auto-fetch when disabled', async () => {
      mockGetWalletPermissions.mockResolvedValue({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
          permissions: mockPermissions,
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
          autoFetch: false,
        })
      );

      // Wait a bit to ensure auto-fetch doesn't trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.permissions).toEqual([]);
      expect(mockGetWalletPermissions).not.toHaveBeenCalled();
    });

    it('should not auto-fetch when walletAddress is null', async () => {
      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: null,
          chainId: mockChainId,
          autoFetch: true,
        })
      );

      // Wait a bit to ensure auto-fetch doesn't trigger
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(result.current.permissions).toEqual([]);
      expect(mockGetWalletPermissions).not.toHaveBeenCalled();
    });
  });

  describe('Refresh Function', () => {
    it('should refetch permissions when refresh is called', async () => {
      mockGetWalletPermissions.mockResolvedValue({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
          permissions: mockPermissions,
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
        })
      );

      // First call
      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual(mockPermissions);

      // Second call
      const newPermissions = ['0x9999999999999999999999999999999999999999'];
      mockGetWalletPermissions.mockResolvedValue({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
          permissions: newPermissions,
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual(newPermissions);
      expect(mockGetWalletPermissions).toHaveBeenCalledTimes(2);
    });
  });

  describe('Clear Error', () => {
    it('should clear error when clearError is called', async () => {
      mockGetWalletPermissions.mockRejectedValue(
        new Error('Test error')
      );

      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.error).toBe('Test error');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('TestNet Option', () => {
    it('should pass testNet parameter to API call', async () => {
      mockGetWalletPermissions.mockResolvedValue({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
          permissions: mockPermissions,
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
          testNet: true,
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetWalletPermissions).toHaveBeenCalledWith(
        mockWalletAddress,
        mockChainId,
        true
      );
    });
  });

  describe('Empty Permissions', () => {
    it('should handle empty permissions array', async () => {
      mockGetWalletPermissions.mockResolvedValue({
        success: true,
        data: {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
          permissions: [],
          timestamp: new Date().toISOString(),
        },
        error: null,
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useMailerPermissions(mockEndpointUrl, false, {
          walletAddress: mockWalletAddress,
          chainId: mockChainId,
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.permissions).toEqual([]);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Permission Management', () => {
    let mockSetPermission: ReturnType<typeof vi.fn>;
    let mockRemovePermission: ReturnType<typeof vi.fn>;
    const mockWallet = { address: mockWalletAddress };
    const mockConfig = { evm: { rpc: 'https://eth.example.com', chainId: 1 } };
    const mockContractAddress = '0x1111111111111111111111111111111111111111';
    const mockTransaction = { hash: '0xabc123' };

    beforeEach(() => {
      mockSetPermission = vi.fn();
      mockRemovePermission = vi.fn();

      // Mock OnchainMailerClient constructor
      (
        OnchainMailerClient as unknown as ReturnType<typeof vi.fn>
      ).mockImplementation(
        function (this: any) {
          this.setPermission = mockSetPermission;
          this.removePermission = mockRemovePermission;
        } as any
      );
    });

    describe('addPermission', () => {
      it('should add permission and refresh data', async () => {
        mockSetPermission.mockResolvedValue(mockTransaction);
        mockGetWalletPermissions.mockResolvedValue({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            permissions: [...mockPermissions, mockContractAddress],
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockEndpointUrl, false, {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            wallet: mockWallet as any,
            config: mockConfig as any,
          })
        );

        let transaction;
        await act(async () => {
          transaction = await result.current.addPermission(mockContractAddress);
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(mockSetPermission).toHaveBeenCalledWith(mockContractAddress);
        expect(mockGetWalletPermissions).toHaveBeenCalled();
        expect(transaction).toEqual(mockTransaction);
        expect(result.current.permissions).toContain(mockContractAddress);
        expect(result.current.error).toBe(null);
      });

      it('should throw error when mailerClient is not initialized', async () => {
        const { result } = renderHook(() =>
          useMailerPermissions(mockEndpointUrl, false, {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            // No wallet or config provided
          })
        );

        await expect(async () => {
          await act(async () => {
            await result.current.addPermission(mockContractAddress);
          });
        }).rejects.toThrow('Mailer client not initialized');
      });

      it('should throw error when contract address is empty', async () => {
        const { result } = renderHook(() =>
          useMailerPermissions(mockEndpointUrl, false, {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            wallet: mockWallet as any,
            config: mockConfig as any,
          })
        );

        await expect(async () => {
          await act(async () => {
            await result.current.addPermission('');
          });
        }).rejects.toThrow('Contract address is required');
      });

      it('should handle errors and set error state', async () => {
        const errorMessage = 'Failed to add permission';
        mockSetPermission.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() =>
          useMailerPermissions(mockEndpointUrl, false, {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            wallet: mockWallet as any,
            config: mockConfig as any,
          })
        );

        await act(async () => {
          try {
            await result.current.addPermission(mockContractAddress);
          } catch (err) {
            // Expected to throw, error state should be set
          }
        });

        // Give it a moment for state to update
        await waitFor(() => {
          expect(result.current.error).toBe(errorMessage);
          expect(result.current.isLoading).toBe(false);
        });
      });

      it('should set isLoading during operation', async () => {
        mockSetPermission.mockImplementation(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve(mockTransaction), 100)
            )
        );

        const { result } = renderHook(() =>
          useMailerPermissions(mockEndpointUrl, false, {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            wallet: mockWallet as any,
            config: mockConfig as any,
          })
        );

        act(() => {
          result.current.addPermission(mockContractAddress);
        });

        // Should be loading immediately
        await waitFor(() => {
          expect(result.current.isLoading).toBe(true);
        });

        // Wait for completion
        await waitFor(
          () => {
            expect(result.current.isLoading).toBe(false);
          },
          { timeout: 200 }
        );
      });
    });

    describe('removePermission', () => {
      it('should remove permission and refresh data', async () => {
        mockRemovePermission.mockResolvedValue(mockTransaction);
        mockGetWalletPermissions.mockResolvedValue({
          success: true,
          data: {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            permissions: mockPermissions.filter(
              p => p !== mockContractAddress
            ),
            timestamp: new Date().toISOString(),
          },
          error: null,
          timestamp: new Date().toISOString(),
        });

        const { result } = renderHook(() =>
          useMailerPermissions(mockEndpointUrl, false, {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            wallet: mockWallet as any,
            config: mockConfig as any,
          })
        );

        let transaction;
        await act(async () => {
          transaction =
            await result.current.removePermission(mockContractAddress);
        });

        await waitFor(() => {
          expect(result.current.isLoading).toBe(false);
        });

        expect(mockRemovePermission).toHaveBeenCalledWith(mockContractAddress);
        expect(mockGetWalletPermissions).toHaveBeenCalled();
        expect(transaction).toEqual(mockTransaction);
        expect(result.current.permissions).not.toContain(mockContractAddress);
        expect(result.current.error).toBe(null);
      });

      it('should throw error when mailerClient is not initialized', async () => {
        const { result } = renderHook(() =>
          useMailerPermissions(mockEndpointUrl, false, {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            // No wallet or config provided
          })
        );

        await expect(async () => {
          await act(async () => {
            await result.current.removePermission(mockContractAddress);
          });
        }).rejects.toThrow('Mailer client not initialized');
      });

      it('should throw error when contract address is empty', async () => {
        const { result } = renderHook(() =>
          useMailerPermissions(mockEndpointUrl, false, {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            wallet: mockWallet as any,
            config: mockConfig as any,
          })
        );

        await expect(async () => {
          await act(async () => {
            await result.current.removePermission('');
          });
        }).rejects.toThrow('Contract address is required');
      });

      it('should handle errors and set error state', async () => {
        const errorMessage = 'Failed to remove permission';
        mockRemovePermission.mockRejectedValue(new Error(errorMessage));

        const { result } = renderHook(() =>
          useMailerPermissions(mockEndpointUrl, false, {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            wallet: mockWallet as any,
            config: mockConfig as any,
          })
        );

        await act(async () => {
          try {
            await result.current.removePermission(mockContractAddress);
          } catch (err) {
            // Expected to throw, error state should be set
          }
        });

        // Give it a moment for state to update
        await waitFor(() => {
          expect(result.current.error).toBe(errorMessage);
          expect(result.current.isLoading).toBe(false);
        });
      });

      it('should set isLoading during operation', async () => {
        mockRemovePermission.mockImplementation(
          () =>
            new Promise(resolve =>
              setTimeout(() => resolve(mockTransaction), 100)
            )
        );

        const { result } = renderHook(() =>
          useMailerPermissions(mockEndpointUrl, false, {
            walletAddress: mockWalletAddress,
            chainId: mockChainId,
            wallet: mockWallet as any,
            config: mockConfig as any,
          })
        );

        act(() => {
          result.current.removePermission(mockContractAddress);
        });

        // Should be loading immediately
        await waitFor(() => {
          expect(result.current.isLoading).toBe(true);
        });

        // Wait for completion
        await waitFor(
          () => {
            expect(result.current.isLoading).toBe(false);
          },
          { timeout: 200 }
        );
      });
    });
  });
});
