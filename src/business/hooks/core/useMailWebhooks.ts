/**
 * React hook for managing mail webhooks
 * Integrates with useWalletStatus and useIndexerMailWebhooks
 * Caches webhooks using Zustand store
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useIndexerMailWebhooks } from '@sudobility/indexer_client';
import type { IndexerWebhookData, Optional } from '@sudobility/types';
import { useWalletStatus } from './useWalletStatus';
import { useMailWebhooksStore } from '../../stores/mailWebhooksStore';

/**
 * Mail webhook type alias for cleaner code
 */
export type Webhook = IndexerWebhookData;

/**
 * Request type for creating a new mail webhook
 */
export interface WebhookCreateRequest {
  webhookUrl: string;
}

/**
 * Configuration for useMailWebhooks hook
 */
export interface UseMailWebhooksConfig {
  /** Indexer endpoint URL */
  endpointUrl: string;
  /** Whether to use dev mode */
  dev?: boolean;
  /** Whether to automatically fetch webhooks when wallet is verified */
  autoFetch?: boolean;
}

/**
 * Return type for useMailWebhooks hook
 */
export interface UseMailWebhooksReturn {
  /** Array of mail webhooks for the current wallet */
  webhooks: Webhook[];
  /** Total number of webhooks */
  total: number;
  /** Whether there are more webhooks available */
  hasMore: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: Optional<string>;
  /** Whether the data is from cache */
  isCached: boolean;
  /** Timestamp when data was cached */
  cachedAt: Optional<number>;
  /** Fetch webhooks for the current wallet */
  fetchWebhooks: () => Promise<void>;
  /** Create a new webhook */
  createWebhook: (webhookData: WebhookCreateRequest) => Promise<void>;
  /** Delete a webhook */
  deleteWebhook: (webhookId: string) => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /** Refresh webhooks (bypass cache) */
  refreshWebhooks: () => Promise<void>;
}

/**
 * Hook for managing mail webhooks
 *
 * This hook automatically observes wallet status and fetches mail webhooks
 * when a wallet is verified. Webhooks are cached using Zustand store.
 *
 * @param config - Configuration for the hook
 * @returns UseMailWebhooksReturn with webhooks and management functions
 *
 * @example
 * ```typescript
 * const {
 *   webhooks,
 *   isLoading,
 *   createWebhook,
 *   deleteWebhook
 * } = useMailWebhooks({
 *   endpointUrl: 'https://api.example.com',
 *   autoFetch: true
 * });
 *
 * // Create a new webhook
 * await createWebhook({
 *   webhookUrl: 'https://example.com/webhook'
 * });
 *
 * // Delete a webhook
 * await deleteWebhook('webhook-id');
 * ```
 */
export const useMailWebhooks = (
  config: UseMailWebhooksConfig
): UseMailWebhooksReturn => {
  const { endpointUrl, dev = false, autoFetch = true } = config;

  // Get wallet status
  const { walletAddress, indexerAuth, isVerified } = useWalletStatus();

  // Get indexer hook
  const indexerHook = useIndexerMailWebhooks(endpointUrl, dev);

  // Get Zustand store methods
  const {
    setWebhooks: setCachedWebhooks,
    clearWebhooks: clearCachedWebhooks,
  } = useMailWebhooksStore();

  // Subscribe directly to cached data for this wallet address
  // This ensures component re-renders when cache updates
  const cachedData = useMailWebhooksStore((state) =>
    walletAddress ? state.cache[walletAddress.toLowerCase()] : undefined
  );

  const cachedWebhooks = useMemo(
    () => cachedData?.webhooks || [],
    [cachedData]
  );

  /**
   * Fetch webhooks from indexer
   */
  const fetchWebhooks = useCallback(async () => {
    if (!walletAddress || !indexerAuth) {
      return;
    }

    try {
      const response = await indexerHook.getWebhooks(
        walletAddress,
        indexerAuth
      );

      if (response.success && response.data) {
        setCachedWebhooks(
          walletAddress,
          response.data.webhooks,
          response.data.total,
          response.data.hasMore
        );
      }
    } catch (err) {
      console.error('Failed to fetch mail webhooks:', err);
      // Error is handled by indexerHook
    }
  }, [walletAddress, indexerAuth, indexerHook, setCachedWebhooks]);

  /**
   * Refresh webhooks (bypass cache)
   */
  const refreshWebhooks = useCallback(async () => {
    if (walletAddress) {
      clearCachedWebhooks(walletAddress);
    }
    await fetchWebhooks();
  }, [walletAddress, clearCachedWebhooks, fetchWebhooks]);

  /**
   * Create a new webhook
   */
  const createWebhook = useCallback(
    async (webhookData: WebhookCreateRequest) => {
      if (!walletAddress || !indexerAuth) {
        throw new Error('Wallet not verified');
      }

      await indexerHook.createWebhook(walletAddress, indexerAuth, webhookData);

      // Refresh webhooks after creation
      await refreshWebhooks();
    },
    [walletAddress, indexerAuth, indexerHook, refreshWebhooks]
  );

  /**
   * Delete a webhook
   */
  const deleteWebhook = useCallback(
    async (webhookId: string) => {
      if (!walletAddress || !indexerAuth) {
        throw new Error('Wallet not verified');
      }

      await indexerHook.deleteWebhook(walletAddress, webhookId, indexerAuth);

      // Refresh webhooks after deletion
      await refreshWebhooks();
    },
    [walletAddress, indexerAuth, indexerHook, refreshWebhooks]
  );

  /**
   * Auto-fetch webhooks when wallet is verified
   */
  useEffect(() => {
    if (autoFetch && isVerified && walletAddress && indexerAuth) {
      // Only fetch if not cached
      if (!cachedData) {
        fetchWebhooks();
      }
    }
  }, [
    autoFetch,
    isVerified,
    walletAddress,
    indexerAuth,
    cachedData,
    fetchWebhooks,
  ]);

  // Determine if we're showing cached data
  const isCached = !!cachedData && !indexerHook.isLoading;

  return useMemo(
    () => ({
      webhooks: cachedWebhooks,
      total: cachedData?.total || 0,
      hasMore: cachedData?.hasMore || false,
      isLoading: indexerHook.isLoading,
      error: indexerHook.error,
      isCached,
      cachedAt: cachedData?.cachedAt,
      fetchWebhooks,
      createWebhook,
      deleteWebhook,
      clearError: indexerHook.clearError,
      refreshWebhooks,
    }),
    [
      cachedWebhooks,
      cachedData,
      indexerHook.isLoading,
      indexerHook.error,
      indexerHook.clearError,
      isCached,
      fetchWebhooks,
      createWebhook,
      deleteWebhook,
      refreshWebhooks,
    ]
  );
};
