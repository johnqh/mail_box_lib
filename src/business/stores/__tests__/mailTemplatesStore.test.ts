/**
 * Tests for mailTemplatesStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useMailTemplatesStore } from '../mailTemplatesStore';
import type { IndexerTemplateData } from '@sudobility/mail_box_types';

describe('mailTemplatesStore', () => {
  const mockTemplate1: IndexerTemplateData = {
    id: 'template-1',
    userId: 'user-1',
    templateName: 'Welcome Email',
    subject: 'Welcome!',
    bodyContent: '<p>Welcome to our service!</p>',
    bodyText: 'Welcome to our service!',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockTemplate2: IndexerTemplateData = {
    id: 'template-2',
    userId: 'user-1',
    templateName: 'Newsletter',
    subject: 'Weekly Update',
    bodyContent: '<p>Here is your weekly update.</p>',
    bodyText: 'Here is your weekly update.',
    isActive: true,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  };

  const walletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7';
  const walletAddress2 = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    // Clear the store before each test
    useMailTemplatesStore.getState().clearAll();
  });

  describe('initialization', () => {
    it('should have empty cache on initialization', () => {
      const { cache } = useMailTemplatesStore.getState();
      expect(cache).toEqual({});
    });
  });

  describe('setTemplates', () => {
    it('should store templates for a wallet address', () => {
      const { setTemplates, getTemplates } = useMailTemplatesStore.getState();
      const templates = [mockTemplate1, mockTemplate2];

      setTemplates(walletAddress, templates, 2, false);

      const storedTemplates = getTemplates(walletAddress);
      expect(storedTemplates).toEqual(templates);
    });

    it('should normalize wallet address to lowercase', () => {
      const { setTemplates, getTemplates } = useMailTemplatesStore.getState();
      const mixedCaseAddress = '0x742D35CC6634C0532925A3B844BC9E7595F0BEB7';
      const templates = [mockTemplate1];

      setTemplates(mixedCaseAddress, templates, 1, false);

      // Should be retrievable with original case
      expect(getTemplates(mixedCaseAddress)).toEqual(templates);
      // Should be retrievable with lowercase
      expect(getTemplates(mixedCaseAddress.toLowerCase())).toEqual(templates);
    });

    it('should store total and hasMore flags', () => {
      const { setTemplates, getCacheEntry } = useMailTemplatesStore.getState();

      setTemplates(walletAddress, [mockTemplate1], 10, true);

      const entry = getCacheEntry(walletAddress);
      expect(entry?.total).toBe(10);
      expect(entry?.hasMore).toBe(true);
    });

    it('should store timestamp when templates are cached', () => {
      const { setTemplates, getCacheEntry } = useMailTemplatesStore.getState();
      const before = Date.now();

      setTemplates(walletAddress, [mockTemplate1], 1, false);

      const after = Date.now();
      const entry = getCacheEntry(walletAddress);
      expect(entry?.cachedAt).toBeGreaterThanOrEqual(before);
      expect(entry?.cachedAt).toBeLessThanOrEqual(after);
    });

    it('should update existing templates for a wallet', () => {
      const { setTemplates, getTemplates } = useMailTemplatesStore.getState();

      // Set initial templates
      setTemplates(walletAddress, [mockTemplate1], 1, false);
      expect(getTemplates(walletAddress)).toEqual([mockTemplate1]);

      // Update with new templates
      const newTemplates = [mockTemplate1, mockTemplate2];
      setTemplates(walletAddress, newTemplates, 2, false);
      expect(getTemplates(walletAddress)).toEqual(newTemplates);
    });

    it('should handle multiple wallet addresses independently', () => {
      const { setTemplates, getTemplates } = useMailTemplatesStore.getState();

      setTemplates(walletAddress, [mockTemplate1], 1, false);
      setTemplates(walletAddress2, [mockTemplate2], 1, false);

      expect(getTemplates(walletAddress)).toEqual([mockTemplate1]);
      expect(getTemplates(walletAddress2)).toEqual([mockTemplate2]);
    });
  });

  describe('getTemplates', () => {
    it('should return undefined for non-existent wallet', () => {
      const { getTemplates } = useMailTemplatesStore.getState();
      expect(getTemplates('0xNonExistent')).toBeUndefined();
    });

    it('should return templates for existing wallet', () => {
      const { setTemplates, getTemplates } = useMailTemplatesStore.getState();
      const templates = [mockTemplate1, mockTemplate2];

      setTemplates(walletAddress, templates, 2, false);
      expect(getTemplates(walletAddress)).toEqual(templates);
    });
  });

  describe('getCacheEntry', () => {
    it('should return undefined for non-existent wallet', () => {
      const { getCacheEntry } = useMailTemplatesStore.getState();
      expect(getCacheEntry('0xNonExistent')).toBeUndefined();
    });

    it('should return complete cache entry for existing wallet', () => {
      const { setTemplates, getCacheEntry } = useMailTemplatesStore.getState();
      const templates = [mockTemplate1];

      setTemplates(walletAddress, templates, 10, true);

      const entry = getCacheEntry(walletAddress);
      expect(entry).toBeDefined();
      expect(entry?.templates).toEqual(templates);
      expect(entry?.total).toBe(10);
      expect(entry?.hasMore).toBe(true);
      expect(entry?.cachedAt).toBeGreaterThan(0);
    });
  });

  describe('clearTemplates', () => {
    it('should clear templates for a specific wallet', () => {
      const { setTemplates, getTemplates, clearTemplates } =
        useMailTemplatesStore.getState();

      // Set templates for two wallets
      setTemplates(walletAddress, [mockTemplate1], 1, false);
      setTemplates(walletAddress2, [mockTemplate2], 1, false);

      // Clear templates for first wallet
      clearTemplates(walletAddress);

      expect(getTemplates(walletAddress)).toBeUndefined();
      expect(getTemplates(walletAddress2)).toEqual([mockTemplate2]);
    });

    it('should handle clearing non-existent wallet gracefully', () => {
      const { clearTemplates, cache } = useMailTemplatesStore.getState();

      expect(() => clearTemplates('0xNonExistent')).not.toThrow();
      expect(cache).toEqual({});
    });
  });

  describe('clearAll', () => {
    it('should clear all cached templates', () => {
      const { setTemplates, getTemplates, clearAll } =
        useMailTemplatesStore.getState();

      // Set templates for multiple wallets
      setTemplates(walletAddress, [mockTemplate1], 1, false);
      setTemplates(walletAddress2, [mockTemplate2], 1, false);

      // Clear all
      clearAll();

      expect(getTemplates(walletAddress)).toBeUndefined();
      expect(getTemplates(walletAddress2)).toBeUndefined();
    });

    it('should result in empty cache object', () => {
      const { setTemplates, clearAll } = useMailTemplatesStore.getState();

      setTemplates(walletAddress, [mockTemplate1], 1, false);

      const beforeCache = useMailTemplatesStore.getState().cache;
      expect(Object.keys(beforeCache)).toHaveLength(1);

      clearAll();

      const { cache: afterCache } = useMailTemplatesStore.getState();
      expect(afterCache).toEqual({});
    });
  });

  describe('edge cases', () => {
    it('should handle empty template array', () => {
      const { setTemplates, getTemplates } = useMailTemplatesStore.getState();

      setTemplates(walletAddress, [], 0, false);

      expect(getTemplates(walletAddress)).toEqual([]);
    });

    it('should handle large template arrays', () => {
      const { setTemplates, getTemplates } = useMailTemplatesStore.getState();
      const manyTemplates: IndexerTemplateData[] = Array.from(
        { length: 100 },
        (_, i) => ({
          ...mockTemplate1,
          id: `template-${i}`,
          templateName: `Template ${i}`,
        })
      );

      setTemplates(walletAddress, manyTemplates, 100, false);

      const stored = getTemplates(walletAddress);
      expect(stored).toHaveLength(100);
      expect(stored).toEqual(manyTemplates);
    });
  });
});
