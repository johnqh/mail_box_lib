/**
 * Tests for mailWebhooksStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useMailWebhooksStore } from '../mailWebhooksStore';
import type { IndexerWebhookData } from '@sudobility/types';

describe('mailWebhooksStore', () => {
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
  const walletAddress2 = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    // Clear the store before each test
    useMailWebhooksStore.getState().clearAll();
  });

  describe('initialization', () => {
    it('should have empty cache on initialization', () => {
      const { cache } = useMailWebhooksStore.getState();
      expect(cache).toEqual({});
    });
  });

  describe('setWebhooks', () => {
    it('should store webhooks for a wallet address', () => {
      const { setWebhooks, getWebhooks } = useMailWebhooksStore.getState();
      const webhooks = [mockWebhook1, mockWebhook2];

      setWebhooks(walletAddress, webhooks, 2, false);

      const storedWebhooks = getWebhooks(walletAddress);
      expect(storedWebhooks).toEqual(webhooks);
    });

    it('should store webhooks with lowercase address', () => {
      const { setWebhooks, getWebhooks } = useMailWebhooksStore.getState();
      const mixedCaseAddress = '0x742D35CC6634C0532925A3B844BC9E7595F0BEB7';
      const webhooks = [mockWebhook1];

      setWebhooks(mixedCaseAddress, webhooks, 1, false);

      // Should be retrievable with original case
      expect(getWebhooks(mixedCaseAddress)).toEqual(webhooks);
      // Should be retrievable with lowercase
      expect(getWebhooks(mixedCaseAddress.toLowerCase())).toEqual(webhooks);
    });

    it('should store total and hasMore flags', () => {
      const { setWebhooks, getCacheEntry } = useMailWebhooksStore.getState();

      setWebhooks(walletAddress, [mockWebhook1], 10, true);

      const entry = getCacheEntry(walletAddress);
      expect(entry?.total).toBe(10);
      expect(entry?.hasMore).toBe(true);
    });

    it('should store timestamp when webhooks are cached', () => {
      const { setWebhooks, getCacheEntry } = useMailWebhooksStore.getState();
      const before = Date.now();

      setWebhooks(walletAddress, [mockWebhook1], 1, false);

      const after = Date.now();
      const entry = getCacheEntry(walletAddress);
      expect(entry?.cachedAt).toBeGreaterThanOrEqual(before);
      expect(entry?.cachedAt).toBeLessThanOrEqual(after);
    });

    it('should update existing webhooks for a wallet', () => {
      const { setWebhooks, getWebhooks } = useMailWebhooksStore.getState();

      // Set initial webhooks
      setWebhooks(walletAddress, [mockWebhook1], 1, false);
      expect(getWebhooks(walletAddress)).toEqual([mockWebhook1]);

      // Update with new webhooks
      const newWebhooks = [mockWebhook1, mockWebhook2];
      setWebhooks(walletAddress, newWebhooks, 2, false);
      expect(getWebhooks(walletAddress)).toEqual(newWebhooks);
    });

    it('should handle multiple wallet addresses independently', () => {
      const { setWebhooks, getWebhooks } = useMailWebhooksStore.getState();

      setWebhooks(walletAddress, [mockWebhook1], 1, false);
      setWebhooks(walletAddress2, [mockWebhook2], 1, false);

      expect(getWebhooks(walletAddress)).toEqual([mockWebhook1]);
      expect(getWebhooks(walletAddress2)).toEqual([mockWebhook2]);
    });
  });

  describe('getWebhooks', () => {
    it('should return undefined for non-existent wallet', () => {
      const { getWebhooks } = useMailWebhooksStore.getState();
      expect(getWebhooks('0xNonExistent')).toBeUndefined();
    });

    it('should return webhooks for existing wallet', () => {
      const { setWebhooks, getWebhooks } = useMailWebhooksStore.getState();
      const webhooks = [mockWebhook1, mockWebhook2];

      setWebhooks(walletAddress, webhooks, 2, false);
      expect(getWebhooks(walletAddress)).toEqual(webhooks);
    });
  });

  describe('getCacheEntry', () => {
    it('should return undefined for non-existent wallet', () => {
      const { getCacheEntry } = useMailWebhooksStore.getState();
      expect(getCacheEntry('0xNonExistent')).toBeUndefined();
    });

    it('should return complete cache entry for existing wallet', () => {
      const { setWebhooks, getCacheEntry } = useMailWebhooksStore.getState();
      const webhooks = [mockWebhook1];

      setWebhooks(walletAddress, webhooks, 10, true);

      const entry = getCacheEntry(walletAddress);
      expect(entry).toBeDefined();
      expect(entry?.webhooks).toEqual(webhooks);
      expect(entry?.total).toBe(10);
      expect(entry?.hasMore).toBe(true);
      expect(entry?.cachedAt).toBeGreaterThan(0);
    });
  });

  describe('clearWebhooks', () => {
    it('should clear webhooks for a specific wallet', () => {
      const { setWebhooks, getWebhooks, clearWebhooks } =
        useMailWebhooksStore.getState();

      // Set webhooks for two wallets
      setWebhooks(walletAddress, [mockWebhook1], 1, false);
      setWebhooks(walletAddress2, [mockWebhook2], 1, false);

      // Clear webhooks for first wallet
      clearWebhooks(walletAddress);

      expect(getWebhooks(walletAddress)).toBeUndefined();
      expect(getWebhooks(walletAddress2)).toEqual([mockWebhook2]);
    });

    it('should handle clearing non-existent wallet gracefully', () => {
      const { clearWebhooks, cache } = useMailWebhooksStore.getState();

      expect(() => clearWebhooks('0xNonExistent')).not.toThrow();
      expect(cache).toEqual({});
    });
  });

  describe('clearAll', () => {
    it('should clear all cached webhooks', () => {
      const { setWebhooks, getWebhooks, clearAll } =
        useMailWebhooksStore.getState();

      // Set webhooks for multiple wallets
      setWebhooks(walletAddress, [mockWebhook1], 1, false);
      setWebhooks(walletAddress2, [mockWebhook2], 1, false);

      // Clear all
      clearAll();

      expect(getWebhooks(walletAddress)).toBeUndefined();
      expect(getWebhooks(walletAddress2)).toBeUndefined();
    });

    it('should result in empty cache object', () => {
      const { setWebhooks, clearAll } = useMailWebhooksStore.getState();

      setWebhooks(walletAddress, [mockWebhook1], 1, false);

      // Get the cache after setting webhooks
      const beforeCache = useMailWebhooksStore.getState().cache;
      expect(Object.keys(beforeCache)).toHaveLength(1);

      clearAll();

      const { cache: afterCache } = useMailWebhooksStore.getState();
      expect(afterCache).toEqual({});
    });
  });

  describe('edge cases', () => {
    it('should handle empty webhook array', () => {
      const { setWebhooks, getWebhooks } = useMailWebhooksStore.getState();

      setWebhooks(walletAddress, [], 0, false);

      expect(getWebhooks(walletAddress)).toEqual([]);
    });

    it('should handle zero total with hasMore true', () => {
      const { setWebhooks, getCacheEntry } = useMailWebhooksStore.getState();

      setWebhooks(walletAddress, [], 0, true);

      const entry = getCacheEntry(walletAddress);
      expect(entry?.total).toBe(0);
      expect(entry?.hasMore).toBe(true);
    });

    it('should handle large webhook arrays', () => {
      const { setWebhooks, getWebhooks } = useMailWebhooksStore.getState();
      const manyWebhooks: IndexerWebhookData[] = Array.from(
        { length: 100 },
        (_, i) => ({
          ...mockWebhook1,
          id: `webhook-${i}`,
          webhookUrl: `https://example.com/webhook${i}`,
        })
      );

      setWebhooks(walletAddress, manyWebhooks, 100, false);

      const stored = getWebhooks(walletAddress);
      expect(stored).toHaveLength(100);
      expect(stored).toEqual(manyWebhooks);
    });
  });
});
