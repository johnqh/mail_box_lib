/**
 * React hook for managing mail templates
 * Integrates with useWalletStatus and useIndexerMailTemplates
 * Caches templates using Zustand store
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useIndexerMailTemplates } from '@sudobility/indexer_client';
import type { IndexerTemplateData, Optional } from '@sudobility/types';
import { useWalletStatus } from './useWalletStatus';
import { useMailTemplatesStore } from '../../stores/mailTemplatesStore';

/**
 * Mail template type alias for cleaner code
 */
export type MailTemplate = IndexerTemplateData;

/**
 * Request type for creating a new mail template
 */
export interface MailTemplateCreateRequest {
  templateName: string;
  subject: string;
  bodyContent: string;
}

/**
 * Request type for updating an existing mail template
 */
export interface MailTemplateUpdateRequest {
  templateName?: string;
  subject?: string;
  bodyContent?: string;
}

/**
 * Configuration for useMailTemplates hook
 */
export interface UseMailTemplatesConfig {
  /** Indexer endpoint URL */
  endpointUrl: string;
  /** Whether to use dev mode */
  dev?: boolean;
  /** Whether to automatically fetch templates when wallet is verified */
  autoFetch?: boolean;
}

/**
 * Return type for useMailTemplates hook
 */
export interface UseMailTemplatesReturn {
  /** Array of mail templates for the current wallet */
  templates: MailTemplate[];
  /** Total number of templates */
  total: number;
  /** Whether there are more templates available */
  hasMore: boolean;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: Optional<string>;
  /** Whether the data is from cache */
  isCached: boolean;
  /** Timestamp when data was cached */
  cachedAt: Optional<number>;
  /** Fetch templates for the current wallet */
  fetchTemplates: () => Promise<void>;
  /** Create a new template */
  createTemplate: (templateData: MailTemplateCreateRequest) => Promise<void>;
  /** Update an existing template */
  updateTemplate: (
    templateId: string,
    updates: MailTemplateUpdateRequest
  ) => Promise<void>;
  /** Delete a template */
  deleteTemplate: (templateId: string) => Promise<void>;
  /** Clear error state */
  clearError: () => void;
  /** Refresh templates (bypass cache) */
  refreshTemplates: () => Promise<void>;
}

/**
 * Hook for managing mail templates
 *
 * This hook automatically observes wallet status and fetches mail templates
 * when a wallet is verified. Templates are cached using Zustand store.
 *
 * @param config - Configuration for the hook
 * @returns UseMailTemplatesReturn with templates and management functions
 *
 * @example
 * ```typescript
 * const {
 *   templates,
 *   isLoading,
 *   createTemplate,
 *   updateTemplate,
 *   deleteTemplate
 * } = useMailTemplates({
 *   endpointUrl: 'https://api.example.com',
 *   autoFetch: true
 * });
 *
 * // Create a new template
 * await createTemplate({
 *   templateName: 'Welcome Email',
 *   bodyContent: 'Welcome to our service!'
 * });
 *
 * // Update a template
 * await updateTemplate('template-id', {
 *   bodyContent: 'Updated content'
 * });
 * ```
 */
export const useMailTemplates = (
  config: UseMailTemplatesConfig
): UseMailTemplatesReturn => {
  const { endpointUrl, dev = false, autoFetch = true } = config;

  // Get wallet status
  const { walletAddress, indexerAuth, isVerified } = useWalletStatus();

  // Get indexer hook
  const indexerHook = useIndexerMailTemplates(endpointUrl, dev);

  // Get Zustand store methods
  const {
    getTemplates: getCachedTemplates,
    getCacheEntry,
    setTemplates: setCachedTemplates,
    clearTemplates: clearCachedTemplates,
  } = useMailTemplatesStore();

  // Get cached data
  const cachedData = walletAddress ? getCacheEntry(walletAddress) : undefined;

  const cachedTemplates = useMemo(
    () => (walletAddress ? getCachedTemplates(walletAddress) || [] : []),
    [walletAddress, getCachedTemplates]
  );

  /**
   * Fetch templates from indexer
   */
  const fetchTemplates = useCallback(async () => {
    if (!walletAddress || !indexerAuth) {
      return;
    }

    try {
      const response = await indexerHook.getTemplates(
        walletAddress,
        indexerAuth
      );

      if (response.success && response.data) {
        setCachedTemplates(
          walletAddress,
          response.data.templates,
          response.data.total,
          response.data.hasMore
        );
      }
    } catch (err) {
      console.error('Failed to fetch mail templates:', err);
      // Error is handled by indexerHook
    }
  }, [walletAddress, indexerAuth, indexerHook, setCachedTemplates]);

  /**
   * Refresh templates (bypass cache)
   */
  const refreshTemplates = useCallback(async () => {
    if (walletAddress) {
      clearCachedTemplates(walletAddress);
    }
    await fetchTemplates();
  }, [walletAddress, clearCachedTemplates, fetchTemplates]);

  /**
   * Create a new template
   */
  const createTemplate = useCallback(
    async (templateData: MailTemplateCreateRequest) => {
      if (!walletAddress || !indexerAuth) {
        throw new Error('Wallet not verified');
      }

      await indexerHook.createTemplate(
        walletAddress,
        indexerAuth,
        templateData
      );

      // Refresh templates after creation
      await refreshTemplates();
    },
    [walletAddress, indexerAuth, indexerHook, refreshTemplates]
  );

  /**
   * Update an existing template
   */
  const updateTemplate = useCallback(
    async (templateId: string, updates: MailTemplateUpdateRequest) => {
      if (!walletAddress || !indexerAuth) {
        throw new Error('Wallet not verified');
      }

      await indexerHook.updateTemplate(
        walletAddress,
        templateId,
        indexerAuth,
        updates
      );

      // Refresh templates after update
      await refreshTemplates();
    },
    [walletAddress, indexerAuth, indexerHook, refreshTemplates]
  );

  /**
   * Delete a template
   */
  const deleteTemplate = useCallback(
    async (templateId: string) => {
      if (!walletAddress || !indexerAuth) {
        throw new Error('Wallet not verified');
      }

      await indexerHook.deleteTemplate(walletAddress, templateId, indexerAuth);

      // Refresh templates after deletion
      await refreshTemplates();
    },
    [walletAddress, indexerAuth, indexerHook, refreshTemplates]
  );

  /**
   * Auto-fetch templates when wallet is verified
   */
  useEffect(() => {
    if (autoFetch && isVerified && walletAddress && indexerAuth) {
      // Only fetch if not cached
      if (!cachedData) {
        fetchTemplates();
      }
    }
  }, [
    autoFetch,
    isVerified,
    walletAddress,
    indexerAuth,
    cachedData,
    fetchTemplates,
  ]);

  // Determine if we're showing cached data
  const isCached = !!cachedData && !indexerHook.isLoading;

  return useMemo(
    () => ({
      templates: cachedTemplates,
      total: cachedData?.total || 0,
      hasMore: cachedData?.hasMore || false,
      isLoading: indexerHook.isLoading,
      error: indexerHook.error,
      isCached,
      cachedAt: cachedData?.cachedAt,
      fetchTemplates,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      clearError: indexerHook.clearError,
      refreshTemplates,
    }),
    [
      cachedTemplates,
      cachedData,
      indexerHook.isLoading,
      indexerHook.error,
      indexerHook.clearError,
      isCached,
      fetchTemplates,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      refreshTemplates,
    ]
  );
};
