/**
 * Tests for mailboxStore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useMailboxStore } from '../mailboxStore';

describe('mailboxStore', () => {
  const mockMailbox1 = {
    id: 'mailbox-1',
    name: 'INBOX',
    path: 'INBOX',
    specialUse: '\\Inbox' as const,
    modifyIndex: 100,
    subscribed: true,
    total: 42,
    unseen: 5,
  };

  const mockMailbox2 = {
    id: 'mailbox-2',
    name: 'Sent',
    path: 'Sent',
    specialUse: '\\Sent' as const,
    modifyIndex: 50,
    subscribed: true,
    total: 10,
    unseen: 0,
  };

  const mockMailbox3 = {
    id: 'mailbox-3',
    name: 'Trash',
    path: 'Trash',
    specialUse: '\\Trash' as const,
    modifyIndex: 30,
    subscribed: true,
    total: 3,
    unseen: 0,
  };

  const userId1 = 'user-abc-123';
  const userId2 = 'user-xyz-456';

  beforeEach(() => {
    // Clear the store before each test
    useMailboxStore.getState().clearAll();
  });

  describe('initialization', () => {
    it('should have empty cache on initialization', () => {
      const { cache } = useMailboxStore.getState();
      expect(cache).toEqual({});
    });
  });

  describe('setMailboxes', () => {
    it('should store mailboxes for a userId', () => {
      const { setMailboxes, getMailboxes } = useMailboxStore.getState();
      const mailboxes = [mockMailbox1, mockMailbox2];

      setMailboxes(userId1, mailboxes);

      const storedMailboxes = getMailboxes(userId1);
      expect(storedMailboxes).toEqual(mailboxes);
    });

    it('should store cachedAt timestamp', () => {
      const { setMailboxes } = useMailboxStore.getState();
      const before = Date.now();

      setMailboxes(userId1, [mockMailbox1]);

      const after = Date.now();
      const entry = useMailboxStore.getState().cache[userId1];
      expect(entry?.cachedAt).toBeGreaterThanOrEqual(before);
      expect(entry?.cachedAt).toBeLessThanOrEqual(after);
    });

    it('should update existing mailboxes for a userId', () => {
      const { setMailboxes, getMailboxes } = useMailboxStore.getState();

      // Set initial mailboxes
      setMailboxes(userId1, [mockMailbox1]);
      expect(getMailboxes(userId1)).toEqual([mockMailbox1]);

      // Update with new mailboxes
      const newMailboxes = [mockMailbox1, mockMailbox2, mockMailbox3];
      setMailboxes(userId1, newMailboxes);
      expect(getMailboxes(userId1)).toEqual(newMailboxes);
    });

    it('should handle multiple userIds independently', () => {
      const { setMailboxes, getMailboxes } = useMailboxStore.getState();

      setMailboxes(userId1, [mockMailbox1, mockMailbox2]);
      setMailboxes(userId2, [mockMailbox3]);

      expect(getMailboxes(userId1)).toEqual([mockMailbox1, mockMailbox2]);
      expect(getMailboxes(userId2)).toEqual([mockMailbox3]);
    });

    it('should handle empty mailbox array', () => {
      const { setMailboxes, getMailboxes } = useMailboxStore.getState();

      setMailboxes(userId1, []);

      expect(getMailboxes(userId1)).toEqual([]);
    });
  });

  describe('getMailboxes', () => {
    it('should return undefined for non-existent userId', () => {
      const { getMailboxes } = useMailboxStore.getState();
      expect(getMailboxes('non-existent-user')).toBeUndefined();
    });

    it('should return mailboxes for existing userId', () => {
      const { setMailboxes, getMailboxes } = useMailboxStore.getState();
      const mailboxes = [mockMailbox1, mockMailbox2];

      setMailboxes(userId1, mailboxes);
      expect(getMailboxes(userId1)).toEqual(mailboxes);
    });
  });

  describe('clearMailboxes', () => {
    it('should clear mailboxes for a specific userId', () => {
      const { setMailboxes, getMailboxes, clearMailboxes } =
        useMailboxStore.getState();

      // Set mailboxes for two users
      setMailboxes(userId1, [mockMailbox1]);
      setMailboxes(userId2, [mockMailbox2]);

      // Clear mailboxes for first user
      clearMailboxes(userId1);

      expect(getMailboxes(userId1)).toBeUndefined();
      expect(getMailboxes(userId2)).toEqual([mockMailbox2]);
    });

    it('should handle clearing non-existent userId gracefully', () => {
      const { clearMailboxes } = useMailboxStore.getState();

      expect(() => clearMailboxes('non-existent-user')).not.toThrow();
      expect(useMailboxStore.getState().cache).toEqual({});
    });
  });

  describe('clearAll', () => {
    it('should clear all cached mailboxes', () => {
      const { setMailboxes, getMailboxes, clearAll } =
        useMailboxStore.getState();

      // Set mailboxes for multiple users
      setMailboxes(userId1, [mockMailbox1]);
      setMailboxes(userId2, [mockMailbox2]);

      // Clear all
      clearAll();

      expect(getMailboxes(userId1)).toBeUndefined();
      expect(getMailboxes(userId2)).toBeUndefined();
    });

    it('should result in empty cache object', () => {
      const { setMailboxes, clearAll } = useMailboxStore.getState();

      setMailboxes(userId1, [mockMailbox1]);
      setMailboxes(userId2, [mockMailbox2]);

      // Verify cache has entries
      const beforeCache = useMailboxStore.getState().cache;
      expect(Object.keys(beforeCache)).toHaveLength(2);

      clearAll();

      const { cache: afterCache } = useMailboxStore.getState();
      expect(afterCache).toEqual({});
    });
  });

  describe('edge cases', () => {
    it('should handle large mailbox arrays', () => {
      const { setMailboxes, getMailboxes } = useMailboxStore.getState();
      const manyMailboxes = Array.from({ length: 50 }, (_, i) => ({
        ...mockMailbox1,
        id: `mailbox-${i}`,
        name: `Mailbox ${i}`,
        path: `Mailbox${i}`,
      }));

      setMailboxes(userId1, manyMailboxes);

      const stored = getMailboxes(userId1);
      expect(stored).toHaveLength(50);
      expect(stored).toEqual(manyMailboxes);
    });

    it('should update cachedAt timestamp on re-set', () => {
      const { setMailboxes } = useMailboxStore.getState();

      setMailboxes(userId1, [mockMailbox1]);
      const firstCachedAt = useMailboxStore.getState().cache[userId1]?.cachedAt;

      // Wait a small amount to ensure timestamp difference
      const now = Date.now();
      while (Date.now() === now) {
        // spin until timestamp changes
      }

      setMailboxes(userId1, [mockMailbox2]);
      const secondCachedAt = useMailboxStore.getState().cache[userId1]?.cachedAt;

      expect(secondCachedAt).toBeGreaterThanOrEqual(firstCachedAt!);
    });
  });
});
