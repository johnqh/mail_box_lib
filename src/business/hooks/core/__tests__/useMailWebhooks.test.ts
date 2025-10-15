/**
 * Tests for useMailWebhooks hook
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMailWebhooks } from '../useMailWebhooks';
import type { IndexerWebhookData } from '@sudobility/types';

// Mock dependencies
vi.mock('@sudobility/indexer_client', () => ({
  useIndexerMailWebhooks: vi.fn(),
}));

vi.mock('../useWalletStatus', () => ({
  useWalletStatus: vi.fn(),
}));

vi.mock('../../../stores/mailWebhooksStore', () => ({
  useMailWebhooksStore: vi.fn(),
}));

import { useIndexerMailWebhooks } from '@sudobility/indexer_client';
import { useWalletStatus } from '../useWalletStatus';
import { useMailWebhooksStore } from '../../../stores/mailWebhooksStore';

describe('useMailWebhooks', () => {
  const mockWebhook1: IndexerWebhookData = {
    id: 'webhook-1',
    userId: 'user-1',
    webhookUrl: 'https://example.com/webhook1',
    isActive: true,
    lastTriggeredAt: '2024-01-01T00:00:00Z',
    triggerCount: 5,
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockWebhook2: IndexerWebhookData = {
    id: 'webhook-2',
    userId: 'user-1',
    webhookUrl: 'https://example.com/webhook2',
    isActive: false,
    lastTriggeredAt: null,
    triggerCount: 0,
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7';
  const mockIndexerAuth = {
    token: 'mock-token',
    signature: 'mock-signature',
    message: 'mock-message',
  };

  const mockConfig = {
    endpointUrl: 'https://api.example.com',
    dev: false,
    autoFetch: false, // Disable autoFetch by default for most tests
  };

  // Mock store functions
  const mockGetWebhooks = vi.fn();
  const mockGetCacheEntry = vi.fn();
  const mockSetWebhooks = vi.fn();
  const mockClearWebhooks = vi.fn();

  // Mock indexer hook functions
  const mockGetWebhooksApi = vi.fn();
  const mockCreateWebhook = vi.fn();
  const mockDeleteWebhook = vi.fn();
  const mockClearError = vi.fn();

  // Mock store cache state
  let mockStoreCache: Record<string, any> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    mockStoreCache = {}; // Reset cache

    // Setup default mocks
    (useWalletStatus as any).mockReturnValue({
      walletAddress: null,
      indexerAuth: null,
      isVerified: false,
    });

    (useIndexerMailWebhooks as any).mockReturnValue({
      webhooks: null,
      webhook: null,
      isLoading: false,
      error: null,
      getWebhooks: mockGetWebhooksApi,
      createWebhook: mockCreateWebhook,
      deleteWebhook: mockDeleteWebhook,
      clearError: mockClearError,
    });

    // Mock Zustand store to support both selector and direct calls
    (useMailWebhooksStore as any).mockImplementation((selector?: any) => {
      // If called with a selector function, execute it with the mock state
      if (typeof selector === 'function') {
        return selector({ cache: mockStoreCache });
      }
      // If called without selector, return the full state with actions
      return {
        cache: mockStoreCache,
        getWebhooks: mockGetWebhooks,
        getCacheEntry: mockGetCacheEntry,
        setWebhooks: mockSetWebhooks,
        clearWebhooks: mockClearWebhooks,
      };
    });

    mockGetWebhooks.mockReturnValue([]);
    mockGetCacheEntry.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with empty state when wallet not connected', () => {
      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      expect(result.current.webhooks).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.isCached).toBe(false);
      expect(result.current.cachedAt).toBeUndefined();
    });

    it('should return cached webhooks if available', () => {
      const mockCacheEntry = {
        webhooks: [mockWebhook1, mockWebhook2],
        total: 2,
        hasMore: false,
        cachedAt: Date.now(),
      };

      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      // Set up the cache in mockStoreCache
      mockStoreCache[walletAddress.toLowerCase()] = mockCacheEntry;

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      expect(result.current.webhooks).toEqual([mockWebhook1, mockWebhook2]);
      expect(result.current.total).toBe(2);
      expect(result.current.hasMore).toBe(false);
      expect(result.current.isCached).toBe(true);
      expect(result.current.cachedAt).toBe(mockCacheEntry.cachedAt);
    });
  });

  describe('autoFetch', () => {
    it('should auto-fetch webhooks when wallet is verified and autoFetch is true', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      mockGetWebhooksApi.mockResolvedValue({
        success: true,
        data: {
          webhooks: [mockWebhook1],
          total: 1,
          hasMore: false,
          verified: true,
        },
        timestamp: new Date().toISOString(),
      });

      renderHook(() =>
        useMailWebhooks({
          ...mockConfig,
          autoFetch: true,
        })
      );

      await waitFor(() => {
        expect(mockGetWebhooksApi).toHaveBeenCalledWith(
          walletAddress,
          mockIndexerAuth
        );
      });

      expect(mockSetWebhooks).toHaveBeenCalledWith(
        walletAddress,
        [mockWebhook1],
        1,
        false
      );
    });

    it('should not auto-fetch if wallet is not verified', () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: null,
        isVerified: false,
      });

      renderHook(() =>
        useMailWebhooks({
          ...mockConfig,
          autoFetch: true,
        })
      );

      expect(mockGetWebhooksApi).not.toHaveBeenCalled();
    });

    it('should not auto-fetch if data is already cached', () => {
      const mockCacheEntry = {
        webhooks: [mockWebhook1],
        total: 1,
        hasMore: false,
        cachedAt: Date.now(),
      };

      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      // Set up the cache in mockStoreCache
      mockStoreCache[walletAddress.toLowerCase()] = mockCacheEntry;

      renderHook(() =>
        useMailWebhooks({
          ...mockConfig,
          autoFetch: true,
        })
      );

      expect(mockGetWebhooksApi).not.toHaveBeenCalled();
    });

    it('should not auto-fetch when autoFetch is false', () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      renderHook(() =>
        useMailWebhooks({
          ...mockConfig,
          autoFetch: false,
        })
      );

      expect(mockGetWebhooksApi).not.toHaveBeenCalled();
    });
  });

  describe('fetchWebhooks', () => {
    it('should fetch webhooks successfully', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      mockGetWebhooksApi.mockResolvedValue({
        success: true,
        data: {
          webhooks: [mockWebhook1, mockWebhook2],
          total: 2,
          hasMore: false,
          verified: true,
        },
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await act(async () => {
        await result.current.fetchWebhooks();
      });

      expect(mockSetWebhooks).toHaveBeenCalledWith(
        walletAddress,
        [mockWebhook1, mockWebhook2],
        2,
        false
      );
    });

    it('should not fetch if wallet address is missing', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress: null,
        indexerAuth: mockIndexerAuth,
        isVerified: false,
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await act(async () => {
        await result.current.fetchWebhooks();
      });

      expect(mockGetWebhooksApi).not.toHaveBeenCalled();
    });

    it('should not fetch if indexer auth is missing', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: null,
        isVerified: false,
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await act(async () => {
        await result.current.fetchWebhooks();
      });

      expect(mockGetWebhooksApi).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockGetWebhooksApi.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await act(async () => {
        await result.current.fetchWebhooks();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to fetch mail webhooks:',
        expect.any(Error)
      );
      expect(mockSetWebhooks).not.toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should not cache if response is not successful', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      mockGetWebhooksApi.mockResolvedValue({
        success: false,
        error: 'Failed to fetch',
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await act(async () => {
        await result.current.fetchWebhooks();
      });

      expect(mockSetWebhooks).not.toHaveBeenCalled();
    });
  });

  describe('createWebhook', () => {
    it('should create a webhook successfully', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      mockCreateWebhook.mockResolvedValue({
        success: true,
        data: {
          webhook: mockWebhook1,
          verified: true,
        },
        timestamp: new Date().toISOString(),
      });

      mockGetWebhooksApi.mockResolvedValue({
        success: true,
        data: {
          webhooks: [mockWebhook1],
          total: 1,
          hasMore: false,
          verified: true,
        },
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await act(async () => {
        await result.current.createWebhook({
          webhookUrl: 'https://example.com/webhook1',
        });
      });

      expect(mockCreateWebhook).toHaveBeenCalledWith(
        walletAddress,
        mockIndexerAuth,
        { webhookUrl: 'https://example.com/webhook1' }
      );

      // Should refresh webhooks after creation
      expect(mockClearWebhooks).toHaveBeenCalledWith(walletAddress);
      expect(mockGetWebhooksApi).toHaveBeenCalled();
    });

    it('should throw error if wallet not verified', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress: null,
        indexerAuth: null,
        isVerified: false,
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await expect(
        result.current.createWebhook({
          webhookUrl: 'https://example.com/webhook',
        })
      ).rejects.toThrow('Wallet not verified');

      expect(mockCreateWebhook).not.toHaveBeenCalled();
    });

    it('should handle creation errors', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      mockCreateWebhook.mockRejectedValue(new Error('Creation failed'));

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await expect(
        result.current.createWebhook({
          webhookUrl: 'https://example.com/webhook',
        })
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook successfully', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      mockDeleteWebhook.mockResolvedValue({
        success: true,
        data: {
          message: 'Webhook deleted',
          verified: true,
        },
        timestamp: new Date().toISOString(),
      });

      mockGetWebhooksApi.mockResolvedValue({
        success: true,
        data: {
          webhooks: [],
          total: 0,
          hasMore: false,
          verified: true,
        },
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await act(async () => {
        await result.current.deleteWebhook('webhook-1');
      });

      expect(mockDeleteWebhook).toHaveBeenCalledWith(
        walletAddress,
        'webhook-1',
        mockIndexerAuth
      );

      // Should refresh webhooks after deletion
      expect(mockClearWebhooks).toHaveBeenCalledWith(walletAddress);
      expect(mockGetWebhooksApi).toHaveBeenCalled();
    });

    it('should throw error if wallet not verified', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress: null,
        indexerAuth: null,
        isVerified: false,
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await expect(result.current.deleteWebhook('webhook-1')).rejects.toThrow(
        'Wallet not verified'
      );

      expect(mockDeleteWebhook).not.toHaveBeenCalled();
    });

    it('should handle deletion errors', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      mockDeleteWebhook.mockRejectedValue(new Error('Deletion failed'));

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await expect(result.current.deleteWebhook('webhook-1')).rejects.toThrow(
        'Deletion failed'
      );
    });
  });

  describe('refreshWebhooks', () => {
    it('should clear cache and refetch', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      mockGetWebhooksApi.mockResolvedValue({
        success: true,
        data: {
          webhooks: [mockWebhook1],
          total: 1,
          hasMore: false,
          verified: true,
        },
        timestamp: new Date().toISOString(),
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await act(async () => {
        await result.current.refreshWebhooks();
      });

      expect(mockClearWebhooks).toHaveBeenCalledWith(walletAddress);
      expect(mockGetWebhooksApi).toHaveBeenCalled();
    });

    it('should not clear cache if wallet address is missing', async () => {
      (useWalletStatus as any).mockReturnValue({
        walletAddress: null,
        indexerAuth: mockIndexerAuth,
        isVerified: false,
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      await act(async () => {
        await result.current.refreshWebhooks();
      });

      expect(mockClearWebhooks).not.toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should call indexer hook clearError', () => {
      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      act(() => {
        result.current.clearError();
      });

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('loading and error states', () => {
    it('should reflect loading state from indexer hook', () => {
      (useIndexerMailWebhooks as any).mockReturnValue({
        webhooks: null,
        webhook: null,
        isLoading: true,
        error: null,
        getWebhooks: mockGetWebhooksApi,
        createWebhook: mockCreateWebhook,
        deleteWebhook: mockDeleteWebhook,
        clearError: mockClearError,
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      expect(result.current.isLoading).toBe(true);
    });

    it('should reflect error state from indexer hook', () => {
      (useIndexerMailWebhooks as any).mockReturnValue({
        webhooks: null,
        webhook: null,
        isLoading: false,
        error: 'Failed to fetch',
        getWebhooks: mockGetWebhooksApi,
        createWebhook: mockCreateWebhook,
        deleteWebhook: mockDeleteWebhook,
        clearError: mockClearError,
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      expect(result.current.error).toBe('Failed to fetch');
    });
  });

  describe('wallet address changes', () => {
    it('should fetch webhooks when wallet address changes', async () => {
      const { rerender } = renderHook(() =>
        useMailWebhooks({ ...mockConfig, autoFetch: true })
      );

      // Initially no wallet
      expect(mockGetWebhooksApi).not.toHaveBeenCalled();

      // Wallet becomes verified
      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      mockGetWebhooksApi.mockResolvedValue({
        success: true,
        data: {
          webhooks: [mockWebhook1],
          total: 1,
          hasMore: false,
          verified: true,
        },
        timestamp: new Date().toISOString(),
      });

      rerender();

      await waitFor(() => {
        expect(mockGetWebhooksApi).toHaveBeenCalledWith(
          walletAddress,
          mockIndexerAuth
        );
      });
    });
  });

  describe('isCached flag', () => {
    it('should be true when data is cached and not loading', () => {
      const mockCacheEntry = {
        webhooks: [mockWebhook1],
        total: 1,
        hasMore: false,
        cachedAt: Date.now(),
      };

      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      // Set up the cache in mockStoreCache
      mockStoreCache[walletAddress.toLowerCase()] = mockCacheEntry;

      (useIndexerMailWebhooks as any).mockReturnValue({
        webhooks: null,
        webhook: null,
        isLoading: false,
        error: null,
        getWebhooks: mockGetWebhooksApi,
        createWebhook: mockCreateWebhook,
        deleteWebhook: mockDeleteWebhook,
        clearError: mockClearError,
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      expect(result.current.isCached).toBe(true);
    });

    it('should be false when loading', () => {
      const mockCacheEntry = {
        webhooks: [mockWebhook1],
        total: 1,
        hasMore: false,
        cachedAt: Date.now(),
      };

      (useWalletStatus as any).mockReturnValue({
        walletAddress,
        indexerAuth: mockIndexerAuth,
        isVerified: true,
      });

      // Set up the cache in mockStoreCache
      mockStoreCache[walletAddress.toLowerCase()] = mockCacheEntry;

      (useIndexerMailWebhooks as any).mockReturnValue({
        webhooks: null,
        webhook: null,
        isLoading: true,
        error: null,
        getWebhooks: mockGetWebhooksApi,
        createWebhook: mockCreateWebhook,
        deleteWebhook: mockDeleteWebhook,
        clearError: mockClearError,
      });

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      expect(result.current.isCached).toBe(false);
    });

    it('should be false when no cache exists', () => {
      // mockStoreCache is empty by default, no need to set anything

      const { result } = renderHook(() => useMailWebhooks(mockConfig));

      expect(result.current.isCached).toBe(false);
    });
  });
});
